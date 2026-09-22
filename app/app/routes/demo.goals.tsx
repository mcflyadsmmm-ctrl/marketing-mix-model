import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { calculateBreakEvenMer } from "@mcfly/mer-core";

import { DeskBookPage } from "../components/DeskBookPage";
import { OrderHistoryForecast } from "../components/OrderHistoryForecast";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import { loadPublicSamplePage } from "../lib/public-sample-page.server";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadPublicSamplePage(request);
};

export default function PublicDemoGoals() {
  const data = useLoaderData<typeof loader>();
  const currency = useDeskCurrency();
  const navigation = useNavigation();
  const mtd = data.yoyCards.find((card) => card.id === "mtd");
  const be = calculateBreakEvenMer(data.marginPct);
  const beLabel =
    be != null && Number.isFinite(be) ? `${formatMer(be)}×` : "—";
  const roasLabel =
    data.mer != null && data.spend > 0 ? `${formatMer(data.mer)}×` : "—";
  return (
    <DeskBookPage
      heading="Goals"
      tillLabel={data.tillLabel}
      preset={data.preset}
      shotMode={data.shotMode}
      useSampleDesk
      isLoading={navigation.state === "loading"}
      retryHref="/demo/goals"
    >
      <p className="mcfly-book__lede">
        Read-only SAMPLE. In the app you set a monthly sales plan from Shopify
        orders. Spend is the second chapter.
      </p>
      <OrderHistoryForecast view={data.orderHistoryForecast} variant="goals" />
      <div className="mcfly-well mcfly-well--scoreboard mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--peeks-4 mcfly-kpi-grid--soft">
        <article className="mcfly-kpi mcfly-kpi--soft mcfly-kpi--hero">
          <span className="mcfly-kpi__label">This month sales</span>
          <span className="mcfly-kpi__value">
            {mtd ? formatCurrency(mtd.sales, currency) : "—"}
          </span>
          <span className="mcfly-kpi__sub">
            {mtd?.priorSales != null
              ? `vs last year ${formatCurrency(mtd.priorSales, currency)}`
              : "SAMPLE Snowdevil"}
          </span>
        </article>
        <article className="mcfly-kpi mcfly-kpi--soft">
          <span className="mcfly-kpi__label">Optional {PRODUCT_NOUN.totalRoas}</span>
          <span className="mcfly-kpi__value">{roasLabel}</span>
          <span className="mcfly-kpi__sub">
            {data.spend > 0
              ? `${formatCurrency(data.sales.totalSales, currency)} ÷ ${formatCurrency(data.spend, currency)}`
              : "empty = —"}
          </span>
        </article>
        <article className="mcfly-kpi mcfly-kpi--soft">
          <span className="mcfly-kpi__label">{PRODUCT_NOUN.breakEvenTotalRoas}</span>
          <span className="mcfly-kpi__value">{beLabel}</span>
          <span className="mcfly-kpi__sub">
            At {Math.round(data.marginPct * 100)}% profit margin
          </span>
        </article>
      </div>
    </DeskBookPage>
  );
}
