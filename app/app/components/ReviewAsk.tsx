import { useCallback, useEffect, useState } from "react";

export const REVIEW_ASK_DISMISS_KEY = "mcfly.reviewAsk.dismissed";
export const REVIEW_ASK_MIN_INSTALL_DAYS = 7;
export const REVIEW_ASK_LISTING_HREF =
  "https://apps.shopify.com/mcfly-analytics-public";

export const REVIEW_ASK_COPY = {
  body: "A listing review is optional — only if Mcfly is useful.",
  listing: "App Store listing",
  dismiss: "Dismiss",
} as const;

type ReviewAskProps = {
  hasLiveSpend: boolean;
  useSampleDesk: boolean;
  shotMode?: boolean;
  /** Shop.createdAt — first OAuth. Wait a week so first-session never asks. */
  installedAt?: Date | string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function reviewAskEligible(opts: {
  hasLiveSpend: boolean;
  useSampleDesk: boolean;
  shotMode?: boolean;
  installedAt?: Date | string | number | null;
  now?: Date;
}): boolean {
  if (!opts.hasLiveSpend || opts.useSampleDesk || opts.shotMode) return false;
  if (opts.installedAt == null) return false;
  const installed = new Date(opts.installedAt).getTime();
  if (!Number.isFinite(installed)) return false;
  const now = (opts.now ?? new Date()).getTime();
  return now - installed >= REVIEW_ASK_MIN_INSTALL_DAYS * DAY_MS;
}

/**
 * Quiet footnote after live spend + a week. Not a banner, not App Bridge
 * `reviews.request()`. Dismiss persists in localStorage.
 */
export function ReviewAsk({
  hasLiveSpend,
  useSampleDesk,
  shotMode = false,
  installedAt = null,
}: ReviewAskProps): JSX.Element | null {
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);

  const persistDismiss = useCallback((): void => {
    try {
      localStorage.setItem(REVIEW_ASK_DISMISS_KEY, "1");
    } catch {
      /* private mode */
    }
    setDismissed(true);
  }, []);

  useEffect((): void => {
    try {
      setDismissed(localStorage.getItem(REVIEW_ASK_DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
    setReady(true);
  }, []);

  const visible =
    ready &&
    reviewAskEligible({
      hasLiveSpend,
      useSampleDesk,
      shotMode,
      installedAt,
    }) &&
    !dismissed;

  if (!visible) return null;

  return (
    <p className="mcfly-review-ask" role="note">
      <span>{REVIEW_ASK_COPY.body}</span>
      <s-link href={REVIEW_ASK_LISTING_HREF} target="_blank">
        {REVIEW_ASK_COPY.listing}
      </s-link>
      <button
        type="button"
        className="mcfly-review-ask__dismiss"
        onClick={persistDismiss}
      >
        {REVIEW_ASK_COPY.dismiss}
      </button>
    </p>
  );
}
