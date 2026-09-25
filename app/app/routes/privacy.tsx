import type { MetaFunction } from "react-router";

import { OriginShell } from "./_index/OriginShell";
import styles from "./_index/styles.module.css";

export const meta: MetaFunction = () => [
  { title: "Privacy — Mcfly Analytics" },
  {
    name: "description",
    content:
      "Mcfly Analytics reads Shopify order totals and opaque customer id + numberOfOrders. We do not store name, email, phone, or address. No pixels.",
  },
];

export default function PrivacyPage() {
  return (
    <OriginShell>
      <main id="main" className={styles.article}>
        <h1>Privacy</h1>
        <p className={styles.lede}>
          Mcfly Analytics measures Shopify sales next to the ad spend you add (Total ROAS = sales ÷ entered spend). We do not run pixels, multi-touch attribution, or a name/email CRM.
        </p>

        <h2>What we read from Shopify</h2>
        <ul>
          <li>
            <code>read_orders</code> / <code>read_all_orders</code> — order
            totals and dates for the desk and Total ROAS.
          </li>
          <li>
            <code>read_customers</code> — opaque customer <code>id</code> and{" "}
            <code>numberOfOrders</code> only, to classify new vs returning
            dollars and early LTV. No name, email, phone, or address in the
            product UI or CRM.
          </li>
        </ul>

        <h2>Shopify Analytics / ShopifyQL (Level 2)</h2>
        <p>
          Shopify’s reporting API (<code>shopifyqlQuery</code>) requires Partner
          Level 2 access to name, address, email, and phone fields even for
          aggregate sales totals. If that access is approved, we may call
          ShopifyQL for Analytics-aligned day totals. We still will not store,
          display, export, or message using those identity fields.
        </p>

        <h2>What you add</h2>
        <p>
          Ad spend you type or upload (CSV). Optional margin and Total ROAS
          target in Settings. We do not connect Meta or Google Ads OAuth on
          day one.
        </p>

        <h2>Retention and deletion</h2>
        <p>
          Shop data is deleted on uninstall and on Shopify{" "}
          <code>shop/redact</code>. <code>customers/redact</code> deletes that
          customer’s stored order facts. Temporary Level-1 compliance export
          packages (opaque order ids, amounts, dates — no name/email/phone)
          auto-purge after 60 days. GDPR topics: customers/data_request,
          customers/redact, shop/redact.
        </p>

        <h2>Security</h2>
        <p>
          Data in transit uses HTTPS. Production data is hosted on Fly.io with
          encrypted volumes. Access is limited to the app operator. We keep an
          incident response policy and do not copy Live merchant books into the
          SAMPLE demo.
        </p>

        <p>
          Questions:{" "}
          <a href="mailto:mcflyadsmmm@gmail.com">mcflyadsmmm@gmail.com</a>.
        </p>
      </main>
    </OriginShell>
  );
}
