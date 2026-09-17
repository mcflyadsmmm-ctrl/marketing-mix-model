import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Configuration flags
const isLive = !!(process.env.BIGQUERY_PROJECT_ID && process.env.BIGQUERY_SERVICE_ACCOUNT_KEY);
const bqError = isLive ? null : "Demo mode: BIGQUERY_SERVICE_ACCOUNT_KEY not set in environment. Rendering high-fidelity mock data.";

// Mock Data matching validation numbers
const meta = {
  asof: "2026-07-08",
  lifetime_total: 82400000,
  partner_count: 85,
  customer_count: 51008
};

const kpis = {
  ytd: 26360000, // YTD ≈ $26.36M
  pytd: 19130000, // PYTD ≈ $19.13M
  qtd: 6200000,
  pqtd: 5100000,
  mtd: 1800000,
  pmtd: 1500000,
  ytd_orders: 65020, // orders 65,020
  pytd_orders: 51200,
  ytd_customers: 51008, // customers 51,008
  pytd_customers: 41200,
  ytd_new_customers: 18200,
  bookings_gross_ytd_usd: 28500000,
  recognized_ytd_usd: 26360000,
  returns_ytd_usd: -1200000, // NEGATIVE — display ABS in UI
  cancelled_ytd_usd: 940000,
  open_backlog_ytd_usd: 6040000, // backlog ≈ $6.04M
  aov_ytd: 405.41 // AOV ≈ $405
};

const ops = {
  median_ship_days: 4.2, // median ship days vs target 5
  pct3: 0.68, // % shipped <= 3 days
  pct7: 0.88, // % shipped <= 7 days
  backlog_count: 1420,
  backlog_value: 6040000
};

// Generate realistic cube data
const brands = ["bc", "cmc"] as const;
const channels = ["Partner-Wholesale", "Amazon", "BC Website", "CMC Website", "Corporate", "Other"];
const categories = ["Apparel", "Headwear", "Accessories", "CMC Custom", "Other"];
const partnersList = [
  "PGA Tour Superstore", "Golf Galaxy", "Club Champion", "Worldwide Golf", 
  "Dick's Sporting Goods", "Pro Shop Express", "Nordstrom", "St Andrews Shop"
];
const statuses = ["Billed", "Shipped", "Pending", "Cancelled"];
const subregions = ["Midwest", "Northeast", "Southeast", "Southwest", "West", "International"];

// Let's seed a consistent cube of data for YTD/PYTD/MTD/QTD
const cubeRows: any[] = [];

// Helper to determine if a month is in YTD/QTD/MTD based on asof "2026-07-08"
// YTD: 2026-01 to 2026-07 (up to day 08)
// PYTD: 2025-01 to 2025-07 (up to day 08)
// MTD: 2026-07 (up to day 08)
// PMTD: 2025-07 (up to day 08)
// QTD: 2026-07 (Q3 start, up to day 08)
// PQTD: 2025-07 (up to day 08)

const months = [
  "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12",
  "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07"
];

// Seed data
months.forEach((m) => {
  const is2026 = m.startsWith("2026");
  const yearMultiplier = is2026 ? 1.35 : 1.0; // Show 35% growth
  
  channels.forEach((channel) => {
    brands.forEach((brand) => {
      // BC website only sells Black Clover, CMC website only CMC, wholesale sells both
      if (channel === "BC Website" && brand !== "bc") return;
      if (channel === "CMC Website" && brand !== "cmc") return;

      categories.forEach((cat) => {
        const partner = channel === "Partner-Wholesale" 
          ? partnersList[Math.floor(Math.random() * partnersList.length)] 
          : "Direct Consumer";

        // Base net USD and orders
        let baseNet = (25000 + Math.random() * 45000) * yearMultiplier;
        let baseOrders = Math.round(baseNet / (350 + Math.random() * 110));

        // Adjustments based on brand and category
        if (brand === "cmc") {
          baseNet *= 0.45; // CMC is smaller
          baseOrders = Math.round(baseNet / (200 + Math.random() * 80));
        }

        const isTdFlag = true; // Simplified for the mock cube
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const funnel_bucket = status === "Cancelled" ? "Cancellations" : (status === "Pending" ? "Unshipped Backlog" : "Billed");

        cubeRows.push({
          month: m,
          partner,
          category: cat,
          status,
          brand,
          channel,
          subregion: subregions[Math.floor(Math.random() * subregions.length)],
          net_usd: parseFloat(baseNet.toFixed(2)),
          orders: baseOrders,
          funnel_bucket,
          isTdFlag
        });
      });
    });
  });
});

// Partner month records
const partner_months: Record<string, [string, number, number][]> = {};
partnersList.forEach(partner => {
  partner_months[partner] = months.map(m => {
    const is2026 = m.startsWith("2026");
    const mult = is2026 ? 1.4 : 1.0;
    const net = Math.round((50000 + Math.random() * 90000) * mult);
    const ords = Math.round(net / 400);
    return [m, net, ords];
  });
});

// Mock category sales summary
const categoriesSummary = categories.map(cat => {
  const ytdSales = cat === "Apparel" ? 11500000 : (cat === "Headwear" ? 9200000 : (cat === "Accessories" ? 3100000 : 2560000));
  const pytdSales = Math.round(ytdSales * 0.75);
  return {
    category: cat,
    ytd_sales: ytdSales,
    pytd_sales: pytdSales,
    pct_change: parseFloat(((ytdSales - pytdSales) / pytdSales * 100).toFixed(1))
  };
});

// Partners list with YTD, PYTD, Δ%, T12M, lifetime, last order
const partnersSummary = partnersList.map((partner, index) => {
  const ytd = Math.round(1800000 - (index * 210000) + Math.random() * 40000);
  const pytd = Math.round(ytd * 0.72);
  const t12m = Math.round(ytd * 1.5);
  const lifetime = Math.round(ytd * 3.4);
  const change = parseFloat(((ytd - pytd) / pytd * 100).toFixed(1));
  const last_order = index === 0 ? "2026-07-08" : `2026-07-0${8 - index}`;
  return {
    partner,
    ytd,
    pytd,
    change,
    t12m,
    lifetime,
    last_order
  };
});

// Customers summary
const customersSummary = Array.from({ length: 100 }).map((_, index) => {
  const isVip = index < 15;
  const isActive = index >= 15 && index < 70;
  const lifetime_sales = Math.round(isVip ? (8000 + Math.random() * 12000) : (isActive ? (1200 + Math.random() * 4000) : (400 + Math.random() * 800)));
  const order_count = Math.round(lifetime_sales / 150);
  const last_order_days_ago = index < 45 ? Math.floor(Math.random() * 30) : (index < 80 ? Math.floor(Math.random() * 90) : 90 + Math.floor(Math.random() * 120));
  const last_order_date = new Date(new Date("2026-07-08").getTime() - last_order_days_ago * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const tag = isVip ? "VIP" : (last_order_days_ago >= 90 ? "AT RISK" : "ACTIVE");

  return {
    customer_id: `CUST-${1000 + index}`,
    name: ["John Doe", "Jane Smith", "Robert Johnson", "Michael Brown", "David Miller", "James Davis", "William Garcia", "Mary Rodriguez", "Patricia Martinez", "Linda Hernandez"][index % 10] + ` ${index}`,
    email: `customer${index}@example.com`,
    city: ["Scottsdale", "Phoenix", "Dallas", "Orlando", "Las Vegas", "San Diego", "Austin", "Atlanta"][index % 8],
    state: ["AZ", "AZ", "TX", "FL", "NV", "CA", "TX", "GA"][index % 8],
    lifetime_sales,
    order_count,
    last_order_date,
    tag,
    is_new: index % 4 === 0
  };
});

// International vs domestic
const internationalSummary = [
  { region: "Domestic", ytd: 23800000, pytd: 17200000, pct: 90.3 },
  { region: "International", ytd: 2560000, pytd: 1930000, pct: 9.7 }
];

// Subregion breakdown
const subregionsSummary = subregions.map(sub => {
  const ytd = Math.round(catSales(sub));
  const pytd = Math.round(ytd * 0.74);
  return {
    subregion: sub,
    ytd,
    pytd,
    change: parseFloat(((ytd - pytd) / pytd * 100).toFixed(1))
  };
});

function catSales(sub: string) {
  switch(sub) {
    case "Midwest": return 4800000;
    case "Northeast": return 3200000;
    case "Southeast": return 6100000;
    case "Southwest": return 5300000;
    case "West": return 4400000;
    default: return 2560000;
  }
}

// 14 Week and 14 Day trends
const weekly14: any[] = [];
for (let i = 14; i >= 0; i--) {
  const wStart = new Date(new Date("2026-07-08").getTime() - i * 7 * 24 * 60 * 60 * 1000);
  const wLabel = `Wk ${wStart.toISOString().split("T")[0].slice(5)}`;
  weekly14.push({
    week: wLabel,
    net_usd: Math.round(400000 + Math.random() * 250000),
    py_net_usd: Math.round(310000 + Math.random() * 180000),
    orders: Math.round(1000 + Math.random() * 600)
  });
}

const daily14: any[] = [];
for (let i = 14; i >= 0; i--) {
  const dDate = new Date(new Date("2026-07-08").getTime() - i * 24 * 60 * 60 * 1000);
  const dLabel = dDate.toISOString().split("T")[0];
  daily14.push({
    date: dLabel,
    net_usd: Math.round(40000 + Math.random() * 35000),
    orders: Math.round(100 + Math.random() * 90)
  });
}

// Rep performance vs Territory
const repsSummary = [
  { rep_name: "John Miller", rep_key: "JM", category: "Headwear", territory: "Southeast", ytd: 4200000, goal: 3800000, attainment_pct: 110.5 },
  { rep_name: "Sarah Jenkins", rep_key: "SJ", category: "Apparel", territory: "West", ytd: 3800000, goal: 4000000, attainment_pct: 95.0 },
  { rep_name: "David Ross", rep_key: "DR", category: "Accessories", territory: "Northeast", ytd: 2900000, goal: 2500000, attainment_pct: 116.0 },
  { rep_name: "Emily Vance", rep_key: "EV", category: "CMC Custom", territory: "Southwest", ytd: 3100000, goal: 3000000, attainment_pct: 103.3 },
  { rep_name: "Michael Chang", rep_key: "MC", category: "Apparel", territory: "Midwest", ytd: 2400000, goal: 2800000, attainment_pct: 85.7 }
];

// Order-level detail
const mockOrders = Array.from({ length: 350 }).map((_, i) => {
  const date = new Date(new Date("2026-07-08").getTime() - Math.floor(Math.random() * 120) * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const order_id = `SO-${142510 + i}`;
  const brand = i % 3 === 0 ? "cmc" : "bc";
  const channel = channels[i % channels.length];
  const partner = channel === "Partner-Wholesale" ? partnersList[i % partnersList.length] : "Direct Consumer";
  const category = categories[i % categories.length];
  const customer = `Customer ${i + 1}`;
  const net_usd = parseFloat((120 + Math.random() * 980).toFixed(2));
  const status = statuses[i % statuses.length];
  const tracking_number = i % 10 === 0 ? "" : `1Z${Math.random().toString(36).substring(2, 17).toUpperCase()}`;
  const ship_days = status === "Shipped" || status === "Billed" ? Math.floor(1 + Math.random() * 6) : null;
  const state = ["AZ", "CA", "TX", "FL", "NY", "IL", "OH", "GA"][i % 8];
  const country = i % 25 === 0 ? "CA" : "US";

  return {
    order_id,
    order_date: date,
    brand,
    channel,
    partner,
    category,
    customer,
    net_usd,
    status,
    tracking_number,
    ship_days,
    state,
    country
  };
});

// API Routes
app.get("/api/bq-health", (req, res) => {
  res.json({ isLive, error: bqError });
});

app.get("/api/dashboard-payload", (req, res) => {
  res.json({
    meta,
    kpis,
    cube: cubeRows,
    categories: categoriesSummary,
    partners: partnersSummary,
    customers: customersSummary,
    international: internationalSummary,
    subregions: subregionsSummary,
    reps: repsSummary,
    weekly14,
    daily14,
    ops,
    partner_months,
    isLive,
    bqError
  });
});

app.post("/api/paginated-orders", (req, res) => {
  const { page = 1, limit = 20, brand, status, month, search } = req.body;
  
  let filtered = [...mockOrders];

  if (brand && brand !== "All") {
    filtered = filtered.filter(o => o.brand.toLowerCase() === brand.toLowerCase());
  }
  if (status && status !== "All") {
    filtered = filtered.filter(o => o.status.toLowerCase() === status.toLowerCase());
  }
  if (month && month !== "All") {
    filtered = filtered.filter(o => o.order_date.startsWith(month));
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(o => 
      o.order_id.toLowerCase().includes(q) || 
      o.customer.toLowerCase().includes(q) || 
      o.partner.toLowerCase().includes(q)
    );
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const results = filtered.slice(startIndex, endIndex);

  res.json({
    orders: results,
    total: filtered.length,
    page,
    limit,
    totalPages: Math.ceil(filtered.length / limit)
  });
});

app.post("/api/new-entry", (req, res) => {
  const entry = req.body;
  console.log("Saving new revenue target or entry:", entry);
  res.json({ success: true, entry });
});

// Vite middleware and serving configurations
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
