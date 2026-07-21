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
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
    });
    mobile.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        mobile.hidden = true;
        toggle.setAttribute("aria-label", "Open menu");
      });
    });
  }

  // Active nav state
  const page = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  const isHome = page === "" || page === "index.html";
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const key = link.getAttribute("data-nav");
    let active = false;
    if (key === "product" && page === "product.html") active = true;
    if (key === "pricing" && page === "pricing.html") active = true;
    if (key === "demo" && isHome && window.location.hash.startsWith("#demo")) active = true;
    if (active) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });
  if (isHome && !window.location.hash) {
    document.querySelectorAll('[data-nav="demo"]').forEach((link) => {
      link.classList.remove("active");
      link.removeAttribute("aria-current");
    });
  }
  window.addEventListener("hashchange", () => {
    document.querySelectorAll("[data-nav]").forEach((link) => {
      link.classList.remove("active");
      link.removeAttribute("aria-current");
    });
    if (isHome && window.location.hash === "#demo") {
      document.querySelectorAll('[data-nav="demo"]').forEach((link) => {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      });
    }
    if (page === "product.html") {
      document.querySelectorAll('[data-nav="product"]').forEach((link) => {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      });
    }
    if (page === "pricing.html") {
      document.querySelectorAll('[data-nav="pricing"]').forEach((link) => {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      });
    }
  });

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
  const TOTAL_BUDGET = 84000;
  const META_EFF = 3.9;
  const GOOGLE_EFF = 2.6;

  function getSpend() {
    return spendRange ? Number(spendRange.value) : TOTAL_BUDGET;
  }

  function getMargin() {
    const marginRange = document.getElementById("margin-range");
    return marginRange ? Number(marginRange.value) / 100 : 0.45;
  }

  function updateClaims() {
    if (!spendRange) return;
    const spend = getSpend();
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
    spendRange.addEventListener("input", () => {
      updateClaims();
      updateMargin();
      updateAllocation();
    });
    updateClaims();
  }

  const marginRange = document.getElementById("margin-range");
  const marginOut = document.getElementById("margin-out");
  const beMer = document.getElementById("be-mer");
  const exMer = document.getElementById("ex-mer");
  const verdict = document.getElementById("mer-verdict");

  function updateMargin() {
    if (!marginRange) return;
    const margin = getMargin();
    const breakEven = 1 / margin;
    const exampleMer = FIXED_SALES / getSpend();
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
    updateAllocation();
  }

  if (marginRange) {
    marginRange.addEventListener("input", updateMargin);
    updateMargin();
  }

  // Allocation demo
  const allocRange = document.getElementById("alloc-range");
  const allocOut = document.getElementById("alloc-out");
  const metaSpendEl = document.getElementById("meta-spend");
  const googleSpendEl = document.getElementById("google-spend");
  const blendMerEl = document.getElementById("blend-mer");
  const allocBeEl = document.getElementById("alloc-be");
  const allocVerdict = document.getElementById("alloc-verdict");

  function updateAllocation() {
    if (!allocRange) return;
    const metaPct = Number(allocRange.value) / 100;
    const googlePct = 1 - metaPct;
    const budget = getSpend();
    const metaSpend = budget * metaPct;
    const googleSpend = budget * googlePct;
    const projectedSales = metaSpend * META_EFF + googleSpend * GOOGLE_EFF;
    const blendedMer = projectedSales / budget;
    const breakEven = 1 / getMargin();

    allocOut.textContent =
      Math.round(metaPct * 100) + "% Meta · " + Math.round(googlePct * 100) + "% Google";
    metaSpendEl.textContent = money(metaSpend);
    googleSpendEl.textContent = money(googleSpend);
    blendMerEl.textContent = blendedMer.toFixed(2) + "×";
    if (allocBeEl) allocBeEl.textContent = breakEven.toFixed(2) + "×";

    const metaAbove = META_EFF >= breakEven;
    const googleAbove = GOOGLE_EFF >= breakEven;
    const shiftAmount = Math.round(budget * 0.1);

    if (metaAbove && !googleAbove && metaPct < 0.75) {
      allocVerdict.textContent =
        "Shift " +
        money(shiftAmount) +
        "/mo from Google → Meta. Meta clears break-even; Google dilutes blended MER.";
      allocVerdict.style.color = "var(--truth)";
    } else if (!metaAbove && googleAbove && metaPct > 0.25) {
      allocVerdict.textContent =
        "Shift " +
        money(shiftAmount) +
        "/mo from Meta → Google. Google clears break-even; Meta dilutes blended MER.";
      allocVerdict.style.color = "var(--truth)";
    } else if (metaAbove && googleAbove) {
      allocVerdict.textContent =
        "Both channels clear break-even on cash efficiency — hold mix unless MER headroom changes.";
      allocVerdict.style.color = "var(--truth)";
    } else if (blendedMer >= breakEven) {
      allocVerdict.textContent =
        "Blended MER clears break-even — trim the weaker channel before scaling total budget.";
      allocVerdict.style.color = "var(--truth)";
    } else {
      allocVerdict.textContent =
        "Blended MER below break-even — cut total spend or shift toward the stronger cash-efficiency channel.";
      allocVerdict.style.color = "var(--lie)";
    }
  }

  if (allocRange) {
    allocRange.addEventListener("input", updateAllocation);
    updateAllocation();
  }

  // Hero ledger MER tick
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

  // Waitlist forms
  const WAITLIST_EMAIL = "mcflyadsmmm@gmail.com";

  function handleWaitlistSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const store = String(data.get("store") || "").trim();

    if (!name || !email || !store) {
      form.reportValidity();
      return;
    }

    const body = [
      "Mcfly Analytics — early access request",
      "",
      "Name: " + name,
      "Email: " + email,
      "Store URL: " + store,
      "",
      "Sent from mcflyads.com waitlist form.",
    ].join("\n");

    const mailto =
      "mailto:" +
      encodeURIComponent(WAITLIST_EMAIL) +
      "?subject=" +
      encodeURIComponent("Mcfly Analytics early access — " + name) +
      "&body=" +
      encodeURIComponent(body);

    window.location.href = mailto;

    form.hidden = true;
    const confirm = form.parentElement.querySelector(".waitlist-confirm");
    if (confirm) {
      confirm.hidden = false;
    }
  }

  document.querySelectorAll("[data-waitlist]").forEach((form) => {
    form.addEventListener("submit", handleWaitlistSubmit);
  });

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
