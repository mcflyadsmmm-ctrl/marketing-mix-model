/**
 * Enterprise overnight loop for Google Sheets.
 * Phases: preflight → fetch → reconcile → snapshot → allocate → alert → sleep → repeat.
 *
 * Install triggers via McflyOrchestrator.installOvernightTriggers()
 */

var McflyOrchestrator = (function () {
  var LOCK_KEY = "MCFLY_ORCH_LOCK";
  var STATE_KEY = "MCFLY_ORCH_STATE";
  var MAX_ITERATIONS = 8;
  var SLEEP_MS = 15 * 60 * 1000; // 15 min between hourly passes

  var PHASES = [
    "preflight",
    "fetch",
    "reconcile",
    "snapshot",
    "allocate",
    "alert",
    "report",
  ];

  function getState_() {
    var raw = PropertiesService.getScriptProperties().getProperty(STATE_KEY);
    if (!raw) {
      return {
        runId: null,
        iteration: 0,
        lastPhase: null,
        lastOk: true,
        history: [],
      };
    }
    return JSON.parse(raw);
  }

  function setState_(state) {
    PropertiesService.getScriptProperties().setProperty(
      STATE_KEY,
      JSON.stringify(state),
    );
  }

  function acquireLock_() {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) {
      return false;
    }
    return lock;
  }

  function logOps_(phase, status, detail) {
    McflyDashboard.appendOpsLog_(phase, status, detail);
  }

  function preflight_() {
    var props = PropertiesService.getScriptProperties();
    if (!props.getProperty("MCFLY_API_BASE") || !props.getProperty("MCFLY_API_TOKEN")) {
      throw new Error("Missing API config");
    }
    logOps_("preflight", "ok", "API credentials present");
    return { ok: true };
  }

  function fetchMer_(from, to) {
    var data = McflyApi.getMer(from, to, true);
    logOps_("fetch", "ok", "MER " + (data.mer != null ? data.mer.toFixed(2) : "—"));
    return data;
  }

  function reconcile_(data, priorSpend) {
    if (priorSpend == null || priorSpend === 0) {
      logOps_("reconcile", "baseline", "No prior spend baseline");
      return { status: "baseline", delta: null };
    }
    var delta = Math.abs(data.spend - priorSpend) / priorSpend;
    var threshold = Number(
      PropertiesService.getScriptProperties().getProperty("MCFLY_RECON_THRESHOLD") || "0.05",
    );
    if (delta > threshold) {
      logOps_("reconcile", "breach", "Spend drift " + (delta * 100).toFixed(1) + "%");
      return { status: "breach", delta: delta };
    }
    logOps_("reconcile", "ok", "Drift " + (delta * 100).toFixed(1) + "%");
    return { status: "ok", delta: delta };
  }

  function runOnce_(options) {
    options = options || {};
    var lock = acquireLock_();
    if (!lock) {
      logOps_("orchestrator", "skipped", "Lock held — another run in progress");
      return;
    }

    try {
      var state = getState_();
      if (!state.runId || options.newRun) {
        state.runId =
          "sheets_" +
          Utilities.formatDate(new Date(), "UTC", "yyyyMMdd_HHmmss");
        state.iteration = 0;
        state.history = [];
      }

      state.iteration += 1;
      var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
      var today = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
      var monthStart = Utilities.formatDate(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        tz,
        "yyyy-MM-dd",
      );

      preflight_();
      var priorSpend = McflyDashboard.getLastSpend_();
      var data = fetchMer_(monthStart, today);
      var recon = reconcile_(data, priorSpend);

      McflyDashboard.writeMerSnapshot_(data, recon);
      McflyDashboard.writeAllocation_(data.allocation);
      McflyDashboard.refreshSummaryCards_(data, recon);

      if (recon.status === "breach") {
        McflyAlerts.sendReconBreach_(data, recon);
      }
      if (data.allocation && data.mer != null && data.breakEvenMer && data.mer < data.breakEvenMer) {
        McflyAlerts.sendBelowBreakEven_(data);
      }

      state.lastPhase = "report";
      state.lastOk = recon.status !== "breach";
      state.history.push({
        at: new Date().toISOString(),
        iteration: state.iteration,
        mer: data.mer,
        spend: data.spend,
        recon: recon.status,
      });
      if (state.history.length > 50) {
        state.history = state.history.slice(-50);
      }
      setState_(state);

      logOps_("report", state.lastOk ? "ok" : "warn", "Iteration " + state.iteration);
      SpreadsheetApp.getActiveSpreadsheet().toast(
        "Mcfly overnight pass complete · MER " +
          (data.mer != null ? data.mer.toFixed(2) : "—") +
          " · " +
          (data.allocation ? data.allocation.why : ""),
        "Mcfly Orchestrator",
        10,
      );
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * Hourly trigger — one pass per invocation (safe for 6hr overnight window).
   */
  function hourlyPass() {
    runOnce_({ newRun: false });
  }

  /**
   * Daily trigger at ~1am store TZ — full refresh + email digest.
   */
  function dailyDigest() {
    runOnce_({ newRun: true });
    McflyAlerts.sendDailyDigest_();
  }

  function installOvernightTriggers() {
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function (t) {
      var fn = t.getHandlerFunction();
      if (fn === "mcflyHourlyPass" || fn === "mcflyDailyDigest") {
        ScriptApp.deleteTrigger(t);
      }
    });

    ScriptApp.newTrigger("mcflyHourlyPass")
      .timeBased()
      .everyHours(1)
      .create();

    ScriptApp.newTrigger("mcflyDailyDigest")
      .timeBased()
      .atHour(1)
      .everyDays(1)
      .create();

    SpreadsheetApp.getActiveSpreadsheet().toast(
      "Installed hourly + daily Mcfly triggers",
      "Mcfly Orchestrator",
      8,
    );
  }

  function uninstallTriggers() {
    ScriptApp.getProjectTriggers().forEach(function (t) {
      var fn = t.getHandlerFunction();
      if (fn === "mcflyHourlyPass" || fn === "mcflyDailyDigest") {
        ScriptApp.deleteTrigger(t);
      }
    });
  }

  return {
    runOnce: runOnce_,
    hourlyPass: hourlyPass,
    dailyDigest: dailyDigest,
    installOvernightTriggers: installOvernightTriggers,
    uninstallTriggers: uninstallTriggers,
    getState: getState_,
  };
})();

/** Global entrypoints for Apps Script triggers */
function mcflyHourlyPass() {
  McflyOrchestrator.hourlyPass();
}

function mcflyDailyDigest() {
  McflyOrchestrator.dailyDigest();
}

function mcflyInstallTriggers() {
  McflyOrchestrator.installOvernightTriggers();
}

function mcflyRunOnce() {
  McflyOrchestrator.runOnce({ newRun: true });
}
