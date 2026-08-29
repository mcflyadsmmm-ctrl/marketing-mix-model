/* Mcfly Ads chrome — Shopify app only */
(function () {
  function ensureMeta(name, content) {
    if (document.querySelector('meta[name="' + name + '"]')) return;
    const meta = document.createElement("meta");
    meta.setAttribute("name", name);
    meta.setAttribute("content", content);
    document.head.appendChild(meta);
  }
  ensureMeta("mcfly-version", "v6");
  ensureMeta("mcfly-build", "shopify-app-only");

  const path = (location.pathname.replace(/\/$/, "") || "/").toLowerCase();
  const cta = window.MCFLY_CTA;
  const shopifyPrimary =
    (cta && cta.primary()) || { label: "Try the demo", href: "/demo" };
  const shopifySecondary =
    (cta && cta.secondary()) || { label: "Try the demo", href: "/demo" };

  const chrome = document.querySelector("[data-chrome]");
  if (chrome) {
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
    <a href="/about">About</a>
    <a data-mcfly-cta="primary" href="${shopifyPrimary.href}">${shopifyPrimary.label}</a>
    <a data-mcfly-cta="demo" href="${shopifySecondary.href}">${shopifySecondary.label}</a>
  </div>`;
  }

  const footer = document.querySelector("[data-footer]");
  if (footer) {
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
        <a href="/faq">FAQ</a>
        <a href="/monday-close">Close memo</a>
        <a href="/mer-calculator">ROAS calculator</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </nav>
      <p class="fine">© <span data-year></span> Mcfly. See ad spend next to sales, day by day. 7-day trial then $39.</p>
    </div>
  </footer>`;
  }

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  const navKey = path.replace(/^\//, "").replace(/\.html$/, "") || "home";
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const on = link.getAttribute("data-nav") === navKey;
    link.classList.toggle("active", on);
    if (on) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
})();
