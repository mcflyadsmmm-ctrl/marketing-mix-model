import type { CashChipId } from "./mer-control";

export const OVERVIEW_YOY_IDS = ["mtd", "qtd", "ytd"] as const;

export type OverviewYoyId = (typeof OVERVIEW_YOY_IDS)[number];

export const OVERVIEW_YOY_LABELS: Record<OverviewYoyId, string> = {
  mtd: "This month",
  qtd: "This quarter",
  ytd: "This year",
};

/** Honest empty — never paint missing last year as $0. */
export const OVERVIEW_YOY_MISSING =
  "Same days last year not on file yet. Shopify orders on this install cover about 60 days — not $0.";

/** Pending sales — never paint this year as a finished $0. */
export const OVERVIEW_YOY_PENDING =
  "Sales for closed days are still loading — not $0.";

/** Shopify Analytics Overview is this period only; these cards add last year. */
export const OVERVIEW_YOY_ANALYTICS_LEDE = "Same days last year";

export type OverviewYoyZone = "up" | "down" | "even" | "empty";

/** When MTD/QTD/YTD collapse to the same ~60-day pull. */
export const OVERVIEW_YOY_SAME_WINDOW =
  "Month, quarter, and year are the same dollars until Shopify shares more than ~60 days of orders.";

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

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function parseDayKey(
  key: string,
): { year: number; month: number; day: number } | null {
  const [year, month, day] = key.split("-").map(Number);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }
  return { year, month, day };
}

/** Certified window on the card — never a global slicer. */
export function overviewWindowRange(
  fromKey: string | null,
  toKey: string | null,
): string | null {
  if (!fromKey || !toKey) return null;
  const from = parseDayKey(fromKey);
  const to = parseDayKey(toKey);
  if (!from || !to) return null;
  const fromMonth = MONTHS[from.month - 1];
  const toMonth = MONTHS[to.month - 1];
  if (!fromMonth || !toMonth) return null;
  if (from.year === to.year && from.month === to.month) {
    return `${fromMonth} ${from.day}–${to.day}`;
  }
  if (from.year === to.year) {
    return `${fromMonth} ${from.day} – ${toMonth} ${to.day}`;
  }
  return `${fromMonth} ${from.day}, ${from.year} – ${toMonth} ${to.day}, ${to.year}`;
}

export function overviewYoyZone(
  card: Pick<OverviewYoyCard, "delta" | "missingPrior">,
): OverviewYoyZone {
  if (card.missingPrior || card.delta == null) return "empty";
  if (card.delta > 0) return "up";
  if (card.delta < 0) return "down";
  return "even";
}

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

/** True when the three windows are the same pull (typical ~60-day install). */
export function overviewWindowsCollapsed(cards: OverviewYoyCard[]): boolean {
  if (cards.length < 2) return false;
  const first = Math.round(cards[0]?.sales ?? NaN);
  if (!Number.isFinite(first)) return false;
  return cards.every((card) => Math.round(card.sales) === first);
}
