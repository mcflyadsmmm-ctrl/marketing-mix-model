/* launch-v14-20260908-listing-live */
/**
 * Public CTA honesty gate.
 * Listing is live — Shopify primary CTA is Install on the App Store.
 * Custom Inquire must NOT use data-mcfly-cta="primary" (use "inquire" or plain href).
 * Never "Install free" → /support. Never a public shop-domain form.
 *
 * Tokens:
 *   data-mcfly-cta="primary"   → Install → App Store listing
 *   data-mcfly-cta="demo"      → Try the demo /demo
 *   data-mcfly-cta="inquire"   → Request engagement /custom-analytics#inquire
 *   data-mcfly-cta="secondary" → left alone
 */
(function (w) {
  "use strict";

  var LISTING = "https://apps.shopify.com/mcfly-analytics-public";

  /** Published 7 Sep 2026. Keep true while the listing is fully visible. */
  w.MCFLY_APP_STORE_LIVE = true;
  w.MCFLY_APP_STORE_URL = LISTING;

  function primary() {
    if (w.MCFLY_APP_STORE_LIVE) {
      return { label: "Install", href: LISTING };
    }
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

  function applyLink(el, spec) {
    if (el.tagName === "A") {
      el.setAttribute("href", spec.href);
      if (/^https?:\/\//.test(spec.href)) {
        el.setAttribute("rel", "noopener noreferrer");
      }
    }
    var full = el.querySelector(".cta__full");
    var mob = el.querySelector(".cta__mob");
    if (full) {
      full.textContent = spec.label;
      if (mob && spec.label === "Install") mob.textContent = "Install";
    } else {
      el.textContent = spec.label;
    }
  }

  function apply(root) {
    const scope = root || document;
    const p = primary();
    const d = demo();
    const i = inquire();
    scope.querySelectorAll('[data-mcfly-cta="primary"]').forEach((el) => {
      applyLink(el, p);
    });
    scope.querySelectorAll('[data-mcfly-cta="demo"]').forEach((el) => {
      applyLink(el, d);
    });
    scope.querySelectorAll('[data-mcfly-cta="inquire"]').forEach((el) => {
      applyLink(el, i);
    });
  }

  w.MCFLY_CTA = {
    primary: primary,
    secondary: secondary,
    demo: demo,
    inquire: inquire,
    apply: apply,
    listing: LISTING,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      apply();
    });
  } else {
    apply();
  }
})(window);
