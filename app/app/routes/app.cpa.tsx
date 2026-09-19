import { useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { CpaExplorer } from "../components/CpaExplorer";
import { CpaPaybackDesk } from "../components/CpaPaybackDesk";
import { CpaWindowCards } from "../components/CpaWindowCards";
import { DeskBookPage } from "../components/DeskBookPage";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import {
  CPA_CONTRAST,
  CPA_EMPTY_SPEND,
  CPA_NO_BUYERS,
  type CpaWindowId,
} from "../lib/cpa-desk";
import { loadCpaDesk } from "../lib/cpa-desk.server";
import { PRODUCT_NOUN } from "../lib/product-labels";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadCpaDesk(request);
};

export default function CpaPage() {
  const {
    windows,
    days,
    explorerRanges,
    paybacks,
    paybackBase,
    hasSpend,
    preset,
    shotMode,
    useSampleDesk,
    salesError,
    tillLabel,
    todaySalesTruncated,
    todaySalesUnavailable,
    shopifyOrderWindowLimited,
  } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const [selectedId, setSelectedId] = useState<CpaWindowId>("this_month");
  const selected =
    windows.find((window) => window.id === selectedId) ?? windows[0]!;
  const payback = paybacks[selected.id];
  const selectedHasSpend = selected.spend > 0;
  const buyersMissing =
    selectedHasSpend &&
    selected.buyersKnown &&
    selected.identifiedBuyers === 0;

  return (
    <DeskBookPage
      heading="CPA"
      tillLabel={tillLabel}
      preset={preset}
      shotMode={shotMode}
      useSampleDesk={useSampleDesk}
      isLoading={isLoading}
      showPeriod={false}
      todaySalesTruncated={!useSampleDesk && todaySalesTruncated}
      todaySalesUnavailable={!useSampleDesk && todaySalesUnavailable}
      shopifyOrderWindowLimited={!useSampleDesk && shopifyOrderWindowLimited}
      periodLabel="This month · Last 28 days"
      salesError={Boolean(salesError) && !shotMode}
      salesErrorBody="Sales didn’t load. Retry to see cash CPA from entered spend."
      retryHref="/app/cpa"
    >
      {useSampleDesk && !shotMode ? (
        <SampleDeskBanner note="CPA below uses SAMPLE spend and buyers — not this shop’s live ledger." />
      ) : null}

      <section className="mcfly-well mcfly-well--scoreboard mcfly-book mcfly-cpa" aria-label="Customer acquisition cost">
        <p className="mcfly-book__lede">{CPA_CONTRAST}</p>

        {!hasSpend ? (
          <p className="mcfly-book__lede">{CPA_EMPTY_SPEND}</p>
        ) : (
          <p className="mcfly-book__lede">
            This month and Last 28 live on the cards. Cash CPA is entered spend ÷
            Shopify buyers — not ads-manager CPA.
          </p>
        )}

        {hasSpend ? (
          <CpaWindowCards
            windows={windows}
            selectedId={selected.id}
            onSelect={setSelectedId}
          />
        ) : null}

        {buyersMissing ? (
          <p className="mcfly-book__lede">{CPA_NO_BUYERS}</p>
        ) : null}

        {hasSpend ? (
          <CpaPaybackDesk
            window={selected}
            payback={payback}
            historyLimited={paybackBase.historyLimited}
          />
        ) : null}

        <CpaExplorer
          days={days}
          ranges={explorerRanges}
          selectedWindow={selected.id}
          onSelectWindow={setSelectedId}
        />
      </section>

      <footer className="mcfly-book__links">
        <s-link href="/app/ltv">{PRODUCT_NOUN.openLtv}</s-link>
        <s-link href="/app/spend">Spend Upload</s-link>
      </footer>
    </DeskBookPage>
  );
}

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/cpa" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
