import type { ReactNode } from "react";

import styles from "./styles.module.css";

const MARK = "/assets/brand/mcfly-m-transparent.png";

type OriginShellProps = {
  children: ReactNode;
};

/**
 * Public Fly-origin chrome used when the marketing `site/` files are missing.
 * Production serves `site/` from the same origin (see serve-with-site.mjs).
 */
export function OriginShell({ children }: OriginShellProps) {
  return (
    <div className={styles.page}>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      <header className={styles.top}>
        <a className={styles.brand} href="/" aria-label="Mcfly Analytics home">
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
        <nav className={styles.nav} aria-label="Trust pages">
          <a href="/pricing">Pricing</a>
          <a href="/support">Support</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a className={styles.navCta} href="/demo">
            Try the demo
          </a>
        </nav>
      </header>
      {children}
      <footer className={styles.foot}>
        <p>
          Email a person:{" "}
          <a href="mailto:mcflyadsmmm@gmail.com">mcflyadsmmm@gmail.com</a>
          {" · "}
          <a href="mailto:invites@mcflyads.com">invites@mcflyads.com</a>
        </p>
      </footer>
    </div>
  );
}
