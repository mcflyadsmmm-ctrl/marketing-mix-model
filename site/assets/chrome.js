(function () {
  const path = (location.pathname.replace(/\/$/, "") || "/").toLowerCase();
  const isHome = path === "/" || path === "/index.html" || path === "";
  const waitlistHref = isHome ? "#waitlist" : "/#waitlist";

  const cta = window.MCFLY_CTA;
  const primary =
    (cta && cta.primary()) ||
    (window.MCFLY_APP_STORE_LIVE
      ? { label: "Get free install", href: "/support" }
      : { label: "Request Partner invite", href: waitlistHref });
  const secondary =
    (cta && cta.secondary()) ||
    (window.MCFLY_APP_STORE_LIVE
      ? { label: "Partner invite", href: waitlistHref }
      : { label: "App Store Free when listed", href: "/support" });

  const chrome = document.querySelector("[data-chrome]");
  if (chrome) {
    chrome.innerHTML = `
  <header class="top" data-top>
    <a class="brand" href="/" aria-label="Mcfly Ads home">
      <img class="brand-mark-img" src="/assets/brand/mcfly-m-transparent.png" width="36" height="36" alt="" />
      <span class="brand-name">Mcfly <span class="brand-name-sub">Ads</span></span>
    </a>
    <nav class="nav" aria-label="Primary">
      <a href="/product" data-nav="product">Product</a>
      <a href="/pricing" data-nav="pricing">Pricing</a>
      <a href="/demo" data-nav="demo">Demo</a>
      <a href="${isHome ? "#digest" : "/#digest"}">How it works</a>
      <a href="/support" data-nav="support">Support</a>
      <a class="nav-cta" data-mcfly-cta="primary" href="${primary.href}">${primary.label}</a>
    </nav>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">
      <span></span><span></span>
    </button>
  </header>
  <div id="mobile-nav" class="mobile-nav" hidden>
    <a href="/product">Product</a>
    <a href="/pricing">Pricing</a>
    <a href="/demo">Demo</a>
    <a href="${isHome ? "#digest" : "/#digest"}">How it works</a>
    <a href="/support">Support</a>
    <a data-mcfly-cta="primary" href="${primary.href}">${primary.label}</a>
    <a data-mcfly-cta="secondary" href="${secondary.href}">${secondary.label}</a>
  </div>`;
  }

  const footer = document.querySelector("[data-footer]");
  if (footer) {
    footer.innerHTML = `
  <footer class="foot">
    <div class="wrap foot-grid">
      <div class="foot-brand">
        <img src="/assets/brand/mcfly-m-transparent.png" width="28" height="28" alt="" />
        <span>Mcfly Ads</span>
      </div>
      <nav aria-label="Footer">
        <a href="/product">Product</a>
        <a href="/product#spend-csv">Paste spend</a>
        <a href="/pricing">Pricing</a>
        <a href="/cash-mer">Total ROAS</a>
        <a href="/demo">Demo desk</a>
        <a href="/faq">FAQ</a>
        <a href="/why-pixels-fail">Why pixels fail</a>
        <a href="/vs-attribution-suites">Total ROAS vs suites</a>
        <a href="/app">App</a>
        <a href="/download">Calculator</a>
        <a href="/support">Support</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </nav>
        <p class="fine">© <span data-year></span> Mcfly Ads. Marketing Data Science — Total ROAS = sales ÷ spend.</p>
    </div>
  </footer>`;
  }

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  // Sticky bar (Candidate A) retired — Candidate B waitlist-dock.js owns mobile CTA.
})();
