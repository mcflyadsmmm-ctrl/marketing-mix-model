import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import {
  DESK_OVERVIEW_TABS,
  deskNavHrefFromSearch,
  isOverviewHomeStage,
  type DeskSectionId,
} from "../lib/desk-nav";

/**
 * As-of + share on Overview. No Compare / Ledger / Channels / Plan strip.
 */
export function DeskOverviewTabs({
  stage,
  shotMode = false,
  end,
}: {
  stage: DeskSectionId;
  shotMode?: boolean;
  end?: ReactNode;
}) {
  if (shotMode) return null;
  if (DESK_OVERVIEW_TABS.length === 0) {
    return end ? (
      <div className="mcfly-desk-chrome">
        <div className="mcfly-desk-chrome__meta">{end}</div>
      </div>
    ) : null;
  }

  return <DeskOverviewTabStrip stage={stage} end={end} />;
}

function DeskOverviewTabStrip({
  stage,
  end,
}: {
  stage: DeskSectionId;
  end?: ReactNode;
}) {
  const [search] = useSearchParams();

  return (
    <div className="mcfly-desk-chrome">
      <nav className="mcfly-desk-tabs" aria-label="Scoreboard views">
        {DESK_OVERVIEW_TABS.map((item) => {
          const href = deskNavHrefFromSearch(item.path, search, item.hash);
          const on = item.hash
            ? stage === item.hash
            : isOverviewHomeStage(stage);
          return (
            <Link
              key={item.label}
              to={href}
              className={on ? "mcfly-desk-tabs__on" : undefined}
              preventScrollReset
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {end ? <div className="mcfly-desk-chrome__meta">{end}</div> : null}
    </div>
  );
}
