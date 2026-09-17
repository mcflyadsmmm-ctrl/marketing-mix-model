import { useEffect, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router";

import {
  DESK_IFRAME_NAV,
  deskNavHrefFromSearch,
  isDeskNavActive,
} from "../lib/desk-nav";

/**
 * One in-iframe tab rail. Sales-first order. No SCOREBOARD / RETAIN / SPEND
 * PLAN chips — those sat inline with tab names and read as word salad at
 * phone width (Marty Admin SAMPLE). Active page is the only painted state.
 * Link keeps switches inside the desk shell (not a full document reload).
 */
export function DeskTopTabs({ shotMode = false }: { shotMode?: boolean }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (shotMode) return;
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [location.pathname, shotMode]);

  if (shotMode) return null;

  return (
    <nav className="mcfly-desk-tabs" aria-label="Desk pages" role="tablist">
      {DESK_IFRAME_NAV.map((item) => {
        const active = isDeskNavActive(item.path, location.pathname);
        return (
          <Link
            key={item.path}
            ref={active ? activeRef : undefined}
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
