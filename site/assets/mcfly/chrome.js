/* McFly chrome v10 — firm: Mcfly Ads. Nav ≤5. Mobile = brand + menu only. */
(function () {
  function ensureMeta(name, content) {
    if (document.querySelector('meta[name="' + name + '"]')) return;
    var meta = document.createElement("meta");
    meta.setAttribute("name", name);
    meta.setAttribute("content", content);
    document.head.appendChild(meta);
  }
  ensureMeta("mcfly-version", "v10");
  ensureMeta("mcfly-build", "greenfield-terafab-bar");

  var path = (location.pathname.replace(/\/$/, "") || "/").toLowerCase();
  var mount = document.querySelector("[data-chrome]");
  var foot = document.querySelector("[data-footer]");

  function active(href) {
    if (href === "/lab" && (path === "/lab" || path === "/lab.html")) return ' aria-current="page"';
    if (href === "/custom-analytics" && path.indexOf("/custom") === 0) return ' aria-current="page"';
    if (href === "/demo" && (path === "/demo" || path === "/product" || path === "/pricing")) return ' aria-current="page"';
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
      '<a href="/lab"' +
      active("/lab") +
      ">Lab</a>" +
      '<a href="/custom-analytics"' +
      active("/custom-analytics") +
      ">Custom</a>" +
      '<a href="/demo"' +
      active("/demo") +
      ">App</a>" +
      '<a href="/about"' +
      active("/about") +
      ">About</a>" +
      '<a class="nav__cta" href="/custom-analytics#inquire">Inquire</a>' +
      "</nav>" +
      '<button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-panel" aria-label="Open menu">' +
      "<span></span><span></span>" +
      "</button>" +
      "</div>" +
      '<div class="nav__panel" id="nav-panel">' +
      '<a href="/lab">Lab</a>' +
      '<a href="/custom-analytics">Custom</a>' +
      '<a href="/demo">App</a>' +
      '<a href="/about">About</a>' +
      '<a href="/custom-analytics#inquire">Inquire</a>' +
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
    foot.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }
})();
