(function () {
  const path = (location.pathname.replace(/\/$/, "") || "/").toLowerCase();
  const isHome = path === "/" || path === "/index.html" || path === "";

  const chrome = document.querySelector("[data-chrome]");
  if (chrome) {
    chrome.innerHTML = `
  <header class="top" data-top>
    <a class="brand" href="/" aria-label="Mcfly Analytics home">
      <span class="brand-mark" aria-hidden="true"></span>
      <span class="brand-name">Mcfly Analytics</span>
    </a>
    <nav class="nav" aria-label="Primary">
      <a href="/custom" data-nav="custom">Custom work</a>
      <a href="/lab" data-nav="lab">Sample lab</a>
      <a href="/about" data-nav="about">About</a>
      <a href="/pricing" data-nav="pricing">Pricing</a>
      <a class="nav-cta" href="/custom#inquire">Request a proposal</a>
    </nav>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">
      <span></span><span></span>
    </button>
  </header>
  <div id="mobile-nav" class="mobile-nav" hidden>
    <a href="/custom">Custom work</a>
    <a href="/lab">Sample lab</a>
    <a href="/about">About</a>
    <a href="/pricing">Pricing</a>
    <a href="/custom#inquire">Request a proposal</a>
    <a href="${isHome ? "#waitlist" : "/#waitlist"}">App launch list</a>
  </div>`;
  }

  const footer = document.querySelector("[data-footer]");
  if (footer) {
    footer.innerHTML = `
  <footer class="foot">
    <div class="wrap foot-grid">
      <div class="foot-brand">Mcfly Analytics</div>
      <nav aria-label="Footer">
        <a href="/custom">Custom work</a>
        <a href="/lab">Sample lab</a>
        <a href="/about">About</a>
        <a href="/pricing">Pricing</a>
        <a href="/support">Support</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </nav>
      <p class="fine">© <span data-year></span> Mcfly. Ads and finance should agree. Marty Smithson · <a href="mailto:invites@mcflyads.com">invites@mcflyads.com</a></p>
    </div>
  </footer>`;
  }

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
})();
