
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { ensureShop } from "../lib/mer-dashboard.server";
import { runSalesFactsBackfill } from "../lib/sales-facts.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // Metadata sync (ianaTimezone/currencyCode) + a bounded closed-day backfill kick.
  // Best-effort: install/OAuth must never fail or hang because of ingest — a slow or
  // erroring Shopify call here is swallowed and the desk still works without facts yet.
  try {
    const shop = await ensureShop(session.shop);
    await runSalesFactsBackfill(admin, shop.id);
  } catch {
    // Ingest resumes on the next auth callback / whenever this is next wired to run.
  }

  return null;
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
