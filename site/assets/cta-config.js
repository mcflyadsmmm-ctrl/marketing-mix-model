/* launch-v2-20260826-one-product */
/**
 * Public CTA honesty gate.
 * Primary CTA opens the sample desk. Never "Install free" → /support.
 *
 * Tokens:
 *   data-mcfly-cta="primary"   → Try the demo /demo
 *   data-mcfly-cta="demo"      → Try the demo /demo
 *   data-mcfly-cta="secondary" → left alone (page keeps custom label)
 */
(function (w) {
  "use strict";

  /** Flip true only when the App Store listing is live. Do not invent apps.shopify.com. */
  w.MCFLY_APP_STORE_LIVE = false;

  function primary() {
    return { label: "Sample desk", href: "/demo" };
  }

  /** Chrome mobile nav / intentional demo CTAs only. */
  function secondary() {
    return { label: "Sample desk", href: "/demo" };
  }

  function demo() {
    return { label: "Sample desk", href: "/demo" };
  }

  function apply(root) {
    const scope = root || document;
    const p = primary();
    const d = demo();
    scope.querySelectorAll('[data-mcfly-cta="primary"]').forEach((el) => {
      if (el.tagName === "A") el.setAttribute("href", p.href);
      el.textContent = p.label;
    });
    scope.querySelectorAll('[data-mcfly-cta="demo"]').forEach((el) => {
      if (el.tagName === "A") el.setAttribute("href", d.href);
      el.textContent = d.label;
    });
  }

  w.MCFLY_CTA = { primary: primary, secondary: secondary, demo: demo, apply: apply };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      apply();
    });
  } else {
    apply();
  }
})(window);
