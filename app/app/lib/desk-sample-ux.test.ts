import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  SAMPLE_BOOK_DAYS,
} from "./demo-sample-desk.server";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

/**
 * Merchant chrome only. Comments may name a banned glossary word to explain
 * why the desk refuses it; a merchant never reads a comment.
 */
function chrome(rel: string) {
  return read(rel)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

describe("Sample data | Live data UX", () => {
  it("desk paint uses SAMPLE USD when Sample is on so Snowdevil dollars are not —", () => {
    const shell = read("../routes/app.tsx");
    expect(shell).toContain("deskPaintCurrency");
    expect(shell).toContain("sampleOn: useSampleDesk");
    expect(shell).not.toContain('parseShopCurrencyCode(shop.currencyCode) ?? ""');
    const money = read("spend-money.ts");
    expect(money).toContain("SAMPLE_DESK_CURRENCY = \"USD\"");
    expect(money).toContain("if (opts.sampleOn) return SAMPLE_DESK_CURRENCY");
  });

  it("shot mode still labels Sample data (App Store 1.1.4)", () => {
    const bar = read("../components/DataModeBar.tsx");
    expect(bar).toContain("shotMode");
    expect(bar).toContain('shotMode ? "mcfly-data-mode--shot"');
    expect(bar).toContain("mcfly-data-mode--shot");
    expect(bar).toContain("sampleHint");
    expect(bar).toContain("if (!useSampleDesk) return null");
    const shell = read("../routes/app.tsx");
    expect(shell).toContain("shotMode={shotMode}");
    expect(shell).not.toMatch(/\{!shotMode \? \(/);
    const css = read("../styles/mcfly-desk.css");
    expect(css).toMatch(/mcfly-desk--shot\.mcfly-desk--sample::after/);
    expect(css).toMatch(/content:\s*"SAMPLE DATA"/);
  });

  it("Sample | Live switching lives in Settings, not a leftover Viewing toggle", () => {
    const bar = read("../components/DataModeBar.tsx");
    expect(bar).toContain("sampleData");
    expect(bar).toContain("sampleHint");
    expect(bar).toContain("Switch in Settings");
    expect(bar).toContain("sampleOnlyFreeze");
    expect(bar).toContain("Live is parked until launch");
    expect(bar).toContain("if (!useSampleDesk) return null");
    expect(bar).not.toContain("<Form");
    expect(bar).not.toContain('id="mcfly-data-mode-label"');
    expect(bar).not.toContain("liveDataHint");
    expect(bar).not.toMatch(/Turn SAMPLE preview OFF/);
    expect(bar).not.toContain("Before App Store review");
    expect(bar).not.toContain("s-banner");
    expect(bar).not.toContain("setupAddSpend");
    const labels = read("../lib/product-labels.ts");
    expect(labels).toContain('sampleData: "Sample data"');
    expect(labels).toContain('liveData: "Live data"');
    expect(labels).toContain("Switch to Sample data in Settings");
    expect(labels).toMatch(/sampleHint:\s*"Snowdevil/);
    expect(labels).not.toMatch(/sampleHint:[\s\S]{0,200}Harbor/);
  });

  it("Sample data preview uses the data-mode POST, not /app/demo", () => {
    const cta = read("../components/UseSampleCta.tsx");
    expect(cta).toContain('name="intent" value="use-sample"');
    expect(cta).toContain('action={`/app/data-mode${location.search}`}');
    expect(cta).toContain("reloadDocument");
    expect(cta).toContain("mcfly-btn");
    expect(cta).toContain('type="submit"');
    expect(cta).not.toContain("s-button");
    expect(cta).not.toContain('href="/app/demo"');
  });

  it("Spend switches Sample to Live when saving spend", () => {
    const spend = read("../routes/app.spend.tsx");
    expect(spend).toMatch(/source:\s*"sample"/);
    expect(spend).toContain("setSampleDeskEnabled(shop.id, false)");
    expect(spend).toContain("isSampleOnlyFreeze()");
    expect(spend).toContain("Live is parked until launch");
    expect(spend).toContain("/app/spend/import");
    expect(spend).not.toContain("Upload is paused on Practice");
    expect(spend).not.toContain("Switch to Your store to upload");
    expect(spend).not.toContain("Switch to Live in Settings");
  });

  it("data-mode keeps SAMPLE through today without a 5-year rewrite", () => {
    const dataMode = read("../routes/app.data-mode.tsx");
    expect(dataMode).toContain("applySampleDeskIntent");
    expect(dataMode).not.toContain("seedThreeYearSampleDesk");
    const sampleDesk = read("sample-desk.server.ts");
    expect(sampleDesk).toContain("ensureSampleBookThroughToday");
    expect(sampleDesk).toContain("applySampleDeskIntent");
    expect(sampleDesk).toContain("sampleBookIsPaintable");
    expect(sampleDesk).not.toContain("SAMPLE_SEED_TX");
    expect(sampleDesk).not.toContain("timeout: 120_000");
    expect(sampleDesk).toContain("sampleSeedInFlight");
    expect(dataMode).toContain("export default function DataModeRoute");
    expect(dataMode).toContain('redirect(`/app/settings${url.search}`)');
    expect(dataMode).toContain("isSampleOnlyFreeze");
    expect(dataMode).toContain('intent === "use-real"');
  });

  it("Settings Sample switch posts to Settings with a native submit, not a blank data-mode GET", () => {
    const bar = read("../components/DataModeBar.tsx");
    const settings = read("../routes/app.settings.tsx");
    expect(bar).not.toMatch(/reloadDocument/);
    expect(bar).not.toContain('name="intent" value="use-real"');
    expect(settings).toContain("applySampleDeskIntent");
    expect(settings).toContain('name="intent" value="use-real"');
    expect(settings).toContain('name="intent" value="use-sample"');
    expect(settings).toContain('className="mcfly-btn mcfly-btn--primary"');
    expect(settings).toContain('type="submit"');
    expect(settings).toContain('url.pathname = "/app"');
    expect(settings).toContain("<Form method=\"post\" reloadDocument>");
    expect(settings).not.toMatch(/action=\{dataModeAction\} reloadDocument/);
    expect(settings).not.toContain("dataModeAction");
    expect(settings).not.toMatch(/window\.location\.(href|assign|replace)/);
    const serve = read("../../scripts/serve-with-site.mjs");
    expect(serve).toContain('app.set("trust proxy", true)');
    expect(serve).toContain("admin.shopify.com");
    expect(serve).toContain("allowedActionOrigins");
    const rrConfig = read("../../react-router.config.ts");
    expect(rrConfig).toContain("allowedActionOrigins");
    expect(rrConfig).toContain("admin.shopify.com");
    expect(rrConfig).toContain("mcfly-analytics.fly.dev");
  });

  it("Overview empty states do not send merchants to /app/demo", () => {
    const overview = read("../routes/app._index.tsx");
    const marketing = read("../components/MarketingSnapSection.tsx");
    expect(overview).not.toContain('href="/app/demo"');
    expect(overview).not.toContain("Switch to Sample data at the top");
    expect(marketing).toContain("NUMBER_HONESTY.empty");
    expect(marketing).not.toMatch(/\{NUMBER_HONESTY\.csvHint\}/);
    expect(marketing).not.toMatch(/\{NUMBER_HONESTY\.orderWindow\}/);
    expect(overview).not.toContain("<MarketingSnapSection");
    expect(overview).not.toContain("$0 · add spend");
    expect(overview).not.toContain("spendOnlyEmpty");
    // Overview is cards + chart; explorer remains on Total ROAS.
    expect(overview).not.toContain("mcfly-hero-compact");
    expect(overview).toContain("<OverviewYoyCards");
    expect(overview).toContain("<OverviewFirstViewport");
    expect(overview).toContain("<OverviewSalesChart");
    expect(overview).not.toContain("<SpendExplorer");
    expect(overview).not.toContain("NUMBER_HONESTY.empty");
    expect(marketing).toContain("NUMBER_HONESTY.empty");
  });

  it("Overview paints YoY sales cards without Total ROAS", () => {
    const overview = read("../routes/app._index.tsx");
    const yoyCards = read("../components/OverviewYoyCards.tsx");
    const book = read("../components/ShopifyBookSection.tsx");
    const ltvSnap = read("../components/LtvSnapSection.tsx");
    const labels = read("./product-labels.ts");
    expect(overview).toContain("<OverviewYoyCards");
    expect(overview).toContain("buildOverviewYoyCards");
    expect(overview).toContain("<OverviewFirstViewport");
    expect(overview).toContain("<OverviewSalesChart");
    expect(overview).not.toContain("<SpendExplorer");
    expect(overview).not.toContain("<ShopifyBookSection");
    expect(yoyCards).toContain("OVERVIEW_YOY_MISSING");
    expect(yoyCards).not.toContain("Total ROAS");
    expect(overview).toContain("shopifyNativePeriodStats");
    expect(book).toContain("PRODUCT_NOUN.bookTypicalOrder");
    expect(book).toContain("PRODUCT_NOUN.bookGuestCheckouts");
    expect(book).toContain("PRODUCT_NOUN.bookMostOrders");
    expect(book).toContain("PRODUCT_NOUN.bookWeekendSales");
    expect(book).toContain("PRODUCT_NOUN.bookBusiestWeekday");
    expect(book).toContain("PRODUCT_NOUN.bookOrdersPerBuyer");
    expect(book).toContain("PRODUCT_NOUN.bookSalesPerBuyer");
    expect(book).toContain("PRODUCT_NOUN.bookSalesClock");
    expect(book).toContain("PRODUCT_NOUN.bookReturnsEdits");
    expect(book).toContain("PRODUCT_NOUN.bookOneOrderBuyers");
    expect(book).toContain("PRODUCT_NOUN.bookDiscountedOrders");
    expect(book).toContain("PRODUCT_NOUN.bookItemsPerOrder");
    expect(book).toContain("PRODUCT_NOUN.bookTypicalDay");
    expect(book).toContain("PRODUCT_NOUN.bookSecondWithin30");
    expect(book).toContain("PRODUCT_NOUN.bookSecondVsThird");
    expect(book).toContain("PRODUCT_NOUN.bookSecondVsFirst");
    expect(yoyCards).not.toContain("bookSecondWithin30");
    expect(yoyCards).not.toContain("medianDailySales");
    expect(labels).toContain('bookTypicalOrder: "Typical order"');
    expect(labels).toContain('bookWeekendSales: "Weekend sales"');
    expect(book).toContain("New vs returning dollars");
    expect(ltvSnap).toContain("Cash CPA");
    expect(ltvSnap).toContain("First year");
    expect(ltvSnap).toContain("Repeat rate");
    expect(overview).not.toContain("loadOverviewGoalPeriods");
    expect(overview).not.toContain("<GoalsSnapSection");
    expect(overview).not.toContain("See spend mix");
    expect(overview).not.toContain("<DeskOverviewTabs");
  });

  it("Pass A book routes exist and old URLs redirect", () => {
    const customers = read("../routes/app.customers.tsx");
    const growth = read("../routes/app.growth.tsx");
    const orders = read("../routes/app.orders.tsx");
    const buyers = read("../routes/app.buyers.tsx");
    const timing = read("../routes/app.timing.tsx");
    expect(customers).toContain("loadDeskSalesPage");
    expect(customers).toContain('groups={["buyers"]}');
    expect(customers).not.toContain("LtvSnapSection");
    expect(customers).not.toContain("cashCostPerCustomer");
    expect(growth).toContain("loadDeskSalesPage");
    expect(growth).toContain('groups={["growth"]}');
    expect(growth).toContain("tillLtv.repeatRate");
    expect(growth).toContain("/app/ltv");
    expect(growth).not.toContain("cashCac");
    expect(orders).toContain('groups={["period", "timing"]}');
    expect(orders).toContain("<WeekdaySalesChart");
    expect(customers).toContain("orderFactsTruncated");
    expect(growth).toContain("orderFactsTruncated");
    expect(orders).toContain("orderFactsTruncated");
    const deskPage = read("../lib/desk-sales-page.server.ts");
    expect(deskPage).toContain("getOrderBackfillProgress");
    const bookPage = read("../components/DeskBookPage.tsx");
    expect(bookPage).toContain("orderFactsTruncated");
    expect(bookPage).toMatch(/incomplete typical order[\s\S]*not \$0/);
    expect(buyers).toContain('throw redirect(`/app/customers');
    expect(timing).toContain('throw redirect(`/app/orders');
  });

  it("Overview stays Shopify-only — no spend doors, peeks stay dense", () => {
    const overview = read("../routes/app._index.tsx");
    const firstView = read("../components/OverviewFirstViewport.tsx");
    const goals = read("../components/GoalsSnapSection.tsx");
    const ltvSnap = read("../components/LtvSnapSection.tsx");
    const explorer = read("../components/SpendExplorer.tsx");

    expect(firstView).not.toContain("OVERVIEW_SPEND_EMPTY_LINE");
    expect(firstView).not.toContain("OVERVIEW_SPEND_DOOR_LINE");
    expect(firstView).not.toContain("QuietSpendDoor");
    expect(firstView).not.toContain("setupAddSpend");
    expect(firstView).not.toContain("Upload Spend");
    expect(firstView).not.toContain("Spend Upload");
    expect(firstView).not.toContain("Add spend to see Total ROAS");
    expect(firstView).not.toContain('label="Ad spend"');
    expect(firstView).not.toContain("returningCustomers.toLocaleString()");
    expect(firstView).not.toContain("spendHref");
    expect(firstView).not.toContain("0.00×");
    expect(firstView).not.toContain("Edit spend →");
    expect(firstView).not.toContain("EOM projected");
    expect(firstView).toContain("mcfly-kpi-grid--peeks");
    expect(firstView).toContain("mcfly-kpi--peek");

    expect(overview).not.toContain('slot="primary-action"');
    expect(overview).not.toContain("Update spend");
    expect(overview).not.toContain("Add more days of spend");
    expect(overview).not.toContain("See spend mix");
    expect(overview).not.toContain("PRODUCT_NOUN.setupAddSpend");
    expect(overview).not.toContain("<MarketingSnapSection");
    expect(overview).not.toContain("<PeriodControl");
    expect(overview).toContain("<OverviewYoyCards");
    expect(overview).toContain("<OverviewFirstViewport");
    expect(overview).toContain("<OverviewSalesChart");
    expect(overview.indexOf("<OverviewYoyCards")).toBeLessThan(
      overview.indexOf("<OverviewFirstViewport"),
    );
    expect(overview).not.toContain("<SpendExplorer");
    expect(overview).not.toContain("<ShopifyBookSection");
    expect(overview).toContain("deskStageFromHash");
    expect(overview).not.toContain("<DeskOverviewTabs");
    expect(overview).not.toContain('className="mcfly-overview-more"');

    const salesErrorStart = overview.indexOf('aria-label="Sales load error"');
    const salesErrorEnd = overview.indexOf("</section>", salesErrorStart);
    const salesError = overview.slice(salesErrorStart, salesErrorEnd);
    expect(salesError).toContain(
      "Sales didn’t load. Retry to see this shop’s orders.",
    );
    expect(salesError).not.toContain("Total ROAS");
    expect(salesError).not.toContain("PRODUCT_NOUN.totalRoas");
    expect(salesError).not.toContain("sales ÷ spend");

    expect(overview).toContain("`Shopify sales — ${metrics.period.label}`");
    expect(overview).not.toContain("`Total ROAS — ${metrics.period.label}`");

    expect(overview).not.toContain("DESK_SECTION.orders");
    expect(overview).not.toContain("<LtvSnapSection");
    expect(overview).not.toContain("<GoalsSnapSection");
    expect(overview).not.toContain("mcfly-tab-snaps");
    expect(overview).not.toContain("SHOPIFY LEDGERS");
    expect(overview).not.toContain("Cohorts");

    expect(goals).toContain("Open Goals");
    expect(goals).not.toContain('variant="primary"');
    expect(goals).not.toContain("setupAddSpend");

    expect(ltvSnap).not.toContain("wait on Marketing");
    expect(ltvSnap).not.toContain('variant="primary"');
    expect(ltvSnap).toContain("PRODUCT_NOUN.openLtv");

    expect(explorer).toContain("if (salesLead) return null");
    expect(explorer).toContain("{!salesLead && merLine");
    expect(explorer).toContain('? "Sales $"');
  });

  it("Overview is a dense Shopify scoreboard; book tabs keep KPI cards", () => {
    const book = read("../components/ShopifyBookSection.tsx");
    const deskPage = read("../components/DeskBookPage.tsx");
    const firstView = read("../components/OverviewFirstViewport.tsx");
    const goals = read("../components/GoalsSnapSection.tsx");
    const marketing = read("../components/MarketingSnapSection.tsx");
    const ltvSnap = read("../components/LtvSnapSection.tsx");

    for (const file of [book, firstView, goals, marketing, ltvSnap]) {
      expect(file).toContain("mcfly-book");
      expect(file).not.toContain("mcfly-tab-snap");
    }
    expect(book).not.toContain("mcfly-tab-snap__tile");
    expect(book).not.toContain("BookTile");
    expect(book).not.toContain("<h2>");

    expect(book).toContain("function periodHero");
    expect(book).toContain("function buyersHero");
    expect(book).toContain("function timingHero");
    expect(book).toContain("PRODUCT_NOUN.bookTypicalOrder");
    expect(book).toContain("Sales from returning customers");
    expect(book).toContain("PRODUCT_NOUN.bookWeekendSales");
    expect(book).toContain('className="mcfly-book__hero-v"');

    expect(book).toContain("function BookFactGrid");
    expect(book).toContain('className="mcfly-book__kpi"');
    expect(book).toContain("mcfly-book__kpi-hint");
    expect(book).not.toContain("<details");
    expect(book).toContain("mcfly-book__hero-sub");

    expect(book).toContain('className="mcfly-book__clock"');
    expect(book).toContain('className="mcfly-book__clock-k"');
    expect(book).toContain('{ k: "Original"');
    expect(book).toContain('{ k: "Product only"');

    for (const file of [book, ltvSnap, marketing]) {
      expect(file).toContain("Math.round(share * 100)");
      expect(file).not.toContain("formatPercent");
    }
    expect(firstView).toContain("Math.round(returningSalesShare * 100)");
    expect(firstView).not.toContain("formatPercent");

    expect(book).toContain("Top 10% of customers");
    expect(book).toContain("keepDash: true");
    expect(book).toContain("PRODUCT_NOUN.bookGuestCheckouts");
    expect(book).toContain("PRODUCT_NOUN.bookOneOrderBuyers");
    expect(book).toContain("isNum(depth.shippingTaxFees)");
    expect(book).toContain("isNum(book.returnsDrag)");

    expect(deskPage).not.toContain("mcfly-ctx__brand");
    expect(deskPage).toContain("mcfly-ctx__asof");
    expect(deskPage).toContain("shotMode ? (");
    expect(deskPage).toContain("<PeriodControl");
    expect(deskPage).toContain("<SalesLoadError");
    expect(deskPage).toContain("salesError && !shotMode && retryHref");

    expect(firstView).toContain("mcfly-kpi-grid");
    expect(firstView).toContain("mcfly-kpi-grid--peeks");
    expect(firstView).toContain("mcfly-kpi-grid--peeks-lead");
    expect(firstView).toContain("OverviewDepthPeeks");
    expect(firstView).toContain("Weekend vs weekday");
    expect(firstView).toContain("bookTypicalOrder");
    expect(firstView).not.toContain("mcfly-first-view");
    expect(firstView).not.toContain('value={salesPending ? "—"');
    expect(read("../routes/app._index.tsx")).toContain("<OverviewSalesChart");
    expect(read("../routes/app._index.tsx")).toContain("<OverviewYoyCards");

    expect(ltvSnap).toContain("First 90 days");
    expect(ltvSnap).not.toContain("mcfly-tab-snap__tiles");

    const css = read("../styles/mcfly-desk.css");
    expect(css).toContain(".mcfly-book__hero-v");
    expect(css).toContain(".mcfly-book__links");
    expect(css).toContain(".mcfly-book__cta");
    expect(css).toContain(".mcfly-book__row-sum::after");
    expect(css).toContain(".mcfly-book__kpi-v");
    expect(css).toContain(".mcfly-book__pair");
    expect(css).toContain(".mcfly-book__rows--kpis");
    expect(css).toContain(".mcfly-book__row-s");
    expect(css).toContain(".mcfly-book__hero-sub");
    expect(css).toContain(".mcfly-drill");
    expect(css).toContain(".mcfly-chart");
    expect(css).toContain(".mcfly-icon");

    const overview = read("../routes/app._index.tsx");
    expect(overview).toContain("mcfly-ctx__brand");
    expect(read("../routes/app.orders.tsx")).not.toContain("mcfly-tab-snap__empty");
    expect(read("../routes/app.buyers.tsx")).not.toContain("mcfly-tab-snap__empty");
    expect(read("../routes/app.timing.tsx")).not.toContain("mcfly-tab-snap__empty");
  });

  it("every tab has one title — live chrome is as-of and period, not a second brand rail", () => {
    for (const rel of [
      "../routes/app.orders.tsx",
      "../routes/app.buyers.tsx",
      "../routes/app.timing.tsx",
      "../routes/app.goals.tsx",
      "../routes/app.spend.tsx",
      "../routes/app.ltv.tsx",
    ]) {
      expect(chrome(rel), rel).not.toContain("mcfly-ctx__brand");
      expect(chrome(rel), rel).not.toContain("mcfly-topbar__def");
    }
    // Spend Upload keeps the nav tab's own name. Chart range lives on Total ROAS.
    const spend = read("../routes/app.spend.tsx");
    expect(spend).toContain('heading="Spend Upload"');
    expect(spend).not.toContain("Same dates as Overview");
    // Import is the same paper — no second Total ROAS brand in the rail.
    expect(chrome("../routes/app.spend.import.tsx")).not.toContain(
      "mcfly-ctx__brand",
    );
  });

  it("Goals and LTV speak the same book language as Orders", () => {
    const goals = read("../routes/app.goals.tsx");
    const ltv = read("../routes/app.ltv.tsx");
    const gauges = read("../components/SalesGoalGauges.tsx");

    expect(goals).toContain('className="mcfly-book"');
    expect(goals).toContain('className="mcfly-book__hero-v"');
    expect(goals).toContain('variant="book"');
    expect(goals).not.toContain("mcfly-acq-tile");
    expect(goals).not.toContain("mcfly-goals-declare");
    expect(goals).not.toContain("mcfly-panel mcfly-goals-declare");
    expect(gauges).toContain('case "book"');
    expect(gauges).not.toMatch(/cash \$\{PRODUCT_NOUN\.totalRoas\}/);
    expect(gauges).not.toContain("cash Total ROAS");

    expect(ltv).toContain("<DeskBookPage");
    expect(ltv).toContain('className="mcfly-book"');
    expect(ltv).toContain("<BookFactGrid");
    expect(ltv).not.toContain("<details");
    expect(ltv).not.toContain("mcfly-acq-tile");
    expect(ltv).not.toContain("mcfly-ltv-summary");
    expect(ltv).not.toContain("mcfly-ltv-dive");
  });

  it("LTV chrome drops cohort / till / ARPU / aMER glossary", () => {
    // Stored field names (tillLtv.cohorts) are data, never merchant words.
    const ltv = chrome("../routes/app.ltv.tsx").replace(
      /cohortMonth|cohorts/g,
      "",
    );
    const ltvSnap = chrome("../components/LtvSnapSection.tsx");
    const labels = read("./product-labels.ts");
    for (const source of [ltv, ltvSnap]) {
      expect(source).not.toMatch(/cohort/i);
      expect(source).not.toMatch(/\bARPU\b/i);
      expect(source).not.toMatch(/aMER/);
      expect(source).not.toMatch(/\btill\b/i);
    }
    expect(labels).not.toMatch(/ltvNotInShopify:[\s\S]{0,240}till/);
    expect(labels).not.toContain("Total ROAS cards");
    expect(ltv).not.toMatch(/Ingested/i);
    expect(ltv).not.toMatch(/broader order access/i);
    expect(ltv).not.toContain("New vs returning this window");
  });

  it("never prints a 0.0% — unknown shares stay a dash on the locked grid", () => {
    const book = read("../components/ShopifyBookSection.tsx");
    const ltv = read("../routes/app.ltv.tsx");
    for (const source of [
      book,
      chrome("../routes/app.ltv.tsx"),
      read("../components/OverviewFirstViewport.tsx"),
      read("../components/MarketingSnapSection.tsx"),
      read("../components/LtvSnapSection.tsx"),
    ]) {
      expect(source).not.toContain("toFixed(1)}%");
      expect(source).not.toContain("formatPercent(");
    }
    // A share that rounds to 0% is dropped, not printed next to real numbers.
    expect(book).toContain("function hasShare");
    expect(book).toContain("Math.round(share * 100) > 0");
    expect(book).toContain("hasShare(book.guestShare)");
    expect(book).toContain("hasShare(depth.discountedOrderShare)");
    expect(book).toContain("book.returnsDrag > 0");
    expect(book).toContain("depth.shippingTaxFees > 0");
    expect(book).toContain("keepDash: true");
    expect(ltv).toContain('row.v !== "—"');
  });

  it("adds depth as visible KPI cards, not collapsed drills", () => {
    const book = read("../components/ShopifyBookSection.tsx");
    const ltv = read("../routes/app.ltv.tsx");
    expect(book).toContain("x?: string[]");
    expect(book).toContain("s?: string");
    expect(book).toContain("function weekdayBreakdown");
    expect(book).toContain("function hourBreakdown");
    expect(book).toContain("depth.eligibleFirstTimers");
    expect(book).toContain("depth.guestAov");
    expect(book).toContain("function BookFactGrid");
    expect(ltv).toContain("<BookFactGrid");
    expect(ltv).toContain("First on file · ");
  });

  it("Overview keeps YoY cards plus scoreboard while explorer stays on Total ROAS", () => {
    const overview = read("../routes/app._index.tsx");
    const explorer = read("../components/SpendExplorer.tsx");
    const spend = read("../routes/app.spend.tsx");
    expect(overview).toContain("<OverviewYoyCards");
    expect(overview).toContain("<OverviewFirstViewport");
    expect(overview).toContain("<OverviewSalesChart");
    expect(overview).not.toContain("<DeskWindowRail");
    expect(overview).not.toContain("<DualCloseLine");
    expect(overview).not.toContain("<SpendExplorer");
    expect(overview).not.toContain("<CashControlBoard");
    expect(overview).not.toContain("<MarketingSnapSection");
    expect(spend).not.toContain("<SpendExplorer");
    expect(explorer).toContain("quiet?: boolean");
    expect(explorer).toContain("quiet ? null : (");
    expect(explorer).toContain("!shotMode && !quiet");
    expect(explorer).toContain("quiet && salesLead ? null : (");
  });

  it("Goals and Advanced preview Sample in place, not /app/demo", () => {
    expect(read("../routes/app.goals.tsx")).not.toContain('href="/app/demo"');
    expect(read("../routes/app.advanced.tsx")).not.toContain('href="/app/demo"');
  });

  it("Settings puts Your plan and Sample data on the main page", () => {
    const settings = read("../routes/app.settings.tsx");
    expect(settings).toContain("Your plan");
    expect(settings).toContain("Sample data");
    expect(settings).toContain("More — privacy");
    expect(settings).toContain("Switch to Sample data now");
    expect(settings).toContain("Live is parked until launch");
    expect(settings).toContain("ProUpgradeButton");
    expect(settings).not.toContain("Practice desk");
    expect(settings).toContain("add daily spend on Spend Upload");
    expect(settings).toContain("PRODUCT_NOUN.openTotalRoas");
    expect(settings).toContain('href="/app/roas"');
    expect(settings).not.toContain("on Upload Spend");
  });

  it("SAMPLE book covers through today with a compact window", () => {
    expect(SAMPLE_BOOK_DAYS).toBe(400);
    const sampleDesk = read("sample-desk.server.ts");
    expect(sampleDesk).toContain("ensureSampleBookThroughToday");
    expect(sampleDesk).toContain("SAMPLE_DESK_TARGET_MER = 3.5");
    expect(sampleDesk).toContain("seedSampleOrderFacts");
    expect(sampleDesk).toContain("clearSampleOrderFacts");
    expect(read("../lib/mer-dashboard.server.ts")).toContain(
      "useSampleDesk: false",
    );
    expect(sampleDesk).not.toContain("ensureFirstPaintSampleDesk");
    const enabledFn = sampleDesk.slice(
      sampleDesk.indexOf("export async function getSampleDeskEnabled"),
      sampleDesk.indexOf("export async function getSamplePreviewAllowed"),
    );
    expect(enabledFn).not.toContain("ensureSampleBookThroughToday");
  });

  it("Total ROAS Explorer is sized to the SVG, not clipped by a short plot box", () => {
    const css = read("../styles/mcfly-desk.css");
    const spineStart = css.indexOf(".mcfly-me-spine {");
    const spineEnd = css.indexOf("}", spineStart);
    const spine = css.slice(spineStart, spineEnd + 1);
    expect(spine).toContain("overflow: visible");
    expect(spine).not.toContain("overflow-x:");
    const plotStart = css.indexOf(".mcfly-explorer__plot-area {");
    const plotEnd = css.indexOf("}", plotStart);
    expect(css.slice(plotStart, plotEnd + 1)).toContain("max-height: none");
  });

  it("Customers book is returning dollars; Growth owns who came back; Orders owns ticket skew", () => {
    const book = read("../components/ShopifyBookSection.tsx");
    const buyersFn = book.slice(
      book.indexOf("function buyersRows"),
      book.indexOf("function growthRows"),
    );
    const growthFn = book.slice(
      book.indexOf("function growthRows"),
      book.indexOf("function timingRows"),
    );
    const periodFn = book.slice(
      book.indexOf("function periodRows"),
      book.indexOf("function buyersRows"),
    );
    expect(buyersFn).toContain("New vs returning dollars");
    expect(buyersFn).toContain("PRODUCT_NOUN.bookSalesPerBuyer");
    expect(buyersFn).toContain("PRODUCT_NOUN.bookGuestCheckouts");
    expect(buyersFn).toContain("PRODUCT_NOUN.bookOneOrderBuyers");
    expect(buyersFn).toContain("Top 10% of customers");
    expect(buyersFn).toContain("PRODUCT_NOUN.bookOrdersPerBuyer");
    expect(buyersFn).toContain("Biggest orders");
    expect(buyersFn).not.toContain("Repeat sales");
    expect(buyersFn).not.toContain("PRODUCT_NOUN.bookSecondWithin30");
    expect(buyersFn).not.toContain("PRODUCT_NOUN.bookSecondVsThird");
    expect(buyersFn).not.toContain("PRODUCT_NOUN.bookSecondVsFirst");
    expect(buyersFn).not.toContain("Days to a second order");
    expect(growthFn).toContain("PRODUCT_NOUN.bookSecondWithin30");
    expect(growthFn).toContain("PRODUCT_NOUN.bookSecondVsThird");
    expect(growthFn).toContain("Days to a second order");
    expect(periodFn).toContain("Biggest orders");
    expect(periodFn).toContain("topDecileSalesShare");
  });
});
