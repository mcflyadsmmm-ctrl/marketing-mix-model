/* Studio chrome: one sans M = favicon = header. Home/app keep the ribbon M. */
(function () {
  function ensureMeta(name, content) {
    if (document.querySelector('meta[name="' + name + '"]')) return;
    const meta = document.createElement("meta");
    meta.setAttribute("name", name);
    meta.setAttribute("content", content);
    document.head.appendChild(meta);
  }
  ensureMeta("mcfly-version", "v2");
  ensureMeta("mcfly-build", "pr-23");

  const path = (location.pathname.replace(/\/$/, "") || "/").toLowerCase();
  const isHome = path === "/" || path === "/index.html" || path === "";
  const isAnalytics =
    isHome ||
    path === "/about" ||
    path === "/about.html" ||
    path === "/custom-analytics" ||
    path === "/custom-analytics.html" ||
    path === "/lab" ||
    path === "/lab.html" ||
    path === "/advanced-mds" ||
    path === "/advanced-mds.html" ||
    path.startsWith("/custom-analytics") ||
    document.body.classList.contains("ca-page") ||
    document.body.getAttribute("data-site") === "analytics";

  const cta = window.MCFLY_CTA;
  const shopifyPrimary =
    (cta && cta.primary()) || { label: "Try the demo", href: "/demo" };
  const shopifySecondary =
    (cta && cta.secondary()) || { label: "Try the demo", href: "/demo" };

  const chrome = document.querySelector("[data-chrome]");
  if (chrome && isAnalytics) {
    chrome.innerHTML = `
  <header class="top top--studio" data-top>
    <a class="brand" href="/custom-analytics" aria-label="Mcfly Ads">
      <img class="brand-mark-img" src="/assets/brand/mcfly-m.svg" width="32" height="32" alt="" />
      <span class="brand-name">Mcfly <span class="brand-name-sub">Ads</span></span>
    </a>
    <nav class="nav nav--studio" aria-label="Studio">
      <a href="/custom-analytics#process" data-ca-nav="process">Process</a>
      <a href="/custom-analytics#packages" data-ca-nav="packages">Packages</a>
      <a href="/custom-analytics#specimen" data-ca-nav="specimen">Specimen</a>
      <a href="/about" data-ca-nav="about">About</a>
      <a class="nav-cta" href="/custom-analytics#inquire" data-ca-nav="inquire">Inquire</a>
    </nav>
  </header>`;
  } else if (chrome) {
    chrome.innerHTML = `
  <header class="top" data-top>
    <a class="brand" href="/" aria-label="Mcfly">
      <img class="brand-mark-img" src="/favicon-192.png" width="32" height="32" alt="" />
      <span class="brand-name">Mcfly</span>
    </a>
    <nav class="nav" aria-label="Primary">
      <a href="/product" data-nav="product">Product</a>
      <a href="/pricing" data-nav="pricing">Pricing</a>
      <a href="/demo" data-nav="demo">Demo</a>
      <a href="/support" data-nav="support">Support</a>
      <a class="nav-cta" data-mcfly-cta="primary" href="${shopifyPrimary.href}">${shopifyPrimary.label}</a>
    </nav>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">
      <span></span><span></span>
    </button>
  </header>
  <div id="mobile-nav" class="mobile-nav" hidden>
    <a href="/product">Product</a>
    <a href="/pricing">Pricing</a>
    <a href="/demo">Demo</a>
    <a href="/support">Support</a>
    <a href="/custom-analytics">Custom Data Solutions</a>
    <a data-mcfly-cta="primary" href="${shopifyPrimary.href}">${shopifyPrimary.label}</a>
    <a data-mcfly-cta="demo" href="${shopifySecondary.href}">${shopifySecondary.label}</a>
  </div>`;
  }

  const footer = document.querySelector("[data-footer]");
  if (footer && isAnalytics) {
    footer.innerHTML = `
  <footer class="foot foot--analytics">
    <div class="wrap foot-grid">
      <div class="foot-brand">
        <img src="/assets/brand/mcfly-m.svg" width="28" height="28" alt="" />
        <span>Mcfly Ads</span>
      </div>
      <nav aria-label="Footer">
        <a href="/custom-analytics#process">Process</a>
        <a href="/custom-analytics#packages">Packages</a>
        <a href="/custom-analytics#specimen">Specimen</a>
        <a href="/about">About</a>
        <a href="/custom-analytics#inquire">Inquire</a>
        <a href="/privacy">Privacy</a>
      </nav>
      <p class="fine">© <span data-year></span> Mcfly Ads. Hired reporting. You keep the system.</p>
    </div>
  </footer>`;
  } else if (footer) {
    footer.innerHTML = `
  <footer class="foot">
    <div class="wrap foot-grid">
      <div class="foot-brand">
        <img src="/favicon-192.png" width="28" height="28" alt="" />
        <span>Mcfly</span>
      </div>
      <nav aria-label="Footer">
        <a href="/product">Product</a>
        <a href="/pricing">Pricing</a>
        <a href="/demo">Demo</a>
        <a href="/about">About</a>
        <a href="/support">Support</a>
        <a href="/privacy">Privacy</a>
        <a href="/monday-close">Close memo</a>
        <a href="/custom-analytics">Custom Data Solutions</a>
      </nav>
      <p class="fine">© <span data-year></span> Mcfly. See ad spend next to sales, day by day. 7-day trial then $39.</p>
    </div>
  </footer>`;
  }

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  if (isAnalytics) {
    const hash = (location.hash || "").replace(/^#/, "");
    const map = {
      process: "process",
      "build-log": "process",
      how: "process",
      packages: "packages",
      specimen: "specimen",
      inquire: "inquire",
      overview: "packages",
      contracts: "packages",
      handoff: "packages",
    };
    const key = map[hash] || "";
    document.querySelectorAll("[data-ca-nav]").forEach((link) => {
      const on = key && link.getAttribute("data-ca-nav") === key;
      link.classList.toggle("active", on);
      if (on) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    window.addEventListener("hashchange", () => {
      const h = (location.hash || "").replace(/^#/, "");
      const k = map[h] || "";
      document.querySelectorAll("[data-ca-nav]").forEach((link) => {
        const on = k && link.getAttribute("data-ca-nav") === k;
        link.classList.toggle("active", on);
        if (on) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    });
  }

  void isHome;
  void shopifySecondary;
})();
