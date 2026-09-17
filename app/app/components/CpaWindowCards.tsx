import { formatCurrency, formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import {
  CPA_NO_BUYERS,
  type CpaWindowId,
  type CpaWindowSnapshot,
} from "../lib/cpa-desk";
import { useDeskCurrency } from "../lib/desk-currency";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";

function moneyOrDash(value: number | null, currency: string): string {
  return value != null ? formatCurrency(value, currency) : "—";
}

export function CpaWindowCards({
  windows,
  selectedId,
  onSelect,
}: {
  windows: CpaWindowSnapshot[];
  selectedId: CpaWindowId;
  onSelect: (id: CpaWindowId) => void;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();

  return (
    <section className="mcfly-yoy mcfly-yoy--glance mcfly-cpa__windows" aria-label="Cash CPA windows">
      <div className="mcfly-yoy__grid mcfly-cpa__window-grid">
        {windows.map((window) => {
          const selected = window.id === selectedId;
          const hasSpend = window.spend > 0;
          const zone = !hasSpend
            ? "empty"
            : window.cashCpa != null
              ? "even"
              : "empty";
          const hero = moneyOrDash(window.cashCpa, currency);
          const foot =
            window.id === "this_month"
              ? {
                  left: hasSpend ? formatCurrency(window.spend, currency) : "—",
                  leftK: "Spend",
                  right:
                    window.buyersKnown && window.identifiedBuyers > 0
                      ? window.identifiedBuyers.toLocaleString()
                      : "—",
                  rightK: "Buyers",
                }
              : {
                  left: moneyOrDash(window.cashCac, currency),
                  leftK: "Cash CAC",
                  right:
                    window.buyersKnown && window.newCustomers > 0
                      ? window.newCustomers.toLocaleString()
                      : "—",
                  rightK: "New buyers",
                };
          const amer =
            window.amer != null ? `${formatMer(window.amer)}×` : "—";
          return (
            <button
              type="button"
              key={window.id}
              className={`mcfly-yoy__card mcfly-yoy__card--drill mcfly-cpa__card mcfly-yoy__card--${zone}${selected ? " mcfly-cpa__card--on" : ""}`}
              aria-pressed={selected}
              onClick={() => {
                onSelect(window.id);
                drill?.openDrill({
                  title: window.label,
                  value: hero,
                  kicker: window.rangeLabel ?? window.label,
                  blocks: [
                    { k: "Cash CPA", v: hero },
                    {
                      k: "Spend",
                      v: hasSpend ? formatCurrency(window.spend, currency) : "—",
                    },
                    {
                      k: "Identified buyers",
                      v:
                        window.buyersKnown && window.identifiedBuyers > 0
                          ? window.identifiedBuyers.toLocaleString()
                          : "—",
                    },
                    { k: "Cash CAC", v: moneyOrDash(window.cashCac, currency) },
                    { k: PRODUCT_NOUN.amer, v: amer },
                    {
                      k: "What this is",
                      v: "Entered spend ÷ Shopify buyers in this window. Not ads-manager CPA. Empty spend stays — , never $0.",
                    },
                  ],
                  next: "Open LTV for first-90 value next to this cost.",
                  nextHref: "/app/ltv",
                  nextLabel: "Open LTV",
                  foot:
                    hasSpend && window.buyersKnown && window.identifiedBuyers === 0
                      ? CPA_NO_BUYERS
                      : undefined,
                });
              }}
            >
              <p className="mcfly-yoy__k">
                <span className="mcfly-yoy__k-main">
                  <DeskIcon name="customers" />
                  {window.label}
                  {window.rangeLabel ? (
                    <span className="mcfly-yoy__range"> · {window.rangeLabel}</span>
                  ) : null}
                </span>
              </p>
              <p className={`mcfly-yoy__v mcfly-yoy__v--${zone}`}>{hero}</p>
              <p className="mcfly-cpa__card-def">
                {hasSpend
                  ? "Cash CPA · spend ÷ identified buyers"
                  : "No typed spend · Cash CPA stays —"}
              </p>
              <p className="mcfly-yoy__prior">
                <span>
                  {foot.leftK} {foot.left}
                </span>
                <span>
                  {foot.rightK} {foot.right}
                </span>
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
