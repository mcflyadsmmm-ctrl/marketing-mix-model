import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

import { customersPanelRedirectPath } from "../lib/customers-first-viewport";
import { publicDemoHeaders } from "../lib/public-demo-headers";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  throw redirect(customersPanelRedirectPath(request, "/demo/customers", "growth"));
};

export default function PublicDemoGrowthRedirect() {
  return null;
}
