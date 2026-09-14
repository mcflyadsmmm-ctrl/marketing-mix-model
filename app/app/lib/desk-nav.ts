/**
 * App nav — Black Clover top bar (tight), Shopify depth under subnav.
 *
 * Top (BC shape): Overview · Sales · Customers · Goals · Upload Spend ·
 * Allocation · Settings.
 *
 * Under Sales: Days · Orders (ledgers).
 * Under Customers: Cohorts.
 * Under Spend wing: Upload · Allocation · Spend insights.
 */

export type DeskNavId =
  | "overview"
  | "sales"
  | "days"
  | "orders"
  | "customers"
  | "cohorts"
  | "goals"
  | "spend"
  | "allocation"
  | "advanced"
  | "settings";

export type DeskNavItem = {
  id: DeskNavId;
  href: string;
  label: string;
  /** Secondary — not in the top nav chrome (reachable via subnav / deep link). */
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
  // Shopify depth — subnav under Sales / Customers, not top tabs
  { id: "days", href: "/app/days", label: "Days", later: true },
  { id: "orders", href: "/app/orders", label: "Orders", later: true },
  { id: "cohorts", href: "/app/cohorts", label: "Cohorts", later: true },
  {
    id: "advanced",
    href: "/app/advanced",
    label: "Spend insights",
    later: true,
  },
] as const;

/** Top nav only — BC-tight core tabs. */
export function deskNavItems(): DeskNavItem[] {
  return DESK_NAV_ITEMS.filter((item) => !item.later).map((item) => ({
    ...item,
  }));
}

/** Full catalog including depth pages. */
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

/** Sales wing subnav links (Sales · Days · Orders). */
export const SALES_DEPTH_LINKS = [
  { href: "/app/sales", label: "Sales" },
  { href: "/app/days", label: "Days" },
  { href: "/app/orders", label: "Orders" },
] as const;

/** Customers wing subnav links (Customers · Cohorts). */
export const CUSTOMERS_DEPTH_LINKS = [
  { href: "/app/customers", label: "Customers" },
  { href: "/app/cohorts", label: "Cohorts" },
] as const;
