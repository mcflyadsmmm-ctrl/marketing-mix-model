/**
 * Honor Cloudflare Pages `site/_redirects` on the Fly static site.
 * Pages already 301s parked Custom / Northline landers. express.static does not.
 *
 * Never apply a rule whose source is a Shopify app path (`/app`, `/demo`,
 * `/auth`, …). Pages maps `/app` → `/product`; that would brick Admin.
 */

import { isShopifyAppPath } from "./shopify-app-path.mjs";

function normalizePath(pathname) {
  const raw = String(pathname ?? "").split("?")[0] || "/";
  let trimmed = raw.replace(/\/+$/, "");
  // Pages pretty-URLs 308 /lab.html → /lab before _redirects. Fly express.static
  // serves the file, so strip the suffix so parked rules still 301.
  if (/\.html$/i.test(trimmed)) {
    trimmed = trimmed.slice(0, -5);
  }
  return trimmed === "" ? "/" : trimmed;
}

/**
 * @param {string} text
 * @returns {Array<{ from: string, to: string, code: number }>}
 */
export function parseSiteRedirects(text) {
  const rules = [];
  for (const raw of String(text ?? "").split(/\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("/*") || line.startsWith("* ")) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 3) continue;
    const [from, to, status] = parts;
    const code = Number(status);
    if (code !== 301 && code !== 302) continue;
    if (!from.startsWith("/") || !to.startsWith("/")) continue;
    if (isShopifyAppPath(from)) continue;
    rules.push({ from: normalizePath(from), to, code });
  }
  return rules;
}

/**
 * @param {string} pathname
 * @param {Array<{ from: string, to: string, code: number }>} rules
 */
export function matchSiteRedirect(pathname, rules) {
  const path = normalizePath(pathname);
  for (const rule of rules) {
    if (rule.from === path) return rule;
  }
  return null;
}
