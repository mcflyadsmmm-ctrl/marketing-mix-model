import type { SpendFinding } from "../lib/spend-upload-findings";

/**
 * Amp-style Signal / Evidence / Next move — deterministic desk copy only.
 * Reuses Overview clock chrome so Admin iframe (~390px) stays usable.
 */
export function SpendFindingStrip({
  finding,
  "aria-label": ariaLabel = "What to notice",
}: {
  finding: SpendFinding;
  "aria-label"?: string;
}) {
  return (
    <div className="mcfly-book__clock" aria-label={ariaLabel}>
      <div>
        <p className="mcfly-book__clock-k">Signal</p>
        <p className="mcfly-book__clock-v">{finding.signal}</p>
      </div>
      <div>
        <p className="mcfly-book__clock-k">Evidence</p>
        <p className="mcfly-book__clock-v">{finding.evidence}</p>
      </div>
      <div>
        <p className="mcfly-book__clock-k">Next move</p>
        <p className="mcfly-book__clock-v">{finding.next}</p>
      </div>
    </div>
  );
}
