import type { OpsDeskIslandModel } from "../lib/ops-desk-island";

/**
 * Black Clover MER–grade operator desk:
 * decision strip (tone + Fraunces takeaway + why + actions) + dense 4-up KPIs.
 */
export function OpsDeskIsland({ model }: { model: OpsDeskIslandModel }) {
  return (
    <section
      className={`mcfly-ops-island mcfly-ops-island--${model.tone}`}
      aria-label="Operator desk"
    >
      <div className="mcfly-ops-island__decision">
        <p className="mcfly-ops-island__kicker">{model.kicker}</p>
        <p className="mcfly-ops-island__takeaway">{model.takeaway}</p>
        {model.why ? (
          <p className="mcfly-ops-island__why">{model.why}</p>
        ) : null}
        {model.actions.length > 0 ? (
          <div className="mcfly-ops-island__actions">
            {model.actions.map((action) =>
              action.primary ? (
                <s-button
                  key={action.id}
                  href={action.href}
                  variant="primary"
                >
                  {action.label}
                </s-button>
              ) : (
                <s-button
                  key={action.id}
                  href={action.href}
                  variant="tertiary"
                >
                  {action.label}
                </s-button>
              ),
            )}
          </div>
        ) : null}
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
            {kpi.delta ? (
              <p className="mcfly-ops-island__kpi-d">{kpi.delta}</p>
            ) : null}
            <p className="mcfly-ops-island__kpi-h">{kpi.hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
