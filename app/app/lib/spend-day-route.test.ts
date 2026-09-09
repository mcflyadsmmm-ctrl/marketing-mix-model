import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const spend = readFileSync(join(here, "../routes/app.spend.tsx"), "utf8");
const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");

/** The typed-row section only — CSV lives in its own form further down. */
const typedForm = (() => {
  const start = spend.indexOf('id="mcfly-spend-day"');
  const end = spend.indexOf("</section>", start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return spend.slice(start, end);
})();

describe("typed one-day spend form", () => {
  it("posts date + amount + channel with no file input", () => {
    expect(typedForm).toContain('name="intent" value="spend-day"');
    expect(typedForm).toContain('name="date"');
    expect(typedForm).toContain('name="amount"');
    expect(typedForm).toContain('name="channel"');
    expect(typedForm).toContain('type="date"');
    expect(typedForm).not.toContain('type="file"');
    expect(typedForm).not.toContain("encType");
    expect(typedForm).not.toMatch(/download|template/i);
  });

  it("caps the Day picker at the store calendar's today", () => {
    expect(typedForm).toContain("max={storeTodayKey}");
    expect(spend).toContain("storeTodayKey: shopTodayKey(shop.ianaTimezone)");
  });

  it("names a custom channel before it can be saved as Other", () => {
    expect(typedForm).toContain('dayChannel === "other"');
    expect(typedForm).toContain('name="customName"');
  });

  it("sits above the CSV block so it lands in the first viewport", () => {
    expect(spend.indexOf('id="mcfly-spend-day"')).toBeLessThan(
      spend.indexOf('id="mcfly-spend-uploads"'),
    );
  });

  it("offers typing before downloading on an empty desk", () => {
    expect(spend).toContain("{emptyTeach.primaryHref}");
    expect(spend).toContain("{emptyTeach.secondaryHref}");
    // No page-level action competes with Save this day, and no download is asked for.
    expect(spend).not.toContain('aria-label="Download blank template"');
    expect(spend).not.toMatch(/slot="primary-action"[\s\S]{0,200}template/);
  });

  it("keeps hash targets on s-link, matching the rest of the desk", () => {
    for (const match of spend.matchAll(/<s-button[\s\S]{0,220}?>/g)) {
      expect(match[0]).not.toMatch(/href="#/);
    }
  });
});

describe("typed one-day spend action", () => {
  it("validates through the pure parser instead of inline guesses", () => {
    expect(spend).toContain("parseQuickSpendDay");
    expect(spend).toContain("salesFloorKey: salesDayFactWindowStartUtc()");
    expect(spend).toContain("dayField: parsed.field");
  });

  it("writes exactly one UTC day on the CSV upsert key — replace, never double", () => {
    expect(spend).toContain("utcMidnightFromDayKey(day.dateKey)");
    expect(spend).toContain("24 * 60 * 60 * 1000 - 1");
    expect(spend).toContain("shopId_channel_periodStart: key");
    expect(spend).toMatch(/source: "manual"/);
  });

  it("fails closed while SAMPLE preview is on", () => {
    const block = spend.slice(
      spend.indexOf("Sample desk ON →"),
      spend.indexOf("SAMPLE_DESK_IMPORT_BLOCK, success: false"),
    );
    expect(block).toContain('intent === "spend-day"');
    expect(block).toContain('intent === "csv"');
    expect(block).toContain('intent === "csv-combine"');
    expect(block).toContain('intent === "bill-daily"');
    // Sample gate must be evaluated before the typed handler is reached.
    expect(spend.indexOf("SAMPLE_DESK_IMPORT_BLOCK, success: false")).toBeLessThan(
      spend.indexOf("return handleQuickDay("),
    );
    expect(typedForm).toContain("disabled={importBlockedBySample}");
    expect(typedForm).toContain("QUICK_SPEND_COPY.submitBlockedLabel");
  });
});

describe("first-spend hand-off to Total ROAS", () => {
  it("uses the honest saved copy for the banner and the page action", () => {
    expect(spend).toContain("quickSpendSavedCopy");
    expect(spend).toContain("daySavedCopy.primaryHref");
    expect(spend).toContain("daySavedCopy.primaryLabel");
    expect(spend).toContain("missingDays: holeCount");
  });

  it("never paints a ROAS multiple on the Spend page itself", () => {
    const banner = spend.slice(
      spend.indexOf("{daySavedCopy ? ("),
      spend.indexOf("Coverage nag is already inside"),
    );
    expect(banner).toContain("daySavedCopy.body");
    expect(banner).toContain("daySavedCopy.note");
    expect(banner).not.toMatch(/formatMer|metrics\.mer|toFixed/);
  });

  it("shows the coverage nag once — inside the saved note, not twice", () => {
    expect(spend).toContain("!daySavedCopy && coverageNotice.showBanner");
    // showBanner is false at full coverage, so a covered desk still gets no nag.
    expect(spend).toContain("resolveSpendCoverageNotice");
  });

  it("keeps typed-row errors out of the CSV banner", () => {
    expect(spend).toContain("!actionData.dayField");
    expect(spend).toContain('className="mcfly-spend-day__error"');
  });

  it("clears the amount after a save but echoes a rejected row back", () => {
    expect(spend).toContain("dayForm: { date, amount }");
    expect(spend).toContain("actionData?.dayForm?.date || suggestedDayDate");
    expect(spend).toContain('actionData?.dayForm?.amount ?? ""');
    expect(typedForm).toContain("key={dayFormKey}");
    expect(typedForm).toContain("defaultValue={dayDateDefault}");
    expect(typedForm).toContain("defaultValue={dayAmountDefault}");
    expect(spend).toContain('daySaved?.savedAt ?? (actionData?.dayField ? "retry" : "new")');
  });

  it("pre-fills the newest unfilled closed day so only the amount is left", () => {
    expect(spend).toContain("quickSpendDefaultDate");
    expect(spend).toContain("todayKey: storeTodayKey");
    expect(spend).toContain("missingDatesKey.split(\",\")");
  });
});

describe("Wave 4 guarantees still hold", () => {
  it("keeps the spend-first first-session bounce on Overview", () => {
    expect(overview).toContain("firstOpenRedirect");
    expect(overview).toContain("resolveFirstSessionPath");
    expect(spend).toContain("isActivationQuery");
  });

  it("keeps ReviewAsk fail-closed and off the Spend page", () => {
    expect(overview).toContain("decideReviewAsk");
    expect(overview).toContain("<ReviewAsk eligible={reviewAskEligible} />");
    expect(overview).toContain("installedAt: shop.createdAt");
    expect(overview).toContain("scoreboardReady:");
    expect(spend).not.toContain("ReviewAsk");
  });

  it("keeps paste / CSV / template available for backfill", () => {
    expect(spend).toContain('id="mcfly-spend-uploads"');
    expect(spend).toContain('id="mcfly-spend-paste"');
    expect(spend).toContain("selectedBlankTemplateHref");
    expect(spend).toContain("QUICK_SPEND_COPY.backfillLinkLabel");
  });
});
