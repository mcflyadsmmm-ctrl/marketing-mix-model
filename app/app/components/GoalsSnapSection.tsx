import { SalesGoalGauges } from "./SalesGoalGauges";
import { PRODUCT_NOUN } from "../lib/product-labels";
import type { SalesGoalPeriods } from "../lib/sales-goals.server";

export function GoalsSnapSection({
  periods,
}: {
  periods: SalesGoalPeriods | null;
}) {
  return (
    <section className="mcfly-book" aria-label={PRODUCT_NOUN.goalsSnapTitle}>
      <p className="mcfly-book__lede">
        {PRODUCT_NOUN.goalsSnapTitle} — {PRODUCT_NOUN.goalsSnapMuted}
      </p>
      {periods ? (
        <SalesGoalGauges
          periods={periods}
          variant="inline"
          heading={PRODUCT_NOUN.goalsSnapTitle}
          muted={PRODUCT_NOUN.goalsSnapMuted}
        />
      ) : (
        <p className="mcfly-book__lede">
          Set a year plan to see sales vs days elapsed. No spend required.
        </p>
      )}
      <p className="mcfly-book__cta">
        <s-link href="/app/goals">Open Goals</s-link>
      </p>
    </section>
  );
}
