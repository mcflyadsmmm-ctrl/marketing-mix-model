/**
 * Alerts — email + optional Slack webhook on kill criteria.
 * Script properties:
 *   MCFLY_ALERT_EMAIL — comma-separated recipients
 *   MCFLY_SLACK_WEBHOOK — optional incoming webhook URL
 */

var McflyAlerts = (function () {
  function recipients_() {
    var raw =
      PropertiesService.getScriptProperties().getProperty("MCFLY_ALERT_EMAIL") ||
      Session.getActiveUser().getEmail();
    return raw
      .split(",")
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }

  function sendEmail_(subject, body) {
    var to = recipients_();
    if (!to.length) return;
    MailApp.sendEmail({
      to: to.join(","),
      subject: subject,
      body: body,
    });
  }

  function slack_(text) {
    var url = PropertiesService.getScriptProperties().getProperty("MCFLY_SLACK_WEBHOOK");
    if (!url) return;
    UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({ text: text }),
      muteHttpExceptions: true,
    });
  }

  function sendReconBreach_(data, recon) {
    var msg =
      "Mcfly recon breach: spend drift " +
      (recon.delta * 100).toFixed(1) +
      "%\nSpend: $" +
      data.spend +
      "\nMER: " +
      (data.mer != null ? data.mer.toFixed(2) : "—");
    sendEmail_("[Mcfly] Spend recon breach", msg);
    slack_(":warning: " + msg);
  }

  function sendBelowBreakEven_(data) {
    var msg =
      "Cash MER " +
      data.mer.toFixed(2) +
      " is below break-even " +
      data.breakEvenMer.toFixed(2) +
      "\n" +
      (data.allocation ? data.allocation.why : "");
    sendEmail_("[Mcfly] Below break-even MER", msg);
    slack_(":chart_with_downwards_trend: " + msg);
  }

  function sendDailyDigest_() {
    var state = McflyOrchestrator.getState();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var body =
      "Mcfly overnight digest for " +
      ss.getName() +
      "\n\nRun: " +
      state.runId +
      "\nIterations: " +
      state.iteration +
      "\nLast OK: " +
      state.lastOk +
      "\n\nOpen Executive Summary tab for details.";
    sendEmail_("[Mcfly] Daily MER digest", body);
  }

  return {
    sendReconBreach_: sendReconBreach_,
    sendBelowBreakEven_: sendBelowBreakEven_,
    sendDailyDigest_: sendDailyDigest_,
  };
})();
