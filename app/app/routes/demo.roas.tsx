import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { publicDemoHeaders } from "../lib/public-demo-headers";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const next = new URLSearchParams(url.searchParams);
  next.set("panel", "roas");
  throw redirect(`/demo/spend?${next.toString()}`);
};

export default function PublicDemoRoasRedirect() {
  return null;
}
