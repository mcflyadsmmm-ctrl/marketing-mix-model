/**
 * Mcfly Analytics — Sheets companion (Phase 5 scaffold)
 *
 * Refreshes MER table from the shared Mcfly API contract.
 * Not a SyncWith clone — read-only MER refresh into a template sheet.
 *
 * Setup: Extensions → Apps Script, paste this file + appsscript.json,
 * set Script Properties: MCFLY_API_BASE, MCFLY_API_TOKEN, MCFLY_SHOP_ID
 */

const SHEET_NAME = "MER Dashboard";
const HEADERS = [
  "Date",
  "Sales",
  "Spend",
  "MER",
  "Break-even MER",
  "Meta spend",
  "Google spend",
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Mcfly Analytics")
    .addItem("Refresh MER table", "refreshMerTable")
    .addToUi();
}

function getScriptConfig_() {
  const props = PropertiesService.getScriptProperties();
  const apiBase = props.getProperty("MCFLY_API_BASE");
  const apiToken = props.getProperty("MCFLY_API_TOKEN");
  const shopId = props.getProperty("MCFLY_SHOP_ID");

  if (!apiBase || !apiToken) {
    throw new Error(
      "Set Script Properties: MCFLY_API_BASE, MCFLY_API_TOKEN (and optionally MCFLY_SHOP_ID).",
    );
  }

  return { apiBase: apiBase.replace(/\/$/, ""), apiToken, shopId };
}

/**
 * Calls GET /mer?from&to — same contract as Shopify embedded app.
 * @param {string} from YYYY-MM-DD
 * @param {string} to YYYY-MM-DD
 * @returns {Object} MerResponse JSON
 */
function fetchMer_(from, to) {
  const config = getScriptConfig_();
  const url =
    config.apiBase +
    "/mer?from=" +
    encodeURIComponent(from) +
    "&to=" +
    encodeURIComponent(to) +
    "&includeAllocation=true";

  const response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: {
      Authorization: "Bearer " + config.apiToken,
      Accept: "application/json",
      ...(config.shopId ? { "X-Mcfly-Shop-Id": config.shopId } : {}),
    },
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error("Mcfly API error " + code + ": " + response.getContentText());
  }

  return JSON.parse(response.getContentText());
}

function channelSpend_(channels, name) {
  if (!channels || !channels.length) {
    return 0;
  }
  const match = channels.find(function (c) {
    return String(c.name).toLowerCase().indexOf(name.toLowerCase()) !== -1;
  });
  return match ? Number(match.spend) || 0 : 0;
}

/**
 * Writes one summary row for the requested period into MER Dashboard sheet.
 * Daily breakdown can be added when the API exposes day-level aggregates.
 */
function refreshMerTable() {
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const today = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  const monthStart = Utilities.formatDate(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    tz,
    "yyyy-MM-dd",
  );

  const data = fetchMer_(monthStart, today);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  const metaSpend = channelSpend_(data.channels, "meta");
  const googleSpend = channelSpend_(data.channels, "google");

  const row = [
    today,
    data.sales,
    data.spend,
    data.mer != null ? data.mer : "",
    data.breakEvenMer,
    metaSpend,
    googleSpend,
  ];

  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, 1, HEADERS.length).setValues([row]);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    "MER refreshed. " + (data.allocation ? data.allocation.why : ""),
    "Mcfly Analytics",
    8,
  );
}
