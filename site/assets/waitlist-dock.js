/**
 * Candidate B — mobile waitlist dock (≤720px).
 * Shows after hero exits; hides at #waitlist. Reuses [data-waitlist] in sheet.
 */
(function () {
  if (!document.body.classList.contains("home")) return;

  const reduce =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mq = window.matchMedia("(max-width: 720px)");

  const cssHref = "/assets/waitlist-dock.css?v=20260728a";
  if (!document.querySelector(`link[href="${cssHref}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssHref;
    document.head.appendChild(link);
  }

  const aside = document.createElement("aside");
  aside.className = "wl-dock";
  aside.setAttribute("data-waitlist-dock", "");
  aside.hidden = true;
  aside.innerHTML = `
    <button type="button" class="wl-dock__peek" aria-expanded="false" aria-controls="wl-dock-sheet">
      <span class="wl-dock__mark" aria-hidden="true"></span>
      <span class="wl-dock__label">Early access</span>
    </button>
    <div id="wl-dock-sheet" class="wl-dock__sheet" role="dialog" aria-labelledby="wl-dock-title" hidden>
      <div class="wl-dock__grab" aria-hidden="true"></div>
      <p id="wl-dock-title" class="wl-dock__title">Join early access</p>
      <p class="wl-dock__sub"><span class="mono">sales ÷ spend</span> — then your sales decide.</p>
      <form class="waitlist waitlist--dock" data-waitlist novalidate>
        <label>Email <input type="email" name="email" autocomplete="email" required /></label>
        <label class="sr-only">Name <input type="text" name="name" autocomplete="name" /></label>
        <button class="btn primary solid" type="submit">Request access</button>
      </form>
      <button type="button" class="wl-dock__close">Close</button>
    </div>`;
  document.body.appendChild(aside);

  const peek = aside.querySelector(".wl-dock__peek");
  const sheet = aside.querySelector("#wl-dock-sheet");
  const closeBtn = aside.querySelector(".wl-dock__close");
  const hero = document.querySelector(".hero");
  const waitlist = document.querySelector("#waitlist");

  let heroIn = true;
  let waitlistIn = false;

  function sync() {
    if (!mq.matches) {
      aside.hidden = true;
      sheet.hidden = true;
      peek.setAttribute("aria-expanded", "false");
      return;
    }
    const show = !heroIn && !waitlistIn;
    aside.hidden = !show;
    if (!show) {
      sheet.hidden = true;
      peek.setAttribute("aria-expanded", "false");
    }
  }

  function openSheet() {
    sheet.hidden = false;
    peek.setAttribute("aria-expanded", "true");
  }
  function closeSheet() {
    sheet.hidden = true;
    peek.setAttribute("aria-expanded", "false");
  }

  peek.addEventListener("click", () => {
    if (sheet.hidden) openSheet();
    else closeSheet();
  });
  closeBtn.addEventListener("click", closeSheet);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSheet();
  });

  if ("IntersectionObserver" in window) {
    if (hero) {
      new IntersectionObserver(
        ([e]) => {
          heroIn = e.isIntersecting;
          sync();
        },
        { threshold: 0.08 }
      ).observe(hero);
    }
    if (waitlist) {
      new IntersectionObserver(
        ([e]) => {
          waitlistIn = e.isIntersecting;
          sync();
        },
        { threshold: 0.12 }
      ).observe(waitlist);
    }
  } else {
    heroIn = false;
    sync();
  }

  mq.addEventListener("change", sync);
  if (reduce) aside.style.transition = "none";
  sync();
})();
