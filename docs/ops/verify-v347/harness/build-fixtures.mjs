#!/usr/bin/env node
/**
 * Tip visual-proof fixtures — SAMPLE-shaped static HTML using tip mcfly-desk.css.
 * Interim gate while Admin session-service is broken. Not marketing /demo.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "fixtures");
const cssHref = path.resolve(__dirname, "../../../../app/app/styles/mcfly-desk.css");
const cssRel = path.relative(outDir, cssHref).split(path.sep).join("/");

fs.mkdirSync(outDir, { recursive: true });

const TABS = [
  { id: "overview", label: "Overview", group: "Shopify" },
  { id: "orders", label: "Orders", group: "Shopify" },
  { id: "customers", label: "Customers", group: "Shopify" },
  { id: "growth", label: "Growth", group: "Shopify" },
  { id: "ltv", label: "LTV", group: "Shopify" },
  { id: "spend", label: "Spend Upload", group: "Spend" },
  { id: "roas", label: "Total ROAS", group: "Spend" },
  { id: "allocation", label: "Channel Allocation", group: "Spend" },
  { id: "yoy", label: "YoY", group: "Compare" },
  { id: "cpa", label: "CPA", group: "Compare" },
  { id: "goals", label: "Goals", group: "Compare" },
  { id: "settings", label: "Settings", group: "System" },
];

function chrome(activeId) {
  const groups = ["Shopify", "Spend", "Compare", "System"];
  return `
  <div class="mcfly-data-mode mcfly-data-mode--sample" role="status">
    <p class="mcfly-data-mode__status">
      <strong>SAMPLE data</strong>
      <span aria-hidden="true"> · </span>
      Snowdevil example sales so you can click around. Not this shop’s Shopify sales.
      <span aria-hidden="true"> · </span>
      Live is parked until launch
    </p>
  </div>
  <nav class="mcfly-desk-tabs" aria-label="Desk pages">
    ${groups
      .map((g) => {
        const pills = TABS.filter((t) => t.group === g)
          .map(
            (t) =>
              `<a class="mcfly-desk-tabs__pill${t.id === activeId ? " mcfly-desk-tabs__pill--on" : ""}" role="tab" aria-selected="${t.id === activeId}" href="${t.id}.html">${t.label}</a>`,
          )
          .join("\n");
        return `<div class="mcfly-desk-tabs__group"><p class="mcfly-desk-tabs__k">${g}</p><div class="mcfly-desk-tabs__pills" role="tablist" aria-label="${g}">${pills}</div></div>`;
      })
      .join("\n")}
  </nav>
  <div class="mcfly-ctx">
    <div class="mcfly-ctx__main">
      <span class="mcfly-ctx__brand">Snowdevil</span>
      <span class="mcfly-ctx__sep" aria-hidden="true">·</span>
      <span class="mcfly-ctx__asof">Sep 1–17, 2026</span>
    </div>
    <div class="mcfly-ctx__chips">
      <span class="mcfly-ctx-chip mcfly-ctx-chip--fresh">SAMPLE</span>
    </div>
  </div>`;
}

function shell(id, title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — verify-v347 SAMPLE fixture</title>
  <link rel="stylesheet" href="${cssRel}" />
  <style>
    body { margin: 0; background: #f6f6f7; font-family: "Source Sans 3", "Segoe UI", system-ui, sans-serif; }
    .fixture-banner { margin: 0; padding: 0.4rem 0.75rem; font-size: 0.72rem; color: #5a6f85; background: #eef2f6; border-bottom: 1px solid #d8dee6; }
  </style>
</head>
<body>
  <p class="fixture-banner">verify-v347 interim tip proof · SAMPLE Snowdevil · not Admin session · not marketing /demo · tip CSS</p>
  ${chrome(id)}
  <div class="mcfly-desk mcfly-desk--sample" data-tab="${id}">
    ${body}
  </div>
</body>
</html>`;
}

const bodies = {
  overview: `
    <div class="mcfly-desk-anchor mcfly-scoreboard--overview">
      <section class="mcfly-yoy mcfly-yoy--glance" aria-label="Sales versus last year">
        <p class="mcfly-yoy__lede">Same days last year</p>
        <div class="mcfly-yoy__grid">
          <article class="mcfly-yoy__card mcfly-yoy__card--down"><p class="mcfly-yoy__k"><span class="mcfly-yoy__k-main">This month<span class="mcfly-yoy__range"> · Sep 1–17</span></span><span class="mcfly-yoy__zone mcfly-yoy__zone--down">Down</span></p><p class="mcfly-yoy__v mcfly-yoy__v--down">$72,410</p><p class="mcfly-yoy__delta mcfly-yoy__delta--down">-2%</p><p class="mcfly-yoy__prior"><span>LY $73,890</span><span class="mcfly-yoy__vs mcfly-yoy__vs--down">−$1,480 · -2%</span></p></article>
          <article class="mcfly-yoy__card mcfly-yoy__card--up"><p class="mcfly-yoy__k"><span class="mcfly-yoy__k-main">This quarter<span class="mcfly-yoy__range"> · Jul 1 – Sep 17</span></span><span class="mcfly-yoy__zone mcfly-yoy__zone--up">Up</span></p><p class="mcfly-yoy__v mcfly-yoy__v--up">$214,880</p><p class="mcfly-yoy__delta mcfly-yoy__delta--up">+1%</p><p class="mcfly-yoy__prior"><span>LY $212,104</span><span class="mcfly-yoy__vs mcfly-yoy__vs--up">+$2,776 · +1%</span></p></article>
          <article class="mcfly-yoy__card mcfly-yoy__card--up"><p class="mcfly-yoy__k"><span class="mcfly-yoy__k-main">This year<span class="mcfly-yoy__range"> · Jan 1 – Sep 17</span></span><span class="mcfly-yoy__zone mcfly-yoy__zone--up">Up</span></p><p class="mcfly-yoy__v mcfly-yoy__v--up">$922,104</p><p class="mcfly-yoy__delta mcfly-yoy__delta--up">Even</p><p class="mcfly-yoy__prior"><span>LY $920,812</span><span class="mcfly-yoy__vs mcfly-yoy__vs--up">+$1,292 · 0%</span></p></article>
        </div>
      </section>
      <section class="mcfly-score mcfly-book" aria-label="Shopify sales peeks">
        <p class="mcfly-scoreboard__kicker mcfly-scoreboard__kicker--sr">Snowdevil example sales — not this shop. Live is parked until launch.</p>
        <div class="mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--peeks-lead">
          <button type="button" class="mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek"><span class="mcfly-kpi__label">Typical order</span><span class="mcfly-kpi__value">$631</span><span class="mcfly-kpi__sub">Median</span></button>
          <button type="button" class="mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek"><span class="mcfly-kpi__label">Returning</span><span class="mcfly-kpi__value">$47,820</span><span class="mcfly-kpi__sub">66% of sales</span><span class="mcfly-split" aria-hidden="true"><span class="mcfly-split__return" style="width:66%"></span></span></button>
          <button type="button" class="mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek"><span class="mcfly-kpi__label">Weekend</span><span class="mcfly-kpi__value">23%</span><span class="mcfly-kpi__sub">Weekday 77%</span><span class="mcfly-split" aria-hidden="true"><span class="mcfly-split__weekend" style="width:23%"></span></span></button>
        </div>
      </section>
      <section class="mcfly-chart mcfly-chart--sales" aria-label="Sales explorer">
        <div class="mcfly-chart__head mcfly-chart__board">
          <p class="mcfly-chart__title">Sales</p>
          <div class="mcfly-chart__readout" role="status"><p class="mcfly-chart__when">Sep 17</p><p class="mcfly-chart__hero">$5,420</p><p class="mcfly-chart__vs mcfly-chart__vs--up">+$1,140 vs typical</p></div>
          <div class="mcfly-period__group" role="group" aria-label="Chart grain">
            <button type="button" class="mcfly-period__btn mcfly-period__btn--on" aria-pressed="true">Day</button>
            <button type="button" class="mcfly-period__btn" aria-pressed="false">Week</button>
            <button type="button" class="mcfly-period__btn" aria-pressed="false">Month</button>
          </div>
        </div>
        <svg class="mcfly-chart__svg" viewBox="0 0 640 240" role="img" aria-label="Sales bars">
          <path class="mcfly-chart__sales-fill" d="M24 222 L24 114 L62 72 L100 66 L138 111 L176 105 L214 126 L252 135 L290 96 L328 84 L366 78 L404 117 L442 99 L480 108 L518 129 L556 138 L594 90 L594 222 Z"></path>
          <line class="mcfly-chart__typical" x1="0" y1="113" x2="640" y2="113"></line>
          <text class="mcfly-chart__typical-k" x="8" y="107">typical $4,280</text>
          <rect class="mcfly-chart__bar mcfly-chart__bar--hot" x="8" y="114" width="32" height="108" rx="2"></rect>
          <rect class="mcfly-chart__bar mcfly-chart__bar--hot" x="46" y="72" width="32" height="150" rx="2"></rect>
          <rect class="mcfly-chart__bar mcfly-chart__bar--hot mcfly-chart__bar--on" x="578" y="90" width="32" height="132" rx="2"></rect>
          <path class="mcfly-chart__sales-line" d="M24 114 L62 72 L100 66 L138 111 L176 105 L214 126 L252 135 L290 96 L328 84 L366 78 L404 117 L442 99 L480 108 L518 129 L556 138 L594 90"></path>
        </svg>
      </section>
      <p class="mcfly-book__lede">Zero spend / Total ROAS / Spend Upload hero on Overview — sales scoreboard only.</p>
    </div>`,

  orders: `
    <p class="mcfly-book__lede">Typical order (median) vs average, discounts, 2+ items, then weekday/hour explorer. Zero spend/ROAS.</p>
    <section class="mcfly-score mcfly-book" aria-label="Orders scoreboard">
      <div class="mcfly-kpi-grid mcfly-kpi-grid--peeks">
        <button type="button" class="mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek"><span class="mcfly-kpi__label">Typical order</span><span class="mcfly-kpi__value">$631</span><span class="mcfly-kpi__sub">Median · avg $628</span></button>
        <button type="button" class="mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek"><span class="mcfly-kpi__label">Discount depth</span><span class="mcfly-kpi__value">8%</span><span class="mcfly-kpi__sub">Σ |discounts| ÷ gross</span></button>
        <button type="button" class="mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek"><span class="mcfly-kpi__label">2+ items</span><span class="mcfly-kpi__value">41%</span><span class="mcfly-kpi__sub">of orders</span></button>
      </div>
    </section>
    <section class="mcfly-chart mcfly-chart--orders mcfly-chart--weekday" aria-label="When sales land">
      <div class="mcfly-chart__head mcfly-chart__board">
        <p class="mcfly-chart__title">When sales land</p>
        <div class="mcfly-chart__readout" role="status"><p class="mcfly-chart__when">Wed</p><p class="mcfly-chart__hero">$13,264</p><p class="mcfly-chart__vs mcfly-chart__vs--plain">19% · busiest</p></div>
        <div class="mcfly-period__group"><button type="button" class="mcfly-period__btn mcfly-period__btn--on">Weekday</button><button type="button" class="mcfly-period__btn">Hour</button></div>
      </div>
      <div class="mcfly-chart__days">
        <button type="button" class="mcfly-chart__day"><span class="mcfly-chart__day-bar" style="height:64%"></span><span class="mcfly-chart__day-k">Mon</span><span class="mcfly-chart__day-v">$8,548</span></button>
        <button type="button" class="mcfly-chart__day mcfly-chart__day--peak mcfly-chart__day--on"><span class="mcfly-chart__day-bar" style="height:100%"></span><span class="mcfly-chart__day-k">Wed</span><span class="mcfly-chart__day-v">$13,264</span></button>
        <button type="button" class="mcfly-chart__day mcfly-chart__day--weekend"><span class="mcfly-chart__day-bar" style="height:60%"></span><span class="mcfly-chart__day-k">Sat</span><span class="mcfly-chart__day-v">$8,002</span></button>
      </div>
    </section>`,

  customers: `
    <p class="mcfly-book__lede">Explorer-first: new vs returning $ dual-axis, then compact returning hero — not a six-tile wall.</p>
    <section class="mcfly-chart mcfly-chart--sales mcfly-chart--customers" aria-label="Customer mix explorer">
      <div class="mcfly-chart__head mcfly-chart__board">
        <p class="mcfly-chart__title">New vs returning $</p>
        <div class="mcfly-chart__readout" role="status"><p class="mcfly-chart__when">Sep 17</p><p class="mcfly-chart__hero">$5,420</p><p class="mcfly-chart__vs mcfly-chart__vs--plain">66% returning</p></div>
        <div class="mcfly-period__group"><button type="button" class="mcfly-period__btn mcfly-period__btn--on">Day</button><button type="button" class="mcfly-period__btn">Week</button></div>
      </div>
      <svg class="mcfly-chart__svg" viewBox="0 0 640 220" role="img" aria-label="Returning dollars bars">
        <rect class="mcfly-chart__bar mcfly-chart__bar--hot" x="20" y="80" width="28" height="120" rx="2"></rect>
        <rect class="mcfly-chart__bar mcfly-chart__bar--cool" x="20" y="40" width="28" height="40" rx="2"></rect>
        <rect class="mcfly-chart__bar mcfly-chart__bar--hot" x="60" y="70" width="28" height="130" rx="2"></rect>
        <rect class="mcfly-chart__bar mcfly-chart__bar--cool" x="60" y="30" width="28" height="40" rx="2"></rect>
        <rect class="mcfly-chart__bar mcfly-chart__bar--hot mcfly-chart__bar--on" x="580" y="60" width="28" height="140" rx="2"></rect>
        <rect class="mcfly-chart__bar mcfly-chart__bar--cool" x="580" y="20" width="28" height="40" rx="2"></rect>
        <path class="mcfly-chart__sales-line" d="M34 80 L74 70 L114 90 L154 75 L194 85 L234 65 L274 70 L314 55 L354 60 L394 50 L434 58 L474 48 L514 52 L554 45 L594 40"></path>
      </svg>
    </section>
    <section class="mcfly-score mcfly-book" aria-label="Returning hero">
      <div class="mcfly-kpi-grid mcfly-kpi-grid--peeks">
        <button type="button" class="mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek"><span class="mcfly-kpi__label">Returning share</span><span class="mcfly-kpi__value">66%</span><span class="mcfly-kpi__sub">of sales this window</span></button>
        <button type="button" class="mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek"><span class="mcfly-kpi__label">Repeat clock</span><span class="mcfly-kpi__value">47d</span><span class="mcfly-kpi__sub">median to 2nd order</span></button>
        <button type="button" class="mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek"><span class="mcfly-kpi__label">Save-now whales</span><span class="mcfly-kpi__value">18</span><span class="mcfly-kpi__sub">quiet 60–90d</span></button>
      </div>
    </section>`,

  growth: `
    <p class="mcfly-book__lede">Explorer first — comeback / first-order months. Soft cards under; book hero + fact grid retired.</p>
    <section class="mcfly-chart mcfly-chart--growth" aria-label="Comeback explorer">
      <div class="mcfly-chart__head mcfly-chart__board">
        <p class="mcfly-chart__title">Who came back</p>
        <div class="mcfly-chart__readout" role="status"><p class="mcfly-chart__when">First-order Aug</p><p class="mcfly-chart__hero">38%</p><p class="mcfly-chart__vs mcfly-chart__vs--up">came back in 90d</p></div>
      </div>
      <div class="mcfly-chart__days" style="padding:12px 8px;gap:10px;align-items:flex-end;min-height:180px">
        ${["Mar","Apr","May","Jun","Jul","Aug","Sep"]
          .map(
            (m, i) => {
              const h = [42, 48, 55, 61, 58, 66, 38][i];
              return `<button type="button" class="mcfly-chart__day${i === 5 ? " mcfly-chart__day--on" : ""}"><span class="mcfly-chart__day-bar" style="height:${h}%"></span><span class="mcfly-chart__day-k">${m}</span><span class="mcfly-chart__day-v">${h}%</span></button>`;
            },
          )
          .join("")}
      </div>
    </section>
    <section class="mcfly-score mcfly-book"><div class="mcfly-kpi-grid mcfly-kpi-grid--peeks">
      <button type="button" class="mcfly-kpi mcfly-kpi--peek"><span class="mcfly-kpi__label">First-time $</span><span class="mcfly-kpi__value">$24,590</span><span class="mcfly-kpi__sub">this window</span></button>
      <button type="button" class="mcfly-kpi mcfly-kpi--peek"><span class="mcfly-kpi__label">Repeat rate</span><span class="mcfly-kpi__value">34%</span><span class="mcfly-kpi__sub">buyers with 2+</span></button>
    </div></section>`,

  ltv: `
    <p class="mcfly-book__lede">First-90 hero · 30/90/365 honesty · SAMPLE depth. CAC only when spend typed.</p>
    <section class="mcfly-score mcfly-book" aria-label="LTV hero">
      <div class="mcfly-kpi-grid mcfly-kpi-grid--peeks">
        <button type="button" class="mcfly-kpi mcfly-kpi--peek"><span class="mcfly-kpi__label">First 90 days</span><span class="mcfly-kpi__value">$1,184</span><span class="mcfly-kpi__sub">avg buyer value</span></button>
        <button type="button" class="mcfly-kpi mcfly-kpi--peek"><span class="mcfly-kpi__label">Day 30</span><span class="mcfly-kpi__value">$712</span><span class="mcfly-kpi__sub">build</span></button>
        <button type="button" class="mcfly-kpi mcfly-kpi--peek"><span class="mcfly-kpi__label">Day 365</span><span class="mcfly-kpi__value">$1,940</span><span class="mcfly-kpi__sub">history-limited honest</span></button>
      </div>
    </section>
    <section class="mcfly-chart mcfly-chart--ltv" aria-label="LTV build curves">
      <div class="mcfly-chart__head"><p class="mcfly-chart__title">Value build curves</p></div>
      <svg class="mcfly-chart__svg" viewBox="0 0 640 200" role="img">
        <path class="mcfly-chart__sales-line" d="M40 160 L120 140 L200 110 L280 90 L360 75 L440 62 L520 55 L600 48"></path>
        <path class="mcfly-chart__aovline" d="M40 170 L120 155 L200 130 L280 115 L360 105 L440 98 L520 94 L600 90"></path>
      </svg>
    </section>`,

  spend: `
    <p class="mcfly-book__lede">Input-only ledger — typed / CSV / daily-rate. No Sales|Spend|ROAS hero on this tab.</p>
    <section class="mcfly-panel" aria-label="Spend upload">
      <h2>Add spend</h2>
      <p class="mcfly-panel__muted">SAMPLE Snowdevil already has Meta + Google days so Total ROAS works. This page does not paint ROAS.</p>
      <div class="mcfly-spend-row"><span class="mcfly-spend-dot mcfly-spend-dot--meta"></span><span class="mcfly-spend-row__channel">Meta</span><span class="mcfly-spend-row__amount">$590</span><span class="mcfly-spend-row__range">Sep 16</span><span class="mcfly-spend-badge">day</span></div>
      <div class="mcfly-spend-row"><span class="mcfly-spend-dot mcfly-spend-dot--google"></span><span class="mcfly-spend-row__channel">Google</span><span class="mcfly-spend-row__amount">$410</span><span class="mcfly-spend-row__range">Sep 16</span><span class="mcfly-spend-badge">day</span></div>
      <div class="mcfly-spend-row"><span class="mcfly-spend-dot mcfly-spend-dot--email"></span><span class="mcfly-spend-row__channel">Email</span><span class="mcfly-spend-row__amount">$40</span><span class="mcfly-spend-row__range">Sep 16</span><span class="mcfly-spend-badge">day</span></div>
      <p class="mcfly-book__lede"><a href="roas.html">Same numbers on Total ROAS →</a></p>
    </section>`,

  roas: `
    <p class="mcfly-book__lede">Total ROAS = Shopify sales ÷ entered spend. Empty spend paints — not 0.00×.</p>
    <section class="mcfly-score mcfly-book" aria-label="Total ROAS pair">
      <div class="mcfly-kpi-grid mcfly-kpi-grid--peeks">
        <button type="button" class="mcfly-kpi mcfly-kpi--peek"><span class="mcfly-kpi__label">Sales</span><span class="mcfly-kpi__value">$72,410</span><span class="mcfly-kpi__sub">this month SAMPLE</span></button>
        <button type="button" class="mcfly-kpi mcfly-kpi--peek"><span class="mcfly-kpi__label">Entered spend</span><span class="mcfly-kpi__value">$20,680</span><span class="mcfly-kpi__sub">Meta+Google+Email+Other</span></button>
        <button type="button" class="mcfly-kpi mcfly-kpi--peek"><span class="mcfly-kpi__label">Total ROAS</span><span class="mcfly-kpi__value">3.50×</span><span class="mcfly-kpi__sub">sales ÷ spend</span></button>
      </div>
    </section>
    <section class="mcfly-chart mcfly-chart--sales" aria-label="Spend explorer">
      <div class="mcfly-chart__head mcfly-chart__board"><p class="mcfly-chart__title">Sales vs spend</p>
        <div class="mcfly-period__group"><button type="button" class="mcfly-period__btn mcfly-period__btn--on">Day</button><button type="button" class="mcfly-period__btn">Week</button></div>
      </div>
      <svg class="mcfly-chart__svg" viewBox="0 0 640 200" role="img">
        <path class="mcfly-chart__sales-fill" d="M24 180 L24 90 L100 70 L180 85 L260 60 L340 75 L420 55 L500 65 L580 50 L580 180 Z"></path>
        <path class="mcfly-chart__aovline" d="M24 150 L100 145 L180 148 L260 140 L340 142 L420 138 L500 141 L580 136"></path>
      </svg>
    </section>`,

  allocation: `
    <p class="mcfly-book__lede">Channel mix + plan windows. SAMPLE banner. Operator-dense, not pamphlet.</p>
    <section class="mcfly-panel" aria-label="Channel mix">
      <h2>Channel mix · this month</h2>
      <div class="mcfly-spend-row"><span class="mcfly-spend-dot mcfly-spend-dot--meta"></span><span class="mcfly-spend-row__channel">Meta</span><span class="mcfly-spend-row__amount">48%</span><span class="mcfly-spend-row__range">$9,926</span></div>
      <div class="mcfly-spend-row"><span class="mcfly-spend-dot mcfly-spend-dot--google"></span><span class="mcfly-spend-row__channel">Google</span><span class="mcfly-spend-row__amount">38%</span><span class="mcfly-spend-row__range">$7,858</span></div>
      <div class="mcfly-spend-row"><span class="mcfly-spend-dot mcfly-spend-dot--email"></span><span class="mcfly-spend-row__channel">Email</span><span class="mcfly-spend-row__amount">6%</span><span class="mcfly-spend-row__range">$1,241</span></div>
      <div class="mcfly-spend-row"><span class="mcfly-spend-dot mcfly-spend-dot--other"></span><span class="mcfly-spend-row__channel">Other</span><span class="mcfly-spend-row__amount">8%</span><span class="mcfly-spend-row__range">$1,655</span></div>
    </section>`,

  yoy: `
    <p class="mcfly-book__lede">12-month year board + channel vs LY bars — explorer leads operating cards.</p>
    <section class="mcfly-chart mcfly-chart--yoy" aria-label="YoY year chart">
      <div class="mcfly-chart__head mcfly-chart__board"><p class="mcfly-chart__title">2026 vs 2025 by month</p>
        <div class="mcfly-chart__readout"><p class="mcfly-chart__when">Aug</p><p class="mcfly-chart__hero">$98,420</p><p class="mcfly-chart__vs mcfly-chart__vs--up">+6% vs LY</p></div>
      </div>
      <div class="mcfly-chart__days" style="min-height:160px;align-items:flex-end;padding:8px">
        ${["J","F","M","A","M","J","J","A","S","O","N","D"]
          .map((m, i) => {
            const h = [55, 52, 60, 58, 48, 45, 62, 70, 40, 0, 0, 0][i];
            return `<button type="button" class="mcfly-chart__day${i === 7 ? " mcfly-chart__day--on" : ""}"><span class="mcfly-chart__day-bar" style="height:${Math.max(h, 4)}%"></span><span class="mcfly-chart__day-k">${m}</span></button>`;
          })
          .join("")}
      </div>
    </section>
    <section class="mcfly-yoy mcfly-yoy--glance"><div class="mcfly-yoy__grid">
      <article class="mcfly-yoy__card"><p class="mcfly-yoy__k">This month</p><p class="mcfly-yoy__v">$72,410</p><p class="mcfly-yoy__prior">vs last month · LY · last 7</p></article>
      <article class="mcfly-yoy__card"><p class="mcfly-yoy__k">Channel vs LY</p><p class="mcfly-yoy__v">Meta +4%</p><p class="mcfly-yoy__prior">Google −1% · Email +9%</p></article>
    </div></section>`,

  cpa: `
    <p class="mcfly-book__lede">Cash CPA = entered spend ÷ Shopify buyers — not ads-manager CPA. Explorer + window cards.</p>
    <section class="mcfly-score mcfly-book" aria-label="CPA windows">
      <div class="mcfly-kpi-grid mcfly-kpi-grid--peeks">
        <button type="button" class="mcfly-kpi mcfly-kpi--peek mcfly-kpi--on"><span class="mcfly-kpi__label">This month</span><span class="mcfly-kpi__value">$48</span><span class="mcfly-kpi__sub">spend ÷ buyers</span></button>
        <button type="button" class="mcfly-kpi mcfly-kpi--peek"><span class="mcfly-kpi__label">Last 28</span><span class="mcfly-kpi__value">$51</span><span class="mcfly-kpi__sub">trailing</span></button>
        <button type="button" class="mcfly-kpi mcfly-kpi--peek"><span class="mcfly-kpi__label">Payback</span><span class="mcfly-kpi__value">~24d</span><span class="mcfly-kpi__sub">to first-90 LTV</span></button>
      </div>
    </section>
    <section class="mcfly-chart mcfly-chart--cpa" aria-label="CPA explorer">
      <div class="mcfly-chart__head mcfly-chart__board"><p class="mcfly-chart__title">CPA explorer</p>
        <div class="mcfly-period__group"><button type="button" class="mcfly-period__btn mcfly-period__btn--on">Day</button><button type="button" class="mcfly-period__btn">Week</button></div>
      </div>
      <svg class="mcfly-chart__svg" viewBox="0 0 640 180" role="img">
        <path class="mcfly-chart__sales-line" d="M20 120 L60 110 L100 130 L140 100 L180 115 L220 95 L260 105 L300 90 L340 100 L380 85 L420 95 L460 80 L500 90 L540 75 L580 88"></path>
      </svg>
    </section>`,

  goals: `
    <p class="mcfly-book__lede">MTD/QTD/YTD gauges · Grow 10% · monthly board. No ROAS hero required.</p>
    <section class="mcfly-score mcfly-book" aria-label="Goals gauges">
      <div class="mcfly-kpi-grid mcfly-kpi-grid--peeks">
        <button type="button" class="mcfly-kpi mcfly-kpi--peek"><span class="mcfly-kpi__label">MTD</span><span class="mcfly-kpi__value">72%</span><span class="mcfly-kpi__sub">$72k / $100k</span></button>
        <button type="button" class="mcfly-kpi mcfly-kpi--peek"><span class="mcfly-kpi__label">QTD</span><span class="mcfly-kpi__value">54%</span><span class="mcfly-kpi__sub">$215k / $400k</span></button>
        <button type="button" class="mcfly-kpi mcfly-kpi--peek"><span class="mcfly-kpi__label">YTD</span><span class="mcfly-kpi__value">61%</span><span class="mcfly-kpi__sub">$922k / $1.5M</span></button>
      </div>
    </section>
    <section class="mcfly-panel"><h2>Monthly board</h2><p class="mcfly-panel__muted">Grow 10% plan · SAMPLE targets · not Live.</p></section>`,

  settings: `
    <section class="mcfly-panel" id="settings" aria-label="Settings">
      <h2>Settings</h2>
      <p class="mcfly-panel__muted">Sample | Live freeze · targets · honest empties.</p>
      <p><strong>SAMPLE data</strong> — Snowdevil example. Live is parked until launch.</p>
      <p>Currency: USD · timezone: America/Denver</p>
      <p class="mcfly-panel__muted">Polaris forms stay here. No ROAS hero.</p>
    </section>`,
};

for (const tab of TABS) {
  const html = shell(tab.id, tab.label, bodies[tab.id]);
  fs.writeFileSync(path.join(outDir, `${tab.id}.html`), html);
  console.log("wrote", tab.id + ".html");
}
fs.writeFileSync(
  path.join(outDir, "index.html"),
  `<!DOCTYPE html><html><head><meta charset="utf-8"><title>verify-v347 fixtures</title></head><body><h1>verify-v347 fixtures</h1><ul>${TABS.map((t) => `<li><a href="${t.id}.html">${t.label}</a></li>`).join("")}</ul></body></html>`,
);
console.log("done", TABS.length, "tabs →", outDir);
