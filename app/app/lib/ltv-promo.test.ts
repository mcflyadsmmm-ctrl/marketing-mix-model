import { describe, expect, it } from "vitest";
import { rollUpCustomers, type DepthOrder } from "./ltv-depth";
import { generateSnowdevilDepthOrders } from "./ltv-depth-sample";
import {
  buildPromoLtv,
  firstOrderDiscountShare,
  firstPromoLabel,
  promoDepthBand,
  promoDepthEmptyState,
  promoLtvEmptyState,
  promoMedianOffCopy,
  promoRowKind,
  PROMO_FULL_PRICE,
  PROMO_MIN_BUYERS,
  PROMO_UNNAMED,
} from "./ltv-promo";

function order(
  customerKey: string,
  iso: string,
  amount: number,
  extra?: Partial<DepthOrder>,
): DepthOrder {
  return {
    customerKey,
    orderedAt: new Date(iso),
    amount,
    units: extra?.units ?? 1,
    product: extra?.product ?? null,
    discountAmount: extra?.discountAmount,
    discountCode: extra?.discountCode,
    grossAmount: extra?.grossAmount,
  };
}

function codedBook(): DepthOrder[] {
  const rows: DepthOrder[] = [];
  // BUNDLE starters — come back with a board. Highest 90-day value.
  for (let i = 0; i < 10; i += 1) {
    rows.push(
      order(`b${i}`, "2024-01-01", 90, {
        discountCode: "BUNDLE",
        discountAmount: 12,
      }),
    );
    rows.push(order(`b${i}`, "2024-02-01", 300, { discountAmount: 0 }));
  }
  // WELCOME10 starters — same cheap reorder. Lowest 90-day value.
  for (let i = 0; i < 10; i += 1) {
    rows.push(
      order(`w${i}`, "2024-01-01", 20, {
        discountCode: "WELCOME10",
        discountAmount: 2,
      }),
    );
    if (i < 4) {
      rows.push(order(`w${i}`, "2024-02-01", 20, { discountAmount: 0 }));
    }
  }
  // Full-price first — mid path, the lift baseline.
  for (let i = 0; i < 10; i += 1) {
    rows.push(order(`f${i}`, "2024-01-01", 60, { discountAmount: 0 }));
    rows.push(order(`f${i}`, "2024-02-01", 80, { discountAmount: 0 }));
  }
  return rows;
}

describe("firstPromoLabel", () => {
  it("prefers a real code and never invents one from discount $", () => {
    const [coded] = rollUpCustomers([
      order("c1", "2024-01-01", 40, {
        discountCode: "welcome10",
        discountAmount: 4,
      }),
    ]);
    expect(firstPromoLabel(coded!)).toBe("welcome10");
    expect(promoRowKind(firstPromoLabel(coded!)!)).toBe("code");

    const [unnamed] = rollUpCustomers([
      order("c2", "2024-01-01", 40, { discountAmount: 4 }),
    ]);
    expect(firstPromoLabel(unnamed!)).toBe(PROMO_UNNAMED);

    const [full] = rollUpCustomers([
      order("c3", "2024-01-01", 40, { discountAmount: 0 }),
    ]);
    expect(firstPromoLabel(full!)).toBe(PROMO_FULL_PRICE);

    const [unknown] = rollUpCustomers([order("c4", "2024-01-01", 40)]);
    expect(firstPromoLabel(unknown!)).toBeNull();
  });
});

describe("buildPromoLtv (first-order promo → LTV)", () => {
  const asOf = new Date("2024-06-01");

  it("ranks named promos by matured 90-day value and writes lift vs full price", () => {
    const view = buildPromoLtv(codedBook(), asOf);
    expect(view.discountsKnown).toBe(true);
    expect(view.codesKnown).toBe(true);
    expect(view.empty).toBeNull();
    expect(view.rows.map((row) => row.promo)).toEqual([
      "BUNDLE",
      "WELCOME10",
      PROMO_FULL_PRICE,
    ]);
    expect(view.best?.promo).toBe("BUNDLE");
    expect(view.best?.kind).toBe("code");
    expect(view.best?.day90Ltv).toBe(390);
    expect(view.best?.comeBack90).toBe(1);
    expect(view.best?.firstOrder90).toBe(90);
    expect(view.best?.extraOrders90).toBe(1);
    expect(view.best?.laterOrder90).toBe(300);
    expect(view.best?.predicted90).toBe(390);
    expect(view.best?.observed90).toBe(390);
    expect(view.best?.formula90).toContain("average first order");
    expect(view.best?.formula90).toContain("90.00 + 1.00 × 300.00 = 390.00");
    expect(view.best?.medianFirstShare).toBeNull();

    const welcome = view.rows.find((row) => row.promo === "WELCOME10")!;
    expect(welcome.day90Ltv).toBeCloseTo((4 * 40 + 6 * 20) / 10, 5);
    expect(welcome.comeBack90).toBeCloseTo(0.4, 5);
    expect(view.fullPrice90).toBe(140);
    expect(view.best!.lift90).toBeCloseTo(390 / 140, 5);
    expect(welcome.lift90).toBeLessThan(1);
    expect(view.rows[view.rows.length - 1]?.kind).toBe("full_price");
  });

  it("leaves un-elapsed promo years null instead of a fake $0", () => {
    const youngAsOf = new Date("2024-02-15");
    const view = buildPromoLtv(codedBook(), youngAsOf);
    expect(view.best?.day30Ltv).not.toBeNull();
    expect(view.best?.day90Ltv).toBeNull();
    expect(view.best?.day365Ltv).toBeNull();
    expect(view.best?.predicted90).toBeNull();
    expect(view.read?.worthDays).toBe(30);
    expect(view.read?.yearPending).toBe(true);
  });

  it("does not invent a year-scale promo LTV without matured year buyers", () => {
    const asOf90 = new Date("2024-04-15");
    const view = buildPromoLtv(codedBook(), asOf90);
    expect(view.best?.day90Ltv).toBe(390);
    expect(view.best?.day365Ltv).toBeNull();
    expect(view.read?.worthDays).toBe(90);
    expect(view.read?.yearPending).toBe(true);
  });

  it("seals year-scale promo LTV from full history when buyers have lived it", () => {
    const yearAsOf = new Date("2025-02-01");
    const view = buildPromoLtv(codedBook(), yearAsOf);
    expect(view.best?.day365Ltv).toBe(390);
    expect(view.best?.lift365).not.toBeNull();
    expect(view.read?.yearPending).toBe(false);
  });

  it("splits live discount $ into Promo first vs Full price first — no invented codes", () => {
    const rows: DepthOrder[] = [];
    for (let i = 0; i < 10; i += 1) {
      rows.push(order(`p${i}`, "2024-01-01", 80, { discountAmount: 10 }));
      rows.push(order(`p${i}`, "2024-02-01", 200, { discountAmount: 0 }));
    }
    for (let i = 0; i < 10; i += 1) {
      rows.push(order(`f${i}`, "2024-01-01", 50, { discountAmount: 0 }));
      rows.push(order(`f${i}`, "2024-02-01", 50, { discountAmount: 0 }));
    }
    const view = buildPromoLtv(rows, asOf);
    expect(view.codesKnown).toBe(false);
    expect(view.discountsKnown).toBe(true);
    expect(view.rows.map((row) => row.promo)).toEqual([
      PROMO_UNNAMED,
      PROMO_FULL_PRICE,
    ]);
    expect(view.best?.promo).toBe(PROMO_UNNAMED);
    expect(view.best?.day90Ltv).toBe(280);
    expect(view.fullPrice90).toBe(100);
    expect(view.best?.lift90).toBeCloseTo(2.8, 5);
    expect(view.rows.every((row) => row.kind !== "code")).toBe(true);
    expect(view.depthBands).toEqual([]);
    expect(view.depthLine).toBeNull();
    expect(view.depthEmpty?.kind).toBe("gross");
    expect(view.depthEmpty?.copy).toContain("pre-refund");
    expect(view.depthEmpty?.copy).toContain("Not $0");
  });

  it("drops groups below the buyer floor and missing discount fields", () => {
    const rows: DepthOrder[] = [];
    for (let i = 0; i < 3; i += 1) {
      rows.push(
        order(`p${i}`, "2024-01-01", 80, {
          discountCode: "BUNDLE",
          discountAmount: 8,
        }),
      );
    }
    for (let i = 0; i < 12; i += 1) {
      rows.push(order(`n${i}`, "2024-01-01", 80));
    }
    const view = buildPromoLtv(rows, asOf);
    expect(view.rows).toEqual([]);
    expect(view.read).toBeNull();
    expect(view.empty?.kind).toBe("thin");
    expect(view.promoBuyers).toBe(3);
    expect(view.knownBuyers).toBe(3);
    expect(view.buyers).toBe(15);
  });

  it("uses the young empty when promo starters have not lived 30 days", () => {
    const rows: DepthOrder[] = [];
    for (let i = 0; i < 10; i += 1) {
      rows.push(
        order(`p${i}`, "2024-05-20", 80, {
          discountCode: "BUNDLE",
          discountAmount: 8,
        }),
      );
    }
    const view = buildPromoLtv(rows, new Date("2024-06-01"));
    expect(view.read).toBeNull();
    expect(view.empty?.kind).toBe("young");
    expect(view.empty?.verb).toBe("Wait for day 30");
  });

  it("does not invent a code when only later orders carried one", () => {
    const rows: DepthOrder[] = [];
    for (let i = 0; i < 10; i += 1) {
      rows.push(order(`c${i}`, "2024-01-01", 80, { discountAmount: 0 }));
      rows.push(
        order(`c${i}`, "2024-02-01", 80, {
          discountCode: "BUNDLE",
          discountAmount: 8,
        }),
      );
    }
    const view = buildPromoLtv(rows, asOf);
    expect(view.best).toBeNull();
    expect(view.rows.every((row) => row.kind === "full_price")).toBe(true);
    expect(view.empty?.kind).toBe("thin");
    expect(view.promoBuyers).toBe(0);
  });
});

describe("promoLtvEmptyState", () => {
  it("names syncing / discounts / thin / young — never a blank $0", () => {
    expect(
      promoLtvEmptyState({
        buyers: 0,
        knownBuyers: 0,
        promoBuyers: 0,
        discountsKnown: false,
        sealed: false,
      })?.kind,
    ).toBe("syncing");
    expect(
      promoLtvEmptyState({
        buyers: 20,
        knownBuyers: 0,
        promoBuyers: 0,
        discountsKnown: false,
        sealed: false,
      })?.kind,
    ).toBe("discounts");
    expect(
      promoLtvEmptyState({
        buyers: 12,
        knownBuyers: 12,
        promoBuyers: 4,
        discountsKnown: true,
        sealed: false,
      })?.kind,
    ).toBe("thin");
    expect(
      promoLtvEmptyState({
        buyers: 12,
        knownBuyers: 12,
        promoBuyers: 12,
        discountsKnown: true,
        sealed: false,
      })?.kind,
    ).toBe("young");
    expect(
      promoLtvEmptyState({
        buyers: 12,
        knownBuyers: 12,
        promoBuyers: 12,
        discountsKnown: true,
        sealed: true,
      }),
    ).toBeNull();
  });

  it("puts the buyer floor and the missing-fields ask in the copy", () => {
    const thin = promoLtvEmptyState({
      buyers: 6,
      knownBuyers: 6,
      promoBuyers: 6,
      discountsKnown: true,
      sealed: false,
    });
    expect(thin?.need).toBe(PROMO_MIN_BUYERS);
    expect(thin?.copy).toContain(String(PROMO_MIN_BUYERS));
    expect(thin?.copy).toContain("not $0");
    expect(thin?.verb).toBe("Watch first 30 days");

    const discounts = promoLtvEmptyState({
      buyers: 20,
      knownBuyers: 0,
      promoBuyers: 0,
      discountsKnown: false,
      sealed: false,
    });
    expect(discounts?.copy).toContain("titles/codes");
    expect(discounts?.copy).toContain("Not $0");
    expect(discounts?.verb).toBe("Wait for discount fields");
  });
});

describe("SAMPLE Snowdevil promo → LTV is dense", () => {
  const NOW = new Date("2026-09-17T00:00:00Z");
  const view = buildPromoLtv(generateSnowdevilDepthOrders(NOW), NOW);

  it("seals 90-day and year promo LTV with a written-out formula and lift vs full price", () => {
    expect(view.discountsKnown).toBe(true);
    expect(view.codesKnown).toBe(true);
    expect(view.empty).toBeNull();
    expect(view.rows.length).toBeGreaterThanOrEqual(2);
    expect(view.best).not.toBeNull();
    expect(view.best!.kind).toBe("code");
    expect(view.best!.day90Ltv).toBeGreaterThan(0);
    expect(view.best!.day365Ltv).toBeGreaterThan(view.best!.day90Ltv ?? 0);
    expect(view.best!.formula90).toContain("average first order");
    expect(view.read?.worthDays).toBe(90);
    expect(view.read?.yearPending).toBe(false);
    const customers = rollUpCustomers(generateSnowdevilDepthOrders(NOW));
    expect(customers.some((c) => c.firstDiscountCode)).toBe(true);
    expect(customers.some((c) => c.firstDiscountAmount === 0)).toBe(true);
  });

  it("keeps a lower-LTV first promo on the board so the lift is a comparison", () => {
    const promos = view.rows.filter((row) => row.kind !== "full_price");
    expect(promos.length).toBeGreaterThanOrEqual(2);
    const worst = promos[promos.length - 1]!;
    expect(worst.day90Ltv).not.toBeNull();
    expect(worst.day90Ltv!).toBeLessThan(view.best!.day90Ltv!);
    const full = view.rows.find((row) => row.kind === "full_price");
    expect(full?.day90Ltv).not.toBeNull();
  });

  it("seals at least two discount-depth bands without a fourth code", () => {
    const orders = generateSnowdevilDepthOrders(NOW);
    const codes = new Set(
      orders
        .map((row) => row.discountCode)
        .filter((code): code is string => Boolean(code?.trim())),
    );
    expect([...codes].sort()).toEqual(["BUNDLE", "POWDER15", "WELCOME10"]);
    const sealed = view.depthBands.filter(
      (band) => band.day90Ltv != null || band.day30Ltv != null,
    );
    expect(sealed.length).toBeGreaterThanOrEqual(2);
    expect(view.depthLine).not.toBeNull();
    expect(view.depthLine!.worthDays).toBe(90);
    expect(view.depthLine!.lift).not.toBeNull();
    expect(view.depthEmpty).toBeNull();
    expect(new Set(sealed.map((band) => band.band)).size).toBeGreaterThanOrEqual(2);
    expect(view.depthBands.every((band) => band.cut.includes("%"))).toBe(true);
    expect(
      view.depthBands.some((band) => band.day365Ltv != null && band.day365Ltv > 0),
    ).toBe(true);
    expect(
      view.depthBands
        .filter((band) => band.day90Ltv != null)
        .every((band) => band.afterRefunds90),
    ).toBe(true);
    expect(view.depthBands.some((band) => band.laterFullPrice90 === 1)).toBe(
      true,
    );
    const welcome = view.rows.find((row) => row.promo === "WELCOME10");
    if (welcome?.medianFirstShare != null) {
      expect(welcome.medianFirstShare).toBeGreaterThan(0);
      expect(welcome.medianFirstShare).toBeLessThan(0.15);
      expect(promoMedianOffCopy(welcome.medianFirstShare)).not.toContain("10%");
    }
  });
});

describe("first-order discount depth", () => {
  it("cuts Light / Typical / Deep on the share, not on a code name", () => {
    expect(firstOrderDiscountShare(10, 90)).toBeCloseTo(0.1, 5);
    expect(promoDepthBand(0.149)).toBe("light");
    expect(promoDepthBand(0.15)).toBe("typical");
    expect(promoDepthBand(0.299)).toBe("typical");
    expect(promoDepthBand(0.3)).toBe("deep");
    expect(promoDepthBand(1)).toBe("deep");
    expect(promoDepthBand(0)).toBeNull();
    expect(firstOrderDiscountShare(0, 0)).toBeNull();
    expect(promoMedianOffCopy(0.08)).toBe("about 8% off the first order");
    expect(promoMedianOffCopy(0.08)).not.toBe("about 10% off the first order");
  });

  const asOf = new Date("2024-06-01");

  function depthBook(): DepthOrder[] {
    const rows: DepthOrder[] = [];
    for (let i = 0; i < 10; i += 1) {
      rows.push(
        order(`l${i}`, "2024-01-01", 90, {
          discountAmount: 10,
          grossAmount: 90,
        }),
      );
      rows.push(
        order(`l${i}`, "2024-02-15", 40, {
          discountAmount: 0,
          grossAmount: 40,
        }),
      );
    }
    for (let i = 0; i < 10; i += 1) {
      rows.push(
        order(`t${i}`, "2024-01-01", 75, {
          discountAmount: 25,
          grossAmount: 75,
        }),
      );
      if (i < 5) {
        rows.push(
          order(`t${i}`, "2024-02-15", 30, {
            discountAmount: 5,
            grossAmount: 30,
          }),
        );
      }
    }
    for (let i = 0; i < 10; i += 1) {
      rows.push(
        order(`d${i}`, "2024-01-01", 40, {
          discountAmount: 40,
          grossAmount: 40,
        }),
      );
    }
    for (let i = 0; i < 10; i += 1) {
      rows.push(
        order(`f${i}`, "2024-01-01", 100, { discountAmount: 0, grossAmount: 100 }),
      );
      rows.push(
        order(`f${i}`, "2024-02-15", 50, { discountAmount: 0, grossAmount: 50 }),
      );
    }
    for (let i = 0; i < 2; i += 1) {
      rows.push(order(`a${i}`, "2024-01-01", 80, { discountAmount: 20 }));
    }
    rows.push(order("u0", "2024-01-01", 80));
    return rows;
  }

  it("seals depth windows, lift vs full price, later full price, and after refunds", () => {
    const view = buildPromoLtv(depthBook(), asOf);
    expect(view.depthEmpty).toBeNull();
    expect(view.depthAwaitingGross).toBe(2);
    expect(view.depthBands.map((band) => band.band)).toEqual([
      "light",
      "typical",
      "deep",
    ]);
    const light = view.depthBands[0]!;
    const typical = view.depthBands[1]!;
    const deep = view.depthBands[2]!;
    expect(light.buyers).toBe(10);
    expect(light.day90Ltv).toBe(130);
    expect(light.comeBack90).toBe(1);
    expect(light.lift90).toBeCloseTo(130 / 150, 5);
    expect(light.laterFullPrice90).toBe(1);
    expect(light.afterRefunds90).toBe(true);
    expect(light.day365Ltv).toBeNull();
    expect(typical.day90Ltv).toBe(90);
    expect(typical.comeBack90).toBeCloseTo(0.5, 5);
    expect(typical.laterFullPrice90).toBe(0);
    expect(deep.day90Ltv).toBe(40);
    expect(deep.comeBack90).toBe(0);
    expect(deep.laterFullPrice90).toBeNull();
    expect(view.depthLine?.label).toBe("Light");
    expect(view.depthLine?.worth).toBe(130);
    expect(view.depthLine?.worthDays).toBe(90);
    expect(view.depthLine?.lift).toBeCloseTo(130 / 150, 5);
    expect(view.depthLine?.comeBack).toBe(1);
    expect(view.rows.some((row) => row.promo === PROMO_FULL_PRICE)).toBe(true);
    expect(view.rows.some((row) => row.promo === PROMO_UNNAMED)).toBe(true);
  });

  it("keeps a named-code percent off the card until 8 starters have a known share", () => {
    const rows: DepthOrder[] = [];
    for (let i = 0; i < 10; i += 1) {
      rows.push(
        order(`w${i}`, "2024-01-01", 92, {
          discountCode: "WELCOME10",
          discountAmount: 8,
          grossAmount: i < 3 ? 92 : undefined,
        }),
      );
    }
    for (let i = 0; i < 8; i += 1) {
      rows.push(order(`f${i}`, "2024-01-01", 100, { discountAmount: 0, grossAmount: 100 }));
    }
    const thin = buildPromoLtv(rows, asOf);
    expect(thin.rows.find((row) => row.promo === "WELCOME10")?.medianFirstShare).toBeNull();

    const known: DepthOrder[] = [];
    for (let i = 0; i < 10; i += 1) {
      known.push(
        order(`w${i}`, "2024-01-01", 92, {
          discountCode: "WELCOME10",
          discountAmount: 8,
          grossAmount: 92,
        }),
      );
    }
    for (let i = 0; i < 8; i += 1) {
      known.push(order(`f${i}`, "2024-01-01", 100, { discountAmount: 0, grossAmount: 100 }));
    }
    const view = buildPromoLtv(known, asOf);
    const welcome = view.rows.find((row) => row.promo === "WELCOME10");
    expect(welcome?.medianFirstShare).toBeCloseTo(0.08, 5);
    expect(promoMedianOffCopy(welcome!.medianFirstShare!)).toBe(
      "about 8% off the first order",
    );
  });

  it("does not count later orders outside 90 days or with an unknown discount", () => {
    const rows: DepthOrder[] = [];
    for (let i = 0; i < 10; i += 1) {
      rows.push(
        order(`l${i}`, "2024-01-01", 90, {
          discountAmount: 10,
          grossAmount: 90,
        }),
      );
      rows.push(order(`l${i}`, "2024-02-01", 20));
      rows.push(
        order(`l${i}`, "2024-05-15", 20, {
          discountAmount: 0,
          grossAmount: 20,
        }),
      );
    }
    for (let i = 0; i < 8; i += 1) {
      rows.push(order(`f${i}`, "2024-01-01", 80, { discountAmount: 0, grossAmount: 80 }));
    }
    const view = buildPromoLtv(rows, asOf);
    expect(view.depthBands[0]?.laterFullPrice90).toBeNull();
    expect(view.depthBands[0]?.afterRefunds90).toBe(false);
  });

  it("puts a fully covered first order in Deep", () => {
    const rows: DepthOrder[] = [];
    for (let i = 0; i < 8; i += 1) {
      rows.push(
        order(`d${i}`, "2024-01-01", 0, {
          discountAmount: 50,
          grossAmount: 0,
        }),
      );
    }
    for (let i = 0; i < 8; i += 1) {
      rows.push(order(`f${i}`, "2024-01-01", 40, { discountAmount: 0, grossAmount: 40 }));
    }
    const view = buildPromoLtv(rows, asOf);
    expect(view.depthBands.map((band) => band.band)).toEqual(["deep"]);
    expect(view.depthBands[0]?.day90Ltv).toBe(0);
    expect(firstOrderDiscountShare(50, 0)).toBe(1);
  });

  it("withholds the year when history is limited", () => {
    const yearAsOf = new Date("2025-02-01");
    const open = buildPromoLtv(depthBook(), yearAsOf);
    expect(open.depthBands[0]?.day365Ltv).toBe(130);
    const capped = buildPromoLtv(depthBook(), yearAsOf, { historyLimited: true });
    expect(capped.historyLimited).toBe(true);
    expect(capped.depthBands.every((band) => band.day365Ltv == null)).toBe(true);
    expect(capped.rows.every((row) => row.day365Ltv == null)).toBe(true);
    expect(capped.fullPrice365).toBeNull();
    expect(capped.read?.yearPending).toBe(true);
  });

  it("uses thin and young empties instead of invented bands", () => {
    const thinRows: DepthOrder[] = [];
    for (let i = 0; i < 3; i += 1) {
      thinRows.push(
        order(`l${i}`, "2024-01-01", 90, { discountAmount: 10, grossAmount: 90 }),
      );
      thinRows.push(
        order(`t${i}`, "2024-01-01", 80, { discountAmount: 20, grossAmount: 80 }),
      );
      thinRows.push(
        order(`d${i}`, "2024-01-01", 40, { discountAmount: 40, grossAmount: 40 }),
      );
    }
    for (let i = 0; i < 10; i += 1) {
      thinRows.push(
        order(`f${i}`, "2024-01-01", 50, { discountAmount: 0, grossAmount: 50 }),
      );
    }
    const thin = buildPromoLtv(thinRows, asOf);
    expect(thin.read).not.toBeNull();
    expect(thin.depthBands).toEqual([]);
    expect(thin.depthEmpty?.kind).toBe("thin");
    expect(thin.depthEmpty?.verb).toBe("Watch first 30 days");

    const youngRows: DepthOrder[] = [];
    for (let i = 0; i < 10; i += 1) {
      youngRows.push(
        order(`l${i}`, "2024-05-20", 90, { discountAmount: 10, grossAmount: 90 }),
      );
    }
    const young = buildPromoLtv(youngRows, new Date("2024-06-01"));
    expect(young.depthLine).toBeNull();
    expect(young.depthEmpty?.kind).toBe("young");
    expect(young.depthEmpty?.verb).toBe("Wait for day 30");
  });
});

describe("promoDepthEmptyState", () => {
  it("names gross / thin / young and stays quiet once a band has sealed", () => {
    expect(
      promoDepthEmptyState({
        discountsKnown: false,
        sealed: false,
        classifiable: 0,
        awaitingGross: 4,
        bandReady: false,
      }),
    ).toBeNull();
    expect(
      promoDepthEmptyState({
        discountsKnown: true,
        sealed: false,
        classifiable: 0,
        awaitingGross: 4,
        bandReady: false,
      })?.kind,
    ).toBe("gross");
    expect(
      promoDepthEmptyState({
        discountsKnown: true,
        sealed: false,
        classifiable: 3,
        awaitingGross: 0,
        bandReady: false,
      })?.kind,
    ).toBe("thin");
    expect(
      promoDepthEmptyState({
        discountsKnown: true,
        sealed: false,
        classifiable: 10,
        awaitingGross: 0,
        bandReady: true,
      })?.kind,
    ).toBe("young");
    expect(
      promoDepthEmptyState({
        discountsKnown: true,
        sealed: true,
        classifiable: 10,
        awaitingGross: 1,
        bandReady: true,
      }),
    ).toBeNull();
  });
});
