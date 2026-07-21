(function () {
  const top = document.querySelector("[data-top]");
  if (top) {
    const hasHero = Boolean(document.querySelector(".hero"));
    const syncTop = () => {
      if (!hasHero) {
        top.classList.add("scrolled");
        return;
      }
      top.classList.toggle("scrolled", window.scrollY > 12);
    };
    syncTop();
    window.addEventListener("scroll", syncTop, { passive: true });
  }

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
      });
    });
  }

  const page = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const key = link.getAttribute("data-nav");
    if (
      (key === "product" && page === "product.html") ||
      (key === "pricing" && page === "pricing.html") ||
      (key === "app" && page === "app.html")
    ) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  const money = (n) =>
    n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  let FIXED_SALES = 221296;
  let TOTAL_BUDGET = 64000;
  const META_EFF = 3.9;
  const GOOGLE_EFF = 2.6;

  const spendRange = document.getElementById("spend-range");
  const marginRange = document.getElementById("margin-range");
  const allocRange = document.getElementById("alloc-range");

  function getSpend() {
    return spendRange ? Number(spendRange.value) : TOTAL_BUDGET;
  }
  function getMargin() {
    return marginRange ? Number(marginRange.value) / 100 : 0.35;
  }

  function updateClaims() {
    if (!spendRange) return;
    const spend = getSpend();
    const claimedMult = 4.8;
    document.getElementById("spend-out").textContent = money(spend);
    document.getElementById("claimed-roas").textContent = claimedMult.toFixed(1) + "×";
    document.getElementById("claimed-rev").textContent =
      "~" + money(spend * claimedMult) + " attributed";
    document.getElementById("actual-sales").textContent = money(FIXED_SALES);
    document.getElementById("cash-mer").textContent = (FIXED_SALES / spend).toFixed(2) + "×";
  }

  function updateMargin() {
    if (!marginRange) return;
    const breakEven = 1 / getMargin();
    const exampleMer = FIXED_SALES / getSpend();
    document.getElementById("margin-out").textContent = Math.round(getMargin() * 100) + "%";
    document.getElementById("be-mer").textContent = breakEven.toFixed(2) + "×";
    document.getElementById("ex-mer").textContent = exampleMer.toFixed(2) + "×";
    const verdict = document.getElementById("mer-verdict");
    if (exampleMer >= breakEven) {
      verdict.textContent = "Above break-even — protect the mix, don’t chase platform ROAS.";
      verdict.style.color = "var(--truth)";
    } else {
      verdict.textContent = "Below break-even — cut or reallocate before scaling spend.";
      verdict.style.color = "var(--lie)";
    }
    updateAllocation();
  }

  function updateAllocation() {
    if (!allocRange) return;
    const metaPct = Number(allocRange.value) / 100;
    const budget = getSpend();
    const metaSpend = budget * metaPct;
    const googleSpend = budget * (1 - metaPct);
    const blendedMer = (metaSpend * META_EFF + googleSpend * GOOGLE_EFF) / budget;
    const breakEven = 1 / getMargin();
    document.getElementById("alloc-out").textContent =
      Math.round(metaPct * 100) + "% Meta · " + Math.round((1 - metaPct) * 100) + "% Google";
    document.getElementById("meta-spend").textContent = money(metaSpend);
    document.getElementById("google-spend").textContent = money(googleSpend);
    document.getElementById("blend-mer").textContent = blendedMer.toFixed(2) + "×";
    document.getElementById("alloc-be").textContent = breakEven.toFixed(2) + "×";
    const shift = Math.round(budget * 0.1);
    const verdict = document.getElementById("alloc-verdict");
    const metaAbove = META_EFF >= breakEven;
    const googleAbove = GOOGLE_EFF >= breakEven;
    if (metaAbove && !googleAbove && metaPct < 0.75) {
      verdict.textContent =
        "Shift " + money(shift) + "/mo from Google → Meta. Meta clears break-even; Google dilutes blended MER.";
      verdict.style.color = "var(--truth)";
    } else if (!metaAbove && googleAbove && metaPct > 0.25) {
      verdict.textContent =
        "Shift " + money(shift) + "/mo from Meta → Google. Google clears break-even on cash efficiency.";
      verdict.style.color = "var(--truth)";
    } else if (metaAbove && googleAbove) {
      verdict.textContent = "Both channels clear break-even — hold mix unless MER headroom changes.";
      verdict.style.color = "var(--truth)";
    } else {
      verdict.textContent =
        "Blended MER under pressure — cut total spend or shift to the stronger cash channel.";
      verdict.style.color = "var(--lie)";
    }
  }

  if (spendRange) {
    spendRange.addEventListener("input", () => {
      updateClaims();
      updateMargin();
    });
  }
  if (marginRange) marginRange.addEventListener("input", updateMargin);
  if (allocRange) allocRange.addEventListener("input", updateAllocation);

  function drawSpark(points) {
    const svg = document.getElementById("spark");
    if (!svg || !points || points.length < 2) return;
    const w = 320;
    const h = 56;
    const pad = 4;
    const vals = points.map((p) => p.mer);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    const coords = vals.map((v, i) => {
      const x = pad + (i / (vals.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / span) * (h - pad * 2);
      return [x, y];
    });
    const d = coords.map((c, i) => (i === 0 ? "M" : "L") + c[0].toFixed(1) + "," + c[1].toFixed(1)).join(" ");
    const last = coords[coords.length - 1];
    svg.innerHTML =
      '<path d="' +
      d +
      '" fill="none" stroke="rgba(34,160,122,0.95)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>' +
      '<circle cx="' +
      last[0].toFixed(1) +
      '" cy="' +
      last[1].toFixed(1) +
      '" r="3.2" fill="#22a07a"></circle>';
  }

  let brandsData = null;
  let activeBrand = "demo-dtc";
  let activePeriod = "mtd";

  function suggestAllocationLite(channels, breakEvenMer, totalSales, totalSpend) {
    const actions = [];
    const withEff = channels
      .filter((c) => c.spend > 0)
      .map((c) => {
        const assumed = totalSpend > 0 ? (c.spend / totalSpend) * totalSales : 0;
        const eff = c.spend > 0 ? assumed / c.spend : null;
        return { ...c, assumed, eff };
      });
    const overall = totalSpend > 0 ? totalSales / totalSpend : null;
    const above = overall === null ? null : overall >= breakEvenMer;
    const below = withEff.filter((c) => c.eff !== null && c.eff < breakEvenMer);
    const aboveCh = withEff.filter((c) => c.eff !== null && c.eff >= breakEvenMer);
    if (below.length && aboveCh.length) {
      const weak = below.sort((a, b) => (a.eff || 0) - (b.eff || 0))[0];
      const strong = aboveCh.sort((a, b) => (b.eff || 0) - (a.eff || 0))[0];
      actions.push({
        type: "shift",
        detail:
          "Shift ~10% of budget from " +
          weak.name +
          " → " +
          strong.name +
          " for a 7-day test. " +
          strong.name +
          " clears break-even on cash efficiency.",
      });
    } else if (below.length && !aboveCh.length) {
      actions.push({
        type: "cut",
        detail: "Blended MER under break-even — cut total spend 10–15% before reallocating.",
      });
    } else {
      actions.push({
        type: "hold",
        detail: "Channels clear break-even on cash view — hold mix; watch MER vs target weekly.",
      });
    }
    return {
      overallMer: overall,
      breakEvenMer,
      isAboveBreakEven: above,
      actions,
      why: above
        ? "Cash MER clears break-even. Protect the mix; don’t chase platform ROAS."
        : "Cash MER is at or below break-even. Reallocate or cut before scaling.",
      inputs: { totalSales, totalSpend, channels: withEff },
    };
  }

  function applyPeriodFeed(periodObj, brandLabel, sparkline) {
    if (!periodObj) return;
    FIXED_SALES = Math.round(periodObj.sales);
    TOTAL_BUDGET = Math.round(periodObj.spend);
    document.querySelectorAll("[data-feed-mer]").forEach((el) => {
      el.textContent = Number(periodObj.mer).toFixed(2) + "×";
      el.setAttribute("data-mer", Number(periodObj.mer).toFixed(2));
    });
    if (spendRange) spendRange.value = String(Math.min(200000, Math.max(20000, TOTAL_BUDGET)));
    if (marginRange && periodObj.margin_pct) {
      marginRange.value = String(Math.round(periodObj.margin_pct * 100));
    }
    if (allocRange && periodObj.channel_mix?.[0]) {
      allocRange.value = String(Math.round(periodObj.channel_mix[0].share * 100));
    }
    drawSpark(sparkline);
    updateClaims();
    updateMargin();
    updateAllocation();

    const channels = Object.entries(periodObj.channels || {}).map(([name, spend]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      spend: Number(spend),
      isManual: name === "other",
    }));
    const rec = suggestAllocationLite(
      channels,
      periodObj.break_even,
      periodObj.sales,
      periodObj.spend,
    );
    const why = document.getElementById("rec-why");
    const actionsEl = document.getElementById("rec-actions");
    const inputsEl = document.getElementById("rec-inputs");
    if (why) why.textContent = rec.why;
    if (actionsEl) {
      actionsEl.innerHTML = rec.actions.map((a) => "<li>" + a.detail + "</li>").join("");
    }
    if (inputsEl) {
      inputsEl.textContent =
        brandLabel +
        " · sales " +
        money(periodObj.sales) +
        " · spend " +
        money(periodObj.spend) +
        " · MER " +
        Number(periodObj.mer).toFixed(2) +
        "× · BE " +
        Number(periodObj.break_even).toFixed(2) +
        "× · target " +
        Number(periodObj.target_mer).toFixed(2) +
        "×";
    }
  }

  function refreshBrandPeriod() {
    if (!brandsData) return;
    const brand = brandsData.brands.find((b) => b.id === activeBrand) || brandsData.brands[0];
    const period = brand.periods[activePeriod];
    applyPeriodFeed(period, brand.label, brand.sparkline);
  }

  document.querySelectorAll("[data-brand]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeBrand = btn.getAttribute("data-brand");
      document.querySelectorAll("[data-brand]").forEach((b) => b.classList.toggle("active", b === btn));
      refreshBrandPeriod();
    });
  });
  document.querySelectorAll("[data-period]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activePeriod = btn.getAttribute("data-period");
      document.querySelectorAll("[data-period]").forEach((b) => b.classList.toggle("active", b === btn));
      refreshBrandPeriod();
    });
  });

  fetch("/sample/brands.json")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data?.brands?.length) {
        brandsData = data;
        refreshBrandPeriod();
        return;
      }
      return fetch("/sample/mer-feed.json").then((r) => (r.ok ? r.json() : null));
    })
    .then((feed) => {
      if (!feed || brandsData) return;
      FIXED_SALES = Math.round(feed.sales);
      TOTAL_BUDGET = Math.round(feed.spend);
      document.querySelectorAll("[data-feed-mer]").forEach((el) => {
        el.textContent = Number(feed.mer).toFixed(2) + "×";
        el.setAttribute("data-mer", Number(feed.mer).toFixed(2));
      });
      if (spendRange) spendRange.value = String(Math.min(200000, Math.max(20000, TOTAL_BUDGET)));
      if (marginRange && feed.margin_pct) marginRange.value = String(Math.round(feed.margin_pct * 100));
      if (allocRange && feed.channel_mix?.[0]) {
        allocRange.value = String(Math.round(feed.channel_mix[0].share * 100));
      }
      drawSpark(feed.sparkline);
      updateClaims();
      updateMargin();
      updateAllocation();
    })
    .catch(() => {
      updateClaims();
      updateMargin();
      updateAllocation();
    });

  const merEl = document.querySelector("[data-mer]");
  if (merEl && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let t = 0;
    let base = Number(merEl.getAttribute("data-mer")) || 3.48;
    const tick = () => {
      const parsed = parseFloat(merEl.textContent);
      if (!Number.isNaN(parsed)) base = parsed;
      t += 0.016;
      // avoid fighting feed updates — only micro wobble on attribute base
      const b = Number(merEl.getAttribute("data-mer")) || base;
      merEl.textContent = (b + Math.sin(t) * 0.015).toFixed(2) + "×";
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const photo = document.querySelector("[data-parallax]");
  if (photo && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          photo.style.transform = "translate3d(0," + Math.min(window.scrollY, 800) * 0.28 + "px,0)";
          ticking = false;
        });
      },
      { passive: true },
    );
  }

  const WAITLIST_EMAIL = "mcflyadsmmm@gmail.com";
  document.querySelectorAll("[data-waitlist]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
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
        "Sent from mcflyads.com waitlist.",
      ].join("\n");
      window.location.href =
        "mailto:" +
        encodeURIComponent(WAITLIST_EMAIL) +
        "?subject=" +
        encodeURIComponent("Mcfly Analytics early access — " + name) +
        "&body=" +
        encodeURIComponent(body);
      form.hidden = true;
      const confirm = form.parentElement.querySelector(".waitlist-confirm");
      if (confirm) confirm.hidden = false;
    });
  });

  const reveals = document.querySelectorAll(".band, .instrument, .show-frame");
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
      { threshold: 0.12 },
    );
    reveals.forEach((el) => {
      el.classList.add("reveal");
      io.observe(el);
    });
  }

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
})();
