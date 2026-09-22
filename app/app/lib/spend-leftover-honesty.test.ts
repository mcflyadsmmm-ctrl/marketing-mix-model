import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { deskPeriodTimeZone } from "./periods";
import {
  hostLocalDayKey,
  listRecentClosedShopLocalDays,
  shopLocalDayKey,
  spendDeskClosedAsOfKey,
  spendDeskTodayKey,
} from "./shop-local-day";
import {
  SPEND_COVERAGE_DAYS,
  spendCoverageClosedDateKeys,
  spendCoverageDateKeys,
  spendEntryCoverageDateKey,
} from "./spend-coverage";
import { LIVE_UNPAID_INGEST_DAYS } from "./live-unpark";
import { confirmedBreakEvenMer } from "./mer-dashboard.server";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

/** Denver 10pm Sep 21 = Tokyo afternoon Sep 22. Host today ≠ shop today. */
const DENVER_EVENING = new Date("2026-09-22T04:00:00.000Z");

describe("spend leftover honesty — shop-local import todayKey", () => {
  it("Asia/Tokyo today is not the Denver host day at that instant", () => {
    expect(shopLocalDayKey(DENVER_EVENING, "Asia/Tokyo")).toBe("2026-09-22");
    expect(shopLocalDayKey(DENVER_EVENING, "America/Denver")).toBe("2026-09-21");
    expect(shopLocalDayKey(DENVER_EVENING, "UTC")).toBe("2026-09-22");
  });

  it("Live import todayKey follows deskPeriodTimeZone + shopLocalDayKey like /app/spend", () => {
    const tokyoTz = deskPeriodTimeZone(false, "Asia/Tokyo");
    expect(tokyoTz).toBe("Asia/Tokyo");
    expect(spendDeskTodayKey(tokyoTz, DENVER_EVENING)).toBe("2026-09-22");
    expect(spendDeskTodayKey("America/Denver", DENVER_EVENING)).toBe(
      "2026-09-21",
    );

    const importSrc = read("../routes/app.spend.import.tsx");
    const spendSrc = read("../routes/app.spend.tsx");
    expect(importSrc).toContain("deskPeriodTimeZone");
    expect(importSrc).toContain("spendDeskTodayKey");
    expect(spendSrc).toContain("spendDeskTodayKey");
    expect(importSrc).not.toMatch(
      /todayKey:\s*sampleDesk\.enabled \? utcDayKey\(now\) : localDayKey\(now\)/,
    );
  });

  it("SAMPLE uses UTC via deskPeriodTimeZone — not a second host clock", () => {
    expect(deskPeriodTimeZone(true, "Asia/Tokyo")).toBe("UTC");
    expect(deskPeriodTimeZone(true, null)).toBe("UTC");
    expect(spendDeskTodayKey("UTC", DENVER_EVENING)).toBe("2026-09-22");
  });

  it("empty shop TZ stays host-local and does not invent a zone", () => {
    expect(deskPeriodTimeZone(false, null)).toBeNull();
    expect(spendDeskTodayKey(null, DENVER_EVENING)).toBe(
      hostLocalDayKey(DENVER_EVENING),
    );
    expect(spendDeskTodayKey("", DENVER_EVENING)).toBe(
      hostLocalDayKey(DENVER_EVENING),
    );
    expect(spendDeskTodayKey("   ", DENVER_EVENING)).toBe(
      hostLocalDayKey(DENVER_EVENING),
    );
    const importSrc = read("../routes/app.spend.import.tsx");
    expect(importSrc).not.toMatch(/timeZone\s*\|\|\s*"UTC"/);
    expect(importSrc).not.toMatch(/ianaTimezone\s*\|\|\s*"America\//);
  });
});

describe("spend leftover honesty — coverage keys on shop IANA", () => {
  it("keeps the 90-day strip; does not change unpaid ingest days", () => {
    expect(SPEND_COVERAGE_DAYS).toBe(90);
    expect(LIVE_UNPAID_INGEST_DAYS).toBe(90);
  });

  it("Live coverage last cell is shop-local today; incomplete today is open", () => {
    const tokyo = spendCoverageDateKeys(DENVER_EVENING, "Asia/Tokyo");
    expect(tokyo).toHaveLength(90);
    expect(tokyo[tokyo.length - 1]).toBe("2026-09-22");
    expect(tokyo[0]).toBe(
      listRecentClosedShopLocalDays("Asia/Tokyo", 89, DENVER_EVENING)[0],
    );
    const closedTokyo = spendCoverageClosedDateKeys(tokyo, "2026-09-22");
    expect(closedTokyo).toHaveLength(89);
    expect(closedTokyo).not.toContain("2026-09-22");
    expect(closedTokyo[closedTokyo.length - 1]).toBe("2026-09-21");

    const denver = spendCoverageDateKeys(DENVER_EVENING, "America/Denver");
    expect(denver[denver.length - 1]).toBe("2026-09-21");
    expect(denver).not.toBe(tokyo);
  });

  it("SAMPLE coverage uses UTC — one clock with live, not a host Date walk", () => {
    const utc = spendCoverageDateKeys(DENVER_EVENING, "UTC");
    expect(utc[utc.length - 1]).toBe("2026-09-22");
    const server = read("./spend-coverage.server.ts");
    expect(server).toContain("spendCoverageDateKeys");
    expect(server).toContain("timeZone");
    expect(server).not.toMatch(
      /new Date\(d\.getFullYear\(\), d\.getMonth\(\), d\.getDate\(\)\)/,
    );
  });

  it("empty TZ coverage does not invent IANA; spend stamps stay civil UTC dates", () => {
    const host = spendCoverageDateKeys(DENVER_EVENING, null);
    expect(host).toHaveLength(90);
    expect(host[host.length - 1]).toBe(hostLocalDayKey(DENVER_EVENING));
    expect(spendEntryCoverageDateKey(new Date("2026-09-21T00:00:00.000Z"))).toBe(
      "2026-09-21",
    );
    expect(spendEntryCoverageDateKey(new Date("2026-09-21T12:00:00.000Z"))).toBe(
      "2026-09-21",
    );
  });

  it("Spend import and Spend pass deskPeriodTimeZone into coverage", () => {
    const spend = read("../routes/app.spend.tsx");
    const imp = read("../routes/app.spend.import.tsx");
    expect(spend).toMatch(/loadSpendDayCoverage\([\s\S]*timeZone/);
    expect(imp).toMatch(/loadSpendDayCoverage\([\s\S]*timeZone/);
  });
});

describe("spend leftover honesty — SAMPLE import BE is —", () => {
  it("extends the v417 SAMPLE-BE lock onto Spend import", () => {
    const imp = read("../routes/app.spend.import.tsx");
    expect(imp).not.toMatch(/useSampleDesk\s*\?\s*SAMPLE_DESK_MARGIN_PCT/);
    expect(imp).not.toMatch(
      /sampleDesk\.enabled\s*\?\s*SAMPLE_DESK_MARGIN_PCT/,
    );
    expect(imp).toContain("confirmedBreakEvenMer");
    expect(imp).not.toContain("calculateBreakEvenMer");
    expect(
      confirmedBreakEvenMer({
        marginConfirmedAt: null,
        marginPct: 0.35,
      }),
    ).toBeNull();
  });
});

describe("spend leftover honesty — Online line names every typed dollar", () => {
  it("Spend and demo withhold-or-name all typed spend, never ads ROAS", () => {
    const spend = read("../routes/app.spend.tsx");
    const demo = read("../routes/demo.spend.tsx");
    const honesty = read("./number-honesty.ts");
    expect(honesty).toContain("every typed dollar (ads, retainers, billboards)");
    expect(honesty).toContain("hasNonOnlineSpend");
    expect(spend).toContain("hasNonOnlineSpendOnFile");
    expect(demo).toContain("hasNonOnlineSpendOnFile");
    expect(spend).not.toMatch(/ads ROAS/i);
    expect(demo).not.toMatch(/ads ROAS/i);
    expect(honesty).not.toMatch(/attribution/i);
  });
});

describe("spend leftover honesty — weekday grain and copyable week/month $", () => {
  it("explorer offers Weekday grain and never paints 0× for empty spend", () => {
    const lib = read("./spend-explorer.ts");
    const ui = read("../components/SpendExplorer.tsx");
    expect(lib).toContain('"Weekday"');
    expect(lib).toContain('value: "Weekday"');
    expect(lib).toContain("weekday buckets");
    expect(ui).toContain("EXPLORER_GRANULARITY_OPTIONS");
    expect(ui).toContain('case "Weekday"');
    expect(ui).toContain('series.granularity !== "Weekday"');
    expect(ui).toContain("CopyWeekMonthSales");
  });

  it("closed-day as-of follows shop IANA, not the Denver host", () => {
    expect(spendDeskClosedAsOfKey("Asia/Tokyo", DENVER_EVENING)).toBe(
      "2026-09-21",
    );
    expect(spendDeskClosedAsOfKey("America/Denver", DENVER_EVENING)).toBe(
      "2026-09-20",
    );
    expect(spendDeskClosedAsOfKey("UTC", DENVER_EVENING)).toBe("2026-09-21");
    expect(spendDeskClosedAsOfKey(null, DENVER_EVENING)).toBe(
      shiftHostYesterday(DENVER_EVENING),
    );
  });

  it("coverage fills only amount > 0 and Spend/import pass shop TZ", () => {
    const server = read("./spend-coverage.server.ts");
    const stack = read("./desk-spend-stack.server.ts");
    const spend = read("../routes/app.spend.tsx");
    const demo = read("../routes/demo.spend.tsx");
    expect(server).toContain("amount: { gt: 0 }");
    expect(server).not.toMatch(/filled\.add\([^)]*\$0/);
    expect(stack).toContain("explorerWeekMonthCopyText");
    expect(stack).toContain("spendDeskClosedAsOfKey");
    expect(spend).toContain("CopyWeekMonthSales");
    expect(demo).toContain("CopyWeekMonthSales");
    expect(spend).toContain("weekMonthCopy");
    expect(demo).toContain("weekMonthCopy");
  });
});

function shiftHostYesterday(now: Date): string {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const yesterday = new Date(y, m, d - 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;
}
