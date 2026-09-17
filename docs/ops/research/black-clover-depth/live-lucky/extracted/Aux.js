/**
 * Aux.gs — Auxiliary Pipeline (Pipeline B)  [website / retail — fully isolated]
 * ==============================================================================
 * Serves A/R Aging, Inventory, Shopify, Retail. ZERO BigQuery for rendering.
 */

var AUX_CONFIG = {
  SPREADSHEET_ID: '1r6cRYhXXR4KnuqC0UDaJoG7gEQwzPDIjgOzPgjWXonA',
  SHOPIFY_TAB: 'Sheet1',
  CACHE_KEY: 'aux_payload_v8',
  CACHE_TTL_SEC: 10800, // Reduced to 3 hours to ensure fresher rotation
  EMAIL_SENDER: 'system@sent-via.netsuite.com',
  AR_SUBJECT: 'Master A/R Aging Detail by Document Number',
  INV_SUBJECT: 'Subsidary and Location Stock Ledger'
};

var WEBSITE_GOALS = {
  'BC USA':     { cur: 'USD', sym: '$', m: [300000,340000,530000,430000,475000,640000,470000,570000,550000,525000,590000,580000] },
  'CMC Design': { cur: 'USD', sym: '$', m: [42000,36000,65000,103000,108000,100000,111000,110000,75000,80000,95000,175000] },
  'Asia':       { cur: 'JPY', sym: '¥', m: [475000,420000,450000,855000,1050000,850000,1400000,2300000,1300000,1100000,1250000,750000] },
  'UK':         { cur: 'EUR', sym: '€', m: [3000,4000,4650,10500,19500,9500,15500,11500,7000,9000,21500,25000] }
};
var RETAIL_MONTHLY_GOAL = 30000;

function authorizeAll() {
  var name = SpreadsheetApp.openById(AUX_CONFIG.SPREADSHEET_ID).getName();
  GmailApp.search('in:inbox', 0, 1);
  Logger.log('Authorized OK.');
}

function getAuxData(force) {
  try {
    if (!force) {
      var cached = cacheGetChunked_(AUX_CONFIG.CACHE_KEY);
      if (cached) return cached;
    }
    var payload = {
      ok: true,
      generated_at: new Date().toISOString(),
      ar: buildAuxAR_(),
      inventory: buildAuxInventory_(),
      shopify: buildAuxShopify_(),
      retail: buildAuxRetail_()
    };
    var json = JSON.stringify(payload);
    cachePutChunked_(AUX_CONFIG.CACHE_KEY, json);
    return json;
  } catch (e) {
    return JSON.stringify({ ok: false, error: String(e && e.message || e) });
  }
}

// ============================ A/R AGING (from Gmail) ============================
function buildAuxAR_() {
  var csv = auxLatestEmailCsv_(AUX_CONFIG.AR_SUBJECT);
  if (!csv) return { ok: false, note: 'No A/R email found in the last 7 days.' };
  var grid = Utilities.parseCsv(csv), sub = '';
  var bySub = {}, buckets = { 'Current': 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }, total = 0, docs = 0, asof = '';
  var custDocs = { 'Current': [], '1-30': [], '31-60': [], '61-90': [], '90+': [] };
  
  for (var i = 0; i < grid.length; i++) {
    var r0 = grid[i] || [];
    if (/^"?As of /i.test(r0[0] || '') || /As of /i.test(r0[0] || '')) { asof = String(r0[0]).replace(/[",]/g, '').replace(/As of /i, '').trim(); }
    
    // REVERTED to exactly the proven, hardcoded mapping from earlier versions
    if (i < 7) continue; 
    var r = grid[i]; while (r.length < 5) r.push('');
    var name = (r[0] || '').trim(), age = (r[1] || '').trim(), bal = (r[2] || '').trim(), doc = (r[4] || '').trim();
    
    if (name.indexOf('Total') === 0) continue;
    if (name && !doc && !age) { sub = name; continue; }
    if (!doc) continue;
    
    var a = auxNum_(age), v = auxNum_(bal);
    if (v === 0) continue; 
    
    var b = a <= 0 ? 'Current' : a <= 30 ? '1-30' : a <= 60 ? '31-60' : a <= 90 ? '61-90' : '90+';
    
    if (!bySub[sub]) bySub[sub] = { sub: sub, bal: 0, docs: 0, Current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    bySub[sub].bal += v; bySub[sub][b] += v; bySub[sub].docs += 1; buckets[b] += v; total += v; docs += 1;
    
    var cname = name.replace(/^Customer : /, '').replace(/^Customer \d+ : /, '').trim() || 'Unknown';
    custDocs[b].push({ customer: cname, doc: doc, bal: v, sub: sub });
  }
  
  // STRIP OUT EMPTY BUCKETS COMPLETELY
  Object.keys(custDocs).forEach(function(k) {
     if (custDocs[k].length === 0 && buckets[k] === 0) {
         delete custDocs[k];
         delete buckets[k];
     } else {
         custDocs[k].sort(function(a,b) { return Math.abs(b.bal) - Math.abs(a.bal); });
         custDocs[k] = custDocs[k].slice(0, 50); // limit to top 50 per bucket to keep payload light
     }
  });

  return {
    ok: true, total: Math.round(total), open_docs: docs, asof: asof,
    buckets: buckets,
    custDocs: custDocs,
    bysub: Object.keys(bySub).map(function (s) {
      var d = bySub[s];
      return { sub: s, bal: Math.round(d.bal), docs: d.docs, Current: Math.round(d.Current), d1_30: Math.round(d['1-30']), d31_60: Math.round(d['31-60']), d61_90: Math.round(d['61-90']), d90p: Math.round(d['90+']) };
    }).sort(function (a, b) { return b.bal - a.bal; })
  };
}

// ============================ INVENTORY (from Gmail) ============================
function buildAuxInventory_() {
  var csv = auxLatestEmailCsv_(AUX_CONFIG.INV_SUBJECT);
  if (!csv) return { ok: false, note: 'No Inventory email found in the last 7 days.' };
  var grid = Utilities.parseCsv(csv), sub = '', byLoc = {}, bySub = {}, totV = 0, totQ = 0, asof = '';
  for (var i = 0; i < grid.length; i++) {
    var r0 = grid[i] || [];
    if (/\d{4}/.test(r0[0] || '') && /-/.test(r0[0] || '') && i < 7) asof = String(r0[0]).replace(/"/g, '').trim();
    if (i < 7) continue;
    var r = grid[i]; while (r.length < 9) r.push('');
    var subsid = (r[0] || '').trim(), loc = (r[1] || '').trim(), item = (r[2] || '').trim();
    if (subsid && !loc && !item) { sub = subsid; continue; }
    if (!loc && !item) continue;
    var qty = auxNum_(r[7]), val = auxNum_(r[8]);
    var lk = sub + '||' + loc;
    if (!byLoc[lk]) byLoc[lk] = { loc: loc, sub: sub, val: 0, qty: 0, skus: 0 };
    byLoc[lk].val += val; byLoc[lk].qty += qty; byLoc[lk].skus += 1;
    bySub[sub] = (bySub[sub] || 0) + val; totV += val; totQ += qty;
  }
  return {
    ok: true, total_value: Math.round(totV), total_qty: Math.round(totQ), asof: asof,
    byloc: Object.keys(byLoc).map(function (l) { var d = byLoc[l]; return { loc: d.loc, sub: d.sub, val: Math.round(d.val), qty: Math.round(d.qty), skus: d.skus }; }).sort(function (a, b) { return b.val - a.val; }),
    bysub: Object.keys(bySub).map(function (s) { return { sub: s, val: Math.round(bySub[s]) }; }).sort(function (a, b) { return b.val - a.val; })
  };
}

// ============================ SHOPIFY ============================
function buildAuxShopify_() {
  var v = auxSheet_(AUX_CONFIG.SHOPIFY_TAB);
  if (!v) return { ok: false, note: 'Shopify Sheet1 not found.' };
  var blocks = [
    { name: 'BC USA', dc: 0, sc: 1, cur: 'USD', sym: '$' },
    { name: 'CMC Design', dc: 2, sc: 3, cur: 'USD', sym: '$' },
    { name: 'Asia', dc: 4, sc: 5, cur: 'JPY', sym: '¥' },
    { name: 'UK', dc: 6, sc: 7, cur: 'EUR', sym: '€' }
  ];
  var stores = blocks.map(function (b) {
    var daily = {}, maxd = '';
    for (var i = 2; i < v.length; i++) {
      var d = String(v[i][b.dc] || '').trim();
      if (!/^\d{4}-\d{2}-\d{2}/.test(d)) continue;
      d = d.slice(0, 10);
      daily[d] = (daily[d] || 0) + auxNum_(v[i][b.sc]);
      if (d > maxd) maxd = d;
    }
    var yr0 = +maxd.slice(0, 4), curMonth = +maxd.slice(5, 7), curDay = +maxd.slice(8, 10);
    var pyCut = maxd ? ((yr0 - 1) + maxd.slice(4)) : '';
    var monthly = {}, lifetime = 0, ytd = 0, pytd = 0, mtd = 0;
    Object.keys(daily).forEach(function (d) {
      var amt = daily[d]; lifetime += amt;
      monthly[d.slice(0, 7)] = (monthly[d.slice(0, 7)] || 0) + amt;
      var y = +d.slice(0, 4);
      if (y === yr0) { ytd += amt; if (+d.slice(5, 7) === curMonth) mtd += amt; }
      else if (y === yr0 - 1 && d <= pyCut) pytd += amt;
    });
    var years = [yr0, yr0 - 1, yr0 - 2, yr0 - 3];
    var ytdRun = {}, mtdRun = {};
    years.forEach(function (Y) {
      var wsum = {}, dsum = {}, has = false;
      Object.keys(daily).forEach(function (d) {
        if (+d.slice(0, 4) !== Y) return; has = true;
        var wk = Math.floor((doy_(d) - 1) / 7) + 1;
        wsum[wk] = (wsum[wk] || 0) + daily[d];
        if (+d.slice(5, 7) === curMonth) dsum[+d.slice(8, 10)] = (dsum[+d.slice(8, 10)] || 0) + daily[d];
      });
      if (!has) return;
      var c = 0, wa = []; for (var w = 1; w <= 53; w++) { if (wsum[w] != null) c += wsum[w]; wa.push(Math.round(c)); }
      var c2 = 0, da = []; for (var dd = 1; dd <= 31; dd++) { if (dsum[dd] != null) c2 += dsum[dd]; da.push(Math.round(c2)); }
      ytdRun[Y] = wa; mtdRun[Y] = da;
    });
    var g = WEBSITE_GOALS[b.name], annualGoal = 0, ytdGoal = 0, monthGoal = 0;
    if (g) { for (var mm = 1; mm <= 12; mm++) { annualGoal += g.m[mm - 1]; if (mm <= curMonth) ytdGoal += g.m[mm - 1]; } monthGoal = g.m[curMonth - 1]; }
    var mk = Object.keys(monthly).sort();
    return {
      name: b.name, currency: b.cur, symbol: b.sym, asof: maxd, cur_month: curMonth,
      cur_week: Math.floor((doy_(maxd) - 1) / 7) + 1, cur_day: curDay,
      ytd: Math.round(ytd), pytd: Math.round(pytd), lifetime: Math.round(lifetime), mtd: Math.round(mtd),
      annual_goal: annualGoal, ytd_goal: ytdGoal, month_goal: monthGoal,
      monthly: mk.slice(-13).map(function (m) { return { m: m, v: Math.round(monthly[m]) }; }),
      years: years, ytd_run: ytdRun, mtd_run: mtdRun
    };
  });
  return { ok: true, stores: stores };
}

// ============================ RETAIL ============================
function buildAuxRetail_() {
  var v = auxSheet_(AUX_CONFIG.SHOPIFY_TAB);
  if (!v) return { ok: false, note: 'Shopify Sheet1 not found.' };
  var H = v[1] || [], iLoc = -1;
  for (var h = 0; h < H.length; h++) if (String(H[h] || '').indexOf('Physical location') >= 0) { iLoc = h; break; }
  if (iLoc < 0) return { ok: false, note: 'Retail block not found in Sheet1.' };
  var iGross = iLoc + 1, iNet = iLoc + 2, iOrders = iLoc + 3, iDay = iLoc + 6;
  var byStore = {}, totNet = 0, totOrd = 0, maxMonth = '', maxDay = '';
  
  for (var i = 2; i < v.length; i++) {
    var loc = String(v[i][iLoc] || '').trim(); if (!loc) continue;
    if (!byStore[loc]) byStore[loc] = { loc: loc, net: 0, gross: 0, orders: 0, monthly: {}, daily: {} };
    var s = byStore[loc], net = auxNum_(v[i][iNet]);
    s.net += net; s.gross += auxNum_(v[i][iGross]); s.orders += Math.round(auxNum_(v[i][iOrders]));
    var day = String(v[i][iDay] || '').trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(day)) { 
      var m = day.slice(0, 7); 
      s.monthly[m] = (s.monthly[m] || 0) + net; 
      s.daily[day] = (s.daily[day] || 0) + net;
      if (m > maxMonth) maxMonth = m; 
      if (day > maxDay) maxDay = day;
    }
  }
  
  var curMonth = maxMonth;
  var d14_arr = [];
  if (maxDay) {
      var d14_d = new Date(maxDay + 'T12:00:00Z');
      for (var d_i=13; d_i>=0; d_i--) {
          var past = new Date(d14_d.getTime() - d_i*86400000);
          d14_arr.push(past.toISOString().slice(0,10));
      }
  }

  var w10_arr = [];
  if (maxDay) {
      var w10_d = new Date(maxDay + 'T12:00:00Z');
      var dayOfWeek = w10_d.getUTCDay();
      var diffToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      var mon = new Date(w10_d.getTime() - diffToMon*86400000);
      for (var w_i=9; w_i>=0; w_i--) {
          var pastWeek = new Date(mon.getTime() - w_i*7*86400000);
          w10_arr.push('Wk of ' + pastWeek.toISOString().slice(5,10));
      }
  }

  var stores = Object.keys(byStore).map(function (loc) {
    var s = byStore[loc]; totNet += s.net; totOrd += s.orders;
    var mk = Object.keys(s.monthly).sort();
    
    var wmap = {};
    Object.keys(s.daily).forEach(function(dy) {
         var dt = new Date(dy + 'T12:00:00Z');
         var dow = dt.getUTCDay();
         var dtm = dow === 0 ? 6 : dow - 1;
         var mdt = new Date(dt.getTime() - dtm*86400000);
         var wkStr = 'Wk of ' + mdt.toISOString().slice(5,10);
         wmap[wkStr] = (wmap[wkStr] || 0) + s.daily[dy];
    });

    return {
      loc: loc, net: Math.round(s.net), gross: Math.round(s.gross), orders: s.orders,
      mtd: Math.round(s.monthly[curMonth] || 0), month_goal: RETAIL_MONTHLY_GOAL,
      monthly: mk.slice(-13).map(function (m) { return { m: m, v: Math.round(s.monthly[m]) }; }),
      daily: d14_arr.map(function(d) { return { d: d, v: Math.round(s.daily[d]||0) }; }),
      weekly: w10_arr.map(function(w) { return { w: w, v: Math.round(wmap[w]||0) }; })
    };
  }).sort(function (a, b) { return b.net - a.net; });
  
  var mset = {}; stores.forEach(function (s) { s.monthly.forEach(function (x) { mset[x.m] = 1; }); });
  var months = Object.keys(mset).sort().slice(-13);
  return { ok: true, total_net: Math.round(totNet), total_orders: totOrd, cur_month: curMonth, monthly_goal: RETAIL_MONTHLY_GOAL, months: months, d14: d14_arr, w10: w10_arr, stores: stores };
}

// ============================ HELPERS ============================
function auxSheet_(tabName) {
  var sh = SpreadsheetApp.openById(AUX_CONFIG.SPREADSHEET_ID).getSheetByName(tabName);
  if (!sh) return null;
  var v = sh.getDataRange().getDisplayValues();
  return v && v.length > 1 ? v : null;
}
function auxLatestEmailCsv_(subject) {
  var q = 'from:' + AUX_CONFIG.EMAIL_SENDER + ' subject:"' + subject + '" has:attachment newer_than:7d';
  var threads = GmailApp.search(q, 0, 10), best = null, bestWhen = 0;
  threads.forEach(function (th) {
    th.getMessages().forEach(function (m) {
      if (m.getSubject().indexOf(subject) === -1) return;
      var when = m.getDate().getTime();
      m.getAttachments().forEach(function (a) {
        var nm = (a.getName() || '').toLowerCase();
        if ((nm.indexOf('.csv') >= 0 || (a.getContentType() || '').indexOf('csv') >= 0) && when > bestWhen) { bestWhen = when; best = a; }
      });
    });
  });
  return best ? best.getDataAsString() : null;
}
function auxNum_(s) {
  if (s == null) return 0;
  s = String(s).trim(); if (!s || s === '-') return 0;
  s = s.replace(/[$€£¥,]/g, '');
  var neg = false;
  if (s.charAt(0) === '(' && s.charAt(s.length - 1) === ')') { neg = true; s = s.slice(1, -1); }
  if (s.charAt(0) === '-') { neg = true; s = s.slice(1); }
  var n = parseFloat(s); if (isNaN(n)) return 0;
  return neg ? -n : n;
}
function doy_(d) {
  var y = +d.slice(0, 4), m = +d.slice(5, 7), day = +d.slice(8, 10);
  var cum = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  var leap = (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 1 : 0;
  return cum[m - 1] + day + (m > 2 ? leap : 0);
}