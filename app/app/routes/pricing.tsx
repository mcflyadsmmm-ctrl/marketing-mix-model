import type { MetaFunction } from "react-router";

import { OriginShell } from "./_index/OriginShell";
import styles from "./_index/styles.module.css";

export const meta: MetaFunction = () => [
  { title: "Pricing — Mcfly Analytics" },
  {
    name: "description",
    content:
      "7 days, then $39. Trial and paid both keep the full desk. Uninstall stops the next 30-day cycle. The current cycle may still charge.",
  },
];

export default function PricingPage() {
  return (
    <OriginShell>
      <main id="main" className={styles.article}>
        <h1>Pricing</h1>
        <p className={styles.lede}>
          7 days, then $39. Trial and paid both keep the full desk. Not a
          percent of sales. Not a per-order fee.
        </p>

        <h2>What you get</h2>
        <ul>
          <li>
            Typical order, weekend mix, repeat buyers, and 30/90/365-day value
            from Shopify orders — no spend required
          </li>
          <li>
            Optional spend for Meta, Google, Email, or Other, beside Shopify
            sales
          </li>
          <li>Total ROAS = Shopify Total Sales ÷ spend you added</li>
          <li>Allocation mix, period filters, Email Overview</li>
          <li>Customer LTV from orders; Cash CAC payback when you add spend</li>
          <li>Goals keeps one saved target. Settings does not ask for it.</li>
          <li>Trial and paid both keep the full desk, up to 24 months of orders.</li>
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
