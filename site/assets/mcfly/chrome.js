/* McFly chrome v14 — listing live. Product mark Mcfly Analytics. Firm Mcfly Ads in footer. */
(function () {
  function ensureMeta(name, content) {
    if (document.querySelector('meta[name="' + name + '"]')) return;
    var meta = document.createElement("meta");
    meta.setAttribute("name", name);
    meta.setAttribute("content", content);
    document.head.appendChild(meta);
  }
  ensureMeta("mcfly-version", "v14");
  ensureMeta("mcfly-build", "listing-live");

  var LISTING = "https://apps.shopify.com/mcfly-analytics-public";
  var primary =
    window.MCFLY_CTA && typeof window.MCFLY_CTA.primary === "function"
      ? window.MCFLY_CTA.primary()
      : { label: "Install", href: LISTING };

  var path = (location.pathname.replace(/\/$/, "") || "/").toLowerCase();
  var mount = document.querySelector("[data-chrome]");
  var foot = document.querySelector("[data-footer]");

  function active(href) {
    if (href === "/demo" && (path === "/demo" || path === "/product")) return ' aria-current="page"';
    if (href === "/pricing" && path === "/pricing") return ' aria-current="page"';
    if (href === "/about" && path === "/about") return ' aria-current="page"';
    return "";
  }

  var ctaRel = /^https?:\/\//.test(primary.href)
    ? ' rel="noopener noreferrer"'
    : "";

  if (mount) {
    mount.innerHTML =
      '<header class="nav" id="nav">' +
      '<div class="nav__inner">' +
      '<a class="nav__brand" href="/" aria-label="Mcfly Analytics">' +
      '<img src="/assets/brand/mcfly-m.png" width="32" height="32" alt="" />' +
      'Mcfly <span class="nav__brand-sub">Analytics</span>' +
      "</a>" +
      '<nav class="nav__links" aria-label="Primary">' +
      '<a href="/demo"' +
      active("/demo") +
      ">Demo</a>" +
      '<a href="/pricing"' +
      active("/pricing") +
      ">Pricing</a>" +
      '<a href="/about"' +
      active("/about") +
      ">About</a>" +
      '<a class="nav__cta" href="' +
      primary.href +
      '"' +
      ctaRel +
      ">" +
      primary.label +
      "</a>" +
      "</nav>" +
      '<button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-panel" aria-label="Open menu">' +
      "<span></span><span></span>" +
      "</button>" +
      "</div>" +
      '<div class="nav__panel" id="nav-panel">' +
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
      "</div>" +
      "</header>";

    var toggle = mount.querySelector(".nav__toggle");
    var panel = mount.querySelector(".nav__panel");
    if (toggle && panel) {
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", open ? "false" : "true");
        panel.classList.toggle("is-open", !open);
      });
      panel.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          toggle.setAttribute("aria-expanded", "false");
          panel.classList.remove("is-open");
        });
      });
    }
  }

  if (foot) {
    foot.innerHTML =
      '<footer class="foot">' +
      '<div class="container foot__grid">' +
      '<div class="foot__brand">' +
      '<img src="/assets/brand/mcfly-m.png" width="28" height="28" alt="" />' +
      "<span>Mcfly Ads</span>" +
      "</div>" +
      '<nav aria-label="Footer">' +
      '<a href="/demo">Demo</a>' +
      '<a href="/pricing">Pricing</a>' +
      '<a href="/about">About</a>' +
      '<a href="/privacy">Privacy</a>' +
      '<a href="/support">Support</a>' +
      '<a href="/terms">Terms</a>' +
      "</nav>" +
      '<p class="fine">© <span data-year></span> Mcfly Ads. Mcfly Analytics — spend next to Shopify sales. 7-day trial, then $39/store/mo.</p>' +
      "</div>" +
      "</footer>";
    foot.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }
})();
