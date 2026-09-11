import {
  ACQUISITION_GLANCE_COPY,
  resolveAcquisitionGlance,
  type AcquisitionGlanceInput,
} from "../lib/acquisition-glance";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import type { PeriodPreset } from "../lib/periods";

export type AcquisitionGlanceProps = AcquisitionGlanceInput & {
  preset: PeriodPreset;
};

export function AcquisitionGlance({ preset, ...input }: AcquisitionGlanceProps) {
  const glance = resolveAcquisitionGlance(input);

  return (
    <section
      className="mcfly-tab-snap mcfly-tab-snap--acq"
      aria-label={`${ACQUISITION_GLANCE_COPY.title} · ${input.periodLabel}`}
    >
      <div className="mcfly-tab-snap__head">
        <h2>{ACQUISITION_GLANCE_COPY.title}</h2>
        <p className="mcfly-tab-snap__muted">
          {ACQUISITION_GLANCE_COPY.kicker}
        </p>
      </div>

      {glance.available ? (
        <>
          <div className="mcfly-tab-snap__tiles">
            {glance.amerLabel != null ? (
              <div className="mcfly-tab-snap__tile">
                <p className="mcfly-tab-snap__tile-k">
                  {ACQUISITION_GLANCE_COPY.amerLabel}
                </p>
                <p className="mcfly-tab-snap__tile-v">{glance.amerLabel}</p>
                <p className="mcfly-tab-snap__tile-def">
                  {ACQUISITION_GLANCE_COPY.amerDef}
                </p>
              </div>
            ) : null}
            <div className="mcfly-tab-snap__tile mcfly-tab-snap__tile--accent">
              <p className="mcfly-tab-snap__tile-k">
                {ACQUISITION_GLANCE_COPY.newLabel}
              </p>
              <p className="mcfly-tab-snap__tile-v">
                {formatCurrency(glance.newCustomerSales)}
              </p>
              <p className="mcfly-tab-snap__tile-def">
                {Math.round(glance.newSharePct)}% ·{" "}
                {ACQUISITION_GLANCE_COPY.splitDef}
              </p>
            </div>
            <div className="mcfly-tab-snap__tile">
              <p className="mcfly-tab-snap__tile-k">
                {ACQUISITION_GLANCE_COPY.returningLabel}
              </p>
              <p className="mcfly-tab-snap__tile-v">
                {formatCurrency(glance.returningCustomerSales)}
              </p>
              <p className="mcfly-tab-snap__tile-def">
                {Math.round(glance.returningSharePct)}% ·{" "}
                {ACQUISITION_GLANCE_COPY.splitDef}
              </p>
            </div>
          </div>
          <p className="mcfly-tab-snap__sentence">{glance.headline}</p>
          {glance.caveat ? (
            <p className="mcfly-tab-snap__muted">{glance.caveat}</p>
          ) : null}
          {glance.coverageLine ? (
            <p className="mcfly-tab-snap__muted">{glance.coverageLine}</p>
          ) : null}
          {glance.sampleNote ? (
            <p className="mcfly-tab-snap__muted">{glance.sampleNote}</p>
          ) : null}
        </>
      ) : (
        <p className="mcfly-tab-snap__empty">{glance.copy}</p>
      )}

      <div className="mcfly-tab-snap__cta">
        <s-link href={`/app/ltv?period=${preset}`}>
          {PRODUCT_NOUN.openCustomerInsights}
        </s-link>
      </div>
    </section>
  );
}
