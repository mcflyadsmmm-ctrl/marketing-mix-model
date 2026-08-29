/* McFly chrome v11 — app-first. Demo · Pricing · About. Custom parked. */
(function () {
  function ensureMeta(name, content) {
    if (document.querySelector('meta[name="' + name + '"]')) return;
    var meta = document.createElement("meta");
    meta.setAttribute("name", name);
    meta.setAttribute("content", content);
    document.head.appendChild(meta);
  }
  ensureMeta("mcfly-version", "v11");
  ensureMeta("mcfly-build", "app-first");

  var path = (location.pathname.replace(/\/$/, "") || "/").toLowerCase();
  var mount = document.querySelector("[data-chrome]");
  var foot = document.querySelector("[data-footer]");

  function active(href) {
    if (href === "/demo" && (path === "/demo" || path === "/product")) return ' aria-current="page"';
    if (href === "/pricing" && path === "/pricing") return ' aria-current="page"';
    if (href === "/about" && path === "/about") return ' aria-current="page"';
    return "";
  }

  if (mount) {
    mount.innerHTML =
      '<header class="nav" id="nav">' +
      '<div class="nav__inner">' +
      '<a class="nav__brand" href="/" aria-label="Mcfly Ads">' +
      '<img src="/assets/brand/mcfly-m.svg" width="28" height="28" alt="" />' +
      'Mcfly <span class="nav__brand-sub">Ads</span>' +
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
      '<a class="nav__cta" href="/demo">Try the demo</a>' +
      "</nav>" +
      '<button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-panel" aria-label="Open menu">' +
      "<span></span><span></span>" +
      "</button>" +
      "</div>" +
      '<div class="nav__panel" id="nav-panel">' +
      '<a href="/demo">Demo</a>' +
      '<a href="/pricing">Pricing</a>' +
      '<a href="/about">About</a>' +
      '<a href="/demo">Try the demo</a>' +
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
      '<img src="/assets/brand/mcfly-m.svg" width="24" height="24" alt="" />' +
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
