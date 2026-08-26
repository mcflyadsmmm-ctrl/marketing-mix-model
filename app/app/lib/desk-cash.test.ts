import { describe, expect, it } from "vitest";
import {
  CASH_LEFT_LABEL,
  buildMixTable,
  canCallItProfit,
  goalVsLeftoverCash,
  goalVsLeftoverCopy,
} from "./desk-cash";

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

describe("cash left after ads is never called profit", () => {
  it("labels the figure as cash, not profit", () => {
    expect(CASH_LEFT_LABEL).toBe("Cash left after ads");
    expect(CASH_LEFT_LABEL.toLowerCase()).not.toContain("profit");
  });

  it("refuses the word profit until a real per-item cost basis exists", () => {
    expect(canCallItProfit({})).toBe(false);
    expect(canCallItProfit({ shopifyCostPerItem: false })).toBe(false);
    expect(canCallItProfit({ shopifyCostPerItem: true })).toBe(true);
  });
});

describe("goalVsLeftoverCash", () => {
  it("restates the Total ROAS goal as dollars of leftover cash", () => {
    const view = goalVsLeftoverCash({
      sales: 12000,
      spend: 3000,
      targetMer: 3,
    });
    expect(view.cashLeft).toBe(9000);
    // 3x on $3,000 spend is $9,000 sales, so $6,000 left after ads.
    expect(view.salesAtGoal).toBe(9000);
    expect(view.cashLeftAtGoal).toBe(6000);
    expect(view.gap).toBe(3000);
    expect(view.comparable).toBe(true);
    expect(goalVsLeftoverCopy(view, usd)).toMatch(/ahead of your 3.00× goal/);
  });

  it("reads behind when leftover cash is under the goal", () => {
    const view = goalVsLeftoverCash({
      sales: 5000,
      spend: 2000,
      targetMer: 4,
    });
    expect(view.cashLeft).toBe(3000);
    expect(view.cashLeftAtGoal).toBe(6000);
    expect(view.gap).toBe(-3000);
    expect(goalVsLeftoverCopy(view, usd)).toMatch(/behind your 4.00× goal/);
  });

  it("stays silent while sales are loading or with no spend", () => {
    const pending = goalVsLeftoverCash({
      sales: 0,
      spend: 2000,
      targetMer: 4,
      salesPending: true,
    });
    expect(pending.comparable).toBe(false);
    expect(pending.gap).toBeNull();

    const noSpend = goalVsLeftoverCash({ sales: 900, spend: 0, targetMer: 4 });
    expect(noSpend.comparable).toBe(false);
    expect(noSpend.cashLeft).toBe(900);
    expect(goalVsLeftoverCopy(noSpend, usd)).toMatch(/Set a Total ROAS goal/);
  });

  it("never turns a bad input into NaN", () => {
    const view = goalVsLeftoverCash({
      sales: Number.NaN,
      spend: Number.POSITIVE_INFINITY,
      targetMer: -2,
    });
    expect(view.cashLeft).toBe(0);
    expect(view.comparable).toBe(false);
    expect(JSON.stringify(view)).not.toMatch(/NaN|Infinity/);
  });
});

describe("buildMixTable", () => {
  it("reports budget share and the move vs last period", () => {
    const rows = buildMixTable({
      channels: [
        { channel: "Meta Ads", amount: 600 },
        { channel: "Billboard", amount: 400 },
      ],
      prior: [
        { channel: "Meta Ads", amount: 900 },
        { channel: "Billboard", amount: 100 },
      ],
    });
    expect(rows.map((r) => r.channel)).toEqual(["Meta Ads", "Billboard"]);
    expect(rows[0]?.share).toBeCloseTo(0.6, 5);
    expect(rows[1]?.share).toBeCloseTo(0.4, 5);
    // Billboard went from 10% of budget to 40%.
    expect(rows[1]?.deltaPp).toBeCloseTo(30, 2);
    expect(rows[0]?.deltaPp).toBeCloseTo(-30, 2);
  });

  it("shares never sum past 100% and negatives are dropped", () => {
    const rows = buildMixTable({
      channels: [
        { channel: "Meta Ads", amount: 500 },
        { channel: "Google Ads", amount: -80 },
        { channel: "Billboard", amount: Number.NaN },
        { channel: "Meta Ads", amount: 500 },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ channel: "Meta Ads", amount: 1000 });
    expect(rows.reduce((s, r) => s + r.share, 0)).toBeCloseTo(1, 6);
  });

  it("omits the delta entirely when there is no prior period", () => {
    const rows = buildMixTable({
      channels: [{ channel: "Billboard", amount: 250 }],
      prior: [],
    });
    expect(rows[0]?.deltaPp).toBeNull();
    expect(rows[0]?.share).toBe(1);
  });
});
