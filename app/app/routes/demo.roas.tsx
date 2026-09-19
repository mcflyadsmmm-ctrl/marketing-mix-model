import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";

import { CertifiedScoreboard } from "../components/CertifiedScoreboard";
import { DualCloseLine } from "../components/DualCloseLine";
import { PeriodControl } from "../components/PeriodControl";
import { SpendFindingStrip } from "../components/SpendFindingStrip";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { formatTotalRoasEquation, NUMBER_HONESTY } from "../lib/number-honesty";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import { loadPublicSamplePage } from "../lib/public-sample-page.server";
import { SAMPLE_SPEND_NOT_LIVE } from "../lib/sample-live-handoff";
import { HONEST_MER_LINE } from "../lib/spend-upload-findings";
import { useDeskCurrency } from "../lib/desk-currency";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadPublicSamplePage(request);
};

export default function PublicDemoRoas() {
  const data = useLoaderData<typeof loader>();
  const currency = useDeskCurrency();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const hasSpend = data.spend > 0;
  const roasValue =
    hasSpend && data.mer != null && Number.isFinite(data.mer)
      ? `${formatMer(data.mer)}×`
      : "—";
  const pairEquation = formatTotalRoasEquation({
    sales: data.sales.totalSales,
    spend: data.spend,
    mer: data.mer,
    salesPending: false,
    currency,
  });
  return (
    <s-page heading={PRODUCT_NOUN.totalRoas} inlineSize="large">
      <div
        className={[
          "mcfly-desk",
          "mcfly-desk--sample",
          "mcfly-roas--soft",
          data.shotMode ? "mcfly-desk--shot" : null,
          isLoading ? "mcfly-desk--loading" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {!data.shotMode ? <PeriodControl preset={data.preset} /> : null}
        <p className="mcfly-book__lede">{SAMPLE_SPEND_NOT_LIVE}</p>
        <p className="mcfly-score__greeting">
          {roasValue} {pairEquation ? `· ${pairEquation}` : NUMBER_HONESTY.formula}
        </p>
        <p className="mcfly-score__trust">{HONEST_MER_LINE}</p>
        {hasSpend ? null : (
          <SpendFindingStrip
            finding={{
              signal: "Sales without entered spend",
              evidence: HONEST_MER_LINE,
              next: "SAMPLE Snowdevil already has spend on file in this demo.",
            }}
          />
        )}
        <CertifiedScoreboard
          chips={data.cashControl.chips}
          targetMer={data.targetMer}
          plan={data.cashControl.plan}
        />
        <DualCloseLine close={data.cashControl.dualClose} targetMer={data.targetMer} />
        <p className="mcfly-book__lede">
          {formatCurrency(data.sales.totalSales, currency)} sales ·{" "}
          {formatCurrency(data.spend, currency)} entered spend this window.
        </p>
      </div>
    </s-page>
  );
}
