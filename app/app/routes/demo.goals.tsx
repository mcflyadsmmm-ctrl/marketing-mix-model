/**
 * T1 SAMPLE L2 — Goals tab retired. Redirect to Settings.
 */
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { deskBaseFromPathname, withDeskBase } from "../lib/desk-base-path";
import { publicDemoHeaders } from "../lib/public-demo-headers";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const settings = withDeskBase(
    "/app/settings",
    deskBaseFromPathname(url.pathname),
  );
  const qs = url.searchParams.toString();
  throw redirect(`${settings}${qs ? `?${qs}` : ""}`);
};

export default function DemoGoalsRedirect() {
  return null;
}
