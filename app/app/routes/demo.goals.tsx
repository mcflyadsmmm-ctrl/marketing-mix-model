import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";

import { BookFactGrid } from "../components/ShopifyBookSection";
import { DeskBookPage } from "../components/DeskBookPage";
import { OrderHistoryForecast } from "../components/OrderHistoryForecast";
import { OrderHistoryGoalsBoard } from "../components/OrderHistoryGoalsBoard";
import { SalesGoalGauges } from "../components/SalesGoalGauges";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import { PUBLIC_SAMPLE_TZ } from "../lib/public-sample-constants";
import { loadPublicSampleBook } from "../lib/public-sample-book.server";
import { loadPublicSamplePage } from "../lib/public-sample-page.server";
import {
  buildSalesGoalPeriods,
  salesByMonthFromDayMap,
} from "../lib/sales-goals.server";
import { shopLocalYmd } from "../lib/shop-local-day";

export const headers: HeadersFunction = () => publicDemoHeaders();

const GOALS_ANALYTICS_LEDE =
  "Shopify Analytics shows this period's sales. This page shows plan vs actual for MTD/QTD/YTD.";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const page = await loadPublicSamplePage(request);
  const now = new Date();
  const book = loadPublicSampleBook(now);
  const ymd = shopLocalYmd(now, PUBLIC_SAMPLE_TZ);
  const salesByDay = new Map(
    book.days.map((day) => [day.dateKey, day.sales]),
  );
  const salesByMonth = salesByMonthFromDayMap(
    ymd.y,
    salesByDay,
    now,
    PUBLIC_SAMPLE_TZ,
  );
  const spendByMonth = new Map<number, number>();
  const todayKey = `${ymd.y}-${String(ymd.m).padStart(2, "0")}-${String(ymd.d).padStart(2, "0")}`;
  for (const day of book.days) {
    if (!day.dateKey.startsWith(`${ymd.y}-`)) continue;
    const month = Number.parseInt(day.dateKey.slice(5, 7), 10);
    if (month < 1 || month > 12) continue;
    if (month === ymd.m && day.dateKey > todayKey) continue;
    if (!(day.spend > 0)) continue;
    spendByMonth.set(month, (spendByMonth.get(month) ?? 0) + day.spend);
  }
  const priorSalesByMonth = salesByMonthFromDayMap(
    ymd.y - 1,
    salesByDay,
    now,
    PUBLIC_SAMPLE_TZ,
  );
  const priorYearMonthly = Array.from({ length: 12 }, (_, i) => {
    const value = priorSalesByMonth.get(i + 1);
    return Number.isFinite(value) ? (value as number) : null;
  });
  const goalPeriods = buildSalesGoalPeriods({
    year: ymd.y,
    goals: Array.from({ length: 12 }, () => 0),
    salesByMonth,
    spendByMonth,
    priorYearMonthly,
    now,
    ianaTimezone: PUBLIC_SAMPLE_TZ,
    targetMer: page.targetMer,
    breakEvenMer: null,
  });
  return { ...page, goalPeriods };
};

export default function PublicDemoGoals() {
  const data = useLoaderData<typeof loader>();
  const currency = useDeskCurrency();
  const navigation = useNavigation();
  const periodHasSpend = data.spend > 0;
  const yearHasSpend =
    data.goalPeriods.mtd.spend > 0 ||
    data.goalPeriods.qtd.spend > 0 ||
    data.goalPeriods.ytd.spend > 0;
  const roasLabel =
    data.mer != null && periodHasSpend ? `${formatMer(data.mer)}×` : "—";
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
        Read-only SAMPLE. Same year plan as Admin Goals. Spend is the second
        chapter.
      </p>
      <OrderHistoryGoalsBoard
        view={data.habitGoals}
        year={data.goalsYear}
        readOnly
      />
      <OrderHistoryForecast view={data.orderHistoryForecast} variant="goals" />
      <section
        className="mcfly-book mcfly-book--soft mcfly-goals-hero--soft"
        aria-label={`Sales · ${data.rangeLabel}`}
      >
        <p className="mcfly-book__lede">{GOALS_ANALYTICS_LEDE}</p>
        <div className="mcfly-book__hero">
          <p className="mcfly-book__hero-k">{PRODUCT_NOUN.salesBasisShort}</p>
          <p className="mcfly-book__hero-v">
            {formatCurrency(data.sales.totalSales, currency)}
          </p>
          <p className="mcfly-book__hero-def">
            {data.sales.totalSales === 0
              ? `Certified $0 · ${data.rangeLabel}`
              : `${PRODUCT_NOUN.totalSalesHeroHint} · ${data.rangeLabel}`}
          </p>
        </div>
        {periodHasSpend ? (
          <BookFactGrid
            facts={[
              {
                k: "Spend",
                v: formatCurrency(data.spend, currency),
                d: `Ad spend on the SAMPLE book for ${data.rangeLabel}.`,
              },
              data.mer != null
                ? {
                    k: PRODUCT_NOUN.totalRoas,
                    v: roasLabel,
                    d: PRODUCT_NOUN.definition,
                  }
                : {
                    k: PRODUCT_NOUN.totalRoas,
                    v: "—",
                    d: "Empty spend is —.",
                  },
            ]}
          />
        ) : null}
      </section>
      <SalesGoalGauges
        periods={data.goalPeriods}
        variant="book"
        heading="MTD · QTD · YTD"
        muted={
          yearHasSpend
            ? `Sales vs plan plus ${PRODUCT_NOUN.totalRoas}. The calendar tick is how much of the period has elapsed. Spend optional.`
            : "Sales vs plan. The calendar tick is how much of the period has elapsed. Spend optional."
        }
        targetMer={data.targetMer}
        breakEvenMer={null}
      />
    </DeskBookPage>
  );
}
