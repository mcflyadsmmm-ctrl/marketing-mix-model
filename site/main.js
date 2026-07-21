(function () {
  const year = document.getElementById("y");
  if (year) year.textContent = String(new Date().getFullYear());

  const toggle = document.querySelector(".nav-toggle");
  const mobile = document.getElementById("mobile-nav");
  if (toggle && mobile) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      mobile.hidden = open;
    });
  }

  const money = (n) =>
    n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  const spendRange = document.getElementById("spend-range");
  const spendOut = document.getElementById("spend-out");
  const claimedRoas = document.getElementById("claimed-roas");
  const claimedRev = document.getElementById("claimed-rev");
  const cashMer = document.getElementById("cash-mer");
  const actualSales = document.getElementById("actual-sales");

  const FIXED_SALES = 312400;

  function updateClaims() {
    if (!spendRange) return;
    const spend = Number(spendRange.value);
    const claimedMult = 4.8;
    const claimed = spend * claimedMult;
    const mer = FIXED_SALES / spend;
    spendOut.textContent = money(spend);
    claimedRoas.textContent = claimedMult.toFixed(1) + "× ROAS";
    claimedRev.textContent = "~" + money(claimed) + " attributed";
    actualSales.textContent = money(FIXED_SALES);
    cashMer.textContent = mer.toFixed(2) + "×";
  }

  if (spendRange) {
    spendRange.addEventListener("input", updateClaims);
    updateClaims();
  }

  const marginRange = document.getElementById("margin-range");
  const marginOut = document.getElementById("margin-out");
  const beMer = document.getElementById("be-mer");
  const exMer = document.getElementById("ex-mer");
  const verdict = document.getElementById("mer-verdict");

  function updateMargin() {
    if (!marginRange) return;
    const margin = Number(marginRange.value) / 100;
    const breakEven = 1 / margin;
    const exampleMer = FIXED_SALES / (spendRange ? Number(spendRange.value) : 84000);
    marginOut.textContent = Math.round(margin * 100) + "%";
    beMer.textContent = breakEven.toFixed(2) + "×";
    exMer.textContent = exampleMer.toFixed(2) + "×";
    if (exampleMer >= breakEven) {
      verdict.textContent =
        "Above break-even — protect the mix, don’t chase platform ROAS.";
      verdict.style.color = "var(--truth)";
    } else {
      verdict.textContent =
        "Below break-even — cut or reallocate before scaling spend.";
      verdict.style.color = "var(--lie)";
    }
  }

  if (marginRange) {
    marginRange.addEventListener("input", updateMargin);
    if (spendRange) spendRange.addEventListener("input", updateMargin);
    updateMargin();
  }

  // Subtle MER tick on hero ledger
  const merEl = document.querySelector("[data-mer]");
  if (merEl) {
    let t = 0;
    const base = 3.71;
    const tick = () => {
      t += 0.016;
      const wobble = Math.sin(t) * 0.03;
      merEl.textContent = (base + wobble).toFixed(2) + "×";
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // Reveal on scroll
  const reveals = document.querySelectorAll(".section, .demo-block");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("reveal", "in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => {
      el.classList.add("reveal");
      io.observe(el);
    });
  }
})();
