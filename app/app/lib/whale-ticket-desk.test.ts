import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

const rfmLib = read("./customers-rfm.ts");
const analytics = read("./customers-analytics.ts");
const loader = read("./desk-customers-page.server.ts");
const watch = read("../components/CustomerWhaleWatch.tsx");
const rfmBoard = read("../components/CustomerRfmBoard.tsx");
const whaleRecency = read("../components/LtvWhaleRecency.tsx");
const ltvSection = read("../components/CustomersLtvSection.tsx");
const slack = read("./shareable-insights.ts");
const css = read("../styles/mcfly-desk.css");
const customers = read("../routes/app.customers.tsx");
const demo = read("../routes/demo.customers.tsx");

describe("Whale ticket + RFM flow — required props, omit-path must fail", () => {
  it("keeps typicalTicket / firstTicket / laterTicket required on the whale row", () => {
    expect(rfmLib).toMatch(/typicalTicket: number \| null;/);
    expect(rfmLib).toMatch(/firstTicket: number \| null;/);
    expect(rfmLib).toMatch(/laterTicket: number \| null;/);
    expect(rfmLib).not.toMatch(/typicalTicket\?:/);
    expect(rfmLib).not.toMatch(/firstTicket\?:/);
    expect(rfmLib).not.toMatch(/laterTicket\?:/);
    expect(rfmLib).not.toMatch(/typicalTicket:\s*number \| null\s*=/);
    expect(watch).toContain("row.typicalTicket");
    expect(watch).toContain("row.firstTicket");
    expect(watch).toContain("row.laterTicket");
    expect(watch).toContain("rfm.watchlistTotal");
    expect(watch).toContain("rfm.watchlistMoreMinOrders");
    expect(watch).toContain("whaleWatchRemainderLine");
    expect(watch).toContain("WHALE_MIN_ORDERS");
  });

  it("keeps championFlow required on the RFM view and painted on the board", () => {
    expect(rfmLib).toMatch(/championFlow: RfmChampionFlow;/);
    expect(rfmLib).not.toMatch(/championFlow\?:/);
    expect(rfmLib).toContain("lastMonthChampions");
    expect(rfmLib).toContain("cooledBuyers");
    expect(rfmLib).toContain("cooledLifetime");
    expect(rfmBoard).toContain("rfm.championFlow");
    expect(rfmBoard).toContain("championFlow.cooledBuyers");
    expect(rfmBoard).toContain("championFlow.cooledLifetime");
    expect(rfmBoard).toContain("championFlow.lastMonthChampions");
    expect(rfmBoard).not.toMatch(/gid:\/\/shopify\/Customer/);
    expect(watch).not.toMatch(/gid:\/\/shopify\/Customer/);
  });

  it("scores T and T−1 month in the RFM writer, not a second loader pass", () => {
    expect(loader).toContain("buildCustomerRfm(mapped, { windowEnd: end, historyLimited })");
    expect(rfmLib).toContain("setUTCMonth");
    expect(rfmLib).toMatch(/getUTCMonth\(\)\s*-\s*1/);
    expect(analytics).toContain("WHALE_MIN_ORDERS = 5");
    expect(analytics).toContain("ORDER_STEP_MIN_BUYERS = 8");
    expect(analytics).not.toMatch(/WHALE_MIN_ORDERS\s*=\s*8/);
  });

  it("passes coldShare and historyLimited into whaleSlackInsight — grepping the name is not enough", () => {
    expect(slack).toMatch(
      /export function whaleSlackInsight\(input: \{[\s\S]*?coldShare: number \| null;[\s\S]*?historyLimited: boolean;/,
    );
    expect(slack).not.toMatch(/coldShare\?:/);
    expect(slack).not.toMatch(/whaleSlackInsight\([\s\S]*coldShare:\s*number\s*=/);
    expect(whaleRecency).toContain("coldShare: whales.coldShare");
    expect(whaleRecency).toContain("historyLimited: historyLimited");
    expect(whaleRecency).toContain("historyLimited: boolean");
    expect(whaleRecency).not.toMatch(/historyLimited\?:/);
    expect(whaleRecency).not.toMatch(/coldShare:\s*0/);
    expect(ltvSection).toContain(
      'import { LtvWhaleRecency } from "./LtvWhaleRecency"',
    );
    expect(ltvSection).toContain("<LtvWhaleRecency");
    expect(ltvSection).toContain("historyLimited={historyLimited}");
    expect(ltvSection).toContain("whales={depth.whales}");
  });

  it("wraps the whale grid at 36rem / 430px and does not recook Goals or morning habit", () => {
    const mark = "Whale watchlist phone wrap";
    const start = css.indexOf(mark);
    expect(start).toBeGreaterThan(-1);
    const end = css.indexOf("End whale watchlist phone wrap");
    expect(end).toBeGreaterThan(start);
    const morning = css.indexOf("Morning habit");
    expect(morning).toBeGreaterThan(end);
    const whalePhone = css.slice(start, end);
    expect(whalePhone).toContain("@media (max-width: 36rem)");
    expect(whalePhone).toContain(".mcfly-cust-watch__row");
    expect(whalePhone).toContain("white-space: normal");
    expect(whalePhone).toContain("overflow-wrap: anywhere");
    expect(whalePhone).not.toContain(".mcfly-goals-table");
    expect(whalePhone).not.toContain(".mcfly-yoy--glance");
    expect(whalePhone).not.toContain(".mcfly-morning-habit");
    const goalsGlance = css.indexOf(
      "@media (max-width: 36rem) {\n  .mcfly-yoy--glance .mcfly-yoy__grid,",
    );
    expect(goalsGlance).toBeGreaterThan(-1);
  });

  it("keeps Admin door, PII, and Klaviyo off the whale / RFM desk", () => {
    for (const source of [watch, rfmBoard, whaleRecency, rfmLib, customers, demo]) {
      expect(source).not.toMatch(/Admin door/i);
      expect(source).not.toMatch(/Klaviyo/i);
      expect(source).not.toMatch(/mailto:/i);
      expect(source).not.toMatch(/customer\.email/);
      expect(source).not.toMatch(/shippingCity|billingCity/);
    }
  });
});
