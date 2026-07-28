import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SPEND_CHANNELS } from "@mcfly/mer-engine";
import {
  WIDE_TEMPLATE_COLUMNS,
  WIDE_TEMPLATE_HEADERS,
  WIDE_TEMPLATE_SAMPLE,
  aggregateSpendRows,
  buildBlankSpendTemplate,
  buildSelectedPlatformTemplateCsv,
  combineSpendCsvInputs,
  normalizeChannel,
  parseSpendCsv,
} from "./spend-csv";

const CHANNEL_COUNT = SPEND_CHANNELS.length;
const EMPTY_SPEND_COMMAS = ",".repeat(CHANNEL_COUNT);

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

  it("round-trips through parseSpendCsv with no spend rows", () => {
    const { rows, errors, totalDataRows } = parseSpendCsv(buildBlankSpendTemplate(2));
    expect(errors).toEqual([]);
    expect(totalDataRows).toBe(2);
    expect(rows).toEqual([]);
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
