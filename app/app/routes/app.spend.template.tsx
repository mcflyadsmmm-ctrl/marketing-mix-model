import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  buildBlankSpendTemplate,
  buildBlankSpendTemplateForDates,
  WIDE_TEMPLATE_SAMPLE,
} from "../lib/spend-csv";

/**
 * Reliable CSV download inside Shopify Admin (data: URLs often fail in the iframe).
 *   /app/spend/template           → example-filled template
 *   /app/spend/template?blank=1   → empty days ready to fill
 *   /app/spend/template?dates=YYYY-MM-DD,YYYY-MM-DD → blank rows for those days only
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const url = new URL(request.url);
  const datesParam = url.searchParams.get("dates");
  const blank = url.searchParams.get("blank") === "1";

  let body: string;
  let filename: string;
  if (datesParam) {
    const dates = datesParam
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean)
      .slice(0, 62);
    body = buildBlankSpendTemplateForDates(dates);
    filename = "mcfly-spend-missing-days.csv";
  } else if (blank) {
    body = buildBlankSpendTemplate(14);
    filename = "mcfly-spend-template-blank.csv";
  } else {
    body = WIDE_TEMPLATE_SAMPLE;
    filename = "mcfly-spend-template.csv";
  }

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
