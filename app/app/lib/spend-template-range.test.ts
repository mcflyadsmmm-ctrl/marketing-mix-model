import { describe, expect, it } from "vitest";
import {
  SPEND_TEMPLATE_DATES_QUERY_CAP,
  SPEND_TEMPLATE_SPANS,
  addDaysToKey,
  parseSpendTemplateDatesParam,
  parseSpendTemplateSpan,
  parseSpendTemplateYmd,
  resolveSpendTemplateRangeQuery,
  spendTemplateDateRange,
  spendTemplateDefaultFloorKey,
  spendTemplateYesterdayKey,
  type SpendTemplateSpan,
} from "./spend-template-range";

describe("parseSpendTemplateSpan", () => {
  it("accepts the range enum case-insensitively", () => {
    expect(SPEND_TEMPLATE_SPANS).toEqual(["30d", "90d", "ytd", "12m"]);
    expect(parseSpendTemplateSpan("30d")).toBe("30d");
    expect(parseSpendTemplateSpan("90D")).toBe("90d");
    expect(parseSpendTemplateSpan("YTD")).toBe("ytd");
    expect(parseSpendTemplateSpan(" 12M ")).toBe("12m");
  });

  it("rejects unknown tokens", () => {
    expect(parseSpendTemplateSpan("14d")).toBeNull();
    expect(parseSpendTemplateSpan("1y")).toBeNull();
    expect(parseSpendTemplateSpan("forever")).toBeNull();
    expect(parseSpendTemplateSpan("")).toBeNull();
    expect(parseSpendTemplateSpan(null)).toBeNull();
  });
});

describe("spendTemplateDateRange", () => {
  const now = new Date(2026, 7, 25, 15, 0, 0); // local Aug 25, 2026
  const yesterday = "2026-08-24";

  it("enumerates 30d as 30 closed days through yesterday", () => {
    const range = spendTemplateDateRange({ span: "30d", now });
    expect(range.toKey).toBe(yesterday);
    expect(range.fromKey).toBe("2026-07-26");
    expect(range.dates).toHaveLength(30);
    expect(range.dates[0]).toBe(range.fromKey);
    expect(range.dates[range.dates.length - 1]).toBe(range.toKey);
  });

  it("enumerates 90d as 90 closed days through yesterday", () => {
    const range = spendTemplateDateRange({ span: "90d", now });
    expect(range.toKey).toBe(yesterday);
    expect(range.dates).toHaveLength(90);
    expect(range.fromKey).toBe(addDaysToKey(yesterday, -89));
  });

  it("enumerates ytd from Jan 1 of yesterday's year through yesterday", () => {
    const range = spendTemplateDateRange({ span: "ytd", now });
    expect(range.fromKey).toBe("2026-01-01");
    expect(range.toKey).toBe(yesterday);
    expect(range.dates[0]).toBe("2026-01-01");
    expect(range.dates[range.dates.length - 1]).toBe(yesterday);
    expect(range.dates).toHaveLength(236); // Jan 1 … Aug 24 2026
  });

  it("uses yesterday's year for ytd on Jan 1 (prior calendar year)", () => {
    const jan1 = new Date(2026, 0, 1, 9, 0, 0);
    const range = spendTemplateDateRange({ span: "ytd", now: jan1 });
    expect(spendTemplateYesterdayKey(jan1)).toBe("2025-12-31");
    expect(range.fromKey).toBe("2025-01-01");
    expect(range.toKey).toBe("2025-12-31");
    expect(range.dates).toHaveLength(365);
  });

  it("enumerates 12m as 365 closed days through yesterday", () => {
    const range = spendTemplateDateRange({ span: "12m", now });
    expect(range.toKey).toBe(yesterday);
    expect(range.fromKey).toBe("2025-08-25");
    expect(range.dates).toHaveLength(365);
  });

  it("clamps span from-key up to the sales-window floor", () => {
    const range = spendTemplateDateRange({
      span: "90d",
      now: new Date(2026, 1, 15, 12, 0, 0), // local Feb 15 → yesterday Feb 14
      floorKey: "2026-02-01",
    });
    expect(range.fromKey).toBe("2026-02-01");
    expect(range.toKey).toBe("2026-02-14");
    expect(range.dates[0]).toBe("2026-02-01");
    expect(range.dates).toHaveLength(14);
  });

  it("clamps 12m that starts before the 4-year floor", () => {
    const early = new Date(2022, 2, 10, 12, 0, 0); // Mar 10 2022 → yesterday Mar 9
    const floor = spendTemplateDefaultFloorKey(early);
    expect(floor).toBe("2018-01-01");
    const range = spendTemplateDateRange({
      span: "12m",
      now: early,
      floorKey: "2022-01-01",
    });
    expect(range.fromKey).toBe("2022-01-01");
    expect(range.toKey).toBe("2022-03-09");
  });

  it("uses explicit from/to and enumerates inclusive days", () => {
    const range = spendTemplateDateRange({
      from: "2026-07-01",
      to: "2026-07-03",
      now,
    });
    expect(range).toEqual({
      fromKey: "2026-07-01",
      toKey: "2026-07-03",
      dates: ["2026-07-01", "2026-07-02", "2026-07-03"],
    });
  });

  it("lets from/to win over span", () => {
    const range = spendTemplateDateRange({
      span: "90d",
      from: "2026-01-01",
      to: "2026-01-02",
      now,
    });
    expect(range.dates).toEqual(["2026-01-01", "2026-01-02"]);
  });

  it("clamps from up to floorKey and to down to yesterday", () => {
    const range = spendTemplateDateRange({
      from: "2019-06-01",
      to: "2029-01-01",
      now,
      floorKey: "2022-01-01",
    });
    expect(range.fromKey).toBe("2022-01-01");
    expect(range.toKey).toBe(yesterday);
    expect(range.dates[0]).toBe("2022-01-01");
    expect(range.dates[range.dates.length - 1]).toBe(yesterday);
  });

  it("swaps inverted from/to", () => {
    const range = spendTemplateDateRange({
      from: "2026-07-10",
      to: "2026-07-08",
      now,
    });
    expect(range.fromKey).toBe("2026-07-08");
    expect(range.toKey).toBe("2026-07-10");
    expect(range.dates).toEqual(["2026-07-08", "2026-07-09", "2026-07-10"]);
  });

  it("defaults to 14 closed days through yesterday when nothing is set", () => {
    const range = spendTemplateDateRange({ now });
    expect(range.toKey).toBe(yesterday);
    expect(range.dates).toHaveLength(14);
    expect(range.fromKey).toBe("2026-08-11");
  });

  it("default floor matches salesDayFactWindowStartUtc (UTC year − 4 Jan 1)", () => {
    expect(spendTemplateDefaultFloorKey(new Date(Date.UTC(2026, 7, 25)))).toBe(
      "2022-01-01",
    );
    expect(spendTemplateDefaultFloorKey(now)).toBe("2022-01-01");
  });

  it("rejects invalid calendar days in from/to", () => {
    const range = spendTemplateDateRange({
      from: "2026-02-31",
      to: "not-a-date",
      span: "30d",
      now,
    });
    // Invalid from/to fall through to span.
    expect(range.dates).toHaveLength(30);
    expect(range.toKey).toBe(yesterday);
  });
});

describe("resolveSpendTemplateRangeQuery (template loader query params)", () => {
  const now = new Date(2026, 7, 25, 15, 0, 0);

  it("reads span=90d", () => {
    const q = resolveSpendTemplateRangeQuery(new URLSearchParams("span=90d"), {
      now,
    });
    expect(q).not.toBeNull();
    expect(q?.source).toBe("span");
    expect(q?.dates).toHaveLength(90);
    expect(q?.toKey).toBe("2026-08-24");
  });

  it("reads from/to and prefers them over span", () => {
    const q = resolveSpendTemplateRangeQuery(
      new URLSearchParams("from=2026-01-01&to=2026-01-31&span=30d"),
      { now },
    );
    expect(q?.source).toBe("from-to");
    expect(q?.fromKey).toBe("2026-01-01");
    expect(q?.toKey).toBe("2026-01-31");
    expect(q?.dates).toHaveLength(31);
  });

  it("returns null when there is no range (legacy dayCount path)", () => {
    expect(
      resolveSpendTemplateRangeQuery(new URLSearchParams("blank=1"), { now }),
    ).toBeNull();
    expect(
      resolveSpendTemplateRangeQuery(new URLSearchParams("span=forever"), {
        now,
      }),
    ).toBeNull();
  });

  it("does not treat dates= as a range (hole list stays a separate cap)", () => {
    const q = resolveSpendTemplateRangeQuery(
      new URLSearchParams("dates=2026-01-01,2026-01-02"),
      { now },
    );
    expect(q).toBeNull();
  });

  it("caps dates= at 366", () => {
    expect(SPEND_TEMPLATE_DATES_QUERY_CAP).toBeGreaterThanOrEqual(366);
    const many = Array.from({ length: 400 }, (_, i) =>
      addDaysToKey("2026-01-01", i),
    );
    const parsed = parseSpendTemplateDatesParam(many.join(","));
    expect(parsed).toHaveLength(366);
    expect(parsed[0]).toBe("2026-01-01");
    expect(parsed[365]).toBe(addDaysToKey("2026-01-01", 365));
  });

  it("covers every span token via the query parser", () => {
    const seen: SpendTemplateSpan[] = [];
    for (const span of SPEND_TEMPLATE_SPANS) {
      const q = resolveSpendTemplateRangeQuery(new URLSearchParams(`span=${span}`), {
        now,
      });
      expect(q?.source).toBe("span");
      expect(q?.dates.length).toBeGreaterThan(0);
      seen.push(span);
    }
    expect(seen).toEqual([...SPEND_TEMPLATE_SPANS]);
  });
});

describe("parseSpendTemplateYmd", () => {
  it("accepts ISO dates and rejects impossible days", () => {
    expect(parseSpendTemplateYmd("2026-08-24")).toBe("2026-08-24");
    expect(parseSpendTemplateYmd("2026-02-29")).toBeNull();
    expect(parseSpendTemplateYmd("2024-02-29")).toBe("2024-02-29");
    expect(parseSpendTemplateYmd("08/24/2026")).toBeNull();
  });
});
