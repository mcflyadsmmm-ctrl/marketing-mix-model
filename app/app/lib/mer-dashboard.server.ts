import prisma from "../db.server";
import {
  channelMix,
  computeBreakEvenMer,
  computeMer,
  sumSpend,
  type ChannelSpend,
  type SpendChannel,
} from "@mcfly/mer-engine";
import {
  suggestAllocation,
  type SuggestAllocationResult,
} from "@mcfly/mer-core";
import type { DateRange } from "./periods";

const CHANNEL_DISPLAY: Record<SpendChannel, string> = {
  meta: "Meta",
  google: "Google",
  other: "Other / Manual",
};

export interface DashboardMetrics {
  period: DateRange;
  sales: number;
  salesSource: "shopify" | "mock";
  orderCount: number;
  totalSpend: number;
  mer: number | null;
  breakEvenMer: number | null;
  targetMer: number;
  marginPct: number;
  channelMix: ReturnType<typeof channelMix>;
  aboveBreakEven: boolean | null;
  allocation: SuggestAllocationResult | null;
}

export async function ensureShop(domain: string) {
  return prisma.shop.upsert({
    where: { domain },
    create: { domain },
    update: {},
  });
}

export async function getOrCreateSettings(shopId: string) {
  return prisma.settings.upsert({
    where: { shopId },
    create: { shopId },
    update: {},
  });
}

export async function getSpendByChannel(
  shopId: string,
  range: DateRange,
): Promise<ChannelSpend[]> {
  const entries = await prisma.spendEntry.findMany({
    where: {
      shopId,
      periodStart: { lte: range.end },
      periodEnd: { gte: range.start },
    },
  });

  const totals: Record<SpendChannel, number> = {
    meta: 0,
    google: 0,
    other: 0,
  };

  for (const entry of entries) {
    totals[entry.channel as SpendChannel] += entry.amount;
  }

  return (["meta", "google", "other"] as const).map((channel) => ({
    channel,
    amount: totals[channel],
  }));
}

export function buildAllocationSuggestion(
  spends: ChannelSpend[],
  totalSales: number,
  totalSpend: number,
  breakEvenMer: number | null,
): SuggestAllocationResult | null {
  if (breakEvenMer === null) {
    return null;
  }

  return suggestAllocation({
    channels: spends
      .filter((s) => s.amount > 0)
      .map((s) => ({
        name: CHANNEL_DISPLAY[s.channel],
        spend: s.amount,
        isManual: s.channel === "other",
      })),
    breakEvenMer,
    totalSales,
    totalSpend,
  });
}

export async function buildDashboardMetrics(
  shopDomain: string,
  range: DateRange,
  sales: { totalSales: number; orderCount: number; source: "shopify" | "mock" },
): Promise<DashboardMetrics> {
  const shop = await ensureShop(shopDomain);
  const settings = await getOrCreateSettings(shop.id);
  const spends = await getSpendByChannel(shop.id, range);
  const totalSpend = sumSpend(spends);
  const mer = computeMer(sales.totalSales, totalSpend);
  const breakEvenMer = computeBreakEvenMer(settings.marginPct);
  const mix = channelMix(spends);

  return {
    period: range,
    sales: sales.totalSales,
    salesSource: sales.source,
    orderCount: sales.orderCount,
    totalSpend,
    mer,
    breakEvenMer,
    targetMer: settings.targetMer,
    marginPct: settings.marginPct,
    channelMix: mix,
    aboveBreakEven:
      mer !== null && breakEvenMer !== null ? mer >= breakEvenMer : null,
    allocation: buildAllocationSuggestion(
      spends,
      sales.totalSales,
      totalSpend,
      breakEvenMer,
    ),
  };
}

export { formatCurrency, formatMer, formatPercent } from "./mer-format";
