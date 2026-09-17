import { useLocation, useSearchParams } from "react-router";

import {
  DESK_IFRAME_NAV,
  deskNavHrefFromSearch,
  isDeskNavActive,
} from "../lib/desk-nav";

/**
 * One in-iframe tab rail. Sales-first order. No SCOREBOARD / RETAIN / SPEND
 * PLAN chips — those sat inline with tab names and read as word salad at
 * phone width (Marty Admin SAMPLE). Active page is the only painted state.
 */
export function DeskTopTabs({ shotMode = false }: { shotMode?: boolean }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  if (shotMode) return null;

  return (
    <nav className="mcfly-desk-tabs" aria-label="Desk pages" role="tablist">
      {DESK_IFRAME_NAV.map((item) => {
        const active = isDeskNavActive(item.path, location.pathname);
        return (
          <a
            key={item.path}
            role="tab"
            aria-selected={active}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "mcfly-desk-tabs__pill mcfly-desk-tabs__pill--on"
                : "mcfly-desk-tabs__pill"
            }
            href={deskNavHrefFromSearch(item.path, searchParams, item.hash)}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
