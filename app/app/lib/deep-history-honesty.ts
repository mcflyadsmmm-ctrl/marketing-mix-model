/**
 * Deep order-history honesty + Partner-safe grant CTA.
 *
 * Token `read_all_orders` unlocks multi-year SalesDayFact / till LTV.
 * Without it, Shopify only shares ~60 days — that is a recent window, not
 * a broken LTV desk. After grant, #37 already kicks coalesced deep backfill.
 *
 * Grant CTA uses the app's existing `/auth?shop=` reauth path (Shopify
 * prompts to update permissions). Do not invent a second OAuth.
 */

import { PRODUCT_NOUN } from "./product-labels";
import { READ_ALL_ORDERS_SCOPE, scopesIncludeReadAllOrders } from "./shopify-scopes";

export { READ_ALL_ORDERS_SCOPE, scopesIncludeReadAllOrders };

export const DEEP_HISTORY_GRANT_PATH = "/auth";

export const DEEP_HISTORY_GRANT_COPY = {
  heading: "Unlock multi-year order history",
  body: "Shopify will prompt to update permissions. That grants deep order history for LTV and multi-year Total ROAS — order ids and amounts only, no email CRM. Until then, sales stay on the recent ~60-day window — not permanently empty.",
  recentWindowBody:
    "This period reaches past the recent ~60-day order window. Grant deeper history so LTV and long-period Total ROAS can fill — not permanently empty.",
  backfillHeading: "Sales history is backfilling",
  backfillBody:
    "Deeper order access is granted. Multi-year sales and LTV fill as facts land — refresh in a few minutes. Not permanently limited.",
  cta: "Update permissions in Shopify",
} as const;

/** Cash religion vs attribution suites — Settings / Overview help. */
export const CASH_NOT_ATTRIBUTION = PRODUCT_NOUN.cashNotAttribution;

export type DeepHistoryHonestyKind =
  | "hidden"
  | "missing_scope"
  | "missing_scope_wide"
  | "backfilling";

export type DeepHistoryHonesty = {
  kind: DeepHistoryHonestyKind;
  showGrantCta: boolean;
  /** Wide period without the scope — do not treat as trusted long-window desk. */
  historyLimitedDesk: boolean;
};

/**
 * Existing Shopify reauth/update-scopes path (`authPathPrefix: /auth`).
 * Top-level navigation so Admin can show the permission prompt.
 */
export function deepHistoryGrantHref(shopDomain: string): string {
  const shop = shopDomain.trim();
  if (!shop) return DEEP_HISTORY_GRANT_PATH;
  const params = new URLSearchParams({ shop });
  return `${DEEP_HISTORY_GRANT_PATH}?${params.toString()}`;
}

export function resolveDeepHistoryHonesty(input: {
  hasReadAllOrders: boolean;
  useSampleDesk?: boolean;
  shotMode?: boolean;
  factsIncomplete?: boolean;
  periodWiderThanRecentWindow?: boolean;
}): DeepHistoryHonesty {
  if (input.useSampleDesk || input.shotMode) {
    return { kind: "hidden", showGrantCta: false, historyLimitedDesk: false };
  }

  if (!input.hasReadAllOrders) {
    const wide = Boolean(input.periodWiderThanRecentWindow);
    return {
      kind: wide ? "missing_scope_wide" : "missing_scope",
      showGrantCta: true,
      historyLimitedDesk: wide,
    };
  }

  if (input.factsIncomplete) {
    return {
      kind: "backfilling",
      showGrantCta: false,
      historyLimitedDesk: false,
    };
  }

  return { kind: "hidden", showGrantCta: false, historyLimitedDesk: false };
}

export function deepHistoryHonestyCopy(
  kind: DeepHistoryHonestyKind,
): { heading: string; body: string } | null {
  switch (kind) {
    case "missing_scope":
      return {
        heading: DEEP_HISTORY_GRANT_COPY.heading,
        body: DEEP_HISTORY_GRANT_COPY.body,
      };
    case "missing_scope_wide":
      return {
        heading: DEEP_HISTORY_GRANT_COPY.heading,
        body: DEEP_HISTORY_GRANT_COPY.recentWindowBody,
      };
    case "backfilling":
      return {
        heading: DEEP_HISTORY_GRANT_COPY.backfillHeading,
        body: DEEP_HISTORY_GRANT_COPY.backfillBody,
      };
    case "hidden":
      return null;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
