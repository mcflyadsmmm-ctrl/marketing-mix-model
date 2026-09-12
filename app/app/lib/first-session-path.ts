/**
 * First-session path for a cold merchant on the Total ROAS desk.
 *
 * Preferred ritual (under 10 minutes):
 *   spend on the desk (one bill spread across its days, or a typed day) →
 *   Total ROAS desk → (optional) margin for break-even → (optional) pipe
 *   templates → (optional) deep history
 *
 * The bill spread leads because a multiple worth acting on wants most closed
 * days covered, and the trial is seven days long (see `spend-first-run.ts`).
 *
 * Total ROAS = Shopify sales ÷ ad spend. Margin only unlocks
 * break-even — it does not gate the scoreboard. Primary CTA is always Spend.
 *
 * SAMPLE stays labeled practice. No pixels / MTA / path credit.
 */

import { deepHistoryGrantHref } from "./deep-history-honesty";
import { PRODUCT_NOUN } from "./product-labels";
import { SPEND_BILL_ANCHOR } from "./spend-first-run";
import { PIPE_TEMPLATE_ANCHOR, PIPE_TEMPLATE_COPY } from "./spend-pipe-templates";

export const FIRST_SESSION_MINUTES = 10;

/** Love-UX1 Setup Guide — ≤5 auto-checked steps (Judge.me / Shopify setup guide). */
export const FIRST_SESSION_STEP_IDS = [
  "spend",
  "margin",
  "desk",
  "pipe",
  "deep_history",
] as const;

export type FirstSessionStepId = (typeof FIRST_SESSION_STEP_IDS)[number];

export type FirstSessionStepStatus = "todo" | "current" | "done";

/** Cold live empty — always spend-first. Margin is optional for break-even. */
export type FirstSessionEmptyKind = "spend_only" | null;

export type FirstSessionStep = {
  id: FirstSessionStepId;
  href: string;
  label: string;
  hint: string;
  status: FirstSessionStepStatus;
  /** Optional steps never block trusted Total ROAS. */
  optional: boolean;
};

export type FirstSessionPathInput = {
  marginConfirmed: boolean;
  /** Shop-level live (non-sample) spend — not the selected period. */
  hasLiveSpend: boolean;
  useSampleDesk: boolean;
  shotMode?: boolean;
  /** `?guide=real` after switching Sample → Real store. */
  forceGuide?: boolean;
  search?: string;
  /** `read_all_orders` — unlocks optional deep-history step. */
  hasReadAllOrders?: boolean;
  /** Shop domain for Partner-safe deep-history reauth href. */
  shopDomain?: string;
};

export type FirstSessionPath = {
  cashMerReady: boolean;
  ritualReady: boolean;
  showColdEmpty: boolean;
  emptyKind: FirstSessionEmptyKind;
  /** Cold live empty (or forceGuide) — Overview owns the Setup Guide UI. */
  showFullGuide: boolean;
  showMarginNudge: boolean;
  viewing: "sample" | "live";
  viewingHint: string;
  /**
   * After SAMPLE → Real, land on Spend for the typed-day ritual.
   * Never the Demo tab — that is a preview, not a mode change.
   */
  realStoreHref: string;
  /**
   * POST target for one-tap SAMPLE → Real (`intent=use-real`).
   * `/app/data-mode` is POST-only — never a plain link.
   */
  realStorePostAction: string;
  heading: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  footerLinks: { href: string; label: string }[];
  steps: FirstSessionStep[];
  stepsCompleted: number;
  stepsTotal: number;
  guideProgressLabel: string;
  guideHeading: string;
  guideNote: string;
  marginNudgeHeading: string;
  marginNudgeBody: string;
};

function withSearch(path: string, search?: string): string {
  if (!search || search === "?") return path;
  const q = search.startsWith("?") ? search : `?${search}`;
  const hashIdx = path.indexOf("#");
  if (hashIdx >= 0) {
    return `${path.slice(0, hashIdx)}${q}${path.slice(hashIdx)}`;
  }
  return `${path}${q}`;
}

function stepStatus(opts: {
  done: boolean;
  current: boolean;
}): FirstSessionStepStatus {
  if (opts.done) return "done";
  if (opts.current) return "current";
  return "todo";
}

function buildSteps(input: FirstSessionPathInput): FirstSessionStep[] {
  const q = input.search;
  const marginDone = input.marginConfirmed;
  const spendDone = input.hasLiveSpend;
  const deskDone = spendDone;
  const deepDone = Boolean(input.hasReadAllOrders);
  // One "current" at a time — optional pipe never auto-completes, so it is
  // never current (link only). Deep history becomes current after spend.
  const spendCurrent = !spendDone;
  const marginCurrent = spendDone && !marginDone;
  const deepCurrent = spendDone && marginDone && !deepDone;
  const deepHref = input.shopDomain
    ? deepHistoryGrantHref(input.shopDomain)
    : withSearch("/app", q);

  return [
    {
      id: "spend",
      href: withSearch(`/app/spend#${SPEND_BILL_ANCHOR}`, q),
      label: PRODUCT_NOUN.setupSpreadBill,
      hint: spendDone
        ? " — done"
        : " — one bill covers a month of days, or type one day; no ad-network login",
      status: stepStatus({ done: spendDone, current: spendCurrent }),
      optional: false,
    },
    {
      id: "margin",
      href: withSearch("/app/settings", q),
      label: PRODUCT_NOUN.setupAdjustMargin,
      hint: marginDone ? " — done" : " — optional; unlocks break-even",
      status: stepStatus({ done: marginDone, current: marginCurrent }),
      optional: true,
    },
    {
      id: "desk",
      href: withSearch("/app", q),
      label: PRODUCT_NOUN.openTotalRoas,
      hint: " — Shopify Total Sales ÷ spend",
      status: stepStatus({ done: deskDone, current: false }),
      optional: false,
    },
    {
      id: "pipe",
      href: withSearch(`/app/spend#${PIPE_TEMPLATE_ANCHOR}`, q),
      label: PIPE_TEMPLATE_COPY.linkLabel,
      hint: " — optional; CSV shape only, no ad login here",
      status: stepStatus({ done: false, current: false }),
      optional: true,
    },
    {
      id: "deep_history",
      href: deepHref,
      label: "Unlock deep history",
      hint: deepDone
        ? " — done"
        : " — optional; MTD / ~60 days already work",
      status: stepStatus({ done: deepDone, current: deepCurrent }),
      optional: true,
    },
  ];
}

function emptyCopy(
  marginConfirmed: boolean,
  search?: string,
): Pick<
  FirstSessionPath,
  "heading" | "body" | "primaryHref" | "primaryLabel" | "footerLinks"
> {
  return {
    heading: "See your Shopify orders — then unlock Total ROAS",
    body: marginConfirmed
      ? `Typical order, weekend vs weekday, and new vs returning sales are already on this desk. Margin is set — spread one ad invoice across its days, or type one day, to unlock ${PRODUCT_NOUN.definition}. No file, no ad-network login.`
      : `Typical order, weekend vs weekday, and new vs returning sales are already on this desk — numbers Shopify Analytics does not lead with. Spread one ad invoice across its days, or type one day, when you want ${PRODUCT_NOUN.definition}. Margin is optional for break-even.`,
    primaryHref: withSearch(`/app/spend#${SPEND_BILL_ANCHOR}`, search),
    primaryLabel: PRODUCT_NOUN.setupSpreadBill,
    footerLinks: [
      {
        href: withSearch("/app/settings", search),
        label: PRODUCT_NOUN.setupAdjustMargin,
      },
      {
        href: withSearch("/app", search),
        label: PRODUCT_NOUN.openTotalRoas,
      },
      {
        href: withSearch(`/app/spend#${PIPE_TEMPLATE_ANCHOR}`, search),
        label: PIPE_TEMPLATE_COPY.linkLabel,
      },
    ],
  };
}

/**
 * Resolve chrome + Overview empty from shop-level first-session inputs.
 * Shot / SAMPLE never show the real-store ritual empty.
 */
export function resolveFirstSessionPath(
  input: FirstSessionPathInput,
): FirstSessionPath {
  const steps = buildSteps(input);
  const stepsCompleted = steps.filter((s) => s.status === "done").length;
  const stepsTotal = steps.length;
  const viewing: "sample" | "live" = input.useSampleDesk ? "sample" : "live";
  const viewingHint = input.useSampleDesk
    ? "SAMPLE practice — not live money, not your live Shopify money."
    : "Live Shopify sales ÷ your spend.";

  const cashMerReady = input.useSampleDesk || input.hasLiveSpend;
  const ritualReady =
    input.useSampleDesk || (input.marginConfirmed && input.hasLiveSpend);

  const shot = Boolean(input.shotMode);
  const sample = input.useSampleDesk;
  const forceGuide = Boolean(input.forceGuide);

  const emptyKind: FirstSessionEmptyKind =
    shot || sample || input.hasLiveSpend ? null : "spend_only";

  const showColdEmpty = emptyKind != null;
  const showFullGuide =
    !shot && !sample && !input.hasLiveSpend && (showColdEmpty || forceGuide);
  const showMarginNudge =
    !shot && !sample && input.hasLiveSpend && !input.marginConfirmed;

  const copy = emptyCopy(input.marginConfirmed, input.search);

  return {
    cashMerReady,
    ritualReady,
    showColdEmpty,
    emptyKind,
    showFullGuide,
    showMarginNudge,
    viewing,
    viewingHint,
    realStoreHref: withSearch("/app/spend", input.search),
    realStorePostAction: withSearch("/app/data-mode", input.search),
    ...copy,
    steps,
    stepsCompleted,
    stepsTotal,
    guideProgressLabel: `${stepsCompleted} of ${stepsTotal} steps completed`,
    guideHeading: "Setup Guide",
    guideNote: `Shopify sales are automatic. You only add ad spend. Margin, pipe fill, and deep history are optional. Hide Sample for good in Settings. Target: trusted ${PRODUCT_NOUN.totalRoas} in under ${FIRST_SESSION_MINUTES} minutes.`,
    marginNudgeHeading: "Confirm margin for break-even",
    marginNudgeBody: `${PRODUCT_NOUN.totalRoas} is live (${PRODUCT_NOUN.definition}). Confirm profit margin so break-even is locked — then ${PRODUCT_NOUN.spendAllocation}.`,
  };
}

export type FirstSessionPrimaryAction = {
  label: string;
  /** Navigate when `postIntent` is unset. */
  href: string;
  /**
   * SAMPLE → Real in one tap: Form POST to `postAction` with this intent.
   * Overview (and peers) must not use `href` when this is set.
   */
  postIntent?: "use-real";
  /** Form `action` when `postIntent` is set (POST-only `/app/data-mode`). */
  postAction?: string;
  /** Safe in-app path after `use-real` — Spend ritual with period preserved. */
  returnTo?: string;
};

export function firstSessionPrimaryAction(
  path: FirstSessionPath,
): FirstSessionPrimaryAction {
  if (path.viewing === "sample") {
    return {
      href: path.realStoreHref,
      label: PRODUCT_NOUN.samplePreviewOffCta,
      postIntent: "use-real",
      postAction: path.realStorePostAction,
      returnTo: path.realStoreHref,
    };
  }
  if (path.showColdEmpty) {
    return { href: path.primaryHref, label: path.primaryLabel };
  }
  if (path.showMarginNudge) {
    const marginStep = path.steps.find((s) => s.id === "margin");
    return {
      href: marginStep?.href ?? "/app/settings",
      label: PRODUCT_NOUN.setupAdjustMargin,
    };
  }
  return {
    href: "/app/ltv",
    label: PRODUCT_NOUN.openCustomerInsights,
  };
}
