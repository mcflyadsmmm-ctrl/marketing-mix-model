import type { MetaFunction } from "react-router";

import { OriginShell } from "./_index/OriginShell";
import styles from "./_index/styles.module.css";

export const meta: MetaFunction = () => [
  { title: "Support — Mcfly Analytics" },
  {
    name: "description",
    content:
      "Install Mcfly Analytics from the Shopify App Store. Email a human. No shop-domain form. 7 days, then $39.",
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
            7 days, then $39. Trial and paid both keep the full desk,
            including Customers, LTV, and up to 24 months of orders. Spend is
            optional: Meta, Google, Email, or Other.
          </li>
          <li>
            Shopify bills this app. Uninstall stops the next 30-day cycle. The
            current cycle may still charge.
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
