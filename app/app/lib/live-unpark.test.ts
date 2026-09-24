import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { DESK_HISTORY_YEARS_BACK } from "./desk-history";
import {
  LIVE_DEFAULT_STAGE,
  LIVE_SYNC_LAW_PR_REF,
  LIVE_UNPAID_INGEST_DAYS,
  liveDeskTabAllowed,
  liveIngestPolicy,
  liveShopifyWindowSchedule,
  liveShopifyWindowShouldSchedule,
  liveUnparkIngestPolicyFromEnv,
  parseLiveUnparkStage,
  readLiveUnparkStage,
  resolveLiveUnparkStage,
  sampleOnlyFreezeOn,
  type LiveUnparkStage,
  type LiveUnparkTab,
} from "./live-unpark";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../..");

function readRepo(rel: string) {
  return readFileSync(join(repoRoot, rel), "utf8");
}

const STAGE_TABS: Record<LiveUnparkStage, readonly LiveUnparkTab[]> = {
  parked: [],
  overview_orders: ["overview", "orders"],
  customers: ["overview", "orders", "customers", "growth"],
  ltv: ["overview", "orders", "customers", "growth", "ltv"],
};

const ALL_TABS: readonly LiveUnparkTab[] = [
  "overview",
  "orders",
  "customers",
  "growth",
  "ltv",
];

describe("live unpark policy", () => {
  const prevSample = process.env.MCFLY_SAMPLE_ONLY;
  const prevStage = process.env.MCFLY_LIVE_STAGE;

  afterEach(() => {
    if (prevSample === undefined) delete process.env.MCFLY_SAMPLE_ONLY;
    else process.env.MCFLY_SAMPLE_ONLY = prevSample;
    if (prevStage === undefined) delete process.env.MCFLY_LIVE_STAGE;
    else process.env.MCFLY_LIVE_STAGE = prevStage;
  });

  it("treats true and 1 as the SAMPLE freeze kill switch", () => {
    expect(sampleOnlyFreezeOn(undefined)).toBe(false);
    expect(sampleOnlyFreezeOn("false")).toBe(false);
    expect(sampleOnlyFreezeOn("true")).toBe(true);
    expect(sampleOnlyFreezeOn("1")).toBe(true);
  });

  it("parses stages and aliases overview/orders to the first slice", () => {
    expect(parseLiveUnparkStage("")).toBe("parked");
    expect(parseLiveUnparkStage("parked")).toBe("parked");
    expect(parseLiveUnparkStage("overview")).toBe("overview_orders");
    expect(parseLiveUnparkStage("orders")).toBe("overview_orders");
    expect(parseLiveUnparkStage("customers")).toBe("customers");
    expect(parseLiveUnparkStage("ltv")).toBe("ltv");
    expect(parseLiveUnparkStage("wide")).toBe("parked");
  });

  it("forces parked while SAMPLE freeze is on, even if stage is ltv", () => {
    expect(
      resolveLiveUnparkStage({
        MCFLY_SAMPLE_ONLY: "true",
        MCFLY_LIVE_STAGE: "ltv",
      }),
    ).toBe("parked");
    expect(
      resolveLiveUnparkStage({
        MCFLY_SAMPLE_ONLY: "1",
        MCFLY_LIVE_STAGE: "customers",
      }),
    ).toBe("parked");
  });

  it("defaults to the whole desk when freeze is off and stage is unset", () => {
    expect(LIVE_DEFAULT_STAGE).toBe("ltv");
    expect(resolveLiveUnparkStage({ MCFLY_SAMPLE_ONLY: "false" })).toBe("ltv");
    expect(
      resolveLiveUnparkStage({
        MCFLY_SAMPLE_ONLY: "false",
        MCFLY_LIVE_STAGE: "  ",
      }),
    ).toBe("ltv");
  });

  it("still parks exactly the rung an operator names", () => {
    expect(
      resolveLiveUnparkStage({
        MCFLY_SAMPLE_ONLY: "false",
        MCFLY_LIVE_STAGE: "parked",
      }),
    ).toBe("parked");
    expect(
      resolveLiveUnparkStage({
        MCFLY_SAMPLE_ONLY: "false",
        MCFLY_LIVE_STAGE: "overview_orders",
      }),
    ).toBe("overview_orders");
    expect(
      resolveLiveUnparkStage({
        MCFLY_SAMPLE_ONLY: "false",
        MCFLY_LIVE_STAGE: "customers",
      }),
    ).toBe("customers");
    expect(
      resolveLiveUnparkStage({
        MCFLY_SAMPLE_ONLY: "false",
        MCFLY_LIVE_STAGE: "ltv",
      }),
    ).toBe("ltv");
  });

  it("reads strictly, and a stage nobody can parse does not park a paid desk", () => {
    expect(readLiveUnparkStage("wide")).toBeNull();
    expect(readLiveUnparkStage("")).toBeNull();
    expect(readLiveUnparkStage("orders")).toBe("overview_orders");
    expect(
      resolveLiveUnparkStage({
        MCFLY_SAMPLE_ONLY: "false",
        MCFLY_LIVE_STAGE: "full",
      }),
    ).toBe(LIVE_DEFAULT_STAGE);
  });

  it("opens Customers, Growth, and LTV for a week-one Live shop", () => {
    const stage = resolveLiveUnparkStage({ MCFLY_SAMPLE_ONLY: "false" });
    for (const tab of ALL_TABS) {
      expect(liveDeskTabAllowed(tab, stage)).toBe(true);
    }
  });

  it("unlocks Live tabs progressively and never mixes SAMPLE as Live", () => {
    for (const stage of Object.keys(STAGE_TABS) as LiveUnparkStage[]) {
      const allowed = new Set(STAGE_TABS[stage]);
      for (const tab of ALL_TABS) {
        expect(liveDeskTabAllowed(tab, stage)).toBe(allowed.has(tab));
      }
    }
  });

  it("skips ingest when frozen or parked; unpaid slice vs paid full", () => {
    expect(
      liveIngestPolicy({
        sampleOnlyFreeze: true,
        stage: "ltv",
        paid: true,
      }),
    ).toEqual({ kind: "none", reason: "sample_freeze" });
    expect(
      liveIngestPolicy({
        sampleOnlyFreeze: false,
        stage: "parked",
        paid: true,
      }),
    ).toEqual({ kind: "none", reason: "stage_parked" });
    expect(
      liveIngestPolicy({
        sampleOnlyFreeze: false,
        stage: "overview_orders",
        paid: false,
      }),
    ).toEqual({
      kind: "unpaid_slice",
      closedDays: LIVE_UNPAID_INGEST_DAYS,
    });
    expect(
      liveIngestPolicy({
        sampleOnlyFreeze: false,
        stage: "ltv",
        paid: true,
      }),
    ).toEqual({ kind: "paid_full" });
    expect(LIVE_UNPAID_INGEST_DAYS).toBe(90);
    expect(DESK_HISTORY_YEARS_BACK).toBe(5);
  });

  it("only schedules Shopify window jobs when ingest is allowed", () => {
    expect(
      liveShopifyWindowShouldSchedule({
        kind: "none",
        reason: "sample_freeze",
      }),
    ).toBe(false);
    expect(
      liveShopifyWindowShouldSchedule({
        kind: "unpaid_slice",
        closedDays: LIVE_UNPAID_INGEST_DAYS,
      }),
    ).toBe(true);
    expect(liveShopifyWindowShouldSchedule({ kind: "paid_full" })).toBe(true);
  });

  it("passes the unpaid closed-day window and leaves paid unclamped", () => {
    expect(
      liveShopifyWindowSchedule({
        kind: "unpaid_slice",
        closedDays: LIVE_UNPAID_INGEST_DAYS,
      }),
    ).toEqual({ schedule: true, closedDays: LIVE_UNPAID_INGEST_DAYS });
    expect(liveShopifyWindowSchedule({ kind: "paid_full" })).toEqual({
      schedule: true,
      closedDays: null,
    });
    expect(
      liveShopifyWindowSchedule({ kind: "none", reason: "stage_parked" }),
    ).toEqual({ schedule: false });
  });

  it("env stub is conservative — unknown shops are not paid-full", () => {
    expect(
      liveUnparkIngestPolicyFromEnv({
        MCFLY_SAMPLE_ONLY: "false",
        MCFLY_LIVE_STAGE: "overview_orders",
      }),
    ).toEqual({
      kind: "unpaid_slice",
      closedDays: LIVE_UNPAID_INGEST_DAYS,
    });
    expect(
      liveUnparkIngestPolicyFromEnv(
        {
          MCFLY_SAMPLE_ONLY: "false",
          MCFLY_LIVE_STAGE: "ltv",
        },
        { paid: true },
      ),
    ).toEqual({ kind: "paid_full" });
  });

  it("does not flip SAMPLE_ONLY on Fly and points at the unmerged sync PR", () => {
    const fly = readRepo("fly.toml");
    const checklist = readRepo("docs/ops/LIVE_UNPARK_CHECKLIST.md");
    const gate = readFileSync(join(here, "live-unpark.ts"), "utf8");
    expect(fly).toMatch(/MCFLY_SAMPLE_ONLY\s*=\s*"true"/);
    expect(fly).toMatch(/MCFLY_LIVE_STAGE\s*=\s*"parked"/);
    expect(fly).not.toMatch(/MCFLY_SAMPLE_ONLY\s*=\s*"false"/);
    expect(LIVE_SYNC_LAW_PR_REF).toBe("cursor/sync-law-oneshot-webhook-6eb3");
    expect(checklist).toContain("MCFLY_SAMPLE_ONLY=true");
    expect(checklist).toContain("do **not** flip");
    expect(checklist).toContain("ACCURACY_ONE_SHOP_SCORECARD.md");
    expect(checklist).toContain("accuracy-one-shop.ts");
    expect(checklist).toContain(LIVE_SYNC_LAW_PR_REF);
    expect(checklist).toContain("90 closed days");
    expect(checklist).toContain("Paid **$39**");
    expect(gate).toContain("never paints SAMPLE as this shop");
    expect(gate).toContain(LIVE_SYNC_LAW_PR_REF);
    expect(gate).not.toMatch(/90[\s-]day (cap|limit|history)/i);
    expect(gate).not.toContain("pro_required");
    expect(gate).not.toMatch(/\bPro only\b/i);
  });
});
