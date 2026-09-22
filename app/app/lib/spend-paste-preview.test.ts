import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cashPaybackDays } from "./cash-payback";
import {
  previewSpendPaste,
  uniqueCountForDays,
  type SpendPasteBook,
} from "./spend-paste-preview";

const here = dirname(fileURLToPath(import.meta.url));

function book(partial: Partial<SpendPasteBook> = {}): SpendPasteBook {
  return {
    certifiedSalesByDay: {
      "2026-09-18": 400,
      "2026-09-19": 600,
    },
    buyerDays: [
      {
        dateKey: "2026-09-18",
        identifiedBuyers: 4,
        newCustomers: 2,
        buyersKnown: true,
      },
      {
        dateKey: "2026-09-19",
        identifiedBuyers: 6,
        newCustomers: 3,
        buyersKnown: true,
      },
    ],
    salesFloorKey: "2024-09-21",
    salesPending: false,
    first30: 80,
    first90: 120,
    first365: 200,
    historyLimited: false,
    liveBuyerIndex: null,
    ...partial,
  };
}

const TWO_DAY_META_GOOGLE = `Day,Meta,Google
2026-09-18,100,50
2026-09-19,150,50`;

describe("Spend paste preview — empty writes", () => {
  it("blank paste writes nothing and keeps the cash trio as null", () => {
    const preview = previewSpendPaste("   ", book());
    expect(preview.writeNothing).toBe(true);
    expect(preview.days).toBe(0);
    expect(preview.totalAmount).toBe(0);
    expect(preview.totalRoas).toBeNull();
    expect(preview.cashCpa).toBeNull();
    expect(preview.paybackDays).toBeNull();
    expect(preview.metaRoas).toBeUndefined();
  });

  it("header-only paste writes nothing", () => {
    const preview = previewSpendPaste("Day,Meta,Google\n", book());
    expect(preview.writeNothing).toBe(true);
    expect(preview.days).toBe(0);
    expect(preview.totalRoas).toBeNull();
    expect(preview.cashCpa).toBeNull();
    expect(preview.paybackDays).toBeNull();
  });

  it("all-zero amounts write nothing (parser skips 0)", () => {
    const preview = previewSpendPaste(
      `Day,Meta
2026-09-18,0
2026-09-19,0.00`,
      book(),
    );
    expect(preview.writeNothing).toBe(true);
    expect(preview.days).toBe(0);
    expect(preview.totalRoas).toBeNull();
    expect(preview.cashCpa).toBeNull();
    expect(preview.paybackDays).toBeNull();
  });
});

describe("Spend paste preview — these pasted days", () => {
  it("shows days, labels, and total for a Meta+Google paste", () => {
    const preview = previewSpendPaste(TWO_DAY_META_GOOGLE, book());
    expect(preview.writeNothing).toBe(false);
    expect(preview.days).toBe(2);
    expect(preview.totalAmount).toBe(350);
    expect(preview.labels).toEqual(expect.arrayContaining(["Meta", "Google"]));
    expect(preview.from).toBe("2026-09-18");
    expect(preview.to).toBe("2026-09-19");
    expect(preview.scopeLabel).toBe("these pasted days");
  });

  it("computes Total ROAS on the sales∩spend intersection, not a Meta ROAS", () => {
    const preview = previewSpendPaste(TWO_DAY_META_GOOGLE, book());
    // sales 400+600=1000, spend 150+200=350
    expect(preview.totalRoas).toBeCloseTo(1000 / 350, 5);
    expect(preview.metaRoas).toBeUndefined();
    expect(preview.platformCpa).toBeUndefined();
  });

  it("Cash CPA is intersection spend ÷ identified buyers on those days", () => {
    const preview = previewSpendPaste(TWO_DAY_META_GOOGLE, book());
    expect(preview.cashCpa).toBeCloseTo(350 / 10, 5);
  });

  it("payback uses spend ÷ new buyers against first-90 order history", () => {
    const preview = previewSpendPaste(TWO_DAY_META_GOOGLE, book());
    const cashCac = 350 / 5;
    expect(preview.paybackDays).toBe(
      cashPaybackDays(cashCac, 80, 120, 200),
    );
  });
});

describe("Spend paste preview — honesty", () => {
  it("keeps Total ROAS as null when any in-window pasted day lacks a sales fact", () => {
    const preview = previewSpendPaste(TWO_DAY_META_GOOGLE, book({
      certifiedSalesByDay: { "2026-09-18": 400 },
    }));
    expect(preview.writeNothing).toBe(false);
    expect(preview.totalRoas).toBeNull();
    expect(preview.salesFactDays).toBe(1);
    expect(preview.inWindowDays).toBe(2);
    expect(preview.roasReason).toMatch(/1 day/i);
    expect(preview.roasReason).toMatch(/sales/i);
    // Do not inflate ROAS by dropping the quiet day from spend.
    expect(preview.totalAmount).toBe(350);
  });

  it("does not invent sales for days before the sales floor", () => {
    const preview = previewSpendPaste(
      `Day,Meta
2023-01-01,80
2026-09-18,100`,
      book({ salesFloorKey: "2024-09-21" }),
    );
    expect(preview.salesWindowWarning).toMatch(/before/i);
    expect(preview.totalRoas).toBeCloseTo(400 / 100, 5);
    expect(preview.inWindowDays).toBe(1);
  });

  it("pending sales keep the trio as null, not $0", () => {
    const preview = previewSpendPaste(
      TWO_DAY_META_GOOGLE,
      book({ salesPending: true }),
    );
    expect(preview.totalRoas).toBeNull();
    expect(preview.cashCpa).toBeNull();
    expect(preview.paybackDays).toBeNull();
    expect(preview.roasReason).toMatch(/pending|loading/i);
  });

  it("zero buyers keep Cash CPA and payback as null", () => {
    const preview = previewSpendPaste(
      TWO_DAY_META_GOOGLE,
      book({
        buyerDays: [
          {
            dateKey: "2026-09-18",
            identifiedBuyers: 0,
            newCustomers: 0,
            buyersKnown: true,
          },
          {
            dateKey: "2026-09-19",
            identifiedBuyers: 0,
            newCustomers: 0,
            buyersKnown: true,
          },
        ],
      }),
    );
    expect(preview.totalRoas).toBeCloseTo(1000 / 350, 5);
    expect(preview.cashCpa).toBeNull();
    expect(preview.paybackDays).toBeNull();
    expect(preview.cpaReason).toMatch(/buyer/i);
  });

  it("unsealed first-90 keeps payback as null with an on-file note", () => {
    const preview = previewSpendPaste(
      TWO_DAY_META_GOOGLE,
      book({ first90: null, historyLimited: true }),
    );
    expect(preview.paybackDays).toBeNull();
    expect(preview.paybackReason).toMatch(/first.?90/i);
  });

  it("a failed parse writes nothing and names the first error", () => {
    const preview = previewSpendPaste("not a csv at all", book());
    expect(preview.writeNothing).toBe(true);
    expect(preview.firstError).toBeTruthy();
    expect(preview.totalRoas).toBeNull();
  });
});

describe("Spend paste preview — Live unique OrderFacts", () => {
  it("uniques a buyer who ordered on two pasted days, not the daily sum", () => {
    const preview = previewSpendPaste(
      TWO_DAY_META_GOOGLE,
      book({
        buyerDays: [
          {
            dateKey: "2026-09-18",
            identifiedBuyers: 4,
            newCustomers: 2,
            buyersKnown: false,
          },
          {
            dateKey: "2026-09-19",
            identifiedBuyers: 6,
            newCustomers: 3,
            buyersKnown: false,
          },
        ],
        liveBuyerIndex: {
          identifiedByDay: {
            "2026-09-18": [1, 2, 3, 4],
            "2026-09-19": [4, 5, 6, 7, 8, 9],
          },
          newByDay: {
            "2026-09-18": [1, 2],
            "2026-09-19": [5, 6, 7],
          },
        },
      }),
    );
    expect(preview.cashCpa).toBeCloseTo(350 / 9, 5);
    expect(preview.paybackDays).toBe(cashPaybackDays(350 / 5, 80, 120, 200));
  });

  it("keeps Cash CPA as — when any pasted day is missing from the Live index", () => {
    const preview = previewSpendPaste(
      TWO_DAY_META_GOOGLE,
      book({
        buyerDays: [],
        liveBuyerIndex: {
          identifiedByDay: { "2026-09-18": [1, 2] },
          newByDay: { "2026-09-18": [1] },
        },
      }),
    );
    expect(preview.cashCpa).toBeNull();
    expect(preview.paybackDays).toBeNull();
    expect(preview.cpaReason).toMatch(/buyer/i);
  });

  it("treats a quiet Live day as known-zero so the other pasted days still unique", () => {
    const preview = previewSpendPaste(
      TWO_DAY_META_GOOGLE,
      book({
        buyerDays: [],
        liveBuyerIndex: {
          identifiedByDay: {
            "2026-09-18": [1, 2, 3, 4],
            "2026-09-19": [],
          },
          newByDay: {
            "2026-09-18": [1, 2],
            "2026-09-19": [],
          },
        },
      }),
    );
    expect(preview.cashCpa).toBeCloseTo(350 / 4, 5);
    expect(preview.paybackDays).toBe(cashPaybackDays(350 / 2, 80, 120, 200));
  });

  it("does not invent Cash CPA from Live daily CPA points with buyersKnown false", () => {
    const preview = previewSpendPaste(
      TWO_DAY_META_GOOGLE,
      book({
        liveBuyerIndex: null,
        buyerDays: [
          {
            dateKey: "2026-09-18",
            identifiedBuyers: 4,
            newCustomers: 2,
            buyersKnown: false,
          },
          {
            dateKey: "2026-09-19",
            identifiedBuyers: 6,
            newCustomers: 3,
            buyersKnown: false,
          },
        ],
      }),
    );
    expect(preview.cashCpa).toBeNull();
    expect(preview.paybackDays).toBeNull();
  });
});

describe("uniqueCountForDays", () => {
  it("unions interned ids across days and treats a missing day as unknown", () => {
    expect(
      uniqueCountForDays(
        { "2026-09-18": [1, 2], "2026-09-19": [2, 3] },
        ["2026-09-18", "2026-09-19"],
      ),
    ).toEqual({ known: true, count: 3 });
    expect(
      uniqueCountForDays({ "2026-09-18": [1] }, ["2026-09-18", "2026-09-19"]),
    ).toEqual({ known: false, count: 0 });
    expect(uniqueCountForDays({ "2026-09-18": [] }, ["2026-09-18"])).toEqual({
      known: true,
      count: 0,
    });
  });
});

describe("Spend paste densify — first fold wiring", () => {
  const spend = readFileSync(join(here, "../routes/app.spend.tsx"), "utf8");
  const previewSrc = readFileSync(join(here, "./spend-paste-preview.ts"), "utf8");
  const importRoute = readFileSync(
    join(here, "../routes/app.spend.import.tsx"),
    "utf8",
  );
  const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");

  it("puts a paste box beside Add a day on the empty live first fold and reuses parseSpendCsv", () => {
    expect(spend).toContain("previewSpendPaste");
    expect(previewSrc).toContain("parseSpendCsv");
    expect(previewSrc).not.toContain("function parseSpend");
    expect(spend).toContain("these pasted days");
    expect(spend).toContain("emptyLiveSpend");
    const firstLaneStart = spend.indexOf('<DeskLane rank="first"');
    const firstLaneEnd = spend.indexOf("<DeskLane", firstLaneStart + 1);
    const firstLane = spend.slice(firstLaneStart, firstLaneEnd);
    expect(firstLane).toContain('id="mcfly-spend-add"');
    expect(firstLane).toContain("mcfly-spend-paste");
    expect(firstLane).toContain('intent" value="csv"');
    expect(firstLane).toContain("This file is ad spend only");
    expect(spend).not.toContain("metaRoas");
    expect(spend).not.toContain("Meta ROAS");
  });

  it("keeps file upload on import and does not add a Spend chip or Overview ROAS", () => {
    expect(importRoute).toContain("previewSpendPaste");
    expect(importRoute).toContain('type="file"');
    expect(importRoute).toContain("Add one bill");
    expect(spend).not.toContain('label="Paste spend"');
    expect(overview).not.toContain("previewSpendPaste");
    expect(overview).not.toContain("mcfly-spend-paste");
  });

  it("Live paste book uses unique OrderFacts, not CPA daily buyersKnown", () => {
    const spendStack = readFileSync(
      join(here, "./desk-spend-stack.server.ts"),
      "utf8",
    );
    expect(spend).toContain("liveBuyerIndex");
    expect(spendStack).toContain("buildLivePasteBuyerIndex");
    expect(importRoute).toContain("liveBuyerIndex");
    expect(importRoute).toContain("buildLivePasteBuyerIndex");
    expect(importRoute).toContain("buildTillLtvSummary");
    expect(importRoute).not.toContain("buyerDays: []");
  });

  it("csv paste save shows the Spend saved banner", () => {
    expect(spend).not.toContain("actionData?.success && !actionData.csv");
    expect(spend).toContain("actionData?.success");
  });

  it("import paste write is a Live door while SAMPLE stays a read-only ledger", () => {
    expect(importRoute).toContain("Paste is a Live door");
    expect(importRoute).toContain("SAMPLE stays a read-only ledger");
  });
});
