/**
 * Mcfly SAMPLE desk — Snowdevil, illustrative snowboard orders.
 * Not a live store. One window: Sep 1–25, 2026.
 * Total ROAS = our net sales ÷ spend you type. Empty spend is an em dash.
 * No pixels, no MTA, no view-through, no channel ROAS, no ad logins.
 */
(function () {
  "use strict";

  var DEFAULT_TARGET = 4;
  var DEFAULT_MARGIN = 0.35;
  var AS_OF_SHORT = "Sep 25";
  var SHOP = "Snowdevil";
  var COVERAGE = 0.92;
  var RECON_PCT = 0.028;

  /**
   * One SAMPLE window for the whole Overview.
   * Gap lines are timing, tax, discounts, channels, B2B/draft and sum to
   * Shopify sales report − our net sales ($82,410 − $75,940 = $6,470).
   */
  var PERIODS = {
    window: {
      id: "window",
      label: "Sep 1–25",
      asOf: "Sep 1–25, 2026",
      netSales: 75940,
      grossSales: 82410,
      priorSales: 67620,
      priorGross: 73410,
      gapLines: [1840, 2160, 1120, 860, 490],
      shopifyAov: 595,
      spend: 21100,
      eomProjectedMer: 3.6,
      priorMer: 3.48,
      priorSpend: 19800,
      orders: 128,
      newCustomers: 46,
      returning: 82,
      daysElapsed: 25,
      daysInPeriod: 30,
      ltvAov30: 640,
      ltvAov90: 710,
      repeatRate30: 0.22,
      channels: [
        { id: "meta", label: "Meta", spend: 10128, badge: "hold" },
        { id: "google", label: "Google", spend: 8018, badge: "hold" },
        { id: "email", label: "Email", spend: 1266, badge: "hold" },
        { id: "other", label: "Other", spend: 1688, badge: "hold" },
      ],
      alloc: "Spend is optional on this window.",
      allocWhy: "Orders stand without a spend file.",
      decisionLead: "Orders are in. Spend is still empty.",
      decisionWhy: "Sep 1–25, 2026. Add spend when you need the comparison.",
      shiftProtect: "Meta",
      shiftProtectWhy: "Sample mix only.",
      shiftHold: "Google · Email",
      shiftHoldWhy: "Sample mix only.",
      shiftCut: "—",
      shiftCutWhy: "No channel ROAS on this desk.",
      monthPlanSales: 91200,
    },
  };

  var state = {
    period: "window",
    section: "orders",
    margin: DEFAULT_MARGIN,
    targetMer: DEFAULT_TARGET,
    goalSaved: DEFAULT_TARGET,
    spendTouched: false,
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

  /** Named gap lines. They are stored so they sum to the gap exactly. */
  function gapAmounts(period) {
    var lines = period.gapLines;
    if (lines && lines.length === 5) return lines.slice();
    var gap = period.grossSales - period.netSales;
    return [gap, 0, 0, 0, 0];
  }

  function amountFields() {
    return $$("[data-dd-spend-amount]");
  }

  function pasteFields() {
    return $$("[data-dd-spend-rows]");
  }

  function parsePaste(box) {
    if (!box || !box.value.trim()) return null;
    var total = 0;
    var days = 0;
    box.value.split(/\n/).forEach(function (line) {
      line = line.trim();
      if (!line || /^date\b/i.test(line)) return;
      var parts = line.split(/[,\t]/);
      var amount = Number(String(parts[parts.length - 1]).replace(/[$,]/g, "").trim());
      if (amount > 0) {
        total += amount;
        days += 1;
      }
    });
    if (!(total > 0)) return null;
    return { total: total, days: days };
  }

  function sumPastedRows() {
    var boxes = pasteFields();
    var i;
    for (i = 0; i < boxes.length; i++) {
      if (document.activeElement === boxes[i]) {
        var active = parsePaste(boxes[i]);
        if (active) return active;
      }
    }
    for (i = 0; i < boxes.length; i++) {
      var parsed = parsePaste(boxes[i]);
      if (parsed) return parsed;
    }
    return null;
  }

  function readAmountRaw() {
    var fields = amountFields();
    var i;
    for (i = 0; i < fields.length; i++) {
      if (document.activeElement === fields[i]) return fields[i].value;
    }
    return fields.length ? fields[0].value : "";
  }

  function readEnteredSpend() {
    var pasted = sumPastedRows();
    if (pasted && pasted.total > 0) {
      amountFields().forEach(function (input) {
        if (document.activeElement !== input) {
          input.value = String(Math.round(pasted.total));
        }
      });
      return {
        spend: pasted.total,
        note: "Our net sales divided by the rows you pasted.",
      };
    }
    var raw = String(readAmountRaw()).trim().replace(/[$,\s]/g, "");
    if (raw === "") {
      return { spend: null, note: "Add spend when you need the comparison." };
    }
    var n = Number(raw);
    if (!(n > 0) || !Number.isFinite(n)) {
      return { spend: null, note: "Add spend when you need the comparison." };
    }
    return {
      spend: n,
      note: "Our net sales divided by the spend you typed.",
    };
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
    if (target == null) {
      return { lead: "No target saved.", tone: "flat" };
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
    if (!(spend > 0) || state.targetMer == null) return null;
    return spend * state.targetMer - sales;
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
    var period = PERIODS[state.period] || PERIODS.window;
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
        '<p class="dd-drawer__foot">SAMPLE — illustrative, not a live client. Shopify sales divided by spend you type.</p>';
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
    var period = PERIODS[state.period] || PERIODS.window;
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

    var mer = merOf(period.netSales, state.enteredSpend);
    var vs =
      mer != null && state.targetMer != null ? mer - state.targetMer : null;
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

    setText("#dd-goals-plan-sales", money(planSales));
    setText("#dd-goals-act-sales", money(period.netSales));
    setText(
      "#dd-goals-pace-sales",
      pace.salesProgressPct >= pace.calendarProgressPct ? "On track" : "Behind",
    );
    setText("#dd-goals-plan-spend", money(planSpend));
    setText(
      "#dd-goals-act-spend",
      state.enteredSpend != null ? money(state.enteredSpend) : "—",
    );
    setText(
      "#dd-goals-pace-spend",
      state.enteredSpend == null
        ? "—"
        : state.enteredSpend <= planSpend
          ? "Inside plan"
          : "Over plan",
    );
    setText("#dd-goals-plan-roas", formatMer(planRoas));
    setText("#dd-goals-act-roas", formatMer(mer));
    setText(
      "#dd-goals-pace-roas",
      state.targetMer == null
        ? "—"
        : mer != null && mer >= state.targetMer
          ? "Cleared"
          : "Short",
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
    setText(
      "#dd-goal-saved",
      state.goalSaved == null
        ? "No target saved."
        : "Saved target " + formatMer(state.goalSaved) + ". SAMPLE.",
    );
    var marginInput = $("#dd-settings-margin-range");
    if (marginInput && Number(marginInput.value) !== Math.round(state.margin * 100)) {
      marginInput.value = String(Math.round(state.margin * 100));
    }
    var targetInput = $("#dd-settings-target-range");
    if (targetInput && state.targetMer != null) {
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

  function render() {
    var period = PERIODS[state.period] || PERIODS.window;
    var be = breakEven(state.margin);
    var entered = readEnteredSpend(period);
    var spend = entered.spend;
    state.enteredSpend = spend;
    var mer = merOf(period.netSales, spend);
    var beGap = mer != null && be != null ? mer - be : null;
    var vsTarget =
      mer != null && state.targetMer != null ? mer - state.targetMer : null;
    var verdict = verdictCopy(mer, be, state.targetMer);
    var aov = period.shopifyAov != null ? period.shopifyAov : null;

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

    setText("#dd-kpi-spend", spend != null ? money(spend) : "—");
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
    setText("#dd-two-window", period.asOf);
    setText("#dd-recon-checked", "Checked");
    setText("#dd-two-report", money(period.grossSales));
    setText("#dd-two-net", money(period.netSales));
    setText(
      "#dd-two-net-prior",
      period.priorSales != null
        ? "Same days last year " + money(period.priorSales)
        : "",
    );
    setText(
      "#dd-two-report-prior",
      period.priorGross != null
        ? "Same days last year " + money(period.priorGross)
        : "",
    );
    var gap = period.grossSales - period.netSales;
    setText("#dd-two-gap", money(gap));
    var lines = gapAmounts(period);
    setText("#dd-gap-timing", money(lines[0]));
    setText("#dd-gap-tax", money(lines[1]));
    setText("#dd-gap-discounts", money(lines[2]));
    setText("#dd-gap-channels", money(lines[3]));
    setText("#dd-gap-b2b", money(lines[4]));
    var lineSum = lines.reduce(function (sum, n) { return sum + n; }, 0);
    setText("#dd-gap-sum", money(lineSum));
    setText("#dd-fig-discounts", money(lines[2]));
    var refunds = Math.round(period.grossSales * 0.031);
    setText("#dd-fig-refunds", money(refunds));
    setText(
      "#dd-fig-refund-rate",
      period.grossSales > 0 ? ((refunds / period.grossSales) * 100).toFixed(1) + "%" : "—",
    );
    setText("#dd-fig-restock", money(Math.round(refunds * 0.4)));
    var mix = "—";
    if (period.orders > 0) {
      mix =
        "New " +
        Math.round((period.newCustomers / period.orders) * 100) +
        "% · Returning " +
        Math.round((period.returning / period.orders) * 100) +
        "%";
    }
    setText("#dd-fig-mix", mix);
    setText("#dd-cust-new", formatInt(period.newCustomers));
    setText("#dd-cust-returning", formatInt(period.returning));
    setText("#dd-two-spend", spend != null ? money(spend) : "—");
    setText("#dd-two-roas", formatMer(mer));
    setText("#dd-orders-roas", formatMer(mer));
    setText("#dd-spend-roas", formatMer(mer));
    setText("#dd-orders-roas-note", entered.note);
    setText("#dd-spend-roas-note", entered.note);

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
        (spend != null ? money(spend) : "—") +
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
        "SAMPLE. " +
        SHOP +
        ". " +
        period.asOf +
        ". Net sales " +
        money(period.netSales) +
        " beside the Shopify sales-report total " +
        money(period.grossSales) +
        ".";
    }
  }

  function showSection(key, scroll) {
    if (key === "overview") key = "orders";
    var ids = {
      orders: "dd-sec-orders",
      spend: "dd-sec-spend",
      goals: "dd-sec-goals",
      customers: "dd-sec-customers",
      settings: "dd-sec-settings",
    };
    if (!ids[key]) key = "orders";
    state.section = key;
    $$("[data-dd-section]").forEach(function (sec) {
      sec.hidden = false;
      sec.removeAttribute("hidden");
    });
    $$("[data-dd-nav]").forEach(function (b) {
      var on = b.getAttribute("data-dd-nav") === key;
      if (on) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
    var live = $("#dd-live");
    if (live) {
      live.textContent = "Showing " + key + " · SAMPLE desk";
    }
    if (scroll) {
      var sec = document.getElementById(ids[key]);
      if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function bindPeriods() {
    $$("[data-dd-period]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-dd-period");
        if (!PERIODS[id]) return;
        state.period = id;
        state.spendTouched = false;
        var rows = $("#dd-spend-rows");
        if (rows) rows.value = "";
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
      state.goalSaved = state.targetMer;
      var goal = $("#dd-goal-target");
      if (goal && document.activeElement !== goal) {
        goal.value = state.targetMer.toFixed(1);
      }
      render();
    });
  }

  function bindSpendEntry() {
    amountFields().forEach(function (input) {
      input.addEventListener("input", function () {
        state.spendTouched = true;
        pasteFields().forEach(function (box) {
          box.value = "";
        });
        amountFields().forEach(function (other) {
          if (other !== input) other.value = input.value;
        });
        render();
      });
    });
    pasteFields().forEach(function (box) {
      box.addEventListener("input", function () {
        state.spendTouched = true;
        pasteFields().forEach(function (other) {
          if (other !== box) other.value = box.value;
        });
        render();
      });
    });
  }

  function bindGoalSave() {
    var button = $("#dd-goal-save");
    var input = $("#dd-goal-target");
    if (!button || !input) return;
    button.addEventListener("click", function () {
      var raw = input.value.trim();
      var n = Number(raw);
      if (raw === "" || !(n > 0) || !Number.isFinite(n)) {
        state.goalSaved = null;
        state.targetMer = null;
      } else {
        state.goalSaved = n;
        state.targetMer = n;
      }
      render();
    });
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
          toast("SAMPLE desk — no upload. In app: paste CSV or combine platform files.");
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
        showSection(key, true);
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
    bindSettingsTarget();
    bindSpendEntry();
    bindGoalSave();
    bindSpendDemo();
    bindNav();
    bindKpiDrills();
    bindClaimExpand();
    bindDrawerChrome();
    markNav();
    showSection("orders", false);
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
