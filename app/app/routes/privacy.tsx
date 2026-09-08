import type { MetaFunction } from "react-router";

import { OriginShell } from "./_index/OriginShell";
import styles from "./_index/styles.module.css";

export const meta: MetaFunction = () => [
  { title: "Privacy — Mcfly Analytics" },
  {
    name: "description",
    content:
      "Mcfly Analytics reads Shopify order totals and opaque customer id + numberOfOrders. No name, email, phone, or address. No pixels.",
  },
];

export default function PrivacyPage() {
  return (
    <OriginShell>
      <main id="main" className={styles.article}>
        <h1>Privacy</h1>
        <p className={styles.lede}>
          Mcfly Analytics measures Shopify Total Sales ÷ the ad spend you add.
          We do not run pixels, multi-touch attribution, or a name/email CRM.
        </p>

        <h2>What we read from Shopify</h2>
        <ul>
          <li>
            <code>read_orders</code> — order totals and dates for Total ROAS.
          </li>
          <li>
            <code>read_customers</code> — opaque customer <code>id</code> and{" "}
            <code>numberOfOrders</code> only, to classify new vs returning. No
            name, email, phone, or address.
          </li>
        </ul>

        <h2>What you add</h2>
        <p>
          Ad spend you type or upload (CSV). Optional margin and Total ROAS
          target in Settings. We do not connect Meta or Google Ads OAuth on
          day one.
        </p>

        <h2>Uninstall</h2>
        <p>
          Shopify <code>shop/redact</code> deletes your Mcfly shop record,
          settings, and spend. <code>customers/redact</code> deletes that
          customer’s stored facts. GDPR topics: customers/data_request,
          customers/redact, shop/redact.
        </p>

        <p>
          Questions:{" "}
          <a href="mailto:mcflyadsmmm@gmail.com">mcflyadsmmm@gmail.com</a>.
        </p>
      </main>
    </OriginShell>
  );
}
