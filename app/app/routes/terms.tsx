import type { MetaFunction } from "react-router";

import { OriginShell } from "./_index/OriginShell";
import styles from "./_index/styles.module.css";

export const meta: MetaFunction = () => [
  { title: "Terms — Mcfly Analytics" },
  {
    name: "description",
    content:
      "Mcfly Analytics terms: Shopify App Pricing Free + Pro $39/store/mo. Uninstall anytime. Utah governing law.",
  },
];

export default function TermsPage() {
  return (
    <OriginShell>
      <main id="main" className={styles.article}>
        <h1>Terms</h1>
        <p className={styles.lede}>
          Mcfly Analytics is a Shopify Admin desk. Total ROAS is informational
          — sales ÷ spend for the same period — not financial advice.
        </p>

        <h2>Plans</h2>
        <p>
          Shopify App Pricing: <strong>Free</strong> (default) and{" "}
          <strong>Pro $39/store/mo</strong> for Customer LTV and the full-year
          Goals board. Named ad platforms and extras like billboards stay on
          Free. Shopify bills Pro. Switch to Free or uninstall to stop the
          next 30-day cycle; the current cycle may still charge.
        </p>

        <h2>Your store</h2>
        <p>
          You must have authority to install on the shop. You are responsible
          for the spend figures you enter.
        </p>

        <h2>Ending the service</h2>
        <p>
          Uninstall anytime in Shopify Admin. We may suspend access for abuse,
          non-payment of a billed Pro plan, or security risk. Shop redact
          deletes Mcfly merchant data as described in{" "}
          <a href="/privacy">Privacy</a>.
        </p>

        <h2>Governing law</h2>
        <p>
          Utah law. Exclusive venue: Utah County, Utah, USA. Operator: Marty
          Smithson.
        </p>
      </main>
    </OriginShell>
  );
}
