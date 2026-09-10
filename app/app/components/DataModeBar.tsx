import { useState } from "react";
import { Form, useLocation } from "react-router";
import { PRODUCT_NOUN } from "../lib/product-labels";

export type DataModeBarProps = {
  useSampleDesk: boolean;
  samplePreviewAllowed: boolean;
  /**
   * Listing capture (`?shot=1`). Hide the toggle on Live data.
   * If Sample data is on, keep an unmistakable example-numbers label (1.1.4).
   */
  shotMode?: boolean;
};

/**
 * Global Sample data | Live data control — the only Mcfly chrome above
 * page content. Setup checklists live on Spend, not here.
 */
export function DataModeBar({
  useSampleDesk,
  samplePreviewAllowed,
  shotMode = false,
}: DataModeBarProps) {
  const location = useLocation();
  const [busy, setBusy] = useState(false);

  if (shotMode) {
    if (!useSampleDesk) return null;
    return (
      <div
        className="mcfly-data-mode mcfly-data-mode--sample mcfly-data-mode--shot"
        role="status"
      >
        <p className="mcfly-data-mode__status">
          <strong>{PRODUCT_NOUN.sampleData}</strong>
          <span aria-hidden="true"> · </span>
          {PRODUCT_NOUN.sampleHint}
        </p>
      </div>
    );
  }

  const returnTo = `${location.pathname}${location.search}`;
  const action = `/app/data-mode${location.search}`;

  if (!samplePreviewAllowed) {
    return (
      <div className="mcfly-data-mode mcfly-data-mode--real-only" role="status">
        <p className="mcfly-data-mode__status">
          <strong>{PRODUCT_NOUN.liveData}</strong>
          <span aria-hidden="true"> · </span>
          {PRODUCT_NOUN.sampleHiddenStatus}
        </p>
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
          <Form
            method="post"
            action={action}
            reloadDocument
            className="mcfly-data-mode__form"
            onSubmit={() => setBusy(true)}
          >
            <input type="hidden" name="intent" value="use-sample" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              disabled={busy || useSampleDesk}
              className={[
                "mcfly-data-mode__btn",
                useSampleDesk ? "mcfly-data-mode__btn--active" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={useSampleDesk}
            >
              {PRODUCT_NOUN.sampleData}
            </button>
          </Form>
          <Form
            method="post"
            action={action}
            reloadDocument
            className="mcfly-data-mode__form"
            onSubmit={() => setBusy(true)}
          >
            <input type="hidden" name="intent" value="use-real" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              disabled={busy || !useSampleDesk}
              className={[
                "mcfly-data-mode__btn",
                !useSampleDesk ? "mcfly-data-mode__btn--active" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={!useSampleDesk}
            >
              {PRODUCT_NOUN.liveData}
            </button>
          </Form>
        </div>
        <p className="mcfly-data-mode__hint">
          {useSampleDesk
            ? PRODUCT_NOUN.sampleHint
            : PRODUCT_NOUN.liveDataHint}
        </p>
      </div>
    </div>
  );
}
