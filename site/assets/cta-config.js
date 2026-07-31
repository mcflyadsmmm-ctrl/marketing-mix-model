/* launch-v2-20260728-freemium */
/**
 * Public CTA honesty gate.
 * App Store listing path is primary for launch.
 * Never forever-free bait as the product. Never a shop-domain form on this site.
 *
 * Tokens:
 *   data-mcfly-cta="primary"   → Install free /support
 *   data-mcfly-cta="demo"      → Try the demo /demo
 *   data-mcfly-cta="secondary" → left alone (page keeps App Store / custom label)
 */
(function (w) {
  "use strict";

  /** Flip false only if listing is down and install is broken. */
  w.MCFLY_APP_STORE_LIVE = true;

  function primary() {
    return { label: "Install free", href: "/support" };
  }

  /** Chrome mobile nav / intentional demo CTAs only. */
  function secondary() {
    return { label: "Try the demo", href: "/demo" };
  }

  function demo() {
    return { label: "Try the demo", href: "/demo" };
  }

  function apply(root) {
    const scope = root || document;
    const p = primary();
    const d = demo();
    scope.querySelectorAll('[data-mcfly-cta="primary"]').forEach((el) => {
      if (el.tagName === "A") el.setAttribute("href", p.href);
      el.textContent = p.label;
    });
    // Only rewrite intentional demo CTAs — never overwrite App Store secondary links.
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
