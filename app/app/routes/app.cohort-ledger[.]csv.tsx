import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { ensureShop } from "../lib/mer-dashboard.server";
import { getSampleDeskEnabled } from "../lib/sample-desk.server";
import { loadCohortLedger } from "../lib/desk-ledgers.server";
import { ledgerCsvResponse } from "../lib/desk-ledger-csv.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);

  const ledger = await loadCohortLedger({
    shopId: shop.id,
    currencyCode: shop.currencyCode,
    useSampleDesk,
  });

  return ledgerCsvResponse(
    "mcfly-cohorts.csv",
    [
      { key: "cohortMonth", label: "Cohort" },
      { key: "buyers", label: "Buyers" },
      { key: "revenueD30", label: "Rev 30d" },
      { key: "revenueD90", label: "Rev 90d" },
      { key: "revenueD365", label: "Rev 365d" },
      { key: "ltvD30", label: "LTV 30d" },
      { key: "ltvD90", label: "LTV 90d" },
      { key: "ltvD365", label: "LTV 365d" },
      { key: "ordersD30", label: "Orders 30d" },
      { key: "ordersD90", label: "Orders 90d" },
      { key: "ordersD365", label: "Orders 365d" },
    ],
    ledger.rows,
  );
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
