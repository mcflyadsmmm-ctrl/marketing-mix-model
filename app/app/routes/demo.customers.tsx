import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";

import { CustomerMixChart } from "../components/CustomerMixChart";
import { CustomerRetentionBoard } from "../components/CustomerRetentionBoard";
import { CustomersFirstViewport } from "../components/CustomersFirstViewport";
import { CustomersScoreboard } from "../components/CustomersScoreboard";
import { CustomerWhaleWatch } from "../components/CustomerWhaleWatch";
import { DeskBookPage } from "../components/DeskBookPage";
import { DeskLane } from "../components/DeskLane";
import { deskBookLede } from "../lib/desk-history";
import { CUSTOMERS_FIRST_LANE_LABEL } from "../lib/customers-first-viewport";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import { loadPublicSamplePage } from "../lib/public-sample-page.server";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadPublicSamplePage(request);
};

export default function PublicDemoCustomers() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  return (
    <DeskBookPage
      heading={PRODUCT_NOUN.buyersTitle}
      tillLabel={data.tillLabel}
      preset={data.preset}
      shotMode={data.shotMode}
      useSampleDesk
      isLoading={navigation.state === "loading"}
      showPeriod={false}
      retryHref="/demo/customers"
    >
      <p className="mcfly-book__lede">
        Customer depth below reads SAMPLE Snowdevil order history — not this
        shop’s Shopify orders.
      </p>
      <div className="mcfly-desk-anchor mcfly-scoreboard--customers">
        <p className="mcfly-book__lede">
          {deskBookLede(
            "Shopify Analytics Customers is a customer list. Deeper: RFM-lite, whale watch, repurchase clock, and win-back — plus returning dollars the list does not put next to names.",
          )}
        </p>
        <DeskLane rank="first" label={CUSTOMERS_FIRST_LANE_LABEL}>
          <CustomersFirstViewport
            analytics={data.customers}
            rfm={data.customers.rfm}
            salesPending={false}
            useSampleDesk
          />
          <CustomerMixChart analytics={data.customers} salesPending={false} />
          <CustomersScoreboard
            book={data.book}
            depth={data.depth}
            periodLabel={data.rangeLabel}
            salesPending={false}
            useSampleDesk
          />
        </DeskLane>
        <DeskLane rank="next" label="What to do">
          <div className="mcfly-cust-action-row">
            <CustomerRetentionBoard analytics={data.customers} />
            <CustomerWhaleWatch rfm={data.customers.rfm} />
          </div>
        </DeskLane>
      </div>
    </DeskBookPage>
  );
}
