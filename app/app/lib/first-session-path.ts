/**
 * First-session path for a cold merchant on the Total ROAS desk.
 *
 * Preferred ritual (under 10 minutes):
 *   profit margin → CSV spend → Total ROAS desk → Spend Allocation
 *
 * Cash religion: Total ROAS = Shopify sales ÷ ad spend. Margin only unlocks
 * break-even. Once any live spend exists, do not hide the scoreboard behind a
 * margin empty — that would bury cash MER.
 *
 * SAMPLE stays labeled practice. No pixels / MTA / path credit.
 */

import { PRODUCT_NOUN } from "./product-labels";

export const FIRST_SESSION_MINUTES = 10;

export const FIRST_SESSION_STEP_IDS = [
  "margin",
  "spend",
  "desk",
  "allocation",
] as const;

export type FirstSessionStepId = (typeof FIRST_SESSION_STEP_IDS)[number];

export type FirstSessionStepStatus = "todo" | "current" | "done";

export type FirstSessionEmptyKind = "margin_then_spend" | "spend_only" | null;

export type FirstSessionStep = {
  id: FirstSessionStepId;
  href: string;
  label: string;
  hint: string;
  status: FirstSessionStepStatus;
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
};

export type FirstSessionPath = {
  cashMerReady: boolean;
  ritualReady: boolean;
  showColdEmpty: boolean;
  emptyKind: FirstSessionEmptyKind;
  showFullGuide: boolean;
  showMarginNudge: boolean;
  viewing: "sample" | "live";
  viewingHint: string;
  heading: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  footerLinks: { href: string; label: string }[];
  steps: FirstSessionStep[];
  guideHeading: string;
  guideNote: string;
  marginNudgeHeading: string;
  marginNudgeBody: string;
};

function withSearch(path: string, search?: string): string {
  if (!search || search === "?") return path;
  const q = search.startsWith("?") ? search : `?${search}`;
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
  const marginCurrent = !marginDone;
  const spendCurrent = marginDone && !spendDone;
  const allocationCurrent = marginDone && spendDone;

  return [
    {
      id: "margin",
      href: withSearch("/app/settings", q),
      label: PRODUCT_NOUN.setupAdjustMargin,
      hint: marginDone
        ? " — done"
        : " — sets break-even from contribution margin",
      status: stepStatus({ done: marginDone, current: marginCurrent }),
    },
    {
      id: "spend",
      href: withSearch("/app/spend", q),
      label: PRODUCT_NOUN.setupAddSpend,
      hint: spendDone ? " — done" : " — daily CSV / paste, no ad-network login",
      status: stepStatus({ done: spendDone, current: spendCurrent }),
    },
    {
      id: "desk",
      href: withSearch("/app", q),
      label: PRODUCT_NOUN.openTotalRoas,
      hint: " — Shopify Total Sales ÷ spend",
      status: stepStatus({ done: deskDone, current: false }),
    },
    {
      id: "allocation",
      href: withSearch("/app/allocation", q),
      label: PRODUCT_NOUN.spendAllocation,
      hint: " — this week's mix after you trust the multiple",
      status: stepStatus({
        done: false,
        current: allocationCurrent,
      }),
    },
  ];
}

function emptyCopy(
  kind: FirstSessionEmptyKind,
  search?: string,
): Pick<
  FirstSessionPath,
  "heading" | "body" | "primaryHref" | "primaryLabel" | "footerLinks"
> {
  if (kind === "spend_only") {
    return {
      heading: "Upload spend — then the number is inevitable",
      body: `Margin is set. Upload daily Spend CSV. ${PRODUCT_NOUN.definition}. No ad-network login.`,
      primaryHref: withSearch("/app/spend", search),
      primaryLabel: PRODUCT_NOUN.setupAddSpend,
      footerLinks: [
        {
          href: withSearch("/app", search),
          label: PRODUCT_NOUN.openTotalRoas,
        },
        {
          href: withSearch("/app/allocation", search),
          label: PRODUCT_NOUN.spendAllocation,
        },
      ],
    };
  }

  return {
    heading: `Trusted ${PRODUCT_NOUN.totalRoas} in under ${FIRST_SESSION_MINUTES} minutes`,
    body: `Save profit margin (unlocks break-even). Upload daily Spend CSV. Read ${PRODUCT_NOUN.definition}. That’s the whole desk.`,
    primaryHref: withSearch("/app/settings", search),
    primaryLabel: PRODUCT_NOUN.setupAdjustMargin,
    footerLinks: [
      {
        href: withSearch("/app/spend", search),
        label: PRODUCT_NOUN.setupAddSpend,
      },
      {
        href: withSearch("/app", search),
        label: PRODUCT_NOUN.openTotalRoas,
      },
      {
        href: withSearch("/app/allocation", search),
        label: PRODUCT_NOUN.spendAllocation,
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
  const viewing: "sample" | "live" = input.useSampleDesk ? "sample" : "live";
  const viewingHint = input.useSampleDesk
    ? "SAMPLE practice — not live money, not your live Shopify till."
    : "Live Shopify sales ÷ your spend.";

  const cashMerReady = input.useSampleDesk || input.hasLiveSpend;
  const ritualReady =
    input.useSampleDesk || (input.marginConfirmed && input.hasLiveSpend);

  const shot = Boolean(input.shotMode);
  const sample = input.useSampleDesk;
  const forceGuide = Boolean(input.forceGuide);

  const emptyKind: FirstSessionEmptyKind =
    shot || sample || input.hasLiveSpend
      ? null
      : input.marginConfirmed
        ? "spend_only"
        : "margin_then_spend";

  const showColdEmpty = emptyKind != null;
  const showFullGuide =
    !shot && !sample && !input.hasLiveSpend && (showColdEmpty || forceGuide);
  const showMarginNudge =
    !shot && !sample && input.hasLiveSpend && !input.marginConfirmed;

  const copy = emptyCopy(emptyKind, input.search);

  return {
    cashMerReady,
    ritualReady,
    showColdEmpty,
    emptyKind,
    showFullGuide,
    showMarginNudge,
    viewing,
    viewingHint,
    ...copy,
    steps,
    guideHeading: `Your real store — ${FIRST_SESSION_STEP_IDS.length} steps`,
    guideNote: `Shopify sales are automatic. You only add ad spend. Hide Sample for good in Settings. Target: trusted ${PRODUCT_NOUN.totalRoas} in under ${FIRST_SESSION_MINUTES} minutes.`,
    marginNudgeHeading: "Confirm margin for break-even",
    marginNudgeBody: `${PRODUCT_NOUN.totalRoas} is live (${PRODUCT_NOUN.definition}). Confirm profit margin so break-even is locked — then ${PRODUCT_NOUN.spendAllocation}.`,
  };
}

export function firstSessionPrimaryAction(path: FirstSessionPath): {
  href: string;
  label: string;
} {
  if (path.viewing === "sample") {
    return {
      href: "/app/demo",
      label: PRODUCT_NOUN.samplePreviewOffReviewTitle,
    };
  }
  if (path.showColdEmpty) {
    return { href: path.primaryHref, label: path.primaryLabel };
  }
  if (path.showMarginNudge) {
    return {
      href: path.steps[0].href,
      label: PRODUCT_NOUN.setupAdjustMargin,
    };
  }
  return { href: "/app/spend", label: "Update spend" };
}
