import type {
  AllocationResponse,
  MerResponse,
} from "@mcfly/api-contract";
import {
  channelMix,
  computeBreakEvenMer,
  computeMer,
  sumSpend,
  SPEND_CHANNEL_LABELS,
  type SpendChannel,
} from "@mcfly/mer-engine";
import prisma from "../db.server";
import { buildAllocationSuggestion, getOrCreateSettings, getSpendByChannel } from "./mer-dashboard.server";

const CHANNEL_LABELS = SPEND_CHANNEL_LABELS;

export interface DateRangeInput {
  from: string;
  to: string;
}

function parseDateRange(input: DateRangeInput) {
  const [fy, fm, fd] = input.from.split("-").map(Number);
  const [ty, tm, td] = input.to.split("-").map(Number);
  return {
    start: new Date(fy, fm - 1, fd),
    end: new Date(ty, tm - 1, td, 23, 59, 59, 999),
    label: `${input.from} → ${input.to}`,
  };
}

export async function buildMerResponse(
  shopId: string,
  rangeInput: DateRangeInput,
  sales: number,
  options: { includeAllocation?: boolean } = {},
): Promise<MerResponse> {
  const range = parseDateRange(rangeInput);
  const shop = await prisma.shop.findUniqueOrThrow({ where: { id: shopId } });

  const settings = await getOrCreateSettings(shop.id);
  const spends = await getSpendByChannel(shop.id, range);
  const totalSpend = sumSpend(spends);
  const mer = computeMer(sales, totalSpend);
  const breakEvenMer = computeBreakEvenMer(settings.marginPct);
  const mix = channelMix(spends);

  const allocation =
    options.includeAllocation !== false
      ? buildAllocationSuggestion(
          spends,
          sales,
          totalSpend,
          breakEvenMer,
        )
      : null;

  const channels = mix.map((entry) => ({
    name: CHANNEL_LABELS[entry.channel],
    spend: entry.amount,
    spendShare: entry.share,
    effectiveMer: entry.amount > 0 ? computeMer(sales * entry.share, entry.amount) : null,
  }));

  return {
    from: rangeInput.from,
    to: rangeInput.to,
    sales,
    spend: totalSpend,
    mer,
    breakEvenMer: breakEvenMer ?? 0,
    channels,
    allocation: allocation
      ? {
          suggestedTestDays: allocation.suggestedTestDays,
          why: allocation.why,
          actions: allocation.actions,
          isAboveBreakEven: allocation.isAboveBreakEven,
        }
      : undefined,
  };
}

export async function buildAllocationResponse(
  shopId: string,
  rangeInput: DateRangeInput,
  sales: number,
): Promise<AllocationResponse> {
  const mer = await buildMerResponse(shopId, rangeInput, sales, {
    includeAllocation: true,
  });
  const shop = await prisma.shop.findUniqueOrThrow({ where: { id: shopId } });
  const settings = await getOrCreateSettings(shop.id);
  const range = parseDateRange(rangeInput);
  const spends = await getSpendByChannel(shop.id, range);
  const totalSpend = sumSpend(spends);
  const breakEvenMer = computeBreakEvenMer(settings.marginPct);
  const allocation = buildAllocationSuggestion(
    spends,
    sales,
    totalSpend,
    breakEvenMer,
  );

  if (!allocation) {
    throw new Error("Invalid margin — cannot compute allocation");
  }

  return {
    from: rangeInput.from,
    to: rangeInput.to,
    breakEvenMer: breakEvenMer ?? 0,
    overallMer: mer.mer,
    allocation: {
      suggestedTestDays: allocation.suggestedTestDays,
      why: allocation.why,
      actions: allocation.actions,
      isAboveBreakEven: allocation.isAboveBreakEven,
    },
    channels: mer.channels,
  };
}
