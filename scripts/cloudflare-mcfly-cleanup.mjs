#!/usr/bin/env node
/**
 * Mcfly Cloudflare free-tier cleanup
 *
 * Keeps: zone mcflyads.com (DNS)
 * Deletes: Workers scripts, Pages projects, Worker routes,
 *          unused KV / D1 / R2 (account-wide) unless --dry-run
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=... node scripts/cloudflare-mcfly-cleanup.mjs [--dry-run] [--execute]
 *
 * Default is dry-run (list only). Pass --execute to delete.
 */
import { execSync } from "node:child_process";

const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
const execute = process.argv.includes("--execute");
const dryRun = !execute;

if (!token) {
  console.error("Missing CLOUDFLARE_API_TOKEN");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

async function cf(path, init = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
  });
  const body = await res.json();
  if (!body.success) {
    const err = (body.errors || []).map((e) => e.message).join("; ") || res.statusText;
    throw new Error(`${path}: ${err}`);
  }
  return body.result;
}

function log(action, detail) {
  console.log(`${dryRun ? "[dry-run] " : "[do] "}${action}: ${detail}`);
}

async function main() {
  const tokenStatus = await cf("/user/tokens/verify");
  console.log("Token OK:", tokenStatus?.status || "active");

  const accounts = await cf("/accounts");
  console.log(
    "Accounts:",
    accounts.map((a) => `${a.name} (${a.id})`).join(", "),
  );

  for (const account of accounts) {
    const aid = account.id;
    console.log(`\n=== Account ${account.name} ===`);

    // Workers
    let page = 1;
    const workers = [];
    for (;;) {
      const batch = await cf(`/accounts/${aid}/workers/scripts?page=${page}&per_page=50`);
      const list = Array.isArray(batch) ? batch : batch || [];
      // API returns array in result
      const items = Array.isArray(batch) ? batch : [];
      if (!items.length) break;
      workers.push(...items);
      if (items.length < 50) break;
      page += 1;
    }
    // Some accounts return result as array directly from cf()
    const scripts = await cf(`/accounts/${aid}/workers/scripts`);
    const scriptList = Array.isArray(scripts) ? scripts : [];
    for (const s of scriptList) {
      const name = s.id || s.name;
      log("DELETE worker", name);
      if (!dryRun) {
        await cf(`/accounts/${aid}/workers/scripts/${encodeURIComponent(name)}`, {
          method: "DELETE",
        });
      }
    }

    // Pages projects
    const pages = await cf(`/accounts/${aid}/pages/projects`);
    const pageList = Array.isArray(pages) ? pages : [];
    for (const p of pageList) {
      log("DELETE pages project", p.name);
      if (!dryRun) {
        await cf(`/accounts/${aid}/pages/projects/${encodeURIComponent(p.name)}`, {
          method: "DELETE",
        });
      }
    }

    // KV namespaces
    const kv = await cf(`/accounts/${aid}/storage/kv/namespaces`);
    const kvList = Array.isArray(kv) ? kv : [];
    for (const ns of kvList) {
      log("DELETE KV", `${ns.title} (${ns.id})`);
      if (!dryRun) {
        await cf(`/accounts/${aid}/storage/kv/namespaces/${ns.id}`, { method: "DELETE" });
      }
    }

    // D1
    try {
      const d1 = await cf(`/accounts/${aid}/d1/database`);
      const d1List = Array.isArray(d1) ? d1 : [];
      for (const db of d1List) {
        log("DELETE D1", `${db.name} (${db.uuid})`);
        if (!dryRun) {
          await cf(`/accounts/${aid}/d1/database/${db.uuid}`, { method: "DELETE" });
        }
      }
    } catch (e) {
      console.log("(D1 list skipped)", e.message);
    }

    // R2 buckets
    try {
      const r2 = await cf(`/accounts/${aid}/r2/buckets`);
      const buckets = r2?.buckets || (Array.isArray(r2) ? r2 : []);
      for (const b of buckets) {
        const name = b.name;
        log("DELETE R2 bucket", name);
        if (!dryRun) {
          await cf(`/accounts/${aid}/r2/buckets/${encodeURIComponent(name)}`, {
            method: "DELETE",
          });
        }
      }
    } catch (e) {
      console.log("(R2 list skipped)", e.message);
    }
  }

  // Zones — keep mcflyads.com, clear worker routes on it
  const zones = await cf("/zones");
  const zoneList = Array.isArray(zones) ? zones : [];
  console.log("\n=== Zones ===");
  for (const z of zoneList) {
    console.log(`Zone: ${z.name} (${z.id}) status=${z.status}`);
    if (z.name === "mcflyads.com") {
      log("KEEP zone", "mcflyads.com — free DNS for Mcfly");
      try {
        const routes = await cf(`/zones/${z.id}/workers/routes`);
        const routeList = Array.isArray(routes) ? routes : [];
        for (const r of routeList) {
          log("DELETE worker route", `${r.pattern} (${r.id})`);
          if (!dryRun) {
            await cf(`/zones/${z.id}/workers/routes/${r.id}`, { method: "DELETE" });
          }
        }
      } catch (e) {
        console.log("(routes skipped)", e.message);
      }
    } else {
      log("NOTE other zone", `${z.name} — not deleted (DNS ownership). Remove in dashboard if unused.`);
    }
  }

  console.log(
    dryRun
      ? "\nDry-run complete. Re-run with --execute to delete listed resources."
      : "\nCleanup complete. Keep mcflyads.com on free DNS; host marketing site on GitHub Pages.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
