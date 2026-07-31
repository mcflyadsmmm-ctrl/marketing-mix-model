import { useCallback, useState } from "react";
import { PRODUCT_NOUN } from "../lib/product-labels";

type ShareOverviewButtonProps = {
  subject: string;
  body: string;
  /** When false, hide the primary Share chrome (cold empty / shot). */
  enabled: boolean;
};

/**
 * Merchant-owned share: Web Share → mailto → Copy. Mcfly never sends email.
 */
export function ShareOverviewButton({
  subject,
  body,
  enabled,
}: ShareOverviewButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyBody = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [body]);

  const share = useCallback(async () => {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({ title: subject, text: body });
        return;
      } catch (err) {
        // Abort = user cancelled; fall through only on hard failure.
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }, [subject, body]);

  if (!enabled) return null;

  return (
    <div className="mcfly-share-overview" role="group" aria-label={PRODUCT_NOUN.shareOverview}>
      <s-button variant="primary" onClick={() => void share()}>
        {PRODUCT_NOUN.shareOverview}
      </s-button>
      <s-button variant="secondary" onClick={() => void copyBody()}>
        {copied ? "Copied" : "Copy text"}
      </s-button>
    </div>
  );
}
