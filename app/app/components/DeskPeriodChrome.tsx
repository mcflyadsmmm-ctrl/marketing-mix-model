import { useLocation, useSearchParams } from "react-router";
import type { LiveIngestDepth } from "../lib/live-ingest-depth";
import { deskPeriodFromSearch } from "../lib/desk-stored-windows";
import { PeriodControl } from "./PeriodControl";

export function deskScoreboardTitle(
  pathname: string,
): "Orders" | "Spend" | "Customers" | null {
  const current = pathname.replace(/\/$/, "") || "/";
  if (current === "/app" || current === "/demo") return "Orders";
  if (current === "/app/spend" || current === "/demo/spend") return "Spend";
  if (current === "/app/customers" || current === "/demo/customers") return "Customers";
  return null;
}

/**
 * One header for Orders, Customers, and Spend.
 * The shell stays mounted. A tab swaps the panel under this control.
 */
export function DeskPeriodChrome({
  orderBookDepth,
  useSampleDesk,
  shotMode = false,
}: {
  orderBookDepth: LiveIngestDepth;
  useSampleDesk: boolean;
  shotMode?: boolean;
}) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  if (shotMode) return null;
  const title = deskScoreboardTitle(location.pathname);
  if (!title) return null;
  return (
    <header className="mcfly-scoreboard-chrome">
      <div className="mcfly-scoreboard__header">
        <h2 className="mcfly-scoreboard__title">{title}</h2>
        {useSampleDesk ? (
          <span className="mcfly-scoreboard__sample">SAMPLE</span>
        ) : null}
        <PeriodControl
          preset={deskPeriodFromSearch(searchParams.get("period"))}
          orderBookDepth={orderBookDepth}
        />
      </div>
    </header>
  );
}
