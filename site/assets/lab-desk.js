/**
 * Shared SAMPLE desk for /lab and /custom-analytics.
 * Book: Northline Supply week — invoice $98,500 · UI $99,950 ·
 * sales $412,400 · cash 4.19× · platform ~4.8×.
 */
(function () {
  "use strict";

  var root = document.querySelector("[data-lab-desk]");
  if (!root) return;

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

  var modeBtns = root.querySelectorAll("[data-ca-mode]");
  var panels = root.querySelectorAll("[data-ca-panel]");

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

  var platforms = [
    { id: "meta", label: "Meta", billed: 41200, reported: 42850 },
    { id: "google", label: "Google", billed: 31800, reported: 31120 },
    { id: "linkedin", label: "LinkedIn", billed: 15400, reported: 16180 },
    { id: "other", label: "Other paid", billed: 10100, reported: 9800 },
  ];

  var checks = root.querySelectorAll("[data-ca-plat]");
  var billedEl = root.querySelector("[data-ca-billed]");
  var reportedEl = root.querySelector("[data-ca-reported]");
  var varianceEl = root.querySelector("[data-ca-variance]");
  var variancePctEl = root.querySelector("[data-ca-variance-pct]");
  var varianceTone = root.querySelector("[data-ca-variance-tone]");
  var memoBody = root.querySelector("[data-ca-memo-body]");

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
      return "No channels included — tick a channel to rebuild the close.";
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
      " — returns + last-touch. Investigate before finance signs."
    );
  }

  function updateRecon() {
    checks.forEach(function (c) {
      var id = c.getAttribute("data-ca-plat");
      var row = root.querySelector('[data-ca-row="' + id + '"]');
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
        "Period: Northline SAMPLE week · channels: " +
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

  var exceptChecks = root.querySelectorAll("[data-lab-except]");
  var residualEl = root.querySelector("[data-lab-residual]");

  function updateExceptions() {
    var residual = 0;
    exceptChecks.forEach(function (c) {
      if (c.checked) residual += Number(c.getAttribute("data-lab-except") || 0);
    });
    if (residualEl) {
      residualEl.textContent =
        "Residual " +
        money(residual) +
        " — reconciling line, not a new Total ROAS. Cash stays 4.19× on $412,400 ÷ $98,500.";
    }
  }

  exceptChecks.forEach(function (c) {
    c.addEventListener("change", updateExceptions);
  });
  if (exceptChecks.length) updateExceptions();
})();
