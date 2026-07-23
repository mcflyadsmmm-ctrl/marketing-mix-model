import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

import styles from "./styles.module.css";

/**
 * Public app origin landing.
 * App Store rule 2.3.1: merchants must install from Shopify surfaces —
 * do not collect .myshopify.com domains here for production installs.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  // OAuth / embedded entry with shop already present
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return null;
};

export default function AppLanding() {
  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <p className={styles.kicker}>Mcfly Analytics</p>
        <h1 className={styles.heading}>Spend vs Shopify sales. Not attribution theater.</h1>
        <p className={styles.text}>
          Cash MER, break-even, and allocation — installed from Shopify Admin or a Partner invite.
          We never ask you to type your .myshopify.com domain to install.
        </p>
        <ul className={styles.list}>
          <li>
            <strong>Shopify is the till</strong>. Order totals for the period you choose.
          </li>
          <li>
            <strong>Spend is money out</strong>. Manual entry day one; live pipes next.
          </li>
          <li>
            <strong>Operate on MER</strong>. Break-even from your margin. One allocation card.
          </li>
        </ul>
        <p className={styles.text}>
          <a className={styles.button} href="https://mcflyads.com/">
            Product site
          </a>{" "}
          <a className={styles.button} href="https://mcflyads.com/support">
            Support
          </a>
        </p>
        <p className={styles.text}>
          Design partners: install via Shopify Partner Dashboard → your store, or the install
          link we email you.{" "}
          <a href="mailto:mcflyadsmmm@gmail.com">mcflyadsmmm@gmail.com</a>
        </p>
      </div>
    </div>
  );
}
