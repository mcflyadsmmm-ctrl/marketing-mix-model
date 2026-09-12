/**
 * Black Clover channel-bar craft, applied to Shopify-only mix:
 * returning vs new sales, weekend vs weekday sales.
 * Pure — no spend required.
 */

import type { OrderEconomics } from "./order-economics";

export type SalesMixTone = "returning" | "new" | "weekend" | "weekday";

export type SalesMixBar = {
  id: string;
  label: string;
  amount: number;
  share: number;
  tone: SalesMixTone;
};

export type SalesMixGroup = {
  id: string;
  title: string;
  bars: SalesMixBar[];
};

export type SalesMixModel = {
  title: string;
  subtitle: string;
  groups: SalesMixGroup[];
};

function shareOf(part: number, total: number): number {
  if (!(total > 0) || !(part >= 0)) return 0;
  return part / total;
}

/**
 * Build pastel mix bars from order economics (Shopify sales spine).
 */
export function buildSalesMix(
  economics: OrderEconomics,
  periodLabel: string,
): SalesMixModel | null {
  if (!economics.hasSignal) return null;

  const groups: SalesMixGroup[] = [];

  const cohortTotal =
    economics.newCustomerSales + economics.returningCustomerSales;
  if (cohortTotal > 0) {
    groups.push({
      id: "cohort",
      title: "Buyer mix",
      bars: [
        {
          id: "returning",
          label: "Returning",
          amount: economics.returningCustomerSales,
          share: shareOf(economics.returningCustomerSales, cohortTotal),
          tone: "returning",
        },
        {
          id: "new",
          label: "New",
          amount: economics.newCustomerSales,
          share: shareOf(economics.newCustomerSales, cohortTotal),
          tone: "new",
        },
      ],
    });
  }

  const calendarTotal = economics.weekdaySales + economics.weekendSales;
  if (calendarTotal > 0) {
    groups.push({
      id: "calendar",
      title: "Calendar mix",
      bars: [
        {
          id: "weekday",
          label: "Weekday",
          amount: economics.weekdaySales,
          share: shareOf(economics.weekdaySales, calendarTotal),
          tone: "weekday",
        },
        {
          id: "weekend",
          label: "Weekend",
          amount: economics.weekendSales,
          share: shareOf(economics.weekendSales, calendarTotal),
          tone: "weekend",
        },
      ],
    });
  }

  if (groups.length === 0) return null;

  return {
    title: "Sales mix",
    subtitle: `${periodLabel} · Shopify order history — no spend required`,
    groups,
  };
}
