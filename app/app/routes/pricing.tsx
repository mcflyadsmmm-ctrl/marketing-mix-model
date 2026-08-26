import type { MetaFunction } from "react-router";

import { OriginShell } from "./_index/OriginShell";
import styles from "./_index/styles.module.css";

export const meta: MetaFunction = () => [
  { title: "Pricing — Mcfly Analytics" },
  {
    name: "description",
    content:
      "7-day full-access trial, then $39 per store per month for the whole desk. Every platform including billboards. Shopify App Pricing.",
  },
];

export default function PricingPage() {
  return (
    <OriginShell>
      <main id="main" className={styles.article}>
        <h1>Pricing</h1>
        <p className={styles.lede}>
          One plan. A 7-day full-access trial, then $39 per store per month for
          the whole desk. Not a percent of sales. Not a per-order fee.
        </p>

        <h2>What you get</h2>
        <ul>
          <li>
            Spend from every platform including billboards, beside Shopify Total
            Sales
          </li>
          <li>Total ROAS = Shopify Total Sales ÷ spend you added</li>
          <li>Break-even from optional profit margin</li>
          <li>Allocation mix, period filters, Email Overview</li>
          <li>Customer LTV and Cash CAC payback</li>
          <li>Full-year Goals board</li>
          <li>Sample data to click around before you switch to Live data</li>
        </ul>

        <h2>Billing</h2>
        <p>
          Shopify bills this app. Uninstall in Admin to stop the next 30-day
          cycle; the current cycle may still charge. Start 7-day trial and
          Manage plan open Shopify’s hosted plan page in the top Admin frame.
          See <a href="/support">Support</a> if that page loads inside the app
          iframe instead.
        </p>
      </main>
    </OriginShell>
  );
}
