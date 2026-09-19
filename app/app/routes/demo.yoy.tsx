import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

import { OVERVIEW_YOY_YEAR_PANEL } from "../lib/overview-first-viewport";
import { publicDemoHeaders } from "../lib/public-demo-headers";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const next = new URLSearchParams(url.searchParams);
  next.set("panel", OVERVIEW_YOY_YEAR_PANEL);
  throw redirect(`/demo?${next.toString()}`);
};

export default function PublicDemoYoyRedirect() {
  return null;
}
