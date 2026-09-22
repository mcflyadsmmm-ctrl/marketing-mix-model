/* McFly chrome v12 — Fly/legacy pages. Same product mark as mcfly/chrome.js. */
(function () {
  function ensureMeta(name, content) {
    if (document.querySelector('meta[name="' + name + '"]')) return;
    var meta = document.createElement("meta");
    meta.setAttribute("name", name);
    meta.setAttribute("content", content);
    document.head.appendChild(meta);
  }
  ensureMeta("mcfly-version", "v34");
  ensureMeta("mcfly-build", "operator-desk-v34");

  var LISTING = "https://apps.shopify.com/mcfly-analytics-public";
  var primary =
    window.MCFLY_CTA && typeof window.MCFLY_CTA.primary === "function"
      ? window.MCFLY_CTA.primary()
      : { label: "Install", href: LISTING };
  var ctaRel = /^https?:\/\//.test(primary.href)
    ? ' rel="noopener noreferrer"'
    : "";

  var path = (location.pathname.replace(/\/$/, "") || "/").toLowerCase();
  var chrome = document.querySelector("[data-chrome]");
  var footer = document.querySelector("[data-footer]");

  function navActive(href) {
    if (href === "/demo" && (path === "/demo" || path === "/product")) return ' aria-current="page"';
    if (href === "/pricing" && path === "/pricing") return ' aria-current="page"';
    if (href === "/about" && path === "/about") return ' aria-current="page"';
    return "";
  }

  if (chrome) {
    chrome.innerHTML =
      '<header class="top top--studio" data-top>' +
      '<a class="brand" href="/" aria-label="Mcfly Analytics">' +
      '<img class="brand-mark-img" src="/assets/brand/mcfly-m.png" width="32" height="32" alt="" />' +
      '<span class="brand-name">Mcfly <span class="brand-name-sub">Analytics</span></span>' +
      "</a>" +
      '<nav class="nav nav--studio" aria-label="Primary">' +
      '<a href="/demo"' +
      navActive("/demo") +
      ">Demo</a>" +
      '<a href="/pricing"' +
      navActive("/pricing") +
      ">Pricing</a>" +
      '<a href="/about"' +
      navActive("/about") +
      ">About</a>" +
      '<a class="nav-cta" href="' +
      primary.href +
      '"' +
      ctaRel +
      ">" +
      primary.label +
      "</a>" +
      "</nav>" +
      '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">' +
      "<span></span><span></span>" +
      "</button>" +
      "</header>" +
      '<div id="mobile-nav" class="mobile-nav" hidden>' +
      '<a href="/demo">Demo</a>' +
      '<a href="/pricing">Pricing</a>' +
      '<a href="/about">About</a>' +
      '<a href="' +
      primary.href +
      '"' +
      ctaRel +
      ">" +
      primary.label +
      "</a>" +
      "</div>";
  }

  if (footer) {
    footer.innerHTML =
      '<footer class="foot foot--studio">' +
      '<div class="wrap foot-grid">' +
      '<div class="foot-brand">' +
      '<img src="/assets/brand/mcfly-m.png" width="28" height="28" alt="" />' +
      "<span>Mcfly Ads</span>" +
      "</div>" +
      '<nav aria-label="Footer">' +
      '<a href="/demo">Demo</a>' +
      '<a href="/pricing">Pricing</a>' +
      '<a href="/about">About</a>' +
      '<a href="/faq">FAQ</a>' +
      '<a href="/privacy">Privacy</a>' +
      '<a href="/support">Support</a>' +
      '<a href="/terms">Terms</a>' +
      "</nav>" +
      '<p class="fine">© <span data-year></span> Mcfly Ads. Mcfly Analytics — deeper Shopify numbers Analytics does not show. 7-day trial, then $39/store/mo.</p>' +
      "</div>" +
      "</footer>";
  }

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  var toggle = document.querySelector(".nav-toggle");
  var mobile = document.getElementById("mobile-nav");
  if (toggle && mobile) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
      mobile.hidden = open;
    });
  }
})();
