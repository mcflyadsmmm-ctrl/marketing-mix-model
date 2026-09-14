import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { ensureShop } from "../lib/mer-dashboard.server";
import { parsePeriodPreset, resolvePeriod } from "../lib/periods";
import { getSampleDeskEnabled } from "../lib/sample-desk.server";
import { loadOrderLedger } from "../lib/desk-ledgers.server";
import { ledgerCsvResponse } from "../lib/desk-ledger-csv.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const shop = await ensureShop(session.shop);
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  const range = resolvePeriod(preset, new Date(), shop.ianaTimezone);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);

  const ledger = await loadOrderLedger({
    shopId: shop.id,
    range,
    currencyCode: shop.currencyCode,
    useSampleDesk,
    guestOnly: url.searchParams.get("guest") === "1",
    returningOnly: url.searchParams.get("returning") === "1",
    discountedOnly: url.searchParams.get("discounted") === "1",
    highAovOnly: url.searchParams.get("highAov") === "1",
    limit: 500,
  });

  return ledgerCsvResponse(
    `mcfly-orders-${preset}.csv`,
    [
      { key: "orderId", label: "Order" },
      { key: "dayKey", label: "Day" },
      { key: "orderedAt", label: "Ordered" },
      { key: "total", label: "Total" },
      { key: "discount", label: "Discount" },
      { key: "shipping", label: "Shipping" },
      { key: "tax", label: "Tax" },
      { key: "units", label: "Units" },
      { key: "buyer", label: "Buyer" },
      { key: "segment", label: "Segment" },
    ],
    ledger.rows,
  );
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
