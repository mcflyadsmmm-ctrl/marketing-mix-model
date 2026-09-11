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
 * Plain-English cash call under the till — no metric tiles.
 * When the multiple is not trusted or is below break-even, one next step.
 */
export function CashVerdict(props: CashVerdictProps) {
  const verdict = resolveCashVerdict(props);
  return <CashVerdictView verdict={verdict} />;
}

function CashVerdictView({ verdict }: { verdict: CashVerdict }) {
  const quiet = verdict.tone === "ok";
  return (
    <section
      className={[
        "mcfly-cash-verdict",
        `mcfly-cash-verdict--${verdict.tone}`,
        quiet ? "mcfly-cash-verdict--quiet" : null,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${PRODUCT_NOUN.totalRoas} this period`}
    >
      <p className="mcfly-cash-verdict__kicker">
        This period — am I making money on ads?
      </p>
      <p className="mcfly-cash-verdict__headline">{verdict.headline}</p>
      {quiet ? null : (
        <p className="mcfly-cash-verdict__body">{verdict.body}</p>
      )}
      {verdict.nextAction ? (
        <div className="mcfly-cash-verdict__action">
          <s-button href={verdict.nextAction.href} variant="secondary">
            {verdict.nextAction.label}
          </s-button>
        </div>
      ) : null}
    </section>
  );
}
