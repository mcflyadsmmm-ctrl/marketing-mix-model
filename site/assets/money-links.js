/**
 * Money rails — paste live Gumroad / Stripe Payment Links when ready (HUMAN H8).
 * Empty string → mailto for a link (never fake storefront checkout).
 *
 * Custom DS religion: primary close = inquire → SOW (engagement form / waitlist
 * INTERIM_INBOX mailto+copy in app.js). Deposit / desk-setup are secondary only.
 *
 * Stable API:
 *   data-mcfly-pay="course"          → gumroadCourse || courseMailto
 *   data-mcfly-pay="custom-deposit"  → stripeCustomDeposit || depositMailto
 *   data-mcfly-pay="desk-setup"      → stripeDeskSetup || deskSetupMailto
 *
 * Optional: data-mcfly-pay-fallback-label="…" when checkout URL is empty
 * (use honest “Email for … link” copy — not Buy/Pay theater).
 */
(function (w) {
  "use strict";

  /** Same interim inbox as site/assets/app.js INTERIM_INBOX */
  var INBOX = "mcflyadsmmm@gmail.com";

  w.MCFLY_MONEY = {
    /** Gumroad (or Stripe) product URL for MDS Made Easy $79 */
    gumroadCourse: "",
    /** Stripe Payment Link for Custom DS deposit / retainer (secondary; after SOW) */
    stripeCustomDeposit: "",
    /** Stripe Payment Link for mid-ticket desk setup SKU ($1.5–4K) (secondary) */
    stripeDeskSetup: "",
    inquireMailto:
      "mailto:" + INBOX + "?subject=Custom%20Data%20Solutions%20inquiry",
    depositMailto:
      "mailto:" +
      INBOX +
      "?subject=Custom%20Data%20Solutions%20—%20request%20deposit%20link",
    deskSetupMailto:
      "mailto:" +
      INBOX +
      "?subject=Desk%20setup%20SKU%20%241.5–4K%20—%20request%20payment%20link",
    courseMailto:
      "mailto:" +
      INBOX +
      "?subject=MDS%20Made%20Easy%20%2479%20—%20send%20checkout%20link",
  };

  function resolve(key, fallback) {
    const v = (w.MCFLY_MONEY && w.MCFLY_MONEY[key]) || "";
    return typeof v === "string" && v.trim() ? v.trim() : fallback;
  }

  function apply(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-mcfly-pay]").forEach((el) => {
      const kind = el.getAttribute("data-mcfly-pay");
      let href = "#";
      let label = el.textContent;
      if (kind === "course") {
        href = resolve("gumroadCourse", w.MCFLY_MONEY.courseMailto);
        if (!resolve("gumroadCourse", "")) {
          label = el.getAttribute("data-mcfly-pay-fallback-label") || "Email for $79 checkout";
        }
      } else if (kind === "custom-deposit") {
        href = resolve("stripeCustomDeposit", w.MCFLY_MONEY.depositMailto);
        if (!resolve("stripeCustomDeposit", "")) {
          label =
            el.getAttribute("data-mcfly-pay-fallback-label") || "Email for deposit link";
        }
      } else if (kind === "desk-setup") {
        href = resolve("stripeDeskSetup", w.MCFLY_MONEY.deskSetupMailto);
        if (!resolve("stripeDeskSetup", "")) {
          label =
            el.getAttribute("data-mcfly-pay-fallback-label") ||
            "Email for desk-setup link";
        }
      }
      if (el.tagName === "A") el.setAttribute("href", href);
      if (label) el.textContent = label;
    });
  }

  w.MCFLY_PAY = { apply: apply, resolve: resolve };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      apply();
    });
  } else {
    apply();
  }
})(window);
