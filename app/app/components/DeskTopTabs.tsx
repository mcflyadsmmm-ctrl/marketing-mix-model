import { Link, useLocation, useSearchParams } from "react-router";

import {
  DESK_IFRAME_NAV,
  deskNavHrefFromSearch,
  isDeskNavActive,
} from "../lib/desk-nav";

/**
 * Multi-row spaced pills. Sales-first order. No SCOREBOARD / RETAIN chips,
 * no Meta-ROAS hero, no single-row scroll strip — that smooshed labels into
 * one string at phone width after Fly v353 (Marty FAIL). Active = ink fill.
 * Link keeps switches inside the desk shell (not a full document reload).
 */
export function DeskTopTabs({ shotMode = false }: { shotMode?: boolean }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  if (shotMode) return null;

  return (
    <nav
      className="mcfly-desk-tabs mcfly-desk-tabs--pills"
      aria-label="Desk pages"
      role="tablist"
    >
      {DESK_IFRAME_NAV.map((item) => {
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
            to={deskNavHrefFromSearch(item.path, searchParams, item.hash)}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
