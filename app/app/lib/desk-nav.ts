/**
 * Desk links keep the scoreboard clock (`period`) and listing-shot flag (`shot`).
 * Shopify App Bridge already owns `shop` / `host`.
 *
 * Admin nav is eleven analysis pages plus Settings. Time windows live on
 * cards, not as nav items. Retired hashes land on Overview home.
 */

export type DeskNavOpts = {
  period?: string | null;
  shot?: boolean;
  hash?: string;
  extra?: Record<string, string | null | undefined>;
};

export type DeskNavItem = {
  path: string;
  label: string;
  hash?: string;
};

/** Anchor ids on Overview. */
export const DESK_SECTION = {
  overview: "mcfly-overview",
  chart: "mcfly-chart",
  compare: "mcfly-compare",
  ledger: "mcfly-ledger",
  mix: "mcfly-mix",
  plan: "mcfly-plan",
  pacing: "mcfly-pacing",
  goals: "mcfly-goals",
  orders: "mcfly-orders",
  buyers: "mcfly-buyers",
  timing: "mcfly-timing",
  ltv: "mcfly-ltv",
  marketing: "mcfly-marketing",
} as const;

export type DeskSectionId = (typeof DESK_SECTION)[keyof typeof DESK_SECTION];

const OVERVIEW_HOME_HASHES = new Set<string>([
  DESK_SECTION.overview,
  DESK_SECTION.chart,
  DESK_SECTION.pacing,
]);

const RETIRED_OVERVIEW_TOOL_HASHES = new Set<string>([
  DESK_SECTION.compare,
  DESK_SECTION.ledger,
  DESK_SECTION.mix,
  DESK_SECTION.plan,
]);

/** Unknown hashes and retired tool tabs land on Overview home. */
export function deskStageFromHash(hash: string): DeskSectionId {
  const id = hash.replace(/^#/, "");
  if (OVERVIEW_HOME_HASHES.has(id)) return id as DeskSectionId;
  if (RETIRED_OVERVIEW_TOOL_HASHES.has(id)) return DESK_SECTION.overview;
  return DESK_SECTION.overview;
}

/** MER Overview: sales chips, ratio chips, close line, remaining $, chart, pacing. */
export function isOverviewHomeStage(stage: DeskSectionId): boolean {
  return (
    stage === DESK_SECTION.overview ||
    stage === DESK_SECTION.chart ||
    stage === DESK_SECTION.pacing
  );
}

export function isOverviewToolStage(stage: DeskSectionId): boolean {
  return (
    stage === DESK_SECTION.compare ||
    stage === DESK_SECTION.ledger ||
    stage === DESK_SECTION.mix ||
    stage === DESK_SECTION.plan
  );
}

export function deskStageHeading(stage: DeskSectionId): string {
  switch (stage) {
    case DESK_SECTION.overview:
    case DESK_SECTION.chart:
    case DESK_SECTION.pacing:
    case DESK_SECTION.goals:
    case DESK_SECTION.orders:
    case DESK_SECTION.buyers:
    case DESK_SECTION.timing:
    case DESK_SECTION.ltv:
    case DESK_SECTION.marketing:
      return "Overview";
    case DESK_SECTION.compare:
    case DESK_SECTION.ledger:
    case DESK_SECTION.mix:
    case DESK_SECTION.plan:
      return "Overview";
    default: {
      const _exhaustive: never = stage;
      return _exhaustive;
    }
  }
}

/**
 * Shopify Admin left nav — sales intelligence first, then spend tools, then Goals.
 */
export const DESK_PRIMARY_NAV: readonly DeskNavItem[] = [
  { path: "/app", label: "Overview" },
  { path: "/app/customers", label: "Customers" },
  { path: "/app/growth", label: "Growth" },
  { path: "/app/orders", label: "Orders" },
  { path: "/app/ltv", label: "LTV" },
  { path: "/app/spend", label: "Spend Upload" },
  { path: "/app/roas", label: "Total ROAS" },
  { path: "/app/allocation", label: "Channel Allocation" },
  { path: "/app/yoy", label: "YoY" },
  { path: "/app/cpa", label: "CPA" },
  { path: "/app/goals", label: "Goals" },
  { path: "/app/settings", label: "Settings" },
];

/** Overview chrome has no second sitemap. Retired hashes still resolve home. */
export const DESK_OVERVIEW_TABS: readonly DeskNavItem[] = [];

export function deskNavHref(path: string, opts: DeskNavOpts = {}): string {
  const next = new URLSearchParams();
  const period = opts.period?.trim();
  if (period) next.set("period", period);
  if (opts.shot) next.set("shot", "1");
  if (opts.extra) {
    for (const [key, value] of Object.entries(opts.extra)) {
      const trimmed = value?.trim();
      if (trimmed) next.set(key, trimmed);
    }
  }
  const query = next.toString();
  const hashRaw = opts.hash?.replace(/^#/, "") ?? "";
  const hash = hashRaw ? `#${hashRaw}` : "";
  return `${path}${query ? `?${query}` : ""}${hash}`;
}

export function deskNavHrefFromSearch(
  path: string,
  search: URLSearchParams,
  hash?: string,
): string {
  return deskNavHref(path, {
    period: search.get("period"),
    shot: search.get("shot") === "1",
    hash,
  });
}

/** 302 onto Overview with a section hash. Fragment is kept by the browser. */
export function overviewSectionLocation(
  request: Request,
  hash: DeskSectionId,
): string {
  const url = new URL(request.url);
  const qs = url.searchParams.toString();
  return `/app${qs ? `?${qs}` : ""}#${hash}`;
}
