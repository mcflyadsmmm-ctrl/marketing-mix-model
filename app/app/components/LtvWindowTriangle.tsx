import { useState } from "react";
import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { useDeskDrill } from "./DeskDrill";
import { DeskIcon } from "./DeskIcon";
import {
  DEFAULT_COHORT_REVENUE_BASIS,
  FLAGSHIP_MIN_MATURE,
  cohortCellRevenue,
  cohortRevenueBasisLabel,
  cohortRevenueFormula,
  firstOrderWindowTriangle,
  type CohortRevenueBasis,
  type FlagshipMonthRow,
  type WindowTriangleCell,
  type WindowTriangleEmptyKind,
  type WindowTriangleRow,
} from "../lib/ltv-flagship";

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function emptyValue(kind: WindowTriangleEmptyKind): string {
  switch (kind) {
    case "syncing":
      return "Waiting on orders";
    case "thin":
      return "Waiting on a second month";
    case "young":
      return "Waiting on day 30";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

/**
 * Sealed cells use the desk truth green. Unsealed cells stay the grey hatch.
 * Intensity tracks the cell against the strongest sealed cell in that table
 * so a quiet book still reads, and a blank is never painted as $0 or 0%.
 */
function truthFill(intensity: number): { background: string; color: string } {
  const alpha = 0.12 + Math.min(1, Math.max(0, intensity)) * 0.76;
  return {
    background: `rgba(4, 120, 87, ${alpha.toFixed(3)})`,
    color: alpha > 0.48 ? "#fff" : "var(--mcfly-ink)",
  };
}

function maxSealed(rows: WindowTriangleRow[], pick: (cell: WindowTriangleCell) => number | null): number {
  let max = 0;
  for (const row of rows) {
    for (const cell of row.cells) {
      const value = pick(cell);
      if (value != null && value > max) max = value;
    }
  }
  return max;
}

function spentWhat(
  row: WindowTriangleRow,
  cell: WindowTriangleCell,
  display: string,
  sealed: boolean,
  basis: CohortRevenueBasis,
  grossMissing: boolean,
): string {
  if (grossMissing) {
    return `Gross order revenue is not on file for ${row.label} through ${cell.header.toLowerCase()}. Not $0. We do not invent it.`;
  }
  if (!sealed) {
    return cell.n > 0
      ? `${cell.n.toLocaleString()} buyers have lived ${cell.header.toLowerCase()}. Dollars wait until ${FLAGSHIP_MIN_MATURE} have — not $0.`
      : `No buyer from ${row.label} has lived ${cell.header.toLowerCase()} yet. Not $0.`;
  }
  switch (basis) {
    case "includes_refunds":
      return `${display} after refunds through ${cell.header.toLowerCase()} — order revenue − refunds attributed to cohort window.`;
    case "gross_orders":
      return `${display} order revenue before refunds through ${cell.header.toLowerCase()} among buyers who have lived it.`;
    default: {
      const _exhaustive: never = basis;
      return _exhaustive;
    }
  }
}

function TriangleCell({
  row,
  cell,
  display,
  intensity,
  kind,
  basis = DEFAULT_COHORT_REVENUE_BASIS,
}: {
  row: WindowTriangleRow;
  cell: WindowTriangleCell;
  display: string;
  intensity: number | null;
  kind: "back" | "spent";
  basis?: CohortRevenueBasis;
}) {
  const drill = useDeskDrill();
  const sealed = intensity != null;
  const fill = sealed ? truthFill(intensity) : null;
  const grossMissing =
    kind === "spent" &&
    basis === "gross_orders" &&
    cell.grossRevenue == null &&
    cell.revenue != null &&
    cell.n >= FLAGSHIP_MIN_MATURE;
  const what =
    kind === "back"
      ? sealed
        ? `${display} of buyers who have lived ${cell.header.toLowerCase()} placed a second order inside that window.`
        : cell.n > 0
          ? `${cell.n.toLocaleString()} buyers have lived ${cell.header.toLowerCase()}. The cell waits until ${FLAGSHIP_MIN_MATURE} have — not 0%.`
          : `No buyer from ${row.label} has lived ${cell.header.toLowerCase()} yet. Not 0%.`
      : spentWhat(row, cell, display, sealed, basis, grossMissing);

  return (
    <td
      className={
        sealed
          ? "mcfly-depth-heat__cell"
          : "mcfly-depth-heat__cell mcfly-depth-heat__cell--none"
      }
    >
      <button
        type="button"
        className="mcfly-depth-heat__btn"
        style={
          fill ?? {
            background: "transparent",
            color: "var(--mcfly-mute)",
          }
        }
        onClick={() =>
          drill?.openDrill({
            title: `${row.label} · ${cell.header}`,
            value: display,
            kicker:
              cell.n > 0
                ? `${cell.n.toLocaleString()} buyers have lived this window · ${row.customers.toLocaleString()} first ordered in ${row.label}`
                : `${row.customers.toLocaleString()} first ordered in ${row.label}`,
            blocks: [{ k: "What this is", v: what }],
            next: grossMissing
              ? "Gross order revenue is not on file. Not $0. Includes refunds still uses the Shopify current total."
              : "Blank cells are the corner not lived yet — not 0%, not $0. Order history only.",
            foot: "Order history only — never an email list.",
          })
        }
      >
        {display}
      </button>
    </td>
  );
}

function ComeBackTable({ rows }: { rows: WindowTriangleRow[] }) {
  const scale = maxSealed(rows, (cell) => cell.retention) || 1;
  return (
    <div className="mcfly-depth-tablewrap">
      <p className="mcfly-window-triangle__k">Who came back</p>
      <table
        className="mcfly-depth-table mcfly-depth-table--heat"
        aria-label="Who came back by first-order month"
      >
        <thead>
          <tr>
            <th scope="col">First order</th>
            <th scope="col">30 days</th>
            <th scope="col">90 days</th>
            <th scope="col">First year</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.monthKey}>
              <th scope="row">
                <span className="mcfly-depth-table__month">{row.label}</span>
                <span className="mcfly-depth-table__sub">
                  {row.customers.toLocaleString()}
                </span>
              </th>
              {row.cells.map((cell) => (
                <TriangleCell
                  key={cell.days}
                  row={row}
                  cell={cell}
                  display={cell.retention != null ? pct(cell.retention) : "—"}
                  intensity={
                    cell.retention != null ? Math.min(1, cell.retention / scale) : null
                  }
                  kind="back"
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RevenueTable({
  rows,
  basis,
}: {
  rows: WindowTriangleRow[];
  basis: CohortRevenueBasis;
}) {
  const currency = useDeskCurrency();
  const scale =
    maxSealed(rows, (cell) => cohortCellRevenue(cell, basis)) || 1;
  return (
    <div className="mcfly-depth-tablewrap">
      <p className="mcfly-window-triangle__k">What each first-order month spent</p>
      <table
        className="mcfly-depth-table mcfly-depth-table--heat"
        aria-label="Revenue by first-order month"
      >
        <thead>
          <tr>
            <th scope="col">First order</th>
            <th scope="col">30 days</th>
            <th scope="col">90 days</th>
            <th scope="col">First year</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.monthKey}>
              <th scope="row">
                <span className="mcfly-depth-table__month">{row.label}</span>
                <span className="mcfly-depth-table__sub">
                  {row.customers.toLocaleString()}
                </span>
              </th>
              {row.cells.map((cell) => {
                const money = cohortCellRevenue(cell, basis);
                return (
                  <TriangleCell
                    key={cell.days}
                    row={row}
                    cell={cell}
                    basis={basis}
                    display={
                      money != null ? formatCurrency(money, currency) : "—"
                    }
                    intensity={
                      money != null ? Math.min(1, money / scale) : null
                    }
                    kind="spent"
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Customers → LTV: 30 / 90 / 365 come-back triangle and dollars per
 * first-order month. Sits under the value-build chart. Blank corner stays
 * grey; sealed cells stay truth green. Order history only.
 */
export function LtvWindowTriangle({
  rows,
  buyers = 0,
  useSampleDesk = false,
}: {
  rows: FlagshipMonthRow[];
  buyers?: number;
  useSampleDesk?: boolean;
}) {
  const view = firstOrderWindowTriangle(rows, buyers);
  const [basis, setBasis] = useState<CohortRevenueBasis>(
    DEFAULT_COHORT_REVENUE_BASIS,
  );

  return (
    <section
      className="mcfly-book mcfly-depth mcfly-depth--soft mcfly-window-triangle"
      aria-label="30, 90, and first year by first-order month"
    >
      <div className="mcfly-depth-softhead">
        <h3 className="mcfly-chart__serif">
          <DeskIcon name="clock" />
          30 / 90 / first year by first order
        </h3>
        <p className="mcfly-chart__muted">
          {view.copy}
          {useSampleDesk
            ? " From Sample shop orders. Order history only, no spend."
            : " Order history only, no spend."}
        </p>
      </div>

      <div className="mcfly-window-triangle__basis">
        <div
          className="mcfly-period__group"
          role="group"
          aria-label="Revenue basis"
        >
          <button
            type="button"
            className="mcfly-period__btn"
            aria-pressed={basis === "includes_refunds"}
            onClick={() => setBasis("includes_refunds")}
          >
            {cohortRevenueBasisLabel("includes_refunds")}
          </button>
          <button
            type="button"
            className="mcfly-period__btn"
            aria-pressed={basis === "gross_orders"}
            onClick={() => setBasis("gross_orders")}
          >
            {cohortRevenueBasisLabel("gross_orders")}
          </button>
        </div>
        <p className="mcfly-chip mcfly-window-triangle__formula">
          {cohortRevenueFormula(basis)}
        </p>
      </div>
      <p className="mcfly-window-triangle__note">
        Shopify order history on this window. Not audited books. Not a Meta
        path-credit LTV. A blank cell is not 0% and not $0.
      </p>

      {view.kind === "ready" ? (
        <>
          <ComeBackTable rows={view.rows} />
          <RevenueTable rows={view.rows} basis={basis} />
        </>
      ) : (
        <TriangleEmpty kind={view.kind} copy={view.copy} verb={view.verb} />
      )}
    </section>
  );
}

function TriangleEmpty({
  kind,
  copy,
  verb,
}: {
  kind: WindowTriangleEmptyKind;
  copy: string;
  verb: string;
}) {
  const drill = useDeskDrill();
  return (
    <button
      type="button"
      className="mcfly-depth-flag__empty"
      data-kind={kind}
      onClick={() =>
        drill?.openDrill({
          title: "30 / 90 / first year",
          value: emptyValue(kind),
          kicker: verb,
          blocks: [
            { k: "What this is", v: copy },
            {
              k: "What fills next",
              v: `Two first-order months, then ${FLAGSHIP_MIN_MATURE} buyers who have lived 30 days in a month. Then 90 days, then the first year. Same math — no spend required.`,
            },
          ],
          next: "The blank corner is not 0% and not $0. Order history only.",
        })
      }
    >
      <span className="mcfly-depth-flag__empty-k">First-order months</span>
      <span className="mcfly-depth-flag__empty-verb">{verb}</span>
      <span className="mcfly-depth-flag__empty-v">{emptyValue(kind)}</span>
      <span className="mcfly-depth-flag__empty-line">{copy}</span>
    </button>
  );
}
