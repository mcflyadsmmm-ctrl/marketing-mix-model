import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

/**
 * RETIRED: Meta/Google spend OAuth UI (`docs/RETIRED_SURFACES.md`).
 * CSV on Spend is the spend SoT. Keep this route so old bookmarks land on Spend.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  throw redirect("/app/spend");
};

export default function ConnectionsRedirect() {
  return null;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
