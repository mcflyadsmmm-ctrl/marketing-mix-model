/**
 * Compact SAMPLE money stamp on every desk page that still imports this.
 * When SAMPLE is on, DataModeBar warns + offers exit; this stamp makes
 * numbers impossible to mistake for live cash.
 */

import { SAMPLE_MONEY_MARK } from "../lib/cash-desk-copy";

export function SampleDeskBanner({ note }: { note?: string }) {
  return (
    <p className="mcfly-sample-money-mark" role="status">
      {SAMPLE_MONEY_MARK}
      {note ? ` · ${note}` : ""}
    </p>
  );
}
