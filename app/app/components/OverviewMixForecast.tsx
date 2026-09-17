import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { useDeskCurrency } from "../lib/desk-currency";
import {
  overviewMixForecastRead,
  overviewMixHistoryLine,
  type OverviewMixEmpty,
  type OverviewMixEmptyKind,
  type OverviewMixForecastView,
} from "../lib/overview-mix-forecast";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";

type Tone = "good" | "warn" | "plain";

function ActionCard({
  label,
  value,
  sub,
  tone = "plain",
  verb,
  detail,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
  verb: string;
  detail: string;
}) {
  const drill = useDeskDrill();
  const open = () =>
    drill?.openDrill({
      title: label,
      value,
      kicker: verb,
      blocks: [
        { k: "What this is", v: detail },
        sub ? { k: "Also", v: sub } : null,
      ].filter((b): b is { k: string; v: string } => b != null),
      next: "Order history only — not a Shopify returning-rate.",
    });
  const body = (
    <>
      <p className="mcfly-cust-kpi__verb">{verb}</p>
      <p className="mcfly-cust-kpi__k">{label}</p>
      <p className="mcfly-cust-kpi__v">{value}</p>
      {sub ? <p className="mcfly-cust-kpi__sub">{sub}</p> : null}
    </>
  );
  return drill ? (
    <button
      type="button"
      className={`mcfly-cust-kpi mcfly-cust-kpi--${tone} mcfly-cust-kpi--soft mcfly-cust-kpi--action`}
      onClick={open}
    >
      {body}
    </button>
  ) : (
    <div
      className={`mcfly-cust-kpi mcfly-cust-kpi--${tone} mcfly-cust-kpi--soft mcfly-cust-kpi--action`}
    >
      {body}
    </div>
  );
}

function emptyValue(empty: OverviewMixEmpty): string {
  switch (empty.kind) {
    case "syncing":
      return "Waiting on orders";
    case "thin":
    case "young":
      return `${empty.orders.toLocaleString()} on file`;
    default: {
      const _exhaustive: never = empty.kind;
      return _exhaustive;
    }
  }
}

function emptyFloor(kind: OverviewMixEmptyKind, need: number): string {
  switch (kind) {
    case "syncing":
    case "thin":
    case "young":
      return `Floor: ${need} orders, then 8 days with sales for a typical day — not $0.`;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/**
 * New vs returning $ mix + written-out month close. Soft dense Black Clover
 * — Today’s read, two ActionCards, formula chips. First-win empties are
 * ActionCard-shaped. Order history only. Typical / weekend / explorers stay.
 */
export function OverviewMixForecast({
  view,
  customersHref = "/app/customers",
}: {
  view: OverviewMixForecastView;
  customersHref?: string;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  const empty = view.empty;
  const read = overviewMixForecastRead(view);

  if (empty) {
    return (
      <section
        className="mcfly-panel mcfly-cust-card mcfly-cust-card--soft mcfly-ov-mix"
        aria-label="New vs returning dollars"
      >
        <div className="mcfly-panel__head">
          <h2>New vs returning $</h2>
          <p className="mcfly-panel__muted">Mix · month close from typical day</p>
        </div>
        <button
          type="button"
          className="mcfly-cust-rfm__empty"
          data-kind={empty.kind}
          onClick={() =>
            drill?.openDrill({
              title: "New vs returning $",
              value: emptyValue(empty),
              kicker: empty.verb,
              blocks: [
                { k: "What this is", v: empty.copy },
                {
                  k: "What fills next",
                  v: `Floor: ${empty.need} paid orders with identified buyers. Then 8 days with sales for a typical day, then so far + remaining days × typical day. Same math — order history only.`,
                },
              ],
              next: "Order history only — not a Shopify returning-rate.",
              nextHref: customersHref,
              nextLabel: `Open ${PRODUCT_NOUN.buyersTitle}`,
            })
          }
        >
          <span className="mcfly-cust-rfm__empty-k">First win</span>
          <span className="mcfly-cust-rfm__empty-verb">{empty.verb}</span>
          <span className="mcfly-cust-rfm__empty-v">{emptyValue(empty)}</span>
          <span className="mcfly-cust-rfm__empty-line">{empty.copy}</span>
          <span className="mcfly-cust-rfm__empty-line">
            {emptyFloor(empty.kind, empty.need)}
          </span>
        </button>
        <div
          className="mcfly-cust-empty__ghost mcfly-cust-empty__ghost--bars"
          aria-hidden="true"
        >
          {[0.42, 0.68, 0.51, 0.8, 0.44].map((h, i) => (
            <span key={i} className="mcfly-cust-empty__col">
              <span
                className="mcfly-cust-empty__col-a"
                style={{ height: `${h * 100}%` }}
              />
              <span
                className="mcfly-cust-empty__col-b"
                style={{ height: `${Math.max(16, (1 - h) * 60)}%` }}
              />
            </span>
          ))}
        </div>
      </section>
    );
  }

  const mix = view.mix;
  const forecast = view.forecast;
  const returningPct = mix ? Math.round(mix.returningShare * 100) : 0;
  const newMoney = mix ? formatCurrency(mix.newSales, currency) : "—";
  const returningMoney = mix ? formatCurrency(mix.returningSales, currency) : "—";
  const closeMoney = forecast
    ? formatCurrency(forecast.projected, currency)
    : "—";

  return (
    <section
      className="mcfly-panel mcfly-cust-card mcfly-cust-card--soft mcfly-ov-mix mcfly-desk-anchor"
      aria-label="New vs returning dollars"
    >
      <div className="mcfly-panel__head">
        <h2>New vs returning $</h2>
        <p className="mcfly-panel__muted">{overviewMixHistoryLine(view)}</p>
      </div>

      {read ? (
        <button
          type="button"
          className="mcfly-ov-mix__read"
          onClick={() =>
            drill?.openDrill({
              title: "New vs returning $",
              value:
                forecast != null
                  ? formatCurrency(forecast.projected, currency)
                  : mix
                    ? pct(mix.returningShare)
                    : "—",
              kicker: "Today’s read",
              blocks: [
                { k: "What this is", v: read.line },
                mix
                  ? {
                      k: "The mix",
                      v: `Returning ${returningMoney} (${pct(mix.returningShare)}) · new ${newMoney} (${pct(mix.newShare)}). Dollars, not Shopify’s returning-customer rate.`,
                    }
                  : null,
                forecast
                  ? {
                      k: "The close",
                      v: forecast.closed
                        ? `${forecast.formulaEq} ${formatCurrency(forecast.soFar, currency)}.`
                        : `${forecast.formulaEq}. ${formatCurrency(forecast.soFar, currency)} + ${forecast.remainingDays} × ${formatCurrency(forecast.typicalDay, currency)} = ${formatCurrency(forecast.projected, currency)}.`,
                    }
                  : {
                      k: "The close",
                      v:
                        view.forecastEmpty?.copy ??
                        "Month close waits on 8 days with sales — not $0.",
                    },
              ].filter((b): b is { k: string; v: string } => b != null),
              next: "Order history only — not a promise.",
              nextHref: customersHref,
              nextLabel: `Open ${PRODUCT_NOUN.buyersTitle}`,
            })
          }
        >
          <span className="mcfly-ov-mix__read-k">Today’s read</span>
          <span className="mcfly-ov-mix__read-v">{closeMoney}</span>
          <span className="mcfly-ov-mix__read-line">{read.line}</span>
        </button>
      ) : null}

      <div className="mcfly-cust-kpis mcfly-cust-kpis--actions">
        <ActionCard
          label="Returning $"
          value={returningMoney}
          sub={mix ? `${pct(mix.returningShare)} · new ${newMoney}` : undefined}
          tone="good"
          verb="Mix"
          detail="Sales from returning buyers in this window, over new $ + returning $. Guests stay out. Shopify Analytics Overview is a returning-customer rate — headcount."
        />
        <ActionCard
          label="Month close"
          value={closeMoney}
          sub={
            forecast
              ? forecast.closed
                ? "month done — so far, not a pace"
                : `${forecast.remainingDays} days × typical day`
              : view.forecastEmpty?.copy
          }
          tone="plain"
          verb="Close"
          detail={
            forecast
              ? forecast.closed
                ? "This month is done. The close is so far — not remaining days times a typical day."
                : `${forecast.formulaEq}. Typical day is the median of stored days with sales — not a black box.`
              : (view.forecastEmpty?.copy ??
                "Month close waits on 8 days with sales — not $0.")
          }
        />
      </div>

      {mix ? (
        <div
          className="mcfly-ov-mix__bar"
          aria-hidden="true"
          title={`Returning ${pct(mix.returningShare)} · new ${pct(mix.newShare)}`}
        >
          <span className="mcfly-ov-mix__track">
            <span
              className="mcfly-ov-mix__bar-ret"
              style={{ width: `${returningPct}%` }}
            />
          </span>
          <span className="mcfly-ov-mix__bar-legend">
            Returning {pct(mix.returningShare)} · new {pct(mix.newShare)}
          </span>
        </div>
      ) : null}

      {forecast ? (
        <button
          type="button"
          className="mcfly-depth-formula__card"
          onClick={() =>
            drill?.openDrill({
              title: "Month close",
              value: formatCurrency(forecast.projected, currency),
              kicker: "Written out",
              blocks: [
                { k: "Formula", v: forecast.formulaEq },
                {
                  k: "Plugged in",
                  v: forecast.closed
                    ? `${formatCurrency(forecast.soFar, currency)} (month done)`
                    : `${formatCurrency(forecast.soFar, currency)} + ${forecast.remainingDays} × ${formatCurrency(forecast.typicalDay, currency)} = ${formatCurrency(forecast.projected, currency)}`,
                },
                {
                  k: "Typical day",
                  v: `Median of ${view.factDays.toLocaleString()} stored days with sales. ${overviewMixHistoryLine(view)}`,
                },
              ],
              next: "Order history only — if the typical day holds, not a promise.",
            })
          }
        >
          <p className="mcfly-depth-formula__eq">{forecast.formulaEq}</p>
          <div className="mcfly-depth-formula__parts">
            <span className="mcfly-depth-formula__part">
              <span className="mcfly-depth-formula__part-k">So far</span>
              <span className="mcfly-depth-formula__part-v">
                {formatCurrency(forecast.soFar, currency)}
              </span>
            </span>
            <span className="mcfly-depth-formula__part">
              <span className="mcfly-depth-formula__part-k">Days left</span>
              <span className="mcfly-depth-formula__part-v">
                {forecast.closed ? "0" : String(forecast.remainingDays)}
              </span>
            </span>
            <span className="mcfly-depth-formula__part">
              <span className="mcfly-depth-formula__part-k">Typical day</span>
              <span className="mcfly-depth-formula__part-v">
                {formatCurrency(forecast.typicalDay, currency)}
              </span>
            </span>
          </div>
          <p className="mcfly-depth-formula__plug">
            {forecast.closed
              ? `${formatCurrency(forecast.soFar, currency)} (month done)`
              : `${formatCurrency(forecast.soFar, currency)} + ${forecast.remainingDays} × ${formatCurrency(forecast.typicalDay, currency)} = ${formatCurrency(forecast.projected, currency)}`}
          </p>
          <p className="mcfly-depth-formula__obs">
            If the typical day holds — median of stored days with sales, not a
            black box.
          </p>
        </button>
      ) : view.forecastEmpty ? (
        <button
          type="button"
          className="mcfly-cust-rfm__empty"
          data-kind={view.forecastEmpty.kind}
          onClick={() =>
            drill?.openDrill({
              title: "Month close",
              value: "Waiting on a typical day",
              kicker: view.forecastEmpty?.verb,
              blocks: [
                { k: "What this is", v: view.forecastEmpty!.copy },
                {
                  k: "What fills next",
                  v: "Floor: 8 days with sales. Then so far + remaining days × the median day.",
                },
              ],
              next: "Order history only.",
            })
          }
        >
          <span className="mcfly-cust-rfm__empty-verb">
            {view.forecastEmpty.verb}
          </span>
          <span className="mcfly-cust-rfm__empty-line">
            {view.forecastEmpty.copy}
          </span>
        </button>
      ) : null}

      <p className="mcfly-ov-mix__meta">
        <DeskIcon name="customers" /> Dollars, not headcount. Shopify Analytics
        Overview is a returning-customer rate.
      </p>
    </section>
  );
}
