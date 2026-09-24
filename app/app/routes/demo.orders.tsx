/**
 * Old /demo/orders bookmarks land on the Orders tab (this month’s sales).
 * The address changes to /demo. The screen title stays Orders.
 */
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { deskBaseFromPathname, withDeskBase } from "../lib/desk-base-path";
import { publicDemoHeaders } from "../lib/public-demo-headers";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const home = withDeskBase("/app", deskBaseFromPathname(url.pathname));
  const qs = url.searchParams.toString();
  throw redirect(`${home}${qs ? `?${qs}` : ""}`);
};

export default function DemoOrdersRedirect() {
  return null;
}
