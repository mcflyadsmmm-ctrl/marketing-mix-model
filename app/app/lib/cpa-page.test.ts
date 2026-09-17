import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const cpa = readFileSync(join(here, "../routes/app.cpa.tsx"), "utf8");
const desk = readFileSync(join(here, "./cpa-desk.ts"), "utf8");
const cards = readFileSync(join(here, "../components/CpaWindowCards.tsx"), "utf8");
const payback = readFileSync(join(here, "../components/CpaPaybackDesk.tsx"), "utf8");
const explorer = readFileSync(join(here, "../components/CpaExplorer.tsx"), "utf8");

describe("CPA page", () => {
  it("contrasts Shopify Analytics ads-manager CPA with entered spend ÷ Shopify buyers", () => {
    expect(cpa).toContain("CPA_CONTRAST");
    expect(desk).toContain("Shopify Analytics shows");
    expect(desk).toContain("This page shows");
    expect(desk).toMatch(/ads-manager|platform CPA/i);
    expect(desk).toContain("entered spend");
    expect(desk).toContain("Shopify buyers");
  });

  it("keeps clocks on This month / Last 28 cards, not chrome PeriodControl", () => {
    expect(cpa).toContain("showPeriod={false}");
    expect(cpa).toContain("<CpaWindowCards");
    expect(cpa).toContain("This month and Last 28 live on the cards");
    expect(desk).toContain('this_month: "This month"');
    expect(desk).toContain('last_28: "Last 28 days"');
    expect(cards).toContain("window.rangeLabel");
    expect(cpa).not.toContain("<PeriodControl");
  });

  it("hides the window cards until spend and never paints $0 CPA", () => {
    expect(cpa).toContain("hasSpend ? (");
    expect(cpa).toContain("<CpaWindowCards");
    expect(cpa).toContain("CPA_EMPTY_SPEND");
    expect(cpa).not.toContain("<BookFactGrid");
    expect(cpa).not.toContain("0.00");
    expect(cards).toContain('hasSpend ? formatCurrency(window.spend, currency) : "—"');
    expect(cards).toContain("moneyOrDash(window.cashCpa");
    expect(cards).toContain("never $0");
  });

  it("builds payback vs first-90 as a desk, not a second fact grid", () => {
    expect(cpa).toContain("<CpaPaybackDesk");
    expect(payback).toContain("Payback vs first 90");
    expect(payback).toContain("Cash CAC");
    expect(payback).toContain("First 90 days");
    expect(payback).toContain("Value vs cost");
    expect(payback).toContain("never a fake $0");
    expect(payback).not.toContain("BookFactGrid");
  });

  it("mounts an Overview-grade CPA explorer and refuses SpendExplorer", () => {
    expect(cpa).toContain("<CpaExplorer");
    expect(cpa).not.toContain("SpendExplorer");
    expect(explorer).toContain("Cash CPA explorer");
    expect(explorer).toContain("CPA_EXPLORER_RANGES");
    expect(explorer).toContain("this_month");
    expect(explorer).toContain("last_28");
    expect(explorer).toContain("mcfly-chart__tip");
    expect(explorer).toContain("typical CPA");
    expect(explorer).toContain("never a fake $0");
  });

  it("links Spend Upload and LTV", () => {
    expect(cpa).toContain('href="/app/spend"');
    expect(cpa).toContain('href="/app/ltv"');
  });
});
