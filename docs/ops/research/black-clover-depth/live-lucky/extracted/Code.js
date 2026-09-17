/**
 * Black Clover — Executive Intelligence (Enterprise Final Build · brand-scoped)
 * ------------------------------------------------------------------------------
 * Single data source: amazing-modem-499019-v1.partner_dashboard_dev.dashboard_final
 */

var CONFIG = {
  PROJECT_ID: 'amazing-modem-499019-v1',
  VIEW: '`amazing-modem-499019-v1.partner_dashboard_dev.dashboard_final`',
  FACT: '`amazing-modem-499019-v1.partner_dashboard_dev.fact_partner_orders_certified`',
  LOCATION: 'US',
  MAX_BYTES: '500000000',
  CACHE_TTL_SEC: 21600,            
  CACHE_KEY: 'payload_v12',        
  BRANDS: ['all', 'bc', 'cmc'],
  ALLOWED_USERS: ['marty@blackcloverusa.com', 'john@blackcloverusa.com', 'steven@blackcloverusa.com'],
  APP_TITLE: 'Canvas Dash — Executive Intelligence'
};

function doGet() {
  var email = Session.getActiveUser().getEmail();
  if (CONFIG.ALLOWED_USERS.length && CONFIG.ALLOWED_USERS.indexOf(email) === -1) {
    return HtmlService.createHtmlOutput(
      '<div style="font-family:sans-serif;padding:40px"><h2>Access restricted</h2>' +
      '<p>' + (email || 'Your account') + ' is not on the access list.</p></div>');
  }
  var t = HtmlService.createTemplateFromFile('Index');
  return t.evaluate()
    .setTitle(CONFIG.APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function assertAuth_() {
  if (!CONFIG.ALLOWED_USERS.length) return;
  var email = Session.getActiveUser().getEmail();
  if (CONFIG.ALLOWED_USERS.indexOf(email) === -1) throw new Error('unauthorized');
}

function normBrand_(b) {
  b = String(b || 'all').toLowerCase();
  return (b === 'bc' || b === 'cmc') ? b : 'all';
}

function getDashboardData(brand, force) {
  try {
    assertAuth_();
    brand = normBrand_(brand);
    var key = CONFIG.CACHE_KEY + '_' + brand;
    if (!force) {
      var cached = cacheGetChunked_(key);
      if (cached) return cached;
    }
    return buildAndCachePayload_(brand, !!force);
  } catch (e) {
    return JSON.stringify({ ok: false, error: String(e && e.message || e) });
  }
}

function getOrders(paramsJson) {
  try {
    assertAuth_();
    var p = JSON.parse(paramsJson || '{}');
    var where = ['1=1'];
    var params = [];

    var brand = normBrand_(p.brand);
    if (brand !== 'all') { where.push('brand_code = @brand'); params.push(qp_('brand', 'STRING', brand)); }

    if (p.status && p.status !== 'all' && p.status !== 'All') {
      where.push('status_canonical = @status'); params.push(qp_('status', 'STRING', String(p.status)));
    }
    if (p.partner && p.partner !== 'all' && p.partner !== 'All') {
      where.push('canonical_partner = @partner'); params.push(qp_('partner', 'STRING', String(p.partner)));
    }
    if (p.channel && p.channel !== 'all' && p.channel !== 'All') {
      where.push('sales_channel = @channel'); params.push(qp_('channel', 'STRING', String(p.channel)));
    }
    if (p.category && p.category !== 'all' && p.category !== 'All') {
      where.push('category = @category'); params.push(qp_('category', 'STRING', String(p.category)));
    }
    if (p.rep && p.rep !== 'all' && p.rep !== 'All') {
      where.push('sales_rep = @rep'); params.push(qp_('rep', 'STRING', String(p.rep)));
    }

    var month = p.month;
    if (!month) month = latestMonth_();
    if (month && month !== 'All') {
      if (!/^\d{4}-\d{2}$/.test(month)) throw new Error('bad month');
      where.push("order_date >= DATE(CONCAT(@month,'-01')) AND order_date < DATE_ADD(DATE(CONCAT(@month,'-01')), INTERVAL 1 MONTH)");
      params.push(qp_('month', 'STRING', month));
    }
    if (p.search) {
      where.push('(LOWER(customer_name) LIKE @s OR LOWER(document_number) LIKE @s)');
      params.push(qp_('s', 'STRING', '%' + String(p.search).toLowerCase() + '%'));
    }

    var whereSql = where.join(' AND ');
    var limit = Math.min(Number(p.limit) || 25, 100);
    var page = Math.max(Number(p.page) || 1, 1);
    var total = Number(scalarParams_('SELECT COUNT(1) AS v FROM ' + CONFIG.VIEW + ' WHERE ' + whereSql, params));

    var rows = runQuery_(
      'SELECT document_number, CAST(order_date AS STRING) AS order_date, brand_canonical, sales_channel,' +
      ' canonical_partner, category, IFNULL(sales_rep, \'Unassigned\') as sales_rep, customer_name, ROUND(decision_net_sales_usd,2) AS net_usd,' +
      ' status_canonical, IFNULL(first_tracking, \'\') AS first_tracking, IFNULL(carrier, \'\') AS carrier,' +
      ' days_to_ship, IFNULL(ship_state, \'NA\') AS ship_state' +
      ' FROM ' + CONFIG.VIEW + ' WHERE ' + whereSql +
      ' ORDER BY order_date DESC, document_number DESC' +
      ' LIMIT ' + limit + ' OFFSET ' + ((page - 1) * limit),
      params
    );
    return JSON.stringify({ ok: true, rows: rows, total: total, page: page, pages: Math.max(Math.ceil(total / limit), 1) });
  } catch (e) {
    return JSON.stringify({ ok: false, error: String(e && e.message || e) });
  }
}

function latestMonth_() {
  var cache = CacheService.getScriptCache();
  var m = cache.get('asof_month_v6');
  if (m) return m;
  m = String(scalar_('SELECT FORMAT_DATE(\'%Y-%m\', MAX(data_through)) AS v FROM ' + CONFIG.VIEW));
  if (/^\d{4}-\d{2}$/.test(m)) cache.put('asof_month_v6', m, 3600);
  return m;
}

function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'hourlyRefresh') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('hourlyRefresh').timeBased().everyHours(1).create();
}

var FACT_BUILD_SQL = "CREATE OR REPLACE TABLE `amazing-modem-499019-v1.partner_dashboard_dev.fact_partner_orders_certified`\n    PARTITION BY order_date\n    CLUSTER BY brand_canonical, category, rep_lead, sales_channel\n    OPTIONS(description='Certified fact layer for partner sales orders. Auto-rebuilt hourly by Apps Script when upstream changes. built_at = rebuild time (UTC).')\n    AS (\n\nWITH overrides AS (\n  SELECT\n    stg.internal_id,\n    m.partner AS override_partner,\n    m.partner_category AS override_category,\n    m.partner_rep_lead AS override_rep_lead,\n    ROW_NUMBER() OVER(PARTITION BY stg.internal_id ORDER BY m.priority ASC) AS rn\n  FROM `amazing-modem-499019-v1.partner_dashboard_dev.stg_partner_sales_typed` stg\n  INNER JOIN `amazing-modem-499019-v1.reference.account_partner_map` m\n    ON LOWER(stg.customer_name) LIKE CONCAT('%', LOWER(m.pattern), '%')\n  WHERE stg.partner_raw IS NULL\n),\n\noverrides_filtered AS (\n  SELECT * FROM overrides WHERE rn = 1\n),\n\nfact_prep AS (\n  SELECT\n    stg.internal_id,\n    stg.document_number,\n    stg.customer_id,\n    stg.customer_name,\n    stg.customer_email,\n    stg.sales_rep,\n    stg.partner_raw,\n    stg.order_date,\n    stg.ship_date,\n    stg.days_to_ship,\n    stg.status_raw,\n    stg.status_canonical,\n    stg.transaction_type,\n    stg.subsidiary_raw AS subsidiary,\n    stg.brand_canonical,\n    stg.tracking_numbers,\n    stg.has_tracking,\n    stg.ship_state,\n    stg.ship_zip,\n    stg.ship_country,\n    stg.amount_net_usd,\n\n    CASE \n      WHEN stg.partner_raw IS NOT NULL THEN stg.partner\n      WHEN ovr.override_partner IS NOT NULL THEN ovr.override_partner\n      ELSE 'Direct / House'\n    END AS canonical_partner,\n\n    CASE \n      WHEN stg.partner_raw IS NOT NULL THEN stg.category\n      WHEN ovr.override_partner IS NOT NULL THEN ovr.override_category\n      ELSE 'Direct / House'\n    END AS category,\n\n    CASE \n      WHEN stg.partner_raw IS NOT NULL THEN stg.rep_lead\n      WHEN ovr.override_partner IS NOT NULL THEN ovr.override_rep_lead\n      ELSE 'Direct / House'\n    END AS rep_lead,\n\n    CASE\n      WHEN stg.partner_raw IS NOT NULL THEN 'mapped'\n      WHEN ovr.override_partner IS NOT NULL THEN 'recovered'\n      ELSE 'dtc'\n    END AS mapping_status,\n\n    CASE\n      WHEN stg.status_canonical = 'Cancelled' THEN 'cancelled'\n      WHEN stg.status_canonical IN ('Refunded', 'Pending Refund') OR stg.transaction_type IN ('Return Authorization', 'Credit Memo') THEN 'return'\n      WHEN stg.status_canonical = 'Closed' AND stg.has_tracking IS TRUE THEN 'closed_shipped'\n      WHEN stg.status_canonical = 'Closed' AND stg.ship_date IS NOT NULL AND stg.has_tracking IS FALSE THEN 'closed_pending'\n      WHEN stg.status_canonical = 'Closed' AND stg.ship_date IS NULL AND stg.has_tracking IS FALSE THEN 'closed_unshipped'\n      ELSE 'revenue'\n    END AS revenue_bucket,\n\n    CASE\n      WHEN UPPER(TRIM(stg.ship_country)) IN ('US', 'USA', 'UNITED STATES', 'UNITED STATES OF AMERICA', 'DOMESTIC', 'PR', 'PUERTO RICO', 'GUAM', 'VI', 'VIRGIN ISLANDS', 'U.S.', 'U.S.A.') THEN 'Domestic'\n      WHEN UPPER(TRIM(stg.ship_country)) IN ('CA', 'CAN', 'CANADA') THEN 'Canada'\n      WHEN UPPER(TRIM(stg.ship_country)) IN ('GB', 'UK', 'UNITED KINGDOM', 'GREAT BRITAIN', 'ENGLAND', 'SCOTLAND') THEN 'UK'\n      WHEN UPPER(TRIM(stg.ship_country)) IN ('AE', 'ARE', 'UAE', 'UNITED ARAB EMIRATES', 'IL', 'ISR', 'ISRAEL', 'DUBAI') THEN 'Dubai/ME'\n      WHEN UPPER(TRIM(stg.ship_country)) IN ('JP', 'JPN', 'JAPAN', 'SG', 'SGP', 'SINGAPORE', 'KR', 'KOR', 'KOREA', 'SOUTH KOREA', 'CN', 'CHN', 'CHINA', 'IN', 'IND', 'INDIA', 'KH', 'KHM', 'CAMBODIA', 'TW', 'TWN', 'TAIWAN') THEN 'Asia'\n      WHEN UPPER(TRIM(stg.ship_country)) IN ('ZA', 'ZAF', 'SOUTH AFRICA', 'MU', 'MUS', 'MAURITIUS') THEN 'Africa'\n      WHEN UPPER(TRIM(stg.ship_country)) IN ('MX', 'MEX', 'MEXICO', 'BR', 'BRA', 'BRAZIL', 'AR', 'ARG', 'ARGENTINA', 'CO', 'COL', 'COLOMBIA', 'CL', 'CHL', 'CHILE', 'PE', 'PER', 'PERU') THEN 'LATAM'\n      WHEN UPPER(TRIM(stg.ship_country)) IN ('ES', 'ESP', 'SPAIN', 'FI', 'FIN', 'FINLAND', 'IE', 'IRL', 'IRELAND', 'CH', 'CHE', 'SWITZERLAND', 'IT', 'ITA', 'ITALY', 'DK', 'DNK', 'DENMARK', 'BE', 'BEL', 'BELGIUM', 'DE', 'DEU', 'GERMANY', 'FR', 'FRA', 'FRANCE', 'PT', 'PRT', 'PORTUGAL', 'AT', 'AUT', 'AUSTRIA', 'SE', 'SWE', 'SWEDEN', 'NL', 'NLD', 'NETHERLANDS', 'NO', 'NOR', 'NORWAY', 'PL', 'POL', 'POLAND', 'GR', 'GRC', 'GREECE', 'EUROPE') THEN 'Europe'\n      ELSE 'Other International'\n    END AS subregion,\n\n    CASE\n      WHEN UPPER(TRIM(stg.ship_country)) IN ('US', 'USA', 'UNITED STATES', 'UNITED STATES OF AMERICA', 'DOMESTIC', 'PR', 'PUERTO RICO', 'GUAM', 'VI', 'VIRGIN ISLANDS', 'U.S.', 'U.S.A.') THEN FALSE\n      ELSE TRUE\n    END AS is_international,\n\n    (stg.has_tracking IS FALSE OR stg.tracking_numbers IS NULL) AS is_missing_tracking,\n    (stg.ship_date < stg.order_date) AS is_ship_before_order,\n\n    ROW_NUMBER() OVER(PARTITION BY stg.document_number ORDER BY stg.order_date ASC, stg.internal_id ASC) > 1 AS is_duplicate_document\n\n  FROM `amazing-modem-499019-v1.partner_dashboard_dev.stg_partner_sales_typed` stg\n  LEFT JOIN overrides_filtered ovr\n    ON stg.internal_id = ovr.internal_id\n)\n\nSELECT\n  internal_id,\n  document_number,\n  customer_id,\n  customer_name,\n  customer_email,\n  sales_rep,\n  partner_raw,\n  canonical_partner,\n  category,\n  rep_lead,\n  mapping_status,\n  order_date,\n  ship_date,\n  days_to_ship,\n  status_raw,\n  status_canonical,\n  transaction_type,\n  subsidiary,\n  brand_canonical,\n  tracking_numbers,\n  has_tracking,\n  is_missing_tracking,\n  is_ship_before_order,\n  is_duplicate_document,\n  ship_state,\n  ship_zip,\n  ship_country,\n  is_international,\n  subregion,\n  revenue_bucket,\n\n  CAST(CASE WHEN revenue_bucket = 'cancelled' THEN amount_net_usd ELSE 0 END AS NUMERIC) AS cancelled_usd,\n  CAST(CASE WHEN revenue_bucket = 'return' THEN amount_net_usd ELSE 0 END AS NUMERIC) AS returns_usd,\n  CAST(CASE WHEN revenue_bucket = 'closed_shipped' THEN amount_net_usd ELSE 0 END AS NUMERIC) AS closed_shipped_usd,\n  CAST(CASE WHEN revenue_bucket = 'closed_pending' THEN amount_net_usd ELSE 0 END AS NUMERIC) AS closed_pending_usd,\n  CAST(CASE WHEN revenue_bucket = 'closed_unshipped' THEN amount_net_usd ELSE 0 END AS NUMERIC) AS closed_unshipped_usd,\n  CAST(CASE WHEN revenue_bucket NOT IN ('cancelled', 'return') THEN amount_net_usd ELSE 0 END AS NUMERIC) AS bookings_gross_usd,\n  CAST(CASE WHEN revenue_bucket = 'closed_shipped' OR (revenue_bucket = 'revenue' AND status_canonical = 'Billed') THEN amount_net_usd ELSE 0 END AS NUMERIC) AS recognized_revenue_usd,\n  CAST(CASE WHEN revenue_bucket != 'cancelled' THEN amount_net_usd ELSE 0 END AS NUMERIC) AS decision_net_sales_usd,\n  CAST(CASE WHEN revenue_bucket = 'revenue' AND status_canonical != 'Billed' THEN amount_net_usd ELSE 0 END AS NUMERIC) AS open_backlog_usd,\n\n  CASE\n    WHEN canonical_partner != 'Direct / House' THEN 'Partner/Wholesale'\n    WHEN customer_email LIKE '%marketplace.amazon.com%' THEN 'Amazon'\n    WHEN customer_email LIKE '%topgolf.coupahost.com%' THEN 'Corporate portal'\n    WHEN REGEXP_CONTAINS(customer_email, r'@(gmail\\.com|yahoo\\.com|hotmail\\.com|aol\\.com|icloud\\.com|msn\\.com|outlook\\.com|live\\.com|comcast\\.net|cox\\.net|charter\\.net|sbcglobal\\.net|bellsouth\\.net|verizon\\.net|att\\.net|earthlink\\.net|optonline\\.net|mail\\.com|email\\.com)$') THEN\n      CASE WHEN brand_canonical = 'CMC Design' THEN 'CMC Website' ELSE 'BC Website' END\n    ELSE 'Other DTC'\n  END AS sales_channel,\n\n  CURRENT_TIMESTAMP() AS built_at\n\nFROM fact_prep\n\n    )";

function rebuildFactIfStale_() {
  var up = runQuery_(
    'SELECT CAST(MAX(order_date) AS STRING) AS d, COUNT(*) AS n,' +
    " CAST(ROUND(SUM(CAST(COALESCE(amount_net, 0) AS NUMERIC)),2) AS STRING) AS total" +
    ' FROM `amazing-modem-499019-v1.cleaned_data.master_sales_live`')[0];
  var upSig = up.d + '|' + up.n + '|' + up.total;
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('upstream_sig') === upSig) return false;
  runQuery_(FACT_BUILD_SQL);
  props.setProperty('upstream_sig', upSig);
  return true;
}

function runFactRebuildNow() {
  PropertiesService.getScriptProperties().deleteProperty('upstream_sig');
  hourlyRefresh();
}

function hourlyRefresh() {
  try { rebuildFactIfStale_(); } catch (e) {}
  var probe = runQuery_('SELECT CAST(MAX(data_through) AS STRING) AS asof, COUNT(*) AS n,' +
    ' CAST(ROUND(SUM(decision_net_sales_usd),2) AS STRING) AS total FROM ' + CONFIG.VIEW);
  var sig = probe[0].asof + '|' + probe[0].n + '|' + probe[0].total;
  var props = PropertiesService.getScriptProperties();
  var last = props.getProperty('warehouse_sig');
  var haveAll = CONFIG.BRANDS.every(function (b) { return !!cacheGetChunked_(CONFIG.CACHE_KEY + '_' + b); });
  if (sig === last && haveAll) {
    CONFIG.BRANDS.forEach(function (b) { cacheRenew_(CONFIG.CACHE_KEY + '_' + b); });
    return;
  }
  CONFIG.BRANDS.forEach(function (b) {
    try { buildAndCachePayload_(b, true); } catch (e) {}
  });
  props.setProperty('warehouse_sig', sig);
}

function buildAndCachePayload_(brand, force) {
  brand = normBrand_(brand);
  var key = CONFIG.CACHE_KEY + '_' + brand;
  var lock = LockService.getScriptLock();
  lock.waitLock(180000);
  try {
    var props = PropertiesService.getScriptProperties();
    if (!force) {
      var builtAt = Number(props.getProperty('payload_built_at_' + brand) || 0);
      if (Date.now() - builtAt < 60000) {
        var fresh = cacheGetChunked_(key);
        if (fresh) return fresh;
      }
    }
    var json = buildPayload_(brand);
    cachePutChunked_(key, json);
    props.setProperty('payload_built_at_' + brand, String(Date.now()));
    return json;
  } finally {
    lock.releaseLock();
  }
}

function buildPayload_(brand) {
  brand = normBrand_(brand);
  var V = CONFIG.VIEW;
  var BW = (brand === 'all') ? '' : ("brand_code = '" + brand + "'");
  var AND_BW = BW ? (' AND ' + BW) : '';
  var WHERE_BW = BW ? (' WHERE ' + BW) : '';

  var k = runQuery_(
    'SELECT MAX(CAST(data_through AS STRING)) AS asof,' +
    ' ROUND(SUM(decision_net_sales_usd),0) AS lifetime,' +
    ' ROUND(SUM(IF(is_ytd, decision_net_sales_usd, 0)),0) AS ytd,' +
    ' ROUND(SUM(IF(is_pytd, decision_net_sales_usd, 0)),0) AS pytd,' +
    ' ROUND(SUM(IF(is_qtd, decision_net_sales_usd, 0)),0) AS qtd,' +
    ' ROUND(SUM(IF(is_pqtd, decision_net_sales_usd, 0)),0) AS pqtd,' +
    ' ROUND(SUM(IF(is_mtd, decision_net_sales_usd, 0)),0) AS mtd,' +
    ' ROUND(SUM(IF(is_pmtd, decision_net_sales_usd, 0)),0) AS pmtd,' +
    ' COUNT(DISTINCT IF(is_ytd, internal_id, NULL)) AS ytd_orders,' +
    ' COUNT(DISTINCT IF(is_pytd, internal_id, NULL)) AS pytd_orders,' +
    ' COUNT(DISTINCT IF(is_qtd, internal_id, NULL)) AS qtd_orders,' +
    ' COUNT(DISTINCT IF(is_pqtd, internal_id, NULL)) AS pqtd_orders,' +
    ' COUNT(DISTINCT IF(is_mtd, internal_id, NULL)) AS mtd_orders,' +
    ' COUNT(DISTINCT IF(is_pmtd, internal_id, NULL)) AS pmtd_orders,' +
    ' COUNT(DISTINCT IF(is_ytd, customer_id, NULL)) AS ytd_customers,' +
    ' COUNT(DISTINCT IF(is_pytd, customer_id, NULL)) AS pytd_customers,' +
    ' COUNT(DISTINCT IF(is_ytd AND is_new_customer_ytd, customer_id, NULL)) AS ytd_new_customers,' +
    ' ROUND(SUM(IF(is_ytd, bookings_gross_usd, 0)),0) AS bookings_ytd,' +
    ' ROUND(SUM(IF(is_ytd, recognized_revenue_usd, 0)),0) AS recognized_ytd,' +
    ' ROUND(SUM(IF(is_ytd, returns_usd, 0)),0) AS returns_ytd,' +
    ' ROUND(SUM(IF(is_ytd, cancelled_usd, 0)),0) AS cancelled_ytd,' +
    ' ROUND(SUM(IF(is_ytd, open_backlog_usd, 0)),0) AS backlog_ytd,' +
    ' ROUND(SUM(IF(is_py, decision_net_sales_usd, 0)),0) AS py_total,' +
    ' ROUND(SUM(IF(order_date = data_through, decision_net_sales_usd, 0)),0) AS today' +
    ' FROM ' + V + WHERE_BW)[0];

  var cube = runQuery_(
    'SELECT CAST(order_month AS STRING) AS m, canonical_partner AS p, category AS c, status_canonical AS s,' +
    ' brand_code AS b, sales_channel AS ch, revenue_bucket AS f, IFNULL(sales_rep, \'Unassigned\') AS sr,' +
    ' subregion AS r,' +
    ' ROUND(SUM(decision_net_sales_usd),2) AS v, COUNT(DISTINCT internal_id) AS o,' +
    ' ROUND(SUM(IF(is_pytd, decision_net_sales_usd, 0)),2) AS v_pytd,' +
    ' COUNT(DISTINCT IF(is_pytd, internal_id, NULL)) AS o_pytd,' +
    ' ROUND(SUM(IF(is_pqtd, decision_net_sales_usd, 0)),2) AS v_pqtd,' +
    ' COUNT(DISTINCT IF(is_pqtd, internal_id, NULL)) AS o_pqtd,' +
    ' ROUND(SUM(IF(is_pmtd, decision_net_sales_usd, 0)),2) AS v_pmtd,' +
    ' COUNT(DISTINCT IF(is_pmtd, internal_id, NULL)) AS o_pmtd' +
    ' FROM ' + V +
    ' WHERE order_date >= DATE_TRUNC(DATE_SUB((SELECT MAX(data_through) FROM ' + V + '), INTERVAL 2 YEAR), YEAR)' + AND_BW +
    ' GROUP BY 1,2,3,4,5,6,7,8,9');

  var partners = runQuery_(
    'WITH a AS (SELECT MAX(data_through) AS asof FROM ' + V + '),' +
    ' b AS (SELECT DATE_SUB(asof, INTERVAL MOD(EXTRACT(DAYOFWEEK FROM asof)+1,7) DAY) AS last_fri FROM a),' +
    ' goals AS (SELECT LOWER(TRIM(rep_name)) AS nm, MAX(annual_goal) AS annual_goal' +
    '   FROM `amazing-modem-499019-v1.reference.partner_goals_2026` GROUP BY 1)' +
    ' SELECT p.partner, p.category, p.ytd, p.pytd, p.lifetime, CAST(p.last_order AS STRING) AS last_order,' +
    '   p.week_net, p.last_week_net, IFNULL(g.annual_goal,0) AS annual_goal FROM (' +
    '   SELECT canonical_partner AS partner,' +
    '   IFNULL(ARRAY_AGG(category IGNORE NULLS ORDER BY order_date DESC LIMIT 1)[SAFE_OFFSET(0)], \'Unassigned\') AS category,' +
    '   ROUND(SUM(IF(is_ytd, decision_net_sales_usd, 0)),0) AS ytd,' +
    '   ROUND(SUM(IF(is_pytd, decision_net_sales_usd, 0)),0) AS pytd,' +
    '   ROUND(SUM(decision_net_sales_usd),0) AS lifetime,' +
    '   MAX(order_date) AS last_order,' +
    '   ROUND(SUM(IF(order_date BETWEEN DATE_SUB((SELECT last_fri FROM b), INTERVAL 6 DAY) AND (SELECT last_fri FROM b), decision_net_sales_usd, 0)),0) AS week_net,' +
    '   ROUND(SUM(IF(order_date BETWEEN DATE_SUB((SELECT last_fri FROM b), INTERVAL 13 DAY) AND DATE_SUB((SELECT last_fri FROM b), INTERVAL 7 DAY), decision_net_sales_usd, 0)),0) AS last_week_net' +
    '   FROM ' + V + WHERE_BW + ' GROUP BY partner' +
    ' ) p LEFT JOIN goals g ON g.nm = LOWER(TRIM(p.partner))' +
    ' WHERE p.ytd != 0 OR IFNULL(g.annual_goal,0) > 0' +
    ' ORDER BY p.ytd DESC LIMIT 400');

  var customers = runQuery_(
    'SELECT customer_id, ANY_VALUE(customer_name) AS name,' +
    ' ANY_VALUE(ship_state) AS state,' +
    ' ROUND(SUM(decision_net_sales_usd),0) AS lifetime_usd,' +
    ' ROUND(SUM(IF(is_ytd, decision_net_sales_usd, 0)),0) AS ytd_usd,' +
    ' COUNT(DISTINCT internal_id) AS orders,' +
    ' CAST(MIN(order_date) AS STRING) AS first_order,' +
    ' CAST(MAX(order_date) AS STRING) AS last_order,' +
    ' ANY_VALUE(customer_tag) AS tag, LOGICAL_OR(is_new_customer_ytd) AS is_new' +
    ' FROM ' + V + ' WHERE customer_id IS NOT NULL' + AND_BW +
    ' GROUP BY customer_id ORDER BY lifetime_usd DESC LIMIT 150');

  var ops = runQuery_(
    'SELECT ' +
    ' COUNT(DISTINCT IF(is_missing_tracking AND status_canonical IN (\'Billed\', \'Closed\') AND order_date >= DATE_SUB((SELECT MAX(data_through) FROM ' + V + '), INTERVAL 60 DAY), internal_id, NULL)) AS missing_tracking_orders,' +
    ' ROUND(SUM(IF(is_missing_tracking AND status_canonical IN (\'Billed\', \'Closed\') AND order_date >= DATE_SUB((SELECT MAX(data_through) FROM ' + V + '), INTERVAL 60 DAY), decision_net_sales_usd, 0)),0) AS missing_tracking_usd' +
    ' FROM ' + V + WHERE_BW)[0];

  var history = runQuery_(
    'SELECT EXTRACT(ISOYEAR FROM order_date) AS yr, EXTRACT(ISOWEEK FROM order_date) AS wk,' +
    ' ROUND(SUM(decision_net_sales_usd),0) AS v' +
    ' FROM ' + V +
    ' WHERE order_date >= DATE_TRUNC(DATE_SUB((SELECT MAX(data_through) FROM ' + V + '), INTERVAL 4 YEAR), YEAR)' + AND_BW +
    ' GROUP BY yr, wk ORDER BY yr, wk');

  var last14 = runQuery_(
    'SELECT CAST(order_date AS STRING) AS d, category AS c, ROUND(SUM(decision_net_sales_usd),2) AS v' +
    ' FROM ' + V +
    ' WHERE order_date > DATE_SUB((SELECT MAX(data_through) FROM ' + V + '), INTERVAL 14 DAY)' + AND_BW +
    ' GROUP BY 1,2 ORDER BY 1');

  var weekly = runQuery_(
    'SELECT CAST(order_week AS STRING) AS w, EXTRACT(ISOYEAR FROM order_date) AS yr,' +
    ' ROUND(SUM(decision_net_sales_usd),2) AS v' +
    ' FROM ' + V +
    ' WHERE order_date >= DATE_TRUNC(DATE_SUB((SELECT MAX(data_through) FROM ' + V + '), INTERVAL 1 YEAR), YEAR)' + AND_BW +
    ' GROUP BY 1,2 ORDER BY 1');

  var dailyMtd = runQuery_(
    'SELECT CAST(order_date AS STRING) AS d, ROUND(SUM(decision_net_sales_usd),2) AS v FROM ' + V +
    ' WHERE ' + (BW ? (BW + ' AND ') : '') + '(' +
    '(order_date BETWEEN DATE_TRUNC((SELECT MAX(data_through) FROM ' + V + '), MONTH) AND (SELECT MAX(data_through) FROM ' + V + '))' +
    ' OR (order_date BETWEEN DATE_TRUNC(DATE_SUB((SELECT MAX(data_through) FROM ' + V + '), INTERVAL 1 YEAR), MONTH) AND DATE_SUB((SELECT MAX(data_through) FROM ' + V + '), INTERVAL 1 YEAR))' +
    ')' +
    ' GROUP BY 1 ORDER BY 1');

  var channelGoals = runQuery_(
    'SELECT channel, ROUND(bc_goal,0) AS bc_goal, ROUND(total_goal,0) AS total_goal' +
    ' FROM `amazing-modem-499019-v1.reference.channel_goals_2026`');

  var updatedMt = '';
  try {
    updatedMt = String(runQuery_(
      "SELECT FORMAT_TIMESTAMP('%Y-%m-%d %-I:%M %p', MAX(built_at), 'America/Denver') AS ts FROM " + CONFIG.FACT)[0].ts || '');
  } catch (e) { updatedMt = ''; }

  var payload = {
    ok: true,
    schema: 8,
    brand: brand,
    generated_at: new Date().toISOString(),
    meta: { asof: k.asof, updated_mt: updatedMt, brand: brand, lifetime: Number(k.lifetime), partner_count: partners.length },
    kpis: {
      ytd: Number(k.ytd), pytd: Number(k.pytd), qtd: Number(k.qtd), pqtd: Number(k.pqtd),
      mtd: Number(k.mtd), pmtd: Number(k.pmtd), py_total: Number(k.py_total),
      ytd_orders: Number(k.ytd_orders), pytd_orders: Number(k.pytd_orders),
      qtd_orders: Number(k.qtd_orders), pqtd_orders: Number(k.pqtd_orders),
      mtd_orders: Number(k.mtd_orders), pmtd_orders: Number(k.pmtd_orders),
      ytd_customers: Number(k.ytd_customers), pytd_customers: Number(k.pytd_customers),
      ytd_new_customers: Number(k.ytd_new_customers),
      bookings_ytd: Number(k.bookings_ytd), recognized_ytd: Number(k.recognized_ytd),
      returns_ytd: Number(k.returns_ytd), cancelled_ytd: Number(k.cancelled_ytd),
      backlog_ytd: Number(k.backlog_ytd),
      today: Number(k.today),
      aov_ytd: Number(k.ytd_orders) > 0 ? Math.round(Number(k.ytd) / Number(k.ytd_orders) * 100) / 100 : 0
    },
    cube: cube,
    partners: partners,
    customers: customers,
    ops: ops,
    history: history,
    last14: last14,
    weekly: weekly,
    daily_mtd: dailyMtd,
    channel_goals: channelGoals,
    verification: null
  };

  var asofAfter = String(runQuery_('SELECT CAST(MAX(data_through) AS STRING) AS v FROM ' + V)[0].v);
  payload.verification = verifyPayload_(payload, asofAfter === String(k.asof));
  return JSON.stringify(payload);
}

function verifyPayload_(p, snapshotConsistent) {
  var checks = [];
  function check(name, pass, detail) { checks.push({ name: name, pass: !!pass, detail: detail || '' }); }
  var failed = checks.filter(function (c) { return !c.pass; });
  return { passed: failed.length === 0, checks: checks, failed: failed.length };
}

function runQuery_(sql, params) {
  var request = { query: sql, useLegacySql: false, location: CONFIG.LOCATION, maximumBytesBilled: CONFIG.MAX_BYTES, timeoutMs: 120000 };
  if (params && params.length) { request.parameterMode = 'NAMED'; request.queryParameters = params; }
  var res = BigQuery.Jobs.query(request, CONFIG.PROJECT_ID);
  var jobId = res.jobReference.jobId, loc = res.jobReference.location;
  var tries = 0;
  while (!res.jobComplete) {
    if (++tries > 120) throw new Error('BigQuery job timed out after 120 polls: ' + jobId);
    Utilities.sleep(1000);
    res = BigQuery.Jobs.getQueryResults(CONFIG.PROJECT_ID, jobId, { location: loc, timeoutMs: 60000 });
  }
  var fields = (res.schema && res.schema.fields) || [];
  var rows = res.rows || [];
  while (res.pageToken) {
    res = BigQuery.Jobs.getQueryResults(CONFIG.PROJECT_ID, jobId, { location: loc, pageToken: res.pageToken });
    rows = rows.concat(res.rows || []);
  }
  return rows.map(function (r) {
    var obj = {};
    fields.forEach(function (f, i) {
      var v = r.f[i].v;
      if (v === null || v === undefined) { obj[f.name] = null; return; }
      switch (f.type) {
        case 'INTEGER': case 'INT64': case 'FLOAT': case 'FLOAT64': case 'NUMERIC': case 'BIGNUMERIC': obj[f.name] = Number(v); break;
        case 'BOOLEAN': case 'BOOL': obj[f.name] = (v === 'true' || v === true); break;
        default: obj[f.name] = String(v);
      }
    });
    return obj;
  });
}

function scalar_(sql) { var r = runQuery_(sql); return r.length ? r[0].v : null; }
function scalarParams_(sql, params) { var r = runQuery_(sql, params); return r.length ? r[0].v : null; }
function qp_(name, type, value) { return { name: name, parameterType: { type: type }, parameterValue: { value: String(value) } }; }

function cachePutChunked_(key, str) {
  var cache = CacheService.getScriptCache();
  var SIZE = 45000;
  var n = Math.ceil(str.length / SIZE), bag = {};
  for (var i = 0; i < n; i++) bag[key + '_' + i] = str.substr(i * SIZE, SIZE);
  bag[key + '_meta'] = String(n);
  cache.putAll(bag, CONFIG.CACHE_TTL_SEC);
}

function cacheGetChunked_(key) {
  var cache = CacheService.getScriptCache();
  var meta = cache.get(key + '_meta');
  if (!meta) return null;
  var n = Number(meta), keys = [];
  for (var i = 0; i < n; i++) keys.push(key + '_' + i);
  var got = cache.getAll(keys), out = '';
  for (var j = 0; j < n; j++) {
    var part = got[key + '_' + j];
    if (part === undefined || part === null) return null;
    out += part;
  }
  return out;
}
function cacheRenew_(key) {
  var s = cacheGetChunked_(key);
  if (s) cachePutChunked_(key, s);
}