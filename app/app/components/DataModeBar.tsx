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
  sampleOnlyFreeze: _sampleOnlyFreeze = false,
}: DataModeBarProps) {
  // Live hosts stay unlabeled. The public demo names Sample shop once in the
  // layout. Shot captures have no layout line, so this bar is that one name.
  if (!useSampleDesk || !shotMode) return null;
  void _sampleOnlyFreeze;

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
      <p className="mcfly-data-mode__status">{PRODUCT_NOUN.sampleHint}</p>
    </div>
  );
}
