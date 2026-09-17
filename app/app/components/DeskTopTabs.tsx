import { useLocation, useSearchParams } from "react-router";

import {
  DESK_RETAIN_NAV,
  DESK_SCOREBOARD_NAV,
  DESK_SPEND_NAV,
  deskNavHrefFromSearch,
  isDeskNavActive,
  type DeskNavItem,
} from "../lib/desk-nav";

function TabGroup({
  label,
  items,
  pathname,
  search,
}: {
  label: string;
  items: readonly DeskNavItem[];
  pathname: string;
  search: URLSearchParams;
}) {
  return (
    <div className="mcfly-desk-tabs__group">
      <p className="mcfly-desk-tabs__k" aria-hidden="true">
        {label}
      </p>
      <div className="mcfly-desk-tabs__pills" role="tablist" aria-label={label}>
        {items.map((item) => {
          const active = isDeskNavActive(item.path, pathname);
          return (
            <a
              key={item.path}
              role="tab"
              aria-selected={active}
              className={
                active
                  ? "mcfly-desk-tabs__pill mcfly-desk-tabs__pill--on"
                  : "mcfly-desk-tabs__pill"
              }
              href={deskNavHrefFromSearch(item.path, search, item.hash)}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Black Clover grouped chip rail inside the iframe: SCOREBOARD | RETAIN | SPEND
 * PLAN, each with an inline kicker label and a divider. Side nav stays shortcuts.
 */
export function DeskTopTabs({ shotMode = false }: { shotMode?: boolean }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  if (shotMode) return null;

  return (
    <nav className="mcfly-desk-tabs" aria-label="Desk pages">
      <TabGroup
        label="Scoreboard"
        items={DESK_SCOREBOARD_NAV}
        pathname={location.pathname}
        search={searchParams}
      />
      <TabGroup
        label="Retain"
        items={DESK_RETAIN_NAV}
        pathname={location.pathname}
        search={searchParams}
      />
      <TabGroup
        label="Spend plan"
        items={DESK_SPEND_NAV}
        pathname={location.pathname}
        search={searchParams}
      />
    </nav>
  );
}
