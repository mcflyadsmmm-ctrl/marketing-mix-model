/**
 * Homepage Total ROAS explorer demo — sample desk parity with app Total ROAS desk.
 * Total ROAS = sales ÷ spend. Deterministic SAMPLE data only. No pixels / MTA.
 * Inits when #mcfly-spend-explorer exists; no global exports.
 */
(function () {
  "use strict";

  var ROOT_ID = "mcfly-spend-explorer";
  var TARGET_MER = 4;
  /** Break-even Total ROAS at 35% margin (1 / 0.35) — matches hero instruments. */
  var BE_MER = 2.86;
  var CHANNELS = [
    { id: "meta", label: "Meta" },
    { id: "google", label: "Google" },
    { id: "microsoft", label: "Microsoft" },
    { id: "email", label: "Email" },
  ];
  var MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function addDays(d, n) {
    var next = new Date(d);
    next.setDate(next.getDate() + n);
    return startOfDay(next);
  }

  function dateKey(d) {
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function parseKey(key) {
    var parts = String(key || "").split("-").map(Number);
    if (!parts[0] || !parts[1] || !parts[2]) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function closedEnd(now) {
    return addDays(startOfDay(now || new Date()), -1);
  }

  function mondayOf(d) {
    var dow = (d.getDay() + 6) % 7;
    return addDays(startOfDay(d), -dow);
  }

  /** Deterministic 0..1 from integer seed. */
  function hash01(n) {
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
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

  function merOf(sales, spend) {
    if (!(spend > 0) || !Number.isFinite(sales)) return null;
    var m = sales / spend;
    return Number.isFinite(m) ? m : null;
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  /**
   * ~1y daily spine ending yesterday. Realistic weekly seasonality.
   * Seed fixed so reloads match.
   */
  function buildDailySpine(now) {
    var end = closedEnd(now);
    var start = addDays(end, -364);
    var rows = [];
    var day = start;
    var i = 0;
    while (day.getTime() <= end.getTime()) {
      var dow = day.getDay(); // 0 Sun
      var weekPhase = Math.sin((i / 7) * Math.PI * 2);
      var monthPhase = Math.sin((day.getMonth() / 12) * Math.PI * 2);
      var weekend = dow === 0 || dow === 6 ? 0.78 : dow === 1 ? 0.92 : 1.05;
      var baseSpend = 2100 + weekPhase * 280 + monthPhase * 220;
      var noise = 0.88 + hash01(i * 17 + 3) * 0.24;
      var totalSpend = Math.max(400, baseSpend * weekend * noise);

      var metaShare = 0.42 + (hash01(i + 1) - 0.5) * 0.08;
      var googleShare = 0.28 + (hash01(i + 2) - 0.5) * 0.06;
      var msShare = 0.12 + (hash01(i + 3) - 0.5) * 0.04;
      var emailShare = Math.max(0.06, 1 - metaShare - googleShare - msShare);

      var meta = round2(totalSpend * metaShare);
      var google = round2(totalSpend * googleShare);
      var microsoft = round2(totalSpend * msShare);
      var email = round2(totalSpend * emailShare);
      var spend = round2(meta + google + microsoft + email);

      // Total ROAS oscillates around ~3.2–4.6 with weekly pattern
      var targetish = 3.55 + weekPhase * 0.55 + (hash01(i + 9) - 0.5) * 0.45;
      if (dow === 0 || dow === 6) targetish *= 1.08;
      var sales = round2(spend * Math.max(2.1, targetish));

      rows.push({
        dateKey: dateKey(day),
        sales: sales,
        spend: spend,
        channels: {
          meta: meta,
          google: google,
          microsoft: microsoft,
          email: email,
        },
      });
      day = addDays(day, 1);
      i += 1;
    }
    return rows;
  }

  function resolveWindow(range, end, customFrom, customTo) {
    var endStart = startOfDay(end);
    if (customFrom && customTo && customFrom.getTime() <= customTo.getTime()) {
      return {
        start: startOfDay(customFrom),
        end: startOfDay(customTo),
        label: dateKey(customFrom) + " → " + dateKey(customTo),
        range: "custom",
      };
    }
    switch (range) {
      case "14d":
        return {
          start: addDays(endStart, -13),
          end: endStart,
          label: "14 closed days",
          range: range,
        };
      case "30d":
        return {
          start: addDays(endStart, -29),
          end: endStart,
          label: "30 closed days",
          range: range,
        };
      case "90d":
        return {
          start: addDays(endStart, -89),
          end: endStart,
          label: "90 closed days",
          range: range,
        };
      case "YTD":
        return {
          start: new Date(endStart.getFullYear(), 0, 1),
          end: endStart,
          label: "Year to date",
          range: range,
        };
      case "1y":
        return {
          start: addDays(endStart, -364),
          end: endStart,
          label: "Last 365 closed days",
          range: range,
        };
      case "All":
        return {
          start: addDays(endStart, -364),
          end: endStart,
          label: "All sample days",
          range: range,
        };
      default:
        return {
          start: addDays(endStart, -89),
          end: endStart,
          label: "90 closed days",
          range: "90d",
        };
    }
  }

  function filterRows(rows, win) {
    var startMs = win.start.getTime();
    var endMs = win.end.getTime();
    return rows.filter(function (r) {
      var d = parseKey(r.dateKey);
      if (!d) return false;
      var t = d.getTime();
      return t >= startMs && t <= endMs;
    });
  }

  function bucketMeta(date, gran, spansYears) {
    var y = date.getFullYear();
    var mi = date.getMonth();
    var day = date.getDate();
    var yy = " ’" + String(y).slice(2);
    if (gran === "Day") {
      return {
        key: dateKey(date),
        label: spansYears
          ? mi + 1 + "/" + day + "/" + String(y).slice(2)
          : mi + 1 + "/" + day,
        sortMs: date.getTime(),
      };
    }
    if (gran === "Week") {
      var mon = mondayOf(date);
      return {
        key: "w:" + dateKey(mon),
        label: spansYears
          ? "Wk of " +
            (mon.getMonth() + 1) +
            "/" +
            mon.getDate() +
            "/" +
            String(mon.getFullYear()).slice(2)
          : "Wk of " + (mon.getMonth() + 1) + "/" + mon.getDate(),
        sortMs: mon.getTime(),
      };
    }
    if (gran === "Month") {
      return {
        key: "m:" + y + "-" + pad2(mi + 1),
        label: MONTHS[mi] + yy,
        sortMs: new Date(y, mi, 1).getTime(),
      };
    }
    // Quarter — bucket months × 3
    var q = Math.floor(mi / 3) + 1;
    return {
      key: "q:" + y + "-Q" + q,
      label: "Q" + q + " " + y,
      sortMs: new Date(y, (q - 1) * 3, 1).getTime(),
    };
  }

  function aggregate(rows, gran) {
    if (!rows.length) return [];
    var minY = Infinity;
    var maxY = -Infinity;
    rows.forEach(function (r) {
      var d = parseKey(r.dateKey);
      if (!d) return;
      var y = d.getFullYear();
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });
    var spansYears = minY !== maxY;
    var map = Object.create(null);
    rows.forEach(function (r) {
      var d = parseKey(r.dateKey);
      if (!d) return;
      var meta = bucketMeta(d, gran, spansYears);
      var acc = map[meta.key];
      if (!acc) {
        acc = {
          key: meta.key,
          label: meta.label,
          sortMs: meta.sortMs,
          sales: 0,
          spend: 0,
          channels: { meta: 0, google: 0, microsoft: 0, email: 0 },
        };
        map[meta.key] = acc;
      }
      acc.sales += r.sales;
      acc.spend += r.spend;
      CHANNELS.forEach(function (ch) {
        acc.channels[ch.id] += r.channels[ch.id] || 0;
      });
    });
    return Object.keys(map)
      .map(function (k) {
        return map[k];
      })
      .sort(function (a, b) {
        return a.sortMs - b.sortMs;
      })
      .map(function (acc) {
        var sales = round2(acc.sales);
        var spend = round2(acc.spend);
        var channels = {};
        CHANNELS.forEach(function (ch) {
          channels[ch.id] = round2(acc.channels[ch.id]);
        });
        return {
          key: acc.key,
          label: acc.label,
          sales: sales,
          spend: spend,
          mer: merOf(sales, spend),
          channels: channels,
        };
      });
  }

  function applyMode(buckets, mode) {
    return buckets.map(function (b) {
      if (mode === "total") {
        return {
          key: b.key,
          label: b.label,
          sales: b.sales,
          spend: b.spend,
          mer: b.mer,
          bars:
            b.spend > 0
              ? [{ channel: "total", amount: b.spend }]
              : [],
        };
      }
      if (mode === "share") {
        var chTotal = CHANNELS.reduce(function (s, ch) {
          return s + (b.channels[ch.id] || 0);
        }, 0);
        return {
          key: b.key,
          label: b.label,
          sales: b.sales,
          spend: b.spend,
          mer: b.mer,
          bars:
            chTotal > 0
              ? CHANNELS.map(function (ch) {
                  return {
                    channel: ch.id,
                    amount: round2(((b.channels[ch.id] || 0) / chTotal) * 100),
                  };
                }).filter(function (x) {
                  return x.amount > 0;
                })
              : [],
        };
      }
      // stacked $
      return {
        key: b.key,
        label: b.label,
        sales: b.sales,
        spend: b.spend,
        mer: b.mer,
        bars: CHANNELS.map(function (ch) {
          return { channel: ch.id, amount: b.channels[ch.id] || 0 };
        }).filter(function (x) {
          return x.amount > 0;
        }),
      };
    });
  }

  function barMax(buckets, mode) {
    if (mode === "share") return 100;
    var max = 0;
    buckets.forEach(function (b) {
      var h =
        mode === "total"
          ? b.spend
          : b.bars.reduce(function (s, c) {
              return s + c.amount;
            }, 0);
      if (h > max) max = h;
    });
    return max > 0 ? max : 1;
  }

  function merCeil(buckets, target) {
    var max = target > 0 ? target : 1;
    buckets.forEach(function (b) {
      if (b.mer != null && b.mer > max) max = b.mer;
    });
    return max * 1.08;
  }

  function salesCeil(buckets) {
    var max = 0;
    buckets.forEach(function (b) {
      if (b.sales > max) max = b.sales;
    });
    return max > 0 ? max * 1.08 : 1;
  }

  function channelLabel(id) {
    if (id === "total") return "Total spend";
    for (var i = 0; i < CHANNELS.length; i++) {
      if (CHANNELS[i].id === id) return CHANNELS[i].label;
    }
    return id;
  }

  function segmentDetail(bucket, mode) {
    if (!bucket || !bucket.bars || !bucket.bars.length) return "";
    return bucket.bars
      .map(function (seg) {
        var amt =
          mode === "share"
            ? seg.amount.toFixed(1) + "%"
            : money(seg.amount);
        return channelLabel(seg.channel) + " " + amt;
      })
      .join(" · ");
  }

  function defaultFocusKey(buckets) {
    for (var i = buckets.length - 1; i >= 0; i--) {
      if (buckets[i].spend > 0 || (buckets[i].bars && buckets[i].bars.length)) {
        return buckets[i].key;
      }
    }
    return buckets.length ? buckets[buckets.length - 1].key : null;
  }

  /** Closed calendar MTD window ending at `end` (yesterday). */
  function mtdPeriod(end) {
    var start = new Date(end.getFullYear(), end.getMonth(), 1);
    var monthEnd = new Date(end.getFullYear(), end.getMonth() + 1, 0);
    return {
      start: startOfDay(start),
      end: startOfDay(monthEnd),
      closedCap: startOfDay(end),
      label: MONTHS[end.getMonth()] + " " + end.getFullYear() + " MTD",
    };
  }

  /**
   * Apps Script / app ControlPace math — till sales ÷ spend, closed-day cap.
   * Target MER = 4 on the sample desk.
   */
  function buildControlPace(sales, totalSpend, targetMer, period) {
    var periodStart = period.start;
    var periodEnd = period.end;
    var closedCap = period.closedCap;
    var msDay = 86400000;
    var daysInPeriod = Math.max(
      1,
      Math.round((periodEnd.getTime() - periodStart.getTime()) / msDay) + 1,
    );
    var endCap =
      periodEnd.getTime() < closedCap.getTime() ? periodEnd : closedCap;
    var daysElapsed = Math.max(
      0,
      Math.min(
        daysInPeriod,
        Math.round((endCap.getTime() - periodStart.getTime()) / msDay) + 1,
      ),
    );
    var remainingDays = Math.max(0, daysInPeriod - daysElapsed);
    var avgDailySales = daysElapsed > 0 ? sales / daysElapsed : 0;
    var avgDailySpend = daysElapsed > 0 ? totalSpend / daysElapsed : 0;
    var projSpend = totalSpend + avgDailySpend * remainingDays;
    var target = targetMer > 0 ? targetMer : 0;
    var targetPeriodSales = target > 0 ? projSpend * target : 0;
    var remainingSalesNeeded = Math.max(0, targetPeriodSales - sales);
    var dailySalesNeeded =
      remainingDays > 0 ? remainingSalesNeeded / remainingDays : 0;
    var calendarProgressPct =
      daysInPeriod > 0
        ? Math.min(100, (daysElapsed / daysInPeriod) * 100)
        : 0;
    var salesProgressPct =
      targetPeriodSales > 0
        ? Math.min(100, (sales / targetPeriodSales) * 100)
        : 0;
    var currentMer = merOf(sales, totalSpend);
    var progressCls =
      salesProgressPct >= calendarProgressPct
        ? "good"
        : currentMer != null && target > 0 && currentMer >= target * 0.85
          ? "warn"
          : "bad";
    return {
      daysElapsed: daysElapsed,
      daysInPeriod: daysInPeriod,
      remainingDays: remainingDays,
      densityLabel: daysElapsed + " / " + daysInPeriod + " days",
      avgDailySales: avgDailySales,
      projSpend: round2(projSpend),
      dailySalesNeeded: round2(dailySalesNeeded),
      salesProgressPct: salesProgressPct,
      calendarProgressPct: calendarProgressPct,
      progressCls: progressCls,
    };
  }

  /** Sparse x-axis labels — first + last always, every Nth in between. */
  function xLabelStep(n, narrow) {
    var maxLabels = narrow ? 6 : 10;
    if (n <= maxLabels) return 1;
    return Math.ceil(n / maxLabels);
  }

  function shouldShowXLabel(i, n, step) {
    if (n <= 0) return false;
    if (i === 0 || i === n - 1) return true;
    return i % step === 0;
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function svgEl(name, attrs) {
    var node = document.createElementNS("http://www.w3.org/2000/svg", name);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        node.setAttribute(k, attrs[k]);
      });
    }
    return node;
  }

  function init(root) {
    var end = closedEnd(new Date());
    var spine = buildDailySpine(end);

    var state = {
      range: "90d",
      gran: "Week",
      mode: "stacked",
      showSales: false,
      from: "",
      to: "",
      focusKey: null,
    };

    var chartHost = root.querySelector("[data-sx-chart]");
    var legendHost = root.querySelector("[data-sx-legend]");
    var tip = root.querySelector("[data-sx-tip]");
    var readout = root.querySelector("[data-sx-readout]");
    var eqSales = root.querySelector("[data-sx-eq-sales]");
    var eqSpend = root.querySelector("[data-sx-eq-spend]");
    var eqMe = root.querySelector("[data-sx-eq-me]");
    var eqMeta = root.querySelector("[data-sx-eq-meta]");
    var pacePeriod = root.querySelector("[data-sx-pace-period]");
    var paceArc = root.querySelector("[data-sx-pace-arc]");
    var paceTick = root.querySelector("[data-sx-pace-tick]");
    var paceMer = root.querySelector("[data-sx-pace-mer]");
    var paceSales = root.querySelector("[data-sx-pace-sales]");
    var paceSpend = root.querySelector("[data-sx-pace-spend]");
    var paceDays = root.querySelector("[data-sx-pace-days]");
    var paceAvgSales = root.querySelector("[data-sx-pace-avg-sales]");
    var paceProjSpend = root.querySelector("[data-sx-pace-proj-spend]");
    var paceDailyNeed = root.querySelector("[data-sx-pace-daily-need]");
    var paceSalesPct = root.querySelector("[data-sx-pace-sales-pct]");
    var paceCalPct = root.querySelector("[data-sx-pace-cal-pct]");
    var paceSalesFill = root.querySelector("[data-sx-pace-sales-fill]");
    var paceCalFill = root.querySelector("[data-sx-pace-cal-fill]");

    function compute() {
      var win = resolveWindow(state.range, end, null, null);
      var filtered = filterRows(spine, win);
      var buckets = aggregate(filtered, state.gran);
      var plot = applyMode(buckets, state.mode);
      var totalSales = round2(
        filtered.reduce(function (s, r) {
          return s + r.sales;
        }, 0),
      );
      var totalSpend = round2(
        filtered.reduce(function (s, r) {
          return s + r.spend;
        }, 0),
      );

      // Monthly pacing uses closed MTD (independent of explorer range).
      var mtd = mtdPeriod(end);
      var mtdRows = filterRows(spine, {
        start: mtd.start,
        end: mtd.closedCap,
      });
      var mtdSales = round2(
        mtdRows.reduce(function (s, r) {
          return s + r.sales;
        }, 0),
      );
      var mtdSpend = round2(
        mtdRows.reduce(function (s, r) {
          return s + r.spend;
        }, 0),
      );
      var mtdMer = merOf(mtdSales, mtdSpend);
      var control = buildControlPace(
        mtdSales,
        mtdSpend,
        TARGET_MER,
        mtd,
      );

      return {
        win: win,
        buckets: plot,
        totalSales: totalSales,
        totalSpend: totalSpend,
        overallMer: merOf(totalSales, totalSpend),
        asOf: dateKey(end),
        mtd: mtd,
        mtdSales: mtdSales,
        mtdSpend: mtdSpend,
        mtdMer: mtdMer,
        control: control,
      };
    }

    function findBucket(buckets, key) {
      if (!key) return null;
      for (var i = 0; i < buckets.length; i++) {
        if (buckets[i].key === key) return buckets[i];
      }
      return null;
    }

    function setTipContent(bucket) {
      if (!tip || !bucket) return;
      var lines = [
        "<strong>" + bucket.label + "</strong>",
        money(bucket.sales) +
          " sales ÷ " +
          money(bucket.spend) +
          " spend" +
          (bucket.mer != null ? " = " + formatMer(bucket.mer) : ""),
      ];
      var detail = segmentDetail(bucket, state.mode);
      if (detail) lines.push(detail);
      tip.innerHTML = lines.join("<br>");
      tip.hidden = false;
    }

    function placeTip(clientX, clientY) {
      if (!tip || tip.hidden) return;
      var rect = root.getBoundingClientRect();
      var x = clientX - rect.left + 12;
      var y = clientY - rect.top + 12;
      var maxX = rect.width - tip.offsetWidth - 8;
      var maxY = rect.height - tip.offsetHeight - 8;
      tip.style.left = Math.max(8, Math.min(x, maxX)) + "px";
      tip.style.top = Math.max(8, Math.min(y, maxY)) + "px";
    }

    function showTip(bucket, clientX, clientY) {
      setTipContent(bucket);
      if (clientX != null && clientY != null) placeTip(clientX, clientY);
    }

    function updateReadout(bucket) {
      if (!readout) return;
      if (!bucket) {
        readout.classList.remove("sx-demo__readout--on");
        readout.textContent =
          "Select a column · Total ROAS = sales ÷ spend";
        return;
      }
      readout.classList.add("sx-demo__readout--on");
      var detail = segmentDetail(bucket, state.mode);
      readout.innerHTML =
        "<strong>" +
        bucket.label +
        "</strong><span>" +
        money(bucket.sales) +
        " sales ÷ " +
        money(bucket.spend) +
        " spend" +
        (bucket.mer != null ? " = " + formatMer(bucket.mer) : "") +
        "</span>" +
        (detail ? "<span>" + detail + "</span>" : "");
    }

    function selectBucket(bucket, clientX, clientY) {
      if (!bucket) return;
      state.focusKey = bucket.key;
      updateReadout(bucket);
      showTip(bucket, clientX, clientY);
      if (chartHost) {
        chartHost.querySelectorAll(".sx-demo__col").forEach(function (col) {
          col.classList.toggle(
            "sx-demo__col--on",
            col.getAttribute("data-key") === bucket.key,
          );
        });
      }
    }

    function renderPacing(data) {
      var mer = data.mtdMer;
      var control = data.control;
      var radius = 80;
      var cx = 120;
      var cy = 110;
      var circumference = Math.PI * radius;
      var mtdMerNum = mer != null && Number.isFinite(mer) ? mer : 0;
      var maxMer = Math.max(
        6,
        Math.ceil(mtdMerNum || 0),
        Math.ceil(TARGET_MER) + 1,
      );
      var currentPct = Math.min(
        100,
        Math.max(0, (mtdMerNum / maxMer) * 100),
      );
      var targetPct = TARGET_MER > 0 ? (TARGET_MER / maxMer) * 100 : 0;
      var offset = circumference - (currentPct / 100) * circumference;

      if (pacePeriod) {
        pacePeriod.textContent =
          data.mtd.label + " · target " + formatMer(TARGET_MER);
      }
      if (paceArc) {
        paceArc.setAttribute("stroke", "#059669");
        paceArc.setAttribute("stroke-dasharray", String(circumference));
        paceArc.setAttribute("stroke-dashoffset", String(offset));
      }
      if (paceTick) {
        if (TARGET_MER > 0) {
          var targetAngleDeg = 180 - (targetPct / 100) * 180;
          var targetAngleRad = (targetAngleDeg * Math.PI) / 180;
          paceTick.setAttribute(
            "x1",
            String(cx + 71 * Math.cos(targetAngleRad)),
          );
          paceTick.setAttribute(
            "y1",
            String(cy - 71 * Math.sin(targetAngleRad)),
          );
          paceTick.setAttribute(
            "x2",
            String(cx + 89 * Math.cos(targetAngleRad)),
          );
          paceTick.setAttribute(
            "y2",
            String(cy - 89 * Math.sin(targetAngleRad)),
          );
          paceTick.removeAttribute("hidden");
        } else {
          paceTick.setAttribute("hidden", "");
        }
      }

      // Hero Total ROAS — always positive green when finite (never red below target).
      var merText = formatMer(mer);
      if (paceMer) paceMer.textContent = merText;
      if (eqMe) {
        eqMe.textContent = merText;
        eqMe.classList.remove(
          "sx-eq__me--up",
          "sx-eq__me--down",
          "sx-eq__me--flat",
          "sx-pace__gauge-value--empty",
        );
        if (mer != null && Number.isFinite(mer)) {
          eqMe.classList.add("sx-eq__me--up");
        } else {
          eqMe.classList.add("sx-pace__gauge-value--empty");
        }
      }

      if (eqSales) eqSales.textContent = money(data.mtdSales);
      if (eqSpend) eqSpend.textContent = money(data.mtdSpend);
      if (eqMeta) {
        eqMeta.textContent =
          " · BE " + formatMer(BE_MER) + " · as of " + data.asOf;
      }

      if (paceSales) paceSales.textContent = money(data.mtdSales);
      if (paceSpend) paceSpend.textContent = money(data.mtdSpend);
      if (paceDays) paceDays.textContent = control.densityLabel;
      if (paceAvgSales) {
        paceAvgSales.textContent = money(control.avgDailySales);
      }
      if (paceProjSpend) paceProjSpend.textContent = money(control.projSpend);
      if (paceDailyNeed) {
        paceDailyNeed.textContent =
          control.remainingDays > 0
            ? money(control.dailySalesNeeded)
            : "—";
      }

      var salesPct = Math.round(control.salesProgressPct);
      var calendarPct = Math.round(control.calendarProgressPct);
      if (paceSalesPct) paceSalesPct.textContent = salesPct + "%";
      if (paceCalPct) paceCalPct.textContent = calendarPct + "%";
      if (paceSalesFill) {
        paceSalesFill.style.width = salesPct + "%";
        paceSalesFill.className =
          "sx-pace__fill sx-pace__fill--" + control.progressCls;
      }
      if (paceCalFill) {
        paceCalFill.style.width = calendarPct + "%";
      }
    }

    function renderChart(data) {
      if (!chartHost) return;
      chartHost.replaceChildren();
      var buckets = data.buckets;
      if (!buckets.length) {
        chartHost.appendChild(el("p", "sx-demo__empty", "No sample days in this window."));
        return;
      }

      var mode = state.mode;
      var bMax = barMax(buckets, mode);
      var mCeil = merCeil(buckets, TARGET_MER);
      var sCeil = salesCeil(buckets);
      var containerW = Math.max(
        280,
        (chartHost.clientWidth || root.clientWidth || 360) | 0,
      );
      var narrow = containerW <= 430;
      var padL = narrow ? 40 : 52;
      var padR = narrow ? 36 : 48;
      var padT = narrow ? 14 : 16;
      var padB = narrow ? 32 : 36;
      var colMin = narrow
        ? state.gran === "Day"
          ? 14
          : mode === "total"
            ? 18
            : 22
        : state.gran === "Day"
          ? 28
          : mode === "total"
            ? 36
            : 42;
      var needed = buckets.length * colMin + padL + padR;
      // Fit container when possible; grow only for internal scroll (never force 520).
      var plotW = Math.max(containerW, needed);
      var plotH = narrow ? 240 : 280;
      var innerW = plotW - padL - padR;
      var innerH = plotH - padT - padB;
      var barSlot = innerW / buckets.length;
      var barW = Math.max(narrow ? 4 : 6, barSlot * (narrow ? 0.72 : 0.62));

      var svg = svgEl("svg", {
        class: "sx-demo__svg",
        viewBox: "0 0 " + plotW + " " + plotH,
        width: String(plotW),
        height: String(plotH),
        role: "img",
        "aria-label": "Stacked channel spend versus Total ROAS",
      });

      // Grid
      for (var g = 0; g <= 4; g++) {
        var gy = padT + (innerH * g) / 4;
        svg.appendChild(
          svgEl("line", {
            class: "sx-demo__grid",
            x1: String(padL),
            x2: String(padL + innerW),
            y1: String(gy),
            y2: String(gy),
          }),
        );
      }

      // Target Total ROAS dashed
      var targetY = padT + innerH - (TARGET_MER / mCeil) * innerH;
      svg.appendChild(
        svgEl("line", {
          class: "sx-demo__target",
          x1: String(padL),
          x2: String(padL + innerW),
          y1: String(targetY),
          y2: String(targetY),
        }),
      );
      var targetLbl = svgEl("text", {
        class: "sx-demo__target-lbl",
        x: String(padL + innerW - 4),
        y: String(targetY - 4),
        "text-anchor": "end",
      });
      targetLbl.textContent = "Target " + formatMer(TARGET_MER);
      svg.appendChild(targetLbl);

      // Axis labels
      var leftTop = svgEl("text", {
        class: "sx-demo__axis-lbl",
        x: String(8),
        y: String(padT + 10),
      });
      leftTop.textContent =
        mode === "share"
          ? "100%"
          : mode === "total"
            ? money(bMax).replace(/\.00$/, "")
            : money(bMax).replace(/\.00$/, "");
      svg.appendChild(leftTop);
      var leftBot = svgEl("text", {
        class: "sx-demo__axis-lbl",
        x: String(8),
        y: String(padT + innerH),
      });
      leftBot.textContent = mode === "share" ? "0%" : "$0";
      svg.appendChild(leftBot);
      var rightTop = svgEl("text", {
        class: "sx-demo__axis-lbl sx-demo__axis-lbl--r",
        x: String(plotW - 8),
        y: String(padT + 10),
        "text-anchor": "end",
      });
      rightTop.textContent = formatMer(mCeil);
      svg.appendChild(rightTop);
      var rightBot = svgEl("text", {
        class: "sx-demo__axis-lbl sx-demo__axis-lbl--r",
        x: String(plotW - 8),
        y: String(padT + innerH),
        "text-anchor": "end",
      });
      rightBot.textContent = "0×";
      svg.appendChild(rightBot);

      var merPts = [];
      var salesPts = [];

      buckets.forEach(function (b, i) {
        var cx = padL + i * barSlot + barSlot / 2;
        var x = cx - barW / 2;
        var yBase = padT + innerH;
        var gBar = svgEl("g", {
          class: "sx-demo__col" + (state.focusKey === b.key ? " sx-demo__col--on" : ""),
          tabindex: "0",
          role: "listitem",
          "aria-label":
            b.label +
            ", spend " +
            money(b.spend) +
            ", Total ROAS " +
            formatMer(b.mer),
          "data-key": b.key,
        });

        b.bars.forEach(function (seg) {
          var h = (seg.amount / bMax) * innerH;
          if (h < 0.5 && seg.amount > 0) h = 0.5;
          yBase -= h;
          gBar.appendChild(
            svgEl("rect", {
              class: "sx-demo__bar sx-demo__bar--" + seg.channel,
              x: String(x),
              y: String(yBase),
              width: String(barW),
              height: String(h),
              rx: "1",
            }),
          );
        });

        // Hit area
        gBar.appendChild(
          svgEl("rect", {
            class: "sx-demo__hit",
            x: String(padL + i * barSlot),
            y: String(padT),
            width: String(barSlot),
            height: String(innerH),
          }),
        );

        if (b.mer != null) {
          var my = padT + innerH - (b.mer / mCeil) * innerH;
          merPts.push(cx + "," + my);
          gBar.appendChild(
            svgEl("circle", {
              class:
                "sx-demo__mer-dot" +
                (b.mer >= TARGET_MER
                  ? " sx-demo__mer-dot--up"
                  : " sx-demo__mer-dot--down"),
              cx: String(cx),
              cy: String(my),
              r: "3.2",
            }),
          );
        }

        if (state.showSales) {
          var sy = padT + innerH - (b.sales / sCeil) * innerH;
          salesPts.push(cx + "," + sy);
        }

        // X label — every Nth; first + last always (app-style sparse ticks)
        var step = xLabelStep(buckets.length, narrow);
        if (shouldShowXLabel(i, buckets.length, step)) {
          var xl = svgEl("text", {
            class: "sx-demo__x-lbl",
            x: String(cx),
            y: String(plotH - 10),
            "text-anchor": "middle",
          });
          xl.textContent = b.label;
          svg.appendChild(xl);
        }

        gBar.addEventListener("pointerenter", function (ev) {
          selectBucket(b, ev.clientX, ev.clientY);
        });
        gBar.addEventListener("pointermove", function (ev) {
          if (state.focusKey === b.key) placeTip(ev.clientX, ev.clientY);
        });
        gBar.addEventListener("click", function (ev) {
          selectBucket(b, ev.clientX, ev.clientY);
        });
        gBar.addEventListener("focus", function () {
          var r = gBar.getBoundingClientRect();
          selectBucket(b, r.left + r.width / 2, r.top);
        });
        // Tip + readout persist after leave (app parity)

        svg.appendChild(gBar);
      });

      if (state.showSales && salesPts.length > 1) {
        svg.appendChild(
          svgEl("polyline", {
            class: "sx-demo__sales-line",
            points: salesPts.join(" "),
            fill: "none",
          }),
        );
      }

      if (merPts.length > 1) {
        svg.appendChild(
          svgEl("polyline", {
            class: "sx-demo__mer-line",
            points: merPts.join(" "),
            fill: "none",
          }),
        );
      }

      var scroll = el("div", "sx-demo__scroll");
      scroll.style.width = plotW + "px";
      scroll.appendChild(svg);
      chartHost.appendChild(scroll);
    }

    function renderLegend(mode) {
      if (!legendHost) return;
      legendHost.replaceChildren();
      var items =
        mode === "total"
          ? [{ id: "total", label: "Total spend" }]
          : CHANNELS.slice();
      items.forEach(function (ch) {
        var li = el("li", "sx-demo__leg-item");
        li.appendChild(el("span", "sx-demo__swatch sx-demo__swatch--" + ch.id));
        li.appendChild(document.createTextNode(ch.label || channelLabel(ch.id)));
        legendHost.appendChild(li);
      });
      var merLi = el("li", "sx-demo__leg-item");
      merLi.appendChild(el("span", "sx-demo__swatch sx-demo__swatch--mer"));
      merLi.appendChild(document.createTextNode("Total ROAS"));
      legendHost.appendChild(merLi);
      var tgtLi = el("li", "sx-demo__leg-item");
      tgtLi.appendChild(el("span", "sx-demo__swatch sx-demo__swatch--target"));
      tgtLi.appendChild(document.createTextNode("Target " + formatMer(TARGET_MER)));
      legendHost.appendChild(tgtLi);
      if (state.showSales) {
        var sLi = el("li", "sx-demo__leg-item");
        sLi.appendChild(el("span", "sx-demo__swatch sx-demo__swatch--sales"));
        sLi.appendChild(document.createTextNode("Sales"));
        legendHost.appendChild(sLi);
      }
    }

    function render() {
      var data = compute();
      var selected =
        findBucket(data.buckets, state.focusKey) ||
        findBucket(data.buckets, defaultFocusKey(data.buckets));
      if (selected) state.focusKey = selected.key;
      else state.focusKey = null;

      renderPacing(data);
      renderChart(data);
      renderLegend(state.mode);
      updateReadout(selected);
      if (selected) {
        setTipContent(selected);
        if (chartHost && tip && (!tip.style.left || tip.style.left === "0px")) {
          var cr = chartHost.getBoundingClientRect();
          var rr = root.getBoundingClientRect();
          tip.style.left =
            Math.max(8, Math.min(cr.left - rr.left + 16, rr.width - 160)) + "px";
          tip.style.top =
            Math.max(8, Math.min(cr.top - rr.top + 16, rr.height - 80)) + "px";
        }
      }
    }

    // Wire primary controls (range + granularity only — sample desk)
    root.querySelectorAll("[data-sx-range]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.range = btn.getAttribute("data-sx-range") || "90d";
        state.from = "";
        state.to = "";
        root.querySelectorAll("[data-sx-range]").forEach(function (b) {
          b.classList.toggle("is-on", b === btn);
          if (b === btn) b.setAttribute("aria-current", "true");
          else b.removeAttribute("aria-current");
        });
        render();
      });
    });

    root.querySelectorAll("[data-sx-gran]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.gran = btn.getAttribute("data-sx-gran") || "Week";
        root.querySelectorAll("[data-sx-gran]").forEach(function (b) {
          b.classList.toggle("is-on", b === btn);
          if (b === btn) b.setAttribute("aria-current", "true");
          else b.removeAttribute("aria-current");
        });
        render();
      });
    });

    var resizeTimer = null;
    function onResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resizeTimer = null;
        render();
      }, 120);
    }
    if (typeof ResizeObserver !== "undefined" && chartHost) {
      var ro = new ResizeObserver(onResize);
      ro.observe(chartHost);
    } else {
      window.addEventListener("resize", onResize);
    }

    render();
  }

  function boot() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    init(root);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
