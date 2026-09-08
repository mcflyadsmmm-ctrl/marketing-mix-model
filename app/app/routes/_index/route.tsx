import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { redirect } from "react-router";

import { isShopifyEmbeddedSearch } from "../../../scripts/shopify-app-path.mjs";
import { OriginShell } from "./OriginShell";
import styles from "./styles.module.css";

export const meta: MetaFunction = () => [
  { title: "Mcfly Analytics" },
  {
    name: "description",
    content:
      "Total ROAS = Shopify sales ÷ ad spend. Every platform including billboards. 7-day free trial, then $39/month for the whole desk.",
  },
  { name: "theme-color", content: "#f2f5f8" },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (isShopifyEmbeddedSearch(url.searchParams)) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return null;
};

export default function AppLanding() {
  return (
    <OriginShell>
      <main id="main" className={styles.hero}>
        <p className={styles.kicker}>
          Mcfly <span className={styles.brandSub}>Analytics</span>
        </p>
        <h1 className={styles.heading}>
          Total ROAS = Shopify sales ÷ ad spend
        </h1>
        <p className={styles.lede}>
          Put spend from every platform — including billboards — next to
          Shopify sales. Break-even from margin, Customer LTV, and a full-year
          Goals board. One plan: 7-day free trial, then $39/store/mo for the
          whole desk via Shopify App Pricing.
        </p>

        <div className={styles.ctas}>
          <a className={styles.ctaPrimary} href="/support">
            How to install
          </a>
          <a className={styles.ctaSecondary} href="/pricing">
            See pricing
          </a>
        </div>

        <p className={styles.install}>
          Install from the Shopify App Store, then open Mcfly Analytics in
          Admin. This URL is the app host — not a store login, and we never ask
          you to type a store domain here.
        </p>
        <p className={styles.more}>
          <a href="/privacy">Privacy</a>
          <span aria-hidden="true"> · </span>
          <a href="/terms">Terms</a>
          <span aria-hidden="true"> · </span>
          <a href="/support">Support</a>
        </p>
      </main>
    </OriginShell>
  );
}
