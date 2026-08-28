import { Form, useLocation, useSearchParams } from "react-router";
import { PRODUCT_NOUN } from "../lib/product-labels";

export type DataModeBarProps = {
  useSampleDesk: boolean;
  samplePreviewAllowed: boolean;
  /** Real-store activation: margin confirmed on Settings. */
  marginConfirmed: boolean;
  /** Real-store activation: at least one non-sample spend row. */
  hasLiveSpend: boolean;
  /**
   * Listing capture (`?shot=1`). Hide the toggle on Live data.
   * If Sample data is on, keep an unmistakable example-numbers label (1.1.4).
   */
  shotMode?: boolean;
};

/**
 * Global Sample data | Live data control — one place, every desk page.
 * Real-store checklist stays until first margin + spend (not only ?guide=real).
 */
export function DataModeBar({
  useSampleDesk,
  samplePreviewAllowed,
  marginConfirmed,
  hasLiveSpend,
  shotMode = false,
}: DataModeBarProps) {
  const location = useLocation();
  const [params] = useSearchParams();
  const activationIncomplete = !hasLiveSpend;

  if (shotMode) {
    if (!useSampleDesk) return null;
    return (
      <div
        className="mcfly-data-mode mcfly-data-mode--sample mcfly-data-mode--shot"
        role="status"
      >
        <p className="mcfly-data-mode__status">
          <strong>{PRODUCT_NOUN.practiceDesk}</strong>
          <span aria-hidden="true"> · </span>
          {PRODUCT_NOUN.practiceHint}
        </p>
      </div>
    );
  }
  const guideParam =
    params.get("guide") === "real" || params.get("guide") === "1";
  /** Sticky until first trusted Total ROAS inputs exist — uninstall protection. */
  const showRealGuide =
    !useSampleDesk && (activationIncomplete || guideParam);
  const returnTo = `${location.pathname}${location.search}`;
  const action = `/app/data-mode${location.search}`;

  const setupSteps = (
    <ol className="mcfly-data-mode__steps">
      <li>
        <s-link href={`/app/spend${location.search}`}>
          {PRODUCT_NOUN.setupAddSpend}
        </s-link>
        {hasLiveSpend ? " — done" : null}
      </li>
      <li>
        <s-link href={`/app/settings${location.search}`}>
          {PRODUCT_NOUN.setupAdjustMargin}
        </s-link>
        {marginConfirmed ? " — done" : " — optional, for break-even"}
      </li>
      <li>
        <s-link href={`/app${location.search}`}>
          {PRODUCT_NOUN.openTotalRoas}
        </s-link>
      </li>
    </ol>
  );

  if (!samplePreviewAllowed) {
    return (
      <div className="mcfly-data-mode mcfly-data-mode--real-only" role="status">
        <p className="mcfly-data-mode__status">
          <strong>{PRODUCT_NOUN.yourStore}</strong>
          <span aria-hidden="true"> · </span>
          {PRODUCT_NOUN.practiceHiddenStatus}
        </p>
        {activationIncomplete ? (
          <s-banner tone="info" heading={`Get ${PRODUCT_NOUN.totalRoas} on your store`}>
            {setupSteps}
            <p className="mcfly-data-mode__steps-note">
              Shopify sales load automatically. You only add ad spend. A day
              with no spend row is $0 — last month is enough. Profit margin is
              optional — it draws a break-even line.
            </p>
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
              {PRODUCT_NOUN.practiceDesk}
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
              {PRODUCT_NOUN.yourStore}
            </button>
          </Form>
        </div>
        <p className="mcfly-data-mode__hint">
          {useSampleDesk
            ? PRODUCT_NOUN.practiceHint
            : PRODUCT_NOUN.yourStoreHint}
        </p>
      </div>

      {showRealGuide ? (
        <s-banner tone="info" heading={`Get ${PRODUCT_NOUN.totalRoas} on your store`}>
          {setupSteps}
          <p className="mcfly-data-mode__steps-note">
            Shopify sales load automatically. You only add ad spend. A day
            with no spend row is $0 — last month is enough. Profit margin is
            optional — it draws a break-even line.
          </p>
        </s-banner>
      ) : null}
    </div>
  );
}
