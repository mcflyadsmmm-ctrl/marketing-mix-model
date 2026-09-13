/**
 * App nav — Black Clover Overview first, then Shopify depth, then spend wing.
 *
 * Spend is split on purpose (Marty 2026-09-13):
 * - Upload Spend = get dollars in (CSV / paste / bill) — one clear job
 * - Allocation = BC cut/hold/shift once spend exists — its own top tab
 * - Insights (Advanced) = spend-needed depth (explorer / recon) — subnav for now
 *
 * Core: Overview · Sales · Customers · Goals · Upload Spend · Allocation · Settings.
 * Days / Orders / Cohorts join core when their ledgers ship.
 */

export type DeskNavId =
  | "overview"
  | "sales"
  | "customers"
  | "goals"
  | "spend"
  | "allocation"
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
  { id: "overview", href: "/app", label: "Overview", later: false },
  { id: "sales", href: "/app/sales", label: "Sales", later: false },
  { id: "customers", href: "/app/customers", label: "Customers", later: false },
  { id: "goals", href: "/app/goals", label: "Goals", later: false },
  {
    id: "spend",
    href: "/app/spend",
    label: "Upload Spend",
    later: false,
  },
  {
    id: "allocation",
    href: "/app/allocation",
    label: "Allocation",
    later: false,
  },
  { id: "settings", href: "/app/settings", label: "Settings", later: false },
  {
    id: "advanced",
    href: "/app/advanced",
    label: "Spend insights",
    later: true,
  },
] as const;

/** Top nav only — core tabs. */
export function deskNavItems(): DeskNavItem[] {
  return DESK_NAV_ITEMS.filter((item) => !item.later).map((item) => ({
    ...item,
  }));
}

/** Full catalog including later depth pages. */
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
