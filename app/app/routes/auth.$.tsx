
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { ensureShop } from "../lib/mer-dashboard.server";
import { runSalesFactsBackfill } from "../lib/sales-facts.server";
import { runOrderFactsBackfill } from "../lib/order-facts.server";
import { parseShopifyScopes } from "../lib/shopify-scopes";
import { applyReadAllOrdersGrant } from "../lib/scopes-update.server";
import { enqueueSalesFactsBackfill } from "../lib/sales-backfill-kick.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // Metadata sync (ianaTimezone/currencyCode) + bounded closed-day backfill kicks.
  // Best-effort: install/OAuth must never fail or hang because of ingest — a slow or
  // erroring Shopify call here is swallowed and the desk still works without facts yet.
  try {
    const shop = await ensureShop(session.shop);
    // Same grant path as app/scopes_update — enqueue coalesced deep backfill
    // if this OAuth/reauth just added read_all_orders (webhook can lag).
    await applyReadAllOrdersGrant({
      shopDomain: session.shop,
      current: parseShopifyScopes(session.scope),
    });
    await runSalesFactsBackfill(admin, shop.id, {
      grantedScopes: session.scope,
      newestFirst: true,
    });
    await enqueueSalesFactsBackfill({
      shopId: shop.id,
      grantedScopes: session.scope,
      reason: "auth",
    });
    // Till LTV OrderFact ingest — after sales facts; never blocks OAuth.
    await runOrderFactsBackfill(admin, shop.id, {
      grantedScopes: session.scope,
    }).catch(() => {
      // resumes on next auth / desk kick
    });
  } catch {
    // Ingest resumes on the next auth callback / whenever this is next wired to run.
  }

  return null;
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
