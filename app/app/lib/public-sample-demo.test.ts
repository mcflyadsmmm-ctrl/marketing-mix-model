import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { flyRouteDecision, isShopifyAppPath } from "../../scripts/shopify-app-path.mjs";
import { withDeskBase } from "./desk-base-path";
import {
  isPublicDemoPath,
  stampPublicDemoDocumentHeaders,
} from "./public-demo-headers";
import { loadPublicSampleBook } from "./public-sample-book.server";
import {
  loadPublicSamplePage,
  sampleLtvAverages,
} from "./public-sample-page.server";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readRepo(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("public Remix SAMPLE desk", () => {
  it("skips marketing static for /demo so Remix owns the identical desk", () => {
    expect(isShopifyAppPath("/demo")).toBe(true);
    expect(isShopifyAppPath("/demo/roas")).toBe(true);
    expect(isShopifyAppPath("/demo.data")).toBe(true);
    // serve-with-site checks isShopifyAppPath first — not shouldSkipMarketingSite.
    expect(flyRouteDecision("/demo", {}, {})).toBe("next");
    expect(flyRouteDecision("/demo/roas", {}, {})).toBe("next");
  });

  it("maps Admin /app paths onto /demo", () => {
    expect(withDeskBase("/app", "/demo")).toBe("/demo");
    expect(withDeskBase("/app/customers", "/demo")).toBe("/demo/customers");
    expect(withDeskBase("/app/roas", "/app")).toBe("/app/roas");
  });

  it("public demo layout never authenticates or reads a live shop", () => {
    const layout = readRepo("app/app/routes/demo.tsx");
    const overview = readRepo("app/app/routes/demo._index.tsx");
    const page = readRepo("app/app/lib/public-sample-page.server.ts");
    expect(layout).not.toContain("authenticate.admin");
    expect(layout).not.toContain("requireAdmin");
    expect(overview).not.toContain("authenticate.admin");
    expect(page).not.toContain("authenticate.admin");
    expect(page).not.toContain("requireAdmin");
    expect(page).toContain("loadPublicSampleBook");
    expect(layout).toContain("mcfly-desk.css");
    expect(layout).toContain("includeSettings");
    expect(layout).not.toContain("public-sample-book.server");
    expect(layout).toContain("public-sample-constants");
  });

  it("Snowdevil in-memory book paints sales, spend, and LTV without Prisma", () => {
    const now = new Date("2026-09-16T18:00:00Z");
    const book = loadPublicSampleBook(now);
    expect(book.days.length).toBeGreaterThan(400);
    expect(book.orders.length).toBeGreaterThan(100);
    const mtd = book.days.filter(
      (row) =>
        row.day.getUTCFullYear() === 2026 &&
        row.day.getUTCMonth() === 8 &&
        row.day.getUTCDate() <= 16,
    );
    const sales = mtd.reduce((sum, row) => sum + row.sales, 0);
    const spend = mtd.reduce((sum, row) => sum + row.spend, 0);
    expect(sales).toBeGreaterThan(0);
    expect(spend).toBeGreaterThan(0);
    expect(sales / spend).toBeGreaterThan(3.1);
    expect(sales / spend).toBeLessThan(4.0);
    const ltv = sampleLtvAverages(book.orders, now);
    expect(ltv.revenue90).toBeGreaterThan(0);
  });

  it("defaults /demo to the Snowdevil lock window (1–16 Sep 2026)", async () => {
    const page = await loadPublicSamplePage(
      new Request("https://mcfly-analytics.fly.dev/demo"),
    );
    expect(page.orderHero.sales).toBeCloseTo(page.sales.totalSales, 2);
    expect(page.orderHero.priorSales).toBeGreaterThan(0);
    expect(page.orderHero.typicalOrder).toBe(page.depth.medianAov);
    expect(page.orderHero.returningSales).toBe(page.book.returningSales);
    expect(page.mixForecast.mix?.returningSales).toBe(page.orderHero.returningSales);
    expect(page.orderHero.weekendShare).toBeCloseTo(0.23, 2);
  });

  it("SAMPLE forecast is next month from order history, with spend left out", async () => {
    const page = await loadPublicSamplePage(
      new Request("https://mcflyads.com/demo"),
    );
    const view = page.orderHistoryForecast;
    expect(view.formula).toBe("Next month = typical day × days in that month");
    expect(view.method).toMatch(/median of selling days/i);
    expect(view.estimate).not.toBeNull();
    expect(view.estimate!).toBeGreaterThan(0);
    expect(view.plug).toMatch(/×/);
    expect(view.daysLine).toMatch(/Sample shop book/);
    const sales = view.targets.find((row) => row.kind === "sales");
    const returning = view.targets.find((row) => row.kind === "returning");
    const ltv = view.targets.find((row) => row.kind === "ltv");
    expect(sales?.actual).toBeGreaterThan(0);
    expect(sales?.pct).toBeNull();
    expect(returning?.target).toBeNull();
    expect(returning?.pct).toBeNull();
    expect(returning?.note).not.toMatch(/Snowdevil stretch/);
    expect(returning?.note).not.toMatch(/800,000/);
    expect(ltv?.actual).toBeGreaterThan(0);
    expect(ltv?.pct).toBeNull();
    expect(page.habitGoals.returning).toBeNull();
    expect(page.habitGoals.returningTarget).toBeNull();
    expect(ltv?.pct).toBeNull();
  });

  it("lets mcflyads.com iframe /demo after Shopify document headers", () => {
    expect(isPublicDemoPath("/demo")).toBe(true);
    expect(isPublicDemoPath("/demo/roas")).toBe(true);
    expect(isPublicDemoPath("/app")).toBe(false);
    const demoHeaders = new Headers({
      "Content-Security-Policy": "frame-ancestors https://admin.shopify.com",
      "X-Frame-Options": "DENY",
    });
    stampPublicDemoDocumentHeaders(
      new Request("https://mcfly-analytics.fly.dev/demo"),
      demoHeaders,
    );
    expect(demoHeaders.get("Content-Security-Policy")).toContain("mcflyads.com");
    expect(demoHeaders.get("X-Frame-Options")).toBeNull();
    const appHeaders = new Headers({
      "Content-Security-Policy": "frame-ancestors https://admin.shopify.com",
    });
    stampPublicDemoDocumentHeaders(
      new Request("https://mcfly-analytics.fly.dev/app"),
      appHeaders,
    );
    expect(appHeaders.get("Content-Security-Policy")).toBe(
      "frame-ancestors https://admin.shopify.com",
    );
    const entry = readRepo("app/app/entry.server.tsx");
    expect(entry).toContain("stampPublicDemoDocumentHeaders");
  });
});
