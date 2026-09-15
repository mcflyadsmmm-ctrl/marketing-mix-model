import { Fragment, useMemo, useState } from "react";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { spendChannelShortLabel } from "../lib/spend-channel-label";
import {
  ledgerForGrain,
  type CashControlBoard as CashControlBoardData,
  type LedgerGrain,
  type RollingWindow,
} from "../lib/mer-control";

const LEDGER_FILTERS: { id: "all" | "hit" | "miss"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "hit", label: "Hit goal" },
  { id: "miss", label: "Below goal" },
];

const LEDGER_GRAINS: { id: LedgerGrain; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
  { id: "year", label: "Year" },
];

function channelName(channel: string, labels?: Record<string, string>): string {
  if (channel === "Unmapped") return "Unmapped spend";
  const custom = labels?.[channel];
  if (custom) return custom;
  return spendChannelShortLabel({ channel });
}

function merCell(mer: number | null, spend: number): string {
  if (!(spend > 0) || mer == null) return "—";
  return `${formatMer(mer)}×`;
}

function vsPriorCell(window: RollingWindow): string {
  if (!(window.priorSpend > 0) || window.merChange == null) return "—";
  const change = window.merChange;
  if (Math.abs(change) < 0.005) return "even";
  const sign = change > 0 ? "+" : "";
  return `${sign}${formatMer(change)}×`;
}

function vsThisMonthCell(pct: number | null): string {
  if (pct == null || !Number.isFinite(pct)) return "—";
  const rounded = Math.round(pct);
  if (rounded === 0) return "even";
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

function hitRateLine(
  hitDays: number,
  eligible: number,
  hitRate: number | null,
  targetMer: number,
): string {
  if (!(eligible > 0) || hitRate == null)
    return "No spend days to score against goal.";
  return `${hitDays} of ${eligible} spend days hit ${formatMer(targetMer)}× goal.`;
}

function downloadLedgerCsv(
  rows: Array<{
    label: string;
    sales: number;
    spend: number;
    mer: number | null;
    hit: boolean | null;
  }>,
): void {
  const lines = [
    ["Period", "Sales", "Spend", "Total ROAS", "Goal"].join(","),
    ...rows.map((row) =>
      [
        row.label,
        row.sales,
        row.spend,
        row.mer ?? "",
        row.hit === true ? "Hit goal" : row.hit === false ? "Below goal" : "",
      ].join(","),
    ),
  ];
  const blob = new Blob([`${lines.join("\n")}\n`], {
    type: "text/csv;charset=utf-8",
  });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = "mcfly-sales-spend.csv";
  a.click();
  URL.revokeObjectURL(href);
}

/**
 * Spend room on Marketing after one typed day (or Sample on).
 * Mix is always on this page — not an Overview chapter.
 */
export function MarketingSpendRoom({
  board,
  channelLabels,
  intelOnly = false,
}: {
  board: CashControlBoardData;
  channelLabels?: Record<string, string>;
  intelOnly?: boolean;
}) {
  const [ledgerGrain, setLedgerGrain] = useState<LedgerGrain>("day");
  const [openLedgerKey, setOpenLedgerKey] = useState<string | null>(null);
  const [ledgerFilter, setLedgerFilter] = useState<"all" | "hit" | "miss">(
    "all",
  );

  const ledgerRows = useMemo(
    () =>
      board.drillDays.length
        ? ledgerForGrain(board.drillDays, ledgerGrain, board.targetMer)
        : board.ledger,
    [board.drillDays, board.ledger, ledgerGrain, board.targetMer],
  );
  const visibleLedger = useMemo(() => {
    if (ledgerFilter === "hit") return ledgerRows.filter((r) => r.hit === true);
    if (ledgerFilter === "miss") {
      return ledgerRows.filter((r) => r.hit === false);
    }
    return ledgerRows;
  }, [ledgerRows, ledgerFilter]);

  const intel = board.intel;

  return (
    <section
      className="mcfly-book mcfly-spend-room"
      aria-label={
        intelOnly
          ? "Last 7 and 28 day Total ROAS"
          : "Spend mix, plan, and every day"
      }
    >
      {intel ? (
        <div className="mcfly-spend-room__intel">
          <p className="mcfly-book__lede mcfly-spend-room__lede">
            {intel.takeaway}
          </p>
          <table className="mcfly-control__table">
            <caption>
              Last 7 and 28 days versus the windows before. Not which ad caused
              a sale.
            </caption>
            <thead>
              <tr>
                <th>Window</th>
                <th>Total ROAS</th>
                <th>vs prior window</th>
                <th>Sales</th>
                <th>Spend</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["Last 7 days", intel.rolling7],
                  ["Last 28 days", intel.rolling28],
                ] as const
              ).map(([label, window]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>{merCell(window.mer, window.spend)}</td>
                  <td>{vsPriorCell(window)}</td>
                  <td>{formatCurrency(window.sales)}</td>
                  <td>
                    {window.spend > 0 ? formatCurrency(window.spend) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mcfly-book__lede mcfly-spend-room__lede">
            {hitRateLine(
              intel.hitDays28,
              intel.eligibleDays28,
              intel.hitRate28,
              board.targetMer,
            )}
            {intel.topChannel28.name && intel.topChannel28.sharePct != null
              ? ` Biggest mapped channel: ${channelName(intel.topChannel28.name, channelLabels)} (${Math.round(intel.topChannel28.sharePct)}%).`
              : ""}
          </p>
          {intel.alerts.length > 0 ? (
            <ul className="mcfly-spend-room__alerts">
              {intel.alerts.map((alert) => (
                <li key={alert.code}>{alert.message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {!intelOnly && board.compareScores.length > 0 ? (
        <div className="mcfly-spend-room__compare">
          <table className="mcfly-control__table">
            <caption>
              Same calendar days so far versus last month and last year. Closed
              spend days only. Not which ad caused a sale.
            </caption>
            <thead>
              <tr>
                <th>Period</th>
                <th>Sales</th>
                <th>Sales vs this month</th>
                <th>Spend</th>
                <th>{PRODUCT_NOUN.totalRoas}</th>
              </tr>
            </thead>
            <tbody>
              {board.compareScores.map((row) => (
                <tr key={row.id}>
                  <td>{row.label}</td>
                  <td>{formatCurrency(row.sales)}</td>
                  <td>{vsThisMonthCell(row.salesChangePct)}</td>
                  <td>{row.spend > 0 ? formatCurrency(row.spend) : "—"}</td>
                  <td>{merCell(row.mer, row.spend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!intelOnly && ledgerRows.length > 0 ? (
        <details className="mcfly-spend-room__ledger">
          <summary className="mcfly-spend-room__ledger-sum">Every day</summary>
          <div
            className="mcfly-control__segmented"
            role="group"
            aria-label="Group days"
          >
            {LEDGER_GRAINS.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`mcfly-explorer__btn${ledgerGrain === g.id ? " mcfly-explorer__btn--on" : ""}`}
                aria-pressed={ledgerGrain === g.id}
                onClick={() => {
                  setLedgerGrain(g.id);
                  setOpenLedgerKey(null);
                }}
              >
                {g.label}
              </button>
            ))}
            {LEDGER_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`mcfly-explorer__btn${ledgerFilter === f.id ? " mcfly-explorer__btn--on" : ""}`}
                aria-pressed={ledgerFilter === f.id}
                onClick={() => setLedgerFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
            <button
              type="button"
              className="mcfly-explorer__btn"
              onClick={() => downloadLedgerCsv(visibleLedger)}
            >
              Download
            </button>
          </div>
          <table className="mcfly-control__table">
            <caption>
              {ledgerGrain === "day"
                ? "Last 14 finished days"
                : ledgerGrain === "month"
                  ? "Months this feed"
                  : ledgerGrain === "quarter"
                    ? "Quarters this feed"
                    : "Years this feed"}{" "}
              — click a row for the channel split.
            </caption>
            <thead>
              <tr>
                <th>
                  {ledgerGrain === "day"
                    ? "Day"
                    : ledgerGrain === "month"
                      ? "Month"
                      : ledgerGrain === "quarter"
                        ? "Quarter"
                        : "Year"}
                </th>
                <th>Sales</th>
                <th>Spend</th>
                <th>Total ROAS</th>
                <th>Goal</th>
              </tr>
            </thead>
            <tbody>
              {visibleLedger.length === 0 ? (
                <tr>
                  <td colSpan={5}>No days in this filter.</td>
                </tr>
              ) : (
                visibleLedger.map((row) => {
                  const open = openLedgerKey === row.key;
                  return (
                    <Fragment key={row.key}>
                      <tr
                        className={
                          open ? "mcfly-control__row--open" : undefined
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className="mcfly-control__text-btn"
                            aria-expanded={open}
                            onClick={() =>
                              setOpenLedgerKey(open ? null : row.key)
                            }
                          >
                            {row.label}
                          </button>
                        </td>
                        <td>{formatCurrency(row.sales)}</td>
                        <td>{formatCurrency(row.spend)}</td>
                        <td>{merCell(row.mer, row.spend)}</td>
                        <td>
                          {row.hit === true
                            ? "Hit goal"
                            : row.hit === false
                              ? "Below goal"
                              : "—"}
                        </td>
                      </tr>
                      {open ? (
                        <tr key={`${row.key}-split`}>
                          <td colSpan={5}>
                            <div className="mcfly-control__drawer">
                              {row.channels.length ? (
                                <ul className="mcfly-control__chan-list">
                                  {row.channels.map((ch) => (
                                    <li key={ch.channel}>
                                      {channelName(ch.channel, channelLabels)}{" "}
                                      {formatCurrency(ch.amount)}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p>No channel split this row.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </details>
      ) : null}
    </section>
  );
}
