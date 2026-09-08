import { Form, useLocation, useSearchParams } from "react-router";
import { PRODUCT_NOUN } from "../lib/product-labels";
import {
  resolveFirstSessionPath,
  type FirstSessionPath,
} from "../lib/first-session-path";

export type DataModeBarProps = {
  useSampleDesk: boolean;
  samplePreviewAllowed: boolean;
  /** Real-store activation: margin confirmed on Settings. */
  marginConfirmed: boolean;
  /** Real-store activation: at least one non-sample spend row. */
  hasLiveSpend: boolean;
};

/**
 * Global Sample | Real store control — one place, every desk page.
 * First-session ritual (margin → CSV spend → desk → Allocation) lives here
 * so Overview empties and this bar cannot drift.
 */
export function DataModeBar({
  useSampleDesk,
  samplePreviewAllowed,
  marginConfirmed,
  hasLiveSpend,
}: DataModeBarProps) {
  const location = useLocation();
  const [params] = useSearchParams();
  const forceGuide =
    params.get("guide") === "real" || params.get("guide") === "1";
  const returnTo = `${location.pathname}${location.search}`;
  const action = `/app/data-mode${location.search}`;
  const path = resolveFirstSessionPath({
    marginConfirmed,
    hasLiveSpend,
    useSampleDesk,
    forceGuide,
    search: location.search,
  });

  if (!samplePreviewAllowed) {
    return (
      <div className="mcfly-data-mode mcfly-data-mode--real-only" role="status">
        <p className="mcfly-data-mode__status">
          <strong>Real store</strong>
          <span aria-hidden="true"> · </span>
          Sample preview is off in Settings
        </p>
        {path.showFullGuide ? <FirstSessionGuide path={path} /> : null}
        {path.showMarginNudge ? <MarginNudge path={path} /> : null}
      </div>
    );
  }

  return (
    <div
      className={[
        "mcfly-data-mode",
        useSampleDesk ? "mcfly-data-mode--sample" : "mcfly-data-mode--real",
      ].join(" ")}
    >
      <div className="mcfly-data-mode__row">
        <p className="mcfly-data-mode__label" id="mcfly-data-mode-label">
          Viewing
        </p>
        <div
          className="mcfly-data-mode__toggle"
          role="group"
          aria-labelledby="mcfly-data-mode-label"
        >
          <Form method="post" action={action} className="mcfly-data-mode__form">
            <input type="hidden" name="intent" value="use-sample" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              className={[
                "mcfly-data-mode__btn",
                useSampleDesk ? "mcfly-data-mode__btn--active" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={useSampleDesk}
            >
              Sample
            </button>
          </Form>
          <Form method="post" action={action} className="mcfly-data-mode__form">
            <input type="hidden" name="intent" value="use-real" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              className={[
                "mcfly-data-mode__btn",
                !useSampleDesk ? "mcfly-data-mode__btn--active" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={!useSampleDesk}
            >
              Real store
            </button>
          </Form>
        </div>
        <p className="mcfly-data-mode__hint">{path.viewingHint}</p>
      </div>

      {useSampleDesk ? (
        <s-banner tone="warning" heading={PRODUCT_NOUN.samplePreviewOn}>
          <s-paragraph>
            Explore Total ROAS safely. When you are ready, tap{" "}
            <strong>Real store</strong> — we will walk you through margin, spend,
            the desk, then Spend Allocation.
          </s-paragraph>
        </s-banner>
      ) : null}

      {path.showFullGuide ? <FirstSessionGuide path={path} /> : null}
      {path.showMarginNudge ? <MarginNudge path={path} /> : null}
    </div>
  );
}

function FirstSessionGuide({ path }: { path: FirstSessionPath }) {
  return (
    <s-banner tone="info" heading={path.guideHeading}>
      <ol className="mcfly-data-mode__steps">
        {path.steps.map((step) => (
          <li key={step.id} data-status={step.status}>
            <s-link href={step.href}>{step.label}</s-link>
            <span>{step.hint}</span>
          </li>
        ))}
      </ol>
      <p className="mcfly-data-mode__steps-note">{path.guideNote}</p>
    </s-banner>
  );
}

function MarginNudge({ path }: { path: FirstSessionPath }) {
  return (
    <s-banner tone="info" heading={path.marginNudgeHeading}>
      <s-paragraph>{path.marginNudgeBody}</s-paragraph>
      <s-link href={path.steps[0].href}>{path.steps[0].label}</s-link>
    </s-banner>
  );
}
