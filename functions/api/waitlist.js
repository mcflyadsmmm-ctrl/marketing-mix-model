/**
 * POST /api/waitlist — support / install-help capture (Cloudflare Pages Function).
 * Path on disk: functions/api/waitlist.js (sibling of site/ for Pages deploy).
 *
 * Delivery (honest, in order):
 * 1. RESEND_API_KEY secret → email invites@ + interim inbox via Resend
 * 2. Else FormSubmit.co → interim inbox (mcflyadsmmm@gmail.com) — first use needs
 *    one confirmation click in that inbox (FormSubmit activation)
 * 3. Always persist to WAITLIST KV when the binding exists (durable backlog)
 *
 * Response never claims “you're on the list” without saying what actually happened.
 * Public target address (DNS pending H5): invites@mcflyads.com
 * Interim working inbox: mcflyadsmmm@gmail.com
 */
const INVITES_EMAIL = "invites@mcflyads.com";
const INTERIM_INBOX = "mcflyadsmmm@gmail.com";
const FORMSUBMIT_URL = "https://formsubmit.co/ajax/" + INTERIM_INBOX;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Max-Age": "86400",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...CORS,
    },
  });
}

function clean(value, max) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, max);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function isCustomAnalytics(source) {
  return /custom-analytics/i.test(String(source || ""));
}

function buildMessage(fields) {
  const custom = isCustomAnalytics(fields.source);
  const lines = [
    custom
      ? "Mcfly Analytics — custom data science inquiry"
      : "Mcfly Ads — install / support request",
    "",
    "Name: " + fields.name,
    "Email: " + fields.email,
    "Role / context: " + (fields.role || "(not specified)"),
    (custom ? "Company / website: " : "Site / store: ") +
      (fields.store || "(not specified — exploring)"),
    "Source: " + (fields.source || "mcflyads.com support"),
  ];
  if (fields.budget) {
    lines.push("Budget band: " + fields.budget);
  }
  if (fields.notes) {
    lines.push("", custom ? "Project brief:" : "Notes / calculator snapshot:", fields.notes);
  }
  lines.push(
    "",
    custom
      ? "Request: custom analytics / MDS proposal ($5–25K band)."
      : "Request: install help / support.",
    "Public target: " + INVITES_EMAIL,
    "Interim inbox: " + INTERIM_INBOX,
  );
  return lines.join("\n");
}

async function parseBody(request) {
  const type = (request.headers.get("content-type") || "").toLowerCase();
  if (type.includes("application/json")) {
    const data = await request.json();
    return data && typeof data === "object" ? data : {};
  }
  if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
    const form = await request.formData();
    const data = {};
    form.forEach((value, key) => {
      if (typeof value === "string") data[key] = value;
    });
    return data;
  }
  try {
    const data = await request.json();
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

async function sendResend(env, fields, message, subjectPrefix) {
  const key = env.RESEND_API_KEY;
  if (!key) return { ok: false, reason: "no_resend_key" };
  const from = env.RESEND_FROM || "Mcfly Waitlist <onboarding@resend.dev>";
  const to = [INTERIM_INBOX];
  const prefix = subjectPrefix || "Mcfly early access — ";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: fields.email,
      subject: prefix + fields.name,
      text: message,
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return { ok: false, reason: "resend_http_" + res.status, detail: errText.slice(0, 200) };
  }
  return { ok: true, channel: "resend" };
}

async function sendFormSubmit(fields, message, subjectPrefix) {
  const prefix = subjectPrefix || "Mcfly early access — ";
  const res = await fetch(FORMSUBMIT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: fields.name,
      email: fields.email,
      role: fields.role || "",
      store: fields.store || "",
      budget: fields.budget || "",
      source: fields.source || "mcflyads.com waitlist",
      _subject: prefix + fields.name,
      message,
      _template: "table",
      _replyto: fields.email,
    }),
  });
  const text = await res.text().catch(() => "");
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }
  if (!res.ok) {
    return {
      ok: false,
      reason: "formsubmit_http_" + res.status,
      detail: (parsed && (parsed.message || parsed.error)) || text.slice(0, 200),
    };
  }
  // FormSubmit returns success even when inbox still needs activation — surface message.
  const success = !(parsed && parsed.success === false);
  return {
    ok: success,
    channel: "formsubmit",
    detail: parsed && (parsed.message || parsed.success),
  };
}

async function storeKv(env, record) {
  const kv = env.WAITLIST;
  if (!kv || typeof kv.put !== "function") {
    return { ok: false, reason: "no_kv_binding" };
  }
  const id =
    "wl_" +
    new Date().toISOString().replace(/[:.]/g, "-") +
    "_" +
    Math.random().toString(36).slice(2, 8);
  await kv.put(id, JSON.stringify(record), {
    // Align with privacy retention: waitlist contacts ≤ 180 days unless deleted earlier.
    expirationTtl: 180 * 24 * 60 * 60,
    metadata: { email: record.email, createdAt: record.createdAt },
  });
  return { ok: true, id };
}

async function handlePost(context) {
  const { request, env } = context;
  let raw;
  try {
    raw = await parseBody(request);
  } catch {
    return json({ ok: false, error: "Could not read request body." }, 400);
  }

  // Honeypot — bots fill hidden "company"
  if (clean(raw.company, 80)) {
    return json({
      ok: true,
      delivery: "ignored",
      emailed: false,
      stored: false,
      message: "Ignored.",
    });
  }

  const name = clean(raw.name, 120);
  const email = clean(raw.email, 254).toLowerCase();
  const role = clean(raw.role, 120);
  const store = clean(raw.store, 200);
  const source = clean(raw.source, 80) || "mcflyads.com waitlist";
  const notes = clean(raw.notes, 1200);
  const budget = clean(raw.budget, 80);
  const custom = isCustomAnalytics(source);

  if (!email || !isEmail(email)) {
    return json({ ok: false, error: "A valid email is required." }, 400);
  }
  if (!name) {
    return json({ ok: false, error: "Name is required." }, 400);
  }

  const fields = { name, email, role, store, source, notes, budget };
  const message = buildMessage(fields);
  const createdAt = new Date().toISOString();
  const subjectPrefix = custom
    ? "Custom analytics inquiry — "
    : "Mcfly early access — ";

  const stored = await storeKv(env, {
    ...fields,
    message,
    createdAt,
    invites: INVITES_EMAIL,
    interimInbox: INTERIM_INBOX,
  }).catch((err) => ({ ok: false, reason: "kv_error", detail: String(err && err.message) }));

  let emailResult = await sendResend(env, fields, message, subjectPrefix).catch((err) => ({
    ok: false,
    reason: "resend_error",
    detail: String(err && err.message),
  }));

  if (!emailResult.ok && emailResult.reason === "no_resend_key") {
    emailResult = await sendFormSubmit(fields, message, subjectPrefix).catch((err) => ({
      ok: false,
      reason: "formsubmit_error",
      detail: String(err && err.message),
    }));
  }

  const emailed = !!emailResult.ok;
  const persisted = !!stored.ok;

  if (!emailed && !persisted) {
    return json(
      {
        ok: false,
        delivery: "failed",
        emailed: false,
        stored: false,
        invites: INVITES_EMAIL,
        interimInbox: INTERIM_INBOX,
    subject: subjectPrefix + name,
    message,
    error:
      "Server could not email or store this request. Copy the message below and send it yourself.",
        emailDetail: emailResult.reason || emailResult.detail || null,
        storeDetail: stored.reason || null,
      },
      502,
    );
  }

  let delivery = "stored";
  let statusMessage =
    "Request saved on our side. Email notify did not confirm — you are not claimed as “on the list” until we reply from the inbox.";
  if (emailed && persisted) {
    delivery = "emailed_and_stored";
    statusMessage =
      "Message received — emailed to our interim inbox and saved. We will reply from invites@ (or the interim inbox until domain mail is live).";
  } else if (emailed) {
    delivery = "emailed";
    statusMessage =
      "Message received — emailed to our interim inbox. We will reply from invites@ (or the interim inbox until domain mail is live).";
  }

  return json({
    ok: true,
    delivery,
    emailed,
    stored: persisted,
    storeId: stored.id || null,
    invites: INVITES_EMAIL,
    interimInbox: INTERIM_INBOX,
    subject: subjectPrefix + name,
    message,
    statusMessage,
    emailChannel: emailResult.channel || null,
    emailDetail: emailed ? emailResult.detail || null : emailResult.reason || emailResult.detail || null,
  });
}

/** Single entry — avoids method-export edge cases with Pages + _redirects splat. */
export async function onRequest(context) {
  const method = (context.request.method || "GET").toUpperCase();
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (method === "GET" || method === "HEAD") {
    const body = json({
      ok: true,
      endpoint: "/api/waitlist",
      method: "POST",
      invites: INVITES_EMAIL,
      interimInbox: INTERIM_INBOX,
      honesty:
        "POST stores the request (KV when bound) and best-effort emails the interim inbox. Confirmation UI must report actual delivery.",
    });
    if (method === "HEAD") {
      return new Response(null, { status: 200, headers: body.headers });
    }
    return body;
  }
  if (method === "POST") {
    return handlePost(context);
  }
  return json({ ok: false, error: "Method not allowed. Use POST." }, 405);
}
