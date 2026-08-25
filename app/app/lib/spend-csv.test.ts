import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SPEND_CHANNELS } from "@mcfly/mer-engine";
import {
  WIDE_TEMPLATE_COLUMNS,
  WIDE_TEMPLATE_HEADERS,
  WIDE_TEMPLATE_SAMPLE,
  PIPE_CHANNEL_LABELS,
  SHEETS_CREATE_URL,
  SPEND_CSV_MAX_BYTES,
  SPEND_CSV_MAX_ROWS,
  aggregateSpendRows,
  assertSpendCsvLimits,
  buildBlankSpendTemplate,
  buildPipeAutomationLongTemplate,
  buildPipeAutomationWideTemplate,
  buildSelectedPlatformTemplateCsv,
  buildSheetsImportGuide,
  combineSpendCsvInputs,
  countSpendCsvDataRows,
  customNamesToTemplateCols,
  detectWideChannelColumns,
  headerLooksLikeAdsSpend,
  normalizeChannel,
  parsePlatformsParam,
  parseSpendAmount,
  parseSpendCsv,
  platformsToTemplateCols,
  selectedPlatformsTemplateFilename,
} from "./spend-csv";

const CHANNEL_COUNT = SPEND_CHANNELS.length;
const EMPTY_SPEND_COMMAS = ",".repeat(CHANNEL_COUNT);

describe("parseSpendAmount", () => {
  it("parses scientific notation without stripping e into digits", () => {
    expect(parseSpendAmount("1.23E+05")).toBe(123000);
    expect(parseSpendAmount("1e6")).toBe(1000000);
    expect(parseSpendAmount("2.5e3")).toBe(2500);
    expect(parseSpendAmount("1.23E+05")).not.toBe(1.2305);
  });

  it("still parses currency, commas, and parentheses-negatives", () => {
    expect(parseSpendAmount("$1,234.56")).toBe(1234.56);
    expect(parseSpendAmount("(100.00)")).toBe(-100);
    expect(parseSpendAmount("412.55")).toBe(412.55);
  });

  it('fail-closes EU decimal "12,50" (comma as decimal)', () => {
    expect(parseSpendAmount("12,50")).toBeNull();
  });

  it('parses US thousands "1,234.56"', () => {
    expect(parseSpendAmount("1,234.56")).toBe(1234.56);
  });

  it("fail-closes EU thousands+decimal 1.234,56", () => {
    expect(parseSpendAmount("1.234,56")).toBeNull();
  });
});

describe("amount column: reject metric headers / prefer spend", () => {
  it("uses Cost not Cost / conv. when both present", () => {
    const csv = `Day,Cost / conv.,Impressions,Cost
2026-07-01,0.42,10000,250.00`;
    const { rows, errors } = parseSpendCsv(csv, { forceChannel: "meta" });
    expect(errors).toEqual([]);
    expect(rows).toEqual([
      {
        date: "2026-07-01",
        channel: "meta",
        rawChannel: "Meta Ads",
        amount: 250,
      },
    ]);
  });

  it("uses Amount spent not Total impressions", () => {
    const csv = `Day,Total impressions,Amount spent
2026-07-01,50000,180.25`;
    const { rows, errors } = parseSpendCsv(csv, { forceChannel: "google" });
    expect(errors).toEqual([]);
    expect(rows).toEqual([
      {
        date: "2026-07-01",
        channel: "google",
        rawChannel: "Google Ads",
        amount: 180.25,
      },
    ]);
  });

  it("prefers Amount spent over bare Cost when both match", () => {
    const csv = `Day,Cost,Amount spent
2026-07-01,999,150.00`;
    const { rows, errors } = parseSpendCsv(csv, { forceChannel: "meta" });
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(150);
  });
});

describe("channel header detection / Leads trap", () => {
  it("never treats Leads as ads via includes(ads) substring", () => {
    expect(headerLooksLikeAdsSpend("leads")).toBe(false);
    expect(headerLooksLikeAdsSpend("meta ads")).toBe(true);
    expect(headerLooksLikeAdsSpend("ads")).toBe(true);
    expect(headerLooksLikeAdsSpend("google ads")).toBe(true);
  });

  it("ignores Leads column when parsing a wide CSV", () => {
    const csv = `Day,Meta Ads,Leads,Google Ads
2026-07-01,100,9999,200`;
    const { rows, errors } = parseSpendCsv(csv);
    expect(errors).toEqual([]);
    expect(detectWideChannelColumns(["Day", "Meta Ads", "Leads", "Google Ads"]).map((c) => c.rawHeader)).toEqual([
      "Meta Ads",
      "Google Ads",
    ]);
    expect(rows).toHaveLength(2);
    expect(rows.some((r) => r.amount === 9999)).toBe(false);
    expect(aggregateSpendRows(rows)).toEqual([
      { date: "2026-07-01", channel: "google", amount: 200 },
      { date: "2026-07-01", channel: "meta", amount: 100 },
    ]);
  });

  it("blocks other delivery metric headers from spend mapping", () => {
    const cols = detectWideChannelColumns([
      "Day",
      "Meta Ads",
      "Impressions",
      "Clicks",
      "CTR",
      "CPC",
      "CPM",
      "Reach",
      "Frequency",
      "Conversions",
      "Purchases",
      "ROAS",
      "Revenue",
    ]);
    expect(cols.map((c) => c.rawHeader)).toEqual(["Meta Ads"]);
  });

  it("promotes Billboards and Radio as separate Other extras (no Cost column)", () => {
    const csv = `Day,Meta Ads,Billboards,Radio
2026-07-01,100,80,40`;
    expect(
      detectWideChannelColumns(["Day", "Meta Ads", "Billboards", "Radio"]).map(
        (c) => ({ header: c.rawHeader, channel: c.channel, customKey: c.customKey }),
      ),
    ).toEqual([
      { header: "Meta Ads", channel: "meta", customKey: undefined },
      { header: "Billboards", channel: "other", customKey: "billboards" },
      { header: "Radio", channel: "other", customKey: "radio" },
    ]);
    const { rows, errors } = parseSpendCsv(csv);
    expect(errors).toEqual([]);
    expect(aggregateSpendRows(rows)).toEqual([
      { date: "2026-07-01", channel: "meta", amount: 100 },
      {
        date: "2026-07-01",
        channel: "other",
        amount: 80,
        customKey: "billboards",
        customLabel: "Billboards",
      },
      {
        date: "2026-07-01",
        channel: "other",
        amount: 40,
        customKey: "radio",
        customLabel: "Radio",
      },
    ]);
  });
});

describe("wide spend template", () => {
  it("declares every named channel column including Other", () => {
    expect(WIDE_TEMPLATE_HEADERS).toEqual([
      "Day",
      "Meta Ads",
      "Google Ads",
      "Microsoft Ads",
      "TikTok Ads",
      "Pinterest Ads",
      "Snapchat Ads",
      "Reddit Ads",
      "X Ads",
      "LinkedIn Ads",
      "Amazon Ads",
      "Apple Search Ads",
      "Affiliate Ads",
      "Email Cost",
      "Other",
    ]);
    const channels = WIDE_TEMPLATE_COLUMNS.filter((c) => c.channel !== "day").map(
      (c) => c.channel,
    );
    expect(channels).toContain("other");
    expect(channels).toContain("x");
    expect(channels).toContain("linkedin");
    expect(channels).toContain("amazon");
    expect(channels).toContain("apple_search");
    expect(new Set(channels).size).toBe(CHANNEL_COUNT);
    expect(CHANNEL_COUNT).toBe(14);
  });

  it("parses the downloadable sample CSV into per-channel rows", () => {
    const { rows, errors, totalDataRows } = parseSpendCsv(WIDE_TEMPLATE_SAMPLE);
    expect(errors).toEqual([]);
    expect(totalDataRows).toBe(3);
    expect(rows.some((r) => r.channel === "meta" && r.date === "2026-07-01")).toBe(
      true,
    );
    expect(rows.some((r) => r.channel === "google" && r.amount === 301.75)).toBe(
      true,
    );
    expect(rows.some((r) => r.channel === "x" && r.date === "2026-07-01")).toBe(
      true,
    );
    expect(
      rows.some(
        (r) => r.channel === "other" && r.date === "2026-07-02" && r.amount === 15,
      ),
    ).toBe(true);
  });

  it("maps the Other wide column through normalizeChannel", () => {
    expect(normalizeChannel("Other")).toBe("other");
    expect(normalizeChannel("X Ads")).toBe("x");
    expect(normalizeChannel("LinkedIn Ads")).toBe("linkedin");
    expect(normalizeChannel("Amazon Ads")).toBe("amazon");
    expect(normalizeChannel("Apple Search Ads")).toBe("apple_search");
    const csv = `Day,Meta Ads,Google Ads,Microsoft Ads,TikTok Ads,Affiliate Ads,Email Cost,Other
2026-07-10,0,0,0,0,0,0,42.50`;
    const { rows, errors } = parseSpendCsv(csv);
    expect(errors).toEqual([]);
    expect(rows).toEqual([
      {
        date: "2026-07-10",
        channel: "other",
        rawChannel: "Other",
        amount: 42.5,
      },
    ]);
  });

  it("ignores zero and blank cells in wide rows", () => {
    const { rows } = parseSpendCsv(WIDE_TEMPLATE_SAMPLE);
    const july1Other = rows.filter(
      (r) => r.date === "2026-07-01" && r.channel === "other",
    );
    expect(july1Other).toEqual([]);
  });
});

describe("buildBlankSpendTemplate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-24T15:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("emits header plus dayCount rows with empty spend cells", () => {
    const text = buildBlankSpendTemplate(3);
    const lines = text.trim().split("\n");
    expect(lines[0]).toBe(WIDE_TEMPLATE_HEADERS.join(","));
    expect(lines).toHaveLength(4);
    expect(lines[1]).toBe(`2026-07-22${EMPTY_SPEND_COMMAS}`);
    expect(lines[3]).toBe(`2026-07-24${EMPTY_SPEND_COMMAS}`);
  });

  it("defaults to fourteen trailing days", () => {
    const lines = buildBlankSpendTemplate().trim().split("\n");
    expect(lines).toHaveLength(15);
  });

  it("narrows to Free Meta + Google columns when channels passed", () => {
    const text = buildBlankSpendTemplate(2, ["meta", "google"]);
    const lines = text.trim().split("\n");
    expect(lines[0]).toBe("Day,Meta Ads,Google Ads");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe("2026-07-23,,");
    expect(lines[2]).toBe("2026-07-24,,");
  });

  it("round-trips through parseSpendCsv with no spend rows", () => {
    const { rows, errors, totalDataRows } = parseSpendCsv(buildBlankSpendTemplate(2));
    expect(errors).toEqual([]);
    expect(totalDataRows).toBe(2);
    expect(rows).toEqual([]);
  });
});

describe("pipe automation templates", () => {
  const now = new Date(2026, 6, 27); // local Jul 27, 2026

  it("long example round-trips Meta + Google rows", () => {
    const text = buildPipeAutomationLongTemplate({
      dayCount: 2,
      example: true,
      now,
    });
    expect(text.startsWith("date,channel,amount\n")).toBe(true);
    const { rows, errors } = parseSpendCsv(text);
    expect(errors).toEqual([]);
    expect(rows.length).toBe(4);
    expect(rows.every((r) => r.channel === "meta" || r.channel === "google")).toBe(
      true,
    );
  });

  it("long blank includes all channel labels with empty amounts", () => {
    const text = buildPipeAutomationLongTemplate({
      dayCount: 1,
      example: false,
      now,
    });
    const lines = text.trim().split("\n");
    expect(lines[0]).toBe("date,channel,amount");
    expect(lines.length).toBe(1 + PIPE_CHANNEL_LABELS.length);
    for (const label of PIPE_CHANNEL_LABELS) {
      expect(text).toContain(`,${label},`);
    }
    const { rows, errors } = parseSpendCsv(text);
    expect(errors).toEqual([]);
    expect(rows).toEqual([]);
  });

  it("long blank respects channels filter (Free Meta+Google)", () => {
    const text = buildPipeAutomationLongTemplate({
      dayCount: 1,
      example: false,
      now,
      channels: ["meta", "google"],
    });
    const lines = text.trim().split("\n");
    expect(lines.length).toBe(3); // header + meta + google
    expect(text).toContain(",Meta Ads,");
    expect(text).toContain(",Google Ads,");
    expect(text).not.toContain(",TikTok Ads,");
  });

  it("wide pipe example matches WIDE_TEMPLATE_SAMPLE parse", () => {
    const text = buildPipeAutomationWideTemplate({ example: true });
    const { rows, errors } = parseSpendCsv(text);
    expect(errors).toEqual([]);
    expect(rows.length).toBeGreaterThan(0);
  });

  it("wide pipe Free channels uses selected columns — not full WIDE sample", () => {
    const text = buildPipeAutomationWideTemplate({
      example: true,
      dayCount: 14,
      channels: ["meta", "google"],
      now,
    });
    expect(text.startsWith("Day,Meta Ads,Google Ads\n")).toBe(true);
    expect(text).not.toContain("TikTok Ads");
    const { rows, errors } = parseSpendCsv(text);
    expect(errors).toEqual([]);
    expect(rows.every((r) => r.channel === "meta" || r.channel === "google")).toBe(
      true,
    );
  });
});

describe("buildSelectedPlatformTemplateCsv", () => {
  const now = new Date(2026, 6, 26); // local Jul 26, 2026

  it("builds Day + wide-template headers for selected channels", () => {
    const result = buildSelectedPlatformTemplateCsv(
      [
        { title: "Meta (Facebook + Instagram)", engineChannel: "meta" },
        { title: "Google Ads", engineChannel: "google" },
      ],
      { now },
    );
    expect(result.headers).toEqual(["Day", "Meta Ads", "Google Ads"]);
    expect(result.rows).toHaveLength(7);
    expect(result.rows[0][0]).toBe("2026-07-20");
    expect(result.rows[6][0]).toBe("2026-07-26");
    expect(result.rows[0]).toHaveLength(3);
    expect(Number(result.rows[0][1])).toBeGreaterThan(0);
    expect(result.csv.startsWith("Day,Meta Ads,Google Ads\n")).toBe(true);
    expect(result.csv.endsWith("\n")).toBe(true);
  });

  it("dedupes columns when two platforms share an engineChannel", () => {
    const result = buildSelectedPlatformTemplateCsv(
      [
        { title: "Meta A", engineChannel: "meta" },
        { title: "Meta B", engineChannel: "meta" },
        { title: "TikTok", engineChannel: "tiktok" },
      ],
      { now, dayCount: 3 },
    );
    expect(result.headers).toEqual(["Day", "Meta Ads", "TikTok Ads"]);
    expect(result.rows).toHaveLength(3);
  });

  it("parses through the wide CSV importer", () => {
    const { csv } = buildSelectedPlatformTemplateCsv(
      [
        { title: "Meta", engineChannel: "meta" },
        { title: "Microsoft", engineChannel: "microsoft" },
      ],
      { now },
    );
    const { rows, errors, totalDataRows } = parseSpendCsv(csv);
    expect(errors).toEqual([]);
    expect(totalDataRows).toBe(7);
    expect(rows.every((r) => r.channel === "meta" || r.channel === "microsoft")).toBe(
      true,
    );
    expect(rows.some((r) => r.channel === "meta" && r.amount > 0)).toBe(true);
  });

  it("returns Day-only template when no platforms selected", () => {
    const result = buildSelectedPlatformTemplateCsv([], { now, dayCount: 2 });
    expect(result.headers).toEqual(["Day"]);
    expect(result.rows).toEqual([["2026-07-25"], ["2026-07-26"]]);
  });

  it("blank selected template keeps dates and empty amount cells", () => {
    const result = buildSelectedPlatformTemplateCsv(
      [
        { title: "Meta", engineChannel: "meta" },
        { title: "Google", engineChannel: "google" },
        { title: "TikTok", engineChannel: "tiktok" },
      ],
      { now, dayCount: 3, example: false },
    );
    expect(result.headers).toEqual(["Day", "Meta Ads", "Google Ads", "TikTok Ads"]);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0]).toEqual(["2026-07-24", "", "", ""]);
    expect(result.rows[2]).toEqual(["2026-07-26", "", "", ""]);
    expect(result.csv).toContain("Day,Meta Ads,Google Ads,TikTok Ads\n");
    const { rows, errors } = parseSpendCsv(result.csv);
    expect(errors).toEqual([]);
    expect(rows).toEqual([]);
  });

  it("example:true remains the default (back-compat)", () => {
    const withDefault = buildSelectedPlatformTemplateCsv(
      [{ title: "Meta", engineChannel: "meta" }],
      { now, dayCount: 1 },
    );
    const explicit = buildSelectedPlatformTemplateCsv(
      [{ title: "Meta", engineChannel: "meta" }],
      { now, dayCount: 1, example: true },
    );
    expect(withDefault.csv).toBe(explicit.csv);
    expect(Number(withDefault.rows[0][1])).toBeGreaterThan(0);
  });

  it("keeps two named extra columns instead of collapsing Other", () => {
    const result = buildSelectedPlatformTemplateCsv(
      [
        { title: "Meta", engineChannel: "meta" },
        ...customNamesToTemplateCols(["Billboards / OOH", "Radio"]),
      ],
      { now, dayCount: 1, example: false },
    );
    expect(result.headers).toEqual([
      "Day",
      "Meta Ads",
      "Billboards / OOH",
      "Radio",
    ]);
    expect(result.rows[0]).toEqual(["2026-07-26", "", "", ""]);
    const filled = buildSelectedPlatformTemplateCsv(
      [
        { title: "Meta", engineChannel: "meta" },
        ...customNamesToTemplateCols(["Billboards / OOH", "Radio"]),
      ],
      { now, dayCount: 1, example: true },
    );
    const { rows, errors } = parseSpendCsv(filled.csv);
    expect(errors).toEqual([]);
    expect(rows.map((r) => `${r.channel}:${r.customKey ?? ""}`).sort()).toEqual([
      "meta:",
      "other:billboards-ooh",
      "other:radio",
    ]);
  });
});

describe("parsePlatformsParam + selected template filename", () => {
  it("parses comma list and validates against SPEND_CHANNELS", () => {
    expect(parsePlatformsParam("meta,google,tiktok")).toEqual([
      "meta",
      "google",
      "tiktok",
    ]);
    expect(parsePlatformsParam("meta,bogus,google,meta")).toEqual([
      "meta",
      "google",
    ]);
    expect(parsePlatformsParam("apple-search,email")).toEqual([
      "apple_search",
      "email",
    ]);
    expect(parsePlatformsParam("")).toEqual([]);
    expect(parsePlatformsParam(null)).toEqual([]);
  });

  it("builds filename for blank selected template", () => {
    expect(
      selectedPlatformsTemplateFilename(["meta", "google"], "blank"),
    ).toBe("mcfly-spend-meta-google-blank.csv");
    expect(
      selectedPlatformsTemplateFilename(["meta", "google", "tiktok"], "example"),
    ).toBe("mcfly-spend-meta-google-tiktok-example.csv");
    expect(selectedPlatformsTemplateFilename([], "blank")).toBe(
      "mcfly-spend-day-only-blank.csv",
    );
  });

  it("platformsToTemplateCols maps engine labels", () => {
    expect(platformsToTemplateCols(["meta", "google"])).toEqual([
      { title: "Meta Ads", engineChannel: "meta" },
      { title: "Google Ads", engineChannel: "google" },
    ]);
  });
});

describe("buildSheetsImportGuide", () => {
  it("returns five steps, Sheets create URL, and Free-path tip", () => {
    const guide = buildSheetsImportGuide({
      platformLabels: ["Meta (Facebook + Instagram)", "Google Ads"],
    });
    expect(guide.sheetsNewUrl).toBe(SHEETS_CREATE_URL);
    expect(guide.sheetsNewUrl).toContain("docs.google.com/spreadsheets/create");
    expect(guide.steps).toHaveLength(5);
    expect(guide.steps[0]).toContain("Meta (Facebook + Instagram)");
    expect(guide.steps[2]).toMatch(/File → Import/i);
    expect(guide.steps[3]).toMatch(/SyncWith/i);
    expect(guide.tip).toMatch(/never requires SyncWith/i);
  });
});

describe("long format Other channel", () => {
  it("accepts explicit Other in long CSV", () => {
    const csv = `date,channel,amount
2026-07-01,Other,99.99`;
    const { rows, errors } = parseSpendCsv(csv);
    expect(errors).toEqual([]);
    expect(aggregateSpendRows(rows)).toEqual([
      { date: "2026-07-01", channel: "other", amount: 99.99 },
    ]);
  });

  it("keeps Billboards and Radio as separate extras on the same day", () => {
    const csv = `date,channel,amount
2026-07-01,Billboards,80
2026-07-01,Radio,40`;
    const { rows, errors } = parseSpendCsv(csv);
    expect(errors).toEqual([]);
    expect(aggregateSpendRows(rows)).toEqual([
      {
        date: "2026-07-01",
        channel: "other",
        amount: 80,
        customKey: "billboards",
        customLabel: "Billboards",
      },
      {
        date: "2026-07-01",
        channel: "other",
        amount: 40,
        customKey: "radio",
        customLabel: "Radio",
      },
    ]);
  });
});

describe("single-channel native exports with forceChannel", () => {
  it("parses Meta-like Day + Amount spent (USD)", () => {
    const csv = `Day,Amount spent (USD)
2026-07-01,412.55
2026-07-02,401.20
Total,813.75`;
    const { rows, errors } = parseSpendCsv(csv, { forceChannel: "meta" });
    expect(errors).toEqual([]);
    expect(aggregateSpendRows(rows)).toEqual([
      { date: "2026-07-01", channel: "meta", amount: 412.55 },
      { date: "2026-07-02", channel: "meta", amount: 401.2 },
    ]);
  });

  it("parses Google-like Date + Cost (Account currency) and prefers Reporting starts", () => {
    const csv = `Reporting starts,Reporting ends,Cost (Account currency)
2026-07-01,2026-07-01,288.10
2026-07-02,2026-07-02,301.75
,,,`;
    const { rows, errors } = parseSpendCsv(csv, { forceChannel: "google" });
    expect(errors).toEqual([]);
    expect(rows.every((r) => r.channel === "google")).toBe(true);
    expect(aggregateSpendRows(rows)).toEqual([
      { date: "2026-07-01", channel: "google", amount: 288.1 },
      { date: "2026-07-02", channel: "google", amount: 301.75 },
    ]);
  });

  it("errors without forceChannel on date+amount-only files", () => {
    const csv = `Day,Amount spent
2026-07-01,100`;
    const { rows, errors } = parseSpendCsv(csv);
    expect(rows).toEqual([]);
    expect(errors[0]).toMatch(/single-platform export/i);
  });

  it("does not treat Campaign as a spend column in Google-like Date,Campaign,Cost", () => {
    const headers = ["Date", "Campaign", "Cost"];
    expect(detectWideChannelColumns(headers)).toEqual([]);
    const csv = `Date,Campaign,Cost
2026-07-01,Summer Sale,250.00`;
    const unforced = parseSpendCsv(csv);
    expect(unforced.rows).toEqual([]);
    expect(unforced.errors[0]).toMatch(/single-platform export/i);
    const forced = parseSpendCsv(csv, { forceChannel: "google" });
    expect(forced.errors).toEqual([]);
    expect(aggregateSpendRows(forced.rows)).toEqual([
      { date: "2026-07-01", channel: "google", amount: 250 },
    ]);
  });

  it("skips empty date, Total label, and missing amount rows", () => {
    const csv = `Day,Spend
2026-07-01,50
,99
Total,149
2026-07-03,
2026-07-04,25`;
    const { rows, errors } = parseSpendCsv(csv, { forceChannel: "tiktok" });
    expect(errors).toEqual([]);
    expect(aggregateSpendRows(rows)).toEqual([
      { date: "2026-07-01", channel: "tiktok", amount: 50 },
      { date: "2026-07-04", channel: "tiktok", amount: 25 },
    ]);
  });
});

describe("combineSpendCsvInputs", () => {
  it("combines two platform files into two channels on the same day", () => {
    const meta = `Day,Amount spent
2026-07-01,400
2026-07-02,410`;
    const google = `Date,Cost
2026-07-01,200
2026-07-02,210`;
    const { rows, errors } = combineSpendCsvInputs([
      { text: meta, forceChannel: "meta", label: "Meta Ads" },
      { text: google, forceChannel: "google", label: "Google Ads" },
    ]);
    expect(errors).toEqual([]);
    expect(aggregateSpendRows(rows)).toEqual([
      { date: "2026-07-01", channel: "google", amount: 200 },
      { date: "2026-07-01", channel: "meta", amount: 400 },
      { date: "2026-07-02", channel: "google", amount: 210 },
      { date: "2026-07-02", channel: "meta", amount: 410 },
    ]);
  });

  it("prefixes parse errors with file labels", () => {
    const bad = `Nope,Whatever
x,y`;
    const { errors } = combineSpendCsvInputs([
      { text: bad, forceChannel: "meta", label: "Meta Ads" },
    ]);
    expect(errors.some((e) => e.startsWith("Meta Ads:"))).toBe(true);
  });
});

describe("spend CSV scale caps (MAX_BYTES / MAX_ROWS)", () => {
  it("accepts normal pastes under the caps", () => {
    const ok = assertSpendCsvLimits(WIDE_TEMPLATE_SAMPLE);
    expect(ok).toEqual({ ok: true });
    expect(countSpendCsvDataRows(WIDE_TEMPLATE_SAMPLE)).toBe(3);
  });

  it("rejects when byte length exceeds SPEND_CSV_MAX_BYTES", () => {
    const header = "date,channel,amount\n";
    const pad = "x".repeat(SPEND_CSV_MAX_BYTES - header.length + 1);
    const text = `${header}${pad}`;
    const limits = assertSpendCsvLimits(text);
    expect(limits.ok).toBe(false);
    if (!limits.ok) {
      expect(limits.code).toBe("max_bytes");
      expect(limits.error).toMatch(/too large/i);
      expect(limits.error).toMatch(
        new RegExp(`${SPEND_CSV_MAX_ROWS.toLocaleString()} rows / 2\\.0 MB`),
      );
      expect(limits.error).toMatch(/split by date range/i);
    }
    const parsed = parseSpendCsv(text);
    expect(parsed.rows).toEqual([]);
    expect(parsed.errors[0]).toMatch(/too large/i);
  });

  it("rejects when data rows exceed SPEND_CSV_MAX_ROWS", () => {
    const lines = ["date,channel,amount"];
    // Keep under MAX_BYTES: short rows, just over MAX_ROWS.
    const over = SPEND_CSV_MAX_ROWS + 1;
    for (let i = 0; i < over; i++) {
      // Compact YYYY-MM-DD via day offset from a fixed epoch-ish base.
      const day = 1 + (i % 28);
      const month = 1 + (Math.floor(i / 28) % 12);
      const year = 2020 + Math.floor(i / (28 * 12));
      const y = String(year);
      const m = String(month).padStart(2, "0");
      const d = String(day).padStart(2, "0");
      lines.push(`${y}-${m}-${d},meta,1`);
    }
    const text = lines.join("\n");
    expect(countSpendCsvDataRows(text)).toBe(over);
    // Guard: this fixture must stay under the byte cap so we hit max_rows.
    expect(new TextEncoder().encode(text).length).toBeLessThanOrEqual(SPEND_CSV_MAX_BYTES);

    const limits = assertSpendCsvLimits(text);
    expect(limits.ok).toBe(false);
    if (!limits.ok) {
      expect(limits.code).toBe("max_rows");
      expect(limits.error).toMatch(/data rows/i);
      expect(limits.error).toMatch(
        new RegExp(`${SPEND_CSV_MAX_ROWS.toLocaleString()} rows / 2\\.0 MB`),
      );
    }
    const parsed = parseSpendCsv(text);
    expect(parsed.rows).toEqual([]);
    expect(parsed.errors[0]).toMatch(/data rows/i);
  });

  it("parses ~3000 Meta+Google daily rows under caps in under 5s", () => {
    const lines = ["date,channel,amount"];
    const days = 1500;
    const start = new Date(2022, 0, 1);
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      lines.push(`${date},meta,${10 + (i % 7)}`);
      lines.push(`${date},google,${20 + (i % 5)}`);
    }
    const text = lines.join("\n");
    expect(countSpendCsvDataRows(text)).toBe(3000);
    expect(new TextEncoder().encode(text).length).toBeLessThanOrEqual(SPEND_CSV_MAX_BYTES);

    const t0 = Date.now();
    expect(assertSpendCsvLimits(text)).toEqual({ ok: true });
    const parsed = parseSpendCsv(text);
    const elapsed = Date.now() - t0;

    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(3000);
    expect(elapsed).toBeLessThan(5000);
  });

  it("aggregateSpendRows rounds float drift to cents", () => {
    const rows = Array.from({ length: 50_000 }, () => ({
      date: "2026-01-01",
      channel: "meta" as const,
      rawChannel: "meta",
      amount: 0.1,
    }));
    const [day] = aggregateSpendRows(rows);
    expect(day.amount).toBe(5000);
  });

  it("prefixes combine limit errors with the file label", () => {
    const header = "date,channel,amount\n";
    const pad = "x".repeat(SPEND_CSV_MAX_BYTES - header.length + 1);
    const { errors, rows } = combineSpendCsvInputs([
      { text: `${header}${pad}`, forceChannel: "meta", label: "Meta Ads" },
    ]);
    expect(rows).toEqual([]);
    expect(errors.some((e) => e.startsWith("Meta Ads:") && /too large/i.test(e))).toBe(
      true,
    );
  });
});
