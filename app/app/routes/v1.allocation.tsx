import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { AllocationQuerySchema } from "@mcfly/api-contract";
import { authenticateApiRequest, jsonError } from "../lib/api-auth.server";
import { buildAllocationResponse } from "../lib/mcfly-api.server";
import { fetchShopifySalesForShop } from "../lib/shopify-sales-api.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) {
    return jsonError(auth.message, auth.status);
  }

  const url = new URL(request.url);
  const parsed = AllocationQuerySchema.safeParse({
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });

  if (!parsed.success) {
    return jsonError(parsed.error.message, 400, "invalid_query");
  }

  const { from, to } = parsed.data;
  const range = {
    start: new Date(`${from}T00:00:00`),
    end: new Date(`${to}T23:59:59.999`),
    label: `${from} → ${to}`,
  };

  let sales = 0;
  try {
    const result = await fetchShopifySalesForShop(auth.shopDomain, range);
    sales = result.totalSales;
  } catch {
    sales = 0;
  }

  const body = await buildAllocationResponse(auth.shopId, { from, to }, sales);
  return Response.json(body, { status: 200 });
};

export const action = async (_args: ActionFunctionArgs) => {
  return jsonError("Method not allowed", 405);
};
