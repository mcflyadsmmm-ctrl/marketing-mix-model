import { useMemo, useState } from "react";
import { costChanges, parseCostFile, rankVariants } from "../lib/dated-cost-file";
import { formatFreshness, formatSpendAmount } from "../lib/mer-format";
import type { ReadStatus, ReconciliationDeskData } from "../lib/reconciliation-gap";
import {
  FAILED_LOAD,
  LTV_UNAVAILABLE,
  PRIOR_YEAR_MISSING,
  emptyOrdersLine,
  liveHeaderRange,
  loadingLine,
  spendNote,
  totalRoasDisplay,
  trialEndLine,
} from "../lib/reconciliation-states";

const SUPPORT_HREF = "mailto:mcflyadsmmm@gmail.com";

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

export function ReconciliationDesk({
  data,
  shopName = null,
  live = false,
  spendEntered = false,
  spendPartial = false,
  totalRoas = null,
  customerLtvAvailable = true,
  priorYearLoaded = null,
  trialEndsAt = null,
}: {
  data: ReconciliationDeskData;
  shopName?: string | null;
  /** Live cards never take SAMPLE spend, ROAS, or LTV. */
  live?: boolean;
  spendEntered?: boolean;
  spendPartial?: boolean;
  totalRoas?: number | null;
  customerLtvAvailable?: boolean;
  /** False when last year was checked and nothing loaded. Null skips the line. */
  priorYearLoaded?: boolean | null;
  /**
   * ISO trial end only when the app already has one.
   * Partner trialEndsAt is not stored on this desk, so this stays null
   * until a real timestamp is passed in.
   */
  trialEndsAt?: string | null;
}) {
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
  const headerRange = liveHeaderRange(data.windows);
  const loading = loadingLine(data.windows);
  const trialLine = trialEndLine(trialEndsAt);
  const roasValue = live ? totalRoasDisplay(spendEntered ? totalRoas : null) : "—";
  const roasNote = live
    ? spendNote({
        spendEntered,
        spendPartial,
        totalRoas: spendEntered ? totalRoas : null,
      })
    : null;

  function windowMoney(status: ReadStatus, amount: number | null): string {
    if (status !== "checked") return "—";
    return money(amount, currency);
  }

  function windowPct(status: ReadStatus, value: number | null): string {
    if (status !== "checked") return "—";
    return pct(value);
  }

  return (
    <section className="mcfly-recon" aria-label="Reconciliation">
      {live ? (
        <header className="mcfly-recon__live">
          <h2>{shopName || "—"}</h2>
          <p>{headerRange || "—"}</p>
        </header>
      ) : null}
      {loading ? <p className="mcfly-recon__state">{loading}</p> : null}
      {live && priorYearLoaded === false ? (
        <p className="mcfly-recon__state">{PRIOR_YEAR_MISSING}</p>
      ) : null}
      {live ? (
        <p className="mcfly-recon__roas">
          <span>Total ROAS</span> <strong>{roasValue}</strong>
          {roasNote ? <span className="mcfly-recon__def">{roasNote}</span> : null}
        </p>
      ) : null}
      {live && !customerLtvAvailable ? (
        <p className="mcfly-recon__state">{LTV_UNAVAILABLE}</p>
      ) : null}
      {trialLine ? <p className="mcfly-recon__state">{trialLine}</p> : null}
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
              {window.status === "loading" ? (
                <p className="mcfly-recon__state">Loading your Shopify order history.</p>
              ) : null}
              {window.status === "failed" ? (
                <p className="mcfly-recon__state">
                  {FAILED_LOAD} <a href="/app">Retry</a>
                  {" · "}
                  <a href={SUPPORT_HREF}>Support</a>
                </p>
              ) : null}
              {window.status === "checked" && window.orderCount === 0 ? (
                <p className="mcfly-recon__state">
                  {emptyOrdersLine(window.since, window.until)}{" "}
                  <a href="/app?period=ytd">Change the dates</a>
                </p>
              ) : null}
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
                  <td>{windowMoney(window.status, window.ourNetSales)}</td>
                </tr>
                <tr>
                  <th scope="row">
                    Shopify sales report
                    <span className="mcfly-recon__def">{REPORT_DEFINITION}</span>
                  </th>
                  <td>{windowMoney(window.status, window.shopifyReportTotal)}</td>
                </tr>
                <tr>
                  <th scope="row">Discounts</th>
                  <td>{windowMoney(window.status, window.discounts)}</td>
                </tr>
                <tr>
                  <th scope="row">Refunds</th>
                  <td>{windowMoney(window.status, window.refunds)}</td>
                </tr>
                <tr>
                  <th scope="row">Refund rate</th>
                  <td>{windowPct(window.status, window.refundRate)}</td>
                </tr>
                <tr>
                  <th scope="row">Mix</th>
                  <td>
                    {window.mix.map((share) => (
                      <span key={share.label} className="mcfly-recon__mix">
                        {share.label === "Unknown" ? "unknown" : share.label}{" "}
                        {windowPct(window.status, share.share)}
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
                      <td>{windowMoney(window.status, line.amount)}</td>
                    </tr>
                  );
                })}
                <tr>
                  <th scope="row">Refund restock</th>
                  <td>{windowMoney(window.status, window.restock)}</td>
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
