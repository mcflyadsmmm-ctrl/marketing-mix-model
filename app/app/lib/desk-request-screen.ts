/**
 * A named request keeps its title. The address stays on that screen.
 * Loading lines name what is loading and which window.
 */

export type NamedDeskScreen =
  | "allocation"
  | "year-over-year"
  | "ltv"
  | "growth"
  | "cpa"
  | "roas"
  | "who-to-save"
  | "month-close";

const SCREEN_BY_SLUG: Readonly<Record<string, NamedDeskScreen>> = {
  allocation: "allocation",
  yoy: "year-over-year",
  ltv: "ltv",
  growth: "growth",
  cpa: "cpa",
  roas: "roas",
  "who-to-save": "who-to-save",
  close: "month-close",
};

export function namedDeskScreenFromPath(
  pathname: string,
): NamedDeskScreen | null {
  const current = pathname.replace(/\/$/, "") || "/";
  const slug = current.split("/").filter(Boolean).pop() ?? "";
  return SCREEN_BY_SLUG[slug] ?? null;
}

export function namedDeskTitle(screen: NamedDeskScreen): string {
  switch (screen) {
    case "allocation":
      return "Allocation";
    case "year-over-year":
      return "Year over year";
    case "ltv":
      return "LTV";
    case "growth":
      return "Growth";
    case "cpa":
      return "CPA";
    case "roas":
      return "ROAS";
    case "who-to-save":
      return "Who to save";
    case "month-close":
      return "Month close";
    default: {
      const _exhaustive: never = screen;
      return _exhaustive;
    }
  }
}

export function deskWindowPhrase(periodLabel: string): string {
  const label = periodLabel.trim();
  if (label === "Month to date" || label === "This month") return "this month";
  return label || "this window";
}

/** Home refresh names sales and the window on screen. */
export function refreshingSalesLine(periodLabel: string): string {
  const window = deskWindowPhrase(periodLabel);
  const possessive = window === "this month" ? "this month’s" : `${window}’s`;
  return `Refreshing ${possessive} sales…`;
}

/** Spend already on the page. Sales for the named window are the thing still loading. */
export function salesWindowPendingHeading(periodLabel: string): string {
  return `Shopify Total Sales for ${deskWindowPhrase(periodLabel)} still loading`;
}

/** Returning mix ghost chart — name the week window, not a bare still-loading. */
export function returningMixPendingLine(windowLabel: string): string {
  const window = windowLabel.trim() || "this week";
  return `Returning dollars for ${window} are still loading — not $0.`;
}

/** Come-back ghost chart — name the months in the window. */
export function comebackPendingLine(windowLabel: string): string {
  const window = windowLabel.trim() || "these months";
  return `Come-back months for ${window} are still loading — not $0.`;
}
