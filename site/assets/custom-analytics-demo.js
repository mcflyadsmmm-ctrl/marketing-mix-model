/**
 * Mcfly Analytics — custom solutions SAMPLE desk.
 * Isolated from homepage spend-explorer.
 * Religion: outcomes ÷ spend — no pixels / MTA / path credit.
 */
(function () {
  "use strict";

  var page = document.body && document.body.getAttribute("data-page") === "custom-analytics";
  if (!page) return;

  var money = function (n) {
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  };

  var signedMoney = function (n) {
    var abs = money(Math.abs(n));
    if (n > 0) return "+" + abs;
    if (n < 0) return "−" + abs;
    return abs;
  };

  var signedPct = function (pct) {
    var body = Math.abs(pct).toFixed(1) + "%";
    if (pct > 0) return "+" + body;
    if (pct < 0) return "−" + body;
    return "0.0%";
  };

  var flagFor = function (pct) {
    var abs = Math.abs(pct);
    if (abs < 2) return { tone: "good", label: "Within 2%" };
    if (abs < 5) return { tone: "warn", label: "Investigate" };
    return { tone: "bad", label: "Material" };
  };

  /* —— 1. One SAMPLE desk, three modes —— */
  var desk = document.getElementById("ca-labs");
  var modeBtns = desk ? desk.querySelectorAll("[data-ca-mode]") : [];
  var panels = desk ? desk.querySelectorAll("[data-ca-panel]") : [];

  function setMode(key) {
    modeBtns.forEach(function (btn) {
      var on = btn.getAttribute("data-ca-mode") === key;
      btn.classList.toggle("is-on", on);
      if (on) btn.setAttribute("aria-current", "true");
      else btn.removeAttribute("aria-current");
    });
    panels.forEach(function (panel) {
      var on = panel.getAttribute("data-ca-panel") === key;
      panel.hidden = !on;
    });
  }

  modeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setMode(btn.getAttribute("data-ca-mode"));
    });
  });

  /* —— 2. Invoice vs UI ledger (SAMPLE) · variance = billed − UI —— */
  var platforms = [
    { id: "meta", label: "Meta", billed: 41200, reported: 42850 },
    { id: "google", label: "Google", billed: 31800, reported: 31120 },
    { id: "linkedin", label: "LinkedIn", billed: 15400, reported: 16180 },
    { id: "other", label: "Other paid", billed: 10100, reported: 9800 },
  ];

  var checks = document.querySelectorAll("[data-ca-plat]");
  var billedEl = document.querySelector("[data-ca-billed]");
  var reportedEl = document.querySelector("[data-ca-reported]");
  var varianceEl = document.querySelector("[data-ca-variance]");
  var variancePctEl = document.querySelector("[data-ca-variance-pct]");
  var varianceTone = document.querySelector("[data-ca-variance-tone]");
  var memoBody = document.querySelector("[data-ca-memo-body]");

  function activePlatforms() {
    var on = {};
    checks.forEach(function (c) {
      on[c.getAttribute("data-ca-plat")] = c.checked;
    });
    return platforms.filter(function (p) {
      return on[p.id] === true;
    });
  }

  function actionLine(list) {
    if (!list.length) {
      return "No platforms included — tick a channel to rebuild the close.";
    }
    var worst = list.slice().sort(function (a, b) {
      var ap = Math.abs((a.billed - a.reported) / a.billed);
      var bp = Math.abs((b.billed - b.reported) / b.billed);
      return bp - ap;
    })[0];
    var worstPct = ((worst.billed - worst.reported) / worst.billed) * 100;
    if (Math.abs(worstPct) < 2) {
      return "Rollup within 2% — ready for close.";
    }
    var dir =
      worst.billed - worst.reported < 0
        ? "UI ahead of invoice"
        : "invoice ahead of UI";
    return (
      worst.label +
      " " +
      dir +
      " — returns + fees/timing. Investigate before finance signs."
    );
  }

  function updateRecon() {
    checks.forEach(function (c) {
      var id = c.getAttribute("data-ca-plat");
      var row = document.querySelector('[data-ca-row="' + id + '"]');
      if (row) row.hidden = !c.checked;
    });

    var list = activePlatforms();
    var billed = 0;
    var reported = 0;
    list.forEach(function (p) {
      billed += p.billed;
      reported += p.reported;
    });
    var variance = billed - reported;
    var pct = billed ? (variance / billed) * 100 : 0;
    var flag = flagFor(pct);

    if (billedEl) billedEl.textContent = money(billed);
    if (reportedEl) reportedEl.textContent = money(reported);
    if (varianceEl) varianceEl.textContent = signedMoney(variance);
    if (variancePctEl) variancePctEl.textContent = signedPct(pct);
    if (varianceTone) {
      varianceTone.setAttribute("data-tone", flag.tone);
      varianceTone.textContent = list.length ? flag.label : "—";
    }
    if (memoBody) {
      var names = list
        .map(function (p) {
          return p.label;
        })
        .join(", ");
      memoBody.textContent =
        "Period: prior calendar month · channels: " +
        (names || "none") +
        "\nInvoice billed " +
        money(billed) +
        " · Ads Manager UI " +
        money(reported) +
        " · billed − UI " +
        signedMoney(variance) +
        " (" +
        signedPct(pct) +
        ")\nAction: " +
        actionLine(list);
    }
  }

  checks.forEach(function (c) {
    c.addEventListener("change", updateRecon);
  });
  if (checks.length) updateRecon();

  /* —— 3. Package picker → proposal form modes —— */
  var packageBtns = document.querySelectorAll("[data-ca-package]");
  var packageSelect = document.querySelector("[data-proposal-package]");
  var budgetHidden = document.querySelector(
    'form[data-proposal] input[name="budget"]',
  );
  var packageMeta = {
    audit: { band: "$5–8K", weeks: "2–3 weeks", name: "Spend & Sales Audit" },
    leadgen: { band: "$8–15K", weeks: "3–6 weeks", name: "Lead Gen reporting" },
    mds: { band: "$15–25K", weeks: "6–10 weeks", name: "Advanced MDS" },
  };

  function setProposalMode(key) {
    if (!packageMeta[key]) return;
    if (packageSelect) packageSelect.value = key;
    if (budgetHidden) budgetHidden.value = packageMeta[key].band;
    packageBtns.forEach(function (b) {
      b.classList.toggle("is-selected", b.getAttribute("data-ca-package") === key);
    });
    document.querySelectorAll("[data-proposal-mode]").forEach(function (box) {
      var on = box.getAttribute("data-proposal-mode") === key;
      box.hidden = !on;
    });
    document.querySelectorAll("[data-mode-required]").forEach(function (el) {
      var need = el.getAttribute("data-mode-required") === key;
      if (need) el.setAttribute("required", "required");
      else el.removeAttribute("required");
    });
  }

  packageBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setProposalMode(btn.getAttribute("data-ca-package"));
      var inquire = document.getElementById("inquire");
      if (inquire) inquire.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  if (packageSelect) {
    packageSelect.addEventListener("change", function () {
      setProposalMode(packageSelect.value);
    });
  }
  var params = new URLSearchParams(window.location.search);
  var fromQuery = params.get("package");
  if (fromQuery && packageMeta[fromQuery]) {
    setProposalMode(fromQuery);
  } else if (packageSelect && packageSelect.value) {
    setProposalMode(packageSelect.value);
  }

  var proposeForm = document.querySelector("form[data-proposal]");
  if (proposeForm) {
    proposeForm.addEventListener("mcfly:proposal-result", function (event) {
      var result = (event.detail && event.detail.result) || {};
      var estimate = result.estimate || null;
      var fitCard = document.querySelector("[data-estimate]");
      var noFit = document.querySelector("[data-estimate-nofit]");
      var autoEl = document.querySelector("[data-autoreply]");
      var srcEl = document.querySelector("[data-autoreply-src]");
      var pkgKey = proposeForm.package ? proposeForm.package.value : "";
      var meta = packageMeta[pkgKey];
      var sheet = proposeForm.spreadsheet_closes
        ? proposeForm.spreadsheet_closes.value
        : "";
      var notFit =
        (estimate && estimate.notFit) || /^yes/i.test(sheet);
      if (fitCard) fitCard.hidden = notFit;
      if (noFit) noFit.hidden = !notFit;
      if (!notFit && fitCard && meta) {
        var title = fitCard.querySelector("[data-estimate-title]");
        var band = fitCard.querySelector("[data-estimate-band]");
        if (title) title.textContent = meta.name;
        if (band) band.textContent = meta.band + " · " + meta.weeks;
      }
      var replyText =
        (estimate && estimate.text) ||
        (srcEl
          ? srcEl.textContent
              .replace(/\{package\}/g, (meta && meta.name) || "Custom")
              .replace(/\{Name\}/g, proposeForm.name ? proposeForm.name.value : "")
              .replace(/\{band\}/g, (meta && meta.band) || "")
              .replace(/\{weeks\}/g, (meta && meta.weeks) || "")
          : "");
      if (autoEl && replyText && !notFit) {
        autoEl.hidden = false;
        autoEl.textContent =
          ((estimate && estimate.subject) ||
            "Estimate — Mcfly " + ((meta && meta.name) || "Custom")) +
          "\n\n" +
          replyText;
      } else if (autoEl) {
        autoEl.hidden = true;
      }
    });
  }

  /* —— 4. Google Appointment fit-call slot (no Calendly) —— */
  var fit = document.querySelector("[data-fitcall]");
  if (fit) {
    var rawUrl = (fit.getAttribute("data-schedule-url") || "").trim();
    var emptyCopy = fit.querySelector("[data-fitcall-empty]");
    var readyCopy = fit.querySelector("[data-fitcall-ready]");
    var bookLink = fit.querySelector("[data-fitcall-link]");
    var googleSlot =
      /^https:\/\/calendar\.google\.com\//i.test(rawUrl) ||
      /^https:\/\/calendar\.app\.google\//i.test(rawUrl);
    if (googleSlot && bookLink) {
      bookLink.href = rawUrl;
      bookLink.hidden = false;
      fit.classList.remove("is-empty");
      if (emptyCopy) emptyCopy.hidden = true;
      if (readyCopy) readyCopy.hidden = false;
    }
  }

  /* —— 5. Privacy practices accordion —— */
  var privacyItems = document.querySelectorAll("[data-ca-privacy-item]");
  privacyItems.forEach(function (item) {
    var trigger = item.querySelector("button");
    var panel = item.querySelector("[data-ca-privacy-panel]");
    if (!trigger || !panel) return;
    trigger.addEventListener("click", function () {
      var open = item.getAttribute("data-open") === "true";
      item.setAttribute("data-open", open ? "false" : "true");
      trigger.setAttribute("aria-expanded", open ? "false" : "true");
      panel.hidden = open;
    });
  });
})();
