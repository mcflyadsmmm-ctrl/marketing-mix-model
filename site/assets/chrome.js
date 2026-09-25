/* Studio chrome: one sans M = favicon = header. Home/app keep the ribbon M. */
(function () {
  function ensureMeta(name, content) {
    if (document.querySelector('meta[name="' + name + '"]')) return;
    const meta = document.createElement("meta");
    meta.setAttribute("name", name);
    meta.setAttribute("content", content);
    document.head.appendChild(meta);
  }
  ensureMeta("mcfly-version", "v4");
  ensureMeta("mcfly-build", "pr-23");

  const path = (location.pathname.replace(/\/$/, "") || "/").toLowerCase();
  const isAnalytics =
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
    <a class="brand" href="/" aria-label="Mcfly Analytics">
      <img class="brand-mark-img" src="/favicon-192.png" width="32" height="32" alt="" />
      <span class="brand-name">Mcfly Analytics</span>
    </a>
    <nav class="nav" aria-label="Primary">
      <a href="/demo" data-nav="demo">Desk</a>
      <a href="/product" data-nav="product">Product</a>
      <a href="/pricing" data-nav="pricing">Pricing</a>
      <a href="/support" data-nav="support">Support</a>
      <a class="nav-cta" data-mcfly-cta="primary" href="${shopifyPrimary.href}">${shopifyPrimary.label}</a>
    </nav>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">
      <span></span><span></span>
    </button>
  </header>
  <div id="mobile-nav" class="mobile-nav" hidden>
    <a href="/demo">Desk</a>
    <a href="/product">Product</a>
    <a href="/pricing">Pricing</a>
    <a href="/support">Support</a>
    <a href="/faq">FAQ</a>
    <a href="/about">About</a>
    <a href="/monday-close">Close memo</a>
    <a data-mcfly-cta="primary" href="${shopifyPrimary.href}">${shopifyPrimary.label}</a>
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
        <span>Mcfly Analytics</span>
      </div>
      <nav aria-label="Footer">
        <a href="/demo">Desk</a>
        <a href="/product">Product</a>
        <a href="/pricing">Pricing</a>
        <a href="/support">Support</a>
        <a href="/faq">FAQ</a>
        <a href="/about">About</a>
        <a href="/monday-close">Close memo</a>
        <a href="/privacy">Privacy</a>
        <a href="/custom-analytics">Custom Data Solutions</a>
      </nav>
      <p class="fine">© <span data-year></span> Mcfly Analytics. 7-day trial, then $39 per store per month. No ads.</p>
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

  void shopifySecondary;
})();
