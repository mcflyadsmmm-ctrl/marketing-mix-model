import type { MetaFunction } from "react-router";

import { OriginShell } from "./_index/OriginShell";
import styles from "./_index/styles.module.css";

export const meta: MetaFunction = () => [
  { title: "Support — Mcfly Analytics" },
  {
    name: "description",
    content:
      "Install Mcfly Analytics from the Shopify App Store. Email a human. No shop-domain form. Free + Pro $39 via Shopify App Pricing.",
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

        <h2>Free vs Pro</h2>
        <ul>
          <li>
            <strong>Free:</strong> every named platform plus extras like
            billboards, Total ROAS, break-even, Allocation, Email Overview.
          </li>
          <li>
            <strong>Pro ($39/store/mo):</strong> Customer LTV / payback and the
            full-year Goals board. Shopify App Pricing bills this in Admin.
          </li>
        </ul>
        <p>
          Spend → <strong>Upgrade to Pro</strong> must open Shopify’s plan
          picker in the top Admin frame — never inside the app iframe.
        </p>

        <h2>Practice desk</h2>
        <p>
          Turn SAMPLE / Practice <strong>OFF</strong> before judging live Total
          ROAS. Practice numbers are examples, not your store.
        </p>
      </main>
    </OriginShell>
  );
}
