/**
 * App nav — Shopify Analytics calm: few primary tabs, depth via pages.
 * Core: Overview · Customers & LTV · Spend · Goals · Settings.
 * Allocation / Advanced stay deep-linked from Overview + Settings.
 */

import { PRODUCT_NOUN } from "./product-labels";

export type DeskNavId =
  | "overview"
  | "spend"
  | "goals"
  | "allocation"
  | "ltv"
  | "advanced"
  | "settings";

export type DeskNavItem = {
  id: DeskNavId;
  href: string;
  label: string;
  /** Secondary tools — not in the top nav chrome. */
  later: boolean;
};

export const DESK_NAV_ITEMS: readonly DeskNavItem[] = [
  // stay=1 kept for deep links; Overview no longer bounces cold merchants to Spend.
  { id: "overview", href: "/app?stay=1", label: "Overview", later: false },
  // Customer + order depth is core mission — not buried behind spend tools.
  {
    id: "ltv",
    href: "/app/ltv",
    label: PRODUCT_NOUN.ltvTitle,
    later: false,
  },
  { id: "spend", href: "/app/spend", label: "Spend", later: false },
  // Target MER / break-even — merchants need this without hunting Settings.
  { id: "goals", href: "/app/goals", label: "Goals", later: false },
  { id: "settings", href: "/app/settings", label: "Settings", later: false },
  {
    id: "allocation",
    href: "/app/allocation",
    label: PRODUCT_NOUN.spendAllocation,
    later: true,
  },
  {
    id: "advanced",
    href: "/app/advanced",
    label: "Advanced",
    later: true,
  },
] as const;

/**
 * Top nav only — core tabs. Matches Shopify Analytics calm (few destinations).
 */
export function deskNavItems(): DeskNavItem[] {
  return DESK_NAV_ITEMS.filter((item) => !item.later).map((item) => ({
    ...item,
  }));
}

/** Full catalog including later depth pages (for footers / settings links). */
export function deskNavAllItems(): DeskNavItem[] {
  return DESK_NAV_ITEMS.map((item) => ({ ...item }));
}

export function deskNavCoreIds(): DeskNavId[] {
  return DESK_NAV_ITEMS.filter((item) => !item.later).map((item) => item.id);
}

export function deskNavLaterIds(): DeskNavId[] {
  return DESK_NAV_ITEMS.filter((item) => item.later).map((item) => item.id);
}

export function deskNavLaterItems(): DeskNavItem[] {
  return DESK_NAV_ITEMS.filter((item) => item.later).map((item) => ({
    ...item,
  }));
}
