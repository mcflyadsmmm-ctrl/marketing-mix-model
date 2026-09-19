import { Link, useLocation, useSearchParams } from "react-router";

import { useDeskHref } from "../lib/desk-base-path";
import {
  DESK_IFRAME_NAV,
  deskNavHrefFromSearch,
  isDeskNavActive,
  type DeskNavItem,
} from "../lib/desk-nav";

const SETTINGS_TAB: DeskNavItem = { path: "/app/settings", label: "Settings" };

/**
 * Multi-row spaced pills. Sales-first order. No SCOREBOARD / RETAIN chips,
 * no Meta-ROAS hero, no single-row scroll strip — that smooshed labels into
 * one string at phone width after Fly v353 (Marty FAIL). Active = ink fill.
 * Link keeps switches inside the desk shell (not a full document reload).
 */
export function DeskTopTabs({
  shotMode = false,
  includeSettings = false,
}: {
  shotMode?: boolean;
  includeSettings?: boolean;
}) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const deskHref = useDeskHref();

  if (shotMode) return null;

  const items = includeSettings
    ? [...DESK_IFRAME_NAV, SETTINGS_TAB]
    : DESK_IFRAME_NAV;

  return (
    <nav
      className="mcfly-desk-tabs mcfly-desk-tabs--pills"
      aria-label="Desk pages"
      role="tablist"
    >
      {items.map((item) => {
        const href = deskHref(item.path);
        const active = isDeskNavActive(item.path, location.pathname);
        return (
          <Link
            key={item.path}
            role="tab"
            aria-selected={active}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "mcfly-desk-tabs__pill mcfly-desk-tabs__pill--on"
                : "mcfly-desk-tabs__pill"
            }
            to={deskNavHrefFromSearch(href, searchParams, item.hash)}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
