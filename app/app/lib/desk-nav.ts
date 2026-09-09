/**
 * Cash-desk nav — every item earns its place.
 * Core ritual stays Overview · Spend · Settings. Later pages stay
 * visible (hiding tabs felt broken) but are labeled as depth.
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
  /** Depth after first trusted Total ROAS — still deep-linkable. */
  later: boolean;
};

export const DESK_NAV_ITEMS: readonly DeskNavItem[] = [
  // stay=1: Overview tab must reach cold empty / scoreboard without the
  // activation bounce that firstOpenRedirect applies to bare /app.
  { id: "overview", href: "/app?stay=1", label: "Overview", later: false },
  { id: "spend", href: "/app/spend", label: "Spend", later: false },
  { id: "settings", href: "/app/settings", label: "Settings", later: false },
  { id: "goals", href: "/app/goals", label: "Goals", later: true },
  {
    id: "allocation",
    href: "/app/allocation",
    label: PRODUCT_NOUN.spendAllocation,
    later: true,
  },
  { id: "ltv", href: "/app/ltv", label: "LTV", later: true },
  {
    id: "advanced",
    href: "/app/advanced",
    label: "Advanced",
    later: true,
  },
] as const;

/**
 * Full nav for a cash desk. Later items stay listed so the app does not
 * feel broken; pages soft-gate with “first get Total ROAS.”
 */
export function deskNavItems(): DeskNavItem[] {
  return DESK_NAV_ITEMS.map((item) => ({ ...item }));
}

export function deskNavCoreIds(): DeskNavId[] {
  return DESK_NAV_ITEMS.filter((item) => !item.later).map((item) => item.id);
}

export function deskNavLaterIds(): DeskNavId[] {
  return DESK_NAV_ITEMS.filter((item) => item.later).map((item) => item.id);
}
