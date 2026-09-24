import { Link, useLocation, useSearchParams } from "react-router";

import { useDeskHref } from "../lib/desk-base-path";
import { deskNavHref, isDeskNavActive } from "../lib/desk-nav";
import { DESK_PANEL_RAIL_ADMIN_PATHS } from "../lib/desk-panel-rail";
import {
  liveDeskPanelChips,
  type LiveDeskNavState,
} from "../lib/live-desk-surface";

/**
 * In-page chips for the current analysis tab. `/demo` maps through useDeskHref
 * + isDeskNavActive. Goals omits the rail. shotMode is handled by DeskTopTabs.
 */
export function DeskPanelRail({
  liveDeskNav = null,
}: {
  liveDeskNav?: LiveDeskNavState | null;
}) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const deskHref = useDeskHref();

  const adminPath =
    DESK_PANEL_RAIL_ADMIN_PATHS.find((path) =>
      isDeskNavActive(path, location.pathname),
    ) ?? null;
  const chips = liveDeskPanelChips(location.pathname, liveDeskNav);
  if (!adminPath || chips.length === 0) return null;

  const hrefPath = deskHref(adminPath);
  const currentPanel = searchParams.get("panel");

  return (
    <nav className="mcfly-desk-panel-rail" aria-label="On this page">
      {chips.map((item) => {
        const active = currentPanel === item.panel;
        return (
          <Link
            key={item.id}
            data-live-desk-lock={item.locked ? item.panel : undefined}
            className={
              active
                ? "mcfly-desk-panel-rail__chip mcfly-desk-panel-rail__chip--on"
                : "mcfly-desk-panel-rail__chip"
            }
            to={deskNavHref(hrefPath, {
              period: searchParams.get("period"),
              shot: searchParams.get("shot") === "1",
              extra: { panel: item.panel },
            })}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
