/**
 * Black Clover — Orders Loader (Gmail CSV -> BigQuery)  [replaces the SuiteScript "pitcher"]
 * ============================================================================
 * PULLS instead of pushes. No SuiteScript, no web app, no secret token.
 *
 * FLOW:
 *   NetSuite scheduled saved-search email (CSV)  ->  Gmail
 *     -> this loader parses it
 *     -> loads to a staging table (netsuite_imports.loader_staging, WRITE_TRUNCATE)
 *     -> MERGE upserts into netsuite_imports.live_orders by internal_id (latest wins)
 *     -> live_orders_typed (view) types + maps it, master_sales_live (view) merges
 *        it with history — Code.gs hourlyRefresh() rebuilds the certified fact table.
 *
 * SAFE BY DESIGN:
 *   - Only ever touches the raw LIVE landing table (live_orders). Never writes to
 *     master_sales / history. The dedup + merge logic already lives in the views.
 *   - MERGE by internal_id => re-sending the same rolling window is idempotent.
 *
 * SETUP:
 *   1. In NetSuite, schedule the orders saved search to email RESULTS AS A CSV to
 *      marty@blackcloverusa.com hourly. Put the email's Subject in ORDERS.SUBJECT.
 *   2. Paste this file into the Apps Script project (BigQuery advanced service is
 *      already enabled there).
 *   3. TEST NOW: run TEST_previewEmail() to confirm the loader sees the email,
 *      then run importOrdersToBigQuery() once and check the log.
 *   4. Run installOrdersTrigger() to schedule it hourly.
 */

var ORDERS = {
  PROJECT_ID: 'amazing-modem-499019-v1',
  LOCATION: 'US',
  TARGET: { dataset: 'netsuite_imports', table: 'live_orders' },
  STAGING: { dataset: 'netsuite_imports', table: 'loader_staging' },
  SENDER: 'system@sent-via.netsuite.com',   // NetSuite routes script emails through this relay
  SUBJECT: 'BQ Orders Hourly Sync',         // must match the NetSuite Orders Emailer subject
  ALERT_TO: 'marty@blackcloverusa.com'
};

// Map: CSV header label -> live_orders column. Unlisted CSV columns still go to raw_json.
var ORDERS_MAP = {
  'Internal ID': 'internal_id',
  'Document Number': 'document_number',
  'Name': 'customer_name',
  'Subsidiary': 'subsidiary',
  'Date': 'order_date',
  'Ship Date': 'ship_date',
  'Status': 'status',
  'Type': 'type',
  'Sales Rep': 'sales_rep',
  'Partner': 'partner',
  'Amount (Net)': 'amount_net',
  'Tracking Numbers': 'tracking_numbers',
  'Email': 'email',
  'Shipping State/Province': 'shipping_state_province',
  'Shipping Zip': 'shipping_zip',
  'Shipping Country': 'shipping_country'
};

var LIVE_ORDERS_SCHEMA = [
  { name: 'internal_id', type: 'STRING' }, { name: 'document_number', type: 'STRING' },
  { name: 'customer_id', type: 'STRING' }, { name: 'customer_name', type: 'STRING' },
  { name: 'subsidiary', type: 'STRING' }, { name: 'order_date', type: 'STRING' },
  { name: 'ship_date', type: 'STRING' }, { name: 'status', type: 'STRING' },
  { name: 'type', type: 'STRING' }, { name: 'sales_rep', type: 'STRING' },
  { name: 'partner', type: 'STRING' }, { name: 'amount_net', type: 'STRING' },
  { name: 'tracking_numbers', type: 'STRING' }, { name: 'email', type: 'STRING' },
  { name: 'shipping_state_province', type: 'STRING' }, { name: 'shipping_zip', type: 'STRING' },
  { name: 'shipping_country', type: 'STRING' }, { name: 'raw_json', type: 'STRING' },
  { name: 'ingested_at', type: 'TIMESTAMP' }, { name: 'sales_rep_email', type: 'STRING' }
];

// ============================ PUBLIC ENTRY POINTS ==========================

/** Scheduled: pull newest orders CSV from Gmail and load it. */
function importOrdersToBigQuery() {
  try {
    var csv = fetchLatestOrdersCsv_();
    if (!csv) { Logger.log('No orders email found — nothing to load.'); return; }
    var result = loadCsvIntoLiveOrders_(csv);
    Logger.log('Orders load OK: ' + JSON.stringify(result));
    return result;
  } catch (e) {
    var msg = (e && e.message) ? e.message : String(e);
    Logger.log('ORDERS LOAD FAILED: ' + msg);
    ordersAlert_('Orders → BigQuery load FAILED', msg);
    throw e;
  }
}

/** TEST: confirm the loader can see the scheduled email (no writes). */
function TEST_previewEmail() {
  var q = ordersQuery_();
  var threads = GmailApp.search(q, 0, 5);
  Logger.log('Query: ' + q + '\nThreads found: ' + threads.length);
  threads.forEach(function (th) {
    th.getMessages().forEach(function (m) {
      var atts = m.getAttachments().map(function (a) { return a.getName() + ' (' + a.getContentType() + ')'; });
      Logger.log(m.getDate() + ' | ' + m.getSubject() + ' | attachments: ' + atts.join(', '));
    });
  });
}

/** TEST: load from a CSV already in Drive — full end-to-end without waiting for email. */
function TEST_importFromDriveCsv(fileId) {
  var csv = DriveApp.getFileById(fileId).getBlob().getDataAsString();
  var result = loadCsvIntoLiveOrders_(csv);
  Logger.log('TEST load OK: ' + JSON.stringify(result));
  return result;
}

/** Run once to schedule the loader hourly. */
function installOrdersTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'importOrdersToBigQuery') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('importOrdersToBigQuery').timeBased().everyHours(1).create();
  Logger.log('Orders loader trigger installed (hourly).');
}

// ============================ CORE ==========================================

function ordersQuery_() {
  return 'from:' + ORDERS.SENDER + ' subject:"' + ORDERS.SUBJECT + '" has:attachment newer_than:3d';
}

function fetchLatestOrdersCsv_() {
  var threads = GmailApp.search(ordersQuery_(), 0, 10);
  var best = null, bestWhen = 0;
  threads.forEach(function (th) {
    th.getMessages().forEach(function (m) {
      if (m.getSubject().indexOf(ORDERS.SUBJECT) === -1) return;
      var when = m.getDate().getTime();
      m.getAttachments().forEach(function (a) {
        var nm = (a.getName() || '').toLowerCase();
        if ((nm.indexOf('.csv') >= 0 || (a.getContentType() || '').indexOf('csv') >= 0) && when > bestWhen) {
          bestWhen = when; best = a;
        }
      });
    });
  });
  return best ? best.getDataAsString() : null;
}

/** Parse CSV -> staging load -> MERGE into live_orders. Returns row counts. */
function loadCsvIntoLiveOrders_(csvText) {
  var grid = Utilities.parseCsv(csvText);
  if (!grid || grid.length < 2) throw new Error('CSV had no data rows.');
  var header = grid[0].map(function (h) { return String(h || '').trim(); });

  var nowIso = new Date().toISOString();
  var records = [];
  for (var i = 1; i < grid.length; i++) {
    var row = grid[i];
    if (!row || row.length === 0) continue;
    var rec = blankRecord_(nowIso), raw = {}, hasId = false;
    for (var c = 0; c < header.length; c++) {
      var label = header[c], val = (row[c] == null ? '' : String(row[c]));
      raw[label] = val;
      var field = ORDERS_MAP[label];
      if (field) {
        if (field === 'tracking_numbers') val = val.replace(/<BR>/gi, ';').replace(/[\r\n]+/g, ';');
        rec[field] = val;
        if (field === 'internal_id' && val) hasId = true;
      }
    }
    if (!hasId) continue;
    rec.raw_json = JSON.stringify(raw);
    records.push(rec);
  }
  if (records.length === 0) throw new Error('No rows with an Internal ID were found in the CSV.');

  loadStaging_(records);
  var merged = mergeStagingIntoLiveOrders_();
  return { parsed: records.length, merged_statement: 'ok', target_rows_after: merged };
}

function blankRecord_(nowIso) {
  return {
    internal_id: '', document_number: '', customer_id: '', customer_name: '', subsidiary: '',
    order_date: '', ship_date: '', status: '', type: '', sales_rep: '', partner: '',
    amount_net: '', tracking_numbers: '', email: '', shipping_state_province: '',
    shipping_zip: '', shipping_country: '', raw_json: '', ingested_at: nowIso, sales_rep_email: ''
  };
}

/** Load records as NDJSON into the staging table (WRITE_TRUNCATE), wait for DONE. */
function loadStaging_(records) {
  var ndjson = records.map(function (r) { return JSON.stringify(r); }).join('\n');
  var blob = Utilities.newBlob(ndjson, 'application/octet-stream');
  var job = {
    configuration: {
      load: {
        destinationTable: { projectId: ORDERS.PROJECT_ID, datasetId: ORDERS.STAGING.dataset, tableId: ORDERS.STAGING.table },
        sourceFormat: 'NEWLINE_DELIMITED_JSON',
        writeDisposition: 'WRITE_TRUNCATE',
        createDisposition: 'CREATE_IF_NEEDED',
        autodetect: false,
        schema: { fields: LIVE_ORDERS_SCHEMA }
      }
    }
  };
  var ins = BigQuery.Jobs.insert(job, ORDERS.PROJECT_ID, blob);
  var jobId = ins.jobReference.jobId, loc = ins.jobReference.location;
  var tries = 0;
  while (true) {
    var st = BigQuery.Jobs.get(ORDERS.PROJECT_ID, jobId, { location: loc });
    if (st.status && st.status.state === 'DONE') {
      if (st.status.errorResult) throw new Error('Staging load failed: ' + st.status.errorResult.message);
      return;
    }
    if (++tries > 60) throw new Error('Staging load timed out.');
    Utilities.sleep(1000);
  }
}

/** MERGE staging -> live_orders by internal_id (latest ingested_at wins). */
function mergeStagingIntoLiveOrders_() {
  var T = '`' + ORDERS.PROJECT_ID + '.' + ORDERS.TARGET.dataset + '.' + ORDERS.TARGET.table + '`';
  var S = '`' + ORDERS.PROJECT_ID + '.' + ORDERS.STAGING.dataset + '.' + ORDERS.STAGING.table + '`';
  var cols = LIVE_ORDERS_SCHEMA.map(function (f) { return f.name; });
  var setClause = cols.filter(function (c) { return c !== 'internal_id'; })
    .map(function (c) { return c + '=S.' + c; }).join(', ');
  var insCols = cols.join(', ');
  var insVals = cols.map(function (c) { return 'S.' + c; }).join(', ');

  var sql =
    'MERGE ' + T + ' T USING (' +
    '  SELECT * FROM ' + S + ' QUALIFY ROW_NUMBER() OVER(PARTITION BY internal_id ORDER BY ingested_at DESC)=1' +
    ') S ON T.internal_id = S.internal_id ' +
    'WHEN MATCHED THEN UPDATE SET ' + setClause + ' ' +
    'WHEN NOT MATCHED THEN INSERT (' + insCols + ') VALUES (' + insVals + ')';

  var res = BigQuery.Jobs.query({ query: sql, useLegacySql: false, location: ORDERS.LOCATION, timeoutMs: 120000 }, ORDERS.PROJECT_ID);
  var jobId = res.jobReference.jobId, loc = res.jobReference.location, tries = 0;
  while (!res.jobComplete) {
    if (++tries > 60) throw new Error('MERGE timed out.');
    Utilities.sleep(1000);
    res = BigQuery.Jobs.getQueryResults(ORDERS.PROJECT_ID, jobId, { location: loc });
  }
  return (res.numDmlAffectedRows != null) ? Number(res.numDmlAffectedRows) : null;
}

function ordersAlert_(subject, body) {
  try {
    MailApp.sendEmail({ to: ORDERS.ALERT_TO, subject: subject, body: body });
  } catch (e) {
    Logger.log('Alert email failed: ' + (e.message || e));
  }
}