import { useDeskDrill } from "./DeskDrill";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency } from "../lib/mer-format";
import {
  ORDER_STEP_MIN_BUYERS,
  orderStepFormula,
  orderStepReachLabel,
  orderStepTicketLabel,
  orderStepWaitLabel,
  type OrderStepRow,
} from "../lib/customers-analytics";

/**
 * Ticket, reach, and wait at 1st / 2nd / 3rd / 4th and later — under the
 * days-to-second clock. Sealed at 8 buyers. Guests out. Order history only.
 */
export function GrowthOrderStepsBoard({ steps }: { steps: OrderStepRow[] }) {
  const drill = useDeskDrill();
  const currency = useDeskCurrency();
  const money = (amount: number) => formatCurrency(amount, currency);

  return (
    <section
      className="mcfly-panel mcfly-cust-card mcfly-cust-card--soft mcfly-desk-anchor"
      aria-label="Ticket and wait at each step"
    >
      <div className="mcfly-panel__head">
        <h2>Ticket and wait at each step</h2>
        <p className="mcfly-panel__muted">
          The third order is where they stick. Rows are 1st, 2nd, 3rd, and 4th
          and later. Shopify sales on the order, then who reached this step,
          then typical days since the last one.
        </p>
      </div>

      <div
        className="mcfly-cust-table"
        role="table"
        aria-label="Ticket and wait at each step"
      >
        <div className="mcfly-cust-table__head" role="row">
          <span role="columnheader">Step</span>
          <span role="columnheader" className="mcfly-cust-table__num">
            Shopify sales · reach · wait
          </span>
        </div>
        {steps.map((row) => {
          const ticket = orderStepTicketLabel(row, money);
          const reach = orderStepReachLabel(row);
          const wait = orderStepWaitLabel(row);
          const value = `${ticket} · ${reach} · ${wait}`;
          return (
            <button
              type="button"
              key={row.id}
              className="mcfly-cust-table__row"
              role="row"
              onClick={() =>
                drill?.openDrill({
                  title: `${row.label} order`,
                  value,
                  kicker: "Stored order book",
                  blocks: [
                    { k: "What this is", v: orderStepFormula(row.id) },
                    {
                      k: "Floor",
                      v: row.sealed
                        ? `${row.buyers.toLocaleString()} identified buyers took this step.`
                        : `Needs ${ORDER_STEP_MIN_BUYERS} identified buyers at this step — not $0.`,
                    },
                  ],
                  next: "Order history only — not email, not a catalog, not an industry norm.",
                })
              }
            >
              <span className="mcfly-cust-table__k" role="cell">
                {row.label}
              </span>
              <span className="mcfly-cust-table__num" role="cell">
                {value}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mcfly-cust-note">
        4th and later wait is the 3rd → 4th gap only — later waits stay off this
        row. Floor: {ORDER_STEP_MIN_BUYERS} buyers at the step — not $0.
      </p>
    </section>
  );
}
