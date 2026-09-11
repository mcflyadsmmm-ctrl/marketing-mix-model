import { describe, expect, it } from "vitest";
import {
  TRIAL_TRUST_CLOCK_HEADING,
  TRIAL_TRUST_CLOCK_RULE,
  resolveTrialTrustClock,
} from "./trial-trust-clock";

const base = {
  periodTrusted: false,
  closedDaysWithSpend: 0,
  closedDaysInPeriod: 7,
  hasLiveSpend: false,
} as const;

describe("resolveTrialTrustClock", () => {
  it("hides on SAMPLE and listing capture", () => {
    expect(
      resolveTrialTrustClock({ ...base, useSampleDesk: true }).show,
    ).toBe(false);
    expect(resolveTrialTrustClock({ ...base, shotMode: true }).show).toBe(
      false,
    );
  });

  it("hides once the selected period is trusted", () => {
    const notice = resolveTrialTrustClock({
      ...base,
      periodTrusted: true,
      hasLiveSpend: true,
      closedDaysWithSpend: 7,
      closedDaysInPeriod: 7,
    });
    expect(notice.show).toBe(false);
  });

  it("teaches cold empty that trial access is not a trusted multiple", () => {
    const notice = resolveTrialTrustClock({ ...base });
    expect(notice.show).toBe(true);
    expect(notice.tone).toBe("info");
    expect(notice.heading).toBe(TRIAL_TRUST_CLOCK_HEADING);
    expect(notice.body).toMatch(/7-day trial is calendar access/i);
    expect(notice.body).toMatch(/closed days of entered spend/i);
    expect(notice.body).toContain(TRIAL_TRUST_CLOCK_RULE);
    expect(notice.body).toMatch(/Shopify Total Sales ÷ ad spend/);
  });

  it("names filled vs missing closed days when spend has started", () => {
    const notice = resolveTrialTrustClock({
      ...base,
      hasLiveSpend: true,
      closedDaysWithSpend: 2,
      closedDaysInPeriod: 7,
    });
    expect(notice.show).toBe(true);
    expect(notice.body).toContain("2 of 7 closed days");
    expect(notice.body).toContain("5 still missing");
    expect(notice.body).toMatch(/not a signal that Total ROAS is trusted/i);
  });

  it("handles a period with no closed day yet", () => {
    const notice = resolveTrialTrustClock({
      ...base,
      hasLiveSpend: true,
      closedDaysWithSpend: 0,
      closedDaysInPeriod: 0,
    });
    expect(notice.body).toMatch(/no fully closed day yet/i);
  });

  it("never claims auto-sync or invents a × multiple", () => {
    const notice = resolveTrialTrustClock({
      ...base,
      hasLiveSpend: true,
      closedDaysWithSpend: 1,
      closedDaysInPeriod: 28,
    });
    expect(notice.body).not.toMatch(/auto-?sync|oauth|pixel|connect Meta/i);
    expect(notice.body).not.toMatch(/\d+(\.\d+)?\s*×/);
    expect(notice.body).not.toMatch(/3\.00/);
  });

  it("hides once the scoreboard is ready (period note owns coverage)", () => {
    expect(
      resolveTrialTrustClock({ ...base, scoreboardReady: true }).show,
    ).toBe(false);
  });

  it("hides after the 7-day trial window even with spend gaps", () => {
    const installedAt = new Date("2026-07-01T12:00:00.000Z");
    const now = new Date("2026-09-01T12:00:00.000Z");
    expect(
      resolveTrialTrustClock({
        ...base,
        hasLiveSpend: true,
        closedDaysWithSpend: 2,
        closedDaysInPeriod: 7,
        installedAt,
        now,
      }).show,
    ).toBe(false);
  });

  it("still teaches inside the trial week on a cold desk", () => {
    const installedAt = new Date("2026-09-08T12:00:00.000Z");
    const now = new Date("2026-09-10T12:00:00.000Z");
    expect(
      resolveTrialTrustClock({
        ...base,
        installedAt,
        now,
      }).show,
    ).toBe(true);
  });
});
