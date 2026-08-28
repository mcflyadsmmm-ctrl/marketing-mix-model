/**
 * Science SAMPLE contracts — SKU pages only.
 * Dollar SAMPLE is Northline: invoice $98,500 · UI $99,950 ·
 * sales_net $412,400 · cash 4.19× · platform ~4.8× ($472,800 ÷ $98,500).
 * Lead-gen SAMPLE is separate ($42,000 / 186). Two totals.
 * SAMPLE · demo-not-production. No lift. No $39 app CTA.
 */
(function () {
  "use strict";

  var page = document.body && document.body.getAttribute("data-page");
  if (
    page !== "spend-sales-audit" &&
    page !== "lead-gen-desk" &&
    page !== "advanced-mds"
  ) {
    return;
  }

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

  var times = function (n) {
    return n.toFixed(2) + "×";
  };

  var flagFor = function (pct) {
    var abs = Math.abs(pct);
    if (abs < 2) return { tone: "good", label: "Close" };
    if (abs <= 5) return { tone: "warn", label: "Investigate" };
    return { tone: "bad", label: "Material drift" };
  };

  var setText = function (el, text) {
    if (el) el.textContent = text;
  };

  var setTone = function (el, tone) {
    if (!el) return;
    el.setAttribute("data-tone", tone);
  };

  /* —— Spend & Sales Audit —— */
  function initAudit() {
    var root = document.querySelector("[data-sci-audit]");
    if (!root) return;

    var platforms = [
      { id: "meta", label: "Meta", invoice: 41200, ui: 42850 },
      { id: "google", label: "Google", invoice: 31800, ui: 31120 },
      { id: "linkedin", label: "LinkedIn", invoice: 15400, ui: 16180 },
      { id: "other", label: "Other paid", invoice: 10100, ui: 9800 },
    ];
    var salesNet = 412400;
    var attributed = 472800;

    var checks = root.querySelectorAll("[data-sci-plat]");
    var invoiceEl = root.querySelector("[data-sci-invoice]");
    var uiEl = root.querySelector("[data-sci-ui]");
    var varEl = root.querySelector("[data-sci-variance]");
    var pctEl = root.querySelector("[data-sci-pct]");
    var toneEl = root.querySelector("[data-sci-tone]");
    var finEl = root.querySelector("[data-sci-finance-roas]");
    var platformEl = root.querySelector("[data-sci-platform-roas]");
    var finFormulaEl = root.querySelector("[data-sci-finance-formula]");
    var platformFormulaEl = root.querySelector("[data-sci-platform-formula]");
    var beEl = root.querySelector("[data-sci-be]");
    var marginInput = root.querySelector("[data-sci-margin]");
    var memoBody = root.querySelector("[data-sci-memo-body]");

    function active() {
      var on = {};
      checks.forEach(function (c) {
        on[c.getAttribute("data-sci-plat")] = c.checked;
      });
      return platforms.filter(function (p) {
        return on[p.id] === true;
      });
    }

    function update() {
      checks.forEach(function (c) {
        var id = c.getAttribute("data-sci-plat");
        var row = root.querySelector('[data-sci-row="' + id + '"]');
        if (row) row.hidden = !c.checked;
      });

      var list = active();
      var invoice = 0;
      var ui = 0;
      list.forEach(function (p) {
        invoice += p.invoice;
        ui += p.ui;
      });
      var variance = invoice - ui;
      var pct = invoice ? (variance / invoice) * 100 : 0;
      var flag = flagFor(pct);

      setText(invoiceEl, list.length ? money(invoice) : "n/a");
      setText(uiEl, list.length ? money(ui) : "n/a");
      setText(varEl, list.length ? signedMoney(variance) : "n/a");
      setText(pctEl, list.length ? signedPct(pct) : "n/a");
      if (toneEl) {
        setTone(toneEl, list.length ? flag.tone : "warn");
        toneEl.textContent = list.length ? flag.label : "—";
      }

      var finance =
        invoice > 0 ? times(salesNet / invoice) : "n/a";
      var platformRoas =
        invoice > 0 ? times(attributed / invoice) : "n/a";
      setText(finEl, finance);
      setText(platformEl, platformRoas);
      setText(
        finFormulaEl,
        invoice > 0
          ? "sales_net / spend_audited · $412,400 ÷ " + money(invoice)
          : "n/a",
      );
      setText(
        platformFormulaEl,
        invoice > 0
          ? "attributed revenue ÷ same invoice spend · $472,800 ÷ " +
              money(invoice)
          : "n/a",
      );

      var margin = marginInput ? Number(marginInput.value) : 0.35;
      if (!isFinite(margin) || margin <= 0) {
        setText(beEl, "n/a");
      } else {
        setText(beEl, times(1 / margin));
      }

      var names = list
        .map(function (p) {
          return p.label;
        })
        .join(", ");
      var worstLine = "No platforms included — tick a channel to rebuild the close.";
      if (list.length) {
        var worst = list.slice().sort(function (a, b) {
          var ap = Math.abs((a.invoice - a.ui) / a.invoice);
          var bp = Math.abs((b.invoice - b.ui) / b.invoice);
          return bp - ap;
        })[0];
        var worstPct = ((worst.invoice - worst.ui) / worst.invoice) * 100;
        var worstFlag = flagFor(worstPct);
        worstLine =
          worst.label +
          " " +
          signedPct(worstPct) +
          " — " +
          worstFlag.label +
          ". Do not scale on UI.";
      }

      if (memoBody) {
        memoBody.textContent =
          "Period: Northline SAMPLE week · SAMPLE · demo-not-production\n" +
          "Channels: " +
          (names || "none") +
          "\nInvoice " +
          (list.length ? money(invoice) : "n/a") +
          " · UI " +
          (list.length ? money(ui) : "n/a") +
          " · invoice − UI " +
          (list.length ? signedMoney(variance) + " (" + signedPct(pct) + ")" : "n/a") +
          " — " +
          (list.length ? flag.label.toLowerCase() : "n/a") +
          "\nNet sales $412,400 · cash " +
          finance +
          " · platform " +
          platformRoas +
          " ($472,800 ÷ same invoice spend)\n" +
          worstLine +
          " Invoice vs UI is tax, fees, timezone, or credit timing — not returns + last-touch.";
      }
    }

    checks.forEach(function (c) {
      c.addEventListener("change", update);
    });
    if (marginInput) marginInput.addEventListener("input", update);
    update();
  }

  /* —— Lead Gen reporting —— */
  function initLead() {
    var root = document.querySelector("[data-sci-lead]");
    if (!root) return;

    var spend = 42000;
    var qInput = root.querySelector("[data-sci-qualified]");
    var rawInput = root.querySelector("[data-sci-raw]");
    var sqlInput = root.querySelector("[data-sci-sql]");
    var targetInput = root.querySelector("[data-sci-target]");
    var cpqlEl = root.querySelector("[data-sci-cpql]");
    var cplEl = root.querySelector("[data-sci-cpl]");
    var cpsqlEl = root.querySelector("[data-sci-cpsql]");
    var gapEl = root.querySelector("[data-sci-gap]");
    var verdictEl = root.querySelector("[data-sci-verdict]");
    var cpqlFormula = root.querySelector("[data-sci-cpql-formula]");

    function perHead(spendAmt, count) {
      if (!(count > 0)) return "n/a";
      return money(Math.round(spendAmt / count));
    }

    function update() {
      var qualified = qInput ? Number(qInput.value) : 186;
      var raw = rawInput ? Number(rawInput.value) : 310;
      var sql = sqlInput ? Number(sqlInput.value) : 62;
      var target = targetInput ? Number(targetInput.value) : 250;

      var cpql = qualified > 0 ? Math.round(spend / qualified) : null;
      setText(cpqlEl, qualified > 0 ? money(cpql) : "n/a");
      setText(
        cpqlFormula,
        qualified > 0
          ? "CPQL = spend_audited / qualified · $42,000 / " + qualified
          : "qualified ≤ 0 → n/a, never Infinity",
      );
      setText(cplEl, perHead(spend, raw));
      setText(cpsqlEl, perHead(spend, sql));

      if (cpql === null || !(target > 0)) {
        setText(gapEl, "n/a");
        setText(verdictEl, "n/a");
        setTone(verdictEl, "warn");
        return;
      }

      var gap = cpql - target;
      setText(gapEl, signedMoney(gap));
      if (cpql <= target) {
        setText(verdictEl, "Protect mix");
        setTone(verdictEl, "good");
      } else {
        setText(verdictEl, "Do not scale");
        setTone(verdictEl, "bad");
      }
    }

    [qInput, rawInput, sqlInput, targetInput].forEach(function (el) {
      if (el) el.addEventListener("input", update);
    });
    update();
  }

  /* —— Advanced MDS —— */
  function initMds() {
    var root = document.querySelector("[data-sci-mds]");
    if (!root) return;

    var modeBtns = root.querySelectorAll("[data-sci-mode]");
    var panels = root.querySelectorAll("[data-sci-panel]");

    function setMode(key) {
      modeBtns.forEach(function (btn) {
        var on = btn.getAttribute("data-sci-mode") === key;
        btn.classList.toggle("is-on", on);
        if (on) btn.setAttribute("aria-current", "true");
        else btn.removeAttribute("aria-current");
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-sci-panel") !== key;
      });
    }

    modeBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setMode(btn.getAttribute("data-sci-mode"));
      });
    });

    function fillMix(table, rows, kind) {
      if (!table) return;
      var tbody = table.querySelector("tbody");
      var nextEl = table.querySelector("[data-sci-next]");
      var panel = table.closest("[data-sci-panel]");
      var noteEl = panel
        ? panel.querySelector("[data-sci-mix-note]")
        : null;
      if (!tbody) return;

      var weights = rows.map(function (r) {
        return kind === "leads"
          ? Math.max(r.target - r.eff, 0)
          : Math.max(r.eff - r.target, 0);
      });
      var sum = weights.reduce(function (a, b) {
        return a + b;
      }, 0);
      var keepCurrent = sum === 0;

      while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
      var nextBits = [];
      rows.forEach(function (r, i) {
        var share = keepCurrent ? r.current : weights[i] / sum;
        var tr = document.createElement("tr");
        var th = document.createElement("th");
        th.scope = "row";
        th.textContent = r.label;
        tr.appendChild(th);
        [
          (r.current * 100).toFixed(1) + "%",
          kind === "leads" ? money(r.eff) : times(r.eff),
          kind === "leads" ? money(r.target) : times(r.target),
          weights[i].toFixed(2),
          (share * 100).toFixed(1) + "%",
        ].forEach(function (text) {
          var td = document.createElement("td");
          td.className = "mono";
          td.textContent = text;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
        if (share > 0) {
          nextBits.push(r.label + " " + (share * 100).toFixed(1) + "%");
        }
      });

      setText(
        nextEl,
        keepCurrent
          ? "Σweight = 0 — keep the current mix."
          : "Next SAMPLE dollar: " + nextBits.join(" · "),
      );
      setText(
        noteEl,
        kind === "leads"
          ? "weight_c = max(target_cpql − CPQL_c, 0). Stay on CPQL — not a dollar ROAS. Illustrative split of the next SAMPLE dollar."
          : "weight_c = max(eff_c − target_c, 0). Illustrative split of the next SAMPLE dollar. Not Bayesian, not geo, not incrementality.",
      );
    }

    fillMix(root.querySelector("[data-sci-mix='dollars']"), [
      { label: "Meta", current: 41200 / 98500, eff: 4.1, target: 3.5 },
      { label: "Google", current: 31800 / 98500, eff: 3.4, target: 3.5 },
      { label: "LinkedIn", current: 15400 / 98500, eff: 2.8, target: 3.2 },
      { label: "Other paid", current: 10100 / 98500, eff: 4.8, target: 3.8 },
    ], "dollars");

    fillMix(root.querySelector("[data-sci-mix='leads']"), [
      { label: "Meta", current: 18000 / 42000, eff: 196, target: 250 },
      { label: "Google", current: 14000 / 42000, eff: 241, target: 250 },
      { label: "LinkedIn", current: 7000 / 42000, eff: 318, target: 250 },
      { label: "Other paid", current: 3000 / 42000, eff: 214, target: 250 },
    ], "leads");
  }

  if (page === "spend-sales-audit") initAudit();
  else if (page === "lead-gen-desk") initLead();
  else if (page === "advanced-mds") initMds();
})();
