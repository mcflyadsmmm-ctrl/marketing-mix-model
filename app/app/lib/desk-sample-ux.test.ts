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

describe("Sample data | Live data UX", () => {
  it("shot mode still labels Sample data (App Store 1.1.4)", () => {
    const bar = read("../components/DataModeBar.tsx");
    expect(bar).toContain("shotMode");
    expect(bar).toMatch(/if \(shotMode\)/);
    expect(bar).toContain("mcfly-data-mode--shot");
    expect(bar).toContain("sampleHint");
    const shell = read("../routes/app.tsx");
    expect(shell).toContain("shotMode={shotMode}");
    expect(shell).not.toMatch(/\{!shotMode \? \(/);
    const css = read("../styles/mcfly-desk.css");
    expect(css).toMatch(/mcfly-desk--shot\.mcfly-desk--sample::after/);
    expect(css).toMatch(/content:\s*"SAMPLE DATA"/);
  });

  it("top toggle labels Sample data vs Live data", () => {
    const bar = read("../components/DataModeBar.tsx");
    expect(bar).toContain("liveData");
    expect(bar).toContain("sampleData");
    expect(bar).toContain("sampleHint");
    expect(bar).toContain("liveDataHint");
    expect(bar).not.toMatch(/Turn SAMPLE preview OFF/);
    expect(bar).not.toContain("Before App Store review");
    expect(bar).not.toContain("s-banner");
    expect(bar).not.toContain("setupAddSpend");
    const labels = read("../lib/product-labels.ts");
    expect(labels).toContain('sampleData: "Sample data"');
    expect(labels).toContain('liveData: "Live data"');
  });

  it("Sample data preview uses the data-mode POST, not /app/demo", () => {
    const cta = read("../components/UseSampleCta.tsx");
    expect(cta).toContain('name="intent" value="use-sample"');
    expect(cta).toContain('action={`/app/data-mode${location.search}`}');
    expect(cta).toContain("reloadDocument");
    expect(cta).not.toContain('href="/app/demo"');
  });

  it("Spend switches Sample to Live when saving spend", () => {
    const spend = read("../routes/app.spend.tsx");
    expect(spend).toMatch(/source:\s*"sample"/);
    expect(spend).toContain("setSampleDeskEnabled(shop.id, false)");
    expect(spend).toContain("/app/spend/import");
    expect(spend).not.toContain("Upload is paused on Practice");
    expect(spend).not.toContain("Switch to Your store to upload");
  });

  it("data-mode keeps SAMPLE through today without a 5-year rewrite", () => {
    const dataMode = read("../routes/app.data-mode.tsx");
    expect(dataMode).toContain("ensureSampleBookThroughToday");
    expect(dataMode).not.toContain("seedThreeYearSampleDesk");
    const sampleDesk = read("sample-desk.server.ts");
    expect(sampleDesk).toContain("ensureSampleBookThroughToday");
    expect(sampleDesk).not.toContain("SAMPLE_SEED_TX");
    expect(sampleDesk).not.toContain("timeout: 120_000");
    expect(sampleDesk).toContain("sampleSeedInFlight");
    expect(dataMode).toContain("export default function DataModeRoute");
  });

  it("Sample | Live posts as a document request so Admin never decodes a raw 302 as turbo-stream", () => {
    const bar = read("../components/DataModeBar.tsx");
    const settings = read("../routes/app.settings.tsx");
    expect(bar).toMatch(/reloadDocument/);
    expect(bar).toContain('name="intent" value="use-real"');
    expect(bar).toContain('name="intent" value="use-sample"');
    expect(settings).toMatch(/action=\{dataModeAction\} reloadDocument/);
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
    expect(marketing).toContain("NUMBER_HONESTY.csvHint");
    expect(marketing).toContain("NUMBER_HONESTY.orderWindow");
    expect(overview).toContain("<MarketingSnapSection");
    expect(overview).not.toContain("$0 · add spend");
    expect(overview).toContain("spendOnlyEmpty");
    expect(overview).toContain("mcfly-hero-compact--live-lead");
    expect(overview).toContain('aria-label="Shopify sales this period"');
    expect(overview).not.toContain("Add spend to see Total ROAS");
    expect(overview).not.toContain("NUMBER_HONESTY.empty");
    expect(marketing).toContain("NUMBER_HONESTY.empty");
  });

  it("Overview paints Shopify-only stats even with $0 spend", () => {
    const overview = read("../routes/app._index.tsx");
    const firstView = read("../components/OverviewFirstViewport.tsx");
    const book = read("../components/ShopifyBookSection.tsx");
    const orders = read("../routes/app.orders.tsx");
    const buyers = read("../routes/app.buyers.tsx");
    const timing = read("../routes/app.timing.tsx");
    const ltvSnap = read("../components/LtvSnapSection.tsx");
    const labels = read("./product-labels.ts");
    expect(overview).toContain("<OverviewFirstViewport");
    expect(overview).toContain("<OverviewSectionIndex");
    expect(firstView).toContain("OVERVIEW_SPEND_EMPTY_LINE");
    expect(firstView).toContain("Sales from returning customers");
    expect(overview).not.toContain("<ShopifyBookSection");
    expect(overview).toContain("shopifyNativePeriodStats");
    expect(orders).toContain('groups={["period"]}');
    expect(buyers).toContain('groups={["buyers"]}');
    expect(timing).toContain('groups={["timing"]}');
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
    expect(firstView).not.toContain("bookSecondWithin30");
    expect(firstView).not.toContain("medianDailySales");
    expect(labels).toContain('bookTypicalOrder: "Typical order"');
    expect(labels).toContain('bookWeekendSales: "Weekend sales"');
    expect(book).toContain("New vs returning dollars");
    expect(ltvSnap).toContain("Cash CPA");
    expect(ltvSnap).toContain("First year");
    expect(ltvSnap).toContain("Repeat rate");
    expect(overview).toContain("loadOverviewGoalPeriods");
    expect(overview).toContain("<GoalsSnapSection");
    expect(overview).not.toContain("See spend mix");
    const firstAt = overview.indexOf("<OverviewFirstViewport");
    const doorsAt = overview.indexOf("<OverviewSectionIndex");
    const explorerAt = overview.indexOf("<SpendExplorer");
    expect(firstAt).toBeGreaterThan(-1);
    expect(doorsAt).toBeGreaterThan(firstAt);
    expect(explorerAt).toBeGreaterThan(doorsAt);
    expect(overview).toContain("<SpendExplorer");
  });

  it("Tick A Overview chrome is sales-first at $0 spend", () => {
    const overview = read("../routes/app._index.tsx");
    const firstView = read("../components/OverviewFirstViewport.tsx");
    const doors = read("../components/OverviewSectionIndex.tsx");
    const goals = read("../components/GoalsSnapSection.tsx");
    const ltvSnap = read("../components/LtvSnapSection.tsx");
    const explorer = read("../components/SpendExplorer.tsx");

    expect(firstView).toContain("OVERVIEW_SPEND_EMPTY_LINE");
    expect(firstView).not.toContain("setupAddSpend");
    expect(firstView).not.toContain("Upload Spend");
    expect(firstView).not.toContain("spendHref");
    expect(firstView).not.toMatch(/0×/);

    expect(overview).not.toContain('slot="primary-action"');
    expect(overview).not.toContain("Update spend");
    expect(overview).not.toContain("Add more days of spend");
    expect(overview).not.toContain("See spend mix");
    expect(overview).not.toContain("PRODUCT_NOUN.setupAddSpend");
    expect(overview).toContain("<MarketingSnapSection");
    expect(overview).toContain("<OverviewFirstViewport");
    expect(overview).toContain("<OverviewSectionIndex");
    const firstAt = overview.indexOf("<OverviewFirstViewport");
    const doorsAt = overview.indexOf("<OverviewSectionIndex");
    expect(doorsAt).toBeGreaterThan(firstAt);

    const moreStart = overview.indexOf('className="mcfly-overview-more"');
    const moreEnd = overview.indexOf("</p>", moreStart);
    expect(moreStart).toBeGreaterThan(-1);
    const more = overview.slice(moreStart, moreEnd);
    expect(more).toContain("PRODUCT_NOUN.ordersTitle");
    expect(more).toContain("PRODUCT_NOUN.buyersTitle");
    expect(more).toContain("PRODUCT_NOUN.timingTitle");
    expect(more).toContain("PRODUCT_NOUN.marketingSection");
    expect(more).toContain("/app/goals");
    expect(more).toContain("/app/settings");
    expect(more).not.toContain("PRODUCT_NOUN.spendAllocation");
    expect(more).not.toContain("PRODUCT_NOUN.advancedMetrics");
    expect(more).not.toContain("openAdvanced");
    expect(more).not.toContain("PRODUCT_NOUN.ltvTitle");
    expect(more).not.toContain("/app/ltv");
    expect(more).not.toContain("/app/allocation");
    expect(more).not.toContain("/app/advanced");

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
    expect(overview).toContain("`Total ROAS — ${metrics.period.label}`");

    expect(doors).toContain("Orders, buyers, and timing");
    expect(doors).not.toContain("Deeper than Analytics");
    expect(doors).not.toContain("shopifyBookTitle");
    expect(doors).not.toContain("Open ${PRODUCT_NOUN.ordersTitle}");
    expect(doors).not.toContain("None of these need spend");
    expect(doors).toContain("Same window as Total Sales");
    expect(doors).toContain('deskNavHref("/app/orders"');
    expect(doors).toContain('deskNavHref("/app/buyers"');
    expect(doors).toContain('deskNavHref("/app/timing"');

    expect(overview).not.toContain("mcfly-tab-snaps--solo");
    expect(overview).toContain("mcfly-tab-snaps--below");
    const doorsMount = overview.indexOf("<OverviewSectionIndex");
    const belowAt = overview.indexOf("mcfly-tab-snaps--below");
    expect(doorsMount).toBeGreaterThan(-1);
    expect(belowAt).toBeGreaterThan(doorsMount);

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

  it("Every tab reads as one hero plus drill-down rows, not equal boxes", () => {
    const book = read("../components/ShopifyBookSection.tsx");
    const deskPage = read("../components/DeskBookPage.tsx");
    const firstView = read("../components/OverviewFirstViewport.tsx");
    const doors = read("../components/OverviewSectionIndex.tsx");
    const goals = read("../components/GoalsSnapSection.tsx");
    const marketing = read("../components/MarketingSnapSection.tsx");
    const ltvSnap = read("../components/LtvSnapSection.tsx");

    for (const file of [book, firstView, doors, goals, marketing, ltvSnap]) {
      expect(file).toContain('className="mcfly-book"');
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

    expect(book).toContain('<details className="mcfly-book__row"');
    expect(book).toContain('className="mcfly-book__row-sum"');
    expect(book).toContain('className="mcfly-book__row-d"');

    expect(book).toContain('className="mcfly-book__clock"');
    expect(book).toContain('className="mcfly-book__clock-k"');
    expect(book).toContain('{ k: "Original"');
    expect(book).toContain('{ k: "Product only"');

    for (const file of [book, firstView, ltvSnap, marketing]) {
      expect(file).toContain("Math.round(share * 100)");
      expect(file).not.toContain("formatPercent");
    }

    expect(book).toContain("book.guestOrders > 0");
    expect(book).toContain("depth.oneAndDoneShare > 0");
    expect(book).toContain("isNum(depth.shippingTaxFees)");
    expect(book).toContain("isNum(book.returnsDrag)");

    expect(deskPage).not.toContain("mcfly-ctx__brand");
    expect(deskPage).toContain("mcfly-ctx__asof");
    expect(deskPage).toContain("<PeriodControl");

    expect(firstView).toContain('className="mcfly-book__glance"');
    expect(firstView).not.toContain("mcfly-first-view");
    expect(firstView).not.toContain('value={salesPending ? "—"');

    expect(doors).toContain('className="mcfly-book__links"');
    expect(ltvSnap).toContain("First 90 days");
    expect(ltvSnap).not.toContain("mcfly-tab-snap__tiles");

    const css = read("../styles/mcfly-desk.css");
    expect(css).toContain(".mcfly-book__hero-v");
    expect(css).toContain(".mcfly-book__links");
    expect(css).toContain(".mcfly-book__cta");
    expect(css).toContain(".mcfly-book__row-sum::after");

    const overview = read("../routes/app._index.tsx");
    expect(overview).not.toContain("mcfly-ctx__brand");
    expect(read("../routes/app.orders.tsx")).not.toContain("mcfly-tab-snap__empty");
    expect(read("../routes/app.buyers.tsx")).not.toContain("mcfly-tab-snap__empty");
    expect(read("../routes/app.timing.tsx")).not.toContain("mcfly-tab-snap__empty");
  });

  it("Goals and Advanced preview Sample in place, not /app/demo", () => {
    expect(read("../routes/app.goals.tsx")).not.toContain('href="/app/demo"');
    expect(read("../routes/app.advanced.tsx")).not.toContain('href="/app/demo"');
  });

  it("Settings puts Your plan on the main page and Sample data in More", () => {
    const settings = read("../routes/app.settings.tsx");
    expect(settings).toContain("Your plan");
    expect(settings).toContain("Sample data");
    expect(settings).toContain("More — Sample data and privacy");
    expect(settings).toContain("ProUpgradeButton");
    expect(settings).not.toContain("Practice desk");
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
});
