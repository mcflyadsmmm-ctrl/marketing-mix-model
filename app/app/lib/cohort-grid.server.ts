import prisma from "../db.server";
import { buildCohortGrid, type CohortBoard } from "./cohort-grid";
import { ORDER_FACT_GUEST_KEY, ORDER_FACT_SOURCE } from "./order-facts.server";
import { shopLocalDayKey } from "./shop-local-day";

const COHORT_ROW_CAP = 8000;

export type { CohortBoard };

function dayKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export async function loadCohortBoard(input: {
  shopId: string;
  timeZone: string | null | undefined;
  sample: boolean;
}): Promise<CohortBoard> {
  const empty: CohortBoard = {
    status: "failed",
    grid: { months: [], rows: [], medianDaysBetween: null },
    undatedRefund: null,
    medianDaysBetween: null,
  };
  const timeZone = input.timeZone?.trim() || "";
  if (!timeZone) return empty;
  const rows = await prisma.orderFact.findMany({
    where: {
      shopId: input.shopId,
      source: input.sample ? "sample" : ORDER_FACT_SOURCE,
      customerKey: { not: ORDER_FACT_GUEST_KEY },
    },
    select: {
      customerKey: true,
      shopLocalDate: true,
      amount: true,
      grossAmount: true,
    },
    orderBy: { shopLocalDate: "asc" },
    take: COHORT_ROW_CAP + 1,
  });
  if (rows.length > COHORT_ROW_CAP) {
    return {
      status: "loading",
      grid: { months: [], rows: [], medianDaysBetween: null },
      undatedRefund: null,
      medianDaysBetween: null,
    };
  }
  let undatedRefund: number | null = 0;
  const orders = rows.map((row) => {
    const grossKnown = row.grossAmount != null && Number.isFinite(row.grossAmount);
    if (!grossKnown) undatedRefund = null;
    else if (
      undatedRefund != null &&
      row.grossAmount != null &&
      row.grossAmount > row.amount
    ) {
      undatedRefund += row.grossAmount - row.amount;
    }
    return {
      customerKey: row.customerKey,
      day: dayKey(row.shopLocalDate),
      net: grossKnown ? row.grossAmount : row.amount,
    };
  });
  const grid = buildCohortGrid(orders, shopLocalDayKey(new Date(), timeZone));
  return {
    status: "checked",
    grid,
    undatedRefund: rows.length === 0 ? null : undatedRefund,
    medianDaysBetween: grid.medianDaysBetween,
  };
}
