import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

/** Legacy `/app/ltv` → Customers depth tab. */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const q = url.searchParams.toString();
  throw redirect(q ? `/app/customers?${q}` : "/app/customers");
};

export default function LtvRedirectPage() {
  return null;
}
