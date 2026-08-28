import { useSearchParams } from "react-router";
import {
  NUMBER_HONESTY,
  formatTotalRoasEquation,
  spendAddHref,
} from "../lib/number-honesty";

type NumberHonestyPanelProps = {
  sales: number;
  spend: number;
  mer: number | null;
  periodLabel: string;
  /** Closed sales days have not landed yet — show why, not a 0× ratio. */
  salesPending?: boolean;
};

/**
 * Listing shot 2 / Overview formula board.
 * Shows the merchant’s equation or an empty-spend honesty line.
 */
export function NumberHonestyPanel({
  sales,
  spend,
  mer,
  periodLabel,
  salesPending = false,
}: NumberHonestyPanelProps) {
  const [searchParams] = useSearchParams();
  const equation = formatTotalRoasEquation({ sales, spend, mer, salesPending });
  const addSpendHref = spendAddHref({
    period: searchParams.get("period"),
    shot: searchParams.get("shot") === "1",
  });

  return (
    <section
      className="mcfly-honesty"
      aria-label={NUMBER_HONESTY.panelLabel}
    >
      <p className="mcfly-honesty__k">{NUMBER_HONESTY.panelLabel}</p>
      {equation ? (
        <p className="mcfly-honesty__eq">{equation}</p>
      ) : (
        <p className="mcfly-honesty__eq mcfly-honesty__eq--empty">
          {NUMBER_HONESTY.empty}{" "}
          <s-link href={addSpendHref}>Add spend</s-link>
        </p>
      )}
      {salesPending ? (
        <p className="mcfly-honesty__is">{NUMBER_HONESTY.salesPending}</p>
      ) : null}
      <p className="mcfly-honesty__is">{NUMBER_HONESTY.isLine}</p>
      <p className="mcfly-honesty__not">
        {NUMBER_HONESTY.isNotLine}
        {periodLabel ? ` · ${periodLabel}` : ""}
      </p>
    </section>
  );
}
