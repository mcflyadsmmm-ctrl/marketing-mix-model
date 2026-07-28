(function () {
  const path = (location.pathname.replace(/\/$/, "") || "/").toLowerCase();
  const isHome = path === "/" || path === "/index.html" || path === "";

  const chrome = document.querySelector("[data-chrome]");
  if (chrome) {
    chrome.innerHTML = `
  <header class="top" data-top>
    <a class="brand" href="/" aria-label="Mcfly Ads home">
      <img class="brand-mark-img" src="/assets/brand/mcfly-m-transparent.png" width="36" height="36" alt="" />
      <span class="brand-name">Mcfly <span class="brand-name-sub">Ads</span></span>
    </a>
    <nav class="nav" aria-label="Primary">
      <a href="/product.html" data-nav="product">Product</a>
      <a href="/pricing.html" data-nav="pricing">Pricing</a>
      <a href="${isHome ? "#digest" : "/#digest"}">How it works</a>
      <a href="/support.html" data-nav="support">Support</a>
      <a class="nav-cta" href="/support.html">Install Free</a>
    </nav>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">
      <span></span><span></span>
    </button>
  </header>
  <div id="mobile-nav" class="mobile-nav" hidden>
    <a href="/product.html">Product</a>
    <a href="/pricing.html">Pricing</a>
    <a href="${isHome ? "#digest" : "/#digest"}">How it works</a>
    <a href="/support.html">Support</a>
    <a href="/support.html">Install Free</a>
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
        <a href="/product.html">Product</a>
        <a href="/product.html#spend-csv">Spend CSV</a>
        <a href="/pricing.html">Pricing</a>
        <a href="/cash-mer.html">Total ROAS</a>
        <a href="/faq.html">FAQ</a>
        <a href="/why-pixels-fail.html">Why pixels fail</a>
        <a href="/vs-attribution-suites.html">Total ROAS vs suites</a>
        <a href="/app.html">App</a>
        <a href="/download.html">Calculator</a>
        <a href="/support.html">Support</a>
        <a href="/privacy.html">Privacy</a>
        <a href="/terms.html">Terms</a>
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
