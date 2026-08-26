import { describe, expect, it } from "vitest";
import { channelMix, sumSpend } from "@mcfly/mer-engine";
import { channelSpendFromEntries } from "./mer-dashboard.server";
import { spendChannelLabel } from "./spend-channel-label";

const DAY = (ymd: string) => new Date(`${ymd}T00:00:00.000Z`);

function entry(
  channel: string,
  amount: number,
  extra: { customKey?: string | null; note?: string | null } = {},
) {
  return {
    channel,
    amount,
    periodStart: DAY("2026-08-01"),
    periodEnd: DAY("2026-08-01"),
    customKey: extra.customKey ?? null,
    note: extra.note ?? null,
  };
}

/**
 * The spend mix is what the merchant reads to decide where money goes. Two
 * invariants matter more than any label: every dollar entered is still in the
 * total, and nothing is silently renamed.
 */
describe("spend mix conserves every dollar the merchant entered", () => {
  it("totals the same before and after bucketing", () => {
    const entries = [
      entry("meta", 250),
      entry("google", 125.5),
      entry("other", 400, { customKey: "billboards", note: "Billboard" }),
      entry("other", 90),
      entry("other", 10.25, { customKey: "radio", note: "Radio" }),
    ];
    const raw = entries.reduce((s, e) => s + e.amount, 0);
    expect(sumSpend(channelSpendFromEntries(entries))).toBeCloseTo(raw, 2);
    expect(raw).toBeCloseTo(875.75, 2);
  });

  it("never drops unattributed other spend", () => {
    const slices = channelSpendFromEntries([
      entry("other", 90),
      entry("other", 400, { customKey: "billboards", note: "Billboard" }),
    ]);
    const unlabeled = slices.find(
      (s) => s.channel === "other" && !s.customLabel,
    );
    expect(unlabeled?.amount).toBe(90);
    expect(spendChannelLabel({ channel: "other" })).toBe("Other");
    expect(sumSpend(slices)).toBe(490);
  });

  it("gives each named extra its own slice under the merchant's name", () => {
    const named = channelSpendFromEntries([
      entry("other", 400, { customKey: "billboards", note: "Billboard" }),
      entry("other", 60, { customKey: "radio", note: "Radio" }),
    ])
      .filter((s) => s.amount > 0)
      .map((s) => ({
        label: spendChannelLabel({
          channel: s.channel,
          customLabel: s.customLabel,
        }),
        amount: s.amount,
      }));
    expect(named).toEqual([
      { label: "Billboard", amount: 400 },
      { label: "Radio", amount: 60 },
    ]);
  });

  it("sums repeat rows for the same extra instead of overwriting one", () => {
    const slices = channelSpendFromEntries([
      entry("other", 400, { customKey: "billboards", note: "Billboard" }),
      entry("other", 150, { customKey: "billboards", note: "Billboard" }),
    ]);
    const billboard = slices.find((s) => s.customLabel === "Billboard");
    expect(billboard?.amount).toBe(550);
  });

  it("falls back to the slug when an extra has no display name", () => {
    const slices = channelSpendFromEntries([
      entry("other", 75, { customKey: "trade-show", note: null }),
    ]);
    expect(slices.find((s) => s.amount === 75)?.customLabel).toBe("trade-show");
  });

  it("ignores channel strings the engine does not know", () => {
    const slices = channelSpendFromEntries([
      entry("meta", 100),
      entry("definitely-not-a-channel", 999),
    ]);
    expect(sumSpend(slices)).toBe(100);
  });

  it("keeps mix shares summing to 1 with named extras present", () => {
    const mix = channelMix(
      channelSpendFromEntries([
        entry("meta", 250),
        entry("other", 400, { customKey: "billboards", note: "Billboard" }),
      ]).filter((s) => s.amount > 0),
    );
    expect(mix.reduce((s, e) => s + e.share, 0)).toBeCloseTo(1);
    expect(
      mix.map((e) =>
        spendChannelLabel({ channel: e.channel, customLabel: e.customLabel }),
      ),
    ).toEqual(["Meta Ads", "Billboard"]);
  });
});
