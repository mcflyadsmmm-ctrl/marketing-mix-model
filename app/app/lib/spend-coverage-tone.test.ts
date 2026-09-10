import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MISSING_DAYS_CASH_LINE,
  formatMissingDaysRoasImpact,
} from "./cash-desk-copy";
import {
  SPEND_LEDGER_FIRST_DAYS_MAX,
  SPEND_LEDGER_STANDING_ASK,
  SPEND_TYPED_CATCHUP_MAX,
  resolveSpendCoverageNotice,
  type SpendCoverageDay,
  type SpendCoverageSurface,
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

function noticeFor(
  closedDays: SpendCoverageDay[],
  surface: SpendCoverageSurface = "spend_desk",
) {
  const missingDays = closedDays.filter((d) => !d.filled).length;
  return resolveSpendCoverageNotice({
    closedDays,
    surface,
    impact: formatMissingDaysRoasImpact({
      missingDays,
      windowDays: closedDays.length,
      periodLabel: "the last 28 days",
    }),
  });
}

describe("resolveSpendCoverageNotice — F2 first typed day", () => {
  it("celebrates one typed closed day instead of alarming about 26", () => {
    const notice = noticeFor(strip(1));
    expect(notice.stage).toBe("first_day");
    expect(notice.tone).toBe("success");
    expect(notice.showBanner).toBe(true);
    expect(notice.heading).toMatch(/first spend day is on the desk/i);
    // The hostile heading is gone.
    expect(notice.heading).not.toMatch(/missing/i);
    expect(notice.heading).not.toMatch(/looks better than cash/i);
    expect(notice.statusLine).toContain("1 of 27");
  });

  it("keeps the hole count exact and the inflation honest", () => {
    const notice = noticeFor(strip(1));
    expect(notice.missingDays).toBe(26);
    expect(notice.filledDays).toBe(1);
    expect(notice.closedDays).toBe(27);
    expect(notice.body).toContain("26 closed days");
    expect(notice.body).toMatch(/\$0 spend/);
    expect(notice.body).toContain(MISSING_DAYS_CASH_LINE);
  });

  it("teaches instead of punishing, and states the standing ask once", () => {
    const notice = noticeFor(strip(2));
    expect(notice.body).toMatch(/nothing is broken/i);
    expect(notice.body).toMatch(/toward cash/i);
    expect(notice.note).toBe(SPEND_LEDGER_STANDING_ASK);
    expect(notice.note).toMatch(/sales arrive on their own/i);
    expect(notice.primary.target).toBe("type_day");
    expect(notice.primary.label).toMatch(/type the next day/i);
    expect(notice.secondary?.target).toBe("blanks");
  });

  it("treats a backdated first day as a new ledger, not neglect", () => {
    // The only entry sits 27 days back — just as new as typing yesterday.
    const backdated = strip(0);
    backdated[0].filled = true;
    const notice = noticeFor(backdated);
    expect(notice.stage).toBe("first_day");
    expect(notice.tone).toBe("success");
    expect(notice.filledDays).toBe(1);
  });
});

describe("resolveSpendCoverageNotice — tone thresholds", () => {
  it("ramps tone by filled closed days, never past warning", () => {
    const table = [
      { filled: 0, stage: "no_closed_day", tone: "info" },
      { filled: 1, stage: "first_day", tone: "success" },
      { filled: 2, stage: "first_days", tone: "info" },
      { filled: SPEND_LEDGER_FIRST_DAYS_MAX, stage: "first_days", tone: "info" },
      {
        filled: SPEND_LEDGER_FIRST_DAYS_MAX + 1,
        stage: "steady",
        tone: "warning",
      },
      { filled: 27, stage: "complete", tone: "success" },
    ] as const;
    for (const row of table) {
      const notice = noticeFor(strip(row.filled));
      expect(notice.stage, `filled=${row.filled}`).toBe(row.stage);
      expect(notice.tone, `filled=${row.filled}`).toBe(row.tone);
    }
  });

  it("never raises a critical tone on any fill level or surface", () => {
    for (const surface of ["spend_desk", "overview"] as const) {
      for (let filled = 0; filled <= 27; filled++) {
        expect(noticeFor(strip(filled), surface).tone).not.toBe("critical");
      }
    }
  });

  it("keeps Overview at info on a first day — green there would bless a multiple", () => {
    const overview = noticeFor(strip(1), "overview");
    expect(overview.stage).toBe("first_day");
    expect(overview.tone).toBe("info");
    // Same words, same counts — only the colour differs by surface.
    expect(overview.heading).toBe(noticeFor(strip(1)).heading);
    expect(overview.body).toBe(noticeFor(strip(1)).body);
  });

  it("banners every incomplete stage and stays silent when covered", () => {
    for (let filled = 0; filled < 27; filled++) {
      expect(noticeFor(strip(filled)).showBanner, `filled=${filled}`).toBe(true);
    }
    expect(noticeFor(strip(27)).showBanner).toBe(false);
  });
});

describe("resolveSpendCoverageNotice — the typed row stays the primary path", () => {
  it("points a young ledger at the typed row, blanks second", () => {
    for (let filled = 0; filled <= SPEND_LEDGER_FIRST_DAYS_MAX; filled++) {
      const notice = noticeFor(strip(filled));
      expect(notice.primary.target, `filled=${filled}`).toBe("type_day");
      expect(notice.secondary?.target, `filled=${filled}`).toBe("blanks");
    }
  });

  it("keeps typing primary when only a few holes are left", () => {
    const notice = noticeFor(strip(27 - SPEND_TYPED_CATCHUP_MAX));
    expect(notice.stage).toBe("steady");
    expect(notice.missingDays).toBe(SPEND_TYPED_CATCHUP_MAX);
    expect(notice.primary.target).toBe("type_day");
    expect(notice.primary.label).toMatch(/type the missing days/i);
    expect(notice.secondary?.target).toBe("blanks");
  });

  it("hands a real backfill to blanks, with the typed row still offered", () => {
    const notice = noticeFor(strip(20));
    expect(notice.missingDays).toBe(7);
    expect(notice.primary.target).toBe("blanks");
    expect(notice.secondary?.target).toBe("type_day");
  });

  it("offers a typed or blanks path on every incomplete stage", () => {
    for (let filled = 0; filled < 27; filled++) {
      const targets = [
        noticeFor(strip(filled)).primary.target,
        noticeFor(strip(filled)).secondary?.target,
      ];
      expect(targets, `filled=${filled}`).toContain("type_day");
      expect(targets, `filled=${filled}`).toContain("blanks");
    }
  });
});

describe("resolveSpendCoverageNotice — full-strip audit is opted into", () => {
  it("hides the hole list behind a summary while the ledger is young", () => {
    for (let filled = 0; filled <= SPEND_LEDGER_FIRST_DAYS_MAX; filled++) {
      const notice = noticeFor(strip(filled));
      expect(notice.missingDatesDisclosure, `filled=${filled}`).toBe(
        "on_request",
      );
      expect(notice.missingDatesLabel).toBe(
        `See the ${notice.missingDays} empty days`,
      );
    }
  });

  it("enumerates holes inline on an established ledger", () => {
    const notice = noticeFor(strip(20));
    expect(notice.missingDatesDisclosure).toBe("inline");
    expect(notice.missingDatesLabel).toBe("See the 7 empty days");
  });

  it("has nothing to list once coverage is whole", () => {
    expect(noticeFor(strip(27)).missingDatesLabel).toBeNull();
  });
});

describe("resolveSpendCoverageNotice — other stages", () => {
  it("says a spend-today-only ledger has no closed day yet", () => {
    const notice = noticeFor(strip(0));
    expect(notice.stage).toBe("no_closed_day");
    expect(notice.tone).toBe("info");
    expect(notice.body).toMatch(/today can still move/i);
    expect(notice.primary.target).toBe("type_day");
    expect(notice.note).toBe(SPEND_LEDGER_STANDING_ASK);
    // Honest: it does not claim a multiple can run, so it cannot flatter one.
    expect(notice.statusLine).toMatch(/needs one closed day/i);
    expect(notice.body).not.toContain(MISSING_DAYS_CASH_LINE);
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
    expect(twoDayWindow.statusLine).toContain("1 of 2 closed days");
    expect(twoDayWindow.body).toContain("1 closed day still counts");
    expect(twoDayWindow.body).not.toContain("1 closed days");
    expect(twoDayWindow.missingDatesLabel).toBe("See the empty day");
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
        notice.missingDatesLabel ?? "",
        notice.primary.label,
        notice.secondary?.label ?? "",
      ].join("\n");
      expect(blob).not.toMatch(THEATER);
      // No invented multiple — only the formula.
      expect(blob).not.toMatch(/\d+(\.\d+)?×/);
    }
  });

  it("says holes in cash, never in plumbing", () => {
    for (let filled = 1; filled < 27; filled++) {
      const notice = noticeFor(strip(filled));
      expect(notice.body, `filled=${filled}`).toMatch(
        /better than cash|above the till/i,
      );
      expect(notice.body).not.toMatch(/sync|broken sync|not working/i);
    }
  });

  it("keeps the young-ledger greeting free of blame language", () => {
    const blob = [
      noticeFor(strip(1)),
      noticeFor(strip(2)),
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
    expect(spendRoute).toMatch(/surface: "spend_desk"/);
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

  it("gates the hole list on the notice's disclosure instead of always listing", () => {
    expect(spendRoute).toContain("showMissingDatesInline");
    expect(spendRoute).toContain("showMissingDatesAudit");
    expect(spendRoute).toContain("coverageNotice.missingDatesLabel");
    expect(spendRoute).toMatch(/missingDatesDisclosure === "inline"/);
    expect(spendRoute).toMatch(/missingDatesDisclosure === "on_request"/);
  });

  it("keeps the SAMPLE import block and the ledger export gate intact", () => {
    expect(spendRoute).toContain("SAMPLE_DESK_IMPORT_BLOCK");
    expect(spendRoute).toContain("resolvePeriodLedgerControl");
    expect(spendRoute).toContain("periodLedger.blockedCopy");
  });
});
