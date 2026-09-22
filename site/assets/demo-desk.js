/**
 * Mcfly SAMPLE Overview — Snowdevil.
 * YoY sales first. Overview · Orders · Customers peek. Spend optional ($19,023 / $68,457 / 3.60×).
 * Recomputed from buildThreeYearSampleDesk({ now: 2026-09-16T18:00:00Z }).
 * Demo data only. Loud SAMPLE labeling. No pixels / MTA / path credit.
 */
(function () {
  "use strict";

  var DEFAULT_TARGET = 3.5;
  var DEFAULT_MARGIN = 0.4;
  var AS_OF_SHORT = "Sep 16";
  var SHOP = "Snowdevil";

  var YOY = {
    mtd: { sales: 68457, prior: 69891 },
    qtd: { sales: 210622, prior: 210817 },
    ytd: { sales: 918649, prior: 918365 },
  };

  var PERIODS = {
    mtd: {
      id: "mtd",
      label: "This month",
      asOf: "Sep 1–16, 2026",
      netSales: 68457,
      spend: 19023,
      priorSales: 69891,
      orders: 110,
      newCustomers: 37,
      returningSales: 45409,
      typicalOrder: 631,
      weekendShare: 0.23,
      daysToSecond: 21,
      ltv90: 890,
      decisionLead: "Typical order around $631. Returning buyers carry 66% of sales.",
      decisionWhy:
        "This month SAMPLE: 110 orders and $68,457 sales. Spend is optional.",
    },
    qtd: {
      id: "qtd",
      label: "This quarter",
      asOf: "Jul 1–Sep 16, 2026",
      netSales: 210622,
      spend: 59044,
      priorSales: 210817,
      orders: 346,
      newCustomers: 107,
      returningSales: 145429,
      typicalOrder: 612,
      weekendShare: 0.25,
      daysToSecond: 21,
      ltv90: 890,
      decisionLead: "Typical order around $612. Returning buyers carry 69% of sales.",
      decisionWhy:
        "This quarter SAMPLE: 346 orders and $210,622 sales. Spend is optional.",
    },
    ytd: {
      id: "ytd",
      label: "This year",
      asOf: "Jan 1–Sep 16, 2026",
      netSales: 918649,
      spend: 257014,
      priorSales: 918365,
      orders: 1506,
      newCustomers: 480,
      returningSales: 625739,
      typicalOrder: 611,
      weekendShare: 0.26,
      daysToSecond: 21,
      ltv90: 890,
      decisionLead: "Typical order around $611. Returning buyers carry 68% of sales.",
      decisionWhy:
        "This year SAMPLE: 1,506 orders and $918,649 sales. Spend is optional.",
    },
  };

  var state = {
    period: "mtd",
    section: "overview",
    margin: DEFAULT_MARGIN,
    targetMer: DEFAULT_TARGET,
    drawerOpen: false,
  };

  var drawerFocusReturn = null;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function money(n) {
    if (n == null || !Number.isFinite(n)) return "—";
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }

  function formatMer(n) {
    if (n == null || !Number.isFinite(n)) return "—";
    return n.toFixed(2) + "×";
  }

  function formatInt(n) {
    if (n == null || !Number.isFinite(n)) return "0";
    return n.toLocaleString("en-US");
  }

  function merOf(sales, spend) {
    if (!(spend > 0) || !Number.isFinite(sales)) return null;
    return sales / spend;
  }

  function yoyLine(sales, prior) {
    var delta = sales - prior;
    var pct = prior > 0 ? Math.round((delta / prior) * 100) : 0;
    var sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
    return sign + money(Math.abs(delta)) + " · " + (pct > 0 ? "+" : "") + pct + "%";
  }

  function setText(sel, text) {
    var el = $(sel);
    if (el) el.textContent = text;
  }

  function breakEven(margin) {
    if (!(margin > 0)) return null;
    return 1 / margin;
  }

  function openDrawer(title, html, trigger) {
    var drawer = $("#dd-drawer");
    var body = $("#dd-drawer-body");
    var heading = $("#dd-drawer-title");
    if (!drawer || !body || !heading) return;
    drawerFocusReturn = trigger || document.activeElement;
    state.drawerOpen = true;
    heading.textContent = title;
    body.innerHTML = html;
    drawer.hidden = false;
    var backdrop = $("#dd-drawer-backdrop");
    if (backdrop) {
      backdrop.hidden = false;
      backdrop.setAttribute("aria-hidden", "false");
    }
    document.body.classList.add("dd-drawer-open");
    var close = $("#dd-drawer-close");
    requestAnimationFrame(function () {
      (close || drawer).focus();
    });
  }

  function closeDrawer() {
    var drawer = $("#dd-drawer");
    if (drawer) drawer.hidden = true;
    var backdrop = $("#dd-drawer-backdrop");
    if (backdrop) {
      backdrop.hidden = true;
      backdrop.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("dd-drawer-open");
    state.drawerOpen = false;
    if (drawerFocusReturn && typeof drawerFocusReturn.focus === "function") {
      drawerFocusReturn.focus();
    }
    drawerFocusReturn = null;
  }

  function renderYoy() {
    ["mtd", "qtd", "ytd"].forEach(function (id) {
      var row = YOY[id];
      setText("#dd-yoy-" + id, money(row.sales));
      setText("#dd-yoy-" + id + "-prior", money(row.prior));
      setText("#dd-yoy-" + id + "-vs", yoyLine(row.sales, row.prior));
    });
  }

  function render() {
    var period = PERIODS[state.period] || PERIODS.mtd;
    var mer = merOf(period.netSales, period.spend);
    var be = breakEven(state.margin);
    var returningShare =
      period.netSales > 0
        ? Math.round((period.returningSales / period.netSales) * 100)
        : 0;

    setText("#dd-asof", period.asOf);
    setText("#dd-trust-asof", "As-of " + AS_OF_SHORT);
    setText("#dd-decision-takeaway", period.decisionLead);
    setText("#dd-decision-why", period.decisionWhy);

    setText("#dd-kpi-sales", money(period.netSales));
    setText("#dd-kpi-sales-sub", "Shopify orders · returns included");
    setText("#dd-kpi-sales-delta", yoyLine(period.netSales, period.priorSales));
    setText("#dd-kpi-typical", money(period.typicalOrder));
    setText("#dd-kpi-orders", formatInt(period.orders) + " orders");
    setText("#dd-kpi-returning", money(period.returningSales));
    setText("#dd-kpi-new", formatInt(period.newCustomers) + " new buyers");
    var retSub = $("[data-dd-kpi='returning'] .dd-kpi__sub");
    if (retSub) retSub.textContent = returningShare + "% of sales this window";

    setText("#dd-compact-orders", formatInt(period.orders));
    setText("#dd-compact-weekend", Math.round(period.weekendShare * 100) + "%");
    setText("#dd-compact-second", String(period.daysToSecond));
    setText("#dd-compact-ltv", money(period.ltv90));

    setText("#dd-kpi-spend", money(period.spend));
    setText("#dd-kpi-mer", formatMer(mer));
    setText("#dd-kpi-mer-eq", money(period.netSales) + " ÷ " + money(period.spend));
    setText("#dd-goals-act-sales", money(period.netSales));
    setText("#dd-goals-act-roas", formatMer(mer));

    renderYoy();

    $$("[data-dd-period]").forEach(function (btn) {
      var on = btn.getAttribute("data-dd-period") === state.period;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });

    var live = $("#dd-live");
    if (live) {
      live.textContent =
        SHOP +
        " sample · " +
        period.label +
        " sales " +
        money(period.netSales) +
        " · optional Total ROAS " +
        formatMer(mer) +
        " · BE " +
        formatMer(be);
    }
  }

  function showSection(key) {
    var known = {
      overview: true,
      orders: true,
      customers: true,
      spend: true,
      goals: true,
      settings: true,
    };
    if (!known[key]) key = "overview";
    state.section = key;
    $$("[data-dd-section]").forEach(function (sec) {
      var on = sec.getAttribute("data-dd-section") === key;
      if (on) {
        sec.hidden = false;
        sec.removeAttribute("hidden");
      } else {
        sec.hidden = true;
        sec.setAttribute("hidden", "");
      }
    });
    $$("[data-dd-nav]").forEach(function (b) {
      var on = b.getAttribute("data-dd-nav") === key;
      if (on) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
    var title = $(".dd-topbar__title");
    var def = $(".dd-topbar__def");
    var labels = {
      overview: ["Overview", "This month / quarter / year vs last year · YoY year board · spend optional"],
      orders: ["Orders", "Typical order · weekends · from Shopify"],
      customers: ["Customers", "Returning dollars · LTV 30/90/365 · days-to-second"],
      spend: ["Spend", "Optional · type a day or paste CSV · Total ROAS · mix · CPA"],
      goals: ["Goals", "Native monthly sales targets · spend optional"],
      settings: ["Settings", "Sample data · Live is parked · $39/mo"],
    };
    var copy = labels[key] || labels.overview;
    if (title) title.textContent = copy[0];
    if (def) def.textContent = copy[1];
  }

  function kpiDrawer(key, trigger) {
    var period = PERIODS[state.period] || PERIODS.mtd;
    var mer = merOf(period.netSales, period.spend);
    if (key === "sales") {
      openDrawer(
        "Total Sales",
        "<p class=\"dd-drawer__value\">" +
          money(period.netSales) +
          "</p><p>Shopify Total Sales after returns for " +
          period.label +
          ". Last year " +
          money(period.priorSales) +
          ". SAMPLE Snowdevil.</p>",
        trigger,
      );
      return;
    }
    if (key === "typical") {
      openDrawer(
        "Typical order",
        "<p class=\"dd-drawer__value\">" +
          money(period.typicalOrder) +
          "</p><p>Median ticket on Orders. " +
          formatInt(period.orders) +
          " orders this window. Spend is optional.</p>",
        trigger,
      );
      return;
    }
    if (key === "returning") {
      openDrawer(
        "Returning dollars",
        "<p class=\"dd-drawer__value\">" +
          money(period.returningSales) +
          "</p><p>Returning buyers this window. New buyers " +
          formatInt(period.newCustomers) +
          ". Optional Total ROAS " +
          formatMer(mer) +
          " when spend is on file.</p>",
        trigger,
      );
      return;
    }
    if (key === "weekend") {
      openDrawer(
        "Weekend mix",
        "<p class=\"dd-drawer__value\">" +
          Math.round(period.weekendShare * 100) +
          "%</p><p>Saturday–Sunday share of this window on Orders. Not a Reports Group-by you add up. SAMPLE Snowdevil.</p>",
        trigger,
      );
    }
  }

  function bind() {
    $$("[data-dd-nav]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showSection(btn.getAttribute("data-dd-nav"));
      });
    });
    $$("[data-dd-period]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-dd-period");
        if (PERIODS[id]) {
          state.period = id;
          render();
        }
      });
    });
    $$("[data-dd-kpi]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        kpiDrawer(btn.getAttribute("data-dd-kpi"), btn);
      });
    });
    var close = $("#dd-drawer-close");
    if (close) close.addEventListener("click", closeDrawer);
    var backdrop = $("#dd-drawer-backdrop");
    if (backdrop) backdrop.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && state.drawerOpen) closeDrawer();
    });
  }

  function init() {
    if (!$("#dd-desk")) return;
    bind();
    showSection("overview");
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
