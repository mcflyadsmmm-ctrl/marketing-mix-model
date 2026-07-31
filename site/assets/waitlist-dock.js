/* launch-v2-20260728 */
/**
 * Mobile install dock (≤720px). Launch path: App Store / Support — no Install free.
 */
(function () {
  if (!document.body.classList.contains("home")) return;

  const reduce =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mq = window.matchMedia("(max-width: 720px)");

  const cssHref = "/assets/waitlist-dock.css?v=20260728launch";
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
    <a class="wl-dock__peek" href="/support">
      <span class="wl-dock__mark" aria-hidden="true"></span>
      <span class="wl-dock__label">Install free</span>
    </a>
  `;
  document.body.appendChild(aside);

  const hero = document.querySelector(".hero");
  const closeBand = document.querySelector("#install") || document.querySelector("#waitlist") || document.querySelector(".band.close");

  let heroIn = true;
  let closeIn = false;

  function sync() {
    if (!mq.matches) {
      aside.hidden = true;
      return;
    }
    aside.hidden = !(!heroIn && !closeIn);
  }

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
    if (closeBand) {
      new IntersectionObserver(
        ([e]) => {
          closeIn = e.isIntersecting;
          sync();
        },
        { threshold: 0.12 }
      ).observe(closeBand);
    }
  } else {
    heroIn = false;
    sync();
  }

  mq.addEventListener("change", sync);
  if (reduce) aside.style.transition = "none";
  sync();
})();
