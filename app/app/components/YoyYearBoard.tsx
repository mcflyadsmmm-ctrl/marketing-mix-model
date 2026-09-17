import { formatCurrency, formatMer } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { spendChannelShortLabel } from "../lib/spend-channel-label";
import {
  formatYoyPct,
  YOY_CHANNEL_EMPTY,
  YOY_CHANNEL_NO_LY,
  yoyDisplayValue,
  type YoyChannelRow,
  type YoyMonthRow,
} from "../lib/yoy-workspace";

function toneClass(pct: number | null, isFuture: boolean): string {
  if (isFuture) return "mcfly-yoy-board__row--future";
  if (pct == null) return "";
  if (pct > 0) return "mcfly-yoy-board__row--up";
  if (pct < 0) return "mcfly-yoy-board__row--down";
  return "mcfly-yoy-board__row--flat";
}

export function YoyYearBoard({
  months,
  year,
  hasSpend,
}: {
  months: YoyMonthRow[];
  year: number;
  hasSpend: boolean;
}) {
  const currency = useDeskCurrency();
  const money = (value: number | null) =>
    yoyDisplayValue(value, (amount) => formatCurrency(amount, currency));
  const merLabel = (value: number | null) =>
    value == null ? "—" : `${formatMer(value)}×`;

  return (
    <section className="mcfly-yoy-board mcfly-yoy-board--soft" aria-label={`${year} monthly board`}>
      <div className="mcfly-yoy-board__head">
        <h3 className="mcfly-yoy-board__title">{year} · 12-month board</h3>
        <p className="mcfly-yoy-board__lede">
          Actual · prior · YoY %{hasSpend ? " · spend and Total ROAS when typed" : ""}.
          Missing last year is — not $0.
        </p>
      </div>
      <div className="mcfly-yoy-board__wrap">
        <table className="mcfly-yoy-board__table">
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Actual</th>
              <th scope="col">Prior</th>
              <th scope="col">YoY</th>
              {hasSpend ? <th scope="col">Spend</th> : null}
              {hasSpend ? <th scope="col">LY spend</th> : null}
              {hasSpend ? <th scope="col">Total ROAS</th> : null}
            </tr>
          </thead>
          <tbody>
            {months.map((row) => (
              <tr
                key={row.key}
                className={[
                  "mcfly-yoy-board__row",
                  row.isCurrent ? "mcfly-yoy-board__row--current" : "",
                  toneClass(row.yoyPct, row.isFuture),
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <th scope="row">
                  {row.label}
                  {row.isCurrent ? (
                    <span className="mcfly-yoy-board__now"> MTD</span>
                  ) : null}
                </th>
                <td>{money(row.actual)}</td>
                <td>{money(row.prior)}</td>
                <td>{formatYoyPct(row.yoyPct)}</td>
                {hasSpend ? <td>{money(row.spend)}</td> : null}
                {hasSpend ? <td>{money(row.priorSpend)}</td> : null}
                {hasSpend ? <td>{merLabel(row.mer)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function YoyChannelBoard({
  rows,
  year,
  lastYearHasSpend,
  channelLabels,
}: {
  rows: YoyChannelRow[];
  year: number;
  lastYearHasSpend: boolean;
  channelLabels?: Record<string, string>;
}) {
  const currency = useDeskCurrency();
  const money = (value: number | null) =>
    yoyDisplayValue(value, (amount) => formatCurrency(amount, currency));
  const shareLabel = (share: number | null) =>
    share == null ? "—" : `${Math.round(share * 100)}%`;

  return (
    <section
      className="mcfly-yoy-chan mcfly-yoy-chan--soft"
      aria-label={`Channel spend vs ${year - 1}`}
    >
      <div className="mcfly-yoy-board__head">
        <h3 className="mcfly-yoy-board__title">Channel vs last year</h3>
        <p className="mcfly-yoy-board__lede">
          Typed spend only — not which ad caused a sale.
          {lastYearHasSpend
            ? ` ${year} vs ${year - 1}.`
            : ` ${YOY_CHANNEL_NO_LY}`}
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="mcfly-yoy-chan__empty">{YOY_CHANNEL_EMPTY}</p>
      ) : (
        <div className="mcfly-yoy-board__wrap">
          <table className="mcfly-yoy-board__table">
            <thead>
              <tr>
                <th scope="col">Channel</th>
                <th scope="col">{year}</th>
                <th scope="col">{year - 1}</th>
                <th scope="col">vs last year</th>
                <th scope="col">Share</th>
                <th scope="col">LY share</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.channel} className="mcfly-yoy-board__row">
                  <th scope="row">
                    {row.channel === "Unmapped"
                      ? "Unmapped spend"
                      : spendChannelShortLabel({
                          channel: row.channel,
                          customLabel: channelLabels?.[row.channel],
                        })}
                  </th>
                  <td>{money(row.spend)}</td>
                  <td>{money(row.priorSpend)}</td>
                  <td>{formatYoyPct(row.vsPct)}</td>
                  <td>{shareLabel(row.share)}</td>
                  <td>{shareLabel(row.priorShare)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
