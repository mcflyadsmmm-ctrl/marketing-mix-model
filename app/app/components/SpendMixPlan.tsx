import { Fragment, useMemo, useState } from "react";
import { formatCurrency } from "../lib/mer-format";
import { spendChannelShortLabel } from "../lib/spend-channel-label";
import {
  channelDayRows,
  compareMix,
  mixRowsFromDays,
  mixWindowDays,
  siblingWindowDays,
  type CashControlBoard,
  type CertifiedDay,
  type MixCompareRow,
  type MixWindowId,
} from "../lib/mer-control";

const MIX_WINDOWS: { id: MixWindowId; label: string }[] = [
  { id: "mtd", label: "This month" },
  { id: "l7", label: "Last 7 days" },
  { id: "qtd", label: "This quarter" },
];

function channelName(channel: string, labels?: Record<string, string>): string {
  if (channel === "Unmapped") return "Unmapped spend";
  const custom = labels?.[channel];
  if (custom) return custom;
  return spendChannelShortLabel({ channel });
}

function shareChange(deltaPts: number): string {
  if (deltaPts === 0) return "Same share";
  return `${deltaPts > 0 ? "+" : "−"}${Math.round(Math.abs(deltaPts))} share`;
}

function vsCell(
  row: MixCompareRow | undefined,
  siblingHasDays: boolean,
): string {
  if (!siblingHasDays || !row) return "—";
  return shareChange(row.deltaPts);
}

function MixDayList({
  channel,
  days,
}: {
  channel: string;
  days: CertifiedDay[];
}) {
  const rows = channelDayRows(days, channel);
  if (!rows.length) return <p>No days in this window.</p>;

  return (
    <ul className="mcfly-control__chan-list">
      {rows.map((day) => {
        const amount =
          day.channels.find((item) => item.channel === channel)?.amount ?? 0;
        return (
          <li key={day.dateKey}>
            {day.dateKey} {formatCurrency(amount)}
          </li>
        );
      })}
    </ul>
  );
}

export function SpendMixPlan({
  board,
  channelLabels,
}: {
  board: CashControlBoard;
  channelLabels?: Record<string, string>;
}) {
  const [mixWindow, setMixWindow] = useState<MixWindowId>("mtd");
  const [openChannel, setOpenChannel] = useState<string | null>(null);
  const mixDays = useMemo(
    () =>
      board.drillDays.length
        ? mixWindowDays(board.drillDays, mixWindow)
        : board.mtdDays,
    [board.drillDays, board.mtdDays, mixWindow],
  );
  const mix = useMemo(() => mixRowsFromDays(mixDays), [mixDays]);
  const lastMonthDays = useMemo(
    () => siblingWindowDays(board.drillDays, "lastMonth"),
    [board.drillDays],
  );
  const lastYearDays = useMemo(
    () => siblingWindowDays(board.drillDays, "sameMonthLastYear"),
    [board.drillDays],
  );
  const lastMonthHasSpend = lastMonthDays.some((day) => day.spend > 0);
  const lastYearHasSpend = lastYearDays.some((day) => day.spend > 0);
  const lastMonthBy = useMemo(() => {
    const rows = lastMonthHasSpend ? compareMix(mixDays, lastMonthDays) : [];
    return new Map(rows.map((row) => [row.channel, row]));
  }, [lastMonthHasSpend, lastMonthDays, mixDays]);
  const lastYearBy = useMemo(() => {
    const rows = lastYearHasSpend ? compareMix(mixDays, lastYearDays) : [];
    return new Map(rows.map((row) => [row.channel, row]));
  }, [lastYearDays, lastYearHasSpend, mixDays]);
  const mixWindowLabel =
    MIX_WINDOWS.find((window) => window.id === mixWindow)?.label ??
    "This month";
  const mixColSpan = lastYearHasSpend ? 6 : 5;
  const plan = board.plan;
  const close = board.dualClose;

  return (
    <section className="mcfly-spend-room" aria-label="Spend mix and plan">
      <div className="mcfly-spend-room__mix">
        <div
          className="mcfly-control__segmented"
          role="group"
          aria-label="Spend mix window"
        >
          {MIX_WINDOWS.map((window) => (
            <button
              key={window.id}
              type="button"
              className={`mcfly-explorer__btn${mixWindow === window.id ? " mcfly-explorer__btn--on" : ""}`}
              aria-pressed={mixWindow === window.id}
              onClick={() => {
                setMixWindow(window.id);
                setOpenChannel(null);
              }}
            >
              {window.label}
            </button>
          ))}
        </div>
        {mix.length > 0 ? (
          <table className="mcfly-control__table">
            <caption>
              Spend mix · {mixWindowLabel} — click a channel for days. Share vs
              last month uses the full last month. Not which ad caused a sale.
            </caption>
            <thead>
              <tr>
                <th>Channel</th>
                <th>Spend</th>
                <th>Share</th>
                <th>Days</th>
                <th>vs last month</th>
                {lastYearHasSpend ? <th>vs last year</th> : null}
              </tr>
            </thead>
            <tbody>
              {mix.map((row) => {
                const open = openChannel === row.channel;
                return (
                  <Fragment key={row.channel}>
                    <tr
                      className={open ? "mcfly-control__row--open" : undefined}
                    >
                      <td>
                        <button
                          type="button"
                          className="mcfly-control__text-btn"
                          aria-expanded={open}
                          onClick={() =>
                            setOpenChannel(open ? null : row.channel)
                          }
                        >
                          {channelName(row.channel, channelLabels)}
                          {row.locked ? " · stays" : ""}
                        </button>
                      </td>
                      <td>{formatCurrency(row.spend)}</td>
                      <td>{Math.round(row.share * 100)}%</td>
                      <td>{row.activeDays}</td>
                      <td>
                        {vsCell(
                          lastMonthBy.get(row.channel),
                          lastMonthHasSpend,
                        )}
                      </td>
                      {lastYearHasSpend ? (
                        <td>{vsCell(lastYearBy.get(row.channel), true)}</td>
                      ) : null}
                    </tr>
                    {open ? (
                      <tr>
                        <td colSpan={mixColSpan}>
                          <div className="mcfly-control__drawer">
                            <p>
                              {formatCurrency(row.spend)} on {row.activeDays}{" "}
                              day{row.activeDays === 1 ? "" : "s"}
                              {row.note ? ` · ${row.note}` : ""}. Not which ad
                              caused a sale.
                            </p>
                            <MixDayList channel={row.channel} days={mixDays} />
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="mcfly-book__lede mcfly-spend-room__lede">
            No channel mix in this window yet.
          </p>
        )}
      </div>

      {plan ? (
        <div className="mcfly-spend-room__plan">
          <p className="mcfly-book__lede mcfly-spend-room__lede">
            Spend left at goal{" "}
            {plan.cannotHit
              ? "is already used. Freeze paid. Email stays as-is."
              : `${formatCurrency(Math.max(0, plan.maxRem))} left if last 7 days' sales hold. Email stays as-is.`}
            {close
              ? ` ${close.remainingDays} days left · paid ${formatCurrency(plan.paidDailyCap)} / day.`
              : null}
          </p>
          {plan.daily.length > 0 ? (
            <table className="mcfly-control__table">
              <caption>Daily spend cap for remaining days</caption>
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Last 7 days / day</th>
                  <th>Plan / day</th>
                </tr>
              </thead>
              <tbody>
                {plan.daily.map((row) => (
                  <tr key={row.channel}>
                    <td>
                      {channelName(row.channel, channelLabels)}
                      {row.locked ? " · stays" : ""}
                    </td>
                    <td>{formatCurrency(row.l7Daily)}</td>
                    <td>{formatCurrency(row.planDaily)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
