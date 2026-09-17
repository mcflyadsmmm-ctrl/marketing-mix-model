import { useState } from "react";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import type { ShopifyNativePeriodStats } from "../lib/shopify-native-stats";
import type { ShopifyDepthStats } from "../lib/shopify-depth-stats";
import {
  customerConcentrationHeadline,
  customerConcentrationPareto,
  customerConcentrationRows,
  wholePercent,
  type ConcentrationRow,
} from "../lib/customers-scoreboard";

/**
 * Customer concentration — the Shopify Analytics gap made visual.
 *
 * A Pareto bar answers "how much rides on the top 10% of customers", then a
 * ladder ranks where this window's dollars concentrate (top buyers, returning,
 * repeat, biggest orders). Every bar is a share of Total Sales — dollars, not
 * headcount, and never a fake 0%. Interactive: tap a row for the formula.
 */
export function CustomerConcentrationChart({
  book,
  depth,
}: {
  book: ShopifyNativePeriodStats;
  depth: ShopifyDepthStats;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  const rows = customerConcentrationRows({
    topCustomerSalesShare: depth.topCustomerSalesShare,
    returningSalesShare: book.returningSalesShare,
    repeatSalesShare: depth.repeatSalesShare,
    topDecileSalesShare: depth.topDecileSalesShare,
  });
  const pareto = customerConcentrationPareto(depth.topCustomerSalesShare);
  const headline = customerConcentrationHeadline(depth.topCustomerSalesShare);
  const [active, setActive] = useState<ConcentrationRow | null>(rows[0] ?? null);

  if (rows.length === 0 && pareto == null) return null;

  const max = Math.max(...rows.map((row) => row.share), 0.01);
  const shown = active ?? rows[0] ?? null;

  const openRow = (row: ConcentrationRow) =>
    drill?.openDrill({
      title: row.label,
      value: `${wholePercent(row.share)}%`,
      kicker: "Share of this window's sales",
      blocks: [{ k: "What this is", v: row.detail }],
      next: "The scoreboard above keeps the formula next to each number. LTV turns concentration into 30 / 90 / 365-day value.",
      nextHref: "/app/ltv",
      nextLabel: "Open LTV",
    });

  return (
    <section
      className="mcfly-chart mcfly-cust-conc"
      aria-label="Customer concentration"
    >
      <div className="mcfly-chart__head">
        <p className="mcfly-chart__title">
          <DeskIcon name="chart" />
          Where the dollars concentrate
        </p>
        {shown ? (
          <div className="mcfly-cust-conc__readout" role="status">
            <span className="mcfly-cust-conc__readout-k">{shown.label}</span>
            <span className="mcfly-cust-conc__readout-v">
              {wholePercent(shown.share)}%
            </span>
          </div>
        ) : null}
      </div>

      {pareto ? (
        <button
          type="button"
          className="mcfly-cust-pareto"
          aria-label={headline ?? "Top 10% of customers"}
          onClick={() =>
            drill?.openDrill({
              title: "Top 10% of customers",
              value: `${pareto.topPct}% of sales`,
              kicker: headline ?? undefined,
              blocks: [
                {
                  k: "What this is",
                  v: "The highest-spending 10% of identified buyers and the share of sales they carry. The rest is every other identified buyer.",
                },
                {
                  k: "Why it matters",
                  v: "High concentration means a few accounts hold up the shop — losing one hurts. Low means demand is spread across many buyers.",
                },
              ],
              next: "LTV shows what those top buyers are worth over 30 / 90 / 365 days.",
              nextHref: "/app/ltv",
              nextLabel: "Open LTV",
            })
          }
        >
          <span className="mcfly-cust-pareto__bar">
            <span
              className="mcfly-cust-pareto__top"
              style={{ width: `${pareto.topPct}%` }}
            >
              <span className="mcfly-cust-pareto__seg-k">Top 10%</span>
            </span>
            <span className="mcfly-cust-pareto__rest">
              <span className="mcfly-cust-pareto__seg-k">Other 90%</span>
            </span>
          </span>
          <span className="mcfly-cust-pareto__cap">
            {headline ?? `Top 10% of customers · ${pareto.topPct}% of sales`}
          </span>
        </button>
      ) : null}

      <div className="mcfly-chart__hrows">
        {rows.map((row) => {
          const label = `${row.label} ${wholePercent(row.share)}%`;
          return (
            <button
              type="button"
              className={`mcfly-chart__hrow${row.lead ? " mcfly-cust-conc__hrow--lead" : ""}`}
              key={row.key}
              onClick={() => {
                setActive(row);
                openRow(row);
              }}
              onMouseEnter={() => setActive(row)}
              onFocus={() => setActive(row)}
              aria-label={label}
            >
              <span className="mcfly-chart__hlabel">{row.label}</span>
              <span className="mcfly-chart__htrack">
                <span
                  className="mcfly-chart__hfill"
                  style={{ width: `${Math.max(8, (row.share / max) * 100)}%` }}
                />
              </span>
              <span className="mcfly-chart__hvalue">
                {wholePercent(row.share)}%
              </span>
            </button>
          );
        })}
      </div>
      <p className="mcfly-cust-conc__foot">
        Share of Total Sales · dollars, not headcount.{" "}
        {book.returningSales != null
          ? `Returning ${formatCurrency(book.returningSales, currency)}.`
          : ""}
      </p>
    </section>
  );
}
