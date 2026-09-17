/**
 * Black Clover — Partner Portal (Enterprise Rep Build)
 * ------------------------------------------------------------------------------
 */

var PORTAL_CONFIG = {
  ROSTER_SHEET_ID: '173-dWLJDJZZcdvbJy9RfHJNQ-W3zd2IozJlxSumYmDA', 
  PROJECT_ID: 'amazing-modem-499019-v1',
  VIEW: '`amazing-modem-499019-v1.partner_dashboard_dev.dashboard_final`',
  LOCATION: 'US',
  MAX_BYTES: '500000000',
  CACHE_KEY: 'partner_portal_v6',
  APP_TITLE: 'Black Clover — Partner Portal'
};

function doGet() {
  var user = getUserProfile_();
  if (!user.authorized) {
    return HtmlService.createHtmlOutput(
      '<div style="font-family:sans-serif;padding:40px;text-align:center;">' +
      '<h2>Access Denied</h2><p>Your email (' + Session.getActiveUser().getEmail() + ') is not authorized for the Partner Portal.</p>' +
      '<p>Please contact your system administrator.</p></div>'
    );
  }
  var t = HtmlService.createTemplateFromFile('Index');
  return t.evaluate()
    .setTitle(PORTAL_CONFIG.APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'); 
}

function getUserProfile_() {
  var email = Session.getActiveUser().getEmail().toLowerCase();
  var cache = CacheService.getScriptCache();
  
  var cachedProfile = cache.get('auth_' + email);
  if (cachedProfile) return JSON.parse(cachedProfile);

  var sheet = SpreadsheetApp.openById(PORTAL_CONFIG.ROSTER_SHEET_ID).getSheetByName('Access List');
  if(!sheet) throw new Error("Could not find tab named 'Access List' in Admin Sheet.");
  var data = sheet.getDataRange().getValues();
  
  var profile = { authorized: false, role: 'NONE', netsuiteName: null, email: email };
  
  for (var i = 1; i < data.length; i++) {
    if(!data[i][0]) continue;
    var sheetEmail = String(data[i][0]).toLowerCase().trim();
    var repName = String(data[i][1]).trim();
    var role = String(data[i][2]).toUpperCase().trim();

    if (sheetEmail === email || role === 'OWNER' || role === 'ADMIN') {
      profile.authorized = true;
      profile.netsuiteName = repName;
      profile.role = (role === 'OWNER' || role === 'ADMIN') ? 'ADMIN' : role; 
      break; // Found the user, stop searching
    }
  }

  if (profile.authorized) cache.put('auth_' + email, JSON.stringify(profile), 900); 
  return profile;
}

function getSecurityFilter_(requestedRep) {
  var user = getUserProfile_();
  if (!user.authorized) throw new Error("unauthorized");
  
  if (user.role === 'ADMIN') {
    if (requestedRep && requestedRep !== 'ALL') {
       return { sql: 'sales_rep = @repName', param: qp_('repName', 'STRING', requestedRep) };
    }
    return { sql: '1=1', param: null }; 
  } else {
    // Reps are locked to their own NetSuite Name
    return { sql: 'sales_rep = @repName', param: qp_('repName', 'STRING', user.netsuiteName) };
  }
}

/**
 * Main Data Fetcher
 */
function getDashboardData(requestedRep, forceRefresh) {
  try {
    var user = getUserProfile_();
    if (!user.authorized) throw new Error("unauthorized");
    var activeRep = (user.role === 'ADMIN' && requestedRep) ? requestedRep : user.netsuiteName;
    
    // Cache Key safe-formatting
    var cleanRep = String(activeRep).replace(/[^a-zA-Z0-9]/g, '');
    var cacheKey = PORTAL_CONFIG.CACHE_KEY + '_' + cleanRep;
    
    var cache = CacheService.getScriptCache();
    if (!forceRefresh) {
      var cachedData = cache.get(cacheKey);
      if (cachedData) return cachedData; 
    }

    var sec = getSecurityFilter_(requestedRep);
    var params = sec.param ? [sec.param] : [];
    var whereClause = ' WHERE ' + sec.sql + ' ';
    var V = PORTAL_CONFIG.VIEW;
    
    // ADMIN UPGRADE: Fetch all valid reps directly from BQ for the dropdown
    var allReps = [];
    if (user.role === 'ADMIN') {
       var repsQuery = runQuery_('SELECT DISTINCT sales_rep FROM ' + V + ' WHERE sales_rep IS NOT NULL ORDER BY sales_rep');
       allReps = repsQuery.map(function(r){ return String(r.sales_rep); });
    }

    var kpis = runQuery_(
      'SELECT ' +
      ' ROUND(SUM(IF(is_ytd, decision_net_sales_usd, 0)),0) AS ytd,' +
      ' ROUND(SUM(IF(is_pytd, decision_net_sales_usd, 0)),0) AS pytd,' +
      ' ROUND(SUM(IF(is_ytd, open_backlog_usd, 0)),0) AS backlog,' +
      ' ROUND(SUM(IF(revenue_bucket = "return" AND is_ytd, amount_net_usd, 0)),0) AS returns_ytd,' +
      ' ROUND(SUM(IF(revenue_bucket != "return" AND revenue_bucket != "cancelled" AND is_ytd, amount_net_usd, 0)),0) AS gross_ytd,' +
      ' COUNT(DISTINCT IF(is_ytd, internal_id, NULL)) AS ytd_orders ' +
      'FROM ' + V + whereClause, params)[0];

    var customers = runQuery_(
      'SELECT customer_id, ANY_VALUE(customer_name) AS name, ANY_VALUE(ship_state) AS state, ' +
      ' ROUND(SUM(decision_net_sales_usd),0) AS lifetime_usd, ' +
      ' ROUND(SUM(IF(is_ytd, decision_net_sales_usd, 0)),0) AS ytd_usd, ' +
      ' ROUND(SUM(IF(is_pytd, decision_net_sales_usd, 0)),0) AS pytd_usd, ' +
      ' COUNT(DISTINCT internal_id) AS orders, ' +
      ' CAST(MAX(order_date) AS STRING) AS last_order_date, ' +
      ' DATE_DIFF(CURRENT_DATE(), MAX(order_date), DAY) AS days_since_order, ' +
      ' LOGICAL_OR(is_new_customer_ytd) AS is_new ' +
      'FROM ' + V + whereClause + ' AND customer_id IS NOT NULL ' +
      'GROUP BY customer_id ORDER BY ytd_usd DESC LIMIT 200', params);
      
    var exceptions = runQuery_(
      'SELECT status_canonical, COUNT(DISTINCT internal_id) as orders, ROUND(SUM(decision_net_sales_usd),0) as val ' +
      'FROM ' + V + whereClause + 
      ' AND status_canonical IN ("Pending Approval", "Pending Fulfillment", "Partially Fulfilled", "Pending Billing", "Pending Receipt") ' +
      'GROUP BY status_canonical', params);

    var trend = runQuery_(
      'SELECT SUBSTR(CAST(order_date AS STRING), 1, 7) AS m, ROUND(SUM(decision_net_sales_usd),0) AS v ' +
      'FROM ' + V + whereClause + ' AND order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 365 DAY) ' +
      'GROUP BY m ORDER BY m', params);

    var categories = runQuery_(
      'SELECT IFNULL(category, "Other") AS k, ROUND(SUM(decision_net_sales_usd),0) AS v ' +
      'FROM ' + V + whereClause + ' AND is_ytd = true ' +
      'GROUP BY k ORDER BY v DESC LIMIT 8', params);

    var payload = JSON.stringify({
      ok: true, user: user,
      allReps: allReps, // Sends full DB list to Admin
      activeRep: activeRep,
      kpis: kpis, customers: customers, exceptions: exceptions,
      trend: trend, categories: categories,
      asof: new Date().toISOString()
    });
    
    if (payload.length < 100000) { cache.put(cacheKey, payload, 900); }
    return payload;
  } catch(e) {
    return JSON.stringify({ ok: false, error: String(e && e.message || e) });
  }
}

function getOrders(paramsJson) {
  try {
    var p = JSON.parse(paramsJson || '{}');
    var where = []; var params = [];
    
    var sec = getSecurityFilter_(p.rep);
    where.push(sec.sql); if (sec.param) params.push(sec.param);

    if (p.status && p.status !== 'all' && p.status !== 'All') {
      where.push('status_canonical = @status'); params.push(qp_('status', 'STRING', String(p.status)));
    }
    if (p.customer && p.customer !== 'all' && p.customer !== 'All') {
      where.push('customer_id = @customer'); params.push(qp_('customer', 'STRING', String(p.customer)));
    }
    if (p.search) {
      where.push('(LOWER(customer_name) LIKE @s OR LOWER(document_number) LIKE @s)');
      params.push(qp_('s', 'STRING', '%' + String(p.search).toLowerCase() + '%'));
    }

    var whereSql = where.join(' AND ');
    var limit = Math.min(Number(p.limit) || 30, 100);
    var page = Math.max(Number(p.page) || 1, 1);
    var total = Number(scalarParams_('SELECT COUNT(1) AS v FROM ' + PORTAL_CONFIG.VIEW + ' WHERE ' + whereSql, params));

    var rows = runQuery_(
      'SELECT document_number, CAST(order_date AS STRING) AS order_date, ' +
      ' customer_name, IFNULL(customer_email, "") AS customer_email, ROUND(decision_net_sales_usd,2) AS net_usd, ' +
      ' status_canonical, IFNULL(first_tracking, "") AS tracking, IFNULL(carrier, "") AS carrier, ' +
      ' days_to_ship ' +
      ' FROM ' + PORTAL_CONFIG.VIEW + ' WHERE ' + whereSql +
      ' ORDER BY order_date DESC, document_number DESC ' +
      ' LIMIT ' + limit + ' OFFSET ' + ((page - 1) * limit), params
    );
    
    return JSON.stringify({ ok: true, rows: rows, total: total, page: page, pages: Math.max(Math.ceil(total / limit), 1) });
  } catch (e) {
    return JSON.stringify({ ok: false, error: String(e && e.message || e) });
  }
}

function runQuery_(sql, params) {
  var request = { query: sql, useLegacySql: false, location: PORTAL_CONFIG.LOCATION, maximumBytesBilled: PORTAL_CONFIG.MAX_BYTES, timeoutMs: 120000 };
  if (params && params.length) { request.parameterMode = 'NAMED'; request.queryParameters = params; }
  var res = BigQuery.Jobs.query(request, PORTAL_CONFIG.PROJECT_ID);
  var jobId = res.jobReference.jobId, loc = res.jobReference.location;
  var tries = 0;
  while (!res.jobComplete) {
    if (++tries > 120) throw new Error('BigQuery timeout.');
    Utilities.sleep(1000);
    res = BigQuery.Jobs.getQueryResults(PORTAL_CONFIG.PROJECT_ID, jobId, { location: loc, timeoutMs: 60000 });
  }
  var fields = (res.schema && res.schema.fields) || []; var rows = res.rows || [];
  while (res.pageToken) {
    res = BigQuery.Jobs.getQueryResults(PORTAL_CONFIG.PROJECT_ID, jobId, { location: loc, pageToken: res.pageToken });
    rows = rows.concat(res.rows || []);
  }
  return rows.map(function (r) {
    var obj = {};
    fields.forEach(function (f, i) {
      var v = r.f[i].v; if (v === null || v === undefined) { obj[f.name] = null; return; }
      switch (f.type) {
        case 'INTEGER': case 'INT64': case 'FLOAT': case 'FLOAT64': case 'NUMERIC': case 'BIGNUMERIC': obj[f.name] = Number(v); break;
        case 'BOOLEAN': case 'BOOL': obj[f.name] = (v === 'true' || v === true); break;
        default: obj[f.name] = String(v);
      }
    }); return obj;
  });
}
function scalarParams_(sql, params) { var r = runQuery_(sql, params); return r.length ? r[0].v : null; }
function qp_(name, type, value) { return { name: name, parameterType: { type: type }, parameterValue: { value: String(value) } }; }