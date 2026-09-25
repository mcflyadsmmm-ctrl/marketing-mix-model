/**
 * Cohorts from the first order. Equal month columns.
 * An empty month is null, not zero. A refund with a date reduces the cohort once.
 */

export const COHORT_GUEST_KEY = "guest";

export type CohortOrderInput = {
  customerKey: string;
  day: string;
  /** Placed net, or current net when no separate refund date exists. */
  net: number | null;
  refund?: { day: string; amount: number } | null;
};

export type CohortRow = {
  cohort: string;
  customers: number;
  repeatRate: number | null;
  medianDaysBetween: number | null;
  cells: Array<number | null>;
};

export type CohortGrid = {
  months: string[];
  rows: CohortRow[];
  medianDaysBetween: number | null;
};

export type CohortBoard = {
  status: "checked" | "loading" | "failed";
  grid: CohortGrid;
  undatedRefund: number | null;
  medianDaysBetween: number | null;
};

type BucketOrder = {
  day: string;
  month: string;
  net: number | null;
  refund: { day: string; month: string; amount: number } | null;
};

export function buildCohortGrid(
  orders: CohortOrderInput[],
  asOfDay: string,
): CohortGrid {
  const asOfMonth = asOfDay.slice(0, 7);
  const byCustomer = new Map<string, BucketOrder[]>();
  for (const order of orders) {
    if (!order.customerKey || order.customerKey === COHORT_GUEST_KEY) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(order.day)) continue;
    const list = byCustomer.get(order.customerKey) ?? [];
    list.push({
      day: order.day,
      month: order.day.slice(0, 7),
      net: order.net,
      refund:
        order.refund && /^\d{4}-\d{2}-\d{2}$/.test(order.refund.day)
          ? {
              day: order.refund.day,
              month: order.refund.day.slice(0, 7),
              amount: order.refund.amount,
            }
          : null,
    });
    byCustomer.set(order.customerKey, list);
  }

  const cohorts = new Map<string, Array<{ key: string; orders: BucketOrder[] }>>();
  for (const [key, list] of byCustomer) {
    list.sort((a, b) => a.day.localeCompare(b.day));
    const first = list[0];
    if (!first) continue;
    const members = cohorts.get(first.month) ?? [];
    members.push({ key, orders: list });
    cohorts.set(first.month, members);
  }

  const firstMonth = [...cohorts.keys()].sort()[0];
  if (!firstMonth) return { months: [], rows: [], medianDaysBetween: null };
  const months = monthSpan(firstMonth, asOfMonth);

  const rows: CohortRow[] = [...cohorts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([cohort, members]) => ({
      cohort,
      customers: members.length,
      repeatRate: repeatRate(members.map((member) => member.orders)),
      medianDaysBetween: medianDays(members.map((member) => member.orders)),
      cells: months.map((month) =>
        month < cohort || month > asOfMonth
          ? null
          : cumulative(members.map((member) => member.orders), month),
      ),
    }));

  return {
    months,
    rows,
    medianDaysBetween: medianDays([...cohorts.values()].flat().map((member) => member.orders)),
  };
}

function cumulative(members: BucketOrder[][], month: string): number | null {
  let activity = false;
  let total = 0;
  for (const orders of members) {
    for (const order of orders) {
      if (order.month > month) continue;
      if (order.month === month) activity = true;
      if (order.net == null || !Number.isFinite(order.net)) return null;
      if (order.month <= month) total += order.net;
      if (order.refund && order.refund.month <= month) {
        if (order.refund.month === month) activity = true;
        if (!Number.isFinite(order.refund.amount)) return null;
        total -= order.refund.amount;
      }
    }
  }
  if (!activity) return null;
  return total;
}

function repeatRate(members: BucketOrder[][]): number | null {
  if (members.length === 0) return null;
  const repeated = members.filter((orders) => orders.length >= 2).length;
  return repeated / members.length;
}

function medianDays(members: BucketOrder[][]): number | null {
  const gaps: number[] = [];
  for (const orders of members) {
    for (let i = 1; i < orders.length; i += 1) {
      const prev = orders[i - 1];
      const next = orders[i];
      if (!prev || !next) continue;
      gaps.push(daySpan(prev.day, next.day));
    }
  }
  if (gaps.length === 0) return null;
  gaps.sort((a, b) => a - b);
  const mid = Math.floor(gaps.length / 2);
  const upper = gaps[mid];
  if (upper == null) return null;
  if (gaps.length % 2 === 1) return upper;
  const lower = gaps[mid - 1];
  if (lower == null) return null;
  return (lower + upper) / 2;
}

function daySpan(start: string, end: string): number {
  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

function monthSpan(start: string, end: string): string[] {
  const months: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    months.push(cursor);
    cursor = nextMonth(cursor);
    if (months.length > 240) break;
  }
  return months;
}

function nextMonth(month: string): string {
  const year = Number(month.slice(0, 4));
  const mon = Number(month.slice(5, 7));
  const next = mon === 12 ? { year: year + 1, mon: 1 } : { year, mon: mon + 1 };
  return `${next.year}-${String(next.mon).padStart(2, "0")}`;
}
