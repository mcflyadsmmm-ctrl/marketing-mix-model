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
      document.dispatchEvent(new CustomEvent("mcfly:mobile-nav", { detail: { open: !open } }));
    });
    mobile.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        mobile.hidden = true;
        document.dispatchEvent(new CustomEvent("mcfly:mobile-nav", { detail: { open: false } }));
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

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

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
    setText("spend-out", money(spend));
    setText("claimed-roas", claimedMult.toFixed(1) + "×");
    setText("claimed-rev", "~" + money(spend * claimedMult) + " attributed");
    setText("actual-sales", money(FIXED_SALES));
    const cashMer = FIXED_SALES / spend;
    const cashMerLabel = cashMer.toFixed(2) + "×";
    // Instruments band only — glass claim strip is struck platforms claim (no live Total ROAS)
    setText("cash-mer", cashMerLabel);
    const cashMerEl = document.getElementById("cash-mer");
    if (cashMerEl) cashMerEl.setAttribute("data-mer", cashMer.toFixed(2));
  }

  function updateMargin() {
    if (!marginRange) return;
    const breakEven = 1 / getMargin();
    const exampleMer = FIXED_SALES / getSpend();
    const delta = exampleMer - breakEven;
    setText("margin-out", Math.round(getMargin() * 100) + "%");
    setText("be-mer", breakEven.toFixed(2) + "×");
    // Claims owns Total ROAS — Break-even shows gap vs BE only (never reprint the same ×)
    const exMer = document.getElementById("ex-mer");
    if (exMer) {
      if (Math.abs(delta) < 0.005) {
        exMer.textContent = "at BE";
        exMer.classList.remove("lie");
        exMer.classList.add("truth");
      } else if (delta > 0) {
        exMer.textContent = "+" + delta.toFixed(2) + "×";
        exMer.classList.remove("lie");
        exMer.classList.add("truth");
      } else {
        exMer.textContent = delta.toFixed(2) + "×";
        exMer.classList.remove("truth");
        exMer.classList.add("lie");
      }
    }
    const verdict = document.getElementById("mer-verdict");
    if (verdict) {
      if (exampleMer >= breakEven) {
        verdict.textContent = "Above break-even — protect the mix, don’t chase platform ROAS.";
        verdict.style.color = "";
        verdict.classList.remove("lie");
        verdict.classList.add("truth");
      } else {
        verdict.textContent = "Below break-even — cut or reallocate before scaling spend.";
        verdict.style.color = "";
        verdict.classList.remove("truth");
        verdict.classList.add("lie");
      }
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
    setText(
      "alloc-out",
      Math.round(metaPct * 100) + "% Meta · " + Math.round((1 - metaPct) * 100) + "% Google",
    );
    setText("meta-spend", money(metaSpend));
    setText("google-spend", money(googleSpend));
    setText("meta-eff", META_EFF.toFixed(1) + "×");
    setText("google-eff", GOOGLE_EFF.toFixed(1) + "×");
    setText("blend-mer", blendedMer.toFixed(2) + "×");
    setText("alloc-be", breakEven.toFixed(2) + "×");
    const shift = Math.round(budget * 0.1);
    const verdict = document.getElementById("alloc-verdict");
    if (!verdict) return;
    const metaAbove = META_EFF >= breakEven;
    const googleAbove = GOOGLE_EFF >= breakEven;
    if (metaAbove && !googleAbove && metaPct < 0.75) {
      verdict.textContent =
        "Shift " + money(shift) + "/mo from Google → Meta. Meta clears break-even; Google dilutes blended Total ROAS.";
      verdict.style.color = "";
      verdict.classList.remove("lie");
      verdict.classList.add("truth");
    } else if (!metaAbove && googleAbove && metaPct > 0.25) {
      verdict.textContent =
        "Shift " + money(shift) + "/mo from Meta → Google. Google clears break-even on cash efficiency.";
      verdict.style.color = "";
      verdict.classList.remove("lie");
      verdict.classList.add("truth");
    } else if (metaAbove && googleAbove) {
      verdict.textContent = "Both channels clear break-even — hold mix unless Total ROAS headroom changes.";
      verdict.style.color = "";
      verdict.classList.remove("lie");
      verdict.classList.add("truth");
    } else {
      verdict.textContent =
        "Blended Total ROAS under pressure — cut total spend or shift to the stronger cash channel.";
      verdict.style.color = "";
      verdict.classList.remove("truth");
      verdict.classList.add("lie");
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

  // Instruments + #rec-why only exist on home — skip 15.6KB brands feed elsewhere
  if (spendRange) {
    const activeBrand = "demo-dtc";
    const activePeriod = "mtd";

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
          detail: "Blended Total ROAS under break-even — cut total spend 10–15% before reallocating.",
        });
      } else {
        actions.push({
          type: "hold",
          detail: "Channels clear break-even on cash view — hold mix; watch Total ROAS vs target weekly.",
        });
      }
      return {
        overallMer: overall,
        breakEvenMer,
        isAboveBreakEven: above,
        actions,
        why: above
          ? "Total ROAS clears break-even. Protect the mix; don’t chase platform ROAS."
          : "Total ROAS is at or below break-even. Reallocate or cut before scaling.",
      };
    }

    function applyPeriodFeed(periodObj) {
      if (!periodObj) return;
      FIXED_SALES = Math.round(periodObj.sales);
      TOTAL_BUDGET = Math.round(periodObj.spend);
      spendRange.value = String(Math.min(200000, Math.max(20000, TOTAL_BUDGET)));
      if (marginRange && periodObj.margin_pct) {
        marginRange.value = String(Math.round(periodObj.margin_pct * 100));
      }
      if (allocRange && periodObj.channel_mix?.[0]) {
        allocRange.value = String(Math.round(periodObj.channel_mix[0].share * 100));
      } else if (allocRange && periodObj.channels) {
        const ch = periodObj.channels;
        const tot = (ch.meta || 0) + (ch.google || 0) + (ch.other || 0) || 1;
        allocRange.value = String(Math.round(((ch.meta || 0) / tot) * 100));
      }
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
      if (why) {
        why.textContent =
          "SAMPLE · " +
          (rec.actions[0] ? rec.actions[0].detail : rec.why);
      }
      const heroRec = document.getElementById("hero-rec");
      if (heroRec && rec.actions[0]) heroRec.textContent = rec.actions[0].detail;
    }

    fetch("/sample/brands.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.brands?.length) {
          const brand =
            data.brands.find((b) => b.id === activeBrand) || data.brands[0];
          applyPeriodFeed(brand.periods[activePeriod]);
          return;
        }
        return fetch("/sample/mer-feed.json").then((r) => (r.ok ? r.json() : null));
      })
      .then((feed) => {
        if (!feed || feed.brands) return;
        FIXED_SALES = Math.round(feed.sales);
        TOTAL_BUDGET = Math.round(feed.spend);
        spendRange.value = String(Math.min(200000, Math.max(20000, TOTAL_BUDGET)));
        if (marginRange && feed.margin_pct) {
          marginRange.value = String(Math.round(feed.margin_pct * 100));
        }
        if (allocRange && feed.channel_mix?.[0]) {
          allocRange.value = String(Math.round(feed.channel_mix[0].share * 100));
        }
        updateClaims();
        updateMargin();
        updateAllocation();
      })
      .catch(() => {
        updateClaims();
        updateMargin();
        updateAllocation();
      });
  }

  // Initial paint before feed (so strip is live immediately)
  updateClaims();
  updateMargin();
  updateAllocation();

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

  function normalizeStoreUrl(raw) {
    const value = String(raw || "").trim();
    if (!value) return "";
    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
    return "https://" + value;
  }

  function buildWaitlistDraft(fields) {
    const subject = "Mcfly early access — " + fields.name;
    const body = [
      "Mcfly Ads — early access request",
      "",
      "Name: " + fields.name,
      "Email: " + fields.email,
      "Role / context: " + (fields.role || "(not specified)"),
      "Site / store: " + (fields.store || "(not specified — exploring)"),
      "",
      "Request: early access / free launch feedback.",
      "From: mcflyads.com waitlist.",
    ].join("\n");
    const mailto =
      "mailto:" +
      encodeURIComponent(WAITLIST_EMAIL) +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body);
    const clipboard = [
      "To: " + WAITLIST_EMAIL,
      "Subject: " + subject,
      "",
      body,
    ].join("\n");
    return { subject, body, mailto, clipboard };
  }

  function openMailto(url) {
    const link = document.createElement("a");
    link.href = url;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  document.querySelectorAll("[data-waitlist]").forEach((form) => {
    const panel = form.parentElement && form.parentElement.querySelector(".waitlist-confirm");
    const errorEl = form.querySelector("[data-waitlist-error]");
    const openBtn = panel && panel.querySelector("[data-waitlist-open]");
    const copyBtn = panel && panel.querySelector("[data-waitlist-copy]");
    const editBtn = panel && panel.querySelector("[data-waitlist-edit]");
    const metaEl = panel && panel.querySelector("[data-waitlist-meta]");
    const copyStatus = panel && panel.querySelector("[data-waitlist-copy-status]");
    let lastDraft = null;

    function showError(message) {
      if (!errorEl) return;
      errorEl.hidden = !message;
      errorEl.textContent = message || "";
    }

    function showDraft(draft) {
      lastDraft = draft;
      if (openBtn) openBtn.setAttribute("href", draft.mailto);
      if (metaEl) {
        metaEl.replaceChildren();
        metaEl.append("To ");
        const mailLink = document.createElement("a");
        mailLink.href = draft.mailto;
        mailLink.textContent = WAITLIST_EMAIL;
        metaEl.append(mailLink);
        metaEl.append(" · Subject: ");
        const subjectStrong = document.createElement("strong");
        subjectStrong.textContent = draft.subject;
        metaEl.append(subjectStrong);
      }
      if (copyStatus) {
        copyStatus.hidden = true;
        copyStatus.textContent = "";
      }
      form.hidden = true;
      if (panel) {
        panel.hidden = false;
        if (openBtn && typeof openBtn.focus === "function") openBtn.focus();
      }
    }

    function showForm() {
      if (panel) panel.hidden = true;
      form.hidden = false;
      showError("");
      const nameInput = form.querySelector('[name="name"]');
      if (nameInput && typeof nameInput.focus === "function") nameInput.focus();
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      showError("");
      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const role = String(data.get("role") || "").trim();
      const store = normalizeStoreUrl(data.get("store"));

      const emailInput = form.querySelector('[name="email"]');
      if (!name || !email) {
        form.reportValidity();
        showError("Name and email are required to draft the request.");
        return;
      }
      if (emailInput && typeof emailInput.checkValidity === "function" && !emailInput.checkValidity()) {
        emailInput.reportValidity();
        showError("Enter a valid email so we can reply.");
        return;
      }

      const draft = buildWaitlistDraft({ name, email, role, store });
      showDraft(draft);
      openMailto(draft.mailto);
    });

    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        if (!lastDraft) return;
        const text = lastDraft.clipboard;
        let ok = false;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            ok = true;
          }
        } catch (_) {
          ok = false;
        }
        if (!ok) {
          const area = document.createElement("textarea");
          area.value = text;
          area.setAttribute("readonly", "");
          area.style.position = "fixed";
          area.style.left = "-9999px";
          document.body.appendChild(area);
          area.select();
          try {
            ok = document.execCommand("copy");
          } catch (_) {
            ok = false;
          }
          area.remove();
        }
        if (copyStatus) {
          copyStatus.hidden = false;
          copyStatus.textContent = ok
            ? "Copied. Paste into any email to " + WAITLIST_EMAIL + ", then send."
            : "Copy failed — select Open email app, or write to " + WAITLIST_EMAIL + " yourself.";
        }
      });
    }

    if (editBtn) {
      editBtn.addEventListener("click", () => {
        showForm();
      });
    }

    if (openBtn) {
      openBtn.addEventListener("click", (event) => {
        if (!lastDraft) return;
        event.preventDefault();
        openMailto(lastDraft.mailto);
      });
    }
  });

  const reveals = document.querySelectorAll(
    ".band, .lie-grid article, .how-rail li, .reveal",
  );
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
  } else {
    reveals.forEach((el) => {
      el.classList.add("reveal", "in");
    });
  }

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    const onDownload = /download/i.test(location.pathname);
    if (onDownload) {
      navigator.serviceWorker.register("/sw.js?v=4").catch(() => {});
    } else {
      // Kill stale SWs from earlier deploys that cached broken CSS on the marketing site
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
      if (window.caches && caches.keys) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
    }
  }
})();
