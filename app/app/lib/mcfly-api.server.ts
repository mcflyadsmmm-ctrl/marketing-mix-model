import type {
  AllocationResponse,
  MerResponse,
} from "@mcfly/api-contract";
import {
  SAMPLE_DESK_MARGIN_PCT,
} from "./sample-desk.server";
import {
  channelMix,
  computeBreakEvenMer,
  computeMer,
  sumSpend,
  SPEND_CHANNEL_LABELS,
  type ChannelSpend,
} from "@mcfly/mer-engine";
import prisma from "../db.server";
import { getShopEntitlements } from "./entitlements.server";
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

async function loadEntitledSpends(
  shopId: string,
  shopDomain: string,
  range: ReturnType<typeof parseDateRange>,
  useSampleDesk: boolean,
): Promise<ChannelSpend[]> {
  const entitlements = getShopEntitlements(shopDomain, {
    sampleDesk: useSampleDesk,
  });
  const spendOpts = useSampleDesk
    ? { sampleOnly: true as const }
    : { excludeSample: true as const };
  const spends = await getSpendByChannel(shopId, range, spendOpts);
  if (useSampleDesk || entitlements.canUseAllChannels) return spends;
  const allowed = new Set(entitlements.allowedChannels);
  return spends.map((s) => (allowed.has(s.channel) ? s : { ...s, amount: 0 }));
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
  const useSampleDesk = Boolean(settings.useSampleDesk);
  const spends = await loadEntitledSpends(
    shop.id,
    shop.domain,
    range,
    useSampleDesk,
  );
  const totalSpend = sumSpend(spends);
  const mer = computeMer(sales, totalSpend);
  const marginPct = useSampleDesk
    ? SAMPLE_DESK_MARGIN_PCT
    : settings.marginPct;
  const breakEvenMer = computeBreakEvenMer(marginPct);
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
  const spends = await loadEntitledSpends(
    shop.id,
    shop.domain,
    range,
    Boolean(settings.useSampleDesk),
  );
  const totalSpend = sumSpend(spends);
  const breakEvenMer = computeBreakEvenMer(
    settings.useSampleDesk ? SAMPLE_DESK_MARGIN_PCT : settings.marginPct,
  );
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
