import { useMemo, useState } from "react";
import { costChanges, parseCostFile, rankVariants } from "../lib/dated-cost-file";
import { formatFreshness, formatSpendAmount } from "../lib/mer-format";
import type { ReadStatus, ReconciliationDeskData } from "../lib/reconciliation-gap";

const NET_DEFINITION =
  "Current product subtotal after discounts and returns. Tax is not in this number. Days use the shop timezone.";
const REPORT_DEFINITION =
  "Shopify sales-report total for these same days. This total stays its own total.";

function statusLabel(status: ReadStatus): string {
  switch (status) {
    case "checked":
      return "Checked";
    case "loading":
      return "Still loading";
    case "failed":
      return "Failed";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

function money(amount: number | null, currency: string | null): string {
  if (amount == null || !currency) return "—";
  return formatSpendAmount(amount, currency);
}

function pct(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export function ReconciliationDesk({ data }: { data: ReconciliationDeskData }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [costText, setCostText] = useState("");
  const currency = data.currency;
  const unit = currency ?? "Amount";
  const costFile = useMemo(() => (costText.trim() ? parseCostFile(costText) : null), [costText]);
  const asOf = data.windows.find((window) => window.id === "mtd")?.until || "";
  const changes = costFile && asOf ? costChanges(costFile, asOf) : [];
  const ranked =
    costFile && asOf && data.variantLines
      ? rankVariants({ lines: data.variantLines, file: costFile, asOf })
      : [];

  return (
    <section className="mcfly-recon" aria-label="Reconciliation">
      <div className="mcfly-recon__windows">
        {data.windows.map((window) => (
          <article key={window.id} className="mcfly-recon__window" aria-label={window.label}>
            <header className="mcfly-recon__head">
              <h2>{window.label}</h2>
              <p>
                <span className={`mcfly-recon__status mcfly-recon__status--${window.status}`}>
                  {statusLabel(window.status)}
                </span>
                {window.checkedAt ? <span>{formatFreshness(window.checkedAt)}</span> : null}
              </p>
              <p className="mcfly-recon__range">
                {window.since && window.until ? `${window.since} – ${window.until}` : "—"}
              </p>
            </header>
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
                    Our net sales
                    <span className="mcfly-recon__def">{NET_DEFINITION}</span>
                  </th>
                  <td>{money(window.ourNetSales, currency)}</td>
                </tr>
                <tr>
                  <th scope="row">
                    Shopify sales report
                    <span className="mcfly-recon__def">{REPORT_DEFINITION}</span>
                  </th>
                  <td>{money(window.shopifyReportTotal, currency)}</td>
                </tr>
                <tr>
                  <th scope="row">Discounts</th>
                  <td>{money(window.discounts, currency)}</td>
                </tr>
                <tr>
                  <th scope="row">Refunds</th>
                  <td>{money(window.refunds, currency)}</td>
                </tr>
                <tr>
                  <th scope="row">Refund rate</th>
                  <td>{pct(window.refundRate)}</td>
                </tr>
                <tr>
                  <th scope="row">Mix</th>
                  <td>
                    {window.mix.map((share) => (
                      <span key={share.label} className="mcfly-recon__mix">
                        {share.label === "Unknown" ? "unknown" : share.label} {pct(share.share)}
                      </span>
                    ))}
                  </td>
                </tr>
                {window.lines.map((line) => {
                  const key = `${window.id}:${line.id}`;
                  const open = openKey === key;
                  return (
                    <tr key={line.id}>
                      <th scope="row">
                        <button
                          type="button"
                          className="mcfly-recon__line"
                          aria-expanded={open}
                          onClick={() => setOpenKey(open ? null : key)}
                        >
                          {line.label}
                        </button>
                      </th>
                      <td>{money(line.amount, currency)}</td>
                    </tr>
                  );
                })}
                <tr>
                  <th scope="row">Refund restock</th>
                  <td>{money(window.restock, currency)}</td>
                </tr>
              </tbody>
            </table>
            {window.lines.map((line) => {
              const key = `${window.id}:${line.id}`;
              if (openKey !== key) return null;
              return (
                <div key={key} className="mcfly-recon__orders">
                  {line.orders.length === 0 ? (
                    <p>—</p>
                  ) : (
                    <table className="mcfly-recon__table">
                      <thead>
                        <tr>
                          <th scope="col">Order</th>
                          <th scope="col">Day</th>
                          <th scope="col">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {line.orders.map((order) => (
                          <tr key={order.id}>
                            <th scope="row">{order.name}</th>
                            <td>{order.day}</td>
                            <td>{order.detail || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </article>
        ))}
      </div>
      <section className="mcfly-recon__costs" aria-label="Dated costs">
        <h2>Costs</h2>
        <p className="mcfly-recon__def">
          Start date on each cost. Provisional until an invoice settles it. A later invoice shows the change and leaves a closed day on the earlier cost. A missing cost stays blank.
        </p>
        <label className="mcfly-recon__file">
          Cost file
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (!file) {
                setCostText("");
                return;
              }
              void file.text().then(setCostText);
            }}
          />
        </label>
        {costFile ? (
          <table className="mcfly-recon__table">
            <thead>
              <tr>
                <th scope="col">Variant</th>
                <th scope="col">Closed unit ({unit})</th>
                <th scope="col">Open unit ({unit})</th>
                <th scope="col">Change ({unit})</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((row) => (
                <tr key={row.variant}>
                  <th scope="row">{row.variant}</th>
                  <td>{money(row.closedUnitCost, currency)}</td>
                  <td>{money(row.openUnitCost, currency)}</td>
                  <td>{money(row.change, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>—</p>
        )}
        {ranked.length > 0 ? (
          <table className="mcfly-recon__table mcfly-cohort">
            <thead>
              <tr>
                <th scope="col">Variant</th>
                <th scope="col">Left ({unit})</th>
                <th scope="col">Restock ({unit})</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((row) => (
                <tr key={row.variantId}>
                  <th scope="row">{row.label}</th>
                  <td>{money(row.left, currency)}</td>
                  <td>{money(row.restock, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </section>
  );
}
