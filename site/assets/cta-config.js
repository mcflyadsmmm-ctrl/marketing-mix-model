/**
 * Public CTA honesty gate.
 * Flip MCFLY_APP_STORE_LIVE → true when the Shopify App Store listing is live
 * and one-click install actually works. Until then: Partner invite primary.
 * Never forever-free. Never a shop-domain form on this site.
 */
(function (w) {
  "use strict";

  w.MCFLY_APP_STORE_LIVE = false;

  function waitlistHref() {
    const path = (location.pathname.replace(/\/$/, "") || "/").toLowerCase();
    const isHome = path === "/" || path === "/index.html" || path === "";
    return isHome ? "#waitlist" : "/#waitlist";
  }

  function primary() {
    if (w.MCFLY_APP_STORE_LIVE) {
      return { label: "Get free install", href: "/support" };
    }
    return { label: "Request Partner invite", href: waitlistHref() };
  }

  function secondary() {
    if (w.MCFLY_APP_STORE_LIVE) {
      return { label: "Partner invite", href: waitlistHref() };
    }
    return { label: "App Store Free when listed", href: "/support" };
  }

  function apply(root) {
    const scope = root || document;
    const p = primary();
    const s = secondary();
    scope.querySelectorAll('[data-mcfly-cta="primary"]').forEach((el) => {
      if (el.tagName === "A") el.setAttribute("href", p.href);
      el.textContent = p.label;
    });
    scope.querySelectorAll('[data-mcfly-cta="secondary"]').forEach((el) => {
      if (el.tagName === "A") el.setAttribute("href", s.href);
      el.textContent = s.label;
    });
  }

  w.MCFLY_CTA = { primary: primary, secondary: secondary, apply: apply };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      apply();
    });
  } else {
    apply();
  }
})(window);
