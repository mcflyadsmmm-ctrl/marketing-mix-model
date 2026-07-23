import prisma from "../db.server";
import {
  channelMix,
  computeBreakEvenMer,
  computeMer,
  sumSpend,
  SPEND_CHANNELS,
  SPEND_CHANNEL_LABELS,
  type ChannelSpend,
  type SpendChannel,
} from "@mcfly/mer-engine";
import {
  suggestAllocation,
  type SuggestAllocationResult,
} from "@mcfly/mer-core";
import type { DateRange } from "./periods";

const CHANNEL_DISPLAY = SPEND_CHANNEL_LABELS;

export type FreshnessSource = "snapshot" | "sync" | "live";

/** D3 trust: last overnight snapshot / sync, or live desk refresh. */
export interface DashboardFreshness {
  snapshotAt: string | null;
  syncAt: string | null;
  lastAt: string | null;
  source: FreshnessSource;
}

export interface DashboardMetrics {
  period: DateRange;
  sales: number;
  salesSource: "shopify" | "mock";
  orderCount: number;
  newCustomers: number;
  returningCustomers: number;
  guestOrders: number;
  /** False when Shopify denied order.customer (needs read_customers + reinstall). */
  customerMetricsAvailable: boolean;
  /** True when Cash MER is driven by the Demo sample desk (not live Shopify). */
  useSampleDesk: boolean;
  totalSpend: number;
  mer: number | null;
  breakEvenMer: number | null;
  targetMer: number;
  marginPct: number;
  channelMix: ReturnType<typeof channelMix>;
  aboveBreakEven: boolean | null;
  allocation: SuggestAllocationResult | null;
  onboarding: RitualOnboarding;
  freshness: DashboardFreshness;
}

export async function ensureShop(domain: string) {
  return prisma.shop.upsert({
    where: { domain },
    create: { domain },
    update: {},
  });
}

export async function getOrCreateSettings(shopId: string) {
  // find-then-create (not empty upsert) so @updatedAt stays meaningful for first-run detection
  const existing = await prisma.settings.findUnique({ where: { shopId } });
  if (existing) return existing;
  return prisma.settings.create({ data: { shopId } });
}

/** True after the merchant has saved Settings at least once (not just defaults). */
export function settingsHaveBeenSaved(settings: {
  createdAt: Date;
  updatedAt: Date;
}): boolean {
  return settings.updatedAt.getTime() - settings.createdAt.getTime() > 500;
}

export interface RitualOnboarding {
  settingsSaved: boolean;
  hasSpend: boolean;
  /** First-run guide until margin confirmed and spend exists */
  showGuide: boolean;
}

export async function getDashboardFreshness(
  shopId: string,
): Promise<DashboardFreshness> {
  const [snapshot, syncRun] = await Promise.all([
    prisma.merSnapshot.findFirst({
      where: { shopId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.syncRun.findFirst({
      where: { shopId, finishedAt: { not: null } },
      orderBy: { finishedAt: "desc" },
      select: { finishedAt: true },
    }),
  ]);

  const snapshotAt = snapshot?.createdAt.toISOString() ?? null;
  const syncAt = syncRun?.finishedAt?.toISOString() ?? null;

  if (!snapshotAt && !syncAt) {
    return { snapshotAt: null, syncAt: null, lastAt: null, source: "live" };
  }

  const snapshotMs = snapshotAt ? Date.parse(snapshotAt) : Number.NEGATIVE_INFINITY;
  const syncMs = syncAt ? Date.parse(syncAt) : Number.NEGATIVE_INFINITY;
  const preferSnapshot = snapshotMs >= syncMs;

  return {
    snapshotAt,
    syncAt,
    lastAt: preferSnapshot ? snapshotAt : syncAt,
    source: preferSnapshot ? "snapshot" : "sync",
  };
}

export async function getSpendByChannel(
  shopId: string,
  range: DateRange,
  options?: { sampleOnly?: boolean; excludeSample?: boolean },
): Promise<ChannelSpend[]> {
  const entries = await prisma.spendEntry.findMany({
    where: {
      shopId,
      periodStart: { lte: range.end },
      periodEnd: { gte: range.start },
      ...(options?.sampleOnly
        ? { source: "sample" }
        : options?.excludeSample
          ? { NOT: { source: "sample" } }
          : {}),
    },
  });

  const totals: Record<SpendChannel, number> = {
    meta: 0,
    google: 0,
    microsoft: 0,
    tiktok: 0,
    affiliate: 0,
    email: 0,
    other: 0,
  };

  for (const entry of entries) {
    totals[entry.channel as SpendChannel] += entry.amount;
  }

  return SPEND_CHANNELS.map((channel) => ({
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
        isManual:
          s.channel === "other" ||
          s.channel === "affiliate" ||
          s.channel === "email",
      })),
    breakEvenMer,
    totalSales,
    totalSpend,
  });
}

export async function buildDashboardMetrics(
  shopDomain: string,
  range: DateRange,
  sales: {
    totalSales: number;
    orderCount: number;
    newCustomers?: number;
    returningCustomers?: number;
    guestOrders?: number;
    customerMetricsAvailable?: boolean;
    source: "shopify" | "mock";
  },
): Promise<DashboardMetrics> {
  const shop = await ensureShop(shopDomain);
  const settings = await getOrCreateSettings(shop.id);
  const useSampleDesk = Boolean(settings.useSampleDesk);
  const [spends, freshness] = await Promise.all([
    getSpendByChannel(
      shop.id,
      range,
      useSampleDesk ? { sampleOnly: true } : { excludeSample: true },
    ),
    getDashboardFreshness(shop.id),
  ]);
  const totalSpend = sumSpend(spends);
  const mer = computeMer(sales.totalSales, totalSpend);
  const breakEvenMer = computeBreakEvenMer(settings.marginPct);
  const mix = channelMix(spends);
  const settingsSaved = settingsHaveBeenSaved(settings) || useSampleDesk;
  const hasSpend = totalSpend > 0;
  const onboarding: RitualOnboarding = {
    settingsSaved,
    hasSpend,
    showGuide: !useSampleDesk && (!settingsSaved || !hasSpend),
  };

  return {
    period: range,
    sales: sales.totalSales,
    salesSource: sales.source,
    orderCount: sales.orderCount,
    newCustomers: sales.newCustomers ?? 0,
    returningCustomers: sales.returningCustomers ?? 0,
    guestOrders: sales.guestOrders ?? 0,
    customerMetricsAvailable: sales.customerMetricsAvailable ?? false,
    useSampleDesk,
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
    onboarding,
    freshness,
  };
}

export { formatCurrency, formatMer, formatPercent, formatFreshness } from "./mer-format";
