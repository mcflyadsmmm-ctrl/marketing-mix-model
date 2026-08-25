import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { redirect } from "react-router";

import styles from "./styles.module.css";

/**
 * Public app origin landing (bare Fly URL — not the Admin embed).
 * App Store 2.3.1: never collect a shop domain for install here.
 * Aesthetic: mcflyads.com inner-page paper (not the old navy parking screen).
 * No App Bridge on this page — product / support / demo links must work.
 */
export const meta: MetaFunction = () => [
  { title: "Mcfly Analytics" },
  {
    name: "description",
    content:
      "Total ROAS = Shopify sales ÷ ad spend. Install Free from the Shopify App Store.",
  },
  { name: "theme-color", content: "#f2f5f8" },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return null;
};

const SITE = "https://mcflyads.com";
const MARK = `${SITE}/assets/brand/mcfly-m-transparent.png`;

export default function AppLanding() {
  return (
    <div className={styles.page}>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      <header className={styles.top}>
        <a
          className={styles.brand}
          href={`${SITE}/`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Mcfly Ads home"
        >
          <img
            className={styles.mark}
            src={MARK}
            width={36}
            height={36}
            alt=""
          />
          <span>
            Mcfly <span className={styles.brandSub}>Analytics</span>
          </span>
        </a>
        <nav className={styles.nav} aria-label="Mcfly Ads">
          <a href={`${SITE}/product`} target="_blank" rel="noopener noreferrer">
            Product
          </a>
          <a href={`${SITE}/app`} target="_blank" rel="noopener noreferrer">
            Desk
          </a>
          <a href={`${SITE}/demo`} target="_blank" rel="noopener noreferrer">
            Demo
          </a>
          <a href={`${SITE}/support`} target="_blank" rel="noopener noreferrer">
            Support
          </a>
          <a
            className={styles.navCta}
            href={`${SITE}/support`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Install free
          </a>
        </nav>
      </header>

      <main id="main" className={styles.hero}>
        <p className={styles.kicker}>
          Mcfly <span className={styles.brandSub}>Analytics</span>
        </p>
        <h1 className={styles.heading}>
          Total ROAS = Shopify sales ÷ ad spend
        </h1>
        <p className={styles.lede}>
          The Monday cash desk Shopify Analytics does not overlay with uploaded
          spend. Break-even from margin. One allocation call — not attribution
          theater.
        </p>

        <div className={styles.ctas}>
          <a
            className={styles.ctaPrimary}
            href={`${SITE}/support`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Install free
          </a>
          <a
            className={styles.ctaSecondary}
            href={`${SITE}/demo`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Try the demo
          </a>
        </div>

        <p className={styles.install}>
          Install from the Shopify App Store, then open Mcfly Analytics in
          Admin. This URL is the app host — not a store login, and we never ask
          you to type a store domain here.
        </p>
        <p className={styles.more}>
          <a href={`${SITE}/product`} target="_blank" rel="noopener noreferrer">
            How it works
          </a>
          <span aria-hidden="true"> · </span>
          <a href={`${SITE}/support`} target="_blank" rel="noopener noreferrer">
            Support
          </a>
        </p>
      </main>

      <footer className={styles.foot}>
        <p>
          Email a person:{" "}
          <a href="mailto:invites@mcflyads.com">invites@mcflyads.com</a>
        </p>
      </footer>
    </div>
  );
}
