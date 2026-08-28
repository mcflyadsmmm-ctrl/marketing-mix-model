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

  /* —— 3. Package picker → prefill inquiry form —— */
  var packageBtns = document.querySelectorAll("[data-ca-package]");
  var budgetSelect = document.querySelector(
    'form[data-waitlist-source="custom-analytics inquiry"] select[name="budget"]',
  );
  var notesArea = document.querySelector(
    'form[data-waitlist-source="custom-analytics inquiry"] textarea[name="notes"]',
  );
  var packageHints = {
    audit:
      "Engagement interest: Spend & Sales Audit ($5–8K) — close memo: spend by platform, invoice vs platform UI, sales period check.",
    leadgen:
      "Engagement interest: Lead Gen reporting ($8–15K) — paid spend joined to CRM stages, CPL / cost per qualified lead, weekly report.",
    mds:
      "Engagement interest: Advanced MDS ($15–25K) — pipelines or Sheet source of truth, reporting UI, simple allocation, production handoff.",
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

  /* —— 4. Privacy practices accordion —— */
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
