import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  spendBucketKey,
  spendChannelLabel,
  spendChannelShortLabel,
} from "./spend-channel-label";
import { spendConfirmLine } from "./spend-confirm-copy";

const here = dirname(fileURLToPath(import.meta.url));

/*
 * 2026-08-26 Admin smoke on devmcflyads: a merchant typed the channel
 * "Billboard" for $400. The save confirmation said "Other $400", the Overview
 * split said "Other", and the Spend page said "Billboard" — one row, three
 * names. Every surface now resolves through spendChannelLabel.
 */
describe("spendChannelLabel", () => {
  it("uses the engine label for named platforms", () => {
    expect(spendChannelLabel({ channel: "meta" })).toBe("Meta Ads");
    expect(spendChannelLabel({ channel: "google" })).toBe("Google Ads");
  });

  it("calls a typed Billboard 'Billboard', never 'Other'", () => {
    expect(
      spendChannelLabel({ channel: "other", customLabel: "Billboard" }),
    ).toBe("Billboard");
  });

  it("keeps unlabeled other spend as Other so it is never dropped", () => {
    expect(spendChannelLabel({ channel: "other" })).toBe("Other");
    expect(spendChannelLabel({ channel: "other", customLabel: "" })).toBe(
      "Other",
    );
    expect(spendChannelLabel({ channel: "other", customLabel: "   " })).toBe(
      "Other",
    );
    expect(spendChannelLabel({ channel: "other", customLabel: null })).toBe(
      "Other",
    );
  });

  it("ignores a custom label on a named platform", () => {
    expect(
      spendChannelLabel({ channel: "meta", customLabel: "Billboard" }),
    ).toBe("Meta Ads");
  });

  it("shortens named platforms for chips but leaves extras alone", () => {
    expect(spendChannelShortLabel({ channel: "meta" })).toBe("Meta");
    expect(
      spendChannelShortLabel({ channel: "other", customLabel: "Billboard" }),
    ).toBe("Billboard");
  });
});

describe("spendBucketKey", () => {
  it("keeps two named extras on one day apart", () => {
    expect(spendBucketKey("other", "billboards")).toBe("other:billboards");
    expect(spendBucketKey("other", "radio")).toBe("other:radio");
    expect(spendBucketKey("other", "billboards")).not.toBe(
      spendBucketKey("other", "radio"),
    );
  });

  it("leaves named platforms and unlabeled other on the plain key", () => {
    expect(spendBucketKey("meta", "")).toBe("meta");
    expect(spendBucketKey("meta", "billboards")).toBe("meta");
    expect(spendBucketKey("other", null)).toBe("other");
  });
});

describe("spendConfirmLine names what the merchant typed", () => {
  const fmt = (n: number) => `$${n.toLocaleString()}`;

  it("confirms Billboard $400, not Other $400", () => {
    const line = spendConfirmLine({
      channels: [{ channel: "other", customLabel: "Billboard" }],
      totalAmount: 400,
      dateRange: { start: "2026-08-25", end: "2026-08-25" },
      formatAmount: fmt,
    });
    expect(line).toBe("Billboard $400 for 2026-08-25.");
    expect(line).not.toContain("Other");
  });

  it("still accepts plain channel strings", () => {
    expect(
      spendConfirmLine({
        channels: ["meta"],
        totalAmount: 250,
        dateRange: { start: "2026-08-25", end: "2026-08-25" },
        formatAmount: fmt,
      }),
    ).toBe("Meta $250 for 2026-08-25.");
  });

  it("keeps unlabeled other spend visible as Other", () => {
    expect(
      spendConfirmLine({
        channels: [{ channel: "other" }],
        totalAmount: 90,
        dateRange: null,
        formatAmount: fmt,
      }),
    ).toBe("Other $90.");
  });
});

describe("every spend-labeling surface shares one resolver", () => {
  const read = (rel: string) => readFileSync(join(here, rel), "utf8");

  it("Overview resolves the split through spendChannelLabel", () => {
    const overview = read("../routes/app._index.tsx");
    expect(overview).toContain("spendChannelLabel");
    // The old local resolver ignored customLabel and printed "Other".
    expect(overview).not.toMatch(
      /SPEND_CHANNEL_LABELS\[channel as SpendChannel\] \?\? channel/,
    );
  });

  it("Spend page resolves entry labels through the same module", () => {
    expect(read("../routes/app.spend.tsx")).toContain("spendChannelLabel");
  });

  it("the confirm line does not reach for engine labels directly", () => {
    expect(read("./spend-confirm-copy.ts")).not.toContain(
      "SPEND_CHANNEL_LABELS",
    );
  });

  it("Allocation and the public API resolve the custom label too", () => {
    for (const rel of [
      "../routes/app.allocation.tsx",
      "./mcfly-api.server.ts",
    ]) {
      const src = read(rel);
      expect(src, rel).toContain("spendChannelLabel");
      expect(src, rel).toContain("customLabel");
    }
  });

  /*
   * Explorer slices key on `other:<slug>`. Anything that renders a slice key
   * must map it to a name — a merchant must never read "other:billboards".
   */
  it("never renders a raw bucket key to the merchant", () => {
    const explorer = read("../components/SpendExplorer.tsx");
    expect(explorer).toContain("customChannelLabels");
    // The explorer names slices through channelLabel and colours them through
    // sliceFillKey; neither hands a raw `other:<slug>` to the merchant.
    expect(explorer).toContain("channelLabel(");
    expect(explorer).toContain("sliceFillKey(channel)");
    expect(read("./channel-fill.ts")).toContain('sliceKey.split(":")');

    const allocation = read("../routes/app.allocation.tsx");
    expect(allocation).toContain("historyChannelLabel");
    // Falls back to a readable slug, not the prefixed key.
    expect(allocation).toContain('channel.split(":")');
    expect(allocation).toContain("toHistoryDays(dailyRows, channelLabels)");
  });
});
