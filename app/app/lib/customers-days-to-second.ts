/**
 * Customers shows one days-to-second figure: the median gap among buyers
 * who came back inside the period already on screen. A 90-day comeback
 * median and a full-book median are different facts and stay off this label.
 */

import type { ShareableInsightCard } from "./shareable-insights";

export type CustomersWindowDays = {
  /** Period name already on the Customers screen. */
  label: string;
  /** Median first→second gap inside that period. Null when nobody came back. */
  days: number | null;
  /** Buyers with a second order inside that same period. */
  cameBack: number;
};

export type CustomersDaysToSecondCopy = {
  value: string;
  label: string;
  line: string;
  formula: string;
  note: string;
  trust: string;
};

/** Same name the Customers header uses for the period on screen. */
export function customersOnScreenWindow(rangeLabel: string): string {
  const label = rangeLabel.trim();
  if (label === "Month to date") return "This month";
  if (!label) return "This period";
  return label;
}

function finitePositive(days: number | null): number | null {
  if (days == null || !Number.isFinite(days) || days <= 0) return null;
  return days;
}

export function customersDaysToSecondValue(days: number): string {
  const n = Math.round(days);
  return `${n} ${n === 1 ? "day" : "days"}`;
}

/** Null when this window has no second order — never a figure from another window. */
export function customersDaysToSecondCopy(
  window: CustomersWindowDays,
): CustomersDaysToSecondCopy | null {
  const days = finitePositive(window.days);
  if (days == null) return null;
  const value = customersDaysToSecondValue(days);
  const cameBack = Math.max(0, Math.trunc(window.cameBack));
  const buyers =
    cameBack === 1
      ? "1 buyer came back"
      : `${cameBack.toLocaleString()} buyers came back`;
  return {
    value,
    label: `Days to a second order · ${window.label}`,
    line: `Typical wait to a second order is ${value} in ${window.label}.`,
    formula: `Median first→second gap among buyers who came back in ${window.label}.`,
    note: cameBack > 0 ? `${buyers} in ${window.label}` : `In ${window.label}`,
    trust: `Among buyers who came back in ${window.label}. Guests stay out.`,
  };
}

/** Share card keeps the on-screen window. Other card kinds stay as they are. */
export function labelCustomersDaysToSecondCard(
  card: ShareableInsightCard,
  window: CustomersWindowDays,
): ShareableInsightCard {
  if (card.kind !== "daysToSecond") return card;
  const copy = customersDaysToSecondCopy(window);
  if (!copy) return card;
  return {
    ...card,
    label: `Days to second · ${window.label}`,
    value: copy.value,
    line: copy.line,
    formula: copy.formula,
    trust: copy.trust,
  };
}
