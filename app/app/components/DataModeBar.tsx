import { Form, useLocation, useSearchParams } from "react-router";
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
 * Global Sample | Your store control — one place, every desk page.
 * Real-store checklist stays until first margin + spend (not only ?guide=real).
 */
export function DataModeBar({
  useSampleDesk,
  samplePreviewAllowed,
  marginConfirmed,
  hasLiveSpend,
}: DataModeBarProps) {
  const location = useLocation();
  const [params] = useSearchParams();
  const activationIncomplete = !marginConfirmed || !hasLiveSpend;
  const guideParam =
    params.get("guide") === "real" || params.get("guide") === "1";
  /** Sticky until first trusted Total ROAS inputs exist — uninstall protection. */
  const showRealGuide =
    !useSampleDesk && (activationIncomplete || guideParam);
  const returnTo = `${location.pathname}${location.search}`;
  const action = `/app/data-mode${location.search}`;

  if (!samplePreviewAllowed) {
    return (
      <div className="mcfly-data-mode mcfly-data-mode--real-only" role="status">
        <p className="mcfly-data-mode__status">
          <strong>Your store</strong>
          <span aria-hidden="true"> · </span>
          Sample is hidden in Settings
        </p>
        {activationIncomplete ? (
          <s-banner tone="info" heading="Finish setup for Total ROAS">
            <ol className="mcfly-data-mode__steps">
              {!marginConfirmed ? (
                <li>
                  <s-link href={`/app/settings${location.search}`}>
                    {PRODUCT_NOUN.setupAdjustMargin}
                  </s-link>
                </li>
              ) : null}
              {!hasLiveSpend ? (
                <li>
                  <s-link href={`/app/spend${location.search}`}>
                    {PRODUCT_NOUN.setupAddSpend}
                  </s-link>
                </li>
              ) : null}
              <li>
                <s-link href={`/app${location.search}`}>
                  {PRODUCT_NOUN.openTotalRoas}
                </s-link>
              </li>
            </ol>
          </s-banner>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={[
        "mcfly-data-mode",
        useSampleDesk ? "mcfly-data-mode--sample" : "mcfly-data-mode--real",
      ].join(" ")}
    >
      <div className="mcfly-data-mode__row">
        <p className="mcfly-data-mode__label" id="mcfly-data-mode-label">
          Viewing
        </p>
        <div
          className="mcfly-data-mode__toggle"
          role="group"
          aria-labelledby="mcfly-data-mode-label"
        >
          <Form method="post" action={action} className="mcfly-data-mode__form">
            <input type="hidden" name="intent" value="use-sample" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              className={[
                "mcfly-data-mode__btn",
                useSampleDesk ? "mcfly-data-mode__btn--active" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={useSampleDesk}
            >
              Sample
            </button>
          </Form>
          <Form method="post" action={action} className="mcfly-data-mode__form">
            <input type="hidden" name="intent" value="use-real" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              className={[
                "mcfly-data-mode__btn",
                !useSampleDesk ? "mcfly-data-mode__btn--active" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={!useSampleDesk}
            >
              Your store
            </button>
          </Form>
        </div>
        <p className="mcfly-data-mode__hint">
          {useSampleDesk
            ? "Practice numbers — not your live Shopify sales or ad accounts."
            : "Live Shopify sales ÷ the spend you upload."}
        </p>
      </div>

      {showRealGuide ? (
        <s-banner tone="info" heading="Your store — three steps">
          <ol className="mcfly-data-mode__steps">
            <li>
              <s-link href={`/app/settings${location.search}`}>
                {PRODUCT_NOUN.setupAdjustMargin}
              </s-link>
              <span>
                {marginConfirmed
                  ? " — done"
                  : " — lock break-even from your profit margin"}
              </span>
            </li>
            <li>
              <s-link href={`/app/spend${location.search}`}>
                {PRODUCT_NOUN.setupAddSpend}
              </s-link>
              <span>
                {hasLiveSpend
                  ? " — done"
                  : " — download the template, fill daily amounts, upload"}
              </span>
            </li>
            <li>
              <s-link href={`/app${location.search}`}>
                {PRODUCT_NOUN.openTotalRoas}
              </s-link>
              <span> — sales ÷ spend vs break-even</span>
            </li>
          </ol>
          <p className="mcfly-data-mode__steps-note">
            Shopify sales load automatically. You only add ad spend.
          </p>
        </s-banner>
      ) : null}
    </div>
  );
}
