/**
 * Mcfly sample Total ROAS desk — Northline Supply (Jul 2026).
 * Demo data only. Loud SAMPLE labeling. No pixels / MTA / path credit.
 */
(function () {
  "use strict";

  var TARGET_MER = 4;
  var DEFAULT_MARGIN = 0.35;
  var AS_OF_SHORT = "Jul 27";
  var SHOP = "Northline Supply";
  var COVERAGE = 0.92;
  var RECON_PCT = 0.028;
  var CLAIMED_MER = 4.8;

  /**
   * Coherent DTC sample periods. Action Total ROAS = net sales ÷ spend.
   * Gross shown as secondary (Ads Manager–comparable) only.
   * Compact metrics + pacing days are till-safe SAMPLE numbers.
   */
  var PERIODS = {
    l7d: {
      id: "l7d",
      label: "Last 7d",
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
        { id: "meta", label: "Meta", spend: 13200, badge: "hold" },
        { id: "google", label: "Google", spend: 7800, badge: "shift" },
        { id: "microsoft", label: "Microsoft", spend: 1980, badge: "hold" },
        { id: "email", label: "Email", spend: 1200, badge: "hold" },
      ],
      alloc: "Hold Meta · step-test −10% Google",
      allocWhy:
        "Illustrative only — average channel Total ROAS ≠ marginal. A small Google cut tests whether cash holds while Meta carries the week.",
      decisionLead: "Above break-even; short of target.",
      decisionWhy:
        "Last 7 days cleared break-even with room to protect Meta. Step-test Google before chasing the 4.00× target.",
    },
    mtd: {
      id: "mtd",
      label: "MTD",
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
        { id: "meta", label: "Meta", spend: 51200, badge: "hold" },
        { id: "google", label: "Google", spend: 32800, badge: "shift" },
        { id: "microsoft", label: "Microsoft", spend: 8900, badge: "hold" },
        { id: "email", label: "Email", spend: 5600, badge: "hold" },
      ],
      alloc: "Hold Meta · step-test −10% Google",
      allocWhy:
        "Illustrative recommendation from cash efficiency vs break-even — not path credit. Average ≠ marginal ROAS.",
      decisionLead: "Above target on net sales ÷ spend.",
      decisionWhy:
        "MTD Total ROAS clears the 4.00× target and break-even. Protect Meta; step-test a −10% Google cut to learn marginal response.",
    },
    qtd: {
      id: "qtd",
      label: "QTD",
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
        { id: "meta", label: "Meta", spend: 148800, badge: "hold" },
        { id: "google", label: "Google", spend: 112600, badge: "shift" },
        { id: "microsoft", label: "Microsoft", spend: 31200, badge: "hold" },
        { id: "email", label: "Email", spend: 19800, badge: "hold" },
      ],
      alloc: "Hold Meta · step-test −10% Google",
      allocWhy:
        "Quarter mix shows Google softer vs cash break-even. Illustrative step-test — average channel Total ROAS is not marginal.",
      decisionLead: "Above break-even; below target.",
      decisionWhy:
        "QTD clears break-even with headroom, but sits under the 4.00× target. Hold Meta; step-test Google before a larger reallocation.",
    },
    ytd: {
      id: "ytd",
      label: "YTD",
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
        { id: "meta", label: "Meta", spend: 324000, badge: "hold" },
        { id: "google", label: "Google", spend: 248500, badge: "shift" },
        { id: "microsoft", label: "Microsoft", spend: 68500, badge: "hold" },
        { id: "email", label: "Email", spend: 41500, badge: "hold" },
      ],
      alloc: "Hold Meta · step-test −10% Google",
      allocWhy:
        "Year-to-date cash picture favors protecting Meta. Any Google cut is a learning step-test — not attributed path credit.",
      decisionLead: "Near target on year-to-date cash.",
      decisionWhy:
        "YTD Total ROAS sits just under the 4.00× target while clearing break-even. Keep Meta steady; step-test Google.",
    },
  };

  var state = {
    period: "mtd",
    margin: DEFAULT_MARGIN,
    drawerOpen: false,
    drawerKind: null,
    drawerId: null,
  };

  var drawerFocusReturn = null;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function money(n) {
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
    if (badge === "shift") return "Step-test";
    if (badge === "cut") return "Cut";
    return badge;
  }

  function badgeMeaning(badge) {
    if (badge === "hold") {
      return "Hold means keep this line steady while cash clears break-even / target. Not a platform ROAS endorsement.";
    }
    if (badge === "shift") {
      return "Step-test means an illustrative small cut to learn response. Average channel Total ROAS ≠ marginal.";
    }
    if (badge === "cut") {
      return "Cut means freeze or reduce until the till recovers above break-even. Cash first.";
    }
    return "Illustrative badge only — average ≠ marginal.";
  }

  function channelNextAction(ch) {
    if (ch.badge === "shift") {
      return (
        "Step-test about −10% on " +
        ch.label +
        ". Watch till Total ROAS for a few closed days — not Ads Manager."
      );
    }
    if (ch.badge === "cut") {
      return (
        "Freeze " +
        ch.label +
        " spend until cash MER clears break-even. Reallocate only after the till moves."
      );
    }
    return (
      "Protect " +
      ch.label +
      ". Don’t chase platform claims — hold spend while cash stays above break-even."
    );
  }

  function kpiNextAction(key, mer, be) {
    if (key === "mer") {
      if (mer == null || be == null) return "Enter sales and spend to read the till.";
      if (mer < be) return "Protect cash — cut or freeze soft channels until MER clears break-even.";
      if (mer < TARGET_MER) {
        return "Above break-even. Hold winners; step-test weaker share before chasing 4.00×.";
      }
      return "Above target. Protect the mix; only scale inside safe-spend headroom.";
    }
    if (key === "sales") {
      return "Use net for Total ROAS. Gross is only for Ads Manager comparison — never for the Monday call.";
    }
    if (key === "spend") {
      return "In product: pick platforms → download a blank template → Sheets Import → paste on Spend. Free CSV always works.";
    }
    if (key === "eom") {
      if (mer != null && mer >= TARGET_MER) {
        return "On pace for the 4.00× rail. Scale only inside headroom; don’t invent path credit.";
      }
      return "Below the 4.00× rail on current pace. Reallocate or cut before month close.";
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
      lead: "Above target on net sales ÷ spend.",
      tone: "up",
    };
  }

  /** Pacing: sales vs calendar toward target MER on projected spend. */
  function computePace(period, mer) {
    var daysElapsed = period.daysElapsed;
    var daysInPeriod = period.daysInPeriod;
    var remainingDays = Math.max(0, daysInPeriod - daysElapsed);
    var avgDailySales = daysElapsed > 0 ? period.netSales / daysElapsed : 0;
    var avgDailySpend = daysElapsed > 0 ? period.spend / daysElapsed : 0;
    var projSpend = period.spend + avgDailySpend * remainingDays;
    var targetPeriodSales = TARGET_MER > 0 ? projSpend * TARGET_MER : 0;
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
        : mer != null && mer >= TARGET_MER * 0.85
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
    };
  }

  /** Headroom to BE = spend still addable before MER hits break-even. */
  function headroomToBe(sales, spend, be) {
    if (!(be > 0) || !(sales > 0)) return null;
    return sales / be - spend;
  }

  /** Gap to target = net sales still needed at current spend to hit TARGET_MER. */
  function gapToTarget(sales, spend) {
    if (!(spend > 0)) return null;
    return spend * TARGET_MER - sales;
  }

  function renderChannels(period) {
    var host = $("#dd-channels");
    if (!host) return;
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
        "dd-channel__badge dd-channel__badge--" +
        (ch.badge === "shift" ? "shift" : ch.badge === "cut" ? "cut" : "hold");
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
        '<p class="dd-drawer__kicker">Cash MER · SAMPLE</p>' +
        '<p class="dd-drawer__value">' +
        formatMer(mer) +
        "</p>" +
        blockHtml(
          "Formula",
          "<strong>Net Shopify sales ÷ ad spend</strong> for the selected window. Not platform ROAS.",
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
                "% margin"
              : ""),
        ) +
        nextHtml(kpiNextAction("mer", mer, be)) +
        '<p class="dd-drawer__foot">SAMPLE Northline Supply — till math only.</p>';
    } else if (key === "sales") {
      title = "Net sales";
      html =
        '<p class="dd-drawer__kicker">Shopify till · SAMPLE</p>' +
        '<p class="dd-drawer__value">' +
        money(period.netSales) +
        "</p>" +
        blockHtml(
          "Formula role",
          "Net sales are the numerator in Total ROAS. Gross (" +
            money(period.grossSales) +
            ") is secondary for Ads Manager comparison only.",
        ) +
        blockHtml("Period window", "<strong>" + period.label + "</strong> · " + period.asOf) +
        blockHtml("Prior delta", deltaMoneyText(period.netSales, period.priorSales)) +
        nextHtml(kpiNextAction("sales", mer, be)) +
        '<p class="dd-drawer__foot">Refunds and discounts already reflected in net.</p>';
    } else if (key === "spend") {
      title = "Ad spend";
      html =
        '<p class="dd-drawer__kicker">Paste-first · SAMPLE</p>' +
        '<p class="dd-drawer__value">' +
        money(period.spend) +
        "</p>" +
        blockHtml(
          "Formula role",
          "Ad spend is the denominator. Same window as net sales — no path credit, no view-through.",
        ) +
        blockHtml("Period window", "<strong>" + period.label + "</strong> · " + period.asOf) +
        blockHtml("Prior delta", deltaMoneyText(period.spend, period.priorSpend)) +
        nextHtml(kpiNextAction("spend", mer, be)) +
        '<p class="dd-drawer__foot">Optional SyncWith / Coupler / Supermetrics fill the same template — you pay them.</p>';
    } else if (key === "eom") {
      title = "EOM projected MER";
      html =
        '<p class="dd-drawer__kicker">Pace · SAMPLE</p>' +
        '<p class="dd-drawer__value">' +
        formatMer(period.eomProjectedMer) +
        "</p>" +
        blockHtml(
          "Formula",
          "Illustrative end-of-month MER if current daily sales and spend pace continue. Target rail <strong>" +
            formatMer(TARGET_MER) +
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
          "MTD MER " +
            formatMer(mer) +
            " · EOM proj. " +
            formatMer(period.eomProjectedMer) +
            (mer != null
              ? " · " +
                (mer - TARGET_MER >= 0 ? "+" : "") +
                formatMer(mer - TARGET_MER) +
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
    var badgeCls =
      ch.badge === "shift" ? "shift" : ch.badge === "cut" ? "cut" : "hold";
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

  function flash(sel) {
    var el = $(sel);
    if (!el) return;
    el.style.opacity = "0.55";
    requestAnimationFrame(function () {
      el.style.opacity = "1";
    });
  }

  function renderPace(period, mer) {
    var pace = computePace(period, mer);
    setText(
      "#dd-pace-period",
      period.label + " · target " + formatMer(TARGET_MER) + " · SAMPLE",
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

  function renderGoals(period, be) {
    var headroom = headroomToBe(period.netSales, period.spend, be);
    var gap = gapToTarget(period.netSales, period.spend);

    if (headroom == null) {
      setText("#dd-goals-headroom", "—");
      setText("#dd-goals-headroom-hint", "Need margin to compute break-even");
    } else if (headroom >= 0) {
      setText("#dd-goals-headroom", money(Math.round(headroom)));
      setText(
        "#dd-goals-headroom-hint",
        "Spend you can still add before break-even " + formatMer(be),
      );
    } else {
      setText("#dd-goals-headroom", money(Math.round(Math.abs(headroom))) + " over");
      setText(
        "#dd-goals-headroom-hint",
        "Spend above break-even capacity — protect cash",
      );
    }

    if (gap == null) {
      setText("#dd-goals-gap", "—");
      setText("#dd-goals-gap-hint", "Need spend to compute target gap");
    } else if (gap <= 0) {
      setText("#dd-goals-gap", "Cleared · " + money(Math.round(Math.abs(gap))));
      setText(
        "#dd-goals-gap-hint",
        "Above " + formatMer(TARGET_MER) + " at this spend · SAMPLE",
      );
    } else {
      setText("#dd-goals-gap", money(Math.round(gap)));
      setText(
        "#dd-goals-gap-hint",
        "Sales dollars to clear " + formatMer(TARGET_MER) + " at this spend",
      );
    }
  }

  function render() {
    var period = PERIODS[state.period] || PERIODS.mtd;
    var be = breakEven(state.margin);
    var mer = merOf(period.netSales, period.spend);
    var beGap = mer != null && be != null ? mer - be : null;
    var vsTarget = mer != null ? mer - TARGET_MER : null;
    var verdict = verdictCopy(mer, be, TARGET_MER);
    var aov =
      period.orders > 0 ? Math.round(period.netSales / period.orders) : null;
    var claimed = period.claimedMer != null ? period.claimedMer : CLAIMED_MER;

    var decisionLead = verdict.lead;
    if (mer != null && be != null && Math.abs(state.margin - DEFAULT_MARGIN) < 0.001) {
      decisionLead = period.decisionLead;
    }

    setText("#dd-asof", period.asOf);
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

    setText("#dd-claim-lie", "~" + claimed.toFixed(1) + "×");
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
      "Gross " + money(period.grossSales) + " · Ads Manager–comparable",
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
    setText("#dd-kpi-eom-label", "EOM projected MER");
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
      "Action Total ROAS uses net sales. Gross " +
        money(period.grossSales) +
        " is secondary for Ads Manager comparison — not path credit.",
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
        ". Lock this Monday close after exceptions are clear — illustrative only.",
    );

    renderPace(period, mer);
    renderGoals(period, be);
    renderChannels(period);

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
        render();
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
    var input = $("#dd-margin-range");
    if (!input) return;
    input.addEventListener("input", function () {
      state.margin = Number(input.value) / 100;
      render();
    });
  }

  function bindNav() {
    var map = {
      overview: "#dd-sec-overview",
      mix: "#dd-sec-mix",
      explorer: "#dd-sec-explorer",
      close: "#dd-sec-close",
    };
    $$("[data-dd-nav]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-dd-nav");
        var sel = map[key];
        if (!sel) return;
        $$("[data-dd-nav]").forEach(function (b) {
          b.setAttribute("aria-current", b === btn ? "true" : "false");
        });
        var target = $(sel);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
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

  function boot() {
    if (!$("#dd-desk")) return;
    bindPeriods();
    bindMargin();
    bindNav();
    bindKpiDrills();
    bindClaimExpand();
    bindDrawerChrome();
    markNav();
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
