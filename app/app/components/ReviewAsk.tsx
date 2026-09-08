import { useEffect, useState } from "react";
import {
  REVIEW_ASK_COPY,
  REVIEW_MIN_SESSION_MS,
  decideReviewAskReveal,
} from "../lib/install-stickiness";

const DISMISS_KEY = "mcfly-review-ask";
const SESSION_KEY = "mcfly-review-ask-seen";

type ShopifyReviews = {
  request?: () => Promise<{ success?: boolean; code?: string; message?: string }>;
};

function readSessionStartedAt(): number | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeSessionStartedAt(ms: number) {
  try {
    window.sessionStorage.setItem(SESSION_KEY, String(ms));
  } catch {
    // private mode — in-memory only this visit
  }
}

/**
 * Soft App Store review ask — button only, never auto-modal.
 * Parent must already gate: trusted MER + ≥24h + not SAMPLE + scoreboard ready.
 * This component still waits {@link REVIEW_MIN_SESSION_MS} and hides without
 * `shopify.reviews.request`.
 */
export function ReviewAsk({ eligible }: { eligible: boolean }) {
  const [dismissed, setDismissed] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!eligible) {
      setDismissed(true);
      setApiAvailable(false);
      setSessionStartedAt(null);
      return;
    }

    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }

    const reviews = (
      window as Window & { shopify?: { reviews?: ShopifyReviews } }
    ).shopify?.reviews;
    setApiAvailable(typeof reviews?.request === "function");

    const existing = readSessionStartedAt();
    const started = existing ?? Date.now();
    if (existing == null) writeSessionStartedAt(started);
    setSessionStartedAt(started);

    const remaining = REVIEW_MIN_SESSION_MS - (Date.now() - started);
    if (remaining <= 0) {
      setNowMs(Date.now());
      return;
    }
    const timer = window.setTimeout(() => setNowMs(Date.now()), remaining);
    return () => window.clearTimeout(timer);
  }, [eligible]);

  const reveal = decideReviewAskReveal({
    eligible,
    dismissed,
    reviewsApiAvailable: apiAvailable,
    sessionStartedAt,
    now: nowMs,
  });

  if (!reveal.show) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // private mode — just hide this visit
    }
    setDismissed(true);
  }

  async function requestReview() {
    const reviews = (
      window as Window & { shopify?: { reviews?: ShopifyReviews } }
    ).shopify?.reviews;
    try {
      await reviews?.request?.();
    } catch {
      // Shopify may refuse (cooldown / already-reviewed). Still dismiss.
    }
    dismiss();
  }

  return (
    <s-banner tone="info" heading={REVIEW_ASK_COPY.heading}>
      <s-paragraph>{REVIEW_ASK_COPY.body}</s-paragraph>
      <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
        <s-button variant="secondary" onClick={() => void requestReview()}>
          {REVIEW_ASK_COPY.acceptLabel}
        </s-button>
        <s-button variant="tertiary" onClick={dismiss}>
          {REVIEW_ASK_COPY.dismissLabel}
        </s-button>
      </div>
    </s-banner>
  );
}
