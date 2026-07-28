// Practical export walkthroughs for daily ad-spend CSVs.
// Religion: CSV spend aggregates only — no Meta/Google OAuth, no connector zoo, no pixels/MTA.

import type { SpendChannel } from "@mcfly/mer-engine";

/** Selectable “I advertise on…” platform (UI), mapped into a SpendChannel bucket. */
export type SpendAdvertisePlatformId =
  | "meta"
  | "google"
  | "microsoft"
  | "tiktok"
  | "pinterest"
  | "snapchat"
  | "reddit"
  | "x"
  | "linkedin"
  | "amazon"
  | "apple_search"
  | "affiliate"
  | "email"
  | "other";

export type AdvertisePlatformGroup =
  | "paid"
  | "affiliate"
  | "email"
  | "other";

export interface SpendAdvertisePlatform {
  id: SpendAdvertisePlatformId;
  /** Checkbox / summary label. */
  title: string;
  group: AdvertisePlatformGroup;
  /** Engine / Prisma channel this upload lands in. */
  engineChannel: SpendChannel;
  /** One line: why this bucket belongs on the cash desk. */
  productHint: string;
  /** Click-path to export daily cost (durable labels; UIs change). */
  steps: string[];
  /** Columns Mcfly needs from that export. */
  columnsNeeded: string[];
  tips: string[];
  /** Cadence note for monthly bills → daily rows. */
  cadenceNote?: string;
}

/** @deprecated Prefer SpendAdvertisePlatform — kept for callers that expect SPEND_EXPORT_GUIDES. */
export type SpendExportGuide = SpendAdvertisePlatform & {
  /** Alias of engineChannel for older call sites. */
  channel: SpendChannel;
};

export const ADVERTISE_PLATFORM_GROUPS: ReadonlyArray<{
  id: AdvertisePlatformGroup;
  label: string;
}> = [
  { id: "paid", label: "Paid social / search / retail media" },
  { id: "affiliate", label: "Affiliate / partners" },
  { id: "email", label: "Email / SMS cash cost" },
  { id: "other", label: "Catch-all" },
];

/**
 * Full advertise-on catalog. Selection filters guides + upload slots.
 * Engine mapping: each advertise platform maps 1:1 into a SpendChannel
 * (influencers/agencies/print stay in Other).
 */
export const SPEND_ADVERTISE_PLATFORMS: readonly SpendAdvertisePlatform[] = [
  {
    id: "meta",
    title: "Meta (Facebook + Instagram)",
    group: "paid",
    engineChannel: "meta",
    productHint: "Usually the largest paid bucket — Amount spent by day for Total ROAS.",
    steps: [
      "Open Ads Manager → select the ad account(s) you want.",
      "Set the date range to match the Total ROAS period you care about (shop timezone when you can).",
      "Add a Day (or date) breakdown — not lifetime, not campaign-only without Day.",
      "Include Amount spent (or Amount spent in your account currency).",
      "Reports / Export → CSV (or Export table data). Keep one row per day.",
    ],
    columnsNeeded: [
      "Day or Reporting starts (Mcfly uses the start date)",
      "Amount spent / Amount spent (USD) / Spend",
    ],
    tips: [
      "Use account currency; match shop currency when possible.",
      "Skip or delete the Total / Summary row at the bottom.",
      "No customer PII — spend aggregates only.",
      "Campaign-only exports without Day will not map to the cash desk.",
    ],
  },
  {
    id: "google",
    title: "Google Ads",
    group: "paid",
    engineChannel: "google",
    productHint: "Search, Shopping, YouTube, and Performance Max cost by day.",
    steps: [
      "Open Google Ads → Reports (or Campaigns with a download).",
      "Pick a date range matching Total ROAS and set the row dimension to Day (or Date).",
      "Add Cost (or Cost in account currency) as a metric.",
      "Download → CSV. Prefer account-level daily cost, not a single campaign without Day.",
    ],
    columnsNeeded: ["Day / Date", "Cost / Cost (Account currency) / Spend"],
    tips: [
      "Timezone: match Ads account settings to your shop when you can.",
      "Remove totals rows before upload if the file includes them.",
      "Spend only — do not paste conversions or revenue into Mcfly.",
      "No customer PII.",
    ],
  },
  {
    id: "microsoft",
    title: "Microsoft Advertising (Bing)",
    group: "paid",
    engineChannel: "microsoft",
    productHint: "Microsoft Advertising / Bing daily spend for the Total ROAS desk.",
    steps: [
      "Open Microsoft Advertising → Reports (or Campaigns).",
      "Build or open a report with Day (or Date) and Spend / Cost.",
      "Set the date range to your Total ROAS period, then Download / Export → CSV.",
    ],
    columnsNeeded: ["Day / Date", "Spend / Cost"],
    tips: [
      "One row per calendar day.",
      "Skip summary/total lines.",
      "Match account currency to your shop when you can.",
      "No customer PII.",
    ],
  },
  {
    id: "tiktok",
    title: "TikTok Ads",
    group: "paid",
    engineChannel: "tiktok",
    productHint: "TikTok Ads Manager daily cost for the TikTok channel bucket.",
    steps: [
      "Open TikTok Ads Manager → Reports / Export (or campaign table download).",
      "Choose a date range matching Total ROAS and break down by Day.",
      "Include Cost / Spend, then export CSV.",
    ],
    columnsNeeded: ["Day / Date", "Cost / Spend"],
    tips: [
      "Daily breakdown required — lifetime totals cannot be split later automatically.",
      "Drop total rows; keep spend aggregates only.",
      "No customer PII.",
    ],
  },
  {
    id: "pinterest",
    title: "Pinterest Ads",
    group: "paid",
    engineChannel: "pinterest",
    productHint: "Pinterest Ads Manager spend by day — named channel on the desk.",
    steps: [
      "Open Pinterest Ads → Ads reporting / Analytics (or Ads Manager table).",
      "Set the date range to match Total ROAS.",
      "Break down by Day (date) and include Spend / Ad spend.",
      "Export / Download → CSV with one row per day.",
    ],
    columnsNeeded: ["Day / Date", "Spend / Ad spend / Cost"],
    tips: [
      "Skip totals and empty date rows.",
      "Use account currency; align to shop currency when possible.",
      "No customer PII — aggregates only.",
    ],
  },
  {
    id: "snapchat",
    title: "Snapchat Ads",
    group: "paid",
    engineChannel: "snapchat",
    productHint: "Snapchat Ads Manager daily spend for the Snapchat channel.",
    steps: [
      "Open Snapchat Ads Manager → Reports / export from the campaigns table.",
      "Set date range to your Total ROAS period.",
      "Group or break down by Day and include Amount spent / Spend.",
      "Export CSV — one row per day.",
    ],
    columnsNeeded: ["Day / Date", "Amount spent / Spend / Cost"],
    tips: [
      "Remove summary/total rows before upload.",
      "Match currency to shop when you can.",
      "No customer PII.",
    ],
  },
  {
    id: "reddit",
    title: "Reddit Ads",
    group: "paid",
    engineChannel: "reddit",
    productHint: "Reddit Ads daily spend — named channel, not dumped into Other.",
    steps: [
      "Open Reddit Ads → Reporting / Campaigns.",
      "Pick the date range that matches Total ROAS.",
      "Add a Day breakdown and Spend / Cost metric.",
      "Export / Download → CSV.",
    ],
    columnsNeeded: ["Day / Date", "Spend / Cost"],
    tips: [
      "Lifetime or campaign-only without Day will not land on the desk.",
      "Skip totals rows; spend aggregates only — no PII.",
    ],
  },
  {
    id: "x",
    title: "X / Twitter Ads",
    group: "paid",
    engineChannel: "x",
    productHint: "X Ads spend by day — named channel on the Total ROAS desk.",
    steps: [
      "Open X Ads (ads.x.com) → Analytics / reporting.",
      "Set the date range to match Total ROAS.",
      "Break down by Day and include Spend / Cost.",
      "Export CSV, then upload with this platform selected.",
    ],
    columnsNeeded: ["Day / Date", "Spend / Cost"],
    tips: [
      "Skip totals rows.",
      "Account currency should match shop when possible.",
      "No customer PII.",
    ],
  },
  {
    id: "linkedin",
    title: "LinkedIn Ads",
    group: "paid",
    engineChannel: "linkedin",
    productHint: "LinkedIn Campaign Manager daily spend — named desk channel.",
    steps: [
      "Open LinkedIn Campaign Manager → Analyze / Export.",
      "Choose a date range matching Total ROAS.",
      "Group by Day (or Date) and include Amount spent / Spend.",
      "Download CSV → upload here.",
    ],
    columnsNeeded: ["Day / Date", "Amount spent / Spend / Cost"],
    tips: [
      "Remove total/summary rows.",
      "B2B brands: still cash out — include it for full Total ROAS.",
      "No customer PII.",
    ],
  },
  {
    id: "amazon",
    title: "Amazon Ads",
    group: "paid",
    engineChannel: "amazon",
    productHint: "Sponsored Products / Brands / Display — named channel for retail media cash.",
    steps: [
      "Open Amazon Advertising console → Reports (or campaign manager download).",
      "Create or download a report with Date/Day and Spend / Cost.",
      "Match the date range to Total ROAS; prefer daily granularity.",
      "Export CSV → upload here.",
    ],
    columnsNeeded: ["Day / Date", "Spend / Cost / Ad spend"],
    tips: [
      "Amazon retail media can sit outside Shopify orders — still include cash ads if you want full Total ROAS.",
      "Skip totals; no ASINs/customer PII needed — spend only.",
      "Match currency when you can.",
    ],
  },
  {
    id: "apple_search",
    title: "Apple Search Ads",
    group: "paid",
    engineChannel: "apple_search",
    productHint: "Apple Search Ads daily spend — named desk channel.",
    steps: [
      "Open Apple Search Ads → Reports / Campaigns.",
      "Set date range to Total ROAS and break results by Day.",
      "Include Spend / Local spend, then export CSV.",
      "Upload here.",
    ],
    columnsNeeded: ["Day / Date", "Spend / Local spend / Cost"],
    tips: [
      "Skip summary rows.",
      "Currency: prefer shop currency or convert before upload.",
      "No customer PII.",
    ],
  },
  {
    id: "affiliate",
    title: "Affiliate (Impact + other networks)",
    group: "affiliate",
    engineChannel: "affiliate",
    productHint: "Commissions + network fees are real cash out — include next to paid ads.",
    steps: [
      "Impact (preferred): Reports → export commissions/fees with Action date or Day + Amount.",
      "CJ / ShareASale / PartnerStack / etc.: export commissions / fees for the period — daily if available.",
      "If the export is by order date, sum amounts to one total per calendar day.",
      "Save as CSV with a date column and an amount column, then upload as Affiliate.",
    ],
    columnsNeeded: ["Day / Date", "Amount / Commission / Cost / Spend"],
    tips: [
      "Impact-first: use Action date (or locking date you trust for cash) consistently.",
      "Other networks: same idea — day + cash paid (commissions + fees).",
      "Include network fees you actually paid, not just publisher payouts if both hit cash.",
      "No partner PII in the file — aggregates only.",
    ],
    cadenceNote:
      "Monthly network bills: use Bill → daily on this page (amount + cadence → Preview / Apply), or spread manually. Mcfly needs a daily amount for Total ROAS.",
  },
  {
    id: "email",
    title: "Email / SMS (Klaviyo + Mailchimp / ESP)",
    group: "email",
    engineChannel: "email",
    productHint: "ESP plan cost and send fees are cash out — allocate to days for Total ROAS.",
    steps: [
      "Klaviyo: Billing / invoices → note plan + usage cash for the period (not attributed revenue).",
      "Mailchimp / other ESP: same — invoice or billing export for cash paid.",
      "Spread that cost across the days it covered (equal daily split is fine to start).",
      "Build a small CSV: Day + amount, then upload as Email.",
    ],
    columnsNeeded: ["Day / Date", "Amount / Cost / Spend"],
    tips: [
      "Use cash you paid the ESP — not opens, clicks, or “attributed” revenue.",
      "SMS tools (Attentive, Postscript) belong here when they are cash marketing cost.",
      "No subscriber PII in the CSV.",
    ],
    cadenceNote:
      "Monthly ESP bills: use Bill → daily above (or divide by days in the period). One monthly total on a single day skews that day’s Total ROAS.",
  },
  {
    id: "other",
    title: "Other (influencers, podcasts, agencies, print…)",
    group: "other",
    engineChannel: "other",
    productHint: "Anything else you paid to advertise — influencers, podcasts, agencies, print, Criteo, etc.",
    steps: [
      "Export or copy daily cost from the vendor, or allocate an invoice across days.",
      "CSV with Day + amount, then upload as Other (or put it in the Mcfly template Other column).",
    ],
    columnsNeeded: ["Day / Date", "Amount / Cost / Spend"],
    tips: [
      "Keep agency retainers, influencer fees, and sponsorships honest — if cash left the bank for marketing, it belongs here.",
      "No customer lists or PII.",
      "Skip totals rows.",
    ],
    cadenceNote:
      "Invoice-only vendors: use Bill → daily on this page, or spread the bill across the days it covered.",
  },
] as const;

/** Guides array (same objects) for accordion rendering. */
export const SPEND_EXPORT_GUIDES: readonly SpendExportGuide[] =
  SPEND_ADVERTISE_PLATFORMS.map((p) => ({
    ...p,
    channel: p.engineChannel,
  }));

const PLATFORM_BY_ID = new Map(
  SPEND_ADVERTISE_PLATFORMS.map((p) => [p.id, p] as const),
);

export function getAdvertisePlatform(
  id: string,
): SpendAdvertisePlatform | undefined {
  return PLATFORM_BY_ID.get(id as SpendAdvertisePlatformId);
}

export function isAdvertisePlatformId(id: string): id is SpendAdvertisePlatformId {
  return PLATFORM_BY_ID.has(id as SpendAdvertisePlatformId);
}

export function filterAdvertisePlatforms(
  ids: readonly string[],
): SpendAdvertisePlatform[] {
  return ids
    .map((id) => getAdvertisePlatform(id))
    .filter((p): p is SpendAdvertisePlatform => Boolean(p));
}
