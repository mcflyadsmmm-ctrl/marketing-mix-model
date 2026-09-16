import { formatCurrency, formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import type { CashChip } from "../lib/mer-control";

function yoyLabel(pct: number | null): string {
  if (pct == null || !Number.isFinite(pct)) return "—";
  const rounded = Math.round(pct);
  if (rounded === 0) return "even";
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

function vsGoalLabel(
  vsTarget: number | null,
  mer: number | null,
  spend: number,
): string {
  if (!(spend > 0) || mer == null || vsTarget == null || !Number.isFinite(vsTarget)) {
    return "—";
  }
  if (Math.abs(vsTarget) < 0.005) return "at goal";
  const sign = vsTarget > 0 ? "+" : "";
  return `${sign}${formatMer(vsTarget)}×`;
}

/**
 * One table of closed-day windows. Spend / Total ROAS columns appear only when
 * at least one row has entered spend. Empty spend is never 0×.
 */
export function DeskWindowRail({ chips }: { chips: CashChip[] }) {
  if (chips.length === 0) return null;
  const hasSpend = chips.some((chip) => chip.spend > 0);

  return (
    <section className="mcfly-windows" aria-label="Sales by window">
      <table className="mcfly-windows__table">
        <thead>
          <tr>
            <th scope="col">Window</th>
            <th scope="col">Sales</th>
            {hasSpend ? <th scope="col">Spend</th> : null}
            {hasSpend ? (
              <th scope="col">{PRODUCT_NOUN.totalRoas}</th>
            ) : null}
            {hasSpend ? <th scope="col">vs goal</th> : null}
            <th scope="col">vs last year</th>
          </tr>
        </thead>
        <tbody>
          {chips.map((chip) => {
            const rowHasSpend = chip.spend > 0 && chip.mer != null;
            return (
              <tr key={chip.id}>
                <th scope="row">{chip.label}</th>
                <td>{formatCurrency(chip.sales)}</td>
                {hasSpend ? (
                  <td>{chip.spend > 0 ? formatCurrency(chip.spend) : "—"}</td>
                ) : null}
                {hasSpend ? (
                  <td>
                    {rowHasSpend ? `${formatMer(chip.mer)}×` : "—"}
                  </td>
                ) : null}
                {hasSpend ? (
                  <td>{vsGoalLabel(chip.vsTarget, chip.mer, chip.spend)}</td>
                ) : null}
                <td>{yoyLabel(chip.yoySalesPct)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
