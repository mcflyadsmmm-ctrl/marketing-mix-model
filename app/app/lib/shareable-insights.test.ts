import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ShareableInsightCards } from "../components/ShareableInsightCards";
import {
  SHARE_MIN_ORDERS,
  buildShareableInsights,
  emptyShareableInsights,
  pickShareableLtvPeek,
  shareableInsightEmptyState,
  shareableInsightKicker,
  shareableInsightPngName,
  shareableLtvWindowLabel,
  shareableShopBrand,
} from "./shareable-insights";

function money(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function richInput(
  extra: Partial<Parameters<typeof buildShareableInsights>[0]> = {},
) {
  return buildShareableInsights(
    {
      salesPending: false,
      orderCount: 40,
      returningSales: 5_800,
      returningShare: 0.58,
      newSales: 4_200,
      typicalOrder: 186,
      daysToSecond: 18,
      ltvPeek: 380,
      ltvPeekDays: 90,
      historyLimited: false,
      shopLabel: "snowdevil.myshopify.com",
      sample: true,
      periodLabel: "This month",
      ...extra,
    },
    money,
  );
}

describe("shareable insight floors", () => {
  it("names the 8-order floor", () => {
    expect(SHARE_MIN_ORDERS).toBe(8);
  });
});

describe("shareableShopBrand", () => {
  it("labels SAMPLE as Snowdevil and strips the myshopify host", () => {
    expect(shareableShopBrand("anything.myshopify.com", true)).toBe("Snowdevil");
    expect(shareableShopBrand("harbor-home.myshopify.com", false)).toBe(
      "harbor-home",
    );
    expect(shareableShopBrand("", false)).toBe("This shop");
  });
});

describe("shareableLtvWindowLabel + kicker + png name", () => {
  it("writes shop-owner windows and a 2–4 card kicker", () => {
    expect(shareableLtvWindowLabel(30)).toBe("first 30 days");
    expect(shareableLtvWindowLabel(90)).toBe("first 90 days");
    expect(shareableLtvWindowLabel(365)).toBe("first year");
    expect(shareableInsightKicker(0)).toMatch(/screenshot-ready/);
    expect(shareableInsightKicker(2)).toMatch(/Two/);
    expect(shareableInsightKicker(4)).toMatch(/Four/);
    expect(shareableInsightPngName("returning", "Snowdevil")).toBe(
      "mcfly-returning-snowdevil.png",
    );
    expect(shareableInsightPngName("ltvPeek", "Harbor Home")).toBe(
      "mcfly-ltvPeek-harbor-home.png",
    );
  });
});

describe("pickShareableLtvPeek — 90 then 30, never a fake year", () => {
  it("prefers first 90 days", () => {
    expect(
      pickShareableLtvPeek({
        revenue30: 125,
        revenue90: 380,
        revenue365: 720,
        historyLimited: false,
      }),
    ).toEqual({ amount: 380, days: 90 });
  });

  it("falls back to 30 when 90 is unsealed", () => {
    expect(
      pickShareableLtvPeek({
        revenue30: 125,
        revenue90: null,
        revenue365: 720,
        historyLimited: false,
      }),
    ).toEqual({ amount: 125, days: 30 });
  });

  it("withholds the year when history is limited", () => {
    expect(
      pickShareableLtvPeek({
        revenue30: null,
        revenue90: null,
        revenue365: 720,
        historyLimited: true,
      }),
    ).toBeNull();
  });

  it("never treats $0 as a sealed peek", () => {
    expect(
      pickShareableLtvPeek({
        revenue30: 0,
        revenue90: 0,
        revenue365: 0,
        historyLimited: false,
      }),
    ).toBeNull();
  });
});

describe("shareableInsightEmptyState — floor 8 orders", () => {
  it("is syncing with a verb when nothing is on file", () => {
    const e = shareableInsightEmptyState(0, 0, false);
    expect(e?.kind).toBe("syncing");
    expect(e?.need).toBe(SHARE_MIN_ORDERS);
    expect(e?.verb).toBe("Refresh this page");
    expect(e?.copy).toMatch(/not \$0/);
  });

  it("is syncing while sales are still loading", () => {
    const e = shareableInsightEmptyState(12, 4, true);
    expect(e?.kind).toBe("syncing");
    expect(e?.copy).toMatch(/still syncing/);
  });

  it("is thin below the order floor", () => {
    const e = shareableInsightEmptyState(3, 2, false);
    expect(e?.kind).toBe("thin");
    expect(e?.orders).toBe(3);
    expect(e?.copy).toContain("3 orders");
    expect(e?.copy).toContain("8 paid orders");
    expect(e?.verb).toBe("Watch the next orders");
  });

  it("is young when orders exist but no card sealed", () => {
    const e = shareableInsightEmptyState(12, 0, false);
    expect(e?.kind).toBe("young");
    expect(e?.copy).toMatch(/identified buyers/);
    expect(e?.copy).toMatch(/not \$0/);
    expect(e?.verb).toBe("Wait for identified buyers");
  });

  it("seals when 8 orders have at least one honest card", () => {
    expect(shareableInsightEmptyState(8, 2, false)).toBeNull();
  });
});

describe("buildShareableInsights — 2–4 soft cards from desk truths", () => {
  it("paints all four SAMPLE Snowdevil cards with formulas", () => {
    const view = richInput();
    expect(view.available).toBe(true);
    expect(view.empty).toBeNull();
    expect(view.shopBrand).toBe("Snowdevil");
    expect(view.sample).toBe(true);
    expect(view.cards.map((c) => c.kind)).toEqual([
      "returning",
      "typicalOrder",
      "daysToSecond",
      "ltvPeek",
    ]);
    const [returning, typical, days, ltv] = view.cards;
    expect(returning?.value).toBe("$5,800");
    expect(returning?.line).toContain("58%");
    expect(returning?.line).toContain("$5,800");
    expect(returning?.formula).toContain("Returning $ ÷ (new $ + returning $)");
    expect(returning?.formula).toContain("$5,800 ÷ ($4,200 + $5,800)");
    expect(returning?.trust).toMatch(/Guests stay out/);
    expect(typical?.line).toContain("$186");
    expect(typical?.formula).toMatch(/median/i);
    expect(days?.value).toBe("18 days");
    expect(days?.formula).toMatch(/median first→second/);
    expect(days?.nextHref).toBe("/app/customers");
    expect(days?.nextLabel).toBe("Open Customers");
    expect(ltv?.line).toContain("first 90 days");
    expect(ltv?.line).toContain("$380");
    expect(ltv?.trust).toMatch(/Observed/);
    expect(ltv?.trust).toMatch(/not an estimate/);
    expect(ltv?.nextHref).toBe("/app/customers");
    expect(ltv?.nextLabel).toBe("Open Customers");
    expect(typical?.nextHref).toBe("/app/orders");
    expect(typical?.nextLabel).toBe("Open Orders");
    expect(returning?.nextHref).toBe("/app/customers");
  });

  it("omits a missing truth instead of painting $0", () => {
    const view = richInput({
      daysToSecond: null,
      ltvPeek: null,
      ltvPeekDays: null,
    });
    expect(view.cards).toHaveLength(2);
    expect(view.cards.map((c) => c.kind)).toEqual([
      "returning",
      "typicalOrder",
    ]);
    expect(view.cards.every((c) => c.value !== "$0")).toBe(true);
    expect(view.cards.every((c) => c.value !== "0")).toBe(true);
  });

  it("stays an ActionCard-shaped empty below the floor", () => {
    const view = richInput({ orderCount: 3 });
    expect(view.available).toBe(false);
    expect(view.cards).toEqual([]);
    expect(view.empty?.kind).toBe("thin");
    expect(view.empty?.verb).toBeTruthy();
    expect(view.empty?.copy).toMatch(/not \$0/);
  });

  it("withholds a first-year peek when history is limited", () => {
    const view = richInput({
      returningSales: null,
      returningShare: null,
      typicalOrder: 186,
      daysToSecond: 18,
      ltvPeek: 720,
      ltvPeekDays: 365,
      historyLimited: true,
    });
    expect(view.cards.map((c) => c.kind)).toEqual([
      "typicalOrder",
      "daysToSecond",
    ]);
  });

  it("never invents returning $ from a zero share", () => {
    const view = richInput({
      returningSales: 0,
      returningShare: 0,
      newSales: 0,
    });
    expect(view.cards.some((c) => c.kind === "returning")).toBe(false);
  });
});

describe("emptyShareableInsights", () => {
  it("is a syncing empty, not a fake poster", () => {
    const e = emptyShareableInsights();
    expect(e.available).toBe(false);
    expect(e.cards).toEqual([]);
    expect(e.empty?.kind).toBe("syncing");
    expect(e.empty?.copy).toMatch(/not \$0/);
  });
});

describe("ShareableInsightCards render", () => {
  it("paints four SAMPLE posters with formula and copy, never $0", () => {
    const html = renderToStaticMarkup(
      createElement(ShareableInsightCards, { view: richInput() }),
    );
    expect(html).toContain("Share a number");
    expect(html).toContain("Returning buyers carry 58%");
    expect(html).toContain("Typical order is $186");
    expect(html).toContain("18 days");
    expect(html).toContain("first 90 days");
    expect(html).toContain("Copy line");
    expect(html).toContain("Save PNG");
    expect(html).toContain("Snowdevil");
    expect(html).toContain("SAMPLE");
    expect(html).toContain("Returning $ ÷ (new $ + returning $)");
    expect(html).not.toContain(">$0<");
    expect(html).not.toContain("Total ROAS");
    expect(html).not.toContain("Spend Upload");
  });

  it("paints an ActionCard-shaped empty, not a blank or $0 card", () => {
    const html = renderToStaticMarkup(
      createElement(ShareableInsightCards, {
        view: richInput({ orderCount: 3 }),
      }),
    );
    expect(html).toContain("First win");
    expect(html).toContain("Watch the next orders");
    expect(html).toContain("3 orders on file");
    expect(html).toContain("not $0");
    expect(html).toContain("Floor:");
    expect(html).not.toContain("Copy line");
    expect(html).not.toContain(">$0<");
  });
});
