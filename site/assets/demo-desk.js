/**
 * Mcfly sample Total ROAS desk — Northline Supply (Jul 2026).
 * Demo data only. Loud SAMPLE labeling. No pixels / MTA / path credit.
 */
(function () {
  "use strict";

  var DEFAULT_TARGET = 4;
  var DEFAULT_MARGIN = 0.35;
  var AS_OF_SHORT = "Jul 27";
  var SHOP = "Northline Supply";
  var COVERAGE = 0.92;
  var RECON_PCT = 0.028;
  var CLAIMED_MER = 4.8;

  /**
   * Coherent DTC sample periods. Total ROAS = sales after returns ÷ spend.
   * Gross shown as secondary (Ads Manager–comparable) only.
   * Compact metrics + pacing days are SAMPLE numbers only.
   */
  var PERIODS = {
    l7d: {
      id: "l7d",
      label: "Last 7 days",
      startIso: "2026-07-21",
      asOf: "Jul 21–27, 2026",
      netSales: 86420,
      grossSales: 97850,
      spend: 24180,
      eomProjectedMer: 3.92,
      priorMer: 3.55,
      priorSales: 79800,
      priorSpend: 23600,
      orders: 942,
      newCustomers: 611,
      returning: 331,
      daysElapsed: 7,
      daysInPeriod: 7,
      claimedMer: 4.9,
      ltvAov30: 118,
      ltvAov90: 142,
      repeatRate30: 0.18,
      channels: [
        { id: "meta", label: "Meta", spend: 13200, badge: "protect" },
        { id: "google", label: "Google", spend: 7800, badge: "cut" },
        { id: "microsoft", label: "Microsoft", spend: 1980, badge: "hold" },
        { id: "email", label: "Email", spend: 1200, badge: "hold" },
      ],
      alloc: "Protect Meta · step-test −10% Google",
      allocWhy:
        "Illustrative only — average channel Total ROAS ≠ marginal. A small Google cut tests whether cash holds while Meta carries the week.",
      decisionLead: "Above break-even; short of target.",
      decisionWhy:
        "Last 7 days cleared break-even with room to protect Meta. Step-test Google before chasing the target rail.",
      shiftProtect: "Meta",
      shiftProtectWhy: "Carry the week while cash clears break-even.",
      shiftHold: "Microsoft · Email",
      shiftHoldWhy: "Steady lines — don’t chase platform claims.",
      shiftCut: "Google −10%",
      shiftCutWhy: "Learn marginal response. Average ≠ marginal.",
      monthPlanSales: 120000,
    },
    mtd: {
      id: "mtd",
      label: "This month",
      startIso: "2026-07-01",
      asOf: "Jul 1–27, 2026",
      netSales: 412400,
      grossSales: 468200,
      spend: 98500,
      eomProjectedMer: 4.28,
      priorMer: 3.91,
      priorSales: 378200,
      priorSpend: 96800,
      orders: 4480,
      newCustomers: 2860,
      returning: 1620,
      daysElapsed: 27,
      daysInPeriod: 31,
      claimedMer: 4.8,
      ltvAov30: 124,
      ltvAov90: 151,
      repeatRate30: 0.21,
      channels: [
        { id: "meta", label: "Meta", spend: 51200, badge: "protect" },
        { id: "google", label: "Google", spend: 32800, badge: "cut" },
        { id: "microsoft", label: "Microsoft", spend: 8900, badge: "hold" },
        { id: "email", label: "Email", spend: 5600, badge: "hold" },
      ],
      alloc: "Protect Meta · step-test −10% Google",
      allocWhy:
        "Illustrative recommendation from cash efficiency vs break-even — not path credit. Average ≠ marginal. Allocate to grow.",
      decisionLead: "Above target on sales after returns ÷ spend.",
      decisionWhy:
        "MTD Total ROAS clears the target rail and break-even. Protect Meta; step-test a −10% Google cut to learn marginal response.",
      shiftProtect: "Meta",
      shiftProtectWhy: "Carry the month while cash clears target.",
      shiftHold: "Microsoft · Email",
      shiftHoldWhy: "Steady lines — don’t chase platform claims.",
      shiftCut: "Google −10%",
      shiftCutWhy: "Learn marginal response. Average ≠ marginal.",
      monthPlanSales: 465000,
    },
    qtd: {
      id: "qtd",
      label: "This quarter",
      startIso: "2026-04-01",
      asOf: "Apr 1–Jul 27, 2026",
      netSales: 1185200,
      grossSales: 1346800,
      spend: 312400,
      eomProjectedMer: 3.95,
      priorMer: 3.62,
      priorSales: 1098400,
      priorSpend: 303200,
      orders: 12840,
      newCustomers: 7920,
      returning: 4920,
      daysElapsed: 118,
      daysInPeriod: 122,
      claimedMer: 4.7,
      ltvAov30: 121,
      ltvAov90: 148,
      repeatRate30: 0.2,
      channels: [
        { id: "meta", label: "Meta", spend: 148800, badge: "protect" },
        { id: "google", label: "Google", spend: 112600, badge: "cut" },
        { id: "microsoft", label: "Microsoft", spend: 31200, badge: "hold" },
        { id: "email", label: "Email", spend: 19800, badge: "hold" },
      ],
      alloc: "Protect Meta · step-test −10% Google",
      allocWhy:
        "Quarter mix shows Google softer vs cash break-even. Illustrative step-test — average channel Total ROAS is not marginal.",
      decisionLead: "Above break-even; below target.",
      decisionWhy:
        "QTD clears break-even with headroom, but sits under the target rail. Protect Meta; step-test Google before a larger reallocation.",
      shiftProtect: "Meta",
      shiftProtectWhy: "Protect the cash-efficient line into quarter close.",
      shiftHold: "Microsoft · Email",
      shiftHoldWhy: "Steady lines — don’t chase platform claims.",
      shiftCut: "Google −10%",
      shiftCutWhy: "Soft vs break-even — step-test before a larger cut.",
      monthPlanSales: 465000,
    },
    ytd: {
      id: "ytd",
      label: "This year",
      startIso: "2026-01-01",
      asOf: "Jan 1–Jul 27, 2026",
      netSales: 2640800,
      grossSales: 2996400,
      spend: 682500,
      eomProjectedMer: 4.02,
      priorMer: 3.74,
      priorSales: 2412600,
      priorSpend: 645800,
      orders: 28650,
      newCustomers: 17420,
      returning: 11230,
      daysElapsed: 208,
      daysInPeriod: 365,
      claimedMer: 4.85,
      ltvAov30: 126,
      ltvAov90: 155,
      repeatRate30: 0.22,
      channels: [
        { id: "meta", label: "Meta", spend: 324000, badge: "protect" },
        { id: "google", label: "Google", spend: 248500, badge: "cut" },
        { id: "microsoft", label: "Microsoft", spend: 68500, badge: "hold" },
        { id: "email", label: "Email", spend: 41500, badge: "hold" },
      ],
      alloc: "Protect Meta · step-test −10% Google",
      allocWhy:
        "Year-to-date cash picture favors protecting Meta. Any Google cut is a learning step-test — not attributed path credit.",
      decisionLead: "Near target on year-to-date cash.",
      decisionWhy:
        "YTD Total ROAS sits near the target rail while clearing break-even. Keep Meta protected; step-test Google.",
      shiftProtect: "Meta",
      shiftProtectWhy: "YTD cash favors protecting this line.",
      shiftHold: "Microsoft · Email",
      shiftHoldWhy: "Steady lines — don’t chase platform claims.",
      shiftCut: "Google −10%",
      shiftCutWhy: "Learning cut — average ≠ marginal.",
      monthPlanSales: 465000,
    },
    lm: {
      id: "lm",
      label: "Last month",
      asOf: "Jun 1–30, 2026",
      startIso: "2026-06-01",
      netSales: 378200,
      grossSales: null,
      spend: 96800,
      eomProjectedMer: null,
      priorMer: null,
      priorSales: null,
      priorSpend: null,
      orders: null,
      newCustomers: null,
      returning: null,
      daysElapsed: 30,
      daysInPeriod: 30,
      claimedMer: null,
      ltvAov30: null,
      ltvAov90: null,
      repeatRate30: null,
      channels: null,
      alloc: "Channel split is not stored for last month.",
      allocWhy: "Last month is the stored prior sales and spend line only.",
      decisionLead: "Last month is the stored prior line.",
      decisionWhy: "Order counts and channel split are not stored on this prior line.",
      shiftProtect: "—",
      shiftProtectWhy: "Not stored for last month.",
      shiftHold: "—",
      shiftHoldWhy: "Not stored for last month.",
      shiftCut: "—",
      shiftCutWhy: "Not stored for last month.",
      monthPlanSales: null,
    },
    l12m: {
      id: "l12m",
      label: "Last 12 months",
      asOf: "No stored 12-month total",
      startIso: null,
      netSales: null,
      grossSales: null,
      spend: null,
      eomProjectedMer: null,
      priorMer: null,
      priorSales: null,
      priorSpend: null,
      orders: null,
      newCustomers: null,
      returning: null,
      daysElapsed: 0,
      daysInPeriod: 0,
      claimedMer: null,
      ltvAov30: null,
      ltvAov90: null,
      repeatRate30: null,
      channels: null,
      alloc: "No 12-month total is stored.",
      allocWhy: "Last 12 months has no stored sales or spend on this SAMPLE book.",
      decisionLead: "No 12-month total is stored.",
      decisionWhy: "This SAMPLE book does not keep a last-12-months sales total.",
      shiftProtect: "—",
      shiftProtectWhy: "Not stored.",
      shiftHold: "—",
      shiftHoldWhy: "Not stored.",
      shiftCut: "—",
      shiftCutWhy: "Not stored.",
      monthPlanSales: null,
    },
  };

  var state = {
    period: "mtd",
    section: "overview",
    margin: DEFAULT_MARGIN,
    targetMer: DEFAULT_TARGET,
    drawerOpen: false,
    drawerKind: null,
    drawerId: null,
    selectedDay: null,
    ledgerFilter: "all",
    userGoal: null,
    typedSpend: [],
    typedNext: 1,
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

  function formatPct(n) {
    if (n == null || !Number.isFinite(n)) return "—";
    return Math.round(n * 100) + "%";
  }

  function formatInt(n) {
    if (n == null || !Number.isFinite(n)) return "—";
    return n.toLocaleString("en-US");
  }

  function merOf(sales, spend) {
    if (!(spend > 0) || !Number.isFinite(sales)) return null;
    var m = sales / spend;
    return Number.isFinite(m) ? m : null;
  }

  function breakEven(margin) {
    if (!(margin > 0) || !Number.isFinite(margin)) return null;
    return 1 / margin;
  }

  function deltaClass(curr, prior) {
    if (curr == null || prior == null || !Number.isFinite(curr) || !Number.isFinite(prior)) {
      return "flat";
    }
    var d = curr - prior;
    if (Math.abs(d) < 0.02) return "flat";
    return d > 0 ? "up" : "down";
  }

  function deltaMerText(curr, prior) {
    if (curr == null || prior == null) return "vs prior window";
    var d = curr - prior;
    var sign = d > 0 ? "+" : "";
    var cls = deltaClass(curr, prior);
    var word = cls === "up" ? "vs prior" : cls === "down" ? "vs prior" : "flat vs prior";
    return sign + formatMer(d) + " " + word;
  }

  function deltaMoneyText(curr, prior, label) {
    if (curr == null || prior == null) return label || "";
    var d = curr - prior;
    var sign = d > 0 ? "+" : "";
    return sign + money(d) + " vs prior";
  }

  function badgeLabel(badge) {
    if (badge === "hold") return "Hold";
    if (badge === "protect") return "Protect";
    if (badge === "shift") return "Step-test";
    if (badge === "cut") return "Cut";
    return badge;
  }

  function badgeMeaning(badge) {
    if (badge === "hold") {
      return "Hold means keep this line steady while cash clears break-even / target. Not a platform ROAS endorsement.";
    }
    if (badge === "protect") {
      return "Protect means keep spend on this cash-efficient line while you grow. Not path credit.";
    }
    if (badge === "shift") {
      return "Step-test means an illustrative small cut to learn response. Average channel Total ROAS ≠ marginal.";
    }
    if (badge === "cut") {
      return "Cut / step-test means reduce to learn marginal response or protect cash. Average ≠ marginal.";
    }
    return "Illustrative badge only — average ≠ marginal.";
  }

  function badgeClass(badge) {
    if (badge === "protect") return "protect";
    if (badge === "shift" || badge === "cut") return "cut";
    return "hold";
  }

  function channelNextAction(ch) {
    if (ch.badge === "shift" || ch.badge === "cut") {
      return (
        "Step-test about −10% on " +
        ch.label +
        ". Watch cash Total ROAS for a few closed days — not Ads Manager."
      );
    }
    if (ch.badge === "protect") {
      return (
        "Protect " +
        ch.label +
        ". Scale only inside safe-spend headroom — cash Total ROAS, not platform claims."
      );
    }
    return (
      "Hold " +
      ch.label +
      ". Don’t chase platform claims — keep spend steady while cash stays above break-even."
    );
  }

  function kpiNextAction(key, mer, be) {
    var target = state.targetMer;
    if (key === "mer") {
      if (mer == null || be == null) return "Enter sales and spend to see sales ÷ spend.";
      if (mer < be) {
        return "Protect cash — cut or freeze soft channels until Total ROAS clears break-even.";
      }
      if (mer < target) {
        return (
          "Above break-even. Protect winners; step-test weaker share before chasing " +
          formatMer(target) +
          "."
        );
      }
      return "Above target. Protect the mix; only scale inside safe-spend headroom.";
    }
    if (key === "sales") {
      return "Use Total Sales for Total ROAS. Order totals are only for Ads Manager comparison — never for the Monday call.";
    }
    if (key === "spend") {
      return "In product: pick platforms → download a blank template → Sheets Import → paste on Spend. Free CSV always works.";
    }
    if (key === "eom") {
      if (mer != null && mer >= target) {
        return (
          "On pace for the " +
          formatMer(target) +
          " rail. Scale only inside headroom; don’t invent path credit."
        );
      }
      return (
        "Below the " +
        formatMer(target) +
        " rail on current pace. Reallocate or cut before month close."
      );
    }
    return "Cash language only — sales ÷ spend.";
  }

  function verdictCopy(mer, be, target) {
    if (mer == null || be == null) {
      return { lead: "Need sales and spend.", tone: "flat" };
    }
    if (mer < be) {
      return {
        lead: "Below break-even — protect cash.",
        tone: "down",
      };
    }
    if (mer < target) {
      return {
        lead: "Above break-even; short of target.",
        tone: "flat",
      };
    }
    return {
      lead: "Above target on sales after returns ÷ spend.",
      tone: "up",
    };
  }

  /** Pacing: sales vs calendar toward target Total ROAS on projected spend. */
  function computePace(period, mer) {
    var target = state.targetMer;
    var daysElapsed = period.daysElapsed;
    var daysInPeriod = period.daysInPeriod;
    var remainingDays = Math.max(0, daysInPeriod - daysElapsed);
    var avgDailySales = daysElapsed > 0 ? period.netSales / daysElapsed : 0;
    var avgDailySpend = daysElapsed > 0 ? period.spend / daysElapsed : 0;
    var projSpend = period.spend + avgDailySpend * remainingDays;
    var targetPeriodSales = target > 0 ? projSpend * target : 0;
    var remainingSalesNeeded = Math.max(0, targetPeriodSales - period.netSales);
    var dailySalesNeeded =
      remainingDays > 0 ? remainingSalesNeeded / remainingDays : 0;
    var calendarProgressPct =
      daysInPeriod > 0
        ? Math.min(100, (daysElapsed / daysInPeriod) * 100)
        : 0;
    var salesProgressPct =
      targetPeriodSales > 0
        ? Math.min(100, (period.netSales / targetPeriodSales) * 100)
        : 0;
    var progressCls =
      salesProgressPct >= calendarProgressPct
        ? "good"
        : mer != null && mer >= target * 0.85
          ? "warn"
          : "bad";
    return {
      daysElapsed: daysElapsed,
      daysInPeriod: daysInPeriod,
      remainingDays: remainingDays,
      avgDailySales: avgDailySales,
      dailySalesNeeded: dailySalesNeeded,
      salesProgressPct: salesProgressPct,
      calendarProgressPct: calendarProgressPct,
      progressCls: progressCls,
      targetPeriodSales: targetPeriodSales,
      projSpend: projSpend,
    };
  }

  /** Headroom to BE = spend still addable before Total ROAS hits break-even. */
  function headroomToBe(sales, spend, be) {
    if (!(be > 0) || !(sales > 0)) return null;
    return sales / be - spend;
  }

  /** Gap to target = sales after returns still needed at current spend to hit target. */
  function gapToTarget(sales, spend) {
    if (!(spend > 0)) return null;
    return spend * state.targetMer - sales;
  }

  function renderChannels(period) {
    var host = $("#dd-channels");
    if (!host) return;
    if (!period.channels || !period.channels.length || !(period.spend > 0)) {
      host.textContent = "Channel split is not stored for this window.";
      return;
    }
    var maxSpend = Math.max.apply(
      null,
      period.channels.map(function (c) {
        return c.spend;
      }),
    );
    host.replaceChildren();
    period.channels.forEach(function (ch, i) {
      var share = Math.round((ch.spend / period.spend) * 100);
      var row = document.createElement("button");
      row.type = "button";
      row.className = "dd-channel";
      row.setAttribute("data-dd-channel", ch.id);
      row.setAttribute("aria-haspopup", "dialog");
      row.setAttribute(
        "aria-label",
        ch.label +
          ", " +
          money(ch.spend) +
          ", " +
          share +
          "% of spend, " +
          badgeLabel(ch.badge) +
          ". Open detail.",
      );
      if (
        state.drawerOpen &&
        state.drawerKind === "channel" &&
        state.drawerId === ch.id
      ) {
        row.classList.add("is-open");
      }

      var name = document.createElement("span");
      name.className = "dd-channel__name";
      name.appendChild(document.createTextNode(ch.label + " "));
      var badge = document.createElement("span");
      badge.className =
        "dd-channel__badge dd-channel__badge--" + badgeClass(ch.badge);
      badge.textContent = badgeLabel(ch.badge);
      name.appendChild(badge);

      var track = document.createElement("span");
      track.className = "dd-channel__track";
      track.setAttribute("aria-hidden", "true");
      var fill = document.createElement("span");
      fill.className = "dd-channel__fill dd-channel__fill--" + ch.id;
      fill.style.width = "0%";
      fill.style.animationDelay = i * 40 + "ms";
      track.appendChild(fill);

      var meta = document.createElement("span");
      meta.className = "dd-channel__meta";
      meta.innerHTML =
        money(ch.spend) +
        "<small>" +
        share +
        "% of spend</small>";

      row.appendChild(name);
      row.appendChild(track);
      row.appendChild(meta);
      row.addEventListener("click", function () {
        openChannelDrawer(ch.id);
      });
      host.appendChild(row);

      requestAnimationFrame(function () {
        fill.style.width = Math.max(4, (ch.spend / maxSpend) * 100) + "%";
      });
    });
  }

  function drawerEls() {
    return {
      backdrop: $("#dd-drawer-backdrop"),
      drawer: $("#dd-drawer"),
      title: $("#dd-drawer-title"),
      body: $("#dd-drawer-body"),
      close: $("#dd-drawer-close"),
    };
  }

  function getFocusable(root) {
    if (!root) return [];
    return $$("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])", root).filter(
      function (el) {
        return !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true";
      },
    );
  }

  function markDrillOpen() {
    $$("[data-dd-kpi]").forEach(function (el) {
      el.classList.toggle(
        "is-open",
        state.drawerOpen &&
          state.drawerKind === "kpi" &&
          el.getAttribute("data-dd-kpi") === state.drawerId,
      );
    });
    $$("[data-dd-channel]").forEach(function (el) {
      el.classList.toggle(
        "is-open",
        state.drawerOpen &&
          state.drawerKind === "channel" &&
          el.getAttribute("data-dd-channel") === state.drawerId,
      );
    });
  }

  function closeDrawer() {
    var els = drawerEls();
    if (!els.drawer || els.drawer.hidden) {
      state.drawerOpen = false;
      state.drawerKind = null;
      state.drawerId = null;
      markDrillOpen();
      return;
    }
    els.drawer.hidden = true;
    if (els.backdrop) {
      els.backdrop.hidden = true;
      els.backdrop.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("dd-drawer-open");
    state.drawerOpen = false;
    state.drawerKind = null;
    state.drawerId = null;
    markDrillOpen();
    if (drawerFocusReturn && typeof drawerFocusReturn.focus === "function") {
      drawerFocusReturn.focus();
    }
    drawerFocusReturn = null;
  }

  function openDrawer(title, html, kind, id, trigger) {
    var els = drawerEls();
    if (!els.drawer || !els.body || !els.title) return;
    drawerFocusReturn = trigger || document.activeElement;
    state.drawerOpen = true;
    state.drawerKind = kind;
    state.drawerId = id;
    els.title.textContent = title;
    els.body.innerHTML = html;
    els.drawer.hidden = false;
    if (els.backdrop) {
      els.backdrop.hidden = false;
      els.backdrop.setAttribute("aria-hidden", "false");
    }
    document.body.classList.add("dd-drawer-open");
    markDrillOpen();
    var focusables = getFocusable(els.drawer);
    var focusTarget = els.close || focusables[0] || els.drawer;
    requestAnimationFrame(function () {
      focusTarget.focus();
    });
  }

  function blockHtml(label, valueHtml) {
    return (
      '<div class="dd-drawer__block"><dl><dt>' +
      label +
      "</dt><dd>" +
      valueHtml +
      "</dd></dl></div>"
    );
  }

  function nextHtml(text) {
    return (
      '<div class="dd-drawer__next">' +
      '<p class="dd-drawer__next-kicker">What to do next</p>' +
      "<p>" +
      text +
      "</p></div>"
    );
  }

  function openKpiDrawer(key, trigger) {
    var period = PERIODS[state.period] || PERIODS.mtd;
    var be = breakEven(state.margin);
    var mer = merOf(period.netSales, period.spend);
    var html = "";
    var title = "Detail";

    if (key === "mer") {
      title = "Total ROAS";
      html =
        '<p class="dd-drawer__kicker">Transparent ROAS · SAMPLE</p>' +
        '<p class="dd-drawer__value">' +
        formatMer(mer) +
        "</p>" +
        blockHtml(
          "Formula",
          "<strong>Total Sales ÷ ad spend</strong> for the selected window. Not platform ROAS.",
        ) +
        blockHtml(
          "Period window",
          "<strong>" +
            period.label +
            "</strong> · " +
            period.asOf +
            "<br />" +
            money(period.netSales) +
            " ÷ " +
            money(period.spend) +
            " = " +
            formatMer(mer),
        ) +
        blockHtml(
          "Prior delta",
          deltaMerText(mer, period.priorMer) +
            (be != null
              ? " · Break-even " +
                formatMer(be) +
                " at " +
                Math.round(state.margin * 100) +
                "% profit margin"
              : ""),
        ) +
        nextHtml(kpiNextAction("mer", mer, be)) +
        '<p class="dd-drawer__foot">SAMPLE Northline Supply — sales ÷ spend only.</p>';
    } else if (key === "sales") {
      title = "Total Sales";
      html =
        '<p class="dd-drawer__kicker">Total Sales · SAMPLE</p>' +
        '<p class="dd-drawer__value">' +
        money(period.netSales) +
        "</p>" +
        blockHtml(
          "Formula role",
          "Total Sales are the numerator in Total ROAS — what you actually kept. Order totals (" +
            money(period.grossSales) +
            ") are secondary for Ads Manager comparison only.",
        ) +
        blockHtml("Period window", "<strong>" + period.label + "</strong> · " + period.asOf) +
        blockHtml("Prior delta", deltaMoneyText(period.netSales, period.priorSales)) +
        nextHtml(kpiNextAction("sales", mer, be)) +
        '<p class="dd-drawer__foot">Returns already accounted for — not ignored.</p>';
    } else if (key === "spend") {
      title = "Ad spend";
      html =
        '<p class="dd-drawer__kicker">Paste-first · SAMPLE</p>' +
        '<p class="dd-drawer__value">' +
        money(period.spend) +
        "</p>" +
        blockHtml(
          "Formula role",
          "Ad spend is the denominator. Same window as Total Sales — no path credit, no view-through.",
        ) +
        blockHtml("Period window", "<strong>" + period.label + "</strong> · " + period.asOf) +
        blockHtml("Prior delta", deltaMoneyText(period.spend, period.priorSpend)) +
        nextHtml(kpiNextAction("spend", mer, be)) +
        '<p class="dd-drawer__foot">Optional SyncWith / Coupler / Supermetrics fill the same template — you pay them.</p>';
    } else if (key === "eom") {
      title = "EOM projected Total ROAS";
      html =
        '<p class="dd-drawer__kicker">Pace · SAMPLE</p>' +
        '<p class="dd-drawer__value">' +
        formatMer(period.eomProjectedMer) +
        "</p>" +
        blockHtml(
          "Formula",
          "Illustrative end-of-month Total ROAS if current daily sales and spend pace continue. Target rail <strong>" +
            formatMer(state.targetMer) +
            "</strong>.",
        ) +
        blockHtml(
          "Period window",
          "<strong>" +
            period.label +
            "</strong> · " +
            period.daysElapsed +
            " / " +
            period.daysInPeriod +
            " days · as-of " +
            AS_OF_SHORT,
        ) +
        blockHtml(
          "Prior / vs target",
          "Period Total ROAS " +
            formatMer(mer) +
            " · EOM proj. " +
            formatMer(period.eomProjectedMer) +
            (mer != null
              ? " · " +
                (mer - state.targetMer >= 0 ? "+" : "") +
                formatMer(mer - state.targetMer) +
                " vs target"
              : ""),
        ) +
        nextHtml(kpiNextAction("eom", mer, be)) +
        '<p class="dd-drawer__foot">Projection is cash pace — not attributed ROAS.</p>';
    } else {
      return;
    }

    openDrawer(title, html, "kpi", key, trigger);
  }

  function openChannelDrawer(channelId, trigger) {
    var period = PERIODS[state.period] || PERIODS.mtd;
    var ch = null;
    for (var i = 0; i < period.channels.length; i++) {
      if (period.channels[i].id === channelId) {
        ch = period.channels[i];
        break;
      }
    }
    if (!ch) return;
    var share = Math.round((ch.spend / period.spend) * 100);
    var badgeCls = badgeClass(ch.badge);
    var html =
      '<p class="dd-drawer__kicker">' +
      period.label +
      " · SAMPLE</p>" +
      '<p class="dd-drawer__value">' +
      money(ch.spend) +
      "</p>" +
      blockHtml(
        "Spend share",
        "<strong>" +
          share +
          "%</strong> of " +
          money(period.spend) +
          " total ad spend in this window.",
      ) +
      blockHtml(
        "Badge",
        '<span class="dd-drawer__badge dd-drawer__badge--' +
          badgeCls +
          '">' +
          badgeLabel(ch.badge) +
          "</span><br />" +
          badgeMeaning(ch.badge),
      ) +
      nextHtml(channelNextAction(ch)) +
      '<p class="dd-drawer__foot">Illustrative only — average channel Total ROAS ≠ marginal.</p>';

    var triggerEl =
      trigger ||
      $('[data-dd-channel="' + channelId + '"]');
    openDrawer(ch.label, html, "channel", ch.id, triggerEl);
  }

  function setText(sel, text) {
    var el = $(sel);
    if (el) el.textContent = text;
  }

  function setHtml(sel, html) {
    var el = $(sel);
    if (el) el.innerHTML = html;
  }

  function setDelta(sel, text, cls) {
    var el = $(sel);
    if (!el) return;
    el.textContent = text;
    el.className = "dd-kpi__delta dd-kpi__delta--" + cls;
  }

  function flash() {}

  function renderPace(period, mer) {
    if (period.netSales == null || !(period.daysElapsed > 0)) {
      setText("#dd-pace-period", period.label + " · SAMPLE");
      setText("#dd-pace-days", "—");
      setText("#dd-pace-avg", "—");
      setText("#dd-pace-need", "—");
      setText("#dd-pace-sales-pct", "—");
      setText("#dd-pace-cal-pct", "—");
      var emptySales = $("#dd-pace-sales-fill");
      var emptyCal = $("#dd-pace-cal-fill");
      if (emptySales) emptySales.style.width = "0%";
      if (emptyCal) emptyCal.style.width = "0%";
      return;
    }
    var pace = computePace(period, mer);
    setText(
      "#dd-pace-period",
      period.label + " · target " + formatMer(state.targetMer) + " · SAMPLE",
    );
    setText(
      "#dd-pace-days",
      pace.daysElapsed + " / " + pace.daysInPeriod + " days",
    );
    setText("#dd-pace-avg", money(Math.round(pace.avgDailySales)));
    setText(
      "#dd-pace-need",
      pace.remainingDays > 0
        ? money(Math.round(pace.dailySalesNeeded))
        : "Period complete",
    );
    setText("#dd-pace-sales-pct", Math.round(pace.salesProgressPct) + "%");
    setText("#dd-pace-cal-pct", Math.round(pace.calendarProgressPct) + "%");

    var salesFill = $("#dd-pace-sales-fill");
    if (salesFill) {
      salesFill.style.width = Math.round(pace.salesProgressPct) + "%";
      salesFill.className =
        "dd-pace__fill dd-pace__fill--" + pace.progressCls;
    }
    var calFill = $("#dd-pace-cal-fill");
    if (calFill) {
      calFill.style.width = Math.round(pace.calendarProgressPct) + "%";
    }
  }

  function setHeadroomGap(prefix, period, be) {
    var headroom = headroomToBe(period.netSales, period.spend, be);
    var gap = gapToTarget(period.netSales, period.spend);
    var headSel = prefix === "tab" ? "#dd-goals-tab-headroom" : "#dd-goals-headroom";
    var headHint =
      prefix === "tab" ? "#dd-goals-tab-headroom-hint" : "#dd-goals-headroom-hint";
    var gapSel = prefix === "tab" ? "#dd-goals-tab-gap" : "#dd-goals-gap";
    var gapHint = prefix === "tab" ? "#dd-goals-tab-gap-hint" : "#dd-goals-gap-hint";

    if (headroom == null) {
      setText(headSel, "—");
      setText(headHint, "Need margin to compute break-even");
    } else if (headroom >= 0) {
      setText(headSel, money(Math.round(headroom)));
      setText(
        headHint,
        "Spend you can still add before break-even " + formatMer(be),
      );
    } else {
      setText(headSel, money(Math.round(Math.abs(headroom))) + " over");
      setText(headHint, "Spend above break-even capacity — protect cash");
    }

    if (gap == null) {
      setText(gapSel, "—");
      setText(gapHint, "Need spend to compute target gap");
    } else if (gap <= 0) {
      setText(gapSel, "Cleared · " + money(Math.round(Math.abs(gap))));
      setText(
        gapHint,
        "Above " + formatMer(state.targetMer) + " at this spend · SAMPLE",
      );
    } else {
      setText(gapSel, money(Math.round(gap)));
      setText(
        gapHint,
        "Sales dollars to clear " + formatMer(state.targetMer) + " at this spend",
      );
    }
  }

  function renderGoals(period, be) {
    setHeadroomGap("overview", period, be);
    setHeadroomGap("tab", period, be);

    var mer = merOf(period.netSales, period.spend);
    var vs = mer != null ? mer - state.targetMer : null;
    var pace = computePace(period, mer);
    var planSales = period.monthPlanSales || Math.round(pace.targetPeriodSales);
    var planSpend = Math.round(pace.projSpend);
    var planRoas = state.targetMer;

    setText("#dd-goals-target", formatMer(state.targetMer));
    setText(
      "#dd-goals-vs",
      vs == null ? "—" : (vs >= 0 ? "+" : "") + formatMer(vs),
    );
    setText(
      "#dd-goals-vs-hint",
      vs == null
        ? "Need sales and spend"
        : vs >= 0
          ? "Above " + formatMer(state.targetMer) + " at this spend"
          : "Below " + formatMer(state.targetMer) + " — reallocate or grow sales",
    );
    setText("#dd-goals-be", formatMer(be));
    setText(
      "#dd-goals-be-hint",
      "At " + Math.round(state.margin * 100) + "% profit margin",
    );

    if (period.netSales == null) {
      setText("#dd-goals-plan-sales", "—");
      setText("#dd-goals-act-sales", "—");
      setText("#dd-goals-pace-sales", "—");
      setText("#dd-goals-plan-spend", "—");
      setText("#dd-goals-act-spend", "—");
      setText("#dd-goals-pace-spend", "—");
      setText("#dd-goals-plan-roas", formatMer(planRoas));
      setText("#dd-goals-act-roas", "—");
      setText("#dd-goals-pace-roas", "—");
      return;
    }

    setText("#dd-goals-plan-sales", money(planSales));
    setText("#dd-goals-act-sales", money(period.netSales));
    setText(
      "#dd-goals-pace-sales",
      pace.salesProgressPct >= pace.calendarProgressPct ? "On track" : "Behind",
    );
    setText("#dd-goals-plan-spend", money(planSpend));
    setText("#dd-goals-act-spend", money(period.spend));
    setText(
      "#dd-goals-pace-spend",
      period.spend <= planSpend ? "Inside plan" : "Over plan",
    );
    setText("#dd-goals-plan-roas", formatMer(planRoas));
    setText("#dd-goals-act-roas", formatMer(mer));
    setText(
      "#dd-goals-pace-roas",
      mer != null && mer >= state.targetMer ? "Cleared" : "Short",
    );
  }

  function renderShifts(period) {
    setText("#dd-shift-protect-ch", period.shiftProtect || "Meta");
    setText(
      "#dd-shift-protect-why",
      period.shiftProtectWhy || "Carry the week while cash clears target.",
    );
    setText("#dd-shift-hold-ch", period.shiftHold || "Microsoft · Email");
    setText(
      "#dd-shift-hold-why",
      period.shiftHoldWhy || "Steady lines — don’t chase platform claims.",
    );
    setText("#dd-shift-cut-ch", period.shiftCut || "Google −10%");
    setText(
      "#dd-shift-cut-why",
      period.shiftCutWhy || "Learn marginal response. Average ≠ marginal.",
    );
  }

  function renderSettings() {
    var be = breakEven(state.margin);
    setText("#dd-settings-margin-value", Math.round(state.margin * 100) + "%");
    setText("#dd-settings-margin-be", "Break-even ≈ " + formatMer(be));
    setText("#dd-settings-target-value", formatMer(state.targetMer));
    var marginInput = $("#dd-settings-margin-range");
    if (marginInput && Number(marginInput.value) !== Math.round(state.margin * 100)) {
      marginInput.value = String(Math.round(state.margin * 100));
    }
    var targetInput = $("#dd-settings-target-range");
    if (targetInput) {
      var tenths = Math.round(state.targetMer * 10);
      if (Number(targetInput.value) !== tenths) {
        targetInput.value = String(tenths);
      }
    }
    var overviewMargin = $("#dd-margin-range");
    if (overviewMargin && Number(overviewMargin.value) !== Math.round(state.margin * 100)) {
      overviewMargin.value = String(Math.round(state.margin * 100));
    }
  }

  function renderSpendCoverage(period) {
    var filled = Math.max(
      1,
      Math.round(period.daysElapsed * COVERAGE),
    );
    setText("#dd-spend-cov-pct", Math.round(COVERAGE * 100) + "%");
    setText(
      "#dd-spend-cov-note",
      filled +
        " of " +
        period.daysElapsed +
        " " +
        period.label +
        " days filled · recon ±" +
        (RECON_PCT * 100).toFixed(1) +
        "% · SAMPLE",
    );
    var fill = $("#dd-spend-cov-fill");
    if (fill) fill.style.width = Math.round(COVERAGE * 100) + "%";
  }


  function addDays(iso, days) {
    var parts = iso.split("-");
    var date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
    date.setUTCDate(date.getUTCDate() + days);
    return date;
  }

  function isoOf(date) {
    var y = date.getUTCFullYear();
    var m = String(date.getUTCMonth() + 1).padStart(2, "0");
    var d = String(date.getUTCDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function shapeDays(total, startIso, count) {
    var weights = [];
    var weightSum = 0;
    var i;
    for (i = 0; i < count; i += 1) {
      var dow = addDays(startIso, i).getUTCDay();
      var weekend = dow === 0 || dow === 6 ? 0.74 : 1;
      var wave = 0.9 + 0.18 * Math.sin(i / 3.1);
      var weight = weekend * wave;
      weights.push(weight);
      weightSum += weight;
    }
    var amounts = [];
    var used = 0;
    for (i = 0; i < count; i += 1) {
      var amount = i === count - 1 ? total - used : Math.round((total * weights[i]) / weightSum);
      if (amount < 0) amount = 0;
      amounts.push(amount);
      used += amount;
    }
    return amounts;
  }

  function shapedSeries(period) {
    if (period.netSales == null || !period.startIso || !(period.daysElapsed > 0)) return [];
    var amounts = shapeDays(period.netSales, period.startIso, period.daysElapsed);
    return amounts.map(function (amount, index) {
      var date = addDays(period.startIso, index);
      return {
        iso: isoOf(date),
        amount: amount,
        weekend: date.getUTCDay() === 0 || date.getUTCDay() === 6,
        dow: date.getUTCDay(),
      };
    });
  }

  function renderDayChart() {
    var chart = $("#dd-day-chart");
    var readout = $("#dd-day-readout");
    var caption = $("#dd-day-caption");
    if (chart) chart.replaceChildren();
    if (caption) caption.textContent = "A day file is not stored on this SAMPLE book.";
    if (readout) readout.textContent = "";
  }

  function dayReadout(series, iso) {
    var found = null;
    series.forEach(function (day) {
      if (day.iso === iso) found = day;
    });
    if (!found) return "That day is outside this window.";
    return found.iso + " · " + money(found.amount) + " · SAMPLE shape";
  }

  function renderWeekday() {
    var host = $("#dd-weekday");
    if (!host) return;
    host.replaceChildren();
    host.textContent = "A day file is not stored on this SAMPLE book.";
  }

  function renderLedger(period) {
    var channels = $("#dd-ledger-channels");
    var days = $("#dd-ledger-days");
    if (channels) {
      channels.replaceChildren();
      if (!period.channels || !period.channels.length) {
        channels.textContent = "Channel lines are not stored for this window.";
      } else {
        var table = document.createElement("table");
        table.className = "dd-goals-tab__table";
        table.innerHTML = "<thead><tr><th>Channel</th><th>Spend (USD)</th></tr></thead>";
        var body = document.createElement("tbody");
        period.channels.forEach(function (ch) {
          var row = document.createElement("tr");
          row.innerHTML = "<th scope='row'>" + ch.label + "</th><td>" + money(ch.spend) + "</td>";
          body.appendChild(row);
        });
        table.appendChild(body);
        channels.appendChild(table);
      }
    }
    if (!days) return;
    days.replaceChildren();
    days.textContent = "A day file is not stored on this SAMPLE book.";
  }

  function emailSpend(period) {
    if (!period.channels) return null;
    var found = null;
    period.channels.forEach(function (ch) {
      if (ch.id === "email") found = ch.spend;
    });
    return found;
  }

  function renderExtra(period, mer, be, aov) {
    setText("#dd-orders-sales", money(period.netSales));
    setText("#dd-orders-count", formatInt(period.orders));
    setText("#dd-orders-aov", aov != null ? money(aov) : "—");
    setText("#dd-orders-returning", formatInt(period.returning));
    setText("#dd-orders-new", formatInt(period.newCustomers));
    setText(
      "#dd-orders-prior",
      period.priorSales == null
        ? "No prior stored"
        : "vs prior " + money(period.priorSales) + " · " + deltaMoneyText(period.netSales, period.priorSales),
    );
    renderDayChart(period);
    renderWeekday(period);
    setText("#dd-tt2", "Days to a second order are not stored on this SAMPLE book.");
    setText("#dd-weekend", "Weekend share of second orders is not stored on this SAMPLE book.");

    setText("#dd-cust-orders", formatInt(period.orders));
    setText("#dd-cust-new", formatInt(period.newCustomers));
    setText("#dd-cust-returning", formatInt(period.returning));
    setText(
      "#dd-cust-mix",
      period.returning != null && period.orders
        ? formatPct(period.returning / period.orders) + " of orders"
        : "—",
    );

    setText("#dd-growth-repeat", formatPct(period.repeatRate30));
    setText("#dd-growth-30", money(period.ltvAov30));
    setText("#dd-growth-90", money(period.ltvAov90));

    setText("#dd-ltv2-30", money(period.ltvAov30));
    setText("#dd-ltv2-90", money(period.ltvAov90));
    setText("#dd-ltv2-repeat", formatPct(period.repeatRate30));
    var cac =
      period.spend > 0 && period.newCustomers > 0
        ? Math.round(period.spend / period.newCustomers)
        : null;
    setText("#dd-ltv2-cac", cac == null ? "—" : money(cac));

    var priorMer = period.priorMer;
    setText(
      "#dd-compare-sales",
      period.priorSales == null ? "—" : money(period.netSales) + " vs " + money(period.priorSales),
    );
    setText(
      "#dd-compare-spend",
      period.priorSpend == null ? "—" : money(period.spend) + " vs " + money(period.priorSpend),
    );
    setText(
      "#dd-compare-mer",
      priorMer == null || mer == null ? "—" : formatMer(mer) + " vs " + formatMer(priorMer),
    );
    setText(
      "#dd-compare-days",
      period.daysElapsed > 0 ? String(period.daysElapsed) : "—",
    );
    setText(
      "#dd-compare-sales-day",
      period.daysElapsed > 0 && period.netSales != null
        ? money(Math.round(period.netSales / period.daysElapsed))
        : "—",
    );
    setText(
      "#dd-compare-spend-day",
      period.daysElapsed > 0 && period.spend != null
        ? money(Math.round(period.spend / period.daysElapsed))
        : "—",
    );
    setText(
      "#dd-compare-note",
      "Last year is not a stored line on this book. This compare uses the stored prior window only.",
    );

    renderLedger(period);

    setText("#dd-cpa-new", cac == null ? "—" : money(cac));
    setText(
      "#dd-cpa-all",
      period.spend > 0 && period.orders > 0
        ? money(Math.round(period.spend / period.orders))
        : "—",
    );
    setText("#dd-cpa-90", money(period.ltvAov90));
    setText("#dd-cpa-payback", "—");

    setText("#dd-yoy-sales", money(period.netSales));
    setText("#dd-yoy-prior", money(period.priorSales));
    setText("#dd-yoy-spend", money(period.priorSpend));
    setText(
      "#dd-yoy-note",
      "A prior-year total is not stored. The prior line is the previous window, not last year.",
    );

    setText("#dd-honesty-lie", period.claimedMer == null ? "—" : "~" + period.claimedMer.toFixed(1) + "×");
    setText("#dd-honesty-truth", formatMer(mer));
    setText("#dd-email-spend", money(emailSpend(period)));
    setText(
      "#dd-audit-coverage",
      Math.round(COVERAGE * 100) + "%",
    );
    setText("#dd-audit-recon", "±" + (RECON_PCT * 100).toFixed(1) + "%");
    setText("#dd-audit-margin", Math.round(state.margin * 100) + "%");
    setText("#dd-audit-asof", AS_OF_SHORT);
    var contribution =
      period.netSales != null && period.spend != null && state.margin > 0
        ? Math.round(period.netSales * state.margin - period.spend)
        : null;
    setText("#dd-contrib-sales", money(period.netSales));
    setText("#dd-contrib-spend", money(period.spend));
    setText("#dd-contrib", contribution == null ? "—" : money(contribution));
    var returns =
      period.grossSales != null && period.netSales != null
        ? period.grossSales - period.netSales
        : null;
    setText(
      "#dd-orders-returns",
      returns == null
        ? "Returns are not stored for this window."
        : "Order totals minus sales after returns: " + money(returns) + ".",
    );
    var desk = $("#dd-desk");
    if (desk) {
      desk.setAttribute("data-start", period.startIso || "");
      var end = period.startIso && period.daysElapsed > 0 ? isoOf(addDays(period.startIso, period.daysElapsed - 1)) : "";
      desk.setAttribute("data-end", end);
      desk.setAttribute("data-sales", period.netSales == null ? "" : String(period.netSales));
      desk.setAttribute("data-spend", period.spend == null ? "" : String(period.spend));
      desk.setAttribute("data-label", period.label);
      desk.setAttribute("data-channels", JSON.stringify(period.channels || []));
    }
    document.dispatchEvent(new CustomEvent("dd-rendered"));
    void be;
  }

  function render() {
    var period = PERIODS[state.period] || PERIODS.mtd;
    var be = breakEven(state.margin);
    var mer = merOf(period.netSales, period.spend);
    var beGap = mer != null && be != null ? mer - be : null;
    var vsTarget = mer != null ? mer - state.targetMer : null;
    var verdict = verdictCopy(mer, be, state.targetMer);
    var aov =
      period.orders > 0 ? Math.round(period.netSales / period.orders) : null;
    var claimed = period.claimedMer != null ? period.claimedMer : null;

    var decisionLead = verdict.lead;
    if (mer != null && be != null && Math.abs(state.margin - DEFAULT_MARGIN) < 0.001) {
      decisionLead = period.decisionLead;
    }

    setText("#dd-asof", period.asOf);
    setText("#dd-hero-sales", money(period.netSales));
    setText(
      "#dd-hero-window",
      period.asOf ? period.label + " · " + period.asOf : period.label,
    );
    setText(
      "#dd-trust-coverage",
      "Coverage " + Math.round(COVERAGE * 100) + "%",
    );
    setText(
      "#dd-trust-recon",
      "Recon ±" + (RECON_PCT * 100).toFixed(1) + "%",
    );
    setText(
      "#dd-trust-margin",
      "Margin " + Math.round(state.margin * 100) + "% confirmed",
    );
    setText("#dd-trust-asof", "As-of " + AS_OF_SHORT);

    setText("#dd-decision-takeaway", decisionLead);
    setText(
      "#dd-decision-why",
      period.decisionWhy +
        (Math.abs(state.margin - DEFAULT_MARGIN) >= 0.001
          ? " Margin slider set to " +
            Math.round(state.margin * 100) +
            "% → break-even " +
            formatMer(be) +
            "."
          : ""),
    );

    setText("#dd-claim-lie", claimed == null ? "—" : "~" + claimed.toFixed(1) + "×");
    setText("#dd-claim-truth", formatMer(mer));

    setText("#dd-kpi-mer", formatMer(mer));
    setDelta(
      "#dd-kpi-mer-delta",
      deltaMerText(mer, period.priorMer) +
        (beGap != null
          ? " · " +
            (beGap >= 0 ? "+" : "") +
            formatMer(beGap) +
            " vs BE"
          : ""),
      deltaClass(mer, period.priorMer),
    );

    setText("#dd-kpi-sales", money(period.netSales));
    setText(
      "#dd-kpi-sales-sub",
      "Order totals " + money(period.grossSales) + " · Ads Manager–comparable",
    );
    setDelta(
      "#dd-kpi-sales-delta",
      deltaMoneyText(period.netSales, period.priorSales),
      deltaClass(period.netSales, period.priorSales),
    );

    setText("#dd-kpi-spend", money(period.spend));
    setDelta(
      "#dd-kpi-spend-delta",
      deltaMoneyText(period.spend, period.priorSpend),
      "flat",
    );

    setText("#dd-kpi-eom", formatMer(period.eomProjectedMer));
    setText("#dd-kpi-eom-label", "EOM projected Total ROAS");
    setText(
      "#dd-kpi-eom-sub",
      "Target " + formatMer(state.targetMer) + " · SAMPLE",
    );
    setDelta(
      "#dd-kpi-eom-delta",
      (vsTarget != null && vsTarget < 0
        ? "BE gap " + formatMer(beGap)
        : "EOM proj. " + formatMer(period.eomProjectedMer)) +
        (vsTarget != null
          ? " · " + (vsTarget >= 0 ? "+" : "") + formatMer(vsTarget) + " vs target"
          : ""),
      vsTarget != null && vsTarget >= 0
        ? "up"
        : beGap != null && beGap >= 0
          ? "flat"
          : "down",
    );

    setText("#dd-compact-orders", formatInt(period.orders));
    setText("#dd-compact-new", formatInt(period.newCustomers));
    setText("#dd-compact-returning", formatInt(period.returning));
    setText("#dd-compact-aov", aov != null ? money(aov) : "—");

    setText("#dd-ltv-aov30", money(period.ltvAov30));
    setText("#dd-ltv-aov90", money(period.ltvAov90));
    setText("#dd-ltv-repeat", formatPct(period.repeatRate30));

    setText("#dd-eq-me", formatMer(mer));
    var eqMe = $("#dd-eq-me");
    if (eqMe) {
      eqMe.className =
        "dd-eq__me" + (mer != null && be != null && mer >= be ? "" : " dd-eq__me--flat");
    }
    setHtml(
      "#dd-eq-formula",
      '<span class="dd-eq__formula-term">' +
        money(period.netSales) +
        "</span>" +
        '<span class="dd-eq__op">÷</span>' +
        '<span class="dd-eq__formula-term">' +
        money(period.spend) +
        "</span>" +
        '<span class="dd-eq__op">=</span>' +
        "<strong>" +
        formatMer(mer) +
        "</strong>",
    );
    setText(
      "#dd-eq-meta",
      "Total ROAS uses Shopify sales after returns. Order totals " +
        money(period.grossSales) +
        " are secondary for Ads Manager comparison — not path credit.",
    );
    setHtml(
      "#dd-eq-trust",
      "<span>Coverage <strong>" +
        Math.round(COVERAGE * 100) +
        "%</strong></span>" +
        "<span>Recon <strong>±" +
        (RECON_PCT * 100).toFixed(1) +
        "%</strong> OK</span>" +
        "<span>Margin <strong>" +
        Math.round(state.margin * 100) +
        "%</strong> → BE <strong>" +
        formatMer(be) +
        "</strong></span>",
    );

    setText("#dd-alloc-title", period.alloc);
    setText("#dd-alloc-why", period.allocWhy);

    setText("#dd-margin-value", Math.round(state.margin * 100) + "%");
    setText("#dd-margin-be", "Break-even ≈ " + formatMer(be));

    setText(
      "#dd-close-decision",
      "Decision preview: " +
        period.alloc +
        ". Save and export this Monday Close memo after exceptions are clear — illustrative only.",
    );

    renderPace(period, mer);
    renderGoals(period, be);
    renderExtra(period, mer, be, aov);
    renderShifts(period);
    renderChannels(period);
    renderSettings();
    renderSpendCoverage(period);

    flash("#dd-kpi-mer");
    flash("#dd-eq-me");
    flash("#dd-decision-takeaway");
    flash("#dd-claim-truth");
    flash("#dd-compact-orders");

    var live = $("#dd-live");
    if (live) {
      live.textContent =
        SHOP +
        " sample · " +
        period.label +
        " Total ROAS " +
        formatMer(mer) +
        " · BE " +
        formatMer(be);
    }
  }

  function showSection(key) {
    var known = {
      overview: true,
      orders: true,
      spend: true,
      goals: true,
      customers: true,
      growth: true,
      ltv: true,
      mix: true,
      explorer: true,
      compare: true,
      ledger: true,
      cpa: true,
      yoy: true,
      honesty: true,
      email: true,
      close: true,
      audit: true,
      settings: true,
    };
    if (!known[key]) key = "overview";
    state.section = key;
    $$("[data-dd-section]").forEach(function (sec) {
      var id = sec.getAttribute("data-dd-section");
      var on = id === key;
      if (on) {
        sec.hidden = false;
        sec.removeAttribute("hidden");
        sec.inert = false;
      } else {
        sec.hidden = true;
        sec.setAttribute("hidden", "");
        sec.inert = true;
      }
    });
    $$("[data-dd-nav]").forEach(function (b) {
      var on = b.getAttribute("data-dd-nav") === key;
      b.setAttribute("aria-current", on ? "true" : "false");
    });
    var live = $("#dd-live");
    if (live) {
      live.textContent = "Showing " + key + " · SAMPLE desk";
    }
    if (key === "explorer") {
      window.dispatchEvent(new Event("resize"));
    }
  }

  function bindPeriods() {
    $$("[data-dd-period]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-dd-period");
        if (!PERIODS[id]) return;
        state.period = id;
        $$("[data-dd-period]").forEach(function (b) {
          var on = b === btn;
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
        if (state.drawerOpen) closeDrawer();
        state.selectedDay = null;
        render();
        var url = new URL(window.location.href);
        url.searchParams.set("period", id);
        url.searchParams.set("section", state.section);
        history.replaceState(null, "", url);
      });
      btn.addEventListener("keydown", function (ev) {
        if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight") return;
        ev.preventDefault();
        var buttons = $$("[data-dd-period]");
        var idx = buttons.indexOf(btn);
        if (idx < 0) return;
        var next =
          ev.key === "ArrowRight"
            ? buttons[(idx + 1) % buttons.length]
            : buttons[(idx - 1 + buttons.length) % buttons.length];
        next.focus();
        next.click();
      });
    });
  }

  function bindMargin() {
    $$("#dd-margin-range, #dd-settings-margin-range").forEach(function (input) {
      input.addEventListener("input", function () {
        state.margin = Number(input.value) / 100;
        render();
      });
    });
  }

  function bindSettingsTarget() {
    var input = $("#dd-settings-target-range");
    if (!input) return;
    input.addEventListener("input", function () {
      state.targetMer = Number(input.value) / 10;
      render();
    });
  }

  function parseSpendPaste(raw) {
    var names = {
      meta: "Meta",
      google: "Google",
      microsoft: "Microsoft",
      email: "Email",
      tiktok: "TikTok",
      pinterest: "Pinterest",
      snapchat: "Snapchat",
      reddit: "Reddit",
      x: "X",
      linkedin: "LinkedIn",
      amazon: "Amazon",
      apple: "Apple Search",
      impact: "Impact / CJ",
      klaviyo: "Klaviyo / Mailchimp",
      other: "Other",
    };
    var rows = [];
    String(raw)
      .split(/\r?\n/)
      .forEach(function (line) {
        var parts = line.split(",").map(function (part) {
          return part.trim();
        });
        if (parts.length < 3) return;
        if (parts[0].toLowerCase() === "date") return;
        var day = parts[0];
        var amount = Number(parts[2].replace(/[$,]/g, ""));
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !(amount > 0)) return;
        var key = parts[1].toLowerCase();
        rows.push({
          day: day,
          amount: Math.round(amount),
          channel: names[key] || parts[1],
        });
      });
    return rows;
  }

  function bindSpendDemo() {
    $$("[data-dd-platform]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var on = btn.getAttribute("aria-pressed") === "true";
        var next = !on;
        btn.setAttribute("aria-pressed", next ? "true" : "false");
        btn.classList.toggle("is-on", next);
        var selected = $$("[data-dd-platform][aria-pressed='true']").length;
        setText(
          "#dd-spend-chip-hint",
          selected +
            " platform" +
            (selected === 1 ? "" : "s") +
            " selected · SAMPLE",
        );
      });
    });

    function toast(msg) {
      var el = $("#dd-spend-toast");
      if (!el) return;
      el.textContent = msg;
      window.setTimeout(function () {
        if (el.textContent === msg) el.textContent = "";
      }, 3200);
    }

    $$("[data-dd-fake]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var kind = btn.getAttribute("data-dd-fake");
        if (kind === "template") {
          toast("SAMPLE — blank template downloads in the app, not on this page.");
          return;
        }
        if (kind === "sheets") {
          toast("Tip: Sheets Import → fill daily spend → paste in app Spend.");
          var tip = $(".dd-spend__tip");
          if (tip) tip.scrollIntoView({ behavior: "smooth", block: "nearest" });
          return;
        }
        if (kind === "import") {
          var pasted = parseSpendPaste(($("#dd-spend-paste") || {}).value || "");
          if (!pasted.length) {
            toast("Paste date, channel, and amount. This page does not upload a file.");
            return;
          }
          document.dispatchEvent(new CustomEvent("dd-paste-spend", { detail: pasted }));
          toast("Added " + pasted.length + " pasted row" + (pasted.length === 1 ? "" : "s") + " to this SAMPLE desk.");
        }
      });
    });

    var file = $("#dd-spend-file");
    if (file) {
      file.addEventListener("click", function (ev) {
        ev.preventDefault();
        toast("SAMPLE — file pick disabled. Free CSV path lives in the Shopify app.");
      });
    }
  }

  function bindNav() {
    $$("[data-dd-nav]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-dd-nav");
        if (!key) return;
        if (state.drawerOpen) closeDrawer();
        showSection(key);
        var url = new URL(window.location.href);
        url.searchParams.set("section", key);
        url.searchParams.set("period", state.period);
        history.replaceState(null, "", url);
      });
    });
  }

  function bindKpiDrills() {
    $$("[data-dd-kpi]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-dd-kpi");
        if (!key) return;
        if (
          state.drawerOpen &&
          state.drawerKind === "kpi" &&
          state.drawerId === key
        ) {
          closeDrawer();
          return;
        }
        openKpiDrawer(key, btn);
      });
    });
  }

  function bindClaimExpand() {
    var toggle = $("#dd-claim-toggle");
    var panel = $("#dd-claim-why");
    if (!toggle || !panel) return;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function setClaimOpen(next) {
      toggle.setAttribute("aria-expanded", next ? "true" : "false");
      toggle.classList.toggle("is-open", next);
      if (next) {
        panel.hidden = false;
        // Force reflow so the open transition runs after un-hiding.
        void panel.offsetHeight;
        panel.classList.add("is-open");
      } else if (reduceMotion) {
        panel.classList.remove("is-open");
        panel.hidden = true;
      } else {
        panel.classList.remove("is-open");
        var onEnd = function (ev) {
          if (ev.target !== panel || ev.propertyName !== "grid-template-rows") return;
          panel.removeEventListener("transitionend", onEnd);
          if (toggle.getAttribute("aria-expanded") !== "true") {
            panel.hidden = true;
          }
        };
        panel.addEventListener("transitionend", onEnd);
        window.setTimeout(function () {
          panel.removeEventListener("transitionend", onEnd);
          if (toggle.getAttribute("aria-expanded") !== "true") {
            panel.hidden = true;
          }
        }, 280);
      }
    }

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      setClaimOpen(!open);
    });
  }

  function bindDrawerChrome() {
    var els = drawerEls();
    if (els.close) {
      els.close.addEventListener("click", closeDrawer);
    }
    if (els.backdrop) {
      els.backdrop.addEventListener("click", closeDrawer);
    }
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && state.drawerOpen) {
        ev.preventDefault();
        closeDrawer();
        return;
      }
      if (ev.key !== "Tab" || !state.drawerOpen || !els.drawer || els.drawer.hidden) {
        return;
      }
      var focusables = getFocusable(els.drawer);
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    });
  }

  function markNav() {
    $$('[data-nav="demo"]').forEach(function (link) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    });
  }


  function bindDepth() {
    var chart = $("#dd-day-chart");
    if (chart) {
      chart.addEventListener("click", function (ev) {
        var button = ev.target.closest("[data-dd-day]");
        if (!button) return;
        state.selectedDay = button.getAttribute("data-dd-day");
        render();
      });
    }
    function setFilter() {
      setText("#dd-ledger-toast", "A day file is not stored on this SAMPLE book.");
    }
    var all = $("#dd-ledger-all");
    var weekday = $("#dd-ledger-weekday");
    var weekend = $("#dd-ledger-weekend");
    if (all) all.addEventListener("click", function () { setFilter("all"); });
    if (weekday) weekday.addEventListener("click", function () { setFilter("weekday"); });
    if (weekend) weekend.addEventListener("click", function () { setFilter("weekend"); });
    var exp = $("#dd-ledger-export");
    if (exp) {
      exp.addEventListener("click", function () {
        var period = PERIODS[state.period] || PERIODS.mtd;
        if (!period.channels || !period.channels.length) {
          setText("#dd-ledger-toast", "Channel lines are not stored for this window.");
          return;
        }
        var lines = ["channel,spend_usd"];
        period.channels.forEach(function (ch) {
          lines.push(ch.label + "," + ch.spend);
        });
        var blob = new Blob([lines.join("\n")], { type: "text/csv" });
        var link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "northline-sample-channels.csv";
        link.click();
        setText("#dd-ledger-toast", "Exported stored channel spend. A day file is not on this book.");
      });
    }
    var cohort = $("#dd-cohort-csv");
    if (cohort) {
      cohort.addEventListener("click", function () {
        var period = PERIODS[state.period] || PERIODS.mtd;
        var contribution =
          period.netSales != null && period.spend != null && state.margin > 0
            ? Math.round(period.netSales * state.margin - period.spend)
            : "";
        var cac =
          period.spend > 0 && period.newCustomers > 0
            ? Math.round(period.spend / period.newCustomers)
            : "";
        var returns =
          period.grossSales != null && period.netSales != null
            ? period.grossSales - period.netSales
            : "";
        var lines = [
          "field,value",
          "window," + period.label,
          "sales," + (period.netSales == null ? "" : period.netSales),
          "spend," + (period.spend == null ? "" : period.spend),
          "margin_percent," + Math.round(state.margin * 100),
          "sales_x_margin_minus_spend," + contribution,
          "cohort_30d_aov," + (period.ltvAov30 == null ? "" : period.ltvAov30),
          "cohort_90d_aov," + (period.ltvAov90 == null ? "" : period.ltvAov90),
          "repeat_30d," + (period.repeatRate30 == null ? "" : period.repeatRate30),
          "cash_cac," + cac,
          "returns," + returns,
          "days_to_second,",
          "payback_days,",
          "order_keys,",
        ];
        var blob = new Blob([lines.join("\n")], { type: "text/csv" });
        var link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "northline-sample-cohort.csv";
        link.click();
      });
    }
    var pack = $("#dd-ledger-audit");
    if (pack) {
      pack.addEventListener("click", function () {
        setText("#dd-ledger-toast", "SAMPLE audit pack: coverage, recon, and as-of. No upload.");
        showSection("audit");
      });
    }
  }

  function boot() {
    if (!$("#dd-desk")) return;
    bindPeriods();
    bindMargin();
    bindSettingsTarget();
    bindSpendDemo();
    bindNav();
    bindKpiDrills();
    bindClaimExpand();
    bindDrawerChrome();
    markNav();
    bindDepth();
    var params = new URLSearchParams(window.location.search);
    var period = params.get("period");
    var section = params.get("section") || params.get("tab");
    if (section === "roas") section = "overview";
    if (PERIODS[period]) state.period = period;
    showSection(section || "overview");
    render();
    $$("[data-dd-period]").forEach(function (b) {
      var on = b.getAttribute("data-dd-period") === state.period;
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
