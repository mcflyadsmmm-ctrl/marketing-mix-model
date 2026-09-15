import type { CashChipId } from "./mer-control";

export const OVERVIEW_YOY_IDS = ["mtd", "qtd", "ytd"] as const;

export type OverviewYoyId = (typeof OVERVIEW_YOY_IDS)[number];

/** Honest empty — never paint missing last year as $0. */
export const OVERVIEW_YOY_MISSING =
  "Same days last year not on file yet. Shopify orders on this install cover about 60 days — not $0.";

export type OverviewYoyChip = {
  id: CashChipId | string;
  label: string;
  sales: number;
  /** Null when last year’s window has no certified days. */
  priorSales: number | null;
  yoySalesPct: number | null;
  fromKey: string | null;
  toKey: string | null;
};

export type OverviewYoyCard = {
  id: OverviewYoyId;
  label: string;
  sales: number;
  priorSales: number | null;
  delta: number | null;
  yoySalesPct: number | null;
  fromKey: string | null;
  toKey: string | null;
  missingPrior: boolean;
};

function isYoyId(id: string): id is OverviewYoyId {
  return id === "mtd" || id === "qtd" || id === "ytd";
}

/** Three YoY sales cards. Yesterday / last-7 never belong on Overview. */
export function buildOverviewYoyCards(
  chips: OverviewYoyChip[],
): OverviewYoyCard[] {
  const cards: OverviewYoyCard[] = [];
  for (const chip of chips) {
    if (!isYoyId(chip.id)) continue;
    const missingPrior = chip.priorSales == null;
    cards.push({
      id: chip.id,
      label: chip.label,
      sales: chip.sales,
      priorSales: chip.priorSales,
      delta:
        chip.priorSales == null ? null : chip.sales - chip.priorSales,
      yoySalesPct: missingPrior ? null : chip.yoySalesPct,
      fromKey: chip.fromKey,
      toKey: chip.toKey,
      missingPrior,
    });
  }
  return cards;
}
