/**
 * Locks for install, trial, and Shopify App Pricing.
 * application_url stays on Fly. No Billing API mutations. No trial tombstone.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readRepo(rel: string): string {
  return readFileSync(join(repoRoot, rel), "utf8");
}

function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

describe("billing and compliance locks", () => {
  it("keeps application_url on Fly in every app config", () => {
    for (const path of [
      "app/shopify.app.toml",
      "app/shopify.app.public.toml",
      "app/shopify.app.custom.toml",
    ]) {
      const toml = readRepo(path);
      const url = toml.match(/^application_url\s*=\s*"([^"]+)"/m)?.[1];
      expect(url, path).toBe("https://mcfly-analytics.fly.dev");
      expect(toml, path).not.toMatch(/application_url\s*=\s*"[^"]*mcflyads\.com/);
    }
  });

  it("subscribes uninstall and the three GDPR topics on the public app", () => {
    const toml = readRepo("app/shopify.app.toml");
    expect(toml).toContain('topics = ["app/uninstalled"]');
    expect(toml).toContain(
      'compliance_topics = ["customers/data_request", "customers/redact", "shop/redact"]',
    );
    expect(toml).toContain('scopes = "read_orders,read_customers,read_all_orders,read_reports"');
    expect(toml).not.toMatch(/write_pixels|read_pixels|read_customer_events/);
  });

  it("does not call Billing API charge or cancel mutations", () => {
    const files = [
      "app/app/lib/billing.server.ts",
      "app/app/lib/billing-webhook.server.ts",
      "app/app/lib/billing-cycle.server.ts",
      "app/app/lib/billing-subscription.ts",
      "app/app/lib/partner-subscription.server.ts",
      "app/app/routes/app.billing.tsx",
      "app/app/routes/webhooks.app.uninstalled.tsx",
      "app/app/routes/webhooks.compliance.tsx",
    ];
    for (const path of files) {
      const src = codeOnly(readRepo(path));
      expect(src, path).not.toMatch(
        /appSubscriptionCreate|appSubscriptionCancel|appUsageRecordCreate|billing\.request/,
      );
    }
  });

  it("uninstall keeps a paid cycle and shop/redact deletes that shop's billing row", () => {
    const uninstall = readRepo("app/app/routes/webhooks.app.uninstalled.tsx");
    const compliance = readRepo("app/app/routes/webhooks.compliance.tsx");
    expect(uninstall).toContain("noteUninstallStopsNextCycle");
    expect(uninstall).toContain("shop.deleteMany");
    expect(uninstall).not.toContain("clearPaidCycle");
    expect(compliance).toContain("clearPaidCycle");
    expect(compliance).toContain("shop.deleteMany");
    expect(compliance).toContain("CUSTOMERS_REDACT");
    expect(compliance).toContain("CUSTOMERS_DATA_REQUEST");
  });

  it("does not add a trial tombstone column", () => {
    const schema = readRepo("app/prisma/schema.prisma");
    const cycle = schema.match(/model ShopBillingCycle \{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(cycle).toContain("paidCycleEndsAt");
    expect(cycle).not.toMatch(/trialUsed|trialConsumed|tombstone|trialEndsAt/);
    const rules = readRepo("app/app/lib/billing-subscription.ts");
    expect(rules).not.toMatch(/trialUsed|trialConsumed|tombstone/);
  });
});
