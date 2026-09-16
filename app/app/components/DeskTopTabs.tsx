import { useLocation, useSearchParams } from "react-router";

import {
  DESK_SHOPIFY_NAV,
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
      <p className="mcfly-desk-tabs__k">{label}</p>
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

/** Black Clover–style page toggles inside the iframe. Side nav stays shortcuts. */
export function DeskTopTabs({ shotMode = false }: { shotMode?: boolean }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  if (shotMode) return null;

  return (
    <nav className="mcfly-desk-tabs" aria-label="Desk pages">
      <TabGroup
        label="Shopify"
        items={DESK_SHOPIFY_NAV}
        pathname={location.pathname}
        search={searchParams}
      />
      <TabGroup
        label="Spend"
        items={DESK_SPEND_NAV}
        pathname={location.pathname}
        search={searchParams}
      />
    </nav>
  );
}
