import {
  resolveCashVerdict,
  type CashVerdict,
} from "../lib/cash-verdict";
import { PRODUCT_NOUN } from "../lib/product-labels";

export type CashVerdictProps = {
  mer: number | null;
  sales: number;
  spend: number;
  breakEvenMer: number | null;
  spendIncomplete: boolean;
  salesFactsIncomplete: boolean;
  salesUntrustedZero?: boolean;
  useSampleDesk?: boolean;
};

/**
 * One-line cash verdict above the dial — no metric tiles.
 * Total ROAS / Sales / Spend / Break-even already live on the hero.
 */
export function CashVerdict(props: CashVerdictProps) {
  const verdict = resolveCashVerdict(props);
  return <CashVerdictView verdict={verdict} />;
}

function CashVerdictView({ verdict }: { verdict: CashVerdict }) {
  return (
    <section
      className={`mcfly-cash-verdict mcfly-cash-verdict--${verdict.tone}`}
      aria-label={`${PRODUCT_NOUN.totalRoas} this period`}
    >
      <p className="mcfly-cash-verdict__kicker">
        This period — am I making money on ads?
      </p>
      <p className="mcfly-cash-verdict__headline">{verdict.headline}</p>
      <p className="mcfly-cash-verdict__body">{verdict.body}</p>
    </section>
  );
}
