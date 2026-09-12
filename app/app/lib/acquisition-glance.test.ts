import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ACQUISITION_SPLIT_MIN_COVERAGE,
  resolveAcquisitionGlance,
  type AcquisitionGlanceInput,
} from "./acquisition-glance";

const here = dirname(fileURLToPath(import.meta.url));
const overview = readFileSync(
  join(here, "../routes/app._index.tsx"),
  "utf8",
);
const component = readFileSync(
  join(here, "../components/AcquisitionGlance.tsx"),
  "utf8",
);

/** Honest period: complete sales facts, covered history, real split. */
function ready(
  overrides: Partial<AcquisitionGlanceInput> = {},
): AcquisitionGlanceInput {
  return {
    amer: 2.5,
    newCustomerSales: 25_000,
    returningCustomerSales: 15_000,
    periodSales: 40_000,
    totalSpend: 10_000,
    periodLabel: "September",
    cashActionReady: true,
    spendIncomplete: false,
    salesFactsIncomplete: false,
    periodUncovered: false,
    newBuyers: 320,
    useSampleDesk: false,
    ...overrides,
  };
}

describe("resolveAcquisitionGlance — trusted period", () => {
  it("surfaces aMER and the new vs returning sales split", () => {
    const glance = resolveAcquisitionGlance(ready());
    expect(glance.available).toBe(true);
    if (!glance.available) return;
    expect(glance.amer).toBe(2.5);
    expect(glance.amerLabel).toBe("2.50×");
    expect(glance.newCustomerSales).toBe(25_000);
    expect(glance.returningCustomerSales).toBe(15_000);
    expect(glance.attributedSales).toBe(40_000);
    expect(glance.newSharePct).toBeCloseTo(62.5, 5);
    expect(glance.returningSharePct).toBeCloseTo(37.5, 5);
  });

  it("shares always total 100% of attributed sales", () => {
    const glance = resolveAcquisitionGlance(
      ready({
        newCustomerSales: 7_777,
        returningCustomerSales: 3_333,
        periodSales: 11_110,
      }),
    );
    if (!glance.available) throw new Error("expected available");
    expect(glance.newSharePct + glance.returningSharePct).toBeCloseTo(100, 9);
  });

  it("reads aMER as average acquisition efficiency, never channel ROAS", () => {
    const glance = resolveAcquisitionGlance(ready());
    if (!glance.available) throw new Error("expected available");
    expect(glance.headline).toContain("$2.50 of new-customer sales");
    expect(glance.caveat).toContain("Average acquisition efficiency");
    expect(glance.caveat).toContain("not channel ROAS");
  });

  it("reuses the LTV new-buyer count instead of inventing one", () => {
    const glance = resolveAcquisitionGlance(ready({ newBuyers: 320 }));
    if (!glance.available) throw new Error("expected available");
    expect(glance.newBuyers).toBe(320);
    expect(glance.caveat).toContain("320 new buyers");
  });

  it("drops the buyer line when cohorts aren't ready", () => {
    const glance = resolveAcquisitionGlance(ready({ newBuyers: null }));
    if (!glance.available) throw new Error("expected available");
    expect(glance.newBuyers).toBeNull();
    expect(glance.caveat).not.toContain("new buyers");
  });

  it("discloses sales sitting outside the split", () => {
    const glance = resolveAcquisitionGlance(ready({ periodSales: 50_000 }));
    if (!glance.available) throw new Error("expected available");
    expect(glance.unattributedSales).toBe(10_000);
    expect(glance.coverageLine).toContain("$40,000");
    expect(glance.coverageLine).toContain("$50,000");
  });

  it("omits coverage line when the split covers every dollar", () => {
    const glance = resolveAcquisitionGlance(ready());
    if (!glance.available) throw new Error("expected available");
    expect(glance.unattributedSales).toBe(0);
    expect(glance.coverageLine).toBeNull();
  });
});

describe("resolveAcquisitionGlance — spend secondary, split first", () => {
  it("still shows new vs returning when spend days are missing", () => {
    const glance = resolveAcquisitionGlance(ready({ spendIncomplete: true }));
    expect(glance.available).toBe(true);
    if (!glance.available) return;
    expect(glance.amer).toBeNull();
    expect(glance.newCustomerSales).toBe(25_000);
  });

  it("still shows the split when spend trust hasn't cleared", () => {
    const glance = resolveAcquisitionGlance(ready({ cashActionReady: false }));
    expect(glance.available).toBe(true);
    if (!glance.available) return;
    expect(glance.amer).toBeNull();
    expect(glance.headline).toMatch(/new|returning/i);
  });

  it("still shows the split without spend — aMER waits", () => {
    const glance = resolveAcquisitionGlance(
      ready({ totalSpend: 0, amer: null }),
    );
    expect(glance.available).toBe(true);
    if (!glance.available) return;
    expect(glance.amer).toBeNull();
    expect(glance.amerLabel).toBeNull();
  });

  it("omits aMER for a non-finite multiple without blanking the split", () => {
    const glance = resolveAcquisitionGlance(
      ready({ amer: Number.POSITIVE_INFINITY }),
    );
    expect(glance.available).toBe(true);
    if (!glance.available) return;
    expect(glance.amer).toBeNull();
  });
});

describe("resolveAcquisitionGlance — fail closed on sales honesty", () => {
  it("refuses while Shopify sales facts are backfilling", () => {
    const glance = resolveAcquisitionGlance(
      ready({ salesFactsIncomplete: true }),
    );
    if (glance.available) throw new Error("expected blocked");
    expect(glance.reason).toBe("backfilling");
    expect(glance.copy).toContain("backfilling");
  });

  it("refuses when the period reaches past loaded order history", () => {
    const glance = resolveAcquisitionGlance(ready({ periodUncovered: true }));
    if (glance.available) throw new Error("expected blocked");
    expect(glance.reason).toBe("history_limited");
    expect(glance.copy).toContain("not permanently empty");
  });

  it("refuses when the customer split hasn't landed at all", () => {
    const glance = resolveAcquisitionGlance(
      ready({ newCustomerSales: 0, returningCustomerSales: 0, amer: 0 }),
    );
    if (glance.available) throw new Error("expected blocked");
    expect(glance.reason).toBe("split_missing");
  });

  it("refuses a thin split rather than publishing a weak split", () => {
    const glance = resolveAcquisitionGlance(
      ready({
        newCustomerSales: 3_000,
        returningCustomerSales: 1_000,
        periodSales: 40_000,
      }),
    );
    if (glance.available) throw new Error("expected blocked");
    expect(glance.reason).toBe("split_thin");
    expect(glance.copy).toContain("10%");
  });

  it("publishes exactly at the coverage floor", () => {
    const glance = resolveAcquisitionGlance(
      ready({
        newCustomerSales: 12_000,
        returningCustomerSales: 8_000,
        periodSales: 20_000 / ACQUISITION_SPLIT_MIN_COVERAGE,
      }),
    );
    expect(glance.available).toBe(true);
  });

  it("checks sales facts before history", () => {
    const everythingWrong = ready({
      salesFactsIncomplete: true,
      periodUncovered: true,
    });
    const first = resolveAcquisitionGlance(everythingWrong);
    if (first.available) throw new Error("expected blocked");
    expect(first.reason).toBe("backfilling");

    const second = resolveAcquisitionGlance({
      ...everythingWrong,
      salesFactsIncomplete: false,
    });
    if (second.available) throw new Error("expected blocked");
    expect(second.reason).toBe("history_limited");
  });
});

describe("resolveAcquisitionGlance — SAMPLE", () => {
  it("marks SAMPLE numbers as practice, never live money", () => {
    const glance = resolveAcquisitionGlance(ready({ useSampleDesk: true }));
    if (!glance.available) throw new Error("expected available");
    expect(glance.useSampleDesk).toBe(true);
    expect(glance.sampleNote).toContain("SAMPLE");
  });

  it("leaves live desks unmarked", () => {
    const glance = resolveAcquisitionGlance(ready());
    if (!glance.available) throw new Error("expected available");
    expect(glance.sampleNote).toBeNull();
  });
});

describe("Overview wiring", () => {
  it("renders the glance with sales desk ready — not spend-gated", () => {
    const mount = overview.indexOf("<AcquisitionGlance");
    expect(mount).toBeGreaterThan(0);
    // Gate can sit well above LtvSnapSection + pace strip; search the enclosing desk block.
    const deskOpen = overview.lastIndexOf("salesDeskReady && !shotMode", mount);
    expect(deskOpen).toBeGreaterThan(0);
    expect(deskOpen).toBeLessThan(mount);
    const between = overview.slice(deskOpen, mount);
    expect(between).not.toContain("metrics.cashActionReady ?");
    // Glance itself may receive cashActionReady as an honesty prop — that is not the mount gate.
  });

  it("lands with customer depth before the Total ROAS hero", () => {
    const client = overview.split("export default function Dashboard")[1] ?? "";
    const orderAt = client.indexOf("<OrderEconomicsPanel");
    const glanceAt = client.indexOf("<AcquisitionGlance");
    const ltvAt = client.indexOf("<LtvSnapSection");
    const heroAt = client.indexOf("<TotalRoasGauge");
    expect(orderAt).toBeGreaterThan(0);
    expect(ltvAt).toBeGreaterThan(orderAt);
    expect(glanceAt).toBeGreaterThan(0);
    expect(heroAt).toBeGreaterThan(glanceAt);
  });

  it("passes the honesty flags the resolver fails closed on", () => {
    const props = overview.slice(
      overview.indexOf("<AcquisitionGlance"),
      overview.indexOf("<AcquisitionGlance") + 1200,
    );
    expect(props).toContain("spendIncomplete={Boolean(metrics.spendCoverage?.incomplete)}");
    expect(props).toContain("cashActionReady={metrics.cashActionReady}");
    expect(props).toContain("periodUncovered={periodUncovered}");
    expect(props).toContain("useSampleDesk={useSampleDesk}");
  });

  it("reuses desk metrics instead of recomputing till math", () => {
    const props = overview.slice(
      overview.indexOf("<AcquisitionGlance"),
      overview.indexOf("<AcquisitionGlance") + 1200,
    );
    expect(props).toContain("amer={metrics.amer}");
    expect(props).toContain("newCustomerSales={metrics.newCustomerNetSales}");
    expect(props).toContain(
      "returningCustomerSales={metrics.returningCustomerNetSales}",
    );
    expect(props).toContain("metrics.tillLtv.newBuyers");
  });

  it("component owns no metric math — it renders the resolver", () => {
    expect(component).toContain("resolveAcquisitionGlance");
    expect(component).not.toMatch(/\/\s*(spend|totalSpend)\b/);
    expect(component).not.toContain("calculateAmer");
  });
});
