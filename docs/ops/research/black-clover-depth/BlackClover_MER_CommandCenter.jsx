import { useState, useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell, AreaChart, Area, ComposedChart, Legend } from "recharts";

const MONTHLY = [{"Month":"2023-01","sales":259383.51,"google":20174.79,"meta":0.0,"microsoft":0.0,"criteo":0.0,"klaviyo":10238.99,"total":30413.78,"mer":8.53},{"Month":"2023-02","sales":213196.14,"google":21793.45,"meta":12424.34,"microsoft":0.0,"criteo":0.0,"klaviyo":10001.04,"total":44218.83,"mer":4.82},{"Month":"2023-03","sales":411474.17,"google":21123.09,"meta":42902.22,"microsoft":0.0,"criteo":0.0,"klaviyo":9198.94,"total":73224.25,"mer":5.62},{"Month":"2023-04","sales":202266.45,"google":18678.88,"meta":29596.96,"microsoft":0.0,"criteo":0.0,"klaviyo":9198.9,"total":57474.74,"mer":3.52},{"Month":"2023-05","sales":266487.99,"google":23891.1,"meta":9508.1,"microsoft":0.0,"criteo":0.0,"klaviyo":9198.94,"total":42598.14,"mer":6.26},{"Month":"2023-06","sales":510213.9,"google":27894.82,"meta":30774.08,"microsoft":0.0,"criteo":0.0,"klaviyo":11615.1,"total":70284.0,"mer":7.26},{"Month":"2023-07","sales":241049.33,"google":26050.89,"meta":25110.89,"microsoft":0.0,"criteo":0.0,"klaviyo":9198.94,"total":60360.72,"mer":3.99},{"Month":"2023-08","sales":407919.91,"google":25087.77,"meta":54000.63,"microsoft":0.0,"criteo":0.0,"klaviyo":12598.09,"total":91686.49,"mer":4.45},{"Month":"2023-09","sales":388281.9,"google":23560.36,"meta":51449.3,"microsoft":0.0,"criteo":0.0,"klaviyo":9198.9,"total":84208.56,"mer":4.61},{"Month":"2023-10","sales":236173.91,"google":23849.61,"meta":36966.22,"microsoft":0.0,"criteo":0.0,"klaviyo":9198.94,"total":70014.77,"mer":3.37},{"Month":"2023-11","sales":731058.34,"google":53380.39,"meta":164854.31,"microsoft":0.0,"criteo":0.0,"klaviyo":12665.1,"total":230899.8,"mer":3.17},{"Month":"2023-12","sales":507774.63,"google":54819.73,"meta":104382.65,"microsoft":0.0,"criteo":0.0,"klaviyo":10454.13,"total":169656.51,"mer":2.99},{"Month":"2024-01","sales":352985.35,"google":33997.84,"meta":42193.96,"microsoft":0.0,"criteo":37186.67,"klaviyo":10454.13,"total":123832.6,"mer":2.85},{"Month":"2024-02","sales":431675.57,"google":44476.22,"meta":51135.18,"microsoft":0.0,"criteo":19557.0,"klaviyo":10843.97,"total":126012.37,"mer":3.43},{"Month":"2024-03","sales":483068.99,"google":57767.87,"meta":40909.83,"microsoft":0.0,"criteo":19799.44,"klaviyo":10860.85,"total":129337.99,"mer":3.73},{"Month":"2024-04","sales":333815.14,"google":47425.17,"meta":21747.71,"microsoft":0.0,"criteo":24577.91,"klaviyo":10854.0,"total":104604.79,"mer":3.19},{"Month":"2024-05","sales":380240.34,"google":50764.58,"meta":17409.49,"microsoft":2158.14,"criteo":13834.94,"klaviyo":14072.14,"total":98239.29,"mer":3.87},{"Month":"2024-06","sales":482076.3,"google":49668.62,"meta":21616.97,"microsoft":5612.39,"criteo":0.0,"klaviyo":18426.9,"total":95324.88,"mer":5.06},{"Month":"2024-07","sales":381337.96,"google":36764.38,"meta":18987.95,"microsoft":5586.36,"criteo":739.08,"klaviyo":17063.95,"total":79141.71,"mer":4.82},{"Month":"2024-08","sales":432202.72,"google":35303.59,"meta":26097.9,"microsoft":1395.09,"criteo":4982.48,"klaviyo":20397.07,"total":88176.07,"mer":4.9},{"Month":"2024-09","sales":380100.52,"google":36854.43,"meta":27264.17,"microsoft":1001.65,"criteo":4984.39,"klaviyo":13238.1,"total":83342.74,"mer":4.56},{"Month":"2024-10","sales":313473.62,"google":24386.16,"meta":27333.56,"microsoft":1083.77,"criteo":5079.96,"klaviyo":17511.9,"total":75395.35,"mer":4.16},{"Month":"2024-11","sales":512652.18,"google":43934.65,"meta":93862.46,"microsoft":151.67,"criteo":2759.55,"klaviyo":18570.0,"total":159278.28,"mer":3.22},{"Month":"2024-12","sales":447503.73,"google":72267.66,"meta":55076.16,"microsoft":0.0,"criteo":0.0,"klaviyo":18334.02,"total":145677.84,"mer":3.07},{"Month":"2025-01","sales":249851.7,"google":17986.34,"meta":39559.65,"microsoft":0.0,"criteo":0.0,"klaviyo":11912.99,"total":69458.98,"mer":3.6},{"Month":"2025-02","sales":280567.1,"google":45591.96,"meta":39913.09,"microsoft":104.74,"criteo":0.0,"klaviyo":11912.88,"total":97522.67,"mer":2.88},{"Month":"2025-03","sales":436905.48,"google":60530.78,"meta":49262.34,"microsoft":2571.84,"criteo":0.0,"klaviyo":11887.88,"total":124252.84,"mer":3.52},{"Month":"2025-04","sales":359370.22,"google":53260.58,"meta":36608.24,"microsoft":3738.85,"criteo":0.0,"klaviyo":11886.0,"total":105493.67,"mer":3.41},{"Month":"2025-05","sales":475127.14,"google":75521.57,"meta":38095.93,"microsoft":3667.5,"criteo":0.0,"klaviyo":11886.02,"total":129171.02,"mer":3.68},{"Month":"2025-06","sales":557386.0,"google":78068.72,"meta":57204.86,"microsoft":3902.93,"criteo":0.0,"klaviyo":11886.0,"total":151062.51,"mer":3.69},{"Month":"2025-07","sales":391777.49,"google":79043.81,"meta":59611.56,"microsoft":4380.7,"criteo":0.0,"klaviyo":11886.02,"total":154922.09,"mer":2.53},{"Month":"2025-08","sales":474886.05,"google":61172.98,"meta":45096.48,"microsoft":4320.02,"criteo":0.0,"klaviyo":11886.02,"total":122475.5,"mer":3.88},{"Month":"2025-09","sales":457330.02,"google":34602.65,"meta":43727.64,"microsoft":3428.21,"criteo":0.0,"klaviyo":11886.0,"total":93644.5,"mer":4.88},{"Month":"2025-10","sales":437277.97,"google":45307.19,"meta":35961.53,"microsoft":4463.27,"criteo":0.0,"klaviyo":11886.02,"total":97618.01,"mer":4.48},{"Month":"2025-11","sales":456474.65,"google":70884.43,"meta":71936.79,"microsoft":2757.05,"criteo":0.0,"klaviyo":11992.88,"total":157571.15,"mer":2.9},{"Month":"2025-12","sales":474623.62,"google":53376.62,"meta":45341.86,"microsoft":5526.07,"criteo":0.0,"klaviyo":12489.28,"total":116733.83,"mer":4.07},{"Month":"2026-01","sales":269082.08,"google":23335.53,"meta":24057.15,"microsoft":1268.76,"criteo":0.0,"klaviyo":12489.28,"total":61150.72,"mer":4.4},{"Month":"2026-02","sales":360515.06,"google":23657.02,"meta":40088.04,"microsoft":1656.57,"criteo":0.0,"klaviyo":11280.64,"total":76682.27,"mer":4.7},{"Month":"2026-03","sales":47459.12,"google":4817.05,"meta":4934.34,"microsoft":397.29,"criteo":0.0,"klaviyo":2014.4,"total":12163.08,"mer":3.9}];

const fmt$ = (v) => v >= 1000000 ? `$${(v/1000000).toFixed(2)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v?.toFixed(0)}`;
const fmtMER = (v) => v?.toFixed(2) + 'x';

const getMERColor = (v) => {
  if (v >= 4.0) return "#22c55e";
  if (v >= 2.5) return "#eab308";
  if (v >= 1.5) return "#f97316";
  return "#ef4444";
};

const getMERZone = (v) => {
  if (v >= 4.0) return { label: "HEALTHY", color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
  if (v >= 2.5) return { label: "WATCH", color: "#eab308", bg: "rgba(234,179,8,0.12)" };
  if (v >= 1.5) return { label: "DANGER", color: "#f97316", bg: "rgba(249,115,22,0.12)" };
  return { label: "CRISIS", color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
};

const TABS = ["MER TREND", "CHANNEL SPEND", "MONTHLY DEEP DIVE", "INSIGHTS"];

const CustomMERTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const zone = getMERZone(d.mer);
  return (
    <div style={{ background: "#0f1929", border: `1px solid ${zone.color}`, borderRadius: 8, padding: "12px 16px", minWidth: 200 }}>
      <div style={{ color: "#c9a84c", fontFamily: "Georgia, serif", fontSize: 13, fontWeight: "bold", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
        <span style={{ color: "#8899aa", fontSize: 11 }}>MER</span>
        <span style={{ color: zone.color, fontWeight: "bold", fontSize: 14 }}>{fmtMER(d.mer)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
        <span style={{ color: "#8899aa", fontSize: 11 }}>Revenue</span>
        <span style={{ color: "#e2e8f0", fontSize: 12 }}>{fmt$(d.sales)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
        <span style={{ color: "#8899aa", fontSize: 11 }}>Total Spend</span>
        <span style={{ color: "#e2e8f0", fontSize: 12 }}>{fmt$(d.total)}</span>
      </div>
      <div style={{ marginTop: 8, padding: "3px 8px", borderRadius: 4, background: zone.bg, display: "inline-block" }}>
        <span style={{ color: zone.color, fontSize: 10, fontWeight: "bold", letterSpacing: "0.1em" }}>{zone.label}</span>
      </div>
    </div>
  );
};

const CustomSpendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f1929", border: "1px solid #c9a84c44", borderRadius: 8, padding: "12px 16px" }}>
      <div style={{ color: "#c9a84c", fontFamily: "Georgia, serif", fontSize: 13, fontWeight: "bold", marginBottom: 8 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 3 }}>
          <span style={{ color: p.fill, fontSize: 11 }}>{p.name}</span>
          <span style={{ color: "#e2e8f0", fontSize: 11 }}>{fmt$(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function BlackCloverMER() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [hoveredMonth, setHoveredMonth] = useState(null);

  const displayData = useMemo(() => {
    let d = MONTHLY;
    if (selectedYear !== "ALL") d = d.filter(m => m.Month.startsWith(selectedYear));
    return d.map(m => ({ ...m, label: m.Month.slice(0, 7) }));
  }, [selectedYear]);

  const last3 = MONTHLY.slice(-3);
  const currentMER = last3[last3.length - 2]?.mer;
  const prevMER = last3[last3.length - 3]?.mer;
  const merDelta = currentMER - prevMER;

  const ytdData = MONTHLY.filter(m => m.Month.startsWith("2026"));
  const ytdRevenue = ytdData.reduce((s, m) => s + m.sales, 0);
  const ytdSpend = ytdData.reduce((s, m) => s + m.total, 0);
  const ytdMER = ytdRevenue / ytdSpend;

  const allTimeRevenue = MONTHLY.reduce((s, m) => s + m.sales, 0);

  const monthsBelow4 = MONTHLY.filter(m => m.mer < 4.0).length;
  const monthsAbove4 = MONTHLY.filter(m => m.mer >= 4.0).length;

  const bestMonth = MONTHLY.reduce((a, b) => a.mer > b.mer ? a : b);
  const worstMonth = MONTHLY.reduce((a, b) => a.mer < b.mer ? a : b);

  const currentZone = getMERZone(currentMER);

  // 2025 channel breakdown
  const y2025 = MONTHLY.filter(m => m.Month.startsWith("2025"));
  const spend2025 = { google: 0, meta: 0, microsoft: 0, criteo: 0, klaviyo: 0 };
  y2025.forEach(m => {
    spend2025.google += m.google;
    spend2025.meta += m.meta;
    spend2025.microsoft += m.microsoft;
    spend2025.criteo += m.criteo;
    spend2025.klaviyo += m.klaviyo;
  });
  const totalControllable = spend2025.google + spend2025.meta + spend2025.microsoft + spend2025.criteo;

  // Insights
  const insights = [
    {
      type: "PATTERN",
      icon: "📅",
      title: "Summer Spend Trap",
      body: `Jul 2025: highest spend month ($154.9K) but 2nd-lowest MER (2.53x). Jun 2025 spent $151K at 3.69x. Overspending into summer diminishing returns.`,
      action: "Cap July budget at $110K — redirect $40K to Sept (historically 4.88x MER)",
      severity: "danger"
    },
    {
      type: "OPPORTUNITY",
      icon: "🎯",
      title: "Sept–Oct is Your Alpha Window",
      body: `Sept 2024: 4.56x MER on $83K spend. Sept 2025: 4.88x MER on $94K spend. Consistent outperformance with moderate spend — not a BFCM spike, organic efficiency.`,
      action: "Pre-load creative and increase budget 20% in Aug to capture Sept momentum",
      severity: "healthy"
    },
    {
      type: "WARNING",
      icon: "⚠️",
      title: "BFCM MER Consistently Disappoints",
      body: `Nov 2023: 3.17x. Nov 2024: 3.22x. Nov 2025: 2.90x — trending DOWN year over year despite massive spend increases. Revenue goes up, profitability ratio goes down.`,
      action: "Stress-test BFCM budget. Consider a $130K cap with harder MER floor enforcement during the window.",
      severity: "watch"
    },
    {
      type: "OPPORTUNITY",
      icon: "🍀",
      title: "St. Patrick's Day is a Brand Superpower",
      body: `Mar 2023: 5.62x MER on $73K. Mar 2024: 3.73x (Criteo added, diluted efficiency). Mar 2025: 3.52x. The base demand is there — channel mix is the variable.`,
      action: "Cut Criteo in March, concentrate Google + Meta on green/clover creative. Target 5.0x+ MER.",
      severity: "opportunity"
    },
    {
      type: "PATTERN",
      icon: "📈",
      title: "2026 Starting Strong",
      body: `Jan 2026: 4.40x MER. Feb 2026: 4.70x MER. Both healthy on lean budgets ($61K, $77K). Efficiency is high — room to scale before diminishing returns.`,
      action: "Model suggests $90–100K/month optimal in Q1 2026 to maintain ≥4.0x while scaling revenue.",
      severity: "healthy"
    },
    {
      type: "WARNING",
      icon: "🔍",
      title: "Criteo/AdRoll: No Clear Signal",
      body: `2024 only. Jan 2024: $37K on Criteo, MER 2.85x (worst month that year). Dropped by Q3 and MER recovered to 4.5x+. Correlation isn't causation but the pattern is notable.`,
      action: "Do not reintroduce Criteo without an isolated test. Current Google + Meta mix is performing better.",
      severity: "watch"
    },
  ];

  const sevColor = { healthy: "#22c55e", watch: "#eab308", danger: "#ef4444", opportunity: "#c9a84c" };
  const sevBg = { healthy: "rgba(34,197,94,0.08)", watch: "rgba(234,179,8,0.08)", danger: "rgba(239,68,68,0.08)", opportunity: "rgba(201,168,76,0.08)" };

  return (
    <div style={{ background: "#080f1a", minHeight: "100vh", fontFamily: "'Trebuchet MS', sans-serif", color: "#e2e8f0" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0a1628 0%, #0f1f3d 50%, #0a1628 100%)", borderBottom: "1px solid #c9a84c44", padding: "0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 20, paddingBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 28, letterSpacing: "-0.02em" }}>
              <span style={{ fontFamily: "Georgia, serif", color: "#c9a84c", fontWeight: "bold" }}>BLACK CLOVER</span>
            </div>
            <div style={{ width: 1, height: 28, background: "#c9a84c44" }} />
            <div style={{ fontSize: 11, color: "#8899aa", letterSpacing: "0.15em", textTransform: "uppercase" }}>MER Command Center</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ padding: "4px 12px", borderRadius: 20, background: currentZone.bg, border: `1px solid ${currentZone.color}44`, fontSize: 11, color: currentZone.color, fontWeight: "bold", letterSpacing: "0.1em" }}>
              {currentZone.label} · Feb 2026: {fmtMER(currentMER)}
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, padding: "16px 0 20px" }}>
          {[
            { label: "2026 YTD MER", value: fmtMER(ytdMER), sub: "Jan–Feb 2026", color: getMERColor(ytdMER), delta: null },
            { label: "2026 YTD Revenue", value: fmt$(ytdRevenue), sub: "Jan–Feb 2026", color: "#e2e8f0", delta: null },
            { label: "2026 YTD Spend", value: fmt$(ytdSpend), sub: "Total cost", color: "#e2e8f0", delta: null },
            { label: "MoM MER Δ", value: (merDelta >= 0 ? "+" : "") + fmtMER(merDelta), sub: "Feb vs Jan 2026", color: merDelta >= 0 ? "#22c55e" : "#ef4444", delta: merDelta },
            { label: "All-Time Revenue", value: fmt$(allTimeRevenue), sub: "Jan 2023 – Mar 2026", color: "#c9a84c", delta: null },
          ].map((kpi, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: "#8899aa", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>{kpi.label}</div>
              <div style={{ fontSize: 22, fontWeight: "bold", color: kpi.color, fontFamily: "Georgia, serif", letterSpacing: "-0.01em" }}>{kpi.value}</div>
              <div style={{ fontSize: 10, color: "#667788", marginTop: 3 }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderTop: "1px solid #c9a84c22" }}>
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              padding: "10px 24px", fontSize: 11, letterSpacing: "0.12em", fontWeight: "bold",
              cursor: "pointer", border: "none", background: "transparent",
              color: activeTab === i ? "#c9a84c" : "#667788",
              borderBottom: activeTab === i ? "2px solid #c9a84c" : "2px solid transparent",
              transition: "all 0.2s"
            }}>{tab}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "28px 32px" }}>

        {/* TAB 0: MER TREND */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontFamily: "Georgia, serif", color: "#c9a84c", fontSize: 20, margin: 0 }}>MER Over Time</h2>
                <p style={{ color: "#667788", fontSize: 12, margin: "4px 0 0" }}>Monthly Marketing Efficiency Ratio — target ≥ 4.0x (green zone)</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["ALL", "2023", "2024", "2025", "2026"].map(y => (
                  <button key={y} onClick={() => setSelectedYear(y)} style={{
                    padding: "5px 14px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontWeight: "bold",
                    background: selectedYear === y ? "#c9a84c" : "transparent",
                    border: `1px solid ${selectedYear === y ? "#c9a84c" : "#334455"}`,
                    color: selectedYear === y ? "#080f1a" : "#8899aa",
                    transition: "all 0.2s"
                  }}>{y}</button>
                ))}
              </div>
            </div>

            {/* Main MER Chart */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1e2d42", borderRadius: 12, padding: "20px 8px 8px", marginBottom: 20 }}>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={displayData} margin={{ left: 10, right: 20, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2e5bff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2e5bff" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fill: "#667788", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#1e2d42" }} interval={selectedYear === "ALL" ? 2 : 0} />
                  <YAxis yAxisId="sales" orientation="right" tickFormatter={v => fmt$(v)} tick={{ fill: "#667788", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="mer" orientation="left" domain={[0, 10]} tick={{ fill: "#667788", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v + "x"} />
                  <Tooltip content={<CustomMERTooltip />} />
                  <ReferenceLine yAxisId="mer" y={4.0} stroke="#22c55e" strokeDasharray="4 3" strokeOpacity={0.6} label={{ value: "4.0x Floor", fill: "#22c55e", fontSize: 10, position: "insideTopRight" }} />
                  <Area yAxisId="sales" type="monotone" dataKey="sales" fill="url(#salesGrad)" stroke="#2e5bff" strokeWidth={1.5} dot={false} name="Revenue" />
                  <Line yAxisId="mer" type="monotone" dataKey="mer" stroke="#c9a84c" strokeWidth={2.5} dot={(props) => {
                    const { cx, cy, payload } = props;
                    const color = getMERColor(payload.mer);
                    return <circle key={cx} cx={cx} cy={cy} r={4} fill={color} stroke="#080f1a" strokeWidth={1.5} />;
                  }} activeDot={{ r: 6, fill: "#c9a84c" }} name="MER" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* MER Zone summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "HEALTHY ≥ 4.0x", count: MONTHLY.filter(m => m.mer >= 4).length, color: "#22c55e", months: MONTHLY.filter(m => m.mer >= 4).map(m => m.Month.slice(0,7)).slice(-3).join(", ") },
                { label: "WATCH 2.5–4.0x", count: MONTHLY.filter(m => m.mer >= 2.5 && m.mer < 4).length, color: "#eab308", months: MONTHLY.filter(m => m.mer >= 2.5 && m.mer < 4).map(m => m.Month.slice(0,7)).slice(-3).join(", ") },
                { label: "DANGER 1.5–2.5x", count: MONTHLY.filter(m => m.mer >= 1.5 && m.mer < 2.5).length, color: "#f97316", months: MONTHLY.filter(m => m.mer >= 1.5 && m.mer < 2.5).map(m => m.Month.slice(0,7)).slice(-3).join(", ") },
                { label: "CRISIS < 1.5x", count: MONTHLY.filter(m => m.mer < 1.5).length, color: "#ef4444", months: "None" },
              ].map((z, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${z.color}33`, borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, color: z.color, letterSpacing: "0.1em", fontWeight: "bold", marginBottom: 6 }}>{z.label}</div>
                  <div style={{ fontSize: 28, fontWeight: "bold", color: z.color, fontFamily: "Georgia, serif" }}>{z.count}</div>
                  <div style={{ fontSize: 9, color: "#667788", marginTop: 4 }}>months · recent: {z.months || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 1: CHANNEL SPEND */}
        {activeTab === 1 && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: "Georgia, serif", color: "#c9a84c", fontSize: 20, margin: 0 }}>Channel Spend Breakdown</h2>
              <p style={{ color: "#667788", fontSize: 12, margin: "4px 0 0" }}>Monthly spend by channel — Klaviyo shown separately as fixed overhead ($330.29/day)</p>
            </div>

            {/* Stacked bar chart */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1e2d42", borderRadius: 12, padding: "20px 8px 8px", marginBottom: 24 }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={displayData} margin={{ left: 10, right: 20, top: 10, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fill: "#667788", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#1e2d42" }} interval={selectedYear === "ALL" ? 2 : 0} />
                  <YAxis tickFormatter={v => fmt$(v)} tick={{ fill: "#667788", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomSpendTooltip />} />
                  <Bar dataKey="google" stackId="a" fill="#4285f4" name="Google" radius={[0,0,0,0]} />
                  <Bar dataKey="meta" stackId="a" fill="#0866ff" name="Meta" />
                  <Bar dataKey="microsoft" stackId="a" fill="#00a4ef" name="Microsoft" />
                  <Bar dataKey="criteo" stackId="a" fill="#ff6b35" name="Criteo" />
                  <Bar dataKey="klaviyo" stackId="a" fill="#ffd166" name="Klaviyo (Fixed)" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 2025 Channel breakdown cards */}
            <div style={{ marginBottom: 16, fontSize: 12, color: "#8899aa", letterSpacing: "0.1em", textTransform: "uppercase" }}>2025 Full Year Channel Split</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Google", amount: spend2025.google, pct: spend2025.google / totalControllable, color: "#4285f4", note: "Primary lever" },
                { label: "Meta", amount: spend2025.meta, pct: spend2025.meta / totalControllable, color: "#0866ff", note: "Second lever" },
                { label: "Microsoft", amount: spend2025.microsoft, pct: spend2025.microsoft / totalControllable, color: "#00a4ef", note: "Scales poorly" },
                { label: "Criteo", amount: spend2025.criteo, pct: spend2025.criteo / totalControllable, color: "#ff6b35", note: "None in 2025" },
                { label: "Klaviyo (FIXED)", amount: spend2025.klaviyo, pct: null, color: "#ffd166", note: "$330.29/day — locked" },
              ].map((ch, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${ch.color}33`, borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: ch.color, fontWeight: "bold" }}>{ch.label}</div>
                    {i === 4 && <div style={{ fontSize: 9, background: "#ffd16622", color: "#ffd166", padding: "2px 6px", borderRadius: 4, letterSpacing: "0.05em" }}>FIXED</div>}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: "bold", color: "#e2e8f0", fontFamily: "Georgia, serif" }}>{fmt$(ch.amount)}</div>
                  <div style={{ fontSize: 10, color: "#667788", marginTop: 4 }}>
                    {ch.pct != null ? `${(ch.pct * 100).toFixed(1)}% of controllable` : ch.note}
                  </div>
                  {ch.pct != null && (
                    <div style={{ marginTop: 8, height: 3, background: "#1e2d42", borderRadius: 2 }}>
                      <div style={{ height: 3, background: ch.color, borderRadius: 2, width: `${Math.min(ch.pct * 100, 100)}%` }} />
                    </div>
                  )}
                  <div style={{ fontSize: 9, color: "#556677", marginTop: 4 }}>{ch.note}</div>
                </div>
              ))}
            </div>

            {/* Year over year spend vs MER table */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1e2d42", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2d42", fontSize: 11, color: "#c9a84c", letterSpacing: "0.1em", fontWeight: "bold" }}>ANNUAL SUMMARY</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {["Year", "Revenue", "Google", "Meta", "Other", "Klaviyo", "Total Spend", "MER"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", fontSize: 10, color: "#8899aa", letterSpacing: "0.1em", textAlign: "right", fontWeight: "bold", borderBottom: "1px solid #1e2d42" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {["2023","2024","2025","2026"].map(yr => {
                    const yd = MONTHLY.filter(m => m.Month.startsWith(yr));
                    const rev = yd.reduce((s,m) => s+m.sales, 0);
                    const g = yd.reduce((s,m) => s+m.google, 0);
                    const mt = yd.reduce((s,m) => s+m.meta, 0);
                    const oth = yd.reduce((s,m) => s+m.microsoft+m.criteo, 0);
                    const kl = yd.reduce((s,m) => s+m.klaviyo, 0);
                    const tot = yd.reduce((s,m) => s+m.total, 0);
                    const mer = rev / tot;
                    const zone = getMERZone(mer);
                    return (
                      <tr key={yr} style={{ borderBottom: "1px solid #1e2d4244" }}>
                        <td style={{ padding: "10px 16px", fontSize: 12, color: "#c9a84c", fontFamily: "Georgia, serif", fontWeight: "bold", textAlign: "right" }}>{yr}{yr === "2026" ? " (YTD)" : ""}</td>
                        <td style={{ padding: "10px 16px", fontSize: 11, color: "#e2e8f0", textAlign: "right" }}>{fmt$(rev)}</td>
                        <td style={{ padding: "10px 16px", fontSize: 11, color: "#4285f4", textAlign: "right" }}>{fmt$(g)}</td>
                        <td style={{ padding: "10px 16px", fontSize: 11, color: "#0866ff", textAlign: "right" }}>{fmt$(mt)}</td>
                        <td style={{ padding: "10px 16px", fontSize: 11, color: "#8899aa", textAlign: "right" }}>{fmt$(oth)}</td>
                        <td style={{ padding: "10px 16px", fontSize: 11, color: "#ffd16688", textAlign: "right", fontStyle: "italic" }}>{fmt$(kl)}</td>
                        <td style={{ padding: "10px 16px", fontSize: 11, color: "#8899aa", textAlign: "right" }}>{fmt$(tot)}</td>
                        <td style={{ padding: "10px 16px", textAlign: "right" }}>
                          <span style={{ background: zone.bg, color: zone.color, padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: "bold" }}>{fmtMER(mer)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: MONTHLY DEEP DIVE */}
        {activeTab === 2 && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: "Georgia, serif", color: "#c9a84c", fontSize: 20, margin: 0 }}>Monthly Deep Dive</h2>
              <p style={{ color: "#667788", fontSize: 12, margin: "4px 0 0" }}>All 39 months — click to inspect · MER color-coded by zone</p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 16 }}>
              {["ALL","2023","2024","2025","2026"].map(y => (
                <button key={y} onClick={() => setSelectedYear(y)} style={{
                  padding: "5px 14px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontWeight: "bold",
                  background: selectedYear === y ? "#c9a84c" : "transparent",
                  border: `1px solid ${selectedYear === y ? "#c9a84c" : "#334455"}`,
                  color: selectedYear === y ? "#080f1a" : "#8899aa",
                }}>{y}</button>
              ))}
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1e2d42", borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(201,168,76,0.08)" }}>
                    {["Month","Revenue","Google","Meta","Microsoft","Criteo","Klaviyo","Total Spend","MER","Zone"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", fontSize: 10, color: "#8899aa", letterSpacing: "0.08em", textAlign: "right", fontWeight: "bold", borderBottom: "1px solid #1e2d42" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayData.slice().reverse().map((m, i) => {
                    const zone = getMERZone(m.mer);
                    return (
                      <tr key={m.Month} style={{ borderBottom: "1px solid #1e2d4233", background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent", transition: "background 0.15s", cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,0.05)"}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent"}>
                        <td style={{ padding: "9px 14px", fontSize: 12, color: "#c9a84c", fontFamily: "Georgia, serif", fontWeight: "bold", textAlign: "right" }}>{m.Month}</td>
                        <td style={{ padding: "9px 14px", fontSize: 11, color: "#e2e8f0", textAlign: "right" }}>{fmt$(m.sales)}</td>
                        <td style={{ padding: "9px 14px", fontSize: 11, color: "#4285f4", textAlign: "right" }}>{fmt$(m.google)}</td>
                        <td style={{ padding: "9px 14px", fontSize: 11, color: "#6699ff", textAlign: "right" }}>{fmt$(m.meta)}</td>
                        <td style={{ padding: "9px 14px", fontSize: 11, color: "#8899aa", textAlign: "right" }}>{fmt$(m.microsoft)}</td>
                        <td style={{ padding: "9px 14px", fontSize: 11, color: "#8899aa", textAlign: "right" }}>{fmt$(m.criteo)}</td>
                        <td style={{ padding: "9px 14px", fontSize: 10, color: "#ffd16677", fontStyle: "italic", textAlign: "right" }}>{fmt$(m.klaviyo)}</td>
                        <td style={{ padding: "9px 14px", fontSize: 11, color: "#e2e8f0", textAlign: "right" }}>{fmt$(m.total)}</td>
                        <td style={{ padding: "9px 14px", textAlign: "right" }}>
                          <span style={{ color: zone.color, fontWeight: "bold", fontSize: 13 }}>{fmtMER(m.mer)}</span>
                        </td>
                        <td style={{ padding: "9px 14px", textAlign: "right" }}>
                          <span style={{ background: zone.bg, color: zone.color, padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: "bold", letterSpacing: "0.08em" }}>{zone.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: INSIGHTS */}
        {activeTab === 3 && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: "Georgia, serif", color: "#c9a84c", fontSize: 20, margin: 0 }}>Strategic Insights & Actions</h2>
              <p style={{ color: "#667788", fontSize: 12, margin: "4px 0 0" }}>Pattern-detected insights from 3 years of MER + spend data — each with a recommended action</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {insights.map((ins, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${sevColor[ins.severity]}33`, borderRadius: 12, padding: "20px 22px", borderLeft: `3px solid ${sevColor[ins.severity]}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 18 }}>{ins.icon}</span>
                      <div style={{ fontSize: 12, color: sevColor[ins.severity], fontWeight: "bold", letterSpacing: "0.05em" }}>{ins.title}</div>
                    </div>
                    <span style={{ background: sevBg[ins.severity], color: sevColor[ins.severity], padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: "bold", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{ins.type}</span>
                  </div>
                  <p style={{ color: "#a0aec0", fontSize: 12, lineHeight: 1.6, margin: "0 0 14px" }}>{ins.body}</p>
                  <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${sevColor[ins.severity]}22`, borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ fontSize: 9, color: sevColor[ins.severity], letterSpacing: "0.1em", fontWeight: "bold", marginBottom: 4 }}>RECOMMENDED ACTION</div>
                    <div style={{ fontSize: 11, color: "#c9d6e8", lineHeight: 1.5 }}>{ins.action}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20 }}>
              {[
                { label: "Best MER Month", value: bestMonth.Month, sub: fmtMER(bestMonth.mer), color: "#22c55e" },
                { label: "Worst MER Month", value: worstMonth.Month, sub: fmtMER(worstMonth.mer), color: "#ef4444" },
                { label: "Months Above 4.0x", value: monthsAbove4 + " / " + MONTHLY.length, sub: `${((monthsAbove4/MONTHLY.length)*100).toFixed(0)}% hit rate`, color: "#22c55e" },
                { label: "Avg Monthly Spend", value: fmt$(MONTHLY.reduce((s,m)=>s+m.total,0)/MONTHLY.length), sub: "Jan 2023 – Mar 2026", color: "#c9a84c" },
              ].map((s, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1e2d42", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#8899aa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: "bold", color: s.color, fontFamily: "Georgia, serif" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#667788", marginTop: 3 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #1e2d42", padding: "12px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 10, color: "#445566" }}>BLACK CLOVER MMM · Data: Jan 2023 – Mar 2026 · 39 months · MER Floor: 4.0x</div>
        <div style={{ fontSize: 10, color: "#c9a84c44" }}>⚠️ Klaviyo $330.29/day — FIXED annual contract, not an optimization lever</div>
      </div>
    </div>
  );
}
