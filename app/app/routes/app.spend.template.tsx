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
import { parseCustomChannelsParam } from "../lib/spend-custom-channel";
import {
  FREE_CHANNELS,
  resolveShopEntitlements,
} from "../lib/entitlements.server";
import type { SpendChannel } from "@mcfly/mer-engine";

/**
 * Reliable CSV download inside Shopify Admin (data: URLs often fail in the iframe).
 *   /app/spend/template                         → example (all named platforms)
 *   /app/spend/template?blank=1                 → blank (all named platforms)
 *   /app/spend/template?dates=…                 → blank rows for those days (tier columns)
 *   /app/spend/template?platforms=meta,google&blank=1   → selected blank
 *   /app/spend/template?platforms=meta,google&example=1 → selected with samples
 *   /app/spend/template?pipe=long|wide&blank=1|example=1 → SyncWith-class Sheet shape
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const entitlements = await resolveShopEntitlements(session.shop);
  const url = new URL(request.url);
  const datesParam = url.searchParams.get("dates");
  const platformsParam = url.searchParams.get("platforms");
  const blank = url.searchParams.get("blank") === "1";
  const pipe = url.searchParams.get("pipe");
  const example = url.searchParams.get("example") === "1";

  const freeDefaultChannels: readonly SpendChannel[] = [...FREE_CHANNELS];
  const tierChannels: readonly SpendChannel[] | undefined =
    entitlements.canUseAllChannels ? undefined : freeDefaultChannels;

  let body: string;
  let filename: string;

  if (pipe === "long") {
    body = buildPipeAutomationLongTemplate({
      dayCount: blank ? 14 : 7,
      example: example || !blank,
      channels: tierChannels,
    });
    filename = blank
      ? entitlements.canUseAllChannels
        ? "mcfly-pipe-spend-long-blank.csv"
        : "mcfly-pipe-spend-long-meta-google-blank.csv"
      : entitlements.canUseAllChannels
        ? "mcfly-pipe-spend-long-example.csv"
        : "mcfly-pipe-spend-long-meta-google-example.csv";
  } else if (pipe === "wide") {
    body = buildPipeAutomationWideTemplate({
      dayCount: 14,
      example: example || !blank,
      channels: tierChannels,
    });
    filename = blank
      ? entitlements.canUseAllChannels
        ? "mcfly-pipe-spend-wide-blank.csv"
        : "mcfly-pipe-spend-wide-meta-google-blank.csv"
      : entitlements.canUseAllChannels
        ? "mcfly-pipe-spend-wide-example.csv"
        : "mcfly-pipe-spend-wide-meta-google-example.csv";
  } else if (datesParam) {
    const dates = datesParam
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean)
      .slice(0, 62);
    body = buildBlankSpendTemplateForDates(dates, tierChannels);
    filename = entitlements.canUseAllChannels
      ? "mcfly-spend-missing-days.csv"
      : "mcfly-spend-meta-google-missing-days.csv";
  } else if (platformsParam !== null && platformsParam !== undefined) {
    let channels = parsePlatformsParam(platformsParam);
    if (!entitlements.canUseAllChannels) {
      channels = channels.filter((ch) =>
        entitlements.allowedChannels.includes(ch),
      );
    }
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
      },
    );
    body = built.csv;
    filename = selectedPlatformsTemplateFilename(
      channels,
      useExample ? "example" : "blank",
    );
  } else if (blank) {
    // Blank download: every named platform (all Free).
    if (entitlements.canUseAllChannels) {
      body = buildBlankSpendTemplate(14);
      filename = "mcfly-spend-template-blank.csv";
    } else {
      const built = buildSelectedPlatformTemplateCsv(
        platformsToTemplateCols([...FREE_CHANNELS]),
        { dayCount: 14, example: false },
      );
      body = built.csv;
      filename = "mcfly-spend-meta-google-blank.csv";
    }
  } else if (entitlements.canUseAllChannels) {
    body = WIDE_TEMPLATE_SAMPLE;
    filename = "mcfly-spend-template.csv";
  } else {
    const built = buildSelectedPlatformTemplateCsv(
      platformsToTemplateCols([...FREE_CHANNELS]),
      { dayCount: 14, example: true },
    );
    body = built.csv;
    filename = "mcfly-spend-meta-google-example.csv";
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
