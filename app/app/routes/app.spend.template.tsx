import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  buildBlankSpendTemplate,
  WIDE_TEMPLATE_SAMPLE,
} from "../lib/spend-csv";

/**
 * Reliable CSV download inside Shopify Admin (data: URLs often fail in the iframe).
 *   /app/spend/template        → example-filled template
 *   /app/spend/template?blank=1 → empty days ready to fill
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const url = new URL(request.url);
  const blank = url.searchParams.get("blank") === "1";
  const body = blank ? buildBlankSpendTemplate(14) : WIDE_TEMPLATE_SAMPLE;
  const filename = blank
    ? "mcfly-spend-template-blank.csv"
    : "mcfly-spend-template.csv";

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
