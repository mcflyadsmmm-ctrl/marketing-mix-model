/**
 * App nav — Shopify depth first, Marketing Spend as its own wing.
 * Core: Sales · Customers · Goals · Marketing Spend · Settings.
 * Allocation / Advanced live under Marketing Spend subnav (later: true).
 */

export type DeskNavId =
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
  { id: "sales", href: "/app/sales", label: "Sales", later: false },
  { id: "customers", href: "/app/customers", label: "Customers", later: false },
  { id: "goals", href: "/app/goals", label: "Goals", later: false },
  {
    id: "spend",
    href: "/app/spend",
    label: "Marketing Spend",
    later: false,
  },
  { id: "settings", href: "/app/settings", label: "Settings", later: false },
  {
    id: "allocation",
    href: "/app/allocation",
    label: "Allocation",
    later: true,
  },
  {
    id: "advanced",
    href: "/app/advanced",
    label: "Advanced",
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
