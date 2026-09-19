import { PRODUCT_NOUN } from "../lib/product-labels";

export type DataModeBarProps = {
  useSampleDesk: boolean;
  samplePreviewAllowed?: boolean;
  /**
   * Listing capture (`?shot=1`). Keep SAMPLE labeled when sample is on (1.1.4).
   */
  shotMode?: boolean;
  sampleOnlyFreeze?: boolean;
};

/**
 * SAMPLE honesty label for ops freeze / listing shot only.
 * Merchants on Live hosts never see Sample | Live chrome.
 */
export function DataModeBar({
  useSampleDesk,
  samplePreviewAllowed: _samplePreviewAllowed,
  shotMode = false,
  sampleOnlyFreeze = false,
}: DataModeBarProps) {
  // Live hosts: no SAMPLE bar. Freeze + shot keep the honesty label.
  if (!useSampleDesk) return null;
  if (!sampleOnlyFreeze && !shotMode) return null;

  return (
    <div
      className={[
        "mcfly-data-mode",
        "mcfly-data-mode--sample",
        shotMode ? "mcfly-data-mode--shot" : null,
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
    >
      <p className="mcfly-data-mode__status">
        <strong>{PRODUCT_NOUN.sampleData}</strong>
        <span aria-hidden="true"> · </span>
        {PRODUCT_NOUN.sampleHint}
        {!shotMode && sampleOnlyFreeze ? (
          <>
            <span aria-hidden="true"> · </span>
            Live is parked until launch
          </>
        ) : null}
      </p>
    </div>
  );
}
