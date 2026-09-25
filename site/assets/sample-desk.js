/**
 * SAMPLE desk for mcflyads.com.
 * Northline Supply totals already published on this site.
 * Daily bars are a shape of those totals, not a shop day file.
 * Spend starts empty. A goal says nothing until it is saved.
 */
(function (root) {
  "use strict";

  var WINDOWS = {
    mtd: {
      id: "mtd",
      label: "This month",
      range: "Jul 1–27, 2026",
      start: "2026-07-01",
      end: "2026-07-27",
      sales: 412400,
      priorSales: 378200,
      orders: 4480,
      returning: 1620,
      newCustomers: 2860,
      typicalOrder: 92,
      ltv30: 124,
      ltv90: 151,
      repeat30: 0.21,
      days: 27,
    },
    lm: {
      id: "lm",
      label: "Last month",
      range: "Jun 1–30, 2026",
      start: "2026-06-01",
      end: "2026-06-30",
      sales: 378200,
      priorSales: null,
      orders: null,
      returning: null,
      newCustomers: null,
      typicalOrder: null,
      ltv30: null,
      ltv90: null,
      repeat30: null,
      days: 30,
      ordersNote: "Order counts are not stored on this prior line.",
    },
    qtd: {
      id: "qtd",
      label: "This quarter",
      range: "Apr 1–Jul 27, 2026",
      start: "2026-04-01",
      end: "2026-07-27",
      sales: 1185200,
      priorSales: 1098400,
      orders: 12840,
      returning: 4920,
      newCustomers: 7920,
      typicalOrder: 92,
      ltv30: 121,
      ltv90: 148,
      repeat30: 0.2,
      days: 118,
    },
    ytd: {
      id: "ytd",
      label: "This year",
      range: "Jan 1–Jul 27, 2026",
      start: "2026-01-01",
      end: "2026-07-27",
      sales: 2640800,
      priorSales: 2412600,
      orders: 28650,
      returning: 11230,
      newCustomers: 17420,
      typicalOrder: 92,
      ltv30: 126,
      ltv90: 155,
      repeat30: 0.22,
      days: 208,
    },
    l12m: {
      id: "l12m",
      label: "Last 12 months",
      range: "No stored 12-month total",
      start: null,
      end: null,
      sales: null,
      priorSales: null,
      orders: null,
      returning: null,
      newCustomers: null,
      typicalOrder: null,
      ltv30: null,
      ltv90: null,
      repeat30: null,
      days: 0,
      empty: true,
      ordersNote: "No 12-month total is stored in this SAMPLE book.",
    },
  };

  var PERIODS = ["mtd", "lm", "qtd", "ytd", "l12m"];
  var TABS = ["orders", "spend", "goals", "customers"];
  var CHANNELS = ["Meta", "Google", "Microsoft", "Email"];

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
      var amount =
        i === count - 1
          ? total - used
          : Math.round((total * weights[i]) / weightSum);
      if (amount < 0) amount = 0;
      amounts.push(amount);
      used += amount;
    }
    return amounts;
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

  function money(n) {
    if (n == null || !Number.isFinite(n)) return "—";
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }

  function count(n) {
    if (n == null || !Number.isFinite(n)) return "—";
    return n.toLocaleString("en-US");
  }

  function pct(n) {
    if (n == null || !Number.isFinite(n)) return "—";
    return Math.round(n * 100) + "%";
  }

  function ratio(sales, spend) {
    if (!(spend > 0) || sales == null || !Number.isFinite(sales)) return null;
    return sales / spend;
  }

  function formatRatio(n) {
    if (n == null || !Number.isFinite(n)) return "—";
    var digits = n >= 100 ? 0 : 2;
    return n.toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }) + "×";
  }

  function assertBook() {
    PERIODS.forEach(function (key) {
      var window = WINDOWS[key];
      if (!window.days || window.sales == null) return;
      var bars = shapeDays(window.sales, window.start, window.days);
      var sum = bars.reduce(function (total, value) {
        return total + value;
      }, 0);
      if (sum !== window.sales) {
        throw new Error("SAMPLE chart does not match " + key);
      }
    });
  }

  assertBook();

  if (typeof document === "undefined") {
    root.SAMPLE_DESK = { WINDOWS: WINDOWS, shapeDays: shapeDays };
    return;
  }

  var mount = document.getElementById("sample-desk");
  if (!mount) return;

  var params = new URLSearchParams(window.location.search);
  var initialPeriod = params.get("period");
  var initialTab = params.get("tab");

  var state = {
    period: PERIODS.indexOf(initialPeriod) >= 0 ? initialPeriod : "mtd",
    tab: TABS.indexOf(initialTab) >= 0 ? initialTab : "orders",
    spend: [],
    nextId: 1,
    goal: null,
    selectedDay: null,
    note: "",
  };

  mount.innerHTML = shellHtml();
  var live = mount.querySelector("[data-sd-live]");
  var periodGroup = mount.querySelector("[data-sd-periods]");
  var tabGroup = mount.querySelector("[data-sd-tabs]");
  var panels = {
    orders: mount.querySelector('[data-sd-panel="orders"]'),
    spend: mount.querySelector('[data-sd-panel="spend"]'),
    goals: mount.querySelector('[data-sd-panel="goals"]'),
    customers: mount.querySelector('[data-sd-panel="customers"]'),
  };

  periodGroup.addEventListener("click", function (event) {
    var button = event.target.closest("[data-period]");
    if (!button) return;
    state.period = button.getAttribute("data-period");
    state.selectedDay = null;
    state.note = "";
    paint();
    writeUrl();
  });

  tabGroup.addEventListener("click", function (event) {
    var button = event.target.closest("[data-tab]");
    if (!button) return;
    state.tab = button.getAttribute("data-tab");
    state.note = "";
    paint();
    writeUrl();
  });

  mount.querySelector("[data-sd-quiets]").addEventListener("click", function (event) {
    var button = event.target.closest("[data-quiet]");
    if (!button) return;
    state.note = button.getAttribute("data-quiet");
    paintNote();
  });

  mount.querySelector("[data-sd-chart]").addEventListener("click", function (event) {
    var button = event.target.closest("[data-day]");
    if (!button) return;
    state.selectedDay = button.getAttribute("data-day");
    paintChartSelection();
  });

  var spendForm = mount.querySelector("[data-sd-spend-form]");
  spendForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var channel = spendForm.elements.channel.value;
    var amount = Number(spendForm.elements.amount.value);
    var day = spendForm.elements.day.value;
    var error = mount.querySelector("[data-sd-spend-error]");
    if (!day || !Number.isFinite(amount) || amount <= 0) {
      error.textContent = "Enter a channel, an amount above zero, and a day.";
      return;
    }
    error.textContent = "";
    state.spend.push({
      id: state.nextId,
      channel: channel,
      amount: Math.round(amount),
      day: day,
    });
    state.nextId += 1;
    spendForm.elements.amount.value = "";
    paintSpend();
    announce(channel + " " + money(Math.round(amount)) + " added on " + day + ".");
  });

  mount.querySelector("[data-sd-spend-rows]").addEventListener("click", function (event) {
    var button = event.target.closest("[data-remove]");
    if (!button) return;
    var id = Number(button.getAttribute("data-remove"));
    state.spend = state.spend.filter(function (row) {
      return row.id !== id;
    });
    paintSpend();
    announce("Spend row removed.");
  });

  var goalForm = mount.querySelector("[data-sd-goal-form]");
  goalForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var amount = Number(goalForm.elements.target.value);
    var error = mount.querySelector("[data-sd-goal-error]");
    if (!Number.isFinite(amount) || amount <= 0) {
      error.textContent = "Enter a sales target above zero.";
      return;
    }
    error.textContent = "";
    state.goal = Math.round(amount);
    paintGoals();
    announce("Saved target " + money(state.goal) + ".");
  });

  mount.querySelector("[data-sd-goal-clear]").addEventListener("click", function () {
    state.goal = null;
    goalForm.elements.target.value = "";
    mount.querySelector("[data-sd-goal-error]").textContent = "";
    paintGoals();
    announce("Saved target cleared.");
  });

  window.addEventListener("popstate", function () {
    var next = new URLSearchParams(window.location.search);
    var period = next.get("period");
    var tab = next.get("tab");
    if (PERIODS.indexOf(period) >= 0) state.period = period;
    if (TABS.indexOf(tab) >= 0) state.tab = tab;
    state.selectedDay = null;
    paint();
  });

  paint();

  function current() {
    return WINDOWS[state.period];
  }

  function paint() {
    var window = current();
    periodGroup.querySelectorAll("[data-period]").forEach(function (button) {
      var on = button.getAttribute("data-period") === state.period;
      button.setAttribute("aria-pressed", on ? "true" : "false");
    });
    tabGroup.querySelectorAll("[data-tab]").forEach(function (button) {
      var on = button.getAttribute("data-tab") === state.tab;
      button.setAttribute("aria-selected", on ? "true" : "false");
      button.tabIndex = on ? 0 : -1;
    });
    TABS.forEach(function (tab) {
      var panel = panels[tab];
      var on = tab === state.tab;
      panel.hidden = !on;
    });
    mount.querySelector("[data-sd-range]").textContent = window.range;
    paintOrders();
    paintSpend();
    paintGoals();
    paintCustomers();
    paintNote();
    announce(window.label + ". Sales " + money(window.sales) + ".");
  }

  function paintOrders() {
    var window = current();
    mount.querySelector("[data-sd-sales]").textContent = money(window.sales);
    var orders = mount.querySelector("[data-sd-orders]");
    orders.textContent =
      window.orders == null
        ? window.ordersNote || "Order count not stored."
        : count(window.orders) + " orders";
    var compare = mount.querySelector("[data-sd-compare]");
    if (window.priorSales == null || window.sales == null) {
      compare.textContent = "No prior stored";
    } else {
      var delta = window.sales - window.priorSales;
      var deltaText = delta < 0 ? "−" + money(Math.abs(delta)) : "+" + money(delta);
      compare.textContent = "vs prior " + money(window.priorSales) + " · " + deltaText;
    }
    paintQuiet("typical", window.typicalOrder == null ? "—" : money(window.typicalOrder));
    paintQuiet(
      "returning",
      window.returning == null ? "—" : count(window.returning)
    );
    paintQuiet(
      "new",
      window.newCustomers == null ? "—" : count(window.newCustomers)
    );
    var share = mount.querySelector("[data-sd-returning-share]");
    if (window.returning != null && window.orders) {
      share.textContent = pct(window.returning / window.orders) + " of orders";
    } else {
      share.textContent = window.returning == null ? "Not stored" : "";
    }
    paintChart();
  }

  function paintQuiet(name, value) {
    mount.querySelector('[data-sd-quiet="' + name + '"]').textContent = value;
  }

  function paintChart() {
    var window = current();
    var chart = mount.querySelector("[data-sd-chart]");
    var caption = mount.querySelector("[data-sd-chart-caption]");
    var readout = mount.querySelector("[data-sd-readout]");
    chart.replaceChildren();
    if (!window.days || window.sales == null) {
      caption.textContent = window.ordersNote || "No daily sales stored for this window.";
      readout.textContent = "No days in this window.";
      return;
    }
    var bars = shapeDays(window.sales, window.start, window.days);
    var max = Math.max.apply(null, bars);
    bars.forEach(function (amount, index) {
      var iso = isoOf(addDays(window.start, index));
      var button = document.createElement("button");
      button.type = "button";
      button.className = "sd-day";
      button.setAttribute("data-day", iso);
      button.setAttribute("aria-label", iso + ", " + money(amount));
      button.style.height = Math.max(8, Math.round((amount / max) * 120)) + "px";
      if (window.days > 40) {
        button.style.flex = "0 0 8px";
        button.style.minWidth = "8px";
      }
      if (state.selectedDay === iso) button.classList.add("is-on");
      chart.appendChild(button);
    });
    caption.textContent =
      "SAMPLE shape of the published total. Not a shop’s day file.";
    readout.textContent = state.selectedDay
      ? dayReadout(state.selectedDay, bars, window)
      : "Select a day.";
  }

  function paintChartSelection() {
    var window = current();
    var bars = window.days ? shapeDays(window.sales, window.start, window.days) : [];
    mount.querySelectorAll("[data-day]").forEach(function (button) {
      button.classList.toggle("is-on", button.getAttribute("data-day") === state.selectedDay);
    });
    mount.querySelector("[data-sd-readout]").textContent = dayReadout(
      state.selectedDay,
      bars,
      window
    );
  }

  function dayReadout(iso, bars, window) {
    var index = 0;
    var cursor = window.start;
    while (cursor && cursor !== iso && index < bars.length) {
      index += 1;
      cursor = isoOf(addDays(window.start, index));
    }
    var amount = bars[index];
    if (amount == null) return "That day is outside this window.";
    return iso + " · " + money(amount) + " · SAMPLE shape";
  }

  function rowsInWindow(window) {
    if (!window.start || !window.end) return [];
    return state.spend.filter(function (row) {
      return row.day >= window.start && row.day <= window.end;
    });
  }

  function paintSpend() {
    var window = current();
    var inWindow = rowsInWindow(window);
    var spent = inWindow.reduce(function (total, row) {
      return total + row.amount;
    }, 0);
    var outside = state.spend.length - inWindow.length;
    var list = mount.querySelector("[data-sd-spend-rows]");
    list.replaceChildren();
    if (!state.spend.length) {
      var empty = document.createElement("p");
      empty.className = "sd-empty";
      empty.textContent = "No spend entered.";
      list.appendChild(empty);
    } else {
      state.spend.forEach(function (row) {
        var item = document.createElement("li");
        var inside = window.start && row.day >= window.start && row.day <= window.end;
        item.className = inside ? "sd-row" : "sd-row is-out";
        var text = document.createElement("span");
        text.textContent =
          row.channel + " · " + money(row.amount) + " · " + row.day + (inside ? "" : " · outside this window");
        var remove = document.createElement("button");
        remove.type = "button";
        remove.className = "sd-text-btn";
        remove.setAttribute("data-remove", String(row.id));
        remove.textContent = "Remove";
        item.append(text, remove);
        list.appendChild(item);
      });
    }
    var result = mount.querySelector("[data-sd-roas]");
    var detail = mount.querySelector("[data-sd-roas-detail]");
    var value = ratio(window.sales, spent);
    if (value == null) {
      result.textContent = "—";
      detail.textContent = window.sales == null
        ? "Sales for this window are not stored, so sales ÷ spend stays blank."
        : "Sales ÷ spend stays blank until spend is entered in this window.";
    } else {
      result.textContent = formatRatio(value);
      detail.textContent =
        money(window.sales) + " ÷ " + money(spent) + " = " + formatRatio(value);
    }
    var meta = mount.querySelector("[data-sd-spend-meta]");
    meta.textContent = outside
      ? inWindow.length + " in this window · " + outside + " outside it."
      : inWindow.length
        ? inWindow.length + " in this window."
        : "";
  }

  function paintGoals() {
    var window = current();
    var status = mount.querySelector("[data-sd-goal-status]");
    if (state.goal == null) {
      status.textContent = "Nothing saved.";
      return;
    }
    if (window.sales == null) {
      status.textContent =
        "Saved target " + money(state.goal) + ". This window has no sales to compare.";
      return;
    }
    var delta = window.sales - state.goal;
    if (delta === 0) {
      status.textContent =
        "Saved target " + money(state.goal) + ". " + window.label + " sales match that target.";
      return;
    }
    if (delta > 0) {
      status.textContent =
        "Saved target " +
        money(state.goal) +
        ". " +
        window.label +
        " sales are " +
        money(delta) +
        " above that target.";
      return;
    }
    status.textContent =
      "Saved target " +
      money(state.goal) +
      ". " +
      window.label +
      " sales are " +
      money(Math.abs(delta)) +
      " short of that target.";
  }

  function paintCustomers() {
    var window = current();
    setFact("orders", count(window.orders));
    setFact("new", count(window.newCustomers));
    setFact("returning", count(window.returning));
    setFact("typical", window.typicalOrder == null ? "—" : money(window.typicalOrder));
    setFact("ltv30", window.ltv30 == null ? "—" : money(window.ltv30));
    setFact("ltv90", window.ltv90 == null ? "—" : money(window.ltv90));
    setFact("repeat", pct(window.repeat30));
    mount.querySelector("[data-sd-customers-note]").textContent =
      window.ordersNote || "Counts and cohort averages stored on this SAMPLE window.";
  }

  function setFact(name, value) {
    mount.querySelector('[data-sd-fact="' + name + '"]').textContent = value;
  }

  function paintNote() {
    mount.querySelector("[data-sd-note]").textContent = state.note;
  }

  function announce(text) {
    live.textContent = text;
  }

  function writeUrl() {
    var url = new URL(window.location.href);
    url.searchParams.set("period", state.period);
    url.searchParams.set("tab", state.tab);
    history.replaceState(null, "", url);
  }

  function shellHtml() {
    return (
      '<div class="sd">' +
      '<p class="sd-live" data-sd-live aria-live="polite"></p>' +
      '<div class="sd-bar">' +
      '<div class="sd-tabs" data-sd-tabs role="tablist" aria-label="Desk">' +
      tabButton("orders", "Orders", true) +
      tabButton("spend", "Spend", false) +
      tabButton("goals", "Goals", false) +
      tabButton("customers", "Customers", false) +
      "</div>" +
      '<span class="sd-sample">SAMPLE</span>' +
      "</div>" +
      '<div class="sd-periods" data-sd-periods role="group" aria-label="Period">' +
      PERIODS.map(function (key) {
        var window = WINDOWS[key];
        var pressed = key === "mtd" ? "true" : "false";
        return (
          '<button type="button" class="sd-period" data-period="' +
          key +
          '" aria-pressed="' +
          pressed +
          '">' +
          window.label +
          "</button>"
        );
      }).join("") +
      '<span class="sd-range" data-sd-range>Jul 1–27, 2026</span>' +
      "</div>" +
      '<div class="sd-panel" data-sd-panel="orders" role="tabpanel">' +
      '<div class="sd-score">' +
      "<div>" +
      '<p class="sd-kicker">Sales</p>' +
      '<p class="sd-sales" data-sd-sales>$412,400</p>' +
      '<p class="sd-orders" data-sd-orders>4,480 orders</p>' +
      "</div>" +
      '<p class="sd-compare" data-sd-compare>vs prior</p>' +
      "</div>" +
      '<div class="sd-quiets" data-sd-quiets>' +
      quietButton("typical", "Typical order", "Typical order is the published average order on this SAMPLE window.") +
      quietButton("returning", "Returning", "Returning is the stored customer count, not a dollar amount.") +
      quietButton("new", "New customers", "New customers are the stored count on this SAMPLE window.") +
      "</div>" +
      '<p class="sd-share" data-sd-returning-share></p>' +
      '<p class="sd-note" data-sd-note></p>' +
      '<div class="sd-chart" data-sd-chart role="group" aria-label="Daily sales"></div>' +
      '<p class="sd-caption" data-sd-chart-caption></p>' +
      '<p class="sd-readout" data-sd-readout>Select a day.</p>' +
      "</div>" +
      '<div class="sd-panel" data-sd-panel="spend" role="tabpanel" hidden>' +
      "<form data-sd-spend-form>" +
      "<label>Channel <select name=\"channel\">" +
      CHANNELS.map(function (channel) {
        return "<option>" + channel + "</option>";
      }).join("") +
      "</select></label>" +
      '<label>Amount <input name="amount" type="number" min="1" step="1" inputmode="decimal" placeholder="0"></label>' +
      '<label>Day <input name="day" type="date" value="2026-07-15" required></label>' +
      '<button type="submit" class="sd-primary">Add spend</button>' +
      "</form>" +
      '<p class="sd-error" data-sd-spend-error></p>' +
      '<ul class="sd-rows" data-sd-spend-rows></ul>' +
      '<p class="sd-meta" data-sd-spend-meta></p>' +
      '<p class="sd-kicker">Sales ÷ spend</p>' +
      '<p class="sd-sales sd-sales--quiet" data-sd-roas>—</p>' +
      '<p class="sd-detail" data-sd-roas-detail>Sales ÷ spend stays blank until spend is entered in this window.</p>' +
      "</div>" +
      '<div class="sd-panel" data-sd-panel="goals" role="tabpanel" hidden>' +
      "<form data-sd-goal-form>" +
      '<label>Sales target <input name="target" type="number" min="1" step="1" inputmode="decimal" placeholder="0"></label>' +
      '<button type="submit" class="sd-primary">Save target</button>' +
      '<button type="button" class="sd-text-btn" data-sd-goal-clear>Clear</button>' +
      "</form>" +
      '<p class="sd-error" data-sd-goal-error></p>' +
      '<p class="sd-detail" data-sd-goal-status>Nothing saved.</p>' +
      "</div>" +
      '<div class="sd-panel" data-sd-panel="customers" role="tabpanel" hidden>' +
      '<div class="sd-facts">' +
      fact("orders", "Orders") +
      fact("new", "New") +
      fact("returning", "Returning") +
      fact("typical", "Typical order") +
      fact("ltv30", "30-day cohort") +
      fact("ltv90", "90-day cohort") +
      fact("repeat", "30-day repeat") +
      "</div>" +
      '<p class="sd-detail" data-sd-customers-note></p>' +
      "</div>" +
      "</div>"
    );
  }

  function tabButton(id, label, selected) {
    return (
      '<button type="button" class="sd-tab" role="tab" data-tab="' +
      id +
      '" aria-selected="' +
      (selected ? "true" : "false") +
      '" tabindex="' +
      (selected ? "0" : "-1") +
      '">' +
      label +
      "</button>"
    );
  }

  function quietButton(name, label, note) {
    return (
      '<button type="button" class="sd-quiet" data-quiet="' +
      note +
      '"><span>' +
      label +
      '</span><strong data-sd-quiet="' +
      name +
      '">—</strong></button>'
    );
  }

  function fact(name, label) {
    return (
      '<p class="sd-fact"><span>' +
      label +
      '</span><strong data-sd-fact="' +
      name +
      '">—</strong></p>'
    );
  }
})(typeof window !== "undefined" ? window : globalThis);
