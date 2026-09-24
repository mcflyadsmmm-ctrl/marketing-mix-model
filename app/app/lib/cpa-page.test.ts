import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const cpa = readFileSync(join(here, "../routes/app.cpa.tsx"), "utf8");
const spend = readFileSync(join(here, "../routes/app.spend.tsx"), "utf8");
const desk = readFileSync(join(here, "./cpa-desk.ts"), "utf8");
const cards = readFileSync(join(here, "../components/CpaWindowCards.tsx"), "utf8");
const payback = readFileSync(join(here, "../components/CpaPaybackDesk.tsx"), "utf8");
const explorer = readFileSync(join(here, "../components/CpaExplorer.tsx"), "utf8");

describe("CPA page", () => {
  it("keeps /app/cpa on the CPA screen", () => {
    expect(cpa).toContain("requireAdmin");
    expect(cpa).toContain("spendLoader");
    expect(cpa).toContain('retryHref="/app/cpa"');
    expect(cpa).not.toContain("throw redirect");
    expect(cpa).not.toContain("<CpaWindowCards");
    expect(cpa).not.toContain("authenticate.admin");
  });

  it("contrasts Shopify Analytics ads-manager CPA with entered spend ÷ Shopify buyers", () => {
    expect(desk).toContain("Shopify Analytics shows");
    expect(desk).toContain("This page shows");
    expect(desk).toMatch(/ads-manager|platform CPA/i);
    expect(desk).toContain("entered spend");
    expect(desk).toContain("Shopify buyers");
  });

  it("keeps clocks on This month / Last 28 cards, not chrome PeriodControl in the CPA fold", () => {
    expect(spend).toContain("<CpaWindowCards");
    expect(desk).toContain('this_month: "This month"');
    expect(desk).toContain('last_28: "Last 28 days"');
    expect(cards).toContain("window.rangeLabel");
    expect(cards).toContain("mcfly-yoy__range");
    expect(cards).toContain("mcfly-yoy--cpa");
    expect(cards).not.toContain("mcfly-yoy--glance");
    expect(cpa).not.toContain("<PeriodControl");
  });

  it("hides the window cards until spend and never paints $0 CPA", () => {
    expect(spend).toContain("cpaHasSpend ? (");
    expect(spend).toContain("<CpaWindowCards");
    expect(spend).toContain("CPA_EMPTY_SPEND");
    expect(spend).not.toContain("<BookFactGrid");
    expect(spend).not.toContain("0.00×");
    expect(cards).toContain('hasSpend ? formatCurrency(window.spend, currency) : "—"');
    expect(cards).toContain("moneyOrDash(window.cashCpa");
    expect(cards).toContain("never $0");
  });

  it("does not mount CpaExplorer when spend is empty — honest lede only", () => {
    const cpaFoldStart = spend.indexOf('id="mcfly-cpa"');
    const cpaFoldEnd = spend.indexOf("</DeskLane>", spend.indexOf('id="mcfly-cpa"'));
    const cpaFold = spend.slice(cpaFoldStart, cpaFoldEnd);
    expect(cpaFold).toContain("CPA_EMPTY_SPEND");
    expect(cpaFold).toContain("{cpaHasSpend ? (");
    expect(cpaFold).toContain("<CpaExplorer");
    expect(cpaFold).toContain("<CpaWindowCards");
    expect(cpaFold).not.toContain("<SpendExplorer");
    const explorerAt = cpaFold.lastIndexOf("<CpaExplorer");
    const gateAt = cpaFold.lastIndexOf("{cpaHasSpend ? (", explorerAt);
    expect(gateAt).toBeGreaterThan(-1);
    expect(gateAt).toBeLessThan(explorerAt);
  });

  it("builds payback vs first-90 as a desk, not a second fact grid", () => {
    expect(spend).toContain(
      'import { CpaPaybackDesk } from "../components/CpaPaybackDesk"',
    );
    expect(spend).toContain("<CpaPaybackDesk");
    expect(payback).toContain("Payback vs first 90");
    expect(payback).toContain("Cash CAC");
    expect(payback).toContain("First 90 days");
    expect(payback).toContain("Value vs cost");
    expect(payback).toContain("never a fake $0");
    expect(payback).not.toContain("BookFactGrid");
  });

  it("Spend first fold copies the pair and names an Online line", () => {
    const viewport = readFileSync(
      join(here, "../components/SpendFirstViewport.tsx"),
      "utf8",
    );
    expect(viewport).toContain("CopySpendPair");
    expect(spend).toContain("spendPairCopyText");
    expect(spend).toContain("formatOnlineRoasLine");
    expect(spend).toContain("pairCoverage.caption");
    expect(spend).not.toContain("true ROAS");
  });

  it("public SAMPLE payback uses the Snowdevil book and does not force historyLimited", () => {
    const demo = readFileSync(join(here, "../routes/demo.spend.tsx"), "utf8");
    expect(demo).toContain("data.ltv.revenue30");
    expect(demo).toContain("data.ltv.revenue90");
    expect(demo).toContain("cashPaybackDays");
    expect(demo).toContain("historyLimited={false}");
    expect(demo).not.toMatch(/avgRevenueD30:\s*null/);
    expect(demo).not.toMatch(/<CpaPaybackDesk[\s\S]*historyLimited\s*\/>/);
  });

  it("payback names day-0 as the start, not earned $0 LTV or ads-manager payback", () => {
    expect(payback).toContain("Day 0 is the start");
    expect(payback).toContain("not earned LTV");
    expect(payback).toContain("not ads-manager payback");
    expect(payback).toContain("value > 0");
    expect(payback).not.toContain("causal payback");
  });

  it("mounts an Overview-grade CPA explorer on Spend and refuses SpendExplorer inside CPA", () => {
    expect(spend).toContain("<CpaExplorer");
    expect(explorer).toContain("Cash CPA explorer");
    expect(explorer).toContain("cpaExplorerRangesFor");
    expect(explorer).toContain("this_month");
    expect(explorer).toContain("last_28");
    expect(explorer).toContain("mcfly-chart__tip");
    expect(explorer).toContain("typical CPA");
    expect(explorer).toContain("never a fake $0");
    const cpaFoldStart = spend.indexOf('id="mcfly-cpa"');
    const cpaFold = spend.slice(cpaFoldStart);
    expect(cpaFold).not.toContain("<SpendExplorer");
  });

  it("links LTV and keep add-a-day on Spend", () => {
    expect(spend).toContain('id="mcfly-spend-add"');
    expect(spend).toContain('id="mcfly-cpa"');
  });

  it("unpaid CPA does not offer a finished YTD; Last 28 / This month use closed days", () => {
    expect(desk).toContain("cpaExplorerRangesFor");
    expect(desk).toContain("CPA_CLOSED_DAY_CLOCK");
    expect(desk).toMatch(
      /export function cpaExplorerRangesFor\(\s*orderBookDepth: LiveIngestDepth/,
    );
    expect(desk).toContain('case "trial_slice"');
    expect(desk).toContain('case "paid_full"');
    expect(desk).toMatch(/const _never: never = orderBookDepth/);
    expect(explorer).toContain("orderBookDepth: LiveIngestDepth");
    expect(explorer).not.toMatch(/orderBookDepth\?:/);
    expect(explorer).toContain("cpaExplorerRangesFor(orderBookDepth)");
    expect(explorer).toContain("todaySalesTruncated");
    expect(explorer).toContain("CPA_CLOSED_DAY_CLOCK");
    expect(cards).toContain("todaySalesTruncated");
    expect(cards).toContain("CPA_CLOSED_DAY_CLOCK");
    expect(spend).toMatch(/<CpaExplorer[\s\S]*orderBookDepth=\{orderBookDepth\}/);
    expect(spend).toMatch(/<CpaExplorer[\s\S]*todaySalesTruncated=\{/);
    expect(spend).toMatch(/<CpaWindowCards[\s\S]*todaySalesTruncated=\{/);
    expect(spend).not.toContain("UnlockFullHistoryBanner");
    expect(spend).toMatch(/never 0×|never a fake \$0/);
    const demo = readFileSync(join(here, "../routes/demo.spend.tsx"), "utf8");
    expect(demo).toMatch(/<CpaExplorer[\s\S]*orderBookDepth="paid_full"/);
  });
});
