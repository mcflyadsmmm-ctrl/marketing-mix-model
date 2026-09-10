import { deskNavHref } from "../lib/desk-nav";
import { PRODUCT_NOUN } from "../lib/product-labels";
import type { PeriodPreset } from "../lib/periods";

function ReportLink({
  title,
  def,
  href,
}: {
  title: string;
  def: string;
  href: string;
}) {
  return (
    <li className="mcfly-book__link">
      <s-link href={href}>{title}</s-link>
      <span className="mcfly-book__link-d">{def}</span>
    </li>
  );
}

export function OverviewSectionIndex({ preset }: { preset: PeriodPreset }) {
  return (
    <section className="mcfly-book" aria-label="Orders, buyers, and timing">
      <p className="mcfly-book__lede">
        Orders, buyers, and timing — Same window as Total Sales.
      </p>
      <ul className="mcfly-book__links">
        <ReportLink
          title={PRODUCT_NOUN.ordersTitle}
          def={PRODUCT_NOUN.ordersMuted}
          href={deskNavHref("/app/orders", { period: preset })}
        />
        <ReportLink
          title={PRODUCT_NOUN.buyersTitle}
          def={PRODUCT_NOUN.buyersMuted}
          href={deskNavHref("/app/buyers", { period: preset })}
        />
        <ReportLink
          title={PRODUCT_NOUN.timingTitle}
          def={PRODUCT_NOUN.timingMuted}
          href={deskNavHref("/app/timing", { period: preset })}
        />
      </ul>
    </section>
  );
}
