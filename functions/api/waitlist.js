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

const PACKAGES = {
  audit: { name: "Spend & Sales Audit", band: "$5–8K", weeks: "2–3 weeks" },
  leadgen: { name: "Lead Gen reporting", band: "$8–15K", weeks: "3–6 weeks" },
  mds: { name: "Advanced MDS", band: "$15–25K", weeks: "6–10 weeks" },
};

function packageMeta(key) {
  return PACKAGES[key] || null;
}

function spreadsheetClosesMonday(value) {
  return /^yes/i.test(String(value || ""));
}

function buildEstimateReply(fields) {
  const pkg = packageMeta(fields.package);
  const packageName = (pkg && pkg.name) || "Custom Data Solutions";
  const subject = "Estimate — Mcfly " + packageName;
  const notFit = spreadsheetClosesMonday(fields.spreadsheet_closes);
  const text = notFit
    ? [
        fields.name + " — got the form. A spreadsheet already closes this. We stop here.",
        "",
        "Marty · " + INTERIM_INBOX,
      ].join("\n")
    : [
        fields.name +
          " — got the form. Based on what you wrote this looks like " +
          packageName +
          ", about " +
          ((pkg && pkg.band) || "$5–25K") +
          ", " +
          ((pkg && pkg.weeks) || "scoped weeks") +
          ". You keep the desk.",
        "Reply YES if you want the invoice and a 20-min setup. Reply with a better time if the slot we offer doesn’t work. If a spreadsheet already closes this, we stop here.",
        "Marty · " + INTERIM_INBOX,
      ].join("\n");
  return { subject, text, notFit, packageName, pkg };
}

function buildMessage(fields) {
  const custom = isCustomAnalytics(fields.source);
  const pkg = packageMeta(fields.package);
  const lines = [
    custom
      ? "Mcfly Analytics — custom data science proposal"
      : "Mcfly Ads — install / support request",
    "",
    "Name: " + fields.name,
    "Email: " + fields.email,
    "Role / context: " + (fields.role || "(not specified)"),
    (custom ? "Company: " : "Site / store: ") +
      (fields.company || fields.store || "(not specified — exploring)"),
    "Source: " + (fields.source || "mcflyads.com support"),
  ];
  if (pkg) {
    lines.push("Package: " + pkg.name + " · " + pkg.band + " · " + pkg.weeks);
  }
  if (fields.budget) {
    lines.push("Budget band: " + fields.budget);
  }
  if (fields.spend) {
    lines.push("Monthly paid media spend: " + fields.spend);
  }
  if (fields.timeline) {
    lines.push("Target start: " + fields.timeline);
  }
  if (fields.first_look) lines.push("First-look date: " + fields.first_look);
  if (fields.signer_reject) {
    lines.push("Who signs / reject: " + fields.signer_reject);
  }
  if (fields.monday_produce) {
    lines.push("Monday must produce: " + fields.monday_produce);
  }
  if (fields.two_systems) {
    lines.push("Two systems / last numbers: " + fields.two_systems);
  }
  if (fields.entities) lines.push("First desk entities: " + fields.entities);
  if (fields.spreadsheet_closes) {
    lines.push("Spreadsheet already closes Monday: " + fields.spreadsheet_closes);
  }
  if (fields.pay_later) {
    lines.push("Pay later (no charge on this form): " + fields.pay_later);
  }
  if (fields.package === "audit") {
    lines.push(
      "",
      "— Spend & Sales Audit —",
      "Sales source: " + (fields.sales_source || "(not specified)"),
      "Platforms / invoices: " + (fields.platforms_invoices || "(not specified)"),
      "Period: " + (fields.period_start || "?") + " → " + (fields.period_end || "?"),
      "Contribution margin: " + (fields.contribution_margin || "(not specified)"),
      "Current close process: " + (fields.close_process || "(not specified)"),
      "Out of scope confirm: " + (fields.out_scope_audit || "(not confirmed)"),
    );
  } else if (fields.package === "leadgen") {
    lines.push(
      "",
      "— Lead Gen reporting —",
      "CRM + stage contract: " + (fields.crm_stages || "(not specified)"),
      "Qualified means: " + (fields.qualified_def || "(not specified)"),
      "Channels / spend / raw leads: " + (fields.channels_leads || "(not specified)"),
      "Target CPQL: " + (fields.target_cpql || "(not specified)"),
      "Out of scope confirm: " + (fields.out_scope_lead || "(not confirmed)"),
    );
  } else if (fields.package === "mds") {
    lines.push(
      "",
      "— Advanced MDS —",
      "Source of truth today: " + (fields.source_of_truth || "(not specified)"),
      "Outcome: " + (fields.outcome_type || "(not specified)"),
      "Entities v1 vs later: " + (fields.entities_v1 || "(not specified)"),
      "Desk owner after handoff: " + (fields.desk_owner || "(not specified)"),
      "Out of scope confirm: " + (fields.out_scope_mds || "(not confirmed)"),
    );
  }
  if (fields.notes) {
    lines.push("", custom ? "Project brief:" : "Notes / calculator snapshot:", fields.notes);
  }
  if (fields.nda) {
    lines.push("", "NDA: " + fields.nda);
  }
  const estimate = custom ? buildEstimateReply(fields) : null;
  if (estimate) {
    lines.push(
      "",
      estimate.notFit
        ? "Estimate: not a fit — spreadsheet already closes Monday."
        : "Estimate (not a contract): " +
            estimate.packageName +
            " · " +
            (estimate.pkg && estimate.pkg.band) +
            " · " +
            (estimate.pkg && estimate.pkg.weeks),
    );
  }
  lines.push(
    "",
    custom
      ? "Request: custom analytics / MDS proposal ($5–25K band). No charge on this form."
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

async function sendEstimateAutoReply(env, fields, reply) {
  const key = env.RESEND_API_KEY;
  if (!key || !fields.email || !reply) return { ok: false, reason: "no_autoresponse" };
  const from = env.RESEND_FROM || "Mcfly Waitlist <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [fields.email],
      reply_to: INTERIM_INBOX,
      subject: reply.subject,
      text: reply.text,
    }),
  });
  if (!res.ok) {
    return { ok: false, reason: "autoresponse_http_" + res.status };
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
      store: fields.store || fields.company || "",
      company: fields.company || "",
      budget: fields.budget || "",
      spend: fields.spend || "",
      timeline: fields.timeline || "",
      source: fields.source || "mcflyads.com waitlist",
      _subject: prefix + fields.name,
      message,
      _template: "table",
      _replyto: fields.email,
      _autoresponse: fields.autoReplyText || "",
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

  const source = clean(raw.source, 80) || "mcflyads.com waitlist";
  const custom = isCustomAnalytics(source);
  const incoming = raw.proposal && typeof raw.proposal === "object" ? raw.proposal : raw;

  // Honeypot: hidden "website". Legacy calculator forms still send honeypot "company".
  if (clean(raw.website, 80) || (!custom && clean(raw.company, 80))) {
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
  const role = clean(raw.role || incoming.role, 120);
  const company = custom ? clean(raw.company || incoming.company, 200) : "";
  const store = clean(raw.store || incoming.store, 200) || company;
  const notes = clean(raw.notes, custom ? 8000 : 1200);
  const pkgKey = clean(raw.package || incoming.package, 20);
  const pkg = packageMeta(pkgKey);
  const budget =
    clean(raw.budget, 80) ||
    (pkg ? pkg.band : "");
  const spend = clean(raw.spend || incoming.spend, 80);
  const timeline = clean(raw.timeline || incoming.timeline || incoming.first_look, 80);

  if (!email || !isEmail(email)) {
    return json({ ok: false, error: "A valid email is required." }, 400);
  }
  if (!name) {
    return json({ ok: false, error: "Name is required." }, 400);
  }
  if (custom && !company) {
    return json({ ok: false, error: "Company is required." }, 400);
  }

  const take = function (key, max) {
    return clean(incoming[key] || raw[key], max);
  };

  const fields = {
    name,
    email,
    role,
    company,
    store,
    source,
    notes,
    budget,
    spend,
    timeline,
    package: pkgKey,
    first_look: take("first_look", 40),
    signer_reject: take("signer_reject", 400),
    monday_produce: take("monday_produce", 80),
    two_systems: take("two_systems", 400),
    entities: take("entities", 240),
    spreadsheet_closes: take("spreadsheet_closes", 80),
    pay_later: take("pay_later", 40),
    sales_source: take("sales_source", 80),
    platforms_invoices: take("platforms_invoices", 400),
    period_start: take("period_start", 40),
    period_end: take("period_end", 40),
    contribution_margin: take("contribution_margin", 40),
    close_process: take("close_process", 240),
    out_scope_audit: take("out_scope_audit", 160),
    crm_stages: take("crm_stages", 240),
    qualified_def: take("qualified_def", 240),
    channels_leads: take("channels_leads", 400),
    target_cpql: take("target_cpql", 40),
    out_scope_lead: take("out_scope_lead", 160),
    source_of_truth: take("source_of_truth", 80),
    outcome_type: take("outcome_type", 40),
    entities_v1: take("entities_v1", 240),
    desk_owner: take("desk_owner", 120),
    out_scope_mds: take("out_scope_mds", 200),
    nda: take("nda", 120),
  };
  const estimate = custom ? buildEstimateReply(fields) : null;
  if (estimate) fields.autoReplyText = estimate.text;
  const message = buildMessage(fields);
  const createdAt = new Date().toISOString();
  const subjectPrefix = custom
    ? "Custom analytics proposal — "
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
  let autoReply = { ok: false, reason: "skipped" };
  if (custom && estimate && (emailed || persisted)) {
    autoReply = await sendEstimateAutoReply(env, fields, estimate).catch((err) => ({
      ok: false,
      reason: "autoresponse_error",
      detail: String(err && err.message),
    }));
  }

  const estimatePayload = estimate
    ? {
        notFit: estimate.notFit,
        subject: estimate.subject,
        text: estimate.text,
        packageName: estimate.packageName,
        band: (estimate.pkg && estimate.pkg.band) || "",
        weeks: (estimate.pkg && estimate.pkg.weeks) || "",
        autoReplied: !!autoReply.ok,
      }
    : null;

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
        estimate: estimatePayload,
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
    estimate: estimatePayload,
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
