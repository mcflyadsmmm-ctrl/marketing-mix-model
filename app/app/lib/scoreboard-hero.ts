/**
 * Black Clover–grade Overview scoreboard (Shopify-first).
 * Decision banner + 3 tinted hero cards + till-read + insight tiles.
 * Pure — no I/O.
 */

import type { OrderEconomics } from "./order-economics";
import { summarizeOrderEconomics } from "./order-economics";
import type { OpsDeskTone } from "./ops-desk-island";

export type ScoreboardCardTone = "decision" | "sales" | "customers" | "spend";

export type ScoreboardHeroCard = {
  id: string;
  tone: ScoreboardCardTone;
  kicker: string;
  value: string;
  delta: string | null;
  body: string;
  footLeft: string | null;
  footRight: string | null;
};

export type ScoreboardInsightTile = {
  id: string;
  kicker: string;
  value: string;
  hint: string;
  tint: "sky" | "mint" | "sand" | "lilac";
};

export type ScoreboardHeroModel = {
  formula: string;
  bannerKicker: string;
  bannerTakeaway: string;
  bannerDetail: string;
  bannerTone: OpsDeskTone;
  cards: ScoreboardHeroCard[];
  tillRead: string;
  tillMeta: string;
  insights: ScoreboardInsightTile[];
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
};

function money(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n >= 100 ? 0 : 2,
  }).format(n);
}

function pct(rate: number): string {
  return `${Math.round(rate * 1000) / 10}%`;
}

function formatDelta(
  pctChange: number | null,
  priorLabel: string | null,
): string | null {
  if (pctChange == null) return null;
  const label = priorLabel?.trim() || "prior";
  const sign = pctChange > 0 ? "+" : "";
  return `${sign}${pctChange.toFixed(0)}% vs ${label}`;
}

export type ScoreboardHeroInput = {
  periodLabel: string;
  periodPreset: string;
  economics: OrderEconomics;
  salesDeltaPct: number | null;
  priorLabel: string | null;
  buyerRepeat?: {
    secondWithin90: number | null;
    medianDaysToSecond: number | null;
  } | null;
  avgRevenueD90?: number | null;
  newBuyers?: number | null;
  top10BuyerShare?: number | null;
  dayInsight?: string | null;
  hasLiveSpend: boolean;
  mer?: number | null;
  spend?: number | null;
  spendDeltaPct?: number | null;
};

function resolveTone(input: ScoreboardHeroInput): OpsDeskTone {
  const second90 = input.buyerRepeat?.secondWithin90 ?? null;
  if (
    (input.economics.returningShare != null &&
      input.economics.returningShare >= 0.42) ||
    (second90 != null && second90 >= 0.35)
  ) {
    return "strong";
  }
  if (
    (input.economics.returningShare != null &&
      input.economics.returningShare <= 0.15 &&
      input.economics.orderCount >= 20) ||
    (input.economics.weekendShare != null &&
      input.economics.weekendShare >= 0.55)
  ) {
    return "watch";
  }
  return "steady";
}

/**
 * Build the BC-smooth first viewport from Shopify order depth.
 */
export function buildScoreboardHero(
  input: ScoreboardHeroInput,
): ScoreboardHeroModel | null {
  const { economics } = input;
  if (!economics.hasSignal) return null;

  const tone = resolveTone(input);
  const orderTake = summarizeOrderEconomics(economics);
  const takeaway =
    (input.dayInsight && input.dayInsight.trim()) ||
    orderTake ||
    `${economics.orderCount.toLocaleString()} orders · depth Shopify Analytics won’t put on one screen.`;

  const bannerKicker =
    tone === "strong"
      ? `${input.periodLabel} — demand looks healthy`
      : tone === "watch"
        ? `${input.periodLabel} — watch the mix`
        : `${input.periodLabel} — operator read`;

  const aov = economics.aov;

  const decisionCard: ScoreboardHeroCard = {
    id: "decision",
    tone: "decision",
    kicker: bannerKicker,
    value: aov != null ? money(aov) : economics.orderCount.toLocaleString(),
    delta: formatDelta(input.salesDeltaPct, input.priorLabel),
    body: takeaway,
    footLeft: aov != null ? "AOV this period" : "Orders",
    footRight:
      economics.weekendShare != null
        ? `Weekend ${pct(economics.weekendShare)}`
        : null,
  };

  const salesCard: ScoreboardHeroCard = {
    id: "sales",
    tone: "sales",
    kicker: "Shopify Total Sales",
    value: money(economics.sales),
    delta: formatDelta(input.salesDeltaPct, input.priorLabel),
    body: "After returns · shipping/tax when Shopify includes them",
    footLeft: `${economics.orderCount.toLocaleString()} orders`,
    footRight: aov != null ? `AOV ${money(aov)}` : null,
  };

  const returningShare = economics.returningShare;
  const second90 = input.buyerRepeat?.secondWithin90 ?? null;
  const customerValue =
    returningShare != null
      ? pct(returningShare)
      : second90 != null
        ? pct(second90)
        : input.avgRevenueD90 != null
          ? money(input.avgRevenueD90)
          : "—";
  const customerKicker =
    returningShare != null
      ? "Returning sales share"
      : second90 != null
        ? "2nd order · 90d"
        : "LTV · 90d";
  const customerBody =
    returningShare != null
      ? `${money(economics.returningCustomerSales)} returning · ${money(economics.newCustomerSales)} new`
      : second90 != null
        ? "Mature buyers with a second purchase in 90 days"
        : input.newBuyers != null && input.newBuyers > 0
          ? `${input.newBuyers.toLocaleString()} new buyers this period`
          : "Cohort depth from Shopify order history";

  const customerCard: ScoreboardHeroCard = {
    id: "customers",
    tone: "customers",
    kicker: customerKicker,
    value: customerValue,
    delta:
      input.top10BuyerShare != null
        ? `Top 10% buyers · ${pct(input.top10BuyerShare)} lifetime`
        : null,
    body: customerBody,
    footLeft:
      input.newBuyers != null && input.newBuyers > 0
        ? `${input.newBuyers.toLocaleString()} new buyers`
        : null,
    footRight:
      input.buyerRepeat?.medianDaysToSecond != null
        ? `Median ${Math.round(input.buyerRepeat.medianDaysToSecond)}d to 2nd`
        : null,
  };

  const cards: ScoreboardHeroCard[] = [decisionCard, salesCard, customerCard];
  if (input.hasLiveSpend && input.spend != null && input.spend > 0) {
    cards[0] = {
      id: "roas",
      tone: "spend",
      kicker: "Total ROAS",
      value: input.mer != null ? `${input.mer.toFixed(2)}×` : "—",
      delta: formatDelta(input.spendDeltaPct ?? null, input.priorLabel),
      body: `Shopify sales ÷ entered spend · ${money(input.spend)} spend`,
      footLeft: "Not platform ROAS",
      footRight: "Update spend anytime",
    };
  }

  const insights: ScoreboardInsightTile[] = [];
  if (economics.weekendShare != null) {
    insights.push({
      id: "weekend",
      kicker: "Weekend share of sales",
      value: pct(economics.weekendShare),
      hint: `${money(economics.weekendSales)} Sat–Sun · ${money(economics.weekdaySales)} weekdays`,
      tint: "sand",
    });
  }
  if (economics.returningShare != null) {
    insights.push({
      id: "returning",
      kicker: "Returning sales share",
      value: pct(economics.returningShare),
      hint: `${money(economics.returningCustomerSales)} returning buyers`,
      tint: "sky",
    });
  }
  if (input.top10BuyerShare != null) {
    insights.push({
      id: "top10",
      kicker: "Top 10% buyer concentration",
      value: pct(input.top10BuyerShare),
      hint: "Lifetime revenue from your heaviest tenth",
      tint: "lilac",
    });
  } else if (economics.spendPerOrder != null) {
    insights.push({
      id: "spo",
      kicker: "Spend per order",
      value: money(economics.spendPerOrder),
      hint: "Entered ad spend ÷ orders",
      tint: "mint",
    });
  } else if (aov != null) {
    insights.push({
      id: "aov",
      kicker: "Average order value",
      value: money(aov),
      hint: `${economics.orderCount.toLocaleString()} orders this period`,
      tint: "mint",
    });
  }

  return {
    formula:
      "Shopify order history first · Total ROAS = sales ÷ spend you enter later — not platform ROAS",
    bannerKicker: bannerKicker.toUpperCase(),
    bannerTakeaway: takeaway,
    bannerDetail: `${money(economics.sales)} sales · ${economics.orderCount.toLocaleString()} orders${
      aov != null ? ` · AOV ${money(aov)}` : ""
    }`,
    bannerTone: tone,
    cards,
    tillRead:
      aov != null
        ? `AOV ${money(aov)} · ${economics.orderCount.toLocaleString()} orders`
        : `${economics.orderCount.toLocaleString()} orders on the till`,
    tillMeta: `${money(economics.sales)} sales · built to sit on Shopify truth`,
    insights: insights.slice(0, 3),
    primaryHref: `/app/ltv?period=${encodeURIComponent(input.periodPreset)}`,
    primaryLabel: "Customers & LTV",
    secondaryHref: "/app/spend",
    secondaryLabel: input.hasLiveSpend ? "Update spend" : "Add spend later",
  };
}
