import type { DepthChartModel } from "../lib/shopify-depth-metrics";

function money(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n >= 100 ? 0 : 2,
  }).format(n);
}

function pct(share: number): string {
  return `${Math.round(share * 1000) / 10}%`;
}

function barToneClass(tone?: string): string {
  switch (tone) {
    case "returning":
      return "mcfly-sales-mix__fill--returning";
    case "new":
      return "mcfly-sales-mix__fill--new";
    case "weekend":
      return "mcfly-sales-mix__fill--weekend";
    case "weekday":
      return "mcfly-sales-mix__fill--weekday";
    default:
      return "mcfly-sales-mix__fill--weekday";
  }
}

function HorizontalBars({
  items,
  valueLabel,
}: {
  items: NonNullable<DepthChartModel["bars"]>;
  valueLabel: (value: number, share: number) => string;
}) {
  return (
    <ul className="mcfly-sales-mix__bars mcfly-depth-chart__bars">
      {items.map((bar) => (
        <li key={bar.id} className="mcfly-sales-mix__row">
          <div className="mcfly-sales-mix__meta">
            <span className="mcfly-sales-mix__name">{bar.label}</span>
            <span className="mcfly-sales-mix__amt">
              {valueLabel(bar.value, bar.share)}
            </span>
          </div>
          <div className="mcfly-sales-mix__track" aria-hidden="true">
            <span
              className={`mcfly-sales-mix__fill ${barToneClass(bar.tone)}`}
              style={{
                width: `${Math.max(2, Math.round(bar.share * 100))}%`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function DepthChartCard({ model }: { model: DepthChartModel }) {
  const showBars =
    model.chart === "bars" ||
    model.chart === "share" ||
    model.chart === "curve" ||
    model.chart === "heatmap" ||
    model.chart === "ranked";
  const showHistogram = model.chart === "histogram";
  const showKpis = model.chart === "kpi_row" || (model.kpis?.length ?? 0) > 0;
  const showTable = model.chart === "table";
  const showCallout =
    model.chart === "callout" || Boolean(model.callout?.trim());

  return (
    <section
      className="mcfly-panel mcfly-depth-chart"
      aria-label={model.title}
      id={`depth-${model.id}`}
    >
      <header className="mcfly-panel__head">
        <h2>{model.title}</h2>
        <p className="mcfly-panel__muted">{model.blurb}</p>
      </header>

      {model.emptyReason ? (
        <p className="mcfly-depth-chart__empty">{model.emptyReason}</p>
      ) : null}

      {!model.emptyReason && showKpis && model.kpis?.length ? (
        <div className="mcfly-depth-chart__kpis" role="list">
          {model.kpis.map((kpi) => (
            <div key={kpi.label} className="mcfly-depth-chart__kpi" role="listitem">
              <span className="mcfly-depth-chart__kpi-label">{kpi.label}</span>
              <span className="mcfly-depth-chart__kpi-value">{kpi.value}</span>
              {kpi.hint ? (
                <span className="mcfly-depth-chart__kpi-hint">{kpi.hint}</span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {!model.emptyReason && showBars && model.bars?.length ? (
        <HorizontalBars
          items={model.bars}
          valueLabel={(value, share) => {
            const isRate =
              model.id === "second_order_30_60_90" ||
              model.id === "buyer_concentration";
            if (isRate) return pct(share);
            return `${money(value)} · ${pct(share)}`;
          }}
        />
      ) : null}

      {!model.emptyReason && showHistogram && model.buckets?.length ? (
        <HorizontalBars
          items={model.buckets}
          valueLabel={(value, share) =>
            `${value.toLocaleString()} orders · ${pct(share)}`
          }
        />
      ) : null}

      {!model.emptyReason && showTable && model.headers && model.rows ? (
        <div className="mcfly-depth-chart__table-wrap">
          <table className="mcfly-depth-chart__table">
            <thead>
              <tr>
                {model.headers.map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {model.rows.map((row, i) => (
                <tr key={i}>
                  {row.cells.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!model.emptyReason && showCallout && model.callout ? (
        <p className="mcfly-depth-chart__callout">{model.callout}</p>
      ) : null}
    </section>
  );
}
