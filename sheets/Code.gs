/**
 * Mcfly Analytics — Sheets companion entry (enterprise orchestrator).
 * Copy all .gs files + appsscript.json into Apps Script.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Mcfly Analytics")
    .addItem("Run once (full pass)", "mcflyRunOnce")
    .addItem("Refresh MER table", "refreshMerTable")
    .addSeparator()
    .addItem("Install overnight triggers", "mcflyInstallTriggers")
    .addItem("Remove overnight triggers", "mcflyUninstallTriggers")
    .addToUi();
}

function mcflyUninstallTriggers() {
  McflyOrchestrator.uninstallTriggers();
  SpreadsheetApp.getActiveSpreadsheet().toast("Triggers removed", "Mcfly", 5);
}
