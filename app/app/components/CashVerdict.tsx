import { resolveCashVerdict, type CashVerdict } from "../lib/cash-verdict";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";

export type CashVerdictProps = {
  mer: number | null;
  sales: number;
  spend: number;
  breakEvenMer: number | null;
  spendIncomplete: boolean;
  salesFactsIncomplete: boolean;
  useSampleDesk?: boolean;
};

export function CashVerdict(props: CashVerdictProps) {
  const verdict = resolveCashVerdict(props);
  return <CashVerdictView verdict={verdict} facts={props} />;
}

function CashVerdictView({
  verdict,
  facts,
}: {
  verdict: CashVerdict;
  facts: CashVerdictProps;
}) {
  return (
    <section
      className={`mcfly-cash-verdict mcfly-cash-verdict--${verdict.tone}`}
      aria-label={`${PRODUCT_NOUN.totalRoas} this period`}
    >
      <p className="mcfly-cash-verdict__kicker">This period — am I making money on ads?</p>
      <p className="mcfly-cash-verdict__headline">{verdict.headline}</p>
      <p className="mcfly-cash-verdict__body">{verdict.body}</p>
      <dl className="mcfly-cash-verdict__tiles">
        <div>
          <dt>{PRODUCT_NOUN.totalRoas}</dt>
          <dd>
            {verdict.tone === "blocked" ||
            (facts.salesFactsIncomplete && !(facts.sales > 0))
              ? "—"
              : facts.mer != null && Number.isFinite(facts.mer)
                ? `${formatMer(facts.mer)}×`
                : "—"}
          </dd>
        </div>
        <div>
          <dt>Sales</dt>
          <dd>
            {facts.salesFactsIncomplete && !(facts.sales > 0)
              ? "—"
              : formatCurrency(facts.sales)}
          </dd>
        </div>
        <div>
          <dt>Spend</dt>
          <dd>{formatCurrency(facts.spend)}</dd>
        </div>
        <div>
          <dt>{PRODUCT_NOUN.breakEvenShort}</dt>
          <dd>
            {facts.breakEvenMer != null && Number.isFinite(facts.breakEvenMer)
              ? `${formatMer(facts.breakEvenMer)}×`
              : "Set margin"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
