import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { redirect } from "react-router";

import styles from "./styles.module.css";

/**
 * Public app origin landing (bare Fly URL — not the Admin embed).
 * App Store 2.3.1: never collect .myshopify.com for install here.
 * Aesthetic: mcflyads.com navy + cyan — no App Bridge on this page.
 */
export const meta: MetaFunction = () => [
  { title: "Mcfly Analytics" },
  {
    name: "description",
    content:
      "Total ROAS = Shopify sales ÷ ad spend. 7-day trial, then $39/mo.",
  },
];

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
            src="/brand/mcfly-m-128.png"
            width={40}
            height={40}
            alt=""
          />
          <p className={styles.wordmark}>
            Mcfly <span className={styles.wordmarkAccent}>Analytics</span>
          </p>
        </header>

        <h1 className={styles.heading}>Total ROAS = Sales ÷ Spend</h1>
        <p className={styles.lede}>
          Shopify sales over the ad spend you add. Break-even from margin. One
          allocation call — not attribution theater.
        </p>
        <p className={styles.price}>7-day trial, then $39/mo. Not a GMV tax.</p>

        <div className={styles.ctas}>
          <a
            className={styles.ctaPrimary}
            href="https://apps.shopify.com/mcfly-analytics-public"
            target="_blank"
            rel="noopener noreferrer"
          >
            Install
          </a>
          <a
            className={styles.ctaSecondary}
            href="https://mcflyads.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit mcflyads.com
          </a>
          <a
            className={styles.ctaSecondary}
            href="https://mcflyads.com/support"
            target="_blank"
            rel="noopener noreferrer"
          >
            Support
          </a>
        </div>

        <footer className={styles.foot}>
          <p>
            Email support:{" "}
            <a href="mailto:mcflyadsmmm@gmail.com">mcflyadsmmm@gmail.com</a>
          </p>
        </footer>
      </main>
    </div>
  );
}
