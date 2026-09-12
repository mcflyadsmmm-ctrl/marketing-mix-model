import type { OpsDeskIslandModel } from "../lib/ops-desk-island";

/**
 * Black Clover MER–style operator island: one decision takeaway + dense 4-up.
 * Craft bar for Overview — calm Shopify Analytics body, Fraunces KPI values.
 */
export function OpsDeskIsland({ model }: { model: OpsDeskIslandModel }) {
  return (
    <section className="mcfly-ops-island" aria-label="Operator desk">
      <div className="mcfly-ops-island__decision">
        <p className="mcfly-ops-island__kicker">{model.kicker}</p>
        <p className="mcfly-ops-island__takeaway">{model.takeaway}</p>
      </div>
      <div className="mcfly-ops-island__kpis" role="list">
        {model.kpis.map((kpi) => (
          <div
            key={kpi.id}
            className={
              kpi.accent
                ? "mcfly-ops-island__kpi mcfly-ops-island__kpi--accent"
                : "mcfly-ops-island__kpi"
            }
            role="listitem"
          >
            <p className="mcfly-ops-island__kpi-k">{kpi.label}</p>
            <p className="mcfly-ops-island__kpi-v">{kpi.value}</p>
            <p className="mcfly-ops-island__kpi-h">{kpi.hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
