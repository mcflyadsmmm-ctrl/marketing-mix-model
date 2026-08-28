/**
 * SAMPLE instrument for /lab and /custom-analytics.
 * Book: Northline Supply week — invoice $98,500 · UI $99,950 ·
 * sales_net $412,400 · cash 4.19× · platform ~4.8× ($472,800 ÷ $98,500).
 * Channel toggles rewrite ledger + close memo only.
 * Exception toggles move unexplained $. Cash identity never moves.
 */
(function () {
  "use strict";

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
    { id: "linkedin", label: "Microsoft", billed: 15400, reported: 16180 },
    { id: "other", label: "Email", billed: 10100, reported: 9800 },
  ];

  function bindRecon(root) {
  if (!root) return;
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

  /* Four SAMPLE if/then rules. Toggle on/off rewrites mix $. Cash identity never moves.
     CPQL seed is $42,000 / 186 = $226 vs target $250 (same as /lead-gen-desk).
     $226 ≤ $250 so the cut does not fire. Do not invent target $200 to force a cut.
     data-lab-rule="cpql-cut" is opt-in teaching, default off. */
  var BASE_MIX = { meta: 41200, google: 31800, linkedin: 15400, other: 10100 };
  var MIX_ROWS = [
    { id: "meta", label: "Meta" },
    { id: "google", label: "Google" },
    { id: "linkedin", label: "Microsoft" },
    { id: "other", label: "Email" },
  ];

  function ruleOn(name) {
    var el = root.querySelector('[data-lab-rule="' + name + '"]');
    return el ? el.checked : false;
  }

  function computeMix() {
    var m = {
      meta: BASE_MIX.meta,
      google: BASE_MIX.google,
      linkedin: BASE_MIX.linkedin,
      other: BASE_MIX.other,
    };
    if (ruleOn("google-plus")) {
      m.google += 3180;
      m.linkedin -= 3180;
    }
    if (ruleOn("cpql-cut")) {
      m.linkedin -= 2000;
      m.google += 2000;
    }
    if (!ruleOn("mkt-freeze")) {
      m.other -= 1000;
      m.google += 1000;
    }
    if (!ruleOn("meta-hold")) {
      m.meta += 1000;
      m.google -= 1000;
    }
    return m;
  }

  function fillRulesMix() {
    var table = root.querySelector("[data-lab-mix]");
    if (!table) return;
    var tbody = table.querySelector("tbody");
    var nextEl = table.querySelector("[data-lab-next]");
    var noteEl = root.querySelector("[data-lab-mix-note]");
    if (!tbody) return;

    var mix = computeMix();
    var notes = {
      meta: ruleOn("meta-hold") ? "hold scale" : "hold off",
      google: ruleOn("google-plus") ? "+10% Google" : "no +10%",
      linkedin: root.querySelector('[data-lab-rule="cpql-cut"]')
        ? ruleOn("cpql-cut")
          ? "CPQL cut"
          : "no CPQL cut"
        : ruleOn("ms-material")
          ? "investigate"
          : "cleared",
      other: ruleOn("mkt-freeze") ? "do not spend-optimize" : "optimize on",
    };

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    MIX_ROWS.forEach(function (r) {
      var tr = document.createElement("tr");
      var th = document.createElement("th");
      th.scope = "row";
      th.textContent = r.label;
      tr.appendChild(th);
      var invoice = document.createElement("td");
      invoice.className = "mono";
      invoice.textContent = money(BASE_MIX[r.id]);
      tr.appendChild(invoice);
      var mixTd = document.createElement("td");
      mixTd.className = "mono";
      mixTd.setAttribute("data-lab-mix-amt", r.id);
      mixTd.textContent = money(mix[r.id]);
      tr.appendChild(mixTd);
      var noteTd = document.createElement("td");
      noteTd.textContent = notes[r.id];
      tr.appendChild(noteTd);
      tbody.appendChild(tr);
    });

    if (nextEl) {
      nextEl.textContent =
        "Mix Σ " +
        money(mix.meta + mix.google + mix.linkedin + mix.other) +
        " · cash stays " +
        CASH_ROAS +
        " on " +
        money(CASH_SALES) +
        " ÷ " +
        money(CASH_SPEND) +
        ".";
    }
    if (noteEl) {
      noteEl.textContent =
        "Rules rewrite mix $ only. Cash stays " +
        CASH_ROAS +
        " = " +
        money(CASH_SALES) +
        " ÷ " +
        money(CASH_SPEND) +
        ".";
    }
  }

  var ruleChecks = root.querySelectorAll("[data-lab-rule]");
  ruleChecks.forEach(function (c) {
    c.addEventListener("change", fillRulesMix);
  });
  if (ruleChecks.length) fillRulesMix();

  var printBtn = root.querySelector("[data-lab-print-memo]");
  if (printBtn) {
    printBtn.addEventListener("click", function () {
      document.body.classList.add("lab-print-memo");
      window.print();
    });
    window.addEventListener("afterprint", function () {
      document.body.classList.remove("lab-print-memo");
    });
  }

  if (checks.length) updateRecon();
  else updateExceptions();
  }

  document.querySelectorAll("[data-lab-desk]").forEach(bindRecon);

  function initLabApp() {
    var app = document.querySelector("[data-lab-app]");
    if (!app) return;

    var desks = {
      recon: document.getElementById("desk-recon"),
      exec: document.getElementById("desk-exec"),
      portal: document.getElementById("desk-portal"),
    };
    var rails = app.querySelectorAll("[data-lab-rail]");
    var roleBtns = app.querySelectorAll("[data-lab-role]");
    var seatEl = app.querySelector("[data-lab-seat]");
    var execMemo = app.querySelector("[data-lab-exec-memo]");
    var holdBtn = app.querySelector("[data-lab-hold-meta]");
    var galleryDoors = document.querySelectorAll("[data-lab-door]");

    function showDesk(name) {
      var key = desks[name] ? name : "recon";
      Object.keys(desks).forEach(function (id) {
        if (desks[id]) desks[id].hidden = id !== key;
      });
      galleryDoors.forEach(function (d) {
        d.classList.toggle("is-on", d.getAttribute("data-lab-door") === key);
      });
      rails.forEach(function (r) {
        var rail = r.getAttribute("data-lab-rail");
        var on =
          (key === "recon" && rail === "recon") ||
          (key === "exec" && (rail === "desk" || rail === "contracts" || rail === "handoff")) ||
          (key === "portal" && rail === "desk");
        if (key === "exec" && rail === "desk") on = true;
        if (key === "exec" && (rail === "contracts" || rail === "handoff")) on = false;
        if (key === "portal") on = rail === "desk";
        if (on) r.setAttribute("aria-current", "page");
        else r.removeAttribute("aria-current");
      });
    }

    function setRole(role) {
      var next = role === "finance" || role === "media" ? role : "operator";
      roleBtns.forEach(function (b) {
        var on = b.getAttribute("data-lab-role") === next;
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      var title =
        next === "finance" ? "Finance" : next === "media" ? "Media" : "Operator";
      var whoLine = "A. Chen · " + title;
      app.querySelectorAll("[data-lab-who]").forEach(function (el) {
        el.textContent = whoLine;
      });
      if (seatEl) {
        seatEl.textContent = "seat 2 of 4";
      }
      app.querySelectorAll("[data-lab-role-panel]").forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-lab-role-panel") !== next;
      });
    }

    galleryDoors.forEach(function (d) {
      d.addEventListener("click", function (event) {
        event.preventDefault();
        var name = d.getAttribute("data-lab-door");
        showDesk(name);
        if (name === "portal") setRole("operator");
        var target = desks[name];
        if (target && target.scrollIntoView) {
          target.scrollIntoView({ block: "start" });
        }
      });
    });

    rails.forEach(function (r) {
      r.addEventListener("click", function (event) {
        event.preventDefault();
        var rail = r.getAttribute("data-lab-rail");
        if (rail === "recon") {
          showDesk("recon");
        } else {
          showDesk("exec");
          var jump =
            rail === "contracts"
              ? document.getElementById("desk-exec-contracts")
              : rail === "handoff"
                ? document.getElementById("desk-exec-handoff")
                : desks.exec;
          if (jump && jump.scrollIntoView) jump.scrollIntoView({ block: "start" });
        }
        rails.forEach(function (x) {
          var on = x === r;
          if (on) x.setAttribute("aria-current", "page");
          else x.removeAttribute("aria-current");
        });
      });
    });

    roleBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        setRole(b.getAttribute("data-lab-role"));
        showDesk("portal");
      });
    });

    if (holdBtn && execMemo) {
      holdBtn.addEventListener("click", function () {
        execMemo.textContent =
          "Period: Northline SAMPLE week. Signed spend $98,500. Cash 4.19× vs BE 2.86× vs target 4.00×. invoice−UI −$1,450 (−1.5%).\nAction: HOLD Meta — UI $42,850 ahead of invoice $41,200 (−4.0%). Do not scale. Numbers do not invent lift.";
        showDesk("exec");
      });
    }

    var hash = (location.hash || "").replace(/^#/, "");
    if (hash === "desk-recon") {
      showDesk("recon");
    } else if (hash === "desk-portal") {
      showDesk("portal");
    } else {
      showDesk("exec");
    }
    setRole("operator");
  }

  initLabApp();

  void PLATFORM_REV;
})();
