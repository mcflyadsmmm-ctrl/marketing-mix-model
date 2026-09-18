import { formatCurrency, formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import {
  chipZone,
  type CashChip,
  type MonthClosePlan,
} from "../lib/mer-control";
import { useDeskDrill } from "./DeskDrill";
import { useDeskCurrency } from "../lib/desk-currency";

function merLabel(chip: CashChip): string {
  if (!(chip.spend > 0) || chip.mer == null) return "—";
  return `${formatMer(chip.mer)}×`;
}

function zoneCopy(zone: ReturnType<typeof chipZone>): string {
  switch (zone) {
    case "ok":
      return "At goal";
    case "below":
      return "Below goal";
    case "empty":
      return "No spend";
    default: {
      const _never: never = zone;
      return _never;
    }
  }
}

function yoyCopy(chip: CashChip): string | null {
  if (chip.yoySalesPct == null) {
    return chip.priorSales == null ? "No last-year days" : null;
  }
  const sign = chip.yoySalesPct >= 0 ? "+" : "−";
  return `${sign}${Math.round(Math.abs(chip.yoySalesPct))}% sales vs last year`;
}

/**
 * Certified-day scoreboard: Yesterday, last N, this month / quarter / year.
 * Labels come from the board — this file never paints glossary chips.
 */
export function CertifiedScoreboard({
  chips,
  targetMer,
  plan,
}: {
  chips: CashChip[];
  targetMer: number;
  plan: MonthClosePlan | null;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  if (chips.length === 0) return null;

  const goal =
    targetMer > 0 ? `${formatMer(targetMer)}× goal` : "Set a goal in Settings";

  return (
    <section className="mcfly-scoreboard mcfly-scoreboard--soft" aria-label="Certified Total ROAS">
      <p className="mcfly-scoreboard__kicker">
        Certified windows · {PRODUCT_NOUN.definition} · {goal}
      </p>
      <div className="mcfly-scoreboard__row">
        {chips.map((chip) => {
          const zone = chipZone(chip);
          const value = merLabel(chip);
          const yoy = yoyCopy(chip);
          return (
            <button
              key={chip.id}
              type="button"
              className={`mcfly-scoreboard__chip mcfly-scoreboard__chip--soft mcfly-scoreboard__chip--${zone}`}
              onClick={() =>
                drill?.openDrill({
                  title: chip.label,
                  value,
                  kicker: goal,
                  blocks: [
                    { k: "What this is", v: PRODUCT_NOUN.definition },
                    {
                      k: "Sales",
                      v: formatCurrency(chip.sales, currency),
                    },
                    {
                      k: "Spend",
                      v:
                        chip.spend > 0
                          ? formatCurrency(chip.spend, currency)
                          : "Empty spend is not a ratio",
                    },
                    yoy ? { k: "Last year", v: yoy } : null,
                    chip.fromKey && chip.toKey
                      ? {
                          k: "Days",
                          v:
                            chip.fromKey === chip.toKey
                              ? chip.fromKey
                              : `${chip.fromKey} → ${chip.toKey}`,
                        }
                      : null,
                  ].filter(
                    (block): block is { k: string; v: string } =>
                      block != null,
                  ),
                  next: "Explorer below is the same sales ÷ spend, by day.",
                  foot: zoneCopy(zone),
                })
              }
            >
              <span className="mcfly-scoreboard__k">{chip.label}</span>
              <span className="mcfly-scoreboard__v">{value}</span>
              <span className={`mcfly-scoreboard__zone mcfly-scoreboard__zone--${zone}`}>
                {zoneCopy(zone)}
              </span>
              <span className="mcfly-scoreboard__sub">
                {chip.spend > 0
                  ? `${formatCurrency(chip.sales, currency)} sales · ${formatCurrency(chip.spend, currency)} spend`
                  : `${formatCurrency(chip.sales, currency)} sales · no spend`}
              </span>
              {yoy ? (
                <span
                  className={`mcfly-scoreboard__delta${
                    chip.yoySalesPct == null || chip.yoySalesPct === 0
                      ? ""
                      : chip.yoySalesPct > 0
                        ? " mcfly-scoreboard__delta--up"
                        : " mcfly-scoreboard__delta--down"
                  }`}
                >
                  {yoy}
                </span>
              ) : null}
              <span className="mcfly-kpi__hint">Click for detail</span>
            </button>
          );
        })}
      </div>
      {plan ? (
        <p className="mcfly-scoreboard__plan">
          {plan.cannotHit
            ? "Spend left at goal is already used. Freeze paid. Email stays as-is."
            : `Spend left at goal ${formatCurrency(Math.max(0, plan.maxRem), currency)} if last 7 days' sales hold. Email stays as-is.`}
        </p>
      ) : null}
    </section>
  );
}
