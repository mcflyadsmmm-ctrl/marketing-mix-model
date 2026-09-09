import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { formatMissingDaysRoasImpact } from "./cash-desk-copy";
import {
  SPEND_LEDGER_FIRST_DAYS_MAX,
  SPEND_LEDGER_STANDING_ASK,
  resolveSpendCoverageNotice,
  type SpendCoverageDay,
} from "./spend-coverage-tone";

const here = dirname(fileURLToPath(import.meta.url));
const spendRoute = readFileSync(join(here, "../routes/app.spend.tsx"), "utf8");

const THEATER =
  /web pixel|multi-touch|mta|connector|auto-sync|oauth|true roas|view-through/i;
const PUNISHING = /fail|broken|wrong|must fix|you did not|stop|warning:/i;

/**
 * 28-day strip minus today = 27 closed days, oldest → newest.
 * `filledFromEnd` fills the newest N days, which is what a merchant who just
 * started typing actually has.
 */
function strip(filledFromEnd: number, total = 27): SpendCoverageDay[] {
  return Array.from({ length: total }, (_, i) => ({
    dateKey: `2026-09-${String(i + 1).padStart(2, "0")}`,
    filled: i >= total - filledFromEnd,
  }));
}

function noticeFor(closedDays: SpendCoverageDay[]) {
  const missingDays = closedDays.filter((d) => !d.filled).length;
  return resolveSpendCoverageNotice({
    closedDays,
    impact: formatMissingDaysRoasImpact({
      missingDays,
      windowDays: closedDays.length,
      periodLabel: "the last 28 days",
    }),
  });
}

describe("resolveSpendCoverageNotice — F2 first typed day", () => {
  it("greets one typed closed day as progress, not a critical alarm", () => {
    const notice = noticeFor(strip(1));
    expect(notice.stage).toBe("first_days");
    expect(notice.tone).toBe("info");
    expect(notice.showBanner).toBe(true);
    expect(notice.heading).toMatch(/ledger started/i);
    expect(notice.heading).toContain("1 of 27");
    // The hostile heading is gone.
    expect(notice.heading).not.toMatch(/missing/i);
    expect(notice.heading).not.toMatch(/looks better than cash/i);
  });

  it("keeps the hole count exact and the inflation honest", () => {
    const notice = noticeFor(strip(1));
    expect(notice.missingDays).toBe(26);
    expect(notice.filledDays).toBe(1);
    expect(notice.closedDays).toBe(27);
    expect(notice.body).toContain("26 closed days");
    expect(notice.body).toMatch(/\$0 spend/);
    expect(notice.body).toMatch(/reads higher than cash/i);
  });

  it("teaches instead of punishing, and states the standing ask once", () => {
    const notice = noticeFor(strip(2));
    expect(notice.body).toMatch(/nothing is broken/i);
    expect(notice.body).toMatch(/more honest/i);
    expect(notice.note).toBe(SPEND_LEDGER_STANDING_ASK);
    expect(notice.note).toMatch(/sales arrive on their own/i);
    expect(notice.primary.target).toBe("type_day");
    expect(notice.primary.label).toMatch(/add the next day/i);
    expect(notice.secondary?.target).toBe("blanks");
  });

  it("stays in first_days for a young ledger, then hardens to steady", () => {
    for (let filled = 1; filled <= SPEND_LEDGER_FIRST_DAYS_MAX; filled++) {
      expect(noticeFor(strip(filled)).stage).toBe("first_days");
    }
    const older = noticeFor(strip(SPEND_LEDGER_FIRST_DAYS_MAX + 1));
    expect(older.stage).toBe("steady");
  });

  it("treats a backdated first day as a new ledger, not neglect", () => {
    // The only entry sits 27 days back — just as new as typing yesterday.
    const backdated = strip(0);
    backdated[0].filled = true;
    const notice = noticeFor(backdated);
    expect(notice.stage).toBe("first_days");
    expect(notice.tone).toBe("info");
    expect(notice.filledDays).toBe(1);
  });
});

describe("resolveSpendCoverageNotice — other stages", () => {
  it("never raises a critical tone on any stage", () => {
    for (let filled = 0; filled <= 27; filled++) {
      expect(noticeFor(strip(filled)).tone).not.toBe("critical");
    }
  });

  it("says a spend-today-only ledger has no closed day yet", () => {
    const notice = noticeFor(strip(0));
    expect(notice.stage).toBe("no_closed_day");
    expect(notice.tone).toBe("info");
    expect(notice.body).toMatch(/today can still move/i);
    expect(notice.primary.target).toBe("type_day");
    expect(notice.note).toBe(SPEND_LEDGER_STANDING_ASK);
    // Honest: it does not claim a multiple can run.
    expect(notice.statusLine).toMatch(/needs one closed day/i);
  });

  it("keeps the established-ledger copy authoritative, only warmer in tone", () => {
    const closedDays = strip(20);
    const impact = formatMissingDaysRoasImpact({
      missingDays: 7,
      windowDays: 27,
      periodLabel: "the last 28 days",
    });
    const notice = resolveSpendCoverageNotice({ closedDays, impact });
    expect(notice.stage).toBe("steady");
    expect(notice.tone).toBe("warning");
    expect(notice.heading).toBe(impact.heading);
    expect(notice.body).toBe(impact.body);
    expect(notice.primary.label).toBe(impact.nextLabel);
    expect(notice.note).toBeNull();
  });

  it("hides the banner and keeps the up-to-date line when coverage is whole", () => {
    const notice = noticeFor(strip(27));
    expect(notice.stage).toBe("complete");
    expect(notice.tone).toBe("success");
    expect(notice.showBanner).toBe(false);
    expect(notice.missingDays).toBe(0);
    expect(notice.statusLine).toMatch(/up to date through yesterday/i);
    expect(notice.primary.target).toBe("total_roas");
  });

  it("treats an empty strip as nothing to nag about", () => {
    const notice = noticeFor(strip(0, 0));
    expect(notice.stage).toBe("complete");
    expect(notice.showBanner).toBe(false);
  });

  it("keeps singular day wording clean", () => {
    const oneClosedDay = noticeFor(strip(0, 1));
    expect(oneClosedDay.stage).toBe("no_closed_day");
    const twoDayWindow = noticeFor(strip(1, 2));
    expect(twoDayWindow.heading).toContain("1 of 2 closed days");
    expect(twoDayWindow.body).toContain("1 day");
    expect(twoDayWindow.body).not.toContain("1 days");
  });
});

describe("coverage copy stays religion-safe", () => {
  it("never promises attribution, connectors, or a ROAS figure", () => {
    for (let filled = 0; filled <= 27; filled++) {
      const notice = noticeFor(strip(filled));
      const blob = [
        notice.heading,
        notice.body,
        notice.note ?? "",
        notice.statusLine,
        notice.primary.label,
        notice.secondary?.label ?? "",
      ].join("\n");
      expect(blob).not.toMatch(THEATER);
      // No invented multiple — only the formula.
      expect(blob).not.toMatch(/\d+(\.\d+)?×/);
    }
  });

  it("keeps the young-ledger greeting free of blame language", () => {
    const blob = [
      noticeFor(strip(1)),
      noticeFor(strip(0)),
    ]
      .flatMap((n) => [n.heading, n.body, n.note ?? "", n.statusLine])
      .join("\n");
    expect(blob).toMatch(/nothing is broken/i);
    expect(blob.replace(/nothing is broken/gi, "")).not.toMatch(PUNISHING);
  });
});

describe("app.spend.tsx wires the tone lib", () => {
  it("no longer renders a critical coverage banner", () => {
    expect(spendRoute).toContain("resolveSpendCoverageNotice");
    expect(spendRoute).toContain("coverageNotice.showBanner");
    expect(spendRoute).toMatch(/tone=\{coverageNotice\.tone\}/);
    expect(spendRoute).not.toMatch(
      /tone="critical" heading=\{coverageImpact\.heading\}/,
    );
  });

  it("keeps the coverage math and the enumerated missing dates", () => {
    // Coverage math is untouched: still live-only, still excludes today.
    expect(spendRoute).toContain("loadSpendDayCoverage(shop.id, false)");
    expect(spendRoute).toContain("formatMissingDaysRoasImpact");
    expect(spendRoute).toContain("missingDatesPreview");
    expect(spendRoute).toContain("missingDatesHref");
    expect(spendRoute).toMatch(/dayCoverage\.days\.filter\(\(d\) => d\.dateKey !== todayKey\)/);
  });

  it("keeps the SAMPLE import block and the ledger export gate intact", () => {
    expect(spendRoute).toContain("SAMPLE_DESK_IMPORT_BLOCK");
    expect(spendRoute).toContain("resolvePeriodLedgerControl");
    expect(spendRoute).toContain("periodLedger.blockedCopy");
  });
});
