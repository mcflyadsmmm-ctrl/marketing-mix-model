import type { MetaFunction } from "react-router";

import { OriginShell } from "./_index/OriginShell";
import styles from "./_index/styles.module.css";

export const meta: MetaFunction = () => [
  { title: "Pricing — Mcfly Analytics" },
  {
    name: "description",
    content:
      "7-day trial, then $39 per store per month, flat. Not a GMV tax. Trial and paid share the full desk and up to 24 months of orders. Every platform including billboards.",
  },
];

export default function PricingPage() {
  return (
    <OriginShell>
      <main id="main" className={styles.article}>
        <h1>Pricing</h1>
        <p className={styles.lede}>
          One plan. A 7-day trial, then $39 per store per month, flat, for the
          whole desk. Not a GMV tax. Not a percent of sales. Not a per-order
          fee. Trial and paid share the full desk and up to 24 months of
          orders. The public pricing page is{" "}
          <a href="https://mcflyads.com/pricing">mcflyads.com/pricing</a>. The
          app runs at https://mcfly-analytics.fly.dev. Shopify does not host
          it.
        </p>

        <h2>What you get</h2>
        <ul>
          <li>
            Typical order, weekend mix, repeat buyers, and 30/90/365-day value
            from Shopify orders — no spend required
          </li>
          <li>
            Optional spend from every platform including billboards, beside
            Shopify Total Sales
          </li>
          <li>Total ROAS = Shopify Total Sales ÷ spend you added</li>
          <li>Allocation mix, period filters, Email Overview</li>
          <li>Customer LTV from orders; Cash CAC payback when you add spend</li>
          <li>Full-year Goals board</li>
          <li>
            Trial and paid share the full desk and up to 24 months of orders.
            SAMPLE on /demo is a labeled sample book
          </li>
          <li>Sample data to click around before you switch to Live data</li>
        </ul>

        <h2>Billing</h2>
        <p>
          Shopify bills this app. Shopify does not host it. Uninstall stops the
          next cycle. A period already paid may run to its end. Start 7-day
          trial and Manage plan open Shopify’s plan page in the top Admin
          frame. See <a href="/support">Support</a> if that page loads inside
          the app iframe instead. No ads. No pixels, path credit, or
          multi-touch attribution.
        </p>
      </main>
    </OriginShell>
  );
}
