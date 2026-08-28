/**
 * Home till — interactive break-even (1 ÷ margin). SAMPLE illustration only.
 * No pixels / MTA / attribution theater.
 */
(function () {
  "use strict";

  var root = document.getElementById("till-be");
  if (!root) return;

  var slider = root.querySelector("[data-till-margin]");
  var marginOut = root.querySelector("[data-till-margin-val]");
  var beOut = root.querySelector("[data-till-be]");
  var needle = root.querySelector("[data-till-needle]");
  var verdict = root.querySelector("[data-till-verdict]");
  var sampleMer = 3.2;

  function fmt(n) {
    return n.toFixed(2).replace(/\.?0+$/, "") + "×";
  }

  function update() {
    var pct = Number(slider.value);
    var margin = pct / 100;
    var be = margin > 0 ? 1 / margin : 0;
    if (marginOut) marginOut.textContent = pct + "%";
    if (beOut) beOut.textContent = fmt(be);
    // Map BE 1.5×–5× across gauge (higher BE = harder = needle right)
    var t = Math.max(0, Math.min(1, (be - 1.5) / 3.5));
    if (needle) needle.style.setProperty("--till-t", String(t));
    if (verdict) {
      if (sampleMer >= be) {
        verdict.textContent =
          "Sample Total ROAS " +
          fmt(sampleMer) +
          " clears break-even — protect the mix.";
        verdict.dataset.tone = "good";
      } else {
        verdict.textContent =
          "Sample Total ROAS " +
          fmt(sampleMer) +
          " is below break-even — cut or shift.";
        verdict.dataset.tone = "bad";
      }
    }
  }

  slider.addEventListener("input", update);
  update();
})();
