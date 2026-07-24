/**
 * Candidate B — mobile thumb-edge waitlist dock.
 * Disjoint from chrome sticky bar; safe to remove sticky later and keep this.
 * Load before app.js so [data-waitlist] binds on the injected form.
 */
(function () {
  if (!document.body || !document.body.classList.contains("home")) return;
  if (document.querySelector("[data-waitlist-dock]")) return;

  const scriptEl = document.currentScript;
  let cssHref = "/assets/waitlist-dock.css?v=20260722q";
  if (scriptEl && scriptEl.src) {
    const slash = scriptEl.src.lastIndexOf("/");
    const q = scriptEl.src.indexOf("?");
    const base = slash >= 0 ? scriptEl.src.slice(0, slash + 1) : "/assets/";
    const query = q >= 0 ? scriptEl.src.slice(q) : "?v=20260722q";
    cssHref = base + "waitlist-dock.css" + query;
  }

  if (!document.querySelector('link[href*="waitlist-dock.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssHref;
    document.head.appendChild(link);
  }

  const root = document.createElement("aside");
  root.className = "wl-dock";
  root.setAttribute("data-waitlist-dock", "");
  root.setAttribute("aria-label", "Early access");
  root.hidden = true;
  root.innerHTML = `
  <button type="button" class="wl-dock__peek" aria-expanded="false" aria-controls="wl-dock-sheet">
    <span class="wl-dock__mark" aria-hidden="true"></span>
    <span class="wl-dock__label">Early access</span>
  </button>
  <div id="wl-dock-sheet" class="wl-dock__sheet" role="dialog" aria-modal="true" aria-labelledby="wl-dock-title" hidden inert>
    <div class="wl-dock__grab" aria-hidden="true"></div>
    <p id="wl-dock-title" class="wl-dock__title">Join early access</p>
    <p class="wl-dock__sub"><span class="mono">sales ÷ spend</span> — then the till decides.</p>
    <form class="waitlist waitlist--dock" data-waitlist novalidate>
      <label>Name <input type="text" name="name" autocomplete="name" required /></label>
      <label>Email <input type="email" name="email" autocomplete="email" required /></label>
      <p class="note" data-waitlist-error hidden role="alert"></p>
      <div class="wl-dock__actions">
        <button class="btn primary solid" type="submit">Request access</button>
        <button type="button" class="wl-dock__close">Close</button>
      </div>
    </form>
    <div class="waitlist-confirm" hidden aria-live="polite">
      <p class="confirm-title">Draft ready — send to join</p>
      <p>You’re not on the list until that message goes out.</p>
      <p class="note" data-waitlist-meta></p>
      <div class="cta-row">
        <a class="btn primary solid" data-waitlist-open href="mailto:mcflyadsmmm@gmail.com">Open email app</a>
        <button type="button" class="btn primary" data-waitlist-copy>Copy message</button>
      </div>
      <p class="note" data-waitlist-copy-status hidden role="status"></p>
      <p class="note"><button type="button" data-waitlist-edit style="font: inherit; font-weight: 600; color: var(--truth); background: none; border: 0; padding: 0; cursor: pointer; text-decoration: underline">Edit answers</button></p>
    </div>
  </div>`;
  document.body.appendChild(root);

  const peek = root.querySelector(".wl-dock__peek");
  const sheet = root.querySelector("#wl-dock-sheet");
  const closeBtn = root.querySelector(".wl-dock__close");
  const mq = window.matchMedia("(max-width: 720px)");
  const hero = document.querySelector(".hero");
  const waitlist = document.getElementById("waitlist");

  let heroInView = true;
  let waitlistInView = false;
  let navOpen = false;
  let sheetOpen = false;
  let lastFocus = null;

  function canShow() {
    return mq.matches && !heroInView && !waitlistInView && !navOpen;
  }

  function syncDock() {
    const show = canShow();
    if (!show) {
      root.classList.remove("is-visible");
      root.hidden = true;
      document.body.classList.remove("has-waitlist-dock");
      if (sheetOpen) collapseSheet(false);
      return;
    }
    root.hidden = false;
    document.body.classList.add("has-waitlist-dock");
    // Next frame so peek can transition from off-edge.
    requestAnimationFrame(() => {
      if (canShow()) root.classList.add("is-visible");
    });
  }

  function openSheet() {
    if (!canShow() || !peek || !sheet) return;
    sheetOpen = true;
    lastFocus = document.activeElement;
    sheet.hidden = false;
    sheet.removeAttribute("inert");
    root.classList.add("is-open");
    peek.setAttribute("aria-expanded", "true");
    const focusTarget =
      sheet.querySelector('input[name="name"]') ||
      sheet.querySelector('input[name="email"]');
    if (focusTarget && typeof focusTarget.focus === "function") {
      focusTarget.focus();
    }
  }

  function collapseSheet(restoreFocus) {
    if (!peek || !sheet) return;
    sheetOpen = false;
    sheet.hidden = true;
    sheet.setAttribute("inert", "");
    root.classList.remove("is-open");
    peek.setAttribute("aria-expanded", "false");
    if (restoreFocus !== false && lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
    lastFocus = null;
  }

  if (peek) {
    peek.addEventListener("click", () => {
      if (sheetOpen) collapseSheet();
      else openSheet();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => collapseSheet());
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sheetOpen) {
      event.preventDefault();
      collapseSheet();
    }
  });

  if (hero && typeof IntersectionObserver === "function") {
    const heroIo = new IntersectionObserver((entries) => {
      const entry = entries[0];
      heroInView = Boolean(entry && entry.isIntersecting);
      syncDock();
    }, { root: null, threshold: 0 });
    heroIo.observe(hero);
  } else {
    heroInView = false;
  }

  if (waitlist && typeof IntersectionObserver === "function") {
    const waitIo = new IntersectionObserver((entries) => {
      const entry = entries[0];
      waitlistInView = Boolean(entry && entry.isIntersecting);
      syncDock();
    }, {
      root: null,
      threshold: 0,
      // Hide slightly before the form band fills the viewport (avoids double CTA).
      rootMargin: "0px 0px -28% 0px",
    });
    waitIo.observe(waitlist);
  }

  function onMqChange() {
    syncDock();
  }

  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onMqChange);
  } else if (typeof mq.addListener === "function") {
    mq.addListener(onMqChange);
  }

  document.addEventListener("mcfly:mobile-nav", (e) => {
    navOpen = Boolean(e.detail && e.detail.open);
    syncDock();
  });

  syncDock();
})();
