/* launch-v3-20260908-appstore */
/**
 * Public CTA honesty gate.
 * Live listing: https://apps.shopify.com/mcfly-analytics-public
 * $39/mo + 7-day trial. Never a shop-domain form on this site.
 *
 * Tokens:
 *   data-mcfly-cta="primary"   → Install on Shopify App Store
 *   data-mcfly-cta="demo"      → See the SAMPLE desk
 *   data-mcfly-cta="secondary" → left alone (page keeps its own label)
 */
(function (w) {
  "use strict";

  w.MCFLY_APP_STORE_LIVE = true;
  w.MCFLY_APP_STORE_URL = "https://apps.shopify.com/mcfly-analytics-public";

  function primary() {
    return { label: "Install on Shopify", href: w.MCFLY_APP_STORE_URL };
  }

  function secondary() {
    return { label: "See SAMPLE desk", href: "/product#desk" };
  }

  function demo() {
    return { label: "See SAMPLE desk", href: "/product#desk" };
  }

  function apply(root) {
    const scope = root || document;
    const p = primary();
    const d = demo();
    scope.querySelectorAll('[data-mcfly-cta="primary"]').forEach((el) => {
      if (el.tagName === "A") {
        el.setAttribute("href", p.href);
        el.setAttribute("rel", "noopener");
      }
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
