import { SalesGoalGauges } from "./SalesGoalGauges";
import { PRODUCT_NOUN } from "../lib/product-labels";
import type { SalesGoalPeriods } from "../lib/sales-goals.server";

/** One lede, one set of bars, one link out — the Goals chapter of Overview. */
export function GoalsSnapSection({
  periods,
}: {
  periods: SalesGoalPeriods | null;
}) {
  const planned =
    periods != null &&
    (periods.mtd.goal > 0 || periods.qtd.goal > 0 || periods.ytd.goal > 0);

  return (
    <section
      className="mcfly-book mcfly-desk-anchor"
      id="mcfly-goals"
      aria-label={PRODUCT_NOUN.goalsSnapTitle}
    >
      {planned && periods ? (
        <>
          <p className="mcfly-book__lede">
            {PRODUCT_NOUN.goalsSnapTitle} — {PRODUCT_NOUN.goalsSnapMuted}
          </p>
          <SalesGoalGauges
            periods={periods}
            variant="inline"
            heading={PRODUCT_NOUN.goalsSnapTitle}
            muted={PRODUCT_NOUN.goalsSnapMuted}
          />
          <p className="mcfly-book__cta">
            <s-link href="/app/goals">Open Goals</s-link>
          </p>
        </>
      ) : (
        <p className="mcfly-book__cta">
          <s-link href="/app/goals">
            Set a year plan — sales vs days elapsed, no spend required
          </s-link>
        </p>
      )}
    </section>
  );
}
