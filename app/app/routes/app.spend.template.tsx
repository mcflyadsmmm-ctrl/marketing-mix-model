import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  buildBlankSpendTemplate,
  buildBlankSpendTemplateForDates,
  buildPipeAutomationLongTemplate,
  buildPipeAutomationWideTemplate,
  buildSelectedPlatformTemplateCsv,
  customNamesToTemplateCols,
  parsePlatformsParam,
  platformsToTemplateCols,
  selectedPlatformsTemplateFilename,
  WIDE_TEMPLATE_SAMPLE,
} from "../lib/spend-csv";
import {
  parseSpendTemplateDatesParam,
  resolveSpendTemplateRangeQuery,
} from "../lib/spend-template-range";
import { parseCustomChannelsParam } from "../lib/spend-custom-channel";
import { salesDayFactWindowStartUtc } from "../lib/sales-facts.server";
import { SPEND_CHANNELS, type SpendChannel } from "@mcfly/mer-engine";

/**
 * Reliable CSV download inside Shopify Admin (data: URLs often fail in the iframe).
 *   /app/spend/template                         → example (all named platforms)
 *   /app/spend/template?blank=1                 → blank (all named platforms, 14 trailing days)
 *   /app/spend/template?blank=1&span=30d|90d|ytd|12m
 *       → blank closed days through yesterday (clamped to sales window start)
 *   /app/spend/template?blank=1&from=YYYY-MM-DD&to=YYYY-MM-DD
 *   /app/spend/template?dates=…                 → blank rows for those days (cap 366)
 *   /app/spend/template?platforms=meta,google&blank=1   → selected blank
 *   /app/spend/template?platforms=meta,google&example=1 → selected with samples
 *   /app/spend/template?pipe=long|wide&blank=1|example=1 → SyncWith-class Sheet shape
 *
 * Prefer `from`/`to` or `span` over stuffing a year into `dates=`.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const url = new URL(request.url);
  const datesParam = url.searchParams.get("dates");
  const platformsParam = url.searchParams.get("platforms");
  const blank = url.searchParams.get("blank") === "1";
  const pipe = url.searchParams.get("pipe");
  const example = url.searchParams.get("example") === "1";
  const floorKey = salesDayFactWindowStartUtc().toISOString().slice(0, 10);
  const range = resolveSpendTemplateRangeQuery(url.searchParams, { floorKey });
  const rangeOpts = range
    ? { from: range.fromKey, to: range.toKey, floorKey }
    : {};

  let body: string;
  let filename: string;

  if (pipe === "long") {
    body = buildPipeAutomationLongTemplate({
      dayCount: blank ? 14 : 7,
      example: example || !blank,
      ...rangeOpts,
    });
    filename = blank
      ? "mcfly-pipe-spend-long-blank.csv"
      : "mcfly-pipe-spend-long-example.csv";
  } else if (pipe === "wide") {
    body = buildPipeAutomationWideTemplate({
      dayCount: 14,
      example: example || !blank,
      ...rangeOpts,
    });
    filename = blank
      ? "mcfly-pipe-spend-wide-blank.csv"
      : "mcfly-pipe-spend-wide-example.csv";
  } else if (datesParam) {
    const dates = parseSpendTemplateDatesParam(datesParam);
    body = buildBlankSpendTemplateForDates(dates);
    filename = "mcfly-spend-missing-days.csv";
  } else if (platformsParam !== null && platformsParam !== undefined) {
    let channels = parsePlatformsParam(platformsParam);
    // Named extras (billboards, radio, typed) are `custom=`, not the generic Other column.
    channels = channels.filter((ch) => ch !== "other");
    const customCols = customNamesToTemplateCols(
      parseCustomChannelsParam(url.searchParams.get("custom")),
    );
    if (channels.length === 0 && customCols.length === 0) {
      const fallback: SpendChannel[] = ["meta", "google"];
      channels = fallback;
    }
    const useExample = example && !blank;
    const built = buildSelectedPlatformTemplateCsv(
      [...platformsToTemplateCols(channels), ...customCols],
      {
        dayCount: 14,
        example: useExample,
        ...rangeOpts,
      },
    );
    body = built.csv;
    filename = selectedPlatformsTemplateFilename(
      channels,
      useExample ? "example" : "blank",
    );
  } else if (blank || (range && !example)) {
    // `span` / `from`/`to` without example=1 means history backfill (empty amounts).
    body = range
      ? buildBlankSpendTemplateForDates(range.dates)
      : buildBlankSpendTemplate(14);
    filename = "mcfly-spend-template-blank.csv";
  } else if (range && example) {
    const built = buildSelectedPlatformTemplateCsv(
      platformsToTemplateCols([...SPEND_CHANNELS]),
      { example: true, ...rangeOpts },
    );
    body = built.csv;
    filename = "mcfly-spend-template.csv";
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
