import type { MetaFunction } from "react-router";

import { OriginShell } from "./_index/OriginShell";
import styles from "./_index/styles.module.css";

export const meta: MetaFunction = () => [
  { title: "Pricing — Mcfly Analytics" },
  {
    name: "description",
    content:
      "Free = every platform including billboards. Pro $39/store/mo for Customer LTV and the full-year Goals board. Shopify App Pricing.",
  },
];

export default function PricingPage() {
  return (
    <OriginShell>
      <main id="main" className={styles.article}>
        <h1>Pricing</h1>
        <p className={styles.lede}>
          Shopify App Pricing is live: Free by default, Pro $39 per store per month. Not a percent of sales. Not a per-order fee.
        </p>

        <h2>Free</h2>
        <ul>
          <li>Every named platform plus extras like billboards</li>
          <li>Total ROAS = Shopify Total Sales ÷ spend you added</li>
          <li>Break-even from optional profit margin</li>
          <li>Allocation mix, period filters, Email Overview</li>
          <li>Practice desk to preview Pro features</li>
        </ul>

        <h2>Pro · $39 / store / month</h2>
        <ul>
          <li>Everything in Free</li>
          <li>Customer LTV and Cash CAC payback on your store</li>
          <li>Full-year Goals board</li>
        </ul>
        <p>
          Upgrade and Manage plan open Shopify’s hosted plan page in the top
          Admin frame. See <a href="/support">Support</a> if that page loads
          inside the app iframe instead.
        </p>
      </main>
    </OriginShell>
  );
}
