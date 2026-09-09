import { useEffect, useState } from "react";
import {
  REVIEW_ASK_COPY,
  REVIEW_MIN_SESSION_MS,
  decideReviewAskReveal,
} from "../lib/install-stickiness";

const DISMISS_KEY = "mcfly-review-ask";
const SESSION_KEY = "mcfly-review-ask-seen";
const API_POLL_MS = 1_000;
/** App Bridge can attach well after hydration — stop looking after the dwell. */
const API_POLL_MAX_MS = 2 * REVIEW_MIN_SESSION_MS;

type ShopifyReviews = {
  request?: () => Promise<{ success?: boolean; code?: string; message?: string }>;
};

function reviewsApi(): ShopifyReviews | undefined {
  return (window as Window & { shopify?: { reviews?: ShopifyReviews } }).shopify
    ?.reviews;
}

function reviewsApiReady(): boolean {
  return typeof reviewsApi()?.request === "function";
}

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
 * `shopify.reviews.request`, re-checking for it until {@link API_POLL_MAX_MS}.
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

    const readyNow = reviewsApiReady();
    setApiAvailable(readyNow);

    const existing = readSessionStartedAt();
    const started = existing ?? Date.now();
    if (existing == null) writeSessionStartedAt(started);
    setSessionStartedAt(started);

    let dwellTimer = 0;
    let pollTimer = 0;

    const remaining = REVIEW_MIN_SESSION_MS - (Date.now() - started);
    if (remaining <= 0) {
      setNowMs(Date.now());
    } else {
      dwellTimer = window.setTimeout(() => setNowMs(Date.now()), remaining);
    }

    // App Bridge often attaches after hydration. Sampling once would hide the
    // ask for the whole session, so keep re-checking until it lands or the
    // eligible window closes.
    if (!readyNow) {
      const deadline = Date.now() + API_POLL_MAX_MS;
      pollTimer = window.setInterval(() => {
        if (reviewsApiReady()) {
          setApiAvailable(true);
          window.clearInterval(pollTimer);
          return;
        }
        if (Date.now() >= deadline) window.clearInterval(pollTimer);
      }, API_POLL_MS);
    }

    return () => {
      if (dwellTimer) window.clearTimeout(dwellTimer);
      if (pollTimer) window.clearInterval(pollTimer);
    };
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
    try {
      await reviewsApi()?.request?.();
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
