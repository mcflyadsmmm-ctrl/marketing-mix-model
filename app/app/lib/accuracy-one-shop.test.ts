import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ADMIN_MONEY_ABS,
  ADMIN_MONEY_REL,
  HONEST_EMPTY,
  LIVE_ORDER_FACT_SOURCE,
  ONE_SHOP_ACCURACY_CHECKS,
  SAMPLE_SOURCE,
  TYPICAL_MIN_ORDERS,
  compareAdminMoney,
  compareTypicalTicket,
  isSampleLedgerNote,
  isSampleSource,
  judgePaintedMoney,
  judgePaintedRoas,
  judgeSampleContamination,
  liveLedgerContaminated,
  mixedSampleLiveSources,
  paintHonesty,
  paintTotalRoas,
  sampleBookContaminatedByLive,
  scorecardCheckApplies,
  scorecardCheckRunability,
  scorecardCheckTabs,
  tipReadyChecks,
} from "./accuracy-one-shop";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../..");

function readRepo(rel: string) {
  return readFileSync(join(repoRoot, rel), "utf8");
}

const TIP_CTX = {
  sampleOnlyFreeze: true,
  stage: "parked" as const,
  mode: "sample" as const,
};

const LIVE_OO_CTX = {
  sampleOnlyFreeze: false,
  stage: "overview_orders" as const,
  mode: "live" as const,
};

describe("one-shop accuracy scorecard helpers", () => {
  it("keeps the same 10 §4 checks and the honest-empty glyph", () => {
    expect(ONE_SHOP_ACCURACY_CHECKS).toEqual([
      "sample_contamination",
      "kill_switch",
      "shop_tz",
      "refunds",
      "overview_sales",
      "orders_typical",
      "sync_pending",
      "customers_returning",
      "ltv_window",
      "empty_vs_zero",
    ]);
    expect(HONEST_EMPTY).toBe("—");
    expect(SAMPLE_SOURCE).toBe("sample");
    expect(LIVE_ORDER_FACT_SOURCE).toBe("shopify_order_v1");
  });

  it("paints missing/pending as — and keeps certified $0", () => {
    expect(paintHonesty("missing")).toBe(HONEST_EMPTY);
    expect(paintHonesty("pending")).toBe(HONEST_EMPTY);
    expect(paintHonesty("certified_zero")).toBe(0);
    expect(paintHonesty("known", 12840)).toBe(12840);
    expect(paintHonesty("known", Number.NaN)).toBe(HONEST_EMPTY);
    expect(judgePaintedMoney({ kind: "missing", painted: "—" }).verdict).toBe(
      "pass",
    );
    expect(judgePaintedMoney({ kind: "pending", painted: "$0" }).verdict).toBe(
      "fail",
    );
    expect(
      judgePaintedMoney({ kind: "certified_zero", painted: "$0" }).verdict,
    ).toBe("pass");
    expect(
      judgePaintedMoney({ kind: "certified_zero", painted: "—" }).verdict,
    ).toBe("fail");
  });

  it("never paints 0.00× for empty spend or pending sales", () => {
    expect(paintTotalRoas({ spend: 0, mer: 0 })).toBe(HONEST_EMPTY);
    expect(paintTotalRoas({ spend: -1, mer: 4 })).toBe(HONEST_EMPTY);
    expect(paintTotalRoas({ spend: 650, mer: 0, salesPending: true })).toBe(
      HONEST_EMPTY,
    );
    expect(paintTotalRoas({ spend: 3100, mer: 4 })).toBe("4.00×");
    expect(paintTotalRoas({ spend: 650, mer: 0, salesPending: false })).toBe(
      "0.00×",
    );
    expect(
      judgePaintedRoas({ spend: 0, painted: "0.00×" }).verdict,
    ).toBe("fail");
    expect(judgePaintedRoas({ spend: 0, painted: "—" }).verdict).toBe("pass");
    expect(
      judgePaintedRoas({
        spend: 650,
        painted: "0.00×",
        salesPending: true,
      }).verdict,
    ).toBe("fail");
    expect(
      judgePaintedRoas({
        spend: 650,
        painted: "—",
        salesPending: true,
      }).verdict,
    ).toBe("pass");
  });

  it("flags SAMPLE ↔ Live contamination and mixed sources", () => {
    expect(isSampleSource("sample")).toBe(true);
    expect(isSampleSource("csv")).toBe(false);
    expect(isSampleLedgerNote("sample:snowdevil-2")).toBe(true);
    expect(isSampleLedgerNote("sample:snowdevil-1")).toBe(true);
    expect(isSampleLedgerNote("invoice 40")).toBe(false);
    expect(
      mixedSampleLiveSources(["sample", LIVE_ORDER_FACT_SOURCE]),
    ).toBe(true);
    expect(mixedSampleLiveSources(["sample", "sample"])).toBe(false);
    expect(
      liveLedgerContaminated([
        { source: "csv", note: "sample:snowdevil-2" },
      ]),
    ).toBe(true);
    expect(
      sampleBookContaminatedByLive([{ source: LIVE_ORDER_FACT_SOURCE }]),
    ).toBe(true);
    expect(
      judgeSampleContamination({
        mode: "sample",
        watermarkOn: true,
        rows: [{ source: "sample", note: "sample:snowdevil-2" }],
      }).verdict,
    ).toBe("pass");
    expect(
      judgeSampleContamination({
        mode: "sample",
        watermarkOn: false,
        rows: [{ source: "sample" }],
      }).verdict,
    ).toBe("fail");
    expect(
      judgeSampleContamination({
        mode: "live",
        watermarkOn: false,
        rows: [{ source: "sample", note: null }],
      }).verdict,
    ).toBe("fail");
    expect(
      judgeSampleContamination({
        mode: "live",
        watermarkOn: false,
        rows: [{ source: "csv", note: "August invoice" }],
      }).verdict,
    ).toBe("pass");
  });

  it("compares Admin vs desk money without treating missing as $0", () => {
    expect(compareAdminMoney(12_840, 12_840).verdict).toBe("pass");
    expect(compareAdminMoney(12_840, 12_839.4).verdict).toBe("pass");
    expect(compareAdminMoney(null, null).verdict).toBe("pass");
    expect(compareAdminMoney(0, null).verdict).toBe("fail");
    expect(compareAdminMoney(null, 0).verdict).toBe("fail");
    expect(compareAdminMoney(12_840, 11_000).verdict).toBe("fail");
    expect(compareAdminMoney(100, 100, { pending: true }).verdict).toBe("hold");
    const loose = Math.max(ADMIN_MONEY_ABS, 100_000 * ADMIN_MONEY_REL);
    expect(loose).toBeGreaterThan(ADMIN_MONEY_ABS);
    expect(compareAdminMoney(100_000, 100_000 + loose).verdict).toBe("pass");
  });

  it("holds typical until enough orders; thin shop stays —", () => {
    expect(TYPICAL_MIN_ORDERS).toBe(5);
    expect(compareTypicalTicket(null, null, 2).verdict).toBe("pass");
    expect(compareTypicalTicket(88, 90, 2).verdict).toBe("hold");
    expect(compareTypicalTicket(420, 430, 10).verdict).toBe("pass");
    expect(compareTypicalTicket(420, 900, 10).verdict).toBe("fail");
  });

  it("runs 1/2/10 on tip freeze; Live dollars and later stages stay HOLD", () => {
    expect(tipReadyChecks(TIP_CTX)).toEqual([
      "sample_contamination",
      "kill_switch",
      "empty_vs_zero",
    ]);
    expect(scorecardCheckRunability("overview_sales", TIP_CTX)).toBe(
      "hold_needs_live",
    );
    expect(scorecardCheckRunability("customers_returning", TIP_CTX)).toBe(
      "hold_needs_stage",
    );
    expect(scorecardCheckRunability("ltv_window", TIP_CTX)).toBe(
      "hold_needs_stage",
    );
    expect(scorecardCheckRunability("overview_sales", LIVE_OO_CTX)).toBe("run");
    expect(scorecardCheckRunability("customers_returning", LIVE_OO_CTX)).toBe(
      "hold_needs_stage",
    );
    expect(
      scorecardCheckRunability("customers_returning", {
        ...LIVE_OO_CTX,
        stage: "customers",
      }),
    ).toBe("run");
    expect(scorecardCheckApplies("ltv_window", "customers")).toBe(false);
    expect(scorecardCheckApplies("ltv_window", "ltv")).toBe(true);
    expect(scorecardCheckTabs("overview_sales")).toEqual(["overview"]);
    expect(scorecardCheckTabs("orders_typical")).toEqual(["orders"]);
  });
});

describe("one-shop scorecard docs stay runnable and parked", () => {
  it("sheet + checklist share the 10 §4 rows and do not flip the freeze", () => {
    const sheet = readRepo("docs/ops/ACCURACY_ONE_SHOP_SCORECARD.md");
    const checklist = readRepo("docs/ops/LIVE_UNPARK_CHECKLIST.md");
    const fly = readRepo("fly.toml");
    const titles = [
      "SAMPLE contamination",
      "Kill switch",
      "Shop TZ",
      "Refunds",
      "Overview sales",
      "Orders typical",
      "Sync / pending",
      "Customers",
      "LTV",
      "Empty vs zero",
    ];
    for (const title of titles) {
      expect(sheet).toContain(title);
      expect(checklist).toContain(title);
    }
    expect(checklist).toContain("ACCURACY_ONE_SHOP_SCORECARD.md");
    expect(checklist).toContain("accuracy-one-shop.ts");
    expect(sheet).toContain("LIVE_UNPARK_CHECKLIST");
    expect(sheet).toContain("do **not** flip");
    expect(sheet).toContain("Never `0.00×`");
    expect(sheet).toMatch(/fill \*\*1 · 2 · 10\*\*/);
    expect(sheet).toContain("not this PR");
    expect(sheet).toContain("MCFLY_SAMPLE_ONLY=true");
    expect(fly).toMatch(/MCFLY_SAMPLE_ONLY\s*=\s*"true"/);
    expect(fly).toMatch(/MCFLY_LIVE_STAGE\s*=\s*"parked"/);
  });
});
