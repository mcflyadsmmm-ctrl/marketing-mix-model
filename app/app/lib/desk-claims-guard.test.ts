import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const appSrc = join(repoRoot, "app/app");

/**
 * Guards the locked product claims against drift back into the desk.
 *
 * LOCKED: Sample data | Live data are the only desk views. One paid plan —
 * 7-day trial then $39/store/mo. Unpaid order rows stop at 90 closed days.
 * Paid is up to 24 months. No feature gate. No pixels, no MTA, no "true ROAS",
 * no waitlist. Do not sell a finished year on the unpaid book.
 *
 * Scope is the merchant-facing app only (app/app). Marketing lives in site/
 * and is covered by marketing-product-match.test.ts.
 */
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full, out);
      continue;
    }
    if (/\.(ts|tsx|css)$/.test(name) && !/\.test\.tsx?$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

const sourceFiles = walk(appSrc).map((path) => ({
  path: relative(repoRoot, path),
  text: readFileSync(path, "utf8"),
}));

/** Files containing the word at all. Use for words the app must never say. */
function banned(pattern: RegExp): string[] {
  return sourceFiles
    .filter((file) => pattern.test(file.text))
    .map((file) => file.path);
}

/**
 * Refusing a thing is not claiming it. "No pixels, no attribution" and "Not
 * platform ROAS" are the product's position and must stay. Use this for words
 * that may appear only inside a refusal — a line that offers the thing fails.
 */
const REFUSAL = /\b(no|not|never|without|refus\w*|ban\w*|excludes?|out of)\b/i;

function claimed(pattern: RegExp): string[] {
  return sourceFiles
    .filter((file) =>
      file.text
        .split("\n")
        .some((line) => pattern.test(line) && !REFUSAL.test(line)),
    )
    .map((file) => file.path);
}

describe("desk never claims what the routes do not do", () => {
  it("has no Practice desk view anywhere in the app", () => {
    expect(banned(/practice/i)).toEqual([]);
  });

  it("mentions pixels / MTA only to refuse them", () => {
    expect(claimed(/\bpixels?\b/i)).toEqual([]);
    expect(claimed(/\bmulti-touch\b/i)).toEqual([]);
    expect(claimed(/\bview-through\b/i)).toEqual([]);
    expect(banned(/write_pixels/)).toEqual([]);
  });

  it("mentions true ROAS only to refuse it", () => {
    expect(claimed(/true ROAS/i)).toEqual([]);
  });

  it("has no waitlist — the app installs from the App Store", () => {
    expect(banned(/waitlist/i)).toEqual([]);
  });

  it("does not claim the whole desk is only the last 90 days", () => {
    // Unpaid order rows are 90 closed days. Paid is 24 months. Sales day
    // totals can be longer. A blanket "only 90 days of history" is the lie.
    expect(claimed(/only the last 90 days/i)).toEqual([]);
    expect(claimed(/90[\s-]day (cap|limit|history)/i)).toEqual([]);
  });

  it("gates no feature behind a plan", () => {
    // A live "pro_required" code or Pro-only copy means a gate came back.
    expect(banned(/pro_required/)).toEqual([]);
    expect(banned(/Upgrade to Pro/i)).toEqual([]);
    expect(banned(/\bPro only\b/i)).toEqual([]);
    expect(banned(/Free plan/i)).toEqual([]);
    expect(banned(/Free vs Pro/i)).toEqual([]);
    expect(banned(/Install free/i)).toEqual([]);
  });

  /*
   * The first pass of this guard missed the Fly landing page, which sold
   * "Free = every platform ... Pro $39 for LTV + Goals" in its meta
   * description. Ban the shape of a two-tier pitch, not just its stock phrases.
   */
  it("never pitches one tier against another", () => {
    // "Free ... Pro $39", "Pro adds X at $39", "paid plan = LTV" and friends.
    expect(banned(/\bFree\b[^\n]{0,60}\bPro\b\s*\$/i)).toEqual([]);
    expect(banned(/\bPro adds\b/i)).toEqual([]);
    expect(banned(/paid plan\s*=/i)).toEqual([]);
    expect(banned(/default plan\s*=/i)).toEqual([]);
    // Refusal-aware: "Never claim Free+Pro feature gates" must stay.
    expect(claimed(/\bPro\b[^\n]{0,40}\b(gate|gated|unlock)/i)).toEqual([]);
    // No plan-scoped entitlement flags should exist to branch on.
    expect(banned(/canUseAdvancedGoals/)).toEqual([]);
  });

  it("bills one plan, so no code branches on a tier for features", () => {
    const server = readFileSync(
      join(appSrc, "lib/entitlements.server.ts"),
      "utf8",
    );
    // Every capability is unconditionally true — there is nothing to gate on.
    expect(server).not.toMatch(/proRequiredLtvSummary/);
    expect(server).toMatch(/canUseAllChannels: true/);
    // Per-feature capability flags are gone, so nothing can branch on a tier.
    for (const flag of [
      "canUseLtv",
      "canUseLiveLtv",
      "canUseAdvancedGoals",
      "canUseAdvancedClose",
      "showProTeaser",
    ]) {
      expect(server, flag).not.toContain(flag);
    }
    const ent = readFileSync(join(appSrc, "lib/entitlements.ts"), "utf8");
    expect(ent).not.toMatch(/FREE_FEATURE_BULLETS|PRO_FEATURE_BULLETS/);
    expect(ent).toMatch(/DESK_FEATURE_BULLETS/);
  });

  it("keeps the Sample | Live labels as the only desk views", () => {
    const labels = readFileSync(join(appSrc, "lib/product-labels.ts"), "utf8");
    expect(labels).toContain('"Sample data"');
    expect(labels).toContain('"Live data"');
    expect(labels).not.toMatch(/"Practice/);
    expect(labels).not.toMatch(/"Your store"/);
  });

  it("prices one paid plan: 7-day trial then $39/store/mo, 90 closed days vs 24 months", () => {
    const ent = readFileSync(join(appSrc, "lib/entitlements.ts"), "utf8");
    expect(ent).toMatch(/7-day trial/);
    expect(ent).toMatch(/\$39/);
    expect(ent).toMatch(/not a percent of sales/i);
    expect(ent).toMatch(/not a per-order fee/i);
    expect(ent).toMatch(/Uninstall/);
    expect(ent).not.toMatch(/full-access/);
    expect(ent).not.toMatch(/Free plan/);
    expect(ent).toMatch(/90 closed days|LIVE_UNPAID_INGEST_DAYS/);
    expect(ent).toMatch(/24 months/);
    const handoff = readFileSync(
      join(appSrc, "lib/sample-live-handoff.ts"),
      "utf8",
    );
    expect(handoff).not.toMatch(/whole desk is already on/i);
    expect(handoff).not.toMatch(/full-access/);
  });

  it("keeps desk history at Jan 1 of (year - 5)", () => {
    const history = readFileSync(join(appSrc, "lib/desk-history.ts"), "utf8");
    expect(history).toContain("DESK_HISTORY_YEARS_BACK = 5");
  });
});
