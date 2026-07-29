/**
 * Mcfly Analytics — custom solutions page demos (SAMPLE only).
 * Isolated from homepage spend-explorer.
 * Religion: cash outcomes ÷ spend — no pixels / MTA / path credit.
 */
(function () {
  "use strict";

  var page = document.body && document.body.classList.contains("ca-page");
  if (!page) return;

  var desk = document.getElementById("ca-labs");

  var money = function (n) {
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  };

  var money1 = function (n) {
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  };

  /* —— 1. Mode switch: ecommerce / lead-gen / services —— */
  var modes = {
    ecommerce: {
      label: "Ecommerce / retail",
      numerator: "Net sales",
      numeratorVal: 412400,
      spend: 98500,
      outcomeLabel: "Total ROAS",
      outcome: function (sales, spend) {
        return (sales / spend).toFixed(2) + "×";
      },
      note: "Sales after returns ÷ exact platform spend — same period.",
    },
    leadgen: {
      label: "Lead generation",
      numerator: "Qualified leads",
      numeratorVal: 186,
      spend: 42000,
      outcomeLabel: "Cost / qualified lead",
      outcome: function (leads, spend) {
        return money1(spend / leads);
      },
      note: "CRM-qualified stages ÷ paid spend — not form-fill vanity.",
    },
    services: {
      label: "Services / B2B",
      numerator: "Closed revenue",
      numeratorVal: 278000,
      spend: 61000,
      outcomeLabel: "Cash efficiency",
      outcome: function (rev, spend) {
        return (rev / spend).toFixed(2) + "×";
      },
      note: "Invoiced / closed-won revenue ÷ audited ad spend.",
    },
  };

  var modeBtns = desk ? desk.querySelectorAll("[data-ca-mode]") : [];
  var modeNumLabel = desk && desk.querySelector("[data-ca-num-label]");
  var modeNumVal = desk && desk.querySelector("[data-ca-num-val]");
  var modeSpendVal = desk && desk.querySelector("[data-ca-spend-val]");
  var modeOutLabel = desk && desk.querySelector("[data-ca-out-label]");
  var modeOutVal = desk && desk.querySelector("[data-ca-out-val]");
  var modeNote = desk && desk.querySelector("[data-ca-mode-note]");

  function setMode(key) {
    var m = modes[key] || modes.ecommerce;
    modeBtns.forEach(function (btn) {
      var on = btn.getAttribute("data-ca-mode") === key;
      btn.classList.toggle("is-on", on);
      if (on) btn.setAttribute("aria-current", "true");
      else btn.removeAttribute("aria-current");
    });
    if (modeNumLabel) modeNumLabel.textContent = m.numerator;
    if (modeNumVal)
      modeNumVal.textContent =
        key === "leadgen" ? String(m.numeratorVal) : money(m.numeratorVal);
    if (modeSpendVal) modeSpendVal.textContent = money(m.spend);
    if (modeOutLabel) modeOutLabel.textContent = m.outcomeLabel;
    if (modeOutVal) modeOutVal.textContent = m.outcome(m.numeratorVal, m.spend);
    if (modeNote) modeNote.textContent = m.note;
  }

  modeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setMode(btn.getAttribute("data-ca-mode"));
    });
  });
  if (desk) setMode("ecommerce");

  /* —— 2. Spend-by-platform recon (SAMPLE) —— */
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
  var varianceTone = document.querySelector("[data-ca-variance-tone]");
  var barsEl = document.querySelector("[data-ca-bars]");

  function activePlatforms() {
    var on = {};
    checks.forEach(function (c) {
      on[c.getAttribute("data-ca-plat")] = c.checked;
    });
    return platforms.filter(function (p) {
      return on[p.id] !== false;
    });
  }

  function updateRecon() {
    var list = activePlatforms();
    var billed = 0;
    var reported = 0;
    list.forEach(function (p) {
      billed += p.billed;
      reported += p.reported;
    });
    var variance = reported - billed;
    var pct = billed ? (variance / billed) * 100 : 0;
    if (billedEl) billedEl.textContent = money(billed);
    if (reportedEl) reportedEl.textContent = money(reported);
    if (varianceEl) {
      varianceEl.textContent =
        (variance >= 0 ? "+" : "") + money(variance) + " (" + pct.toFixed(1) + "%)";
    }
    if (varianceTone) {
      var abs = Math.abs(pct);
      varianceTone.setAttribute(
        "data-tone",
        abs < 2 ? "good" : abs < 5 ? "warn" : "bad",
      );
      varianceTone.textContent =
        abs < 2
          ? "Within tolerance — ready for close."
          : abs < 5
            ? "Investigate before finance signs."
            : "Material drift — reconcile invoices vs Ads Manager.";
    }
    if (barsEl) {
      var max = Math.max.apply(
        null,
        list
          .map(function (p) {
            return Math.max(p.billed, p.reported);
          })
          .concat([1]),
      );
      barsEl.replaceChildren();
      list.forEach(function (p) {
        var row = document.createElement("div");
        row.className = "ca-bar-row";
        var lab = document.createElement("span");
        lab.className = "ca-bar-lab";
        lab.textContent = p.label;
        var track = document.createElement("div");
        track.className = "ca-bar-track";
        track.setAttribute("aria-hidden", "true");
        var fillB = document.createElement("div");
        fillB.className = "ca-bar-fill ca-bar-fill--billed";
        fillB.style.width = ((p.billed / max) * 100).toFixed(1) + "%";
        var fillR = document.createElement("div");
        fillR.className = "ca-bar-fill ca-bar-fill--reported";
        fillR.style.width = ((p.reported / max) * 100).toFixed(1) + "%";
        track.appendChild(fillB);
        track.appendChild(fillR);
        var vals = document.createElement("span");
        vals.className = "ca-bar-vals mono";
        vals.textContent = money(p.billed) + " · UI " + money(p.reported);
        row.appendChild(lab);
        row.appendChild(track);
        row.appendChild(vals);
        barsEl.appendChild(row);
      });
    }
  }

  checks.forEach(function (c) {
    c.addEventListener("change", updateRecon);
  });
  if (checks.length) updateRecon();

  /* —— 3. Lead-gen efficiency slider —— */
  var spendRange = document.querySelector("[data-ca-lg-spend]");
  var leadRange = document.querySelector("[data-ca-lg-leads]");
  var targetRange = document.querySelector("[data-ca-lg-target]");
  var spendOut = document.querySelector("[data-ca-lg-spend-out]");
  var leadOut = document.querySelector("[data-ca-lg-leads-out]");
  var targetOut = document.querySelector("[data-ca-lg-target-out]");
  var cpqlOut = document.querySelector("[data-ca-lg-cpql]");
  var verdict = document.querySelector("[data-ca-lg-verdict]");

  function updateLeadGen() {
    if (!spendRange || !leadRange || !targetRange) return;
    var spend = Number(spendRange.value);
    var leads = Number(leadRange.value);
    var target = Number(targetRange.value);
    var cpql = leads > 0 ? spend / leads : 0;
    if (spendOut) spendOut.textContent = money(spend);
    if (leadOut) leadOut.textContent = String(leads);
    if (targetOut) targetOut.textContent = money1(target);
    if (cpqlOut) cpqlOut.textContent = money1(cpql);
    if (verdict) {
      if (cpql <= target) {
        verdict.textContent =
          "Under target CPQL — protect channels that produce qualified pipeline.";
        verdict.setAttribute("data-tone", "good");
      } else {
        verdict.textContent =
          "Above target CPQL — cut or reallocate before scaling spend.";
        verdict.setAttribute("data-tone", "bad");
      }
    }
  }

  [spendRange, leadRange, targetRange].forEach(function (el) {
    if (el) el.addEventListener("input", updateLeadGen);
  });
  updateLeadGen();

  /* —— 4. Package picker → prefill inquiry form —— */
  var packageBtns = document.querySelectorAll("[data-ca-package]");
  var budgetSelect = document.querySelector(
    'form[data-waitlist-source="custom-analytics inquiry"] select[name="budget"]',
  );
  var notesArea = document.querySelector(
    'form[data-waitlist-source="custom-analytics inquiry"] textarea[name="notes"]',
  );
  var packageHints = {
    audit:
      "Interested in Spend & Sales Audit ($5–8K): exact spend by platform + sales/revenue recon memo.",
    leadgen:
      "Interested in Lead Gen Decision Desk ($8–15K): spend × CRM stages, CPL/CPQL, weekly ritual.",
    mds:
      "Interested in Advanced MDS Build ($15–25K): custom decision system, pipelines, allocation rules, handoff.",
  };
  var budgetMap = {
    audit: "$5k–$8k",
    leadgen: "$8k–$15k",
    mds: "$15k–$25k",
  };

  packageBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-ca-package");
      packageBtns.forEach(function (b) {
        b.classList.toggle("is-selected", b === btn);
      });
      if (budgetSelect && budgetMap[key]) {
        budgetSelect.value = budgetMap[key];
      }
      if (notesArea && packageHints[key]) {
        var existing = notesArea.value.trim();
        if (!existing || Object.values(packageHints).indexOf(existing) !== -1) {
          notesArea.value = packageHints[key];
        }
      }
      var inquire = document.getElementById("inquire");
      if (inquire) inquire.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

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
