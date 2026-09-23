import { Link, useLocation, useSearchParams } from "react-router";

import { DeskPanelRail } from "./DeskPanelRail";
import { useDeskHref } from "../lib/desk-base-path";
import {
  DESK_IFRAME_NAV,
  deskNavHrefFromSearch,
  isDeskNavActive,
  type DeskNavItem,
} from "../lib/desk-nav";
import {
  deskNavLabel,
  type LiveDeskNavState,
} from "../lib/live-desk-surface";

const SETTINGS_TAB: DeskNavItem = { path: "/app/settings", label: "Settings" };

/**
 * Multi-row spaced pills. Three analysis tabs (Home · Customers · Spend);
 * Settings only when asked (public /demo). No SCOREBOARD / RETAIN chips,
 * no Meta-ROAS hero, no single-row scroll strip. Active = ink fill.
 * Panel rail sits below.
 */
export function DeskTopTabs({
  shotMode = false,
  includeSettings = false,
  liveDeskNav = null,
}: {
  shotMode?: boolean;
  includeSettings?: boolean;
  liveDeskNav?: LiveDeskNavState | null;
}) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const deskHref = useDeskHref();

  if (shotMode) return null;

  const items = includeSettings
    ? [...DESK_IFRAME_NAV, SETTINGS_TAB]
    : DESK_IFRAME_NAV;

  return (
    <>
      <nav
        className="mcfly-desk-tabs mcfly-desk-tabs--pills"
        aria-label="Desk pages"
        role="tablist"
      >
        {items.map((item) => {
          const href = deskHref(item.path);
          const active = isDeskNavActive(item.path, location.pathname);
          const locked =
            item.path === "/app/customers" &&
            liveDeskNav?.customersLocked === true;
          const label = liveDeskNav ? deskNavLabel(item, liveDeskNav) : item.label;
          return (
            <Link
              key={item.path}
              role="tab"
              aria-selected={active}
              aria-current={active ? "page" : undefined}
              data-live-desk-lock={locked ? "customers" : undefined}
              className={[
                "mcfly-desk-tabs__pill",
                active ? "mcfly-desk-tabs__pill--on" : null,
                locked ? "mcfly-desk-tabs__pill--locked" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              to={deskNavHrefFromSearch(href, searchParams, item.hash)}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <DeskPanelRail liveDeskNav={liveDeskNav} />
    </>
  );
}
