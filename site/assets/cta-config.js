/* launch-v2-20260826-one-product */
/**
 * Public CTA honesty gate.
 * Listing is live at apps.shopify.com/mcfly-analytics-public.
 * Primary CTA is Install. Secondary is the SAMPLE demo.
 *
 * Tokens:
 *   data-mcfly-cta="primary"   → Install Mcfly Analytics
 *   data-mcfly-cta="demo"      → View SAMPLE demo
 *   data-mcfly-cta="secondary" → left alone (page keeps custom label)
 */
(function (w) {
  "use strict";

  w.MCFLY_APP_STORE_LIVE = true;
  w.MCFLY_APP_STORE_URL = "https://apps.shopify.com/mcfly-analytics-public";

  function primary() {
    return { label: "Install Mcfly Analytics", href: w.MCFLY_APP_STORE_URL };
  }

  /** SAMPLE demo, not the install. */
  function secondary() {
    return { label: "View SAMPLE demo", href: "/demo" };
  }

  function demo() {
    return { label: "View SAMPLE demo", href: "/demo" };
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
