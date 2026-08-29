/* McFly chrome v9 — brand law: Mcfly Ads firm only. Lab · Custom · App · About · Inquire */
(function () {
  function ensureMeta(name, content) {
    if (document.querySelector('meta[name="' + name + '"]')) return;
    var meta = document.createElement("meta");
    meta.setAttribute("name", name);
    meta.setAttribute("content", content);
    document.head.appendChild(meta);
  }
  ensureMeta("mcfly-version", "v9");
  ensureMeta("mcfly-build", "brand-law-v9");

  var path = (location.pathname.replace(/\/$/, "") || "/").toLowerCase();
  var chrome = document.querySelector("[data-chrome]");
  var footer = document.querySelector("[data-footer]");

  function navActive(href) {
    if (href === "/lab" && (path === "/lab" || path === "/lab.html")) return ' aria-current="page"';
    if (href === "/custom-analytics" && path.indexOf("/custom") === 0) return ' aria-current="page"';
    if (href === "/demo" && (path === "/demo" || path === "/product" || path === "/pricing")) return ' aria-current="page"';
    if (href === "/about" && path === "/about") return ' aria-current="page"';
    return "";
  }

  if (chrome) {
    chrome.innerHTML =
      '<header class="top top--studio" data-top>' +
      '<a class="brand" href="/" aria-label="Mcfly Ads">' +
      '<img class="brand-mark-img" src="/assets/brand/mcfly-m.svg" width="32" height="32" alt="" />' +
      '<span class="brand-name">Mcfly <span class="brand-name-sub">Ads</span></span>' +
      "</a>" +
      '<nav class="nav nav--studio" aria-label="Primary">' +
      '<a href="/lab"' +
      navActive("/lab") +
      ">Lab</a>" +
      '<a href="/custom-analytics"' +
      navActive("/custom-analytics") +
      ">Custom</a>" +
      '<a href="/demo"' +
      navActive("/demo") +
      ">App</a>" +
      '<a href="/about"' +
      navActive("/about") +
      ">About</a>" +
      '<a class="nav-cta" href="/custom-analytics#inquire">Inquire</a>' +
      "</nav>" +
      '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">' +
      "<span></span><span></span>" +
      "</button>" +
      "</header>" +
      '<div id="mobile-nav" class="mobile-nav" hidden>' +
      '<a href="/lab">Lab</a>' +
      '<a href="/custom-analytics">Custom</a>' +
      '<a href="/demo">App</a>' +
      '<a href="/about">About</a>' +
      '<a href="/custom-analytics#inquire">Inquire</a>' +
      "</div>";
  }

  if (footer) {
    footer.innerHTML =
      '<footer class="foot foot--studio">' +
      '<div class="wrap foot-grid">' +
      '<div class="foot-brand">' +
      '<img src="/assets/brand/mcfly-m.svg" width="28" height="28" alt="" />' +
      "<span>Mcfly Ads</span>" +
      "</div>" +
      '<nav aria-label="Footer">' +
      '<a href="/lab">Lab</a>' +
      '<a href="/custom-analytics">Custom</a>' +
      '<a href="/demo">App</a>' +
      '<a href="/about">About</a>' +
      '<a href="/custom-analytics#inquire">Inquire</a>' +
      '<a href="/privacy">Privacy</a>' +
      "</nav>" +
      '<p class="fine">© <span data-year></span> Mcfly Ads. Advanced data science, displayed simply. You keep the system.</p>' +
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
