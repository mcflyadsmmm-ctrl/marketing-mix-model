import { useEffect } from "react";
import { YoyChannelBoard, YoyYearBoard } from "./YoyYearBoard";
import { YoyYearChart } from "./YoyYearChart";
import type { CertifiedDay } from "../lib/mer-control";
import {
  OVERVIEW_YOY_MISSING,
  OVERVIEW_YOY_PENDING,
} from "../lib/overview-yoy";
import {
  OVERVIEW_YOY_YEAR_ID,
  overviewPanelElementId,
} from "../lib/overview-first-viewport";
import {
  YOY_ANALYTICS_LEDE,
  buildYoyYearBoard,
  yoyBoardHasSpend,
  yoyBoardPriorMissing,
  yoyChannelVsLy,
  yoyYearOptions,
  yoyYearWindowDays,
  type YoyAsOf,
  type YoyChannelRow,
  type YoyMonthRow,
} from "../lib/yoy-workspace";

export type OverviewYoyYearModel = {
  year: number;
  yearOptions: number[];
  monthRows: YoyMonthRow[];
  channelRows: YoyChannelRow[];
  channelLabels: Record<string, string>;
  lastYearHasSpend: boolean;
  boardHasSpend: boolean;
  boardPriorMissing: boolean;
};

/** Year-board payload from certified days — same helpers as the retired YoY route. */
export function buildOverviewYoyYearModel(
  days: CertifiedDay[],
  year: number,
  asOf: YoyAsOf,
  channelLabels: Record<string, string> = {},
): OverviewYoyYearModel {
  const monthRows = buildYoyYearBoard(days, year, asOf);
  const thisWindow = yoyYearWindowDays(days, year, asOf, year);
  const lastWindow = yoyYearWindowDays(days, year - 1, asOf, year);
  const earliestYear = days.reduce(
    (min, day) => Math.min(min, day.year),
    asOf.year,
  );
  return {
    year,
    yearOptions: yoyYearOptions(
      asOf.year,
      Math.min(earliestYear, year, year - 1),
    ),
    monthRows,
    channelRows: yoyChannelVsLy(thisWindow, lastWindow),
    channelLabels,
    lastYearHasSpend: lastWindow.some((day) => day.spend > 0),
    boardHasSpend: yoyBoardHasSpend(monthRows),
    boardPriorMissing: yoyBoardPriorMissing(monthRows),
  };
}

export function asOfFromCertifiedDays(
  days: CertifiedDay[],
  fallback: Date,
): YoyAsOf {
  const last = days.reduce<CertifiedDay | null>((acc, day) => {
    if (!acc || day.dateKey > acc.dateKey) return day;
    return acc;
  }, null);
  if (!last) {
    return {
      year: fallback.getFullYear(),
      month: fallback.getMonth() + 1,
      day: fallback.getDate(),
    };
  }
  return {
    year: last.year,
    month: last.monthIndex + 1,
    day: last.day,
  };
}

/** `?panel=yoy-year` lands on the year board after a server redirect (no hash). */
export function useOverviewPanelScroll(panel: string | null) {
  useEffect(() => {
    const id = overviewPanelElementId(panel);
    if (!id) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [panel]);
}

/**
 * 12-month board vs last year — lives on Overview below the daily scoreboard.
 * Spend / Total ROAS columns only when typed spend exists on the year rows.
 */
export function OverviewYoyYearSection({
  year,
  yearOptions,
  monthRows,
  channelRows,
  channelLabels,
  lastYearHasSpend,
  boardHasSpend,
  boardPriorMissing,
  salesPending,
  onYearChange,
}: OverviewYoyYearModel & {
  salesPending: boolean;
  onYearChange: (next: string) => void;
}) {
  const lastYearMissing = !salesPending && boardPriorMissing;

  return (
    <section
      className="mcfly-desk-anchor mcfly-well mcfly-well--scoreboard mcfly-yoy mcfly-yoy--year mcfly-yoy--soft"
      id={OVERVIEW_YOY_YEAR_ID}
      aria-label="Year over year board"
    >
      <p className="mcfly-yoy__lede">{YOY_ANALYTICS_LEDE}</p>
      {salesPending ? (
        <p className="mcfly-yoy__note" role="status">
          {OVERVIEW_YOY_PENDING}
        </p>
      ) : null}

      <YoyYearChart
        months={monthRows}
        year={year}
        yearOptions={yearOptions}
        onYearChange={onYearChange}
        hasSpend={boardHasSpend}
        salesPending={salesPending}
      />

      <YoyYearBoard
        months={monthRows}
        year={year}
        hasSpend={boardHasSpend}
      />

      <YoyChannelBoard
        rows={channelRows}
        year={year}
        lastYearHasSpend={lastYearHasSpend}
        channelLabels={channelLabels}
      />

      {lastYearMissing ? (
        <p className="mcfly-yoy__note">{OVERVIEW_YOY_MISSING}</p>
      ) : null}
    </section>
  );
}
