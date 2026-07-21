#!/usr/bin/env node
/**
 * Deterministic sample ecommerce warehouse for Mcfly Analytics (cash MER).
 *
 * Usage:
 *   node data/scripts/generate-warehouse.mjs
 *
 * Re-run to refresh "daily" snapshots. Output is seeded — same seed → same files.
 * Cash spend vs sales only. No path / click / MTA attribution fields.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const WAREHOUSE = join(ROOT, "warehouse");
const SITE_SAMPLE = join(ROOT, "..", "site", "sample");
const SITE_DATA = join(ROOT, "..", "site", "data");

/** Fixed as-of date for demos (refresh by bumping this or re-running on a new day). */
const AS_OF = "2026-07-21";
const SEED = 0x4d43464c; // "MCFL"

const CHANNELS = ["meta", "google", "other"];

function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function round(n, places = 2) {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

function parseDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, n) {
  const out = new Date(d.getTime());
  out.setUTCDate(out.getUTCDate() + n);
  return out;
}

function daysInRange(endIso, count) {
  const end = parseDate(endIso);
  const dates = [];
  for (let i = count - 1; i >= 0; i--) {
    dates.push(formatDate(addDays(end, -i)));
  }
  return dates;
}

function startOfMonth(iso) {
  const d = parseDate(iso);
  return formatDate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
}

function startOfQuarter(iso) {
  const d = parseDate(iso);
  const q = Math.floor(d.getUTCMonth() / 3) * 3;
  return formatDate(new Date(Date.UTC(d.getUTCFullYear(), q, 1)));
}

function startOfYear(iso) {
  const d = parseDate(iso);
  return formatDate(new Date(Date.UTC(d.getUTCFullYear(), 0, 1)));
}

function dayOfWeek(iso) {
  return parseDate(iso).getUTCDay(); // 0 Sun … 6 Sat
}

function isWeekend(iso) {
  const dow = dayOfWeek(iso);
  return dow === 0 || dow === 6;
}

/**
 * @param {object} brand
 * @param {string} brand.id
 * @param {string} brand.domain
 * @param {string} brand.name
 * @param {number} brand.margin_pct
 * @param {number} brand.target_mer
 * @param {number} brand.base_daily_gross — weekday baseline gross sales
 * @param {number} brand.base_daily_spend — weekday baseline total ad spend
 * @param {number[]} brand.channel_weights — [meta, google, other] summing ~1
 * @param {number} brand.days
 * @param {number} brand.seed
 */
function generateBrand(brand) {
  const rng = mulberry32(brand.seed);
  const dates = daysInRange(AS_OF, brand.days);
  const shopId = brand.id;

  const shops = [
    {
      shop_id: shopId,
      domain: brand.domain,
      name: brand.name,
      currency: "USD",
      margin_pct: brand.margin_pct,
      target_mer: brand.target_mer,
      as_of: AS_OF,
    },
  ];

  const dailySales = [];
  const dailySpend = [];
  const merDaily = [];

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const weekend = isWeekend(date);
    // Mild seasonality + trend into month (DTC often soft mid-week, dips weekends)
    const trend = 1 + (i / dates.length) * 0.08;
    const weekendFactor = weekend ? 0.72 + rng() * 0.08 : 1;
    const noise = 0.92 + rng() * 0.16;

    const grossSales = round(
      brand.base_daily_gross * trend * weekendFactor * noise,
      2,
    );
    const refundRate = 0.03 + rng() * 0.05; // 3–8%
    const refunds = round(grossSales * refundRate, 2);
    const netSales = round(grossSales - refunds, 2);
    const aov = 68 + rng() * 42;
    const orders = Math.max(1, Math.round(grossSales / aov));

    dailySales.push({
      date,
      shop_id: shopId,
      orders,
      gross_sales: grossSales,
      refunds,
      net_sales: netSales,
    });

    // Spend tracks sales loosely so MER stays in ~2.5–4.5x on net
    const targetMer = 2.7 + rng() * 1.6;
    let totalSpend = round(netSales / targetMer, 2);
    // Weekend: pull spend down harder than sales (auction softness)
    if (weekend) {
      totalSpend = round(totalSpend * (0.85 + rng() * 0.08), 2);
    }
    // Clamp MER into band after adjustments
    let mer = netSales / totalSpend;
    if (mer < 2.5) totalSpend = round(netSales / 2.55, 2);
    if (mer > 4.5) totalSpend = round(netSales / 4.4, 2);
    mer = round(netSales / totalSpend, 4);

    // Meta-heavy mix with small daily jitter
    const weights = brand.channel_weights.map((w, idx) => {
      const jitter = (rng() - 0.5) * 0.06;
      return Math.max(0.02, w + jitter * (idx === 0 ? 0.5 : 1));
    });
    const wSum = weights.reduce((a, b) => a + b, 0);
    const normalized = weights.map((w) => w / wSum);

    const channelSpends = {};
    let allocated = 0;
    for (let c = 0; c < CHANNELS.length; c++) {
      const ch = CHANNELS[c];
      let amount;
      if (c === CHANNELS.length - 1) {
        amount = round(totalSpend - allocated, 2);
      } else {
        amount = round(totalSpend * normalized[c], 2);
        allocated += amount;
      }
      channelSpends[ch] = amount;
      dailySpend.push({
        date,
        shop_id: shopId,
        channel: ch,
        spend: amount,
      });
    }

    const spendTotal = round(
      CHANNELS.reduce((s, ch) => s + channelSpends[ch], 0),
      2,
    );

    merDaily.push({
      date,
      shop_id: shopId,
      net_sales: netSales,
      gross_sales: grossSales,
      refunds,
      orders,
      spend: spendTotal,
      mer: round(netSales / spendTotal, 4),
      channels: {
        meta: channelSpends.meta,
        google: channelSpends.google,
        other: channelSpends.other,
      },
    });
  }

  const breakEven = round(1 / brand.margin_pct, 4);

  function aggregate(from, to) {
    const salesRows = dailySales.filter((r) => r.date >= from && r.date <= to);
    const spendRows = dailySpend.filter((r) => r.date >= from && r.date <= to);
    const net_sales = round(
      salesRows.reduce((s, r) => s + r.net_sales, 0),
      2,
    );
    const gross_sales = round(
      salesRows.reduce((s, r) => s + r.gross_sales, 0),
      2,
    );
    const refunds = round(
      salesRows.reduce((s, r) => s + r.refunds, 0),
      2,
    );
    const orders = salesRows.reduce((s, r) => s + r.orders, 0);
    const channels = { meta: 0, google: 0, other: 0 };
    for (const r of spendRows) {
      channels[r.channel] = round(channels[r.channel] + r.spend, 2);
    }
    const spend = round(channels.meta + channels.google + channels.other, 2);
    const mer = spend > 0 ? round(net_sales / spend, 4) : null;
    const channel_mix = CHANNELS.map((channel) => ({
      channel,
      amount: channels[channel],
      share: spend > 0 ? round(channels[channel] / spend, 4) : 0,
    }));

    return {
      period_start: from,
      period_end: to,
      shop_id: shopId,
      orders,
      gross_sales,
      refunds,
      net_sales,
      spend,
      mer,
      break_even_mer: breakEven,
      target_mer: brand.target_mer,
      margin_pct: brand.margin_pct,
      above_break_even: mer !== null ? mer >= breakEven : null,
      channels,
      channel_mix,
    };
  }

  const mtdFrom = startOfMonth(AS_OF);
  const qtdFrom = startOfQuarter(AS_OF);
  const ytdFrom = startOfYear(AS_OF);
  // Clamp period starts to available history
  const earliest = dates[0];
  const clamp = (from) => (from < earliest ? earliest : from);

  const period_snapshots = {
    as_of: AS_OF,
    shop_id: shopId,
    mtd: aggregate(clamp(mtdFrom), AS_OF),
    qtd: aggregate(clamp(qtdFrom), AS_OF),
    ytd: aggregate(clamp(ytdFrom), AS_OF),
  };

  return { shops, dailySales, dailySpend, merDaily, period_snapshots };
}

function toCsv(rows, columns) {
  const header = columns.join(",");
  const lines = rows.map((row) =>
    columns
      .map((col) => {
        const v = row[col];
        return typeof v === "string" ? v : String(v);
      })
      .join(","),
  );
  return [header, ...lines].join("\n") + "\n";
}

function writeBrand(dirName, data) {
  const dir = join(WAREHOUSE, dirName);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "shops.json"), JSON.stringify(data.shops, null, 2) + "\n");
  writeFileSync(
    join(dir, "daily_sales.csv"),
    toCsv(data.dailySales, [
      "date",
      "shop_id",
      "orders",
      "gross_sales",
      "refunds",
      "net_sales",
    ]),
  );
  writeFileSync(
    join(dir, "daily_spend.csv"),
    toCsv(data.dailySpend, ["date", "shop_id", "channel", "spend"]),
  );
  writeFileSync(
    join(dir, "mer_daily.json"),
    JSON.stringify(data.merDaily, null, 2) + "\n",
  );
  writeFileSync(
    join(dir, "period_snapshots.json"),
    JSON.stringify(data.period_snapshots, null, 2) + "\n",
  );
  return dir;
}

function writeSiteFeed(dtcSnapshots) {
  const mtd = dtcSnapshots.mtd;
  const feed = {
    product: "mcfly-analytics",
    metric: "cash_mer",
    shop_id: mtd.shop_id,
    as_of: dtcSnapshots.as_of,
    period: "mtd",
    period_start: mtd.period_start,
    period_end: mtd.period_end,
    spend: mtd.spend,
    sales: mtd.net_sales,
    mer: mtd.mer,
    break_even: mtd.break_even_mer,
    target_mer: mtd.target_mer,
    margin_pct: mtd.margin_pct,
    above_break_even: mtd.above_break_even,
    channels: mtd.channels,
    channel_mix: mtd.channel_mix,
    orders: mtd.orders,
    source: "warehouse/demo-dtc",
  };

  mkdirSync(SITE_SAMPLE, { recursive: true });
  mkdirSync(SITE_DATA, { recursive: true });
  const body = JSON.stringify(feed, null, 2) + "\n";
  writeFileSync(join(SITE_SAMPLE, "mer-feed.json"), body);
  // Thin mirror under site/data for static hosts that prefer /data/
  writeFileSync(join(SITE_DATA, "mer-feed.json"), body);
  return feed;
}

const dtc = generateBrand({
  id: "shop_demo_dtc",
  domain: "northline-supply.myshopify.com",
  name: "Northline Supply",
  margin_pct: 0.35,
  target_mer: 3.5,
  base_daily_gross: 11200,
  base_daily_spend: 3200,
  channel_weights: [0.62, 0.28, 0.1],
  days: 90,
  seed: SEED,
});

const agency = generateBrand({
  id: "shop_demo_agency",
  domain: "harbor-home-co.myshopify.com",
  name: "Harbor Home Co",
  margin_pct: 0.4,
  target_mer: 3.0,
  base_daily_gross: 4200,
  base_daily_spend: 1300,
  channel_weights: [0.55, 0.35, 0.1],
  days: 30,
  seed: SEED ^ 0x41474359, // "AGCY"
});

const dtcDir = writeBrand("demo-dtc", dtc);
const agencyDir = writeBrand("demo-agency", agency);
const feed = writeSiteFeed(dtc.period_snapshots);

console.log("Warehouse refreshed as_of", AS_OF);
console.log("  ", dtcDir);
console.log("  ", agencyDir);
console.log("  site/sample/mer-feed.json + site/data/mer-feed.json");
console.log("MTD feed:", {
  spend: feed.spend,
  sales: feed.sales,
  mer: feed.mer,
  break_even: feed.break_even,
  channels: feed.channels,
});
