import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { AllocationQuerySchema } from "@mcfly/api-contract";
import {
  authenticateApiRequest,
  jsonError,
  rejectOversizedBody,
} from "../lib/api-auth.server";
import { buildAllocationResponse } from "../lib/mcfly-api.server";
import {
  apiQueryDateRange,
  fetchShopifySalesForShop,
  isSalesFactsIncompleteForApi,
} from "../lib/shopify-sales-api.server";
import {
  fetchSampleSales,
  getSampleDeskEnabled,
} from "../lib/sample-desk.server";
import { ensureShop } from "../lib/mer-dashboard.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const oversized = rejectOversizedBody(request);
  if (oversized) return oversized;

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
    const capped = parsed.error.issues.find(
      (i) => typeof i.message === "string" && i.message.includes("maximum of"),
    );
    const order = parsed.error.issues.find(
      (i) => typeof i.message === "string" && i.message.includes("`from` must"),
    );
    const issue = capped ?? order;
    return jsonError(
      issue?.message ?? parsed.error.message,
      400,
      capped ? "date_range_exceeded" : "invalid_query",
    );
  }

  const { from, to } = parsed.data;
  // Shop IANA bounds when known; else UTC calendar days — never host-local.
  const shop = await ensureShop(auth.shopDomain);
  const range = apiQueryDateRange(from, to, shop.ianaTimezone);

  let sales = 0;
  let salesWarning: string | undefined;
  const useSampleDesk = await getSampleDeskEnabled(auth.shopId);
  try {
    if (useSampleDesk) {
      const sample = await fetchSampleSales(auth.shopId, range);
      sales = sample.totalSales;
      salesWarning = "SAMPLE desk on — sales and spend are demo data";
    } else {
      const result = await fetchShopifySalesForShop(auth.shopDomain, {
        from,
        to,
      });
      if (!result.ok) {
        return jsonError(result.warning, 503, "sales_unavailable");
      }
      if (isSalesFactsIncompleteForApi(result.factsCoverage)) {
        const msg =
          result.warning ??
          "Sales facts incomplete — cannot compute allocation on partial closed days";
        return jsonError(msg, 503, "sales_facts_incomplete");
      }
      sales = result.totalSales;
      if (result.warning) salesWarning = result.warning;
    }
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Shopify sales unavailable",
      503,
      "sales_unavailable",
    );
  }

  const body = await buildAllocationResponse(auth.shopId, { from, to }, sales);
  const headers: Record<string, string> = {};
  if (salesWarning) {
    headers["X-Mcfly-Warning"] = salesWarning;
  }
  return Response.json(body, { status: 200, headers });
};

export const action = async (_args: ActionFunctionArgs) => {
  return jsonError("Method not allowed", 405);
};
