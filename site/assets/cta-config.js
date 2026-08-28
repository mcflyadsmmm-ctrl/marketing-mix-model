/* launch-v2-20260828-v6-coherence */
/**
 * Public CTA honesty gate.
 * Listing not live — Shopify primary CTA is Try the demo.
 * Custom Inquire must NOT use data-mcfly-cta="primary" (use "inquire" or plain href).
 * Never invent apps.shopify.com URLs. Never "Install free" → /support.
 *
 * Tokens:
 *   data-mcfly-cta="primary"   → Try the demo /demo (Shopify wedge only)
 *   data-mcfly-cta="demo"      → Try the demo /demo
 *   data-mcfly-cta="inquire"   → Request engagement /custom-analytics#inquire
 *   data-mcfly-cta="secondary" → left alone
 */
(function (w) {
  "use strict";

  /** Flip true only when the App Store listing is live. Do not invent apps.shopify.com. */
  w.MCFLY_APP_STORE_LIVE = false;

  function primary() {
    return { label: "Try the demo", href: "/demo" };
  }

  /** Chrome mobile nav / intentional demo CTAs only. */
  function secondary() {
    return { label: "Try the demo", href: "/demo" };
  }

  function demo() {
    return { label: "Try the demo", href: "/demo" };
  }

  function inquire() {
    return { label: "Request engagement", href: "/custom-analytics#inquire" };
  }

  function apply(root) {
    const scope = root || document;
    const p = primary();
    const d = demo();
    const i = inquire();
    scope.querySelectorAll('[data-mcfly-cta="primary"]').forEach((el) => {
      if (el.tagName === "A") el.setAttribute("href", p.href);
      el.textContent = p.label;
    });
    scope.querySelectorAll('[data-mcfly-cta="demo"]').forEach((el) => {
      if (el.tagName === "A") el.setAttribute("href", d.href);
      el.textContent = d.label;
    });
    scope.querySelectorAll('[data-mcfly-cta="inquire"]').forEach((el) => {
      if (el.tagName === "A") el.setAttribute("href", i.href);
      el.textContent = i.label;
    });
  }

  w.MCFLY_CTA = {
    primary: primary,
    secondary: secondary,
    demo: demo,
    inquire: inquire,
    apply: apply,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      apply();
    });
  } else {
    apply();
  }
})(window);
