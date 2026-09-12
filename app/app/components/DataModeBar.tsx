import { Form, useLocation } from "react-router";
import { PRODUCT_NOUN } from "../lib/product-labels";
export type DataModeBarProps = {
  useSampleDesk: boolean;
  samplePreviewAllowed: boolean;
  /** Real-store activation: margin confirmed on Settings. */
  marginConfirmed: boolean;
  /** Real-store activation: at least one non-sample spend row. */
  hasLiveSpend: boolean;
};

/**
 * Live desk stays quiet: no Sample | Real dual chrome on every page.
 * When SAMPLE is on, show a warning + exit CTA. Practice toggles live on
 * Demo and Settings only.
 */
export function DataModeBar({
  useSampleDesk,
  samplePreviewAllowed,
  marginConfirmed: _marginConfirmed,
  hasLiveSpend: _hasLiveSpend,
}: DataModeBarProps) {
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;
  const action = `/app/data-mode${location.search}`;
  void _marginConfirmed;
  void _hasLiveSpend;

  // Real store + Sample hidden: no chrome (Settings owns re-enable).
  if (!samplePreviewAllowed && !useSampleDesk) {
    return null;
  }

  // Real store viewing: no Sample | Real toggle.
  if (!useSampleDesk) {
    return null;
  }

  // SAMPLE on: warn loudly + one exit CTA (no dual-mode toggle).
  return (
    <div className="mcfly-data-mode mcfly-data-mode--sample">
      <s-banner tone="warning" heading={PRODUCT_NOUN.samplePreviewOn}>
        <s-paragraph>
          These numbers are practice — not your live Shopify money. Tap{" "}
          <strong>{PRODUCT_NOUN.samplePreviewOffCta}</strong> before you trust
          Total ROAS or import spend. Practice again from Demo or Settings.
        </s-paragraph>
        <Form method="post" action={action} className="mcfly-data-mode__form">
          <input type="hidden" name="intent" value="use-real" />
          <input type="hidden" name="returnTo" value={returnTo} />
          <s-button type="submit" variant="primary">
            {PRODUCT_NOUN.samplePreviewOffCta}
          </s-button>
        </Form>
      </s-banner>
    </div>
  );
}

