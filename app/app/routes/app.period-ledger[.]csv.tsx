import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { ensureShop } from "../lib/mer-dashboard.server";
import { parsePeriodPreset } from "../lib/periods";
import {
  loadPeriodLedger,
  periodLedgerResponse,
} from "../lib/period-ledger.server";

/**
 * `GET /app/period-ledger.csv?period=<preset>` — the selected period as an
 * analysis-ready closed-day CSV.
 *
 * The filename escapes the dot (`[.]`) so flat routes serve a literal
 * `period-ledger.csv` path instead of `/app/period-ledger/csv`.
 *
 * `period` is the only client input. Shop, timezone, dates, and every sales
 * number are resolved server-side from the authenticated session — the browser
 * cannot supply a shop, a window, or a sales value. Read-only: no backfill, no
 * Shopify GraphQL, no writes.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const preset = parsePeriodPreset(new URL(request.url).searchParams.get("period"));

  const result = await loadPeriodLedger({
    shopId: shop.id,
    ianaTimezone: shop.ianaTimezone,
    preset,
  });
  return periodLedgerResponse(result);
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
