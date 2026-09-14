import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { DeskSection } from "../components/DeskSection";
import { DeskLedgerTable } from "../components/DeskLedgerTable";
import { listingCaptureFromRequest } from "../lib/listing-capture";
import { ensureShop } from "../lib/mer-dashboard.server";
import { getSampleDeskEnabled } from "../lib/sample-desk.server";
import { authenticate } from "../shopify.server";
import { loadCohortLedger } from "../lib/desk-ledgers.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shotMode = listingCaptureFromRequest(request);
  const shop = await ensureShop(session.shop);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);

  const ledger = await loadCohortLedger({
    shopId: shop.id,
    currencyCode: shop.currencyCode,
    useSampleDesk,
  });

  return {
    shotMode,
    useSampleDesk,
    currencyCode: shop.currencyCode,
    ledger,
  };
};

export default function CohortsLedgerPage() {
  const { shotMode, useSampleDesk, currencyCode, ledger } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  return (
    <s-page heading="Cohorts" inlineSize="large">
      {useSampleDesk && !shotMode ? <SampleDeskBanner /> : null}
      <div
        className="mcfly-desk mcfly-desk--bc"
        aria-busy={isLoading || undefined}
      >
        <header className="mcfly-depth-page__head">
          <p className="mcfly-panel__muted">
            First-order month cohorts — LTV at 30 / 90 / 365 (
            {currencyCode ?? "shop currency"}).
          </p>
        </header>

        <DeskSection
          id="cohort-ledger"
          title="Cohort ledger"
          blurb="Each row is a first-order month. Charts that explain these rows stay on Customers."
          hero
        >
          <p className="mcfly-desk-section__note">
            Repeat health charts live on{" "}
            <s-link href="/app/customers">Customers</s-link>.
          </p>
          <DeskLedgerTable
            caption="Cohort LTV ledger"
            emptyMessage="No cohort facts yet — order history backfill builds first-order months."
                        columns={[
              { key: "cohortMonth", label: "Cohort" },
              { key: "buyers", label: "Buyers", align: "right" },
              { key: "revenueD30", label: "Rev 30d", align: "right" },
              { key: "revenueD90", label: "Rev 90d", align: "right" },
              { key: "revenueD365", label: "Rev 365d", align: "right" },
              { key: "ltvD30", label: "LTV 30d", align: "right" },
              { key: "ltvD90", label: "LTV 90d", align: "right" },
              { key: "ltvD365", label: "LTV 365d", align: "right" },
              { key: "ordersD30", label: "Orders 30d", align: "right" },
              { key: "ordersD90", label: "Orders 90d", align: "right" },
              { key: "ordersD365", label: "Orders 365d", align: "right" },
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
