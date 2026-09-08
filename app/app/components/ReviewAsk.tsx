import { useEffect, useState } from "react";

const STORAGE_KEY = "mcfly-review-ask";

type ShopifyReviews = {
  request?: () => Promise<{ success?: boolean; code?: string; message?: string }>;
};

/**
 * Soft App Store review ask — button only, never auto-modal.
 * Parent must already gate: trusted MER + ≥24h + not SAMPLE.
 */
export function ReviewAsk({ eligible }: { eligible: boolean }) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (!eligible) {
      setHidden(true);
      return;
    }
    try {
      setHidden(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, [eligible]);

  if (!eligible || hidden) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // private mode — just hide this visit
    }
    setHidden(true);
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
    <s-banner tone="info" heading="If Total ROAS is earning its keep">
      <s-paragraph>
        A short App Store review helps the next merchant find sales ÷ spend —
        not pixels.
      </s-paragraph>
      <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
        <s-button variant="secondary" onClick={() => void requestReview()}>
          Leave a review
        </s-button>
        <s-button variant="tertiary" onClick={dismiss}>
          Not now
        </s-button>
      </div>
    </s-banner>
  );
}
