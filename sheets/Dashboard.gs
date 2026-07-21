/**
 * Dashboard rendering — multi-tab enterprise MER cockpit for Sheets.
 */

var McflyDashboard = (function () {
  var SHEETS = {
    MER: "MER Dashboard",
    ALLOCATION: "Allocation",
    OPS: "Ops Log",
    SUMMARY: "Executive Summary",
  };

  var MER_HEADERS = [
    "Timestamp",
    "Period From",
    "Period To",
    "Sales",
    "Spend",
    "MER",
    "Break-even MER",
    "Meta spend",
    "Google spend",
    "Recon",
    "Allocation headline",
  ];

  function ensureSheet_(name, headers) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    if (headers && sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    return sheet;
  }

  function channelSpend_(channels, name) {
    if (!channels || !channels.length) return 0;
    var match = channels.find(function (c) {
      return String(c.name).toLowerCase().indexOf(name.toLowerCase()) !== -1;
    });
    return match ? Number(match.spend) || 0 : 0;
  }

  function getLastSpend_() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.MER);
    if (!sheet || sheet.getLastRow() < 2) return null;
    var spend = sheet.getRange(sheet.getLastRow(), 5).getValue();
    return Number(spend) || null;
  }

  function writeMerSnapshot_(data, recon) {
    var sheet = ensureSheet_(SHEETS.MER, MER_HEADERS);
    var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    var now = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss");
    var row = [
      now,
      data.from,
      data.to,
      data.sales,
      data.spend,
      data.mer != null ? data.mer : "",
      data.breakEvenMer,
      channelSpend_(data.channels, "meta"),
      channelSpend_(data.channels, "google"),
      recon.status + (recon.delta != null ? " (" + (recon.delta * 100).toFixed(1) + "%)" : ""),
      data.allocation ? data.allocation.why : "",
    ];
    sheet.appendRow(row);
    formatMerSheet_(sheet);
  }

  function formatMerSheet_(sheet) {
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return;
    sheet.getRange(2, 4, lastRow - 1, 5).setNumberFormat("$#,##0");
    sheet.getRange(2, 6, lastRow - 1, 7).setNumberFormat("0.00");
    var merRange = sheet.getRange(2, 6, lastRow - 1, 1);
    var breakEvenRange = sheet.getRange(2, 7, lastRow - 1, 1);
    var rules = sheet.getConditionalFormatRules();
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied("=$F2>=$G2")
        .setBackground("#d9ead3")
        .setRanges([merRange])
        .build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied("=$F2<$G2")
        .setBackground("#f4cccc")
        .setRanges([merRange])
        .build(),
    );
    sheet.setConditionalFormatRules(rules);
  }

  function writeAllocation_(allocation) {
    if (!allocation) return;
    var sheet = ensureSheet_(SHEETS.ALLOCATION, [
      "Updated",
      "Type",
      "Channel",
      "% Change",
      "Detail",
    ]);
    var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    var now = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm");
    sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), 5).clearContent();
    allocation.actions.forEach(function (action, i) {
      sheet.getRange(i + 2, 1, 1, 5).setValues([
        [
          now,
          action.type,
          action.channel,
          action.percentChange != null ? action.percentChange : "",
          action.detail,
        ],
      ]);
    });
  }

  function refreshSummaryCards_(data, recon) {
    var sheet = ensureSheet_(SHEETS.SUMMARY, []);
    sheet.clear();
    var above =
      data.mer != null && data.breakEvenMer
        ? data.mer >= data.breakEvenMer
        : null;
    var values = [
      ["Mcfly Cash MER — Executive Summary", ""],
      ["Period", data.from + " → " + data.to],
      ["Shopify sales", data.sales],
      ["Ad spend", data.spend],
      ["Cash MER", data.mer != null ? data.mer : "—"],
      ["Break-even MER", data.breakEvenMer],
      ["Status", above === true ? "ABOVE break-even" : above === false ? "BELOW break-even" : "—"],
      ["Recon", recon.status],
      ["Allocation", data.allocation ? data.allocation.why : "—"],
    ];
    sheet.getRange(1, 1, values.length, 2).setValues(values);
    sheet.getRange(1, 1, 1, 2).merge().setFontWeight("bold").setFontSize(14);
    sheet.getRange(3, 2, 4, 1).setNumberFormat("$#,##0");
    sheet.setColumnWidth(1, 180);
    sheet.setColumnWidth(2, 420);
  }

  function appendOpsLog_(phase, status, detail) {
    var sheet = ensureSheet_(SHEETS.OPS, ["Timestamp", "Phase", "Status", "Detail"]);
    var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    var now = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss");
    sheet.appendRow([now, phase, status, detail]);
    if (sheet.getLastRow() > 500) {
      sheet.deleteRows(2, sheet.getLastRow() - 500);
    }
  }

  /** Legacy menu handler */
  function refreshMerTable() {
    McflyOrchestrator.runOnce({ newRun: false });
  }

  return {
    writeMerSnapshot_: writeMerSnapshot_,
    writeAllocation_: writeAllocation_,
    refreshSummaryCards_: refreshSummaryCards_,
    appendOpsLog_: appendOpsLog_,
    getLastSpend_: getLastSpend_,
    refreshMerTable: refreshMerTable,
  };
})();

function refreshMerTable() {
  McflyDashboard.refreshMerTable();
}
