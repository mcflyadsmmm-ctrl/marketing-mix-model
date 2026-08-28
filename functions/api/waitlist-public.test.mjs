import { onRequest } from "./waitlist.js";

function ctx(method, body) {
  const init = { method, headers: { Accept: "application/json" } };
  if (body) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  return {
    request: new Request("https://mcflyads.com/api/waitlist", init),
    env: {},
  };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function leaked(obj) {
  const raw = JSON.stringify(obj);
  return (
    Object.prototype.hasOwnProperty.call(obj, "invites") ||
    Object.prototype.hasOwnProperty.call(obj, "interimInbox") ||
    Object.prototype.hasOwnProperty.call(obj, "email") ||
    /mcflyadsmmm@gmail\.com/i.test(raw) ||
    /invites@mcflyads\.com/i.test(raw)
  );
}

const get = await onRequest(ctx("GET"));
assert(get.status === 405, "GET should be 405, got " + get.status);
assert(!get.headers.get("access-control-allow-origin"), "GET must not send ACAO *");
const getBody = await get.json();
assert(!leaked(getBody), "GET body leaked inbox/email fields: " + JSON.stringify(getBody));

const head = await onRequest(ctx("HEAD"));
assert(head.status === 405, "HEAD should be 405, got " + head.status);

const shop = await onRequest(
  ctx("POST", {
    name: "Ada",
    email: "ada@example.com",
    company: "shop.myshopify.com",
    source: "custom-analytics inquiry",
    website: "",
  }),
);
assert(shop.status === 400, "Shopify leak should 400, got " + shop.status);
const shopBody = await shop.json();
assert(!leaked(shopBody), "400 body leaked inbox: " + JSON.stringify(shopBody));

const fail = await onRequest(
  ctx("POST", {
    name: "Ada",
    email: "ada@example.com",
    company: "Acme",
    source: "custom-analytics inquiry",
    website: "",
    package: "audit",
    budget: "$5–8K",
  }),
);
assert(fail.status === 502, "No KV/Resend should 502, got " + fail.status);
const failBody = await fail.json();
assert(!leaked(failBody), "502 body leaked inbox: " + JSON.stringify(failBody));
assert(!fail.headers.get("access-control-allow-origin"), "POST must not send ACAO *");

const pot = await onRequest(
  ctx("POST", {
    name: "Bot",
    email: "bot@example.com",
    website: "http://spam.test",
    source: "custom-analytics inquiry",
  }),
);
assert(pot.status === 200, "Honeypot should 200 ignore, got " + pot.status);
const potBody = await pot.json();
assert(!leaked(potBody), "Honeypot body leaked inbox: " + JSON.stringify(potBody));

const options = await onRequest(ctx("OPTIONS"));
assert(options.status === 204, "OPTIONS should be 204, got " + options.status);
assert(!options.headers.get("access-control-allow-origin"), "OPTIONS must not send ACAO *");

const records = [];
const stored = await onRequest({
  request: new Request("https://mcflyads.com/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      name: "Ada",
      email: "ada@example.com",
      company: "Acme",
      source: "custom-analytics inquiry",
      website: "",
      package: "audit",
      budget: "$5–8K",
    }),
  }),
  env: {
    WAITLIST: {
      put: async function (_id, value) {
        records.push(JSON.parse(value));
      },
    },
  },
});
assert(stored.status === 200, "KV-only POST should 200, got " + stored.status);
const storedBody = await stored.json();
assert(!leaked(storedBody), "KV POST public body leaked inbox: " + JSON.stringify(storedBody));
assert(records.length === 1, "KV put should run once");
assert(records[0].invites === "invites@mcflyads.com", "KV record must still store invites");
assert(records[0].interimInbox === "mcflyadsmmm@gmail.com", "KV record must still store interimInbox");
assert(records[0].company === "Acme", "KV company field should persist");
assert(records[0].budget === "$5–8K", "KV budget field should persist");

console.log("waitlist public surface: ok");
