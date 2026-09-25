import { formatSpendAmount } from "../lib/mer-format";
import { pastedSpendOverNewCustomers } from "../lib/reconciliation-gap";

function money(amount: number | null, currency: string | null): string {
  if (amount == null || !currency) return "—";
  return formatSpendAmount(amount, currency);
}

export function StoreCustomerCost({
  currency,
  spend,
  newCustomers,
  draftNet,
  unknownNet,
  wholesaleNet,
}: {
  currency: string | null;
  spend: number | null;
  newCustomers: number | null;
  draftNet: number | null;
  unknownNet: number | null;
  wholesaleNet: number | null;
}) {
  const perNew = pastedSpendOverNewCustomers(spend, newCustomers);
  const unit = currency ?? "Amount";
  return (
    <section className="mcfly-recon" aria-label="Spend over new customers">
      <table className="mcfly-recon__table">
        <thead>
          <tr>
            <th scope="col">Figure</th>
            <th scope="col">{unit}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">
              Spend per new customer
              <span className="mcfly-recon__def">
                Pasted spend divided by new customers of this store.
              </span>
            </th>
            <td>{money(perNew, currency)}</td>
          </tr>
          <tr>
            <th scope="row">Wholesale</th>
            <td>{money(wholesaleNet, currency)}</td>
          </tr>
          <tr>
            <th scope="row">Draft</th>
            <td>{money(draftNet, currency)}</td>
          </tr>
          <tr>
            <th scope="row">unknown</th>
            <td>{money(unknownNet, currency)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
