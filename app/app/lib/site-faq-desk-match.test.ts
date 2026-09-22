import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const faqPath = join(repoRoot, "site/faq.html");

const FIVE_TAB_SENTENCE =
  "Five analysis tabs plus Settings: Overview · Orders · Customers · Spend · Goals";

const QUESTION_ORDER = [
  "What’s in the Shopify desk?",
  "What does Mcfly show that Analytics does not?",
  "What does it cost?",
  "How does spend get in?",
  "What is Total ROAS?",
  "What is break-even Total ROAS?",
  "How do I install?",
  "Do you do MMM, pixels, or multi-touch attribution?",
  "Is typical order the same as Shopify AOV?",
  "Can I share this with my bookkeeper or agency without a staff account?",
  "Is this a Triple Whale replacement?",
  "Is this Repeat Customer Insights?",
  "Do I export Orders CSV?",
  "Do I have to enter COGS before I see numbers?",
] as const;

type FaqItem = { name: string; text: string };

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function visibleFaqs(src: string): FaqItem[] {
  const list = src.match(/<ol class="faq-list">([\s\S]*?)<\/ol>/);
  if (!list) throw new Error("visible faq-list missing");
  const items = [
    ...list[1].matchAll(
      /<li[^>]*>\s*<h2>([\s\S]*?)<\/h2>\s*<p>([\s\S]*?)<\/p>\s*<\/li>/g,
    ),
  ];
  if (items.length === 0) throw new Error("visible FAQ items missing");
  return items.map((match) => ({
    name: stripTags(match[1]),
    text: stripTags(match[2]),
  }));
}

function jsonLdFaqs(src: string): FaqItem[] {
  const blocks = [
    ...src.matchAll(
      /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g,
    ),
  ];
  for (const block of blocks) {
    const data = JSON.parse(block[1]) as {
      "@type"?: string;
      mainEntity?: Array<{
        name?: string;
        acceptedAnswer?: { text?: string };
      }>;
    };
    if (data["@type"] === "FAQPage" && Array.isArray(data.mainEntity)) {
      return data.mainEntity.map((entity) => ({
        name: entity.name ?? "",
        text: entity.acceptedAnswer?.text ?? "",
      }));
    }
  }
  throw new Error("FAQPage JSON-LD missing");
}

function heroBlock(src: string): string {
  const match = src.match(/<header class="page-hero">([\s\S]*?)<\/header>/);
  if (!match) throw new Error("page-hero missing");
  return match[1];
}

function metaDescription(src: string): string {
  const match = src.match(
    /<meta name="description" content="([^"]+)"/,
  );
  if (!match) throw new Error("meta description missing");
  return match[1];
}

describe("site FAQ matches the five-tab sales-first desk", () => {
  const src = readFileSync(faqPath, "utf8");
  const visible = visibleFaqs(src);
  const jsonLd = jsonLdFaqs(src);
  const hero = heroBlock(src);
  const heroText = stripTags(hero);

  it("keeps desk IA first: five tabs, Growth/LTV on Customers, 90 vs 24, $39 after 7-day", () => {
    expect(src).toContain(FIVE_TAB_SENTENCE);
    expect(src).toContain("Overview · Orders · Customers · Spend · Goals");
    expect(src).toMatch(/Growth and LTV are Customers chips/);
    expect(src).toMatch(/90 days/);
    expect(src).toMatch(/24 months/);
    expect(src).toContain("$39");
    expect(src).toMatch(/7-day/);
    expect(src).toMatch(/paints —/);
    expect(src).toContain("/demo");
    expect(src).toContain("/pricing");
    expect(src).toContain("https://apps.shopify.com/mcfly-analytics-public");
  });

  it("hero is deeper Shopify numbers — not See ad spend next to sales", () => {
    expect(heroText).toMatch(/Deeper Shopify numbers Analytics does not show/);
    expect(heroText).toMatch(/Typical order/);
    expect(heroText).toMatch(/median/);
    expect(heroText).toMatch(/ShopifyQL/);
    expect(heroText).toMatch(/spend is optional/i);
    expect(heroText).toMatch(/7-day/);
    expect(heroText).toContain("$39");
    expect(heroText).toMatch(/90 days/);
    expect(heroText).toMatch(/24 months/);
    expect(hero).not.toMatch(/See ad spend next to sales/);
    expect(heroText.startsWith("Total ROAS")).toBe(false);
  });

  it("meta description is sales-first, not Total ROAS first", () => {
    const description = metaDescription(src);
    expect(description.startsWith("Total ROAS")).toBe(false);
    expect(description).toMatch(/Deeper Shopify numbers Analytics does not show/);
    expect(description).toMatch(/Typical order/);
    expect(description).toContain(FIVE_TAB_SENTENCE);
  });

  it("JSON-LD mainEntity matches visible questions, names, and facts", () => {
    expect(visible.map((item) => item.name)).toEqual([...QUESTION_ORDER]);
    expect(jsonLd.map((item) => item.name)).toEqual([...QUESTION_ORDER]);
    expect(jsonLd).toHaveLength(visible.length);

    const sharedFacts: string[][] = [
      [
        FIVE_TAB_SENTENCE,
        "Growth and LTV are Customers chips, not top tabs",
        "Spend is optional and last",
      ],
      [
        "Typical order is the median",
        "Shopify AOV is the mean",
        "no native median ticket",
        "ShopifyQL can show returning sales $",
        "Shopify Reports can Group by day of week",
        "customer cohort reports",
        "LTV 30/90/365 is observed orders",
        "Empty spend paints —",
        "never 0×",
      ],
      [
        "7-day trial, then $39/store/mo",
        "90 days of orders",
        "paid is up to 24 months",
        "No Free plan",
        "Not a GMV tax",
      ],
      [
        "Type a day on Spend",
        "Every platform including billboards",
        "No ad OAuth",
        "Spend is optional, last",
      ],
      [
        "Shopify Total Sales ÷ entered spend",
        "same window",
        "not MTA",
        "true ROAS",
      ],
      ["1 ÷ contribution margin", "Break-even"],
      [
        "Shopify App Store",
        "no “type your .myshopify.com” form",
      ],
      ["No.", "tracking pixels", "MTA", "true ROAS", "sales ÷ entered spend"],
      ["median ticket", "Shopify AOV is the mean"],
      ["copy or Save PNG", "does not email or Slack"],
      ["No.", "No pixel", "Free / Foundation $219 / Automate $749", "$39 stays $39"],
      [
        "No.",
        "Repeat Customer Insights from $59",
        "purchase latency",
        "Better Reports from $19.90",
      ],
      ["No.", "reads orders in Admin"],
      ["No.", "does not ingest COGS", "does not paint net profit"],
    ];

    visible.forEach((item, index) => {
      expect(jsonLd[index]?.name).toBe(item.name);
      const ld = jsonLd[index]?.text ?? "";
      for (const fact of sharedFacts[index] ?? []) {
        expect(item.text, `visible Q${index + 1} missing “${fact}”`).toContain(
          fact,
        );
        expect(ld, `JSON-LD Q${index + 1} missing “${fact}”`).toContain(fact);
      }
    });

    expect(jsonLd[0]?.text).toContain(FIVE_TAB_SENTENCE);
    expect(jsonLd[6]?.text).toContain(
      "https://apps.shopify.com/mcfly-analytics-public",
    );
  });

  it("refuses the old four-tab brochure and launch leftovers", () => {
    expect(src).not.toMatch(/Spend, Overview, LTV, Goals/);
    expect(src).not.toMatch(/full-access/i);
    expect(src).not.toMatch(/trial includes 24 months/i);
    expect(src).not.toMatch(/\bHarbor\b/);
    expect(src).not.toMatch(/\$98,?500/);
    expect(src).not.toMatch(/\bNorthline\b/);
    expect(src).not.toMatch(/\bAmazon\b/);
    expect(src).not.toMatch(/\bRecharge\b/);
    expect(src).not.toMatch(/\bsessions\b/i);
    expect(src).not.toMatch(/\bvisitors\b/i);
    expect(heroText).not.toMatch(/\bCOGS\b/);
    expect(heroText).not.toMatch(/\bP&L\b/);
    expect(src).not.toMatch(/\bMonday\b/);
    expect(src).not.toMatch(/What does Mcfly Analytics show me\?/);
  });
});
