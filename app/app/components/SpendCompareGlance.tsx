import { DeskIcon } from "./DeskIcon";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency } from "../lib/mer-format";
import type { PeriodDeltas } from "../lib/period-deltas";
import {
  SPEND_COMPARE_MISSING_LINE,
  SPEND_COMPARE_SECTION_LABEL,
  SPEND_PENDING_LINE,
  buildSpendCompareKpis,
} from "../lib/spend-first-viewport";

function deltaCopy(dir: "up" | "down" | "flat", pct: number, label: string): string {
  if (dir === "flat") return `Even vs ${label}`;
  const sign = dir === "up" ? "+" : "−";
  return `${sign}${Math.abs(Math.round(pct * 10) / 10)}% vs ${label}`;
}

function merDeltaCopy(dir: "up" | "down" | "flat", abs: number): string {
  if (dir === "flat") return "Even vs prior";
  const sign = dir === "up" ? "+" : "−";
  return `${sign}${Math.abs(Math.round(abs * 100) / 100)}× vs prior`;
}

/**
 * Compact vs-prior strip — sales, spend, Total ROAS. No essay.
 */
export function SpendCompareGlance({
  deltas,
  salesPending,
  sales,
  spend,
  mer,
}: {
  deltas: PeriodDeltas | null;
  salesPending: boolean;
  sales: number;
  spend: number;
  mer: number | null;
}) {
  const currency = useDeskCurrency();
  const money = (n: number) => formatCurrency(n, currency);
  const priorShort = deltas?.priorLabel?.toLowerCase() ?? "prior";

  if (salesPending) {
    return (
      <section
        className="mcfly-desk-anchor mcfly-yoy mcfly-yoy--glance mcfly-yoy--plane mcfly-yoy--metrics mcfly-spend-compare"
        aria-label={SPEND_COMPARE_SECTION_LABEL}
      >
        <h3 className="mcfly-yoy__h">{SPEND_COMPARE_SECTION_LABEL}</h3>
        <span className="mcfly-yoy__sr">{SPEND_PENDING_LINE}</span>
        <p className="mcfly-yoy__note mcfly-yoy__note--quiet">—</p>
      </section>
    );
  }

  const kpis = buildSpendCompareKpis({
    deltas,
    salesPending,
    sales,
    spend,
    mer,
    money,
  });

  if (kpis.length === 0) {
    return (
      <section
        className="mcfly-desk-anchor mcfly-yoy mcfly-yoy--glance mcfly-yoy--plane mcfly-yoy--metrics mcfly-spend-compare"
        aria-label={SPEND_COMPARE_SECTION_LABEL}
      >
        <h3 className="mcfly-yoy__h">{SPEND_COMPARE_SECTION_LABEL}</h3>
        <p className="mcfly-yoy__note mcfly-yoy__note--quiet">
          {SPEND_COMPARE_MISSING_LINE}
        </p>
      </section>
    );
  }

  return (
    <section
      className="mcfly-desk-anchor mcfly-yoy mcfly-yoy--glance mcfly-yoy--plane mcfly-yoy--metrics mcfly-spend-compare"
      aria-label={SPEND_COMPARE_SECTION_LABEL}
    >
      <h3 className="mcfly-yoy__h">{SPEND_COMPARE_SECTION_LABEL}</h3>
      <div className="mcfly-yoy__grid mcfly-yoy__grid--metrics">
        {kpis.map((kpi) => (
          <article
            className="mcfly-yoy__card mcfly-yoy__card--plane"
            key={kpi.key}
          >
            <p className="mcfly-yoy__k">
              <DeskIcon name={kpi.icon} />
              {kpi.label}
            </p>
            <p className="mcfly-yoy__v">{kpi.value}</p>
            {kpi.delta && kpi.key === "roas" && kpi.merDeltaAbs != null ? (
              <p className={`mcfly-yoy__vs mcfly-yoy__vs--${kpi.delta.dir}`}>
                {merDeltaCopy(kpi.delta.dir, kpi.merDeltaAbs)}
              </p>
            ) : kpi.delta && kpi.key !== "roas" && "pct" in kpi.delta ? (
              <p className={`mcfly-yoy__vs mcfly-yoy__vs--${kpi.delta.dir}`}>
                {deltaCopy(kpi.delta.dir, kpi.delta.pct, priorShort)}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
