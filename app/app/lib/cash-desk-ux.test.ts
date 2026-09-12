import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  TRIAL_TRUST_CLOCK_HEADING,
  TRIAL_TRUST_CLOCK_RULE,
  resolveTrialTrustClock,
} from "./trial-trust-clock";

const here = dirname(fileURLToPath(import.meta.url));
const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");
const spend = readFileSync(join(here, "../routes/app.spend.tsx"), "utf8");
const ltv = readFileSync(join(here, "../routes/app.ltv.tsx"), "utf8");
const goals = readFileSync(join(here, "../routes/app.goals.tsx"), "utf8");
const allocation = readFileSync(join(here, "../routes/app.allocation.tsx"), "utf8");
const advanced = readFileSync(join(here, "../routes/app.advanced.tsx"), "utf8");
const sampleBanner = readFileSync(
  join(here, "../components/SampleDeskBanner.tsx"),
  "utf8",
);
const dataMode = readFileSync(join(here, "../components/DataModeBar.tsx"), "utf8");
const settings = readFileSync(join(here, "../routes/app.settings.tsx"), "utf8");
const gauge = readFileSync(
  join(here, "../components/TotalRoasGauge.tsx"),
  "utf8",
);
const explorer = readFileSync(
  join(here, "../components/SpendExplorer.tsx"),
  "utf8",
);
const merDashboard = readFileSync(join(here, "./mer-dashboard.server.ts"), "utf8");
const schema = readFileSync(join(here, "../../prisma/schema.prisma"), "utf8");

describe("Overview desk (fresh start)", () => {
  it("keeps a clear hero surface and does not fossil-lock CashVerdict", () => {
    // Fresh start: do not require CashVerdict / till jargon — hero numbers win.
    expect(overview).not.toContain("mcfly-explorer-csv-bar");
    expect(overview).toMatch(/mcfly-hero-compact|TotalRoasGauge|totalRoas/i);
    const client = overview.split("export default function Dashboard")[1] ?? "";
    expect(client.length).toBeGreaterThan(100);
  });

  it("one-taps SAMPLE → Real via Form POST use-real (Love-1b)", () => {
    const client = overview.split("export default function Dashboard")[1] ?? "";
    expect(client).toMatch(
      /primaryAction\.postIntent === "use-real"[\s\S]{0,200}<Form method="post"/,
    );
    expect(client).toMatch(
      /name="intent"\s+value="use-real"/,
    );
    expect(client).toMatch(/type="submit"/);
    // Navigate-only SAMPLE primary would reintroduce two-tap.
    expect(client).not.toMatch(
      /postIntent === "use-real"[\s\S]{0,80}href=\{primaryAction\.href\}/,
    );
  });

  it("does not mount trial-trust sermon chrome on Overview (fresh start)", () => {
    expect(overview).not.toContain("trialTrustClock");
    expect(overview).not.toContain("resolveTrialTrustClock");
    // Helper may still exist for billing/settings — Overview must not lecture with it.
    const cold = resolveTrialTrustClock({
      periodTrusted: false,
      closedDaysWithSpend: 0,
      closedDaysInPeriod: 7,
      hasLiveSpend: false,
    });
    expect(cold.heading).toBe(TRIAL_TRUST_CLOCK_HEADING);
    expect(cold.body).toContain(TRIAL_TRUST_CLOCK_RULE);
  });

  it("keeps the ROAS formula in the gauge — not a religion strip above the hero", () => {
    expect(overview).not.toContain("OVERVIEW_TOTAL_ROAS_DEFINITION");
    expect(overview).toMatch(/TotalRoasGauge|mcfly-hero-compact/);
  });

  it("shows acquisition/LTV snaps after live spend; explorer stays later", () => {
    expect(overview).toContain("mcfly-me-spine--later");
    // Depth under the hero — do not fossil-lock showTill / CashVerdict names.
    expect(overview).toMatch(/AcquisitionGlance|LtvSnapSection/);
    expect(overview).toMatch(/LtvSnapSection|tillLtv|ltv/i);
  });

  it("Love-UX1: Overview cold empty owns dismissible Setup Guide (not DataModeBar)", () => {
    expect(overview).toContain("FirstSessionGuide");
    // Guide only when there are no sales yet — sales depth must not wait on spend.
    expect(overview).toMatch(
      /coldEmpty && !salesDeskReady && !shotMode \? \(\s*<FirstSessionGuide path=\{firstSession\}/,
    );
    expect(overview).toMatch(/hasReadAllOrders/);
    expect(overview).toMatch(/shopDomain/);
    const guide = readFileSync(
      join(here, "../components/FirstSessionGuide.tsx"),
      "utf8",
    );
    expect(guide).toContain("Setup Guide");
    expect(guide).toContain("SETUP_GUIDE_DISMISS_KEY");
    expect(guide).toContain("Dismiss Setup Guide");
    expect(guide).toContain("guideProgressLabel");
    expect(guide).toContain("s-checkbox");
    // Elevated off chrome — Sample|Real bar keeps margin nudge only.
    expect(dataMode).not.toMatch(/from ["'].*FirstSessionGuide/);
    expect(dataMode).not.toMatch(/<FirstSessionGuide/);
    expect(dataMode).not.toContain("showFullGuide");
    expect(dataMode).toContain("showMarginNudge");
  });

  it("API-first: day board and customer snaps paint without live spend", () => {
    expect(overview).toContain("DayQualityTablePanel");
    expect(overview).toContain("summarizeDayQuality");
    expect(overview).toMatch(/salesDeskReady && !shotMode/);
    expect(overview).toContain("showRoasHero");
    expect(overview).toMatch(/Add spend later|Want Total ROAS next/);
  });

  it("Love-V2: hero keeps one primary — customer insights when sales exist", () => {
    const actions =
      overview.match(
        /mcfly-hero-compact__actions">([\s\S]*?)<\/div>/,
      )?.[1] ?? "";
    expect(actions.length).toBeGreaterThan(40);
    const primaries = actions.match(/variant="primary"/g) ?? [];
    expect(primaries).toHaveLength(1);
    // Fresh mission: customer insights lead via heroPrimary; Update spend secondary.
    expect(overview).toContain("openCustomerInsights");
    expect(actions).toContain("heroPrimary");
    expect(actions).toMatch(/Update spend/);
    // Goals lives in More tools — not a second hero CTA (Shopify Analytics calm).
    expect(actions).not.toMatch(/href="\/app\/goals"/);
    expect(actions).toContain("ShareOverviewButton");
    expect(actions).toMatch(/variant="tertiary"/);
    const shareBtn = readFileSync(
      join(here, "../components/ShareOverviewButton.tsx"),
      "utf8",
    );
    expect(shareBtn).toMatch(/variant="tertiary"/);
    expect(shareBtn).not.toMatch(/variant="primary"/);
  });
});

describe("Spend ritual", () => {
  it("keeps paste + template + playbook visible on a blank desk", () => {
    expect(spend).toContain("formatMissingDaysRoasImpact");
    expect(spend).toContain("CASH_PAGE_WHY.spend");
    expect(spend).toContain("spendEmptyTeach");
    expect(spend).toContain("isActivationQuery");
    expect(spend).toMatch(/Paste spend CSV|pastePlaceholder|Paste one row/i);
    expect(spend).toMatch(/platform playbook|mcfly-spend-lean__playbook/i);
    expect(spend).toMatch(/SAMPLE_DESK_IMPORT_BLOCK|Turn Real store on/i);
  });

  it("leads with a typed day so first spend needs no file", () => {
    expect(spend).toContain('id="mcfly-spend-day"');
    expect(spend).toContain("parseQuickSpendDay");
    expect(spend).toContain("quickSpendSavedCopy");
  });
});

describe("Later pages have a cash why + soft gate", () => {
  it("wires DeskPageWhy and FirstTrustedRoasGate where spend depth still needs a soft gate", () => {
    expect(goals).toContain("DeskPageWhy");
    expect(goals).toContain('page="goals"');
    expect(goals).toContain("FirstTrustedRoasGate");
    expect(ltv).toContain("ltvEmptyCashCopy");
    expect(ltv).toContain("openCohorts");
    expect(ltv).not.toContain("DeskPageWhy");
    expect(allocation).toContain('page="allocation"');
    expect(advanced).toContain('page="advanced"');
    expect(advanced).toContain("FirstTrustedRoasGate");
  });
});

describe("Optional target Total ROAS", () => {
  it("keeps targetMer non-null and gates it behind a confirmation stamp", () => {
    expect(schema).toMatch(/targetMer\s+Float\s+@default\(3\.0\)/);
    expect(schema).toMatch(/targetMerConfirmedAt\s+DateTime\?/);
    expect(schema).not.toMatch(/targetMer\s+Float\?/);
    expect(merDashboard).toContain("targetMerConfirmed");
    expect(merDashboard).toMatch(
      /targetMerConfirmed\s*=\s*useSampleDesk\s*\?\s*true\s*:\s*settings\.targetMerConfirmedAt != null/,
    );
  });

  it("Settings target is optional, controlled, and clears without touching margin", () => {
    expect(settings).toContain("parseTargetMerInput");
    expect(settings).toContain("targetMerFieldValue");
    expect(settings).toContain("Target optional · margin optional");
    expect(settings).not.toContain("Target required · margin optional");
    expect(settings).toMatch(/name="targetMer"[\s\S]{0,320}value=\{targetInput\}/);
    expect(settings).not.toMatch(/name="targetMer"[\s\S]{0,240}required/);
    expect(settings).not.toMatch(/name="targetMer"[\s\S]{0,240}defaultValue/);
    expect(settings).toMatch(
      /Leave blank to show actual\s+only\./,
    );
    // Clear drops only the confirmation; the numeric rail and margin survive.
    expect(settings).toMatch(
      /updateData\.targetMerConfirmedAt = null;/,
    );
    expect(settings).toMatch(
      /operation === "set"[\s\S]{0,160}updateData\.targetMer = target\.targetMer;/,
    );
    // Reset restores both loader values.
    expect(settings).toMatch(
      /handleDiscard[\s\S]{0,320}setTargetInput\(targetFieldValue\)/,
    );
    // Success copy keeps target and break-even as separate numbers.
    expect(settings).toContain("TARGET_MER_CLEARED_COPY");
    expect(settings).toContain("targetMerSavedCopy");
    expect(settings).toMatch(/the floor, not your target/);
  });

  it("Goals writes the same confirmed target as Settings", () => {
    expect(goals).toContain('from "../lib/target-mer"');
    expect(goals).toMatch(
      /data: \{ targetMer, targetMerConfirmedAt: new Date\(\) \}/,
    );
  });

  it("Goals never draws unconfirmed default 3.00× (Love-Goals3)", () => {
    expect(goals).toContain("confirmedTargetMer");
    expect(goals).toContain("SAMPLE_DESK_TARGET_MER");
    expect(goals).toMatch(
      /targetMer\s*=\s*useSampleDesk\s*\?\s*SAMPLE_DESK_TARGET_MER\s*:\s*confirmedTargetMer\(settings\)/,
    );
    expect(goals).not.toMatch(/targetMer:\s*settings\.targetMer/);
    expect(goals).not.toMatch(
      /buildYearBoard\(\s*[\s\S]*?settings\.targetMer/,
    );
    // Chrome only when a confirmed (or SAMPLE) target exists.
    expect(goals).toMatch(
      /!shotMode && targetMer != null \?[\s\S]{0,280}formatMer\(targetMer\)/,
    );
  });

  it("Overview passes only a confirmed target plus period trust into the gauge", () => {
    const client = overview.split("export default function Dashboard")[1] ?? "";
    expect(client).toMatch(
      /<TotalRoasGauge[\s\S]{0,240}targetMer=\{\s*metrics\.targetMerConfirmed \? metrics\.targetMer : null\s*\}/,
    );
    expect(client).toMatch(
      /<TotalRoasGauge[\s\S]{0,320}periodTrusted=\{periodTrust\.trusted\}/,
    );
  });

  it("Overview passes only a confirmed target into the explorer series", () => {
    expect(overview).toMatch(
      /targetMer: metrics\.targetMerConfirmed \? explorerSeries\.targetMer : null,/,
    );
  });

  it("explorer draws no target rail and no vs-target tone without a goal", () => {
    expect(explorer).toMatch(/targetMer: number \| null/);
    // Rail is gated on a real confirmed number, not the 3.0 default.
    expect(explorer).toMatch(
      /targetMer != null && targetMer > 0 && merCeil > 0 \?/,
    );
    expect(explorer).not.toMatch(/\{targetMer > 0 && merCeil > 0 \?/);
    // merToneBand already returns "flat" for a null rail — keep it wired to the
    // same nullable target so unconfirmed days never render red.
    expect(explorer).toContain("merToneBand(b.mer, targetMer)");
  });

  it("gauge stays neutral without a configured or trusted target", () => {
    expect(gauge).toContain("resolveTargetMerComparison");
    expect(gauge).toMatch(/targetMer: number \| null/);
    expect(gauge).toMatch(/periodTrusted: boolean/);
    // Direction color requires an allowed verdict — never a hidden default.
    expect(gauge).toMatch(
      /tone = !comparison\.verdictAllowed[\s\S]{0,120}"flat"/,
    );
    // Target tick and arc label only render when a target exists.
    expect(gauge).toMatch(/target != null \?[\s\S]{0,200}mcfly-roas-gauge__target-num/);
    expect(gauge).toContain("comparison.closedDayNote");
    expect(gauge).toContain("comparison.accessibleName");
    // Settings link must stay keyboard reachable outside the role="img" dial.
    expect(gauge).toContain('<s-link href="/app/settings">');
    expect(gauge).toMatch(/mcfly-roas-gauge__main"\s*\n\s*role="img"/);
  });

  it("closed-day honesty copy is one line beside the rail, not a new banner", () => {
    expect(gauge).not.toContain("s-banner");
    const targetMer = readFileSync(join(here, "./target-mer.ts"), "utf8");
    expect(targetMer).toContain(
      "Closed-day sales and spend are complete. Today can still move.",
    );
    expect(targetMer).toContain(
      "Target call paused — closed-day sales or spend is incomplete.",
    );
    expect(targetMer).toContain(
      "Closed days are the trust check. Today can still move.",
    );
    // Trust is an input from resolvePeriodTrust — target-mer never re-derives it.
    expect(targetMer).toMatch(/periodTrusted: boolean/);
    expect(targetMer).not.toContain("period-trust");
    expect(targetMer).not.toMatch(/spendCoverage|salesFactsIncomplete/);
    expect(overview).toContain("resolvePeriodTrust");
  });
});

describe("SAMPLE money stamp", () => {
  it("renders a live stamp — not a no-op — and DataModeBar says not live money", () => {
    expect(sampleBanner).toContain("SAMPLE_MONEY_MARK");
    expect(sampleBanner).not.toMatch(/return null/);
    expect(dataMode).toMatch(/not your live Shopify money/i);
  });

  it("keeps live desk quiet — no Sample | Real dual toggle", () => {
    expect(dataMode).not.toMatch(/>\s*Sample\s*</);
    expect(dataMode).not.toContain('value="use-sample"');
    expect(dataMode).toContain('value="use-real"');
    expect(dataMode).toContain("return null");
    expect(dataMode).toMatch(/no Sample \| Real dual chrome/i);
  });
});
