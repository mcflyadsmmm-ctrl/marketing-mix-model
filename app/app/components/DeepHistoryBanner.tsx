import {
  CASH_NOT_ATTRIBUTION,
  DEEP_HISTORY_GRANT_COPY,
  deepHistoryGrantHref,
  deepHistoryHonestyCopy,
  type DeepHistoryHonestyKind,
} from "../lib/deep-history-honesty";

type Props = {
  kind: DeepHistoryHonestyKind;
  shopDomain: string;
  /** Compact help line under the grant banner (Overview / Settings). */
  showCashReligion?: boolean;
};

/**
 * Partner-safe deep-history banner. CTA is `/auth?shop=` — the same
 * Shopify reauth path the app already uses. Top-level so Admin can prompt.
 */
export function DeepHistoryBanner({
  kind,
  shopDomain,
  showCashReligion = false,
}: Props) {
  const copy = deepHistoryHonestyCopy(kind);
  if (!copy) return null;

  const grantHref = deepHistoryGrantHref(shopDomain);
  const showCta = kind === "missing_scope" || kind === "missing_scope_wide";

  return (
    <s-banner
      tone={kind === "backfilling" ? "info" : "warning"}
      heading={copy.heading}
    >
      <s-paragraph>{copy.body}</s-paragraph>
      {showCashReligion ? (
        <s-paragraph>{CASH_NOT_ATTRIBUTION}</s-paragraph>
      ) : null}
      {showCta ? (
        <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
          <s-button href={grantHref} variant="primary" target="_top">
            {DEEP_HISTORY_GRANT_COPY.cta}
          </s-button>
        </div>
      ) : null}
    </s-banner>
  );
}
