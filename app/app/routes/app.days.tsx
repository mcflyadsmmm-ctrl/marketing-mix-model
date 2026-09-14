import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { PeriodControl } from "../components/PeriodControl";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { DeskSection } from "../components/DeskSection";
import { DeskLedgerTable } from "../components/DeskLedgerTable";
import { listingCaptureFromRequest } from "../lib/listing-capture";
import { ensureShop } from "../lib/mer-dashboard.server";
import {
  parsePeriodPreset,
  periodMayExceedShopifyOrderWindow,
  resolvePeriod,
} from "../lib/periods";
import { getSampleDeskEnabled } from "../lib/sample-desk.server";
import { authenticate } from "../shopify.server";
import { DeepHistoryBanner } from "../components/DeepHistoryBanner";
import {
  resolveDeepHistoryHonesty,
  scopesIncludeReadAllOrders,
} from "../lib/deep-history-honesty";
import { SalesDayAccuracyStrip } from "../components/SalesDayAccuracyStrip";
import { loadSalesDayAccuracy } from "../lib/sales-day-accuracy.server";
import { loadDayLedger } from "../lib/desk-ledgers.server";
import { buildDayLedgerPulse } from "../lib/desk-ledger-pulse";
import { OpsDeskIsland } from "../components/OpsDeskIsland";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const shotMode = listingCaptureFromRequest(request);
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  if (!shotMode && preset === "y3") {
    const next = new URLSearchParams(url.searchParams);
    next.set("period", "ytd");
    throw redirect(`/app/days?${next.toString()}`);
  }

  const shop = await ensureShop(session.shop);
  const now = new Date();
  const range = resolvePeriod(preset, now, shop.ianaTimezone);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);

  const accuracy = await loadSalesDayAccuracy({
    shopId: shop.id,
    range,
    ianaTimezone: shop.ianaTimezone,
    now,
    enqueueRepair: !useSampleDesk && !shotMode,
    grantedScopes: session.scope,
    useSampleDesk,
    admin: useSampleDesk || shotMode ? undefined : admin,
  });

  const ledger = await loadDayLedger({
    shopId: shop.id,
    range,
    ianaTimezone: shop.ianaTimezone,
    currencyCode: shop.currencyCode,
    useSampleDesk,
    openDayKey: accuracy.openDayKey,
    missingDayKeys: accuracy.missingDayKeys,
  });

  const pulse = shotMode
    ? null
    : buildDayLedgerPulse({
        periodLabel: range.label,
        periodPreset: preset,
        rows: ledger.inputs,
        currencyCode: shop.currencyCode,
      });

  return {
    preset,
    shotMode,
    useSampleDesk,
    periodLabel: range.label,
    hasReadAllOrders: scopesIncludeReadAllOrders(session.scope),
    periodWiderThanRecentWindow: periodMayExceedShopifyOrderWindow(range),
    shopDomain: session.shop,
    currencyCode: shop.currencyCode,
    accuracy,
    ledger,
    pulse,
  };
};

export default function DaysLedgerPage() {
  const {
    preset,
    shotMode,
    useSampleDesk,
    periodLabel,
    hasReadAllOrders,
    periodWiderThanRecentWindow,
    shopDomain,
    currencyCode,
    accuracy,
    ledger,
    pulse,
  } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const deepHistory = resolveDeepHistoryHonesty({
    hasReadAllOrders,
    periodWiderThanRecentWindow,
    useSampleDesk,
  });

  const strongest = ledger.rows.find((r) => r.dayKey === ledger.strongest);
  const softest = ledger.rows.find((r) => r.dayKey === ledger.softest);

  return (
    <s-page heading="Days" inlineSize="large">
      {useSampleDesk && !shotMode ? <SampleDeskBanner /> : null}
      {!shotMode && deepHistory.kind !== "hidden" ? (
        <DeepHistoryBanner kind={deepHistory.kind} shopDomain={shopDomain} />
      ) : null}
      <div
        className="mcfly-desk mcfly-desk--bc"
        aria-busy={isLoading || undefined}
      >
        <header className="mcfly-depth-page__head">
          <p className="mcfly-panel__muted">
            Closed shop-local day ledger for {periodLabel} — one trustworthy row
            per day ({currencyCode ?? "shop currency"}).
          </p>
          {!shotMode ? <PeriodControl preset={preset} /> : null}
        </header>
        {!shotMode ? (
          <SalesDayAccuracyStrip accuracy={accuracy} when="problems" />
        ) : null}
        {!shotMode && pulse ? <OpsDeskIsland model={pulse} /> : null}

        <DeskSection
          id="day-ledger"
          title="Day ledger"
          blurb={`${ledger.rawCount} fact day${ledger.rawCount === 1 ? "" : "s"} in this window.`}
          hero
          actions={
            !shotMode ? (
              <s-link
                href={`/app/period-ledger.csv?period=${encodeURIComponent(preset)}`}
              >
                Export CSV
              </s-link>
            ) : null
          }
        >
          {ledger.strongest && strongest ? (
            <p className="mcfly-desk-section__note">
              Strongest {ledger.strongest}: {strongest.sales}
              {ledger.softest && softest
                ? ` · Softest ${ledger.softest}: ${softest.sales}`
                : ""}
              . Rhythm charts stay on{" "}
              <s-link href={`/app/sales?period=${encodeURIComponent(preset)}`}>
                Sales
              </s-link>
              .
            </p>
          ) : null}
          <DeskLedgerTable
            caption={`Day ledger · ${periodLabel}`}
            emptyMessage="No closed day facts in this period yet — backfill fills the board."
            columns={[
              { key: "dayKey", label: "Day" },
              { key: "sales", label: "Sales", align: "right" },
              { key: "netSales", label: "Net", align: "right" },
              { key: "grossSales", label: "Gross", align: "right" },
              { key: "orders", label: "Orders", align: "right" },
              { key: "aov", label: "AOV", align: "right" },
              { key: "newBuyers", label: "New", align: "right" },
              { key: "returningBuyers", label: "Returning", align: "right" },
              { key: "newSales", label: "New $", align: "right" },
              { key: "returningSales", label: "Returning $", align: "right" },
              { key: "guestOrders", label: "Guest", align: "right" },
              { key: "asOf", label: "As of" },
              { key: "source", label: "Source" },
              { key: "flag", label: "Flag" },
            ]}
            rows={ledger.rows}
          />
        </DeskSection>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
