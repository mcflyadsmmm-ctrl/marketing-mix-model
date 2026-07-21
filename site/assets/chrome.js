(function () {
  const path = (location.pathname.replace(/\/$/, "") || "/").toLowerCase();
  const isHome = path === "/" || path === "/index.html" || path === "";

  const chrome = document.querySelector("[data-chrome]");
  if (chrome) {
    chrome.innerHTML = `
  <header class="top" data-top>
    <a class="brand" href="/" aria-label="Mcfly Analytics home">
      <span class="brand-mark" aria-hidden="true"></span>
      <span class="brand-name">Mcfly</span>
    </a>
    <nav class="nav" aria-label="Primary">
      <a href="/product" data-nav="product">Product</a>
      <a href="/pricing" data-nav="pricing">Pricing</a>
      <a href="${isHome ? "#live" : "/#live"}">Live</a>
      <a class="nav-cta" href="${isHome ? "#waitlist" : "/#waitlist"}">Free launch</a>
    </nav>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">
      <span></span><span></span>
    </button>
  </header>
  <div id="mobile-nav" class="mobile-nav" hidden>
    <a href="/product">Product</a>
    <a href="/pricing">Pricing</a>
    <a href="${isHome ? "#live" : "/#live"}">Live</a>
    <a href="${isHome ? "#waitlist" : "/#waitlist"}">Free launch</a>
  </div>`;
  }

  const footer = document.querySelector("[data-footer]");
  if (footer) {
    footer.innerHTML = `
  <footer class="foot">
    <div class="wrap foot-grid">
      <div class="foot-brand">Mcfly Analytics</div>
      <nav aria-label="Footer">
        <a href="/product">Product</a>
        <a href="/pricing">Pricing</a>
        <a href="/app">App</a>
        <a href="/download">Downloadable</a>
        <a href="/support">Support</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </nav>
      <p class="fine">© <span data-year></span> Mcfly. Spend vs sales — not attribution theater.</p>
    </div>
  </footer>`;
  }

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
})();
