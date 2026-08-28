/* launch-v2-20260826 · dual site chrome: Shopify Ads ↔ Custom Analytics */
(function () {
  const path = (location.pathname.replace(/\/$/, "") || "/").toLowerCase();
  const isHome = path === "/" || path === "/index.html" || path === "";
  const isAnalytics =
    path === "/custom-analytics" ||
    path === "/custom-analytics.html" ||
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
  <div class="site-mode-bar site-mode-bar--analytics" role="navigation" aria-label="Site mode">
    <p class="site-mode-bar__label">Two Mcfly products</p>
    <div class="site-mode-toggle" role="group" aria-label="Switch site">
      <a class="site-mode-toggle__opt" href="/">Shopify App</a>
      <a class="site-mode-toggle__opt is-on" href="/custom-analytics" aria-current="page">Custom Data Solutions</a>
    </div>
  </div>
  <header class="top top--analytics" data-top>
    <a class="brand" href="/custom-analytics" aria-label="Mcfly Analytics home">
      <img class="brand-mark-img" src="/assets/brand/mcfly-m.svg" width="36" height="36" alt="" />
      <span class="brand-name">Mcfly <span class="brand-name-sub">Analytics</span></span>
    </a>
    <nav class="nav nav--analytics" aria-label="Analytics">
      <a href="/custom-analytics#overview" data-ca-nav="overview">Overview</a>
      <a href="/custom-analytics#recon" data-ca-nav="labs">Labs</a>
      <a href="/custom-analytics#packages" data-ca-nav="packages">Packages</a>
      <a href="/custom-analytics#privacy" data-ca-nav="privacy">Privacy</a>
      <a href="/custom-analytics#inquire" data-ca-nav="inquire">Inquire</a>
      <a class="nav-cta" href="/custom-analytics#inquire">Request a proposal</a>
    </nav>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">
      <span></span><span></span>
    </button>
  </header>
  <div id="mobile-nav" class="mobile-nav" hidden>
    <a href="/custom-analytics#overview">Overview</a>
    <a href="/custom-analytics#recon">Labs</a>
    <a href="/custom-analytics#packages">Packages</a>
    <a href="/custom-analytics#privacy">Privacy</a>
    <a href="/custom-analytics#inquire">Inquire</a>
    <a href="/custom-analytics#inquire">Request a proposal</a>
      <a href="/">← Shopify App (Mcfly Analytics)</a>
  </div>`;
  } else if (chrome) {
    chrome.innerHTML = `
  <div class="site-mode-bar site-mode-bar--shopify" role="navigation" aria-label="Site mode">
    <p class="site-mode-bar__label">Two Mcfly products</p>
    <div class="site-mode-toggle" role="group" aria-label="Switch site">
      <a class="site-mode-toggle__opt is-on" href="/" aria-current="page">Shopify App</a>
      <a class="site-mode-toggle__opt" href="/custom-analytics">Custom Data Solutions</a>
    </div>
  </div>
  <header class="top" data-top>
    <a class="brand" href="/" aria-label="Mcfly Analytics home">
      <img class="brand-mark-img" src="/assets/brand/mcfly-m.svg" width="36" height="36" alt="" />
      <span class="brand-name">Mcfly <span class="brand-name-sub">Analytics</span></span>
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
        <span>Mcfly Analytics</span>
      </div>
      <nav aria-label="Footer">
        <a href="/custom-analytics#overview">Overview</a>
        <a href="/custom-analytics#recon">Labs</a>
        <a href="/custom-analytics#packages">Packages</a>
        <a href="/custom-analytics#privacy">Privacy</a>
        <a href="/custom-analytics#inquire">Inquire</a>
        <a href="/security">Security</a>
        <a href="/privacy">Privacy policy</a>
        <a href="/dpa">DPA</a>
        <a href="/product">← Mcfly Analytics (Shopify)</a>
      </nav>
      <p class="fine">© <span data-year></span> Mcfly Analytics. Custom data science · $5–25K scoped builds. Not the Shopify cash desk.</p>
    </div>
  </footer>`;
  } else if (footer) {
    footer.innerHTML = `
  <footer class="foot">
    <div class="wrap foot-grid">
      <div class="foot-brand">
        <img src="/assets/brand/mcfly-m.svg" width="28" height="28" alt="" />
        <span>Mcfly Analytics</span>
      </div>
      <nav aria-label="Footer">
        <a href="/product">Product</a>
        <a href="/pricing">Pricing</a>
        <a href="/demo">Demo</a>
        <a href="/product#spend-csv">Paste spend</a>
        <a href="/cash-mer">Total ROAS</a>
        <a href="/about">About</a>
        <a href="/faq">FAQ</a>
        <a href="/platform-variance">Platform variance</a>
        <a href="/monday-close">Monday Close memo</a>
        <a href="/mer-calculator">ROAS calculator</a>
        <a href="/break-even-roas-calculator">Break-even calculator</a>
        <a href="/download">Calculator (PWA)</a>
        <a href="/support">Support</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/cookies">Cookies</a>
        <a href="/security">Security</a>
        <a href="/dpa">DPA</a>
        <a href="/custom-analytics">Custom Data Solutions</a>
      </nav>
      <p class="fine">© <span data-year></span> Mcfly Analytics. See ad spend next to sales, day by day. 7-day trial then $39.</p>
    </div>
  </footer>`;
  }

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  // Highlight analytics subtab from hash
  if (isAnalytics) {
    const hash = (location.hash || "#overview").replace(/^#/, "");
    const map = {
      overview: "overview",
      main: "overview",
      recon: "labs",
      "lead-gen": "labs",
      "ca-labs": "labs",
      packages: "packages",
      privacy: "privacy",
      fit: "packages",
      inquire: "inquire",
    };
    const key = map[hash] || "overview";
    document.querySelectorAll("[data-ca-nav]").forEach((link) => {
      const on = link.getAttribute("data-ca-nav") === key;
      link.classList.toggle("active", on);
      if (on) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    window.addEventListener("hashchange", () => {
      const h = (location.hash || "#overview").replace(/^#/, "");
      const k = map[h] || "overview";
      document.querySelectorAll("[data-ca-nav]").forEach((link) => {
        const on = link.getAttribute("data-ca-nav") === k;
        link.classList.toggle("active", on);
        if (on) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    });
  }

  void isHome;
})();
