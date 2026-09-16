
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { ensureShop } from "../lib/mer-dashboard.server";
import { scheduleFirstSessionShopifyWindow } from "../lib/first-session-shopify-window.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // Enqueue + fire-and-forget the public-app window. Never await the crawl —
  // OAuth must not hang on Shopify history.
  try {
    const shop = await ensureShop(session.shop);
    await scheduleFirstSessionShopifyWindow(admin, shop.id);
  } catch {
    // Ingest resumes on the next auth callback / desk kick / job tick.
  }

  return null;
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
