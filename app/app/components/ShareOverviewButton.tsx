import { PRODUCT_NOUN } from "../lib/product-labels";

type ShareOverviewButtonProps = {
  subject: string;
  body: string;
  /** When false, hide (cold empty / shot). */
  enabled: boolean;
  /** Kept for call sites — compact and full are the same mailto link. */
  compact?: boolean;
};

/**
 * One click → merchant’s mail app with Overview numbers in the body.
 * Mcfly never sends mail (free mailto:).
 */
export function ShareOverviewButton({
  subject,
  body,
  enabled,
}: ShareOverviewButtonProps) {
  if (!enabled) return null;

  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <s-button variant="tertiary" href={mailto}>
      {PRODUCT_NOUN.shareOverviewEmail}
    </s-button>
  );
}
