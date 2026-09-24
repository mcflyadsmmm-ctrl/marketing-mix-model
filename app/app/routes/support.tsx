import type { MetaFunction } from "react-router";

import { OriginShell } from "./_index/OriginShell";
import styles from "./_index/styles.module.css";

export const meta: MetaFunction = () => [
  { title: "Support — Mcfly Analytics" },
  {
    name: "description",
    content:
      "Install Mcfly Analytics from the Shopify App Store. Email a human. No shop-domain form. 7-day trial, then $39 via Shopify App Pricing.",
  },
];

export default function SupportPage() {
  return (
    <OriginShell>
      <main id="main" className={styles.article}>
        <h1>Support</h1>
        <p className={styles.lede}>
          Mcfly Analytics is a live Shopify Admin app. There is no Mcfly
          username, password, or second signup. After install, the Shopify
          session is the login.
        </p>

        <h2>Install</h2>
        <p>
          Install <strong>Mcfly Analytics</strong> from the Shopify App Store
          or Partner install link. We never put a public “type your
          .myshopify.com” box on this site.
        </p>
        <p>
          Email{" "}
          <a href="mailto:mcflyadsmmm@gmail.com">mcflyadsmmm@gmail.com</a>{" "}
          (or <a href="mailto:invites@mcflyads.com">invites@mcflyads.com</a>)
          with your store domain if you get stuck.
        </p>

        <h2>What it costs</h2>
        <ul>
          <li>
            <strong>7-day trial</strong>, then{" "}
            <strong>$39</strong> per store per month, flat. Not a GMV tax.
            Trial and paid share the full desk and up to 24 months of orders.
            One plan. Includes every named platform plus extras like billboard,
            Total ROAS, break-even, Allocation, Customer LTV, and the full-year
            Goals board. No ads. No pixels, path credit, or multi-touch
            attribution.
          </li>
          <li>
            Shopify bills the subscription. Shopify does not host the app — it
            runs at https://mcfly-analytics.fly.dev. Uninstall stops the next
            cycle. A period already paid may run to its end. Pricing:{" "}
            <a href="https://mcflyads.com/pricing">mcflyads.com/pricing</a>.
          </li>
        </ul>
        <p>
          Settings → <strong>Start 7-day trial</strong> must open Shopify’s plan
          picker in the top Admin frame — never inside the app iframe.
        </p>

        <h2>Sample data and Live data</h2>
        <p>
          Switch Sample data | Live data in Settings. Switch to{" "}
          <strong>Live data</strong> before judging Total ROAS. Sample data is
          example numbers, not this shop. Live data is this shop’s Shopify
          sales plus the spend you add. Margin is optional — add spend first.
        </p>
      </main>
    </OriginShell>
  );
}
