import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildGrowthTt2, growthTt2HistoryLine, growthTt2Read } from "./growth-tt2";
import { buildLtvFlagship, flagshipDailyRead } from "./ltv-flagship";
import { generateSnowdevilDepthOrders } from "./ltv-depth-sample";
import { ShareableInsightCards } from "../components/ShareableInsightCards";
import { SlackInsightCard } from "../components/SlackInsightCard";
import {
  SHARE_MIN_ORDERS,
  buildShareableInsights,
  ltvPeekSlackInsight,
  daysToSecondSlackInsight,
  emptyShareableInsights,
  firstTimeSlackInsight,
  pickShareableLtvPeek,
  shareableInsightEmptyState,
  shareableInsightKicker,
  shareableInsightPngName,
  shareableLtvWindowLabel,
  shareableShopBrand,
  slackInsightFromCard,
  whaleSlackInsight,
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
    expect(html).toContain("Copy for Slack");
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
    expect(html).not.toContain("Copy for Slack");
    expect(html).not.toContain(">$0<");
  });
});

describe("Slack insight paste — one sealed number", () => {
  it("formats a poster as Slack mrkdwn without a second formula", () => {
    const view = richInput();
    const card = view.cards.find((row) => row.kind === "returning");
    expect(card).toBeTruthy();
    const slack = slackInsightFromCard(card!, {
      shopBrand: view.shopBrand,
      sample: true,
      periodLabel: view.periodLabel,
    });
    expect(slack.slack.startsWith("*Returning $* · Snowdevil · SAMPLE · This month")).toBe(
      true,
    );
    expect(slack.slack).toContain(card!.line);
    expect(slack.slack).toContain(card!.formula);
    expect(slack.slack).not.toContain("$0");
    expect(slack.slack).not.toMatch(/\bROAS\b/);
  });

  it("shares days-to-second only when a typical wait has sealed", () => {
    const sealed = daysToSecondSlackInsight({
      typicalDays: 18,
      readLine: "Typical wait is 18 days. Reach the 4 one-order buyers already past day 33.",
      shopLabel: "snowdevil.myshopify.com",
      sample: true,
      where: "Full stored book",
    });
    expect(sealed?.line).toContain("18 days");
    expect(sealed?.slack).toContain("*Days to second*");
    expect(sealed?.slack).toContain("Snowdevil · SAMPLE");
    expect(
      daysToSecondSlackInsight({
        typicalDays: null,
        readLine: "Still waiting — not $0.",
        shopLabel: "",
        sample: false,
        where: "On file",
      }),
    ).toBeNull();
    expect(
      daysToSecondSlackInsight({
        typicalDays: 0,
        readLine: "Typical wait is 0 days.",
        shopLabel: "",
        sample: false,
        where: "On file",
      }),
    ).toBeNull();
  });

  it("shares first-time dollars only when the stand-up line is sealed, never $0", () => {
    const sealed = firstTimeSlackInsight({
      line: "First-time Shopify Total Sales this period is $187,000. 2nd 18% · 3rd+ 11%. Reach 5 one-order buyers already past win-back.",
      shopLabel: "snowdevil.myshopify.com",
      sample: true,
      where: "This period",
    });
    expect(sealed?.id).toBe("firstTime");
    expect(sealed?.line).toContain("$187,000");
    expect(sealed?.slack).toContain("*First-time dollars*");
    expect(firstTimeSlackInsight({
      line: null,
      shopLabel: "",
      sample: false,
      where: "This period",
    })).toBeNull();
    expect(firstTimeSlackInsight({
      line: "First-time Shopify Total Sales this period is $0.",
      shopLabel: "",
      sample: false,
      where: "This period",
    })).toBeNull();
  });

  it("shares new-buyer worth at 90, and withholds a fake year", () => {
    const peek = ltvPeekSlackInsight({
      amount: 380,
      days: 90,
      historyLimited: false,
      shopLabel: "",
      sample: true,
      where: "On file",
      money,
    });
    expect(peek?.line).toContain("$380");
    expect(peek?.line).toContain("first 90 days");
    expect(peek?.slack).not.toContain("$0");
    expect(
      ltvPeekSlackInsight({
        amount: 900,
        days: 365,
        historyLimited: true,
        shopLabel: "",
        sample: false,
        where: "On file",
        money,
      }),
    ).toBeNull();
    expect(
      ltvPeekSlackInsight({
        amount: null,
        days: 30,
        historyLimited: false,
        shopLabel: "",
        sample: false,
        where: "On file",
        money,
      }),
    ).toBeNull();
  });

  it("shares best customers only when share and typical lifetime are real", () => {
    const whale = whaleSlackInsight({
      whaleCount: 6,
      salesShare: 0.34,
      medianLifetime: 1240,
      coldShare: null,
      historyLimited: false,
      shopLabel: "harbor.myshopify.com",
      sample: false,
      where: "On file",
      money,
    });
    expect(whale?.line).toContain("34%");
    expect(whale?.line).toContain("$1,240");
    expect(whale?.slack).toContain("*Best customers* · harbor");
    expect(
      whaleSlackInsight({
        whaleCount: 0,
        salesShare: 0.34,
        medianLifetime: 1240,
        coldShare: 0.5,
        historyLimited: false,
        shopLabel: "",
        sample: false,
        where: "On file",
        money,
      }),
    ).toBeNull();
    expect(
      whaleSlackInsight({
        whaleCount: 4,
        salesShare: 0,
        medianLifetime: 1240,
        shopLabel: "",
        sample: false,
        where: "On file",
        money,
        coldShare: 0.22,
        historyLimited: false,
      }),
    ).toBeNull();
  });

  it("appends cold share when it is > 0 and withholds it on a limited book", () => {
    const withCold = whaleSlackInsight({
      whaleCount: 6,
      salesShare: 0.34,
      medianLifetime: 1240,
      coldShare: 0.22,
      historyLimited: false,
      shopLabel: "harbor.myshopify.com",
      sample: false,
      where: "On file",
      money,
    });
    expect(withCold?.line).toContain("34%");
    expect(withCold?.line).toContain("$1,240");
    expect(withCold?.line).toMatch(/22% have not ordered in over 180 days/);
    expect(withCold?.slack).not.toContain("$0");
    const quiet = whaleSlackInsight({
      whaleCount: 6,
      salesShare: 0.34,
      medianLifetime: 1240,
      coldShare: 0,
      historyLimited: false,
      shopLabel: "",
      sample: false,
      where: "On file",
      money,
    });
    expect(quiet?.line).not.toMatch(/180 days/);
    const pending = whaleSlackInsight({
      whaleCount: 6,
      salesShare: 0.34,
      medianLifetime: 1240,
      coldShare: 0.4,
      historyLimited: true,
      shopLabel: "",
      sample: false,
      where: "On file",
      money,
    });
    expect(pending?.line).not.toMatch(/180 days/);
    expect(pending?.slack).not.toContain("$0");
  });

  it("paints a selectable quote and stays quiet when the insight is missing", () => {
    const insight = daysToSecondSlackInsight({
      typicalDays: 18,
      readLine: "Typical wait is 18 days.",
      shopLabel: "",
      sample: true,
      where: "On file",
    });
    const html = renderToStaticMarkup(
      createElement(SlackInsightCard, { insight }),
    );
    expect(html).toContain("Copy for Slack");
    expect(html).toContain("Typical wait is 18 days.");
    expect(html).toContain('data-slack-insight="daysToSecond"');
    expect(html).toContain("*Days to second*");
    expect(html).not.toContain(">$0<");
    const empty = renderToStaticMarkup(
      createElement(SlackInsightCard, { insight: null }),
    );
    expect(empty).toBe("");
  });

  it("seals Slack quotes from the Snowdevil SAMPLE book", () => {
    const asOf = new Date("2026-09-22T12:00:00.000Z");
    const orders = generateSnowdevilDepthOrders(asOf);
    const depth = buildLtvFlagship(orders, asOf, { sample: true });
    const tt2 = buildGrowthTt2(
      orders.map((order) => ({
        customerKey: order.customerKey,
        orderedAt: order.orderedAt,
        amount: order.amount,
        shopLocalDate: null,
      })),
      { windowEnd: asOf, historyLimited: false },
    );
    const read = growthTt2Read(tt2);
    const days = daysToSecondSlackInsight({
      typicalDays: read?.typicalDays ?? null,
      readLine: read?.line ?? null,
      shopLabel: "Snowdevil",
      sample: true,
      where: growthTt2HistoryLine(tt2),
    });
    const daily = flagshipDailyRead(depth.windows, depth.predictive);
    const worth = ltvPeekSlackInsight({
      amount: daily?.worth ?? null,
      days: daily?.worthDays ?? null,
      historyLimited: false,
      shopLabel: "Snowdevil",
      sample: true,
      where: "On file",
      money,
    });
    const whales = depth.whales;
    const whale = whaleSlackInsight({
      whaleCount: whales?.whaleCount ?? 0,
      salesShare: whales?.salesShare ?? null,
      medianLifetime: whales?.medianLifetime ?? null,
      coldShare: whales?.coldShare ?? null,
      historyLimited: false,
      shopLabel: "Snowdevil",
      sample: true,
      where: "On file",
      money,
    });
    expect(days?.slack).toContain("Snowdevil · SAMPLE");
    expect(days?.line).toMatch(/\d+ days/);
    expect(days?.slack).not.toContain("$0");
    expect(worth?.line).toMatch(/first (30|90) days|first year/);
    expect(worth?.slack).not.toContain("$0");
    expect(whale?.line).toMatch(/% of identified sales/);
    expect(whale?.slack).not.toContain("$0");
    expect(days?.slack).not.toMatch(/\bROAS\b/);
    expect(worth?.slack).not.toMatch(/\bCOGS\b/);
    expect(days?.line).toBeTruthy();
    expect(worth?.line).toBeTruthy();
    expect(whale?.line).toBeTruthy();
  });
});
