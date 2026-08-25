import {
  NUMBER_HONESTY,
  SPEND_ADD_HREF,
  formatTotalRoasEquation,
} from "../lib/number-honesty";

type NumberHonestyPanelProps = {
  sales: number;
  spend: number;
  mer: number | null;
  periodLabel: string;
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
}: NumberHonestyPanelProps) {
  const equation = formatTotalRoasEquation({ sales, spend, mer });

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
          <s-link href={SPEND_ADD_HREF}>Add spend</s-link>
        </p>
      )}
      <p className="mcfly-honesty__is">{NUMBER_HONESTY.isLine}</p>
      <p className="mcfly-honesty__not">
        {NUMBER_HONESTY.isNotLine}
        {periodLabel ? ` · ${periodLabel}` : ""}
      </p>
    </section>
  );
}
