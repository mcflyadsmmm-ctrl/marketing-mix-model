/**
 * SAMPLE instrument for /lab and /custom-analytics.
 * Book: Northline Supply week — invoice $98,500 · UI $99,950 ·
 * sales_net $412,400 · cash 4.19× · platform ~4.8× ($472,800 ÷ $98,500).
 * Channel toggles rewrite ledger + close memo only.
 * Exception toggles move unexplained $. Cash identity never moves.
 */
(function () {
  "use strict";

  var root = document.querySelector("[data-lab-desk]");
  if (!root) return;

  var CASH_SALES = 412400;
  var CASH_SPEND = 98500;
  var CASH_ROAS = "4.19×";
  var PLATFORM_REV = 472800;

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
  var gapEl = root.querySelector("[data-lab-gap]");

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
    var dir =
      worst.billed - worst.reported < 0
        ? "UI ahead of invoice"
        : "invoice ahead of UI";
    return (
      worst.label +
      " " +
      dir +
      " — tax, fee, timezone, or credit timing. Investigate before finance signs."
    );
  }

  function ledgerTotals() {
    var list = activePlatforms();
    var billed = 0;
    var reported = 0;
    list.forEach(function (p) {
      billed += p.billed;
      reported += p.reported;
    });
    return { list: list, billed: billed, reported: reported, gap: billed - reported };
  }

  function updateRecon() {
    checks.forEach(function (c) {
      var id = c.getAttribute("data-ca-plat");
      var row = root.querySelector('[data-ca-row="' + id + '"]');
      if (row) row.hidden = !c.checked;
    });

    var t = ledgerTotals();
    var pct = t.billed ? (t.gap / t.billed) * 100 : 0;
    var flag = flagFor(pct);

    if (billedEl) billedEl.textContent = money(t.billed);
    if (reportedEl) reportedEl.textContent = money(t.reported);
    if (varianceEl) varianceEl.textContent = signedMoney(t.gap);
    if (variancePctEl) variancePctEl.textContent = signedPct(pct);
    if (varianceTone) {
      varianceTone.setAttribute("data-tone", t.list.length ? flag.tone : "warn");
      varianceTone.textContent = t.list.length ? flag.label : "—";
    }
    if (gapEl) gapEl.textContent = signedMoney(t.gap);
    if (memoBody) {
      var names = t.list
        .map(function (p) {
          return p.label;
        })
        .join(", ");
      memoBody.textContent =
        "Period: Northline SAMPLE week · channels: " +
        (names || "none") +
        "\nInvoice billed " +
        money(t.billed) +
        " · Ads Manager UI " +
        money(t.reported) +
        " · billed − UI " +
        signedMoney(t.gap) +
        " (" +
        signedPct(pct) +
        ")\nAction: " +
        actionLine(t.list) +
        "\nCash identity locked: " +
        money(CASH_SALES) +
        " ÷ " +
        money(CASH_SPEND) +
        " = " +
        CASH_ROAS +
        ". Exceptions do not rewrite it.";
    }
    updateExceptions();
  }

  checks.forEach(function (c) {
    c.addEventListener("change", updateRecon);
  });

  var exceptChecks = root.querySelectorAll("[data-lab-except]");
  var residualEl = root.querySelector("[data-lab-residual]");
  var worksheetBody = root.querySelector("[data-lab-ws]");

  function updateExceptions() {
    var t = ledgerTotals();
    var classified = 0;
    var lines = [
      {
        label: "billed − UI (included channels)",
        amount: t.gap,
        on: true,
      },
    ];
    exceptChecks.forEach(function (c) {
      var amt = Number(c.getAttribute("data-except-amt") || 0);
      var sign = Number(c.getAttribute("data-except-sign") || 1);
      var delta = c.checked ? sign * amt : 0;
      classified += delta;
      lines.push({
        label: c.getAttribute("data-except-label") || c.parentNode.textContent.trim(),
        amount: delta,
        on: c.checked,
      });
    });
    var residual = t.gap + classified;

    if (worksheetBody) {
      while (worksheetBody.firstChild) worksheetBody.removeChild(worksheetBody.firstChild);
      lines.forEach(function (line) {
        var tr = document.createElement("tr");
        if (!line.on) tr.style.opacity = "0.45";
        var th = document.createElement("th");
        th.scope = "row";
        th.textContent = line.label;
        var td = document.createElement("td");
        td.className = "mono";
        td.textContent = line.on ? signedMoney(line.amount) : "excluded";
        tr.appendChild(th);
        tr.appendChild(td);
        worksheetBody.appendChild(tr);
      });
      var foot = document.createElement("tr");
      var fh = document.createElement("th");
      fh.scope = "row";
      fh.textContent = "Residual unexplained";
      var fd = document.createElement("td");
      fd.className = "mono";
      fd.textContent = signedMoney(residual);
      foot.appendChild(fh);
      foot.appendChild(fd);
      worksheetBody.appendChild(foot);
    }

    if (residualEl) {
      residualEl.textContent =
        "Residual " +
        signedMoney(residual) +
        " after classified exceptions. Timing / fees / coverage — not a new Total ROAS. Cash stays " +
        CASH_ROAS +
        " on " +
        money(CASH_SALES) +
        " ÷ " +
        money(CASH_SPEND) +
        ".";
    }
  }

  exceptChecks.forEach(function (c) {
    c.addEventListener("change", updateExceptions);
  });

  /* Illustrative MDS split of the next SAMPLE dollar. */
  function fillMix() {
    var table = root.querySelector("[data-lab-mix]");
    if (!table) return;
    var tbody = table.querySelector("tbody");
    var nextEl = table.querySelector("[data-lab-next]");
    var noteEl = root.querySelector("[data-lab-mix-note]");
    var hurdleInput = root.querySelector("[data-lab-hurdle]");
    if (!tbody) return;

    var rows = [
      { label: "Meta", current: 41200 / 98500, eff: 4.6 },
      { label: "Google", current: 31800 / 98500, eff: 3.7 },
      { label: "LinkedIn", current: 15400 / 98500, eff: 3.2 },
      { label: "Other paid", current: 10100 / 98500, eff: 5.2 },
    ];
    var hurdle = hurdleInput ? Number(hurdleInput.value) : 4;
    if (!isFinite(hurdle) || hurdle <= 0) hurdle = 4;

    var weights = rows.map(function (r) {
      return Math.max(r.eff - hurdle, 0);
    });
    var sum = weights.reduce(function (a, b) {
      return a + b;
    }, 0);
    var keep = sum === 0;

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    var nextBits = [];
    rows.forEach(function (r, i) {
      var share = keep ? r.current : weights[i] / sum;
      var tr = document.createElement("tr");
      var th = document.createElement("th");
      th.scope = "row";
      th.textContent = r.label;
      tr.appendChild(th);
      [
        (r.current * 100).toFixed(1) + "%",
        r.eff.toFixed(2) + "×",
        hurdle.toFixed(2) + "×",
        weights[i].toFixed(2),
        (share * 100).toFixed(1) + "%",
      ].forEach(function (text) {
        var td = document.createElement("td");
        td.className = "mono";
        td.textContent = text;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
      if (share > 0.0005) {
        nextBits.push(r.label + " " + (share * 100).toFixed(1) + "%");
      }
    });
    if (nextEl) {
      nextEl.textContent = keep
        ? "Σweight = 0 — keep the current mix."
        : "Next SAMPLE dollar: " + nextBits.join(" · ");
    }
    if (noteEl) {
      noteEl.textContent =
        "weight_c = max(eff_c − " +
        hurdle.toFixed(2) +
        "×, 0). Illustrative split of the next SAMPLE dollar. Not Nielsen / Meridian / Recast. Not geo. Not incrementality. Portfolio cash stays " +
        CASH_ROAS +
        " = " +
        money(CASH_SALES) +
        " ÷ " +
        money(CASH_SPEND) +
        ".";
    }
  }

  var hurdleInput = root.querySelector("[data-lab-hurdle]");
  if (hurdleInput) {
    hurdleInput.addEventListener("input", fillMix);
    fillMix();
  }

  if (checks.length) updateRecon();
  else updateExceptions();

  void PLATFORM_REV;
})();
