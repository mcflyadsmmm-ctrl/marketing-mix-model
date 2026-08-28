/**
 * Mcfly Analytics — custom solutions SAMPLE desk.
 * Isolated from homepage spend-explorer.
 * Religion: outcomes ÷ spend — no pixels / MTA / path credit.
 */
(function () {
  "use strict";

  var page = document.body && document.body.getAttribute("data-page") === "custom-analytics";
  if (!page) return;

  /* Desk modes + ledger live on lab-desk.js (shared with /lab). */

  /* —— Package picker → proposal form modes —— */
  var packageBtns = document.querySelectorAll("[data-ca-package]");
  var packageSelect = document.querySelector("[data-proposal-package]");
  var budgetHidden = document.querySelector(
    'form[data-proposal] input[name="budget"]',
  );
  var packageMeta = {
    audit: { band: "$5–8K", weeks: "2–3 weeks", name: "Spend & Sales Audit" },
    leadgen: { band: "$8–15K", weeks: "3–6 weeks", name: "Lead Gen reporting" },
    mds: { band: "$15–25K", weeks: "6–10 weeks", name: "Advanced MDS" },
  };

  function setProposalMode(key) {
    if (!packageMeta[key]) return;
    if (packageSelect) packageSelect.value = key;
    if (budgetHidden) budgetHidden.value = packageMeta[key].band;
    packageBtns.forEach(function (b) {
      b.classList.toggle("is-selected", b.getAttribute("data-ca-package") === key);
    });
    document.querySelectorAll("[data-proposal-mode]").forEach(function (box) {
      var on = box.getAttribute("data-proposal-mode") === key;
      box.hidden = !on;
    });
    document.querySelectorAll("[data-mode-required]").forEach(function (el) {
      var need = el.getAttribute("data-mode-required") === key;
      if (need) el.setAttribute("required", "required");
      else el.removeAttribute("required");
    });
  }

  packageBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setProposalMode(btn.getAttribute("data-ca-package"));
      var inquire = document.getElementById("inquire");
      if (inquire) inquire.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  if (packageSelect) {
    packageSelect.addEventListener("change", function () {
      setProposalMode(packageSelect.value);
    });
  }
  var params = new URLSearchParams(window.location.search);
  var fromQuery = params.get("package");
  if (fromQuery && packageMeta[fromQuery]) {
    setProposalMode(fromQuery);
  } else if (packageSelect && packageSelect.value) {
    setProposalMode(packageSelect.value);
  }

  var proposeForm = document.querySelector("form[data-proposal]");
  if (proposeForm) {
    proposeForm.addEventListener("mcfly:proposal-result", function (event) {
      var result = (event.detail && event.detail.result) || {};
      var estimate = result.estimate || null;
      var fitCard = document.querySelector("[data-estimate]");
      var noFit = document.querySelector("[data-estimate-nofit]");
      var autoEl = document.querySelector("[data-autoreply]");
      var srcEl = document.querySelector("[data-autoreply-src]");
      var pkgKey = proposeForm.package ? proposeForm.package.value : "";
      var meta = packageMeta[pkgKey];
      var sheet = proposeForm.spreadsheet_closes
        ? proposeForm.spreadsheet_closes.value
        : "";
      var notFit =
        (estimate && estimate.notFit) || /^yes/i.test(sheet);
      if (fitCard) fitCard.hidden = notFit;
      if (noFit) noFit.hidden = !notFit;
      if (!notFit && fitCard && meta) {
        var title = fitCard.querySelector("[data-estimate-title]");
        var band = fitCard.querySelector("[data-estimate-band]");
        if (title) title.textContent = meta.name;
        if (band) band.textContent = meta.band + " · " + meta.weeks;
      }
      var replyText =
        (estimate && estimate.text) ||
        (srcEl
          ? srcEl.textContent
              .replace(/\{package\}/g, (meta && meta.name) || "Custom")
              .replace(/\{Name\}/g, proposeForm.name ? proposeForm.name.value : "")
              .replace(/\{band\}/g, (meta && meta.band) || "")
              .replace(/\{weeks\}/g, (meta && meta.weeks) || "")
          : "");
      if (autoEl && replyText && !notFit) {
        autoEl.hidden = false;
        autoEl.textContent =
          ((estimate && estimate.subject) ||
            "Estimate — Mcfly " + ((meta && meta.name) || "Custom")) +
          "\n\n" +
          replyText;
      } else if (autoEl) {
        autoEl.hidden = true;
      }
    });
  }

  /* —— 4. Google Appointment fit-call slot (no Calendly) —— */
  var fit = document.querySelector("[data-fitcall]");
  if (fit) {
    var rawUrl = (fit.getAttribute("data-schedule-url") || "").trim();
    var emptyCopy = fit.querySelector("[data-fitcall-empty]");
    var readyCopy = fit.querySelector("[data-fitcall-ready]");
    var bookLink = fit.querySelector("[data-fitcall-link]");
    var googleSlot =
      /^https:\/\/calendar\.google\.com\//i.test(rawUrl) ||
      /^https:\/\/calendar\.app\.google\//i.test(rawUrl);
    if (googleSlot && bookLink) {
      bookLink.href = rawUrl;
      bookLink.hidden = false;
      fit.hidden = false;
      fit.classList.remove("is-empty");
      if (emptyCopy) emptyCopy.hidden = true;
      if (readyCopy) readyCopy.hidden = false;
    } else {
      fit.hidden = true;
    }
  }

  /* —— 5. Privacy practices accordion —— */
  var privacyItems = document.querySelectorAll("[data-ca-privacy-item]");
  privacyItems.forEach(function (item) {
    var trigger = item.querySelector("button");
    var panel = item.querySelector("[data-ca-privacy-panel]");
    if (!trigger || !panel) return;
    trigger.addEventListener("click", function () {
      var open = item.getAttribute("data-open") === "true";
      item.setAttribute("data-open", open ? "false" : "true");
      trigger.setAttribute("aria-expanded", open ? "false" : "true");
      panel.hidden = open;
    });
  });
})();
