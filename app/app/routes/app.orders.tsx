import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, redirect, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { PeriodControl } from "../components/PeriodControl";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { SalesDepthNav } from "../components/SalesDepthNav";
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
import { loadOrderLedger } from "../lib/desk-ledgers.server";
import { buildOrderLedgerPulse } from "../lib/desk-ledger-pulse";
import { OpsDeskIsland } from "../components/OpsDeskIsland";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const shotMode = listingCaptureFromRequest(request);
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  if (!shotMode && preset === "y3") {
    const next = new URLSearchParams(url.searchParams);
    next.set("period", "ytd");
    throw redirect(`/app/orders?${next.toString()}`);
  }

  const shop = await ensureShop(session.shop);
  const now = new Date();
  const range = resolvePeriod(preset, now, shop.ianaTimezone);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);

  const guestOnly = url.searchParams.get("guest") === "1";
  const returningOnly = url.searchParams.get("returning") === "1";
  const discountedOnly = url.searchParams.get("discounted") === "1";
  const highAovOnly = url.searchParams.get("highAov") === "1";

  const ledger = await loadOrderLedger({
    shopId: shop.id,
    range,
    currencyCode: shop.currencyCode,
    useSampleDesk,
    guestOnly,
    returningOnly,
    discountedOnly,
    highAovOnly,
  });

  const pulse = shotMode
    ? null
    : buildOrderLedgerPulse({
        periodLabel: range.label,
        periodPreset: preset,
        rows: ledger.inputs,
        totalMatched: ledger.totalMatched,
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
    guestOnly,
    returningOnly,
    discountedOnly,
    highAovOnly,
    ledger,
    pulse,
  };
};

export default function OrdersLedgerPage() {
  const {
    preset,
    shotMode,
    useSampleDesk,
    periodLabel,
    hasReadAllOrders,
    periodWiderThanRecentWindow,
    shopDomain,
    currencyCode,
    guestOnly,
    returningOnly,
    discountedOnly,
    highAovOnly,
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

  return (
    <s-page heading="Orders" inlineSize="large">
      {!shotMode ? <SalesDepthNav /> : null}
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
            Order economics for {periodLabel} — opaque buyer keys, no CRM (
            {currencyCode ?? "shop currency"}).
          </p>
          {!shotMode ? <PeriodControl preset={preset} /> : null}
        </header>

        {!shotMode ? (
          <Form method="get" className="mcfly-desk-filters">
            <input type="hidden" name="period" value={preset} />
            <label className="mcfly-desk-filters__item">
              <input
                type="checkbox"
                name="guest"
                value="1"
                defaultChecked={guestOnly}
              />{" "}
              Guest only
            </label>
            <label className="mcfly-desk-filters__item">
              <input
                type="checkbox"
                name="returning"
                value="1"
                defaultChecked={returningOnly}
              />{" "}
              Returning only
            </label>
            <label className="mcfly-desk-filters__item">
              <input
                type="checkbox"
                name="discounted"
                value="1"
                defaultChecked={discountedOnly}
              />{" "}
              Discounted only
            </label>
            <label className="mcfly-desk-filters__item">
              <input
                type="checkbox"
                name="highAov"
                value="1"
                defaultChecked={highAovOnly}
              />{" "}
              High AOV only
            </label>
            <button type="submit" className="mcfly-desk-filters__submit">
              Apply
            </button>
          </Form>
        ) : null}

        {!shotMode && pulse ? <OpsDeskIsland model={pulse} /> : null}

        <DeskSection
          id="order-ledger"
          title="Order ledger"
          blurb={`Showing ${ledger.rows.length} of ${ledger.totalMatched} orders in this period.`}
          hero
          actions={
            !shotMode ? (
              <s-link
                href={`/app/order-ledger.csv?period=${encodeURIComponent(preset)}${guestOnly ? "&guest=1" : ""}${returningOnly ? "&returning=1" : ""}${discountedOnly ? "&discounted=1" : ""}${highAovOnly ? "&highAov=1" : ""}`}
              >
                Export CSV
              </s-link>
            ) : null
          }
        >
          <p className="mcfly-desk-section__note">
            Day board is on{" "}
            <s-link href={`/app/days?period=${encodeURIComponent(preset)}`}>
              Days
            </s-link>
            . Buyer rollup is on{" "}
            <s-link
              href={`/app/customers?period=${encodeURIComponent(preset)}`}
            >
              Customers
            </s-link>
            .
          </p>
          <DeskLedgerTable
            caption={`Order ledger · ${periodLabel}`}
            emptyMessage="No order facts in this period yet — order history backfill fills this desk."
                        columns={[
              { key: "orderId", label: "Order" },
              { key: "dayKey", label: "Day" },
              { key: "orderedAt", label: "Ordered" },
              { key: "total", label: "Total", align: "right" },
              { key: "discount", label: "Discount", align: "right" },
              { key: "shipping", label: "Shipping", align: "right" },
              { key: "tax", label: "Tax", align: "right" },
              { key: "units", label: "Units", align: "right" },
              { key: "buyer", label: "Buyer" },
              { key: "segment", label: "Segment" },
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
