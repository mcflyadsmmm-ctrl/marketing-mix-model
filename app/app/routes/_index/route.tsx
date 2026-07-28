import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

import styles from "./styles.module.css";

/**
 * Public app origin landing (bare Fly URL — not the Admin embed).
 * App Store 2.3.1: never collect .myshopify.com for install here.
 * Aesthetic: mcflyads.com till-room (navy + cyan), not default template gray.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return null;
};

export default function AppLanding() {
  return (
    <div className={styles.page}>
      <div className={styles.atmosphere} aria-hidden="true" />
      <main className={styles.shell}>
        <header className={styles.brand}>
          <img
            className={styles.mark}
            src="/brand/mcfly-m-64.png"
            width={40}
            height={40}
            alt=""
          />
          <p className={styles.wordmark}>
            Mcfly <span className={styles.wordmarkAccent}>Analytics</span>
          </p>
        </header>

        <h1 className={styles.heading}>
          Total ROAS = Sales ÷ Spend
        </h1>
        <p className={styles.lede}>
          Shopify sales over your ad spend. Break-even from margin. One
          allocation call — not attribution theater.
        </p>

        <div className={styles.ctas}>
          <a className={styles.ctaPrimary} href="https://mcflyads.com/">
            Product site
          </a>
          <a className={styles.ctaGhost} href="https://mcflyads.com/support">
            Support
          </a>
        </div>

        <p className={styles.install}>
          Install from the Shopify App Store (Free) or a Partner invite. We never
          ask you to type your .myshopify.com domain here.
        </p>

        <footer className={styles.foot}>
          <p>
            Partner invites:{" "}
            <a href="mailto:mcflyadsmmm@gmail.com">mcflyadsmmm@gmail.com</a>
          </p>
        </footer>
      </main>
    </div>
  );
}
