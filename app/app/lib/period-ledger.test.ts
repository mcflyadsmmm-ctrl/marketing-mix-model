import { describe, expect, it } from "vitest";
import { SPEND_CHANNELS, type SpendChannel } from "@mcfly/mer-engine";
import {
  buildPeriodLedgerRows,
  escapeCsvField,
  periodLedgerChannelColumnsMatchEngine,
  periodLedgerChannelHeader,
  periodLedgerFilename,
  periodLedgerHref,
  periodLedgerRowFields,
  resolvePeriodLedgerControl,
  serializeCsvRows,
  serializePeriodLedgerCsv,
  PERIOD_LEDGER_BLOCK_COPY,
  PERIOD_LEDGER_CHANNEL_COLUMNS,
  PERIOD_LEDGER_EXPORT_LABEL,
  PERIOD_LEDGER_HEADERS,
  type PeriodLedgerDayInput,
} from "./period-ledger";

/** The eighteen-column contract from WAVE7C_EXPORT_LEDGER_SPEC.md §2. */
const EXPECTED_HEADERS = [
  "day",
  "Shopify sales",
  "spend total",
  "Meta spend",
  "Google spend",
  "Microsoft spend",
  "TikTok spend",
  "Pinterest spend",
  "Snapchat spend",
  "Reddit spend",
  "X spend",
  "LinkedIn spend",
  "Amazon spend",
  "Apple Search Ads spend",
  "Affiliate spend",
  "Email spend",
  "Other spend",
  "Total ROAS",
];

const CRLF = "\r\n";

function csvLines(csv: string): string[] {
  return csv.split(CRLF);
}

function cells(csv: string, rowIndex: number): string[] {
  return csvLines(csv)[rowIndex].split(",");
}

describe("period ledger column contract", () => {
  it("emits exactly the eighteen contracted headers in order", () => {
    expect([...PERIOD_LEDGER_HEADERS]).toEqual(EXPECTED_HEADERS);
    expect(PERIOD_LEDGER_HEADERS).toHaveLength(18);
    expect(cells(serializePeriodLedgerCsv([]), 0)).toEqual(EXPECTED_HEADERS);
  });

  it("covers every engine SpendChannel exactly once, in the fixed order", () => {
    // A new SpendChannel fails this until the schema above is updated on purpose
    // (the compile-time tuple guard in period-ledger.ts fails typecheck too).
    expect(periodLedgerChannelColumnsMatchEngine()).toBe(true);
    expect(PERIOD_LEDGER_CHANNEL_COLUMNS).toHaveLength(14);
    expect(PERIOD_LEDGER_CHANNEL_COLUMNS).toHaveLength(SPEND_CHANNELS.length);
    expect(new Set(PERIOD_LEDGER_CHANNEL_COLUMNS).size).toBe(14);
    expect([...PERIOD_LEDGER_CHANNEL_COLUMNS]).toEqual([
      "meta",
      "google",
      "microsoft",
      "tiktok",
      "pinterest",
      "snapchat",
      "reddit",
      "x",
      "linkedin",
      "amazon",
      "apple_search",
      "affiliate",
      "email",
      "other",
    ]);
  });

  it("gives each channel its own contracted header slot", () => {
    PERIOD_LEDGER_CHANNEL_COLUMNS.forEach((channel, index) => {
      expect(periodLedgerChannelHeader(channel)).toBe(
        EXPECTED_HEADERS[3 + index],
      );
    });
  });
});

describe("dense closed-day rows", () => {
  const days: PeriodLedgerDayInput[] = [
    // Deliberately out of order — the builder must sort oldest first.
    { dayKey: "2026-09-03", sales: 0, channels: {} },
    { dayKey: "2026-09-01", sales: 400, channels: { meta: 100 } },
    { dayKey: "2026-09-02", sales: 250.5, channels: { google: 50.25 } },
  ];

  it("orders rows oldest first and keeps a covered zero day as 0.00", () => {
    const csv = serializePeriodLedgerCsv(buildPeriodLedgerRows(days));
    const lines = csvLines(csv);
    expect(lines).toHaveLength(4);
    expect(cells(csv, 1)[0]).toBe("2026-09-01");
    expect(cells(csv, 2)[0]).toBe("2026-09-02");

    const zeroDay = cells(csv, 3);
    expect(zeroDay[0]).toBe("2026-09-03");
    expect(zeroDay[1]).toBe("0.00");
    expect(zeroDay[2]).toBe("0.00");
    // Every channel column on a covered empty day is an explicit 0.00.
    expect(zeroDay.slice(3, 17)).toEqual(Array(14).fill("0.00"));
  });

  it("writes 0.00 for absent channels and never drops a requested day", () => {
    const rows = buildPeriodLedgerRows(days);
    expect(rows.map((r) => r.dayKey)).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
    ]);
    const fields = periodLedgerRowFields(rows[0]);
    expect(fields).toHaveLength(18);
    expect(fields[1]).toBe("400.00");
    expect(fields[3]).toBe("100.00");
    expect(fields.slice(4, 17)).toEqual(Array(13).fill("0.00"));
  });

  it("lands each named channel in only its own column", () => {
    const amounts: Record<SpendChannel, number> = {
      meta: 1,
      google: 2,
      microsoft: 3,
      tiktok: 4,
      pinterest: 5,
      snapchat: 6,
      reddit: 7,
      x: 8,
      linkedin: 9,
      amazon: 10,
      apple_search: 11,
      affiliate: 12,
      email: 13,
      other: 14,
    };
    for (const channel of PERIOD_LEDGER_CHANNEL_COLUMNS) {
      const fields = periodLedgerRowFields(
        buildPeriodLedgerRows([
          { dayKey: "2026-09-01", sales: 0, channels: { [channel]: amounts[channel] } },
        ])[0],
      );
      const channelCells = fields.slice(3, 17);
      const index = PERIOD_LEDGER_CHANNEL_COLUMNS.indexOf(channel);
      expect(channelCells[index]).toBe(amounts[channel].toFixed(2));
      channelCells.forEach((cell, i) => {
        if (i !== index) expect(cell).toBe("0.00");
      });
    }
  });

  it("sums the fourteen channel columns exactly into spend total", () => {
    const fields = periodLedgerRowFields(
      buildPeriodLedgerRows([
        {
          dayKey: "2026-09-01",
          sales: 1000,
          channels: {
            meta: 10.005,
            google: 20.004,
            tiktok: 0.126,
            other: 5.555,
          },
        },
      ])[0],
    );
    const channelCents = fields
      .slice(3, 17)
      .map((cell) => Math.round(Number(cell) * 100));
    const totalCents = channelCents.reduce((sum, cents) => sum + cents, 0);
    expect(Math.round(Number(fields[2]) * 100)).toBe(totalCents);
    // 10.01 + 20.00 + 0.13 + 5.56 — cent rounding happens per channel column.
    expect(fields[2]).toBe("35.70");
  });
});

describe("Total ROAS field", () => {
  it("is sales ÷ spend total to four decimal places", () => {
    const fields = periodLedgerRowFields(
      buildPeriodLedgerRows([
        { dayKey: "2026-09-01", sales: 1234.56, channels: { meta: 400 } },
      ])[0],
    );
    expect(fields[1]).toBe("1234.56");
    expect(fields[2]).toBe("400.00");
    expect(fields[17]).toBe((1234.56 / 400).toFixed(4));
    expect(fields[17]).toBe("3.0864");
  });

  it("is an empty field when spend total is zero — never 0, Infinity, or text", () => {
    const rows = buildPeriodLedgerRows([
      { dayKey: "2026-09-01", sales: 500, channels: {} },
    ]);
    expect(rows[0].roas).toBeNull();
    const fields = periodLedgerRowFields(rows[0]);
    expect(fields[17]).toBe("");
    expect(serializePeriodLedgerCsv(rows)).toMatch(/\r\n2026-09-01,500\.00,0\.00(,0\.00){14},$/);
  });

  it("keeps a hostile / non-finite input out of the file", () => {
    const csv = serializePeriodLedgerCsv(
      buildPeriodLedgerRows([
        {
          dayKey: "2026-09-01",
          sales: Number.POSITIVE_INFINITY,
          channels: { meta: Number.NaN, google: 25 },
        },
      ]),
    );
    expect(csv).not.toMatch(/Infinity|NaN/);
    expect(cells(csv, 1)[1]).toBe("0.00");
    expect(cells(csv, 1)[3]).toBe("0.00");
    expect(cells(csv, 1)[4]).toBe("25.00");
  });
});

describe("no decoration, no theater", () => {
  it("emits bare decimals — no currency symbol, ×, locale separators, or summary rows", () => {
    const csv = serializePeriodLedgerCsv(
      buildPeriodLedgerRows([
        { dayKey: "2026-09-01", sales: 12345.5, channels: { meta: 1000 } },
        { dayKey: "2026-09-02", sales: 2000, channels: { google: 500 } },
      ]),
    );
    expect(csv).not.toMatch(/[$€£¥×%]/);
    expect(csv).not.toMatch(/Infinity|NaN/);
    expect(csv).not.toMatch(/^=/m);
    expect(csv).not.toMatch(/^#/m);
    expect(csvLines(csv)).toHaveLength(3);
    // Header plus exactly one row per day — no grand-total or note row.
    for (const line of csvLines(csv).slice(1)) {
      expect(line).toMatch(/^\d{4}-\d{2}-\d{2},/);
    }
    expect(cells(csv, 1)[1]).toBe("12345.50");
  });
});

describe("RFC 4180 serialization", () => {
  it("separates rows with CRLF and never a bare LF", () => {
    const csv = serializePeriodLedgerCsv(
      buildPeriodLedgerRows([
        { dayKey: "2026-09-01", sales: 1, channels: { meta: 1 } },
        { dayKey: "2026-09-02", sales: 2, channels: { meta: 2 } },
      ]),
    );
    expect(csv).toContain(CRLF);
    expect(csv.replace(/\r\n/g, "")).not.toContain("\n");
    expect(csvLines(csv)).toHaveLength(3);
  });

  it("quotes and doubles embedded commas, quotes, and line breaks", () => {
    expect(escapeCsvField("plain")).toBe("plain");
    expect(escapeCsvField("a,b")).toBe('"a,b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvField("line\nbreak")).toBe('"line\nbreak"');
    expect(escapeCsvField("line\r\nbreak")).toBe('"line\r\nbreak"');
    expect(serializeCsvRows([["a,b", 'c"d'], ["e", "f"]])).toBe(
      `"a,b","c""d"${CRLF}e,f`,
    );
  });
});

describe("download filename", () => {
  it("carries only the resolved start and end day keys", () => {
    expect(periodLedgerFilename("2026-09-01", "2026-09-07")).toBe(
      "mcfly-period-ledger-2026-09-01-to-2026-09-07.csv",
    );
    const name = periodLedgerFilename("2026-09-01", "2026-09-07");
    expect(name).not.toMatch(/myshopify|shop|sample|[0-9a-f]{20,}/i);
  });
});

describe("Overview / Spend export control", () => {
  it("targets the resource route with the current preset and exact label", () => {
    const control = resolvePeriodLedgerControl({
      preset: "qtd",
      useSampleDesk: false,
      salesFactsReady: true,
      spendReady: true,
      closedDays: 30,
    });
    expect(control.label).toBe("Export period ledger (.csv)");
    expect(control.label).toBe(PERIOD_LEDGER_EXPORT_LABEL);
    expect(control.href).toBe("/app/period-ledger.csv?period=qtd");
    expect(periodLedgerHref("mtd")).toBe("/app/period-ledger.csv?period=mtd");
    expect(control.ready).toBe(true);
    expect(control.blockedCopy).toBeNull();
  });

  it("disables with the exact SAMPLE copy while preview is on", () => {
    const control = resolvePeriodLedgerControl({
      preset: "mtd",
      useSampleDesk: true,
      salesFactsReady: true,
      spendReady: true,
      closedDays: 10,
    });
    expect(control.ready).toBe(false);
    expect(control.blockedCopy).toBe(PERIOD_LEDGER_BLOCK_COPY.sample);
    expect(control.blockedCopy).toBe(
      "SAMPLE preview is on — switch to Real store before exporting your period ledger. Nothing was downloaded.",
    );
  });

  it("names the incomplete side instead of hiding the reason", () => {
    expect(
      resolvePeriodLedgerControl({
        preset: "mtd",
        useSampleDesk: false,
        salesFactsReady: false,
        spendReady: true,
        closedDays: 10,
      }).blockedCopy,
    ).toBe(PERIOD_LEDGER_BLOCK_COPY.salesFacts);
    expect(
      resolvePeriodLedgerControl({
        preset: "mtd",
        useSampleDesk: false,
        salesFactsReady: true,
        spendReady: false,
        closedDays: 10,
      }).blockedCopy,
    ).toBe(PERIOD_LEDGER_BLOCK_COPY.spend);
    expect(
      resolvePeriodLedgerControl({
        preset: "mtd",
        useSampleDesk: false,
        salesFactsReady: true,
        spendReady: true,
        closedDays: 0,
      }).blockedCopy,
    ).toBe(PERIOD_LEDGER_BLOCK_COPY.noClosedDay);
  });
});
