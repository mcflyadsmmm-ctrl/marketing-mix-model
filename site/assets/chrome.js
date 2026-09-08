/* launch-v4-20260908 · Shopify cash desk chrome. Enterprise/custom is footer-only. */
(function () {
  const cta = window.MCFLY_CTA;
  const shopifyPrimary =
    (cta && cta.primary()) || {
      label: "Install on Shopify",
      href: "https://apps.shopify.com/mcfly-analytics-public",
    };
  const shopifySecondary =
    (cta && cta.secondary()) || { label: "See SAMPLE desk", href: "/product#desk" };

  const chrome = document.querySelector("[data-chrome]");
  if (chrome) {
    chrome.innerHTML = `
  <header class="top" data-top>
    <a class="brand" href="/" aria-label="Mcfly Analytics home">
      <img class="brand-mark-img" src="/assets/brand/mcfly-m-transparent.png" width="36" height="36" alt="" />
      <span class="brand-name">Mcfly <span class="brand-name-sub">Analytics</span></span>
    </a>
    <nav class="nav" aria-label="Primary">
      <a href="/product" data-nav="product">Product</a>
      <a href="/pricing" data-nav="pricing">Pricing</a>
      <a href="/faq" data-nav="faq">FAQ</a>
      <a href="/support" data-nav="support">Support</a>
      <a class="nav-cta" data-mcfly-cta="primary" rel="noopener" href="${shopifyPrimary.href}">${shopifyPrimary.label}</a>
    </nav>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">
      <span></span><span></span>
    </button>
  </header>
  <div id="mobile-nav" class="mobile-nav" hidden>
    <a href="/product">Product</a>
    <a href="/pricing">Pricing</a>
    <a href="/faq">FAQ</a>
    <a href="/support">Support</a>
    <a class="mobile-nav__cta" data-mcfly-cta="primary" rel="noopener" href="${shopifyPrimary.href}">${shopifyPrimary.label}</a>
    <a data-mcfly-cta="demo" href="${shopifySecondary.href}">${shopifySecondary.label}</a>
  </div>`;
  }

  const footer = document.querySelector("[data-footer]");
  if (footer) {
    footer.innerHTML = `
  <footer class="foot">
    <div class="wrap foot-grid">
      <div class="foot-brand">
        <img src="/assets/brand/mcfly-m-transparent.png" width="28" height="28" alt="" />
        <span>Mcfly Analytics</span>
      </div>
      <nav aria-label="Footer">
        <a href="/product">Product</a>
        <a href="/app">What’s in the desk</a>
        <a href="/product#spend">Add spend</a>
        <a href="/pricing">Pricing</a>
        <a href="/total-roas">Total ROAS glossary</a>
        <a href="/about">About</a>
        <a href="/faq">FAQ</a>
        <a href="/monday-close">Monday Close</a>
        <a href="/mer-calculator">ROAS calculator</a>
        <a href="/break-even-roas-calculator">Break-even calculator</a>
        <a href="/mds-made-easy/">MDS Made Easy</a>
        <a href="https://apps.shopify.com/mcfly-analytics-public" rel="noopener">Install on Shopify</a>
        <a href="/support">Support</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/cookies">Cookies</a>
        <a href="/security">Security</a>
        <a href="/dpa">DPA</a>
      </nav>
      <p class="fine">© <span data-year></span> Mcfly Analytics. Shopify sales next to spend you added. Total ROAS = sales ÷ spend. $39/mo · 7-day trial.</p>
      <p class="foot-enterprise">Need a scoped non-Shopify or multi-system desk? <a href="/custom-analytics">Enterprise / custom inquire</a> — not the App Store product.</p>
    </div>
  </footer>`;
  }

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
})();
