import { useMemo, useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";

import { CertifiedScoreboard } from "../components/CertifiedScoreboard";
import { CpaExplorer } from "../components/CpaExplorer";
import { CpaPaybackDesk } from "../components/CpaPaybackDesk";
import { CopySpendPair } from "../components/MorningHabitStrip";
import { spendFirstFoldSalesHint } from "../lib/cash-trust-copy";
import { CpaWindowCards } from "../components/CpaWindowCards";
import { DualCloseLine } from "../components/DualCloseLine";
import { MarketingSpendRoom } from "../components/MarketingSpendRoom";
import { PeriodControl } from "../components/PeriodControl";
import { SpendFindingStrip } from "../components/SpendFindingStrip";
import { SpendExplorer } from "../components/SpendExplorer";
import {
  SpendMixSection,
  useSpendPanelScroll,
} from "../components/SpendMixSection";
import { useDeskCurrency } from "../lib/desk-currency";
import {
  buildCpaPaybackView,
  CPA_CONTRAST,
  CPA_EMPTY_SPEND,
  cpaExplorerRangeOf,
  rangeDayKeys,
  resolveCpaDeskWindows,
  type CpaDayPoint,
  type CpaExplorerRange,
  type CpaWindowId,
} from "../lib/cpa-desk";
import { cashPaybackDays } from "../lib/cash-payback";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { formatSpendOnFile, spendOnFileHint } from "../lib/spend-on-file";
import { formatTotalRoasEquation, formatOnlineRoasLine, NUMBER_HONESTY, spendPairCopyText } from "../lib/number-honesty";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import { PUBLIC_SAMPLE_TZ } from "../lib/public-sample-constants";
import { loadPublicSamplePage } from "../lib/public-sample-page.server";
import { SAMPLE_LEDGER_HANDOFF } from "../lib/sample-live-handoff";
import { spendChannelLabel } from "../lib/spend-channel-label";
import { HONEST_MER_LINE } from "../lib/spend-upload-findings";
import {
  applyExplorerMode,
  bucketExplorerRows,
  summarizeExplorer,
  type ExplorerDailyRow,
} from "../lib/spend-explorer";
import {
  spendPairCoverage,
} from "../lib/spend-pair-coverage";
import type { SpendExplorerSeriesView } from "../components/SpendExplorer";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadPublicSamplePage(request);
};

function publicExplorerSeries(
  explorerDays: Array<{ dateKey: string; sales: number }>,
  cpaDays: CpaDayPoint[],
  targetMer: number,
  rangeLabel: string,
): SpendExplorerSeriesView {
  const salesByDay = new Map(
    explorerDays.map((day) => [day.dateKey, day.sales]),
  );
  const keys = explorerDays.map((day) => day.dateKey).sort();
  const fromKey = keys[0] ?? "";
  const toKey = keys[keys.length - 1] ?? "";
  const rows: ExplorerDailyRow[] = cpaDays
    .filter((day) => day.dateKey >= fromKey && day.dateKey <= toKey)
    .map((day) => {
      const sales = salesByDay.get(day.dateKey);
      const salesOnFile = sales != null && Number.isFinite(sales);
      return {
        dateKey: day.dateKey,
        sales: salesOnFile ? sales : 0,
        spend: day.spend,
        channels: [],
        salesOnFile,
      };
    });
  const buckets = bucketExplorerRows(rows, "Day");
  const plot = applyExplorerMode(buckets, "total");
  const summary = summarizeExplorer(rows, { bucketCount: plot.length });
  return {
    buckets: plot,
    summary,
    mode: "total",
    granularity: "Day",
    range: "custom",
    windowLabel: rangeLabel,
    targetMer,
    breakEvenMer: null,
    showSales: true,
    fromKey,
    toKey,
    asOfKey: toKey,
  };
}

const EMPTY_WINDOWS = {
  week: [],
  month: [],
  quarter: [],
  year: [],
};

export default function PublicDemoSpend() {
  const data = useLoaderData<typeof loader>();
  const currency = useDeskCurrency();
  const navigation = useNavigation();
  useSpendPanelScroll();
  const isLoading = navigation.state === "loading";
  const hasSpend = data.spend > 0;
  const periodKeys = new Set(data.explorerDays.map((day) => day.dateKey));
  const pairCoverage = spendPairCoverage({
    salesDays: data.explorerDays
      .filter((day) => day.sales > 0)
      .map((day) => day.dateKey),
    spendDays: data.cpaDays
      .filter((day) => day.spend > 0 && periodKeys.has(day.dateKey))
      .map((day) => day.dateKey),
  });
  const pairWithheld = hasSpend && pairCoverage.withholdRatio;
  const paintedMer = pairWithheld ? null : data.mer;
  const roasValue =
    hasSpend && paintedMer != null && Number.isFinite(paintedMer)
      ? `${formatMer(paintedMer)}×`
      : "—";
  const pairEquation = formatTotalRoasEquation({
    sales: data.sales.totalSales,
    spend: data.spend,
    mer: paintedMer,
    salesPending: false,
    currency,
  });
  const pairCopyText = spendPairCopyText({
    sales: data.sales.totalSales,
    spend: data.spend,
    mer: paintedMer,
    salesPending: false,
    currency,
  });
  const onlineLine = hasSpend
    ? formatOnlineRoasLine({
        totalSales: data.sales.totalSales,
        spend: data.spend,
        mix: data.depth.sourceSalesShare,
        currency,
      })
    : null;
  const [cpaSelectedId, setCpaSelectedId] = useState<CpaWindowId>("this_month");
  const cpaSelected =
    data.cpaWindows.find((window) => window.id === cpaSelectedId) ??
    data.cpaWindows[0]!;
  const cpaPayback = buildCpaPaybackView({
    cashCac: cpaSelected.cashCac,
    avgRevenueD30: data.ltv.revenue30,
    avgRevenueD90: data.ltv.revenue90,
    paybackDays: cashPaybackDays(
      cpaSelected.cashCac,
      data.ltv.revenue30,
      data.ltv.revenue90,
      data.ltv.revenue365,
    ),
  });
  const explorer = useMemo(
    () =>
      publicExplorerSeries(
        data.explorerDays,
        data.cpaDays,
        data.targetMer,
        data.rangeLabel,
      ),
    [data.cpaDays, data.explorerDays, data.rangeLabel, data.targetMer],
  );
  const mixTotal = data.channelSpend.reduce((sum, row) => sum + row.amount, 0);
  const explorerRanges = useMemo(() => {
    const windows = resolveCpaDeskWindows(new Date(), PUBLIC_SAMPLE_TZ);
    return {
      this_month: rangeDayKeys(
        cpaExplorerRangeOf("this_month", windows),
        PUBLIC_SAMPLE_TZ,
      ),
      last_28: rangeDayKeys(
        cpaExplorerRangeOf("last_28", windows),
        PUBLIC_SAMPLE_TZ,
      ),
      "90d": rangeDayKeys(cpaExplorerRangeOf("90d", windows), PUBLIC_SAMPLE_TZ),
      ytd: rangeDayKeys(cpaExplorerRangeOf("ytd", windows), PUBLIC_SAMPLE_TZ),
    } satisfies Record<CpaExplorerRange, { fromKey: string; toKey: string }>;
  }, []);

  return (
    <s-page heading="Spend" inlineSize="large">
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
        {!data.shotMode ? (
          <PeriodControl
            preset={data.preset}
            language="spend"
            orderBookDepth="paid_full"
          />
        ) : null}

        <s-banner tone="info" heading="Example spend is on">
          <s-paragraph>{SAMPLE_LEDGER_HANDOFF}</s-paragraph>
        </s-banner>
        <p className="mcfly-book__lede">
          Read-only SAMPLE ledger. In the installed app you type a day or paste an
          Ads Manager CSV. This demo does not save spend.
        </p>

        <section
          id="mcfly-roas"
          className="mcfly-well mcfly-well--scoreboard mcfly-book mcfly-book--soft mcfly-roas-book--soft"
          aria-label="Sales, spend, and Total ROAS"
        >
          <p className="mcfly-book__lede">
            Shopify Analytics shows sales, not {PRODUCT_NOUN.totalRoas}. This page
            shows {PRODUCT_NOUN.definition} — {HONEST_MER_LINE} Empty spend paints
            —, never 0×.
          </p>
          <div className="mcfly-book__glance mcfly-book__glance--kpis mcfly-book__glance--soft">
            <div className="mcfly-book__kpi mcfly-book__kpi--soft">
              <p className="mcfly-book__kpi-k">Sales</p>
              <p className="mcfly-book__kpi-v">
                {formatCurrency(data.sales.totalSales, currency)}
              </p>
              <p className="mcfly-book__kpi-hint">
                {spendFirstFoldSalesHint({
                  salesPending: false,
                  periodLabel: data.rangeLabel,
                  todaySalesTruncated: false,
                  todaySalesUnavailable: false,
                })}
              </p>
            </div>
            <div className="mcfly-book__kpi mcfly-book__kpi--soft">
              <p className="mcfly-book__kpi-k">Spend</p>
              <p
                className="mcfly-book__kpi-v"
                data-empty={
                  formatSpendOnFile(data.spend, currency) === "—"
                    ? "true"
                    : undefined
                }
              >
                {formatSpendOnFile(data.spend, currency)}
              </p>
              <p className="mcfly-book__kpi-hint">{spendOnFileHint(data.spend)}</p>
            </div>
            <div className="mcfly-book__kpi mcfly-book__kpi--soft mcfly-book__kpi--lead">
              <p className="mcfly-book__kpi-k">{PRODUCT_NOUN.totalRoas}</p>
              <p
                className="mcfly-book__kpi-v"
                data-empty={roasValue === "—" ? "true" : undefined}
              >
                {roasValue}
              </p>
              {hasSpend && pairEquation ? (
                <div className="mcfly-spend-pair-copy-row">
                  <p className="mcfly-book__kpi-hint">{pairEquation}</p>
                  <CopySpendPair text={pairCopyText} />
                </div>
              ) : (
                <p className="mcfly-book__kpi-hint">{NUMBER_HONESTY.formula}</p>
              )}
            </div>
          </div>
          {hasSpend ? (
            <p className="mcfly-book__kpi-hint">{pairCoverage.caption}</p>
          ) : null}
          {hasSpend && onlineLine ? (
            <p className="mcfly-book__kpi-hint">{onlineLine}</p>
          ) : null}
          {hasSpend ? null : (
            <SpendFindingStrip
              finding={{
                signal: "Sales without entered spend",
                evidence: HONEST_MER_LINE,
                next: "SAMPLE Snowdevil already has spend on file in this demo.",
              }}
            />
          )}
        </section>

        <section id="mcfly-explorer" aria-label="Certified windows and spend explorer">
          <CertifiedScoreboard
            chips={data.cashControl.chips}
            targetMer={data.targetMer}
            plan={data.cashControl.plan}
          />
          <SpendExplorer
            series={explorer}
            period={data.preset}
            shotMode={data.shotMode}
            basePath="/demo/spend"
            compare
            quiet={false}
          />
          {data.cashControl.dualClose ? (
            <DualCloseLine
              close={data.cashControl.dualClose}
              targetMer={data.targetMer}
            />
          ) : null}
          <MarketingSpendRoom board={data.cashControl} />
        </section>

        <SpendMixSection
          metrics={{
            period: { label: data.rangeLabel },
            sales: data.sales.totalSales,
            totalSpend: data.spend,
            mer: data.mer,
            breakEvenMer: null,
            salesPending: false,
            allocation: null,
            channelMix: data.channelSpend.map((row) => ({
              channel: row.channel,
              amount: row.amount,
              share: mixTotal > 0 ? row.amount / mixTotal : 0,
            })),
            spendCoverage: { incomplete: false },
            cashActionReady: true,
            spendRecon: null,
            blockedMockAsLive: false,
          }}
          cashControl={data.cashControl}
          history={null}
          windowSets={{ period: EMPTY_WINDOWS, lookback: EMPTY_WINDOWS }}
          preset={data.preset}
          shotMode={data.shotMode}
          useSampleDesk
          salesError={null}
          todaySalesUnavailable={false}
          todaySalesTruncated={false}
          salesFactsIncomplete={null}
          shopifyOrderWindowLimited={false}
        />

        <section
          id="mcfly-cpa"
          className="mcfly-well mcfly-well--scoreboard mcfly-book mcfly-cpa"
          aria-label="Customer acquisition cost"
        >
          <p className="mcfly-book__lede">{CPA_CONTRAST}</p>
          {!hasSpend ? (
            <p className="mcfly-book__lede">{CPA_EMPTY_SPEND}</p>
          ) : (
            <CpaWindowCards
              windows={data.cpaWindows}
              selectedId={cpaSelected.id}
              onSelect={setCpaSelectedId}
            />
          )}
          {hasSpend ? (
            <CpaPaybackDesk
              window={cpaSelected}
              payback={cpaPayback}
              historyLimited={false}
            />
          ) : null}
          <CpaExplorer
            days={data.cpaDays}
            ranges={explorerRanges}
            selectedWindow={cpaSelected.id}
            onSelectWindow={setCpaSelectedId}
          />
        </section>

        <div className="mcfly-well mcfly-well--scoreboard mcfly-well--soft">
          <table className="mcfly-public-ledger">
            <thead>
              <tr>
                <th>Day</th>
                <th>Sales</th>
                <th>Spend</th>
                <th>Channels</th>
              </tr>
            </thead>
            <tbody>
              {data.ledgerDays.map((day) => (
                <tr key={day.dateKey}>
                  <td>{day.dateKey}</td>
                  <td>{formatCurrency(day.sales, currency)}</td>
                  <td>{formatCurrency(day.spend, currency)}</td>
                  <td>
                    {Object.entries(day.spendByChannel)
                      .filter(([, amount]) => amount > 0)
                      .map(([channel]) => spendChannelLabel({ channel }))
                      .join(" · ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </s-page>
  );
}
