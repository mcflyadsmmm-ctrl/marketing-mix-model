import { isDeskNavActive } from "./desk-nav";

export type DeskPanelChip = {
  id: string;
  panel: string;
  label: string;
};

function chip(id: string, label: string): DeskPanelChip {
  return { id, panel: id.replace(/^mcfly-/, ""), label };
}

/** Admin paths → in-page chips. Other lanes stamp matching `id="mcfly-…"`. */
export const DESK_PANEL_RAIL_BY_ADMIN_PATH: Readonly<
  Record<string, readonly DeskPanelChip[]>
> = {
  "/app": [],
  "/app/orders": [
    chip("mcfly-typical", "Typical"),
    chip("mcfly-clock", "Clock"),
    chip("mcfly-timing", "Timing"),
  ],
  "/app/customers": [
    chip("mcfly-returning", "Returning"),
    chip("mcfly-ltv", "LTV"),
    chip("mcfly-growth", "Growth"),
    chip("mcfly-depth", "Depth"),
  ],
  "/app/spend": [
    chip("mcfly-roas", "Total ROAS"),
    chip("mcfly-explorer", "Explorer"),
    chip("mcfly-mix", "Mix"),
    chip("mcfly-cpa", "CPA"),
    chip("mcfly-spend-add", "Add spend"),
  ],
};

export const DESK_PANEL_RAIL_ADMIN_PATHS = Object.keys(
  DESK_PANEL_RAIL_BY_ADMIN_PATH,
) as readonly string[];

export function deskPanelAdminPathForPathname(pathname: string): string | null {
  for (const adminPath of DESK_PANEL_RAIL_ADMIN_PATHS) {
    if (isDeskNavActive(adminPath, pathname)) return adminPath;
  }
  return null;
}

export function deskPanelChipsForPath(pathname: string): readonly DeskPanelChip[] {
  const adminPath = deskPanelAdminPathForPathname(pathname);
  if (!adminPath) return [];
  return DESK_PANEL_RAIL_BY_ADMIN_PATH[adminPath] ?? [];
}
