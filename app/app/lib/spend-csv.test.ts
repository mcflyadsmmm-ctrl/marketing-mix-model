import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  WIDE_TEMPLATE_COLUMNS,
  WIDE_TEMPLATE_HEADERS,
  WIDE_TEMPLATE_SAMPLE,
  aggregateSpendRows,
  buildBlankSpendTemplate,
  normalizeChannel,
  parseSpendCsv,
} from "./spend-csv";

describe("wide spend template", () => {
  it("declares every channel column including Other", () => {
    expect(WIDE_TEMPLATE_HEADERS).toEqual([
      "Day",
      "Meta Ads",
      "Google Ads",
      "Microsoft Ads",
      "TikTok Ads",
      "Affiliate Ads",
      "Email Cost",
      "Other",
    ]);
    const channels = WIDE_TEMPLATE_COLUMNS.filter((c) => c.channel !== "day").map(
      (c) => c.channel,
    );
    expect(channels).toContain("other");
    expect(new Set(channels).size).toBe(7);
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
    expect(
      rows.some(
        (r) => r.channel === "other" && r.date === "2026-07-02" && r.amount === 15,
      ),
    ).toBe(true);
  });

  it("maps the Other wide column through normalizeChannel", () => {
    expect(normalizeChannel("Other")).toBe("other");
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
    expect(lines[1]).toBe("2026-07-22,,,,,,,");
    expect(lines[3]).toBe("2026-07-24,,,,,,,");
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
