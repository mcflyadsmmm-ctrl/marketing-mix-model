import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { ensureShop } from "../lib/mer-dashboard.server";
import { parsePeriodPreset, resolvePeriod } from "../lib/periods";
import { getSampleDeskEnabled } from "../lib/sample-desk.server";
import { loadBuyerLedger } from "../lib/desk-ledgers.server";
import { ledgerCsvResponse } from "../lib/desk-ledger-csv.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const shop = await ensureShop(session.shop);
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  const range = resolvePeriod(preset, new Date(), shop.ianaTimezone);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);

  const ledger = await loadBuyerLedger({
    shopId: shop.id,
    range,
    currencyCode: shop.currencyCode,
    useSampleDesk,
    limit: 300,
  });

  return ledgerCsvResponse(
    `mcfly-buyers-${preset}.csv`,
    [
      { key: "buyer", label: "Buyer" },
      { key: "firstDay", label: "First day" },
      { key: "lastDay", label: "Last day" },
      { key: "orders", label: "Orders" },
      { key: "lifetimeSales", label: "Lifetime sales" },
      { key: "periodSales", label: "Period sales" },
      { key: "aov", label: "AOV" },
      { key: "daysToSecond", label: "Days to 2nd" },
      { key: "segment", label: "Segment" },
    ],
    ledger.rows,
  );
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
