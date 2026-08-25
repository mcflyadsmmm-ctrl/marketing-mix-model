import type { ReactNode } from "react";

import styles from "./styles.module.css";

const MARK =
  "https://mcflyads.com/assets/brand/mcfly-m-transparent.png";

type OriginShellProps = {
  children: ReactNode;
};

/**
 * Public Fly-origin chrome for App Store trust URLs.
 * Reviewers hit these when mcflyads.com Pages is still stale.
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
          <a className={styles.navCta} href="/support">
            Install free
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
