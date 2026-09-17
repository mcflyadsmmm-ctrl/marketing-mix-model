import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Users,
  Globe,
  ShoppingCart,
  Plus,
  RefreshCw,
  Search,
  X,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Award,
  DollarSign,
  Briefcase,
  AlertCircle,
  Clock,
  CheckCircle,
  Truck
} from "lucide-react";
import { canon, PARTNER_MAP, getPartnerCategory, getPartnerBrand, detectCarrierAndLink, classifyOrder } from "./businessRules.ts";

export default function App() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<string>("tab-overview");
  const [showEntryModal, setShowEntryModal] = useState<boolean>(false);
  const [partnerModalData, setPartnerModalData] = useState<{ partner: string; months: any[] } | null>(null);
  
  // Dashboard Core States
  const [loading, setLoading] = useState<boolean>(true);
  const [payload, setPayload] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Filters State
  const [filterState, setFilterState] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    return {
      brand: "all",
      status: "all",
      partner: "all",
      month: `${yyyy}-${mm}`,
      category: "all",
      day: null as string | null
    };
  });

  const availableMonths = useMemo(() => {
    const months = [];
    const now = new Date();
    // Go back 24 months from today
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      months.push(`${yyyy}-${mm}`);
    }
    return months;
  }, []);

  // Partners Tab Search
  const [partnerSearch, setPartnerSearch] = useState<string>("");
  
  // Customers Tab States
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [customerHealthFilter, setCustomerHealthFilter] = useState<string>("all");

  // Orders Grid States (Server-side paginated simulation)
  const [gridPage, setGridPage] = useState<number>(1);
  const [gridSearch, setGridSearch] = useState<string>("");
  const [gridData, setGridData] = useState<any>(null);
  const [gridLoading, setGridLoading] = useState<boolean>(false);
  const [gridError, setGridError] = useState<string | null>(null);

  // Daily Entry Form State
  const [entryForm, setEntryForm] = useState({
    document_number: "",
    customer_name: "",
    order_date: new Date().toISOString().split("T")[0],
    amount_net: "",
    status: "Pending Fulfillment"
  });
  const [savingEntry, setSavingEntry] = useState<boolean>(false);
  const [entryMessage, setEntryMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [bqHealth, setBqHealth] = useState<{ connected: boolean; rows?: number; reason?: string } | null>(null);

  const fetchBqHealth = async () => {
    try {
      const res = await fetch("/api/bq-health");
      if (res.ok) {
        const data = await res.json();
        setBqHealth(data);
      } else {
        setBqHealth({ connected: false, reason: "HTTP status " + res.status });
      }
    } catch (err: any) {
      setBqHealth({ connected: false, reason: err.message || "Network error" });
    }
  };

  // Fetch Dashboard Payload
  const fetchPayload = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      fetchBqHealth();
      const res = await fetch(`/api/dashboard-payload${force ? "?force=true" : ""}`);
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const data = await res.json();
      setPayload(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayload();
    fetchBqHealth();
  }, []);

  // Sync / fetch orders grid when filters or page changes
  const fetchGridData = async () => {
    if (!payload) return;
    setGridLoading(true);
    setGridError(null);
    
    // Partner / Category drill -> union of raw aliases (matches historical rows)
    let aliases: string[] = [];
    if (filterState.partner && filterState.partner !== "all") {
      aliases = payload.partner_aliases[filterState.partner] || [filterState.partner];
    } else if (filterState.category && filterState.category !== "all") {
      payload.partners.forEach((p: any) => {
        if (p[1] === filterState.category) {
          aliases = [...aliases, ...(payload.partner_aliases[p[0]] || [p[0]])];
        }
      });
    }

    const params = {
      page: gridPage,
      pageSize: 15,
      searchTerm: gridSearch.trim(),
      status: filterState.status,
      brand: filterState.brand,
      month: filterState.month,
      day: filterState.day,
      partnerAliases: aliases
    };

    try {
      const res = await fetch("/api/paginated-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      if (!res.ok) throw new Error("Failed to fetch raw orders");
      const data = await res.json();
      setGridData(data);
    } catch (err: any) {
      setGridError(err.message || "Error fetching order list");
    } finally {
      setGridLoading(false);
    }
  };

  useEffect(() => {
    if (payload && activeTab === "tab-orders") {
      fetchGridData();
    }
  }, [payload, filterState, gridPage, gridSearch, activeTab]);

  // Handle Search Debounce for Orders Grid
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "tab-orders") {
        setGridPage(1);
        fetchGridData();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [gridSearch]);

  // Cube Matching logic for high-fidelity client side aggregates
  const cubeMatch = (r: any[], filters: typeof filterState, ignoreMonth = false) => {
    if (filters.status !== "all" && String(r[3]).toLowerCase() !== filters.status.toLowerCase()) return false;
    if (filters.brand !== "all" && r[4] !== filters.brand) return false;
    if (filters.partner !== "all" && r[1] !== filters.partner) return false;
    if (filters.category !== "all" && r[2] !== filters.category) return false;
    if (!ignoreMonth && filters.month !== "all" && r[0] !== filters.month) return false;
    return true;
  };

  // Live client-side dynamic aggregates recalculated on filter changes
  const computedAggregates = useMemo(() => {
    const breakdowns = payload;
    if (!payload) return null;
    const f = filterState;
    const filtered: any[] = [];
    const noMonth: any[] = [];

    (payload.cube || []).forEach((r: any[]) => {
      if (cubeMatch(r, f, true)) {
        noMonth.push(r);
        if (f.month === "all" || r[0] === f.month) filtered.push(r);
      }
    });

    const nowD = new Date();
    const currentYear = nowD.getFullYear();
    const curMM = ("0" + (nowD.getMonth() + 1)).slice(-2);
    const curQ = Math.ceil((nowD.getMonth() + 1) / 3);
    const qMMs = [1, 2, 3].map(i => ("0" + ((curQ - 1) * 3 + i)).slice(-2));

    const agg = {
      ytd: 0,
      pytd: 0,
      qtd: 0,
      pqtd: 0,
      mtd: 0,
      pmtd: 0,
      ytdOrders: 0,
      pytdOrders: 0,
      lifetime: 0
    };

    if (breakdowns && breakdowns.categories && !breakdowns.categories.error) {
       // Get exact totals from the live query
       agg.ytd = breakdowns.categories.reduce((sum, c) => {
         const val = Array.isArray(c) ? Number(c[2]) : Number(c.ytd_usd);
         return sum + (isNaN(val) ? 0 : val);
       }, 0);
       agg.pytd = breakdowns.categories.reduce((sum, c) => {
         const val = Array.isArray(c) ? Number(c[3]) : Number(c.pytd_usd);
         return sum + (isNaN(val) ? 0 : val);
       }, 0);
       agg.ytdOrders = breakdowns.categories.reduce((sum, c) => {
         const val = Array.isArray(c) ? Number(c[4]) : Number(c.ytd_orders);
         return sum + (isNaN(val) ? 0 : val);
       }, 0);
    }
    const regSourceForAgg = breakdowns.regions || breakdowns.international;
    if (breakdowns && regSourceForAgg && !regSourceForAgg.error) {
       agg.lifetime = regSourceForAgg.reduce((sum, r) => {
         const val = Array.isArray(r) ? Number(r[4]) : Number(r.lifetime_usd);
         return sum + (isNaN(val) ? 0 : val);
       }, 0);
    }

    if (breakdowns && breakdowns.monthly && !breakdowns.monthly.error) {
       const mMap: Record<string, number> = {};
       breakdowns.monthly.forEach(row => {
          if (!row) return;
          if (Array.isArray(row)) {
            const monthVal = row[0];
            const m = String(monthVal || "").substring(0, 7);
            if (m) {
              mMap[m] = (mMap[m] || 0) + Number(row[1]) + Number(row[3]);
            }
          } else {
            const monthVal = row.month ? (typeof row.month === "object" && row.month !== null ? row.month.value : row.month) : "";
            const m = String(monthVal || "").substring(0, 7);
            if (m) {
              mMap[m] = (mMap[m] || 0) + Number(row.net_usd);
            }
          }
       });
       agg.mtd = mMap["2026-07"] || 0;
       agg.pmtd = mMap["2025-07"] || 0;
       agg.qtd = (mMap["2026-07"] || 0) + (mMap["2026-08"] || 0) + (mMap["2026-09"] || 0); // Q3
       agg.pqtd = (mMap["2025-07"] || 0) + (mMap["2025-08"] || 0) + (mMap["2025-09"] || 0); // PQ3
    }

    const funnel = {
      revenue: 0,
      closed_shipped: 0,
      closed_pending: 0,
      closed_unshipped: 0,
      cancelled: 0,
      return: 0
    };

    filtered.forEach((r: any[]) => {
      const yr = parseInt(r[0].substring(0, 4), 10);
      const mm = r[0].slice(5, 7);
      const isTd = r[8] === 1;
      agg.lifetime += r[5];

      if (yr === currentYear) {
        agg.ytd += r[5];
        agg.ytdOrders += r[6];
        if (qMMs.indexOf(mm) !== -1) agg.qtd += r[5];
        if (mm === curMM) agg.mtd += r[5];
      } else if (yr === currentYear - 1 && isTd) {
        agg.pytd += r[5];
        agg.pytdOrders += r[6];
        if (qMMs.indexOf(mm) !== -1) agg.pqtd += r[5];
        if (mm === curMM) agg.pmtd += r[5];
      }

      const categoryBucket = r[7] as keyof typeof funnel;
      if (funnel[categoryBucket] !== undefined) {
        funnel[categoryBucket] += r[5];
      }
    });

    // Global filtered rows for category and partner tables (ignoring category/partner drills)
    // to show breakdowns across the global slicers (brand, status, month)
    const globalFilteredRows: any[] = [];
    (payload.cube || []).forEach((r: any[]) => {
      const matchBrand = f.brand === "all" || r[4] === f.brand;
      const matchStatus = f.status === "all" || String(r[3]).toLowerCase() === f.status.toLowerCase();
      const matchMonth = f.month === "all" || r[0] === f.month;
      if (matchBrand && matchStatus && matchMonth) {
        globalFilteredRows.push(r);
      }
    });

    // 1. DYNAMIC CATEGORIES TABLE
    let dynamicCategories = breakdowns?.categories && !breakdowns.categories.error
      ? breakdowns.categories.map((c) => {
          if (Array.isArray(c)) {
            return [
              c[0], // category
              c[1] || "House", // lead
              Number(c[2]), // ytd
              Number(c[3]), // pytd
              Number(c[4]), // ytd_orders
              Number(c[5]) || 0 // customers
            ];
          }
          return [
            c.category,
            c.rep_lead || "House",
            Number(c.ytd_usd),
            Number(c.pytd_usd),
            Number(c.ytd_orders),
            Number(c.ytd_customers || c.customers_ytd || 0)
          ];
        })
      : [];

    let dynamicChannels = breakdowns?.channels && !breakdowns.channels.error
      ? breakdowns.channels.map((c) => {
          if (Array.isArray(c)) {
            return [
              c[0], // sales_channel
              c[1] || "House", // lead
              Number(c[2]), // ytd
              Number(c[3]), // pytd
              Number(c[4]), // ytd_orders
              Number(c[5]) || 0
            ];
          }
          return [
            c.sales_channel,
            c.rep_lead || "House",
            Number(c.ytd_usd),
            Number(c.pytd_usd),
            Number(c.ytd_orders),
            0
          ];
        })
      : [];

    // 2. DYNAMIC PARTNERS TABLE
    let dynamicPartners = breakdowns?.partners && !breakdowns.partners.error
      ? breakdowns.partners.map((p) => {
          if (Array.isArray(p)) {
            return [
              p[0], // partner
              p[1] || "Unmapped", // category
              p[2] || "House", // rep_lead
              Number(p[3]), // ytd
              Number(p[4]), // pytd
              Number(p[5]), // t12m
              Number(p[6]), // lifetime
              Number(p[7]), // ytd_orders
              Number(p[8]) || 0, // ytd_customers
              Number(p[9]) || 0, // customers
              p[10] || "", // last_order
              p[11] || 0 // ytd_new_customers
            ];
          }
          return [
            p.partner,
            p.category || "Unmapped",
            p.rep_lead || "House",
            Number(p.ytd_usd),
            Number(p.pytd_usd),
            Number(p.t12m_usd),
            Number(p.lifetime_usd),
            Number(p.ytd_orders),
            Number(p.ytd_customers || p.customers_ytd || 0),
            Number(p.customers || 0),
            p.last_order || "",
            Number(p.ytd_new_customers || 0)
          ];
        })
      : [];

    // 3. DYNAMIC INTERNATIONAL TABLE
    const regionSource = breakdowns?.regions || breakdowns?.international;
    let dynamicInternational = regionSource && !regionSource.error
      ? regionSource.map((r) => {
          if (Array.isArray(r)) {
            return [
              r[0], // subregion
              r[1] || "All", // brand
              Number(r[2]), // ytd
              Number(r[3]), // pytd
              Number(r[4]), // lifetime
              Number(r[5]), // ytd_orders
              r[6] || 0 // is_international
            ];
          }
          return [
            r.subregion,
            r.brand_canonical || "All",
            Number(r.ytd_usd),
            Number(r.pytd_usd),
            Number(r.lifetime_usd),
            Number(r.ytd_orders),
            r.is_international || 0
          ];
        })
      : [];

    
    let dynamicMonthly = payload.monthly || [];
    if (breakdowns && breakdowns.monthly && !breakdowns.monthly.error) {
       // Group by month
       const mMap = {};
       breakdowns.monthly.forEach(row => {
          if (!row) return;
          if (Array.isArray(row)) {
            const monthVal = row[0];
            const m = String(monthVal || "").substring(0, 7);
            if (m) {
               if (!mMap[m]) mMap[m] = [m, 0, 0, 0, 0];
               mMap[m][1] += Number(row[1]);
               mMap[m][2] += Number(row[2]);
               mMap[m][3] += Number(row[3]);
               mMap[m][4] += Number(row[4]);
            }
          } else {
            const monthVal = row.month ? (typeof row.month === "object" && row.month !== null ? row.month.value : row.month) : "";
            const m = String(monthVal || "").substring(0, 7);
            if (m) {
               if (!mMap[m]) mMap[m] = [m, 0, 0, 0, 0];
               if (row.brand_canonical === "Black Clover") {
                  mMap[m][1] += Number(row.net_usd);
                  mMap[m][2] += Number(row.orders);
               } else {
                  mMap[m][3] += Number(row.net_usd);
                  mMap[m][4] += Number(row.orders);
               }
            }
          }
       });
       dynamicMonthly = Object.keys(mMap).sort().map(k => mMap[k]);
    }

    return { filtered, noMonth, agg, funnel, dynamicCategories, dynamicChannels, dynamicPartners, dynamicInternational, dynamicMonthly };
  }, [payload, filterState]);

  // Handle drill down filters
  const setDrillFilter = (kind: keyof typeof filterState, value: string) => {
    setFilterState(prev => {
      const current = prev[kind];
      const newVal = current === value ? "all" : value; // toggle filter off if clicked again
      return { ...prev, [kind]: newVal };
    });
    setGridPage(1);
  };

  const clearFilter = (kind: keyof typeof filterState) => {
    setFilterState(prev => ({ ...prev, [kind]: "all" }));
    setGridPage(1);
  };

  const clearAllFilters = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    setFilterState({
      brand: "all",
      status: "all",
      partner: "all",
      month: `${yyyy}-${mm}`,
      category: "all",
      day: null
    });
    setGridPage(1);
  };

  // Submit New Daily Entry Form
  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEntry(true);
    setEntryMessage(null);
    try {
      const res = await fetch("/api/new-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryForm)
      });
      if (!res.ok) throw new Error("Failed to save entry");
      const result = await res.json();
      if (result.status === "SUCCESS") {
        setEntryMessage({ type: "success", text: "Entry successfully appended to system! Reloading master feed..." });
        setEntryForm({
          document_number: "",
          customer_name: "",
          order_date: new Date().toISOString().split("T")[0],
          amount_net: "",
          status: "Pending Fulfillment"
        });
        // Reload master data so it is visible
        setTimeout(() => {
          fetchPayload(true);
          setShowEntryModal(false);
          setEntryMessage(null);
        }, 1500);
      } else {
        throw new Error(result.message || "Unknown error occurred");
      }
    } catch (err: any) {
      setEntryMessage({ type: "error", text: err.message || "Error saving transaction" });
    } finally {
      setSavingEntry(false);
    }
  };

  // Helper formats
  const fmtUsd = (n: number, dec = 2) => {
    return "$" + Number(n).toLocaleString(undefined, {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec
    });
  };

  const compactUsd = (n: number) => {
    const a = Math.abs(n);
    if (a >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
    if (a >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
    return fmtUsd(n, 0);
  };

  const pctYoy = (cur: number, pri: number) => {
    if (pri <= 0) return cur > 0 ? "+100%" : "0%";
    const pct = ((cur - pri) / pri) * 100;
    return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
  };

  // Slicer lists
  const availableStatuses = ["Billed", "Pending Fulfillment", "Closed", "Cancelled", "Refunded"];

  // Render filter chips
  const activeChips = useMemo(() => {
    const chips = [];
    if (filterState.brand !== "all") chips.push({ k: "brand" as const, label: `Brand: ${filterState.brand === "bc" ? "Black Clover" : "CMC Design"}` });
    if (filterState.status !== "all") chips.push({ k: "status" as const, label: `Status: ${filterState.status}` });
    if (filterState.partner !== "all") chips.push({ k: "partner" as const, label: `Partner: ${filterState.partner}` });
    if (filterState.month !== "all") chips.push({ k: "month" as const, label: `Month: ${filterState.month}` });
    if (filterState.category !== "all") chips.push({ k: "category" as const, label: `Category: ${filterState.category}` });
    if (filterState.day) chips.push({ k: "day" as const, label: `Day: ${filterState.day}` });
    return chips;
  }, [filterState]);

  // Customer filtration helper
  const filteredCustomers = useMemo(() => {
    const breakdowns = payload;
    if (breakdowns && breakdowns.topCustomers && !breakdowns.topCustomers.error) {
      return breakdowns.topCustomers;
    }
    return [];
  }, [payload, filterState, customerSearch, customerHealthFilter]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8F7F3] font-sans text-[#1A1A1A]">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-10 w-10 animate-spin text-[#0284C7]" />
          <p className="text-sm font-medium tracking-wide uppercase text-[#64748B]">Initializing CEO Intelligence System...</p>
          <p className="mt-1 text-xs text-[#94A3B8]">Synchronizing with BigQuery Data Warehouse</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8F7F3] font-sans text-[#1A1A1A] p-6">
        <div className="max-w-md text-center bg-white border border-[#1A1A1A]/10 p-8 rounded-xl">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-rose-500" />
          <h2 className="text-xl font-bold tracking-tight text-[#0F172A]">Payload Synchronization Failed</h2>
          <p className="mt-2 text-sm text-[#64748B]">{error}</p>
          <button
            onClick={() => fetchPayload()}
            className="mt-6 w-full px-4 py-2 bg-[#0284C7] hover:bg-[#0284C7]/90 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { agg, funnel, dynamicCategories, dynamicChannels, dynamicPartners, dynamicInternational, dynamicMonthly } = computedAggregates!;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8F7F3] font-sans text-[#1A1A1A]">
      
      {/* SIDEBAR NAVIGATION - Editorial Aesthetic */}
      <aside className="flex w-64 flex-col border-r border-[#1A1A1A]/10 bg-white p-8 shrink-0 justify-between">
        <div>
          <div className="mb-10">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-[#0F172A] leading-none">
              Black Clover
            </h1>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#64748B]">
              Executive Intelligence
            </p>
            {payload && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-600 border border-slate-200">
                <span className={`h-1.5 w-1.5 rounded-full ${payload.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {payload.isLive ? 'Live GCP Connected' : 'Local Sandbox'}
              </div>
            )}
          </div>

          <nav className="space-y-6">
            <div>
              <p className="mb-2 text-[9px] font-extrabold uppercase tracking-widest text-[#94A3B8]">Overview</p>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setActiveTab("tab-overview")}
                    className={`w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider transition rounded-md ${
                      activeTab === "tab-overview"
                        ? "bg-[#0284C7]/10 text-[#0284C7] border-l-2 border-[#0284C7]"
                        : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50"
                    }`}
                  >
                    1 · Corporate Overview
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-2 text-[9px] font-extrabold uppercase tracking-widest text-[#94A3B8]">Intelligence</p>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setActiveTab("tab-categories")}
                    className={`w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider transition rounded-md ${
                      activeTab === "tab-categories"
                        ? "bg-[#0284C7]/10 text-[#0284C7] border-l-2 border-[#0284C7]"
                        : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50"
                    }`}
                  >
                    2 · Channel Categories
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("tab-partners")}
                    className={`w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider transition rounded-md ${
                      activeTab === "tab-partners"
                        ? "bg-[#0284C7]/10 text-[#0284C7] border-l-2 border-[#0284C7]"
                        : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50"
                    }`}
                  >
                    3 · Partner Analytics
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("tab-customers")}
                    className={`w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider transition rounded-md ${
                      activeTab === "tab-customers"
                        ? "bg-[#0284C7]/10 text-[#0284C7] border-l-2 border-[#0284C7]"
                        : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50"
                    }`}
                  >
                    4 · Customer Health
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("tab-international")}
                    className={`w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider transition rounded-md ${
                      activeTab === "tab-international"
                        ? "bg-[#0284C7]/10 text-[#0284C7] border-l-2 border-[#0284C7]"
                        : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50"
                    }`}
                  >
                    5 · Regional Growth
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-2 text-[9px] font-extrabold uppercase tracking-widest text-[#94A3B8]">Operations</p>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setActiveTab("tab-orders")}
                    className={`w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider transition rounded-md ${
                      activeTab === "tab-orders"
                        ? "bg-[#0284C7]/10 text-[#0284C7] border-l-2 border-[#0284C7]"
                        : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50"
                    }`}
                  >
                    6 · Fulfillment &amp; Ops
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="space-y-4 pt-6 border-t border-[#1A1A1A]/10">
          <button
            onClick={() => setShowEntryModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-sm"
          >
            <Plus className="h-3 w-3" /> New Daily Entry
          </button>
          
          <button
            onClick={() => fetchPayload(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#1A1A1A]/10 hover:bg-slate-50 text-[#1A1A1A] rounded-lg text-xs font-bold uppercase tracking-wider transition"
          >
            <RefreshCw className="h-3 w-3" /> Refresh Data
          </button>

          <div className="pt-2 text-[9px] text-[#64748B] font-medium leading-relaxed">
            <span className="block">As of: <b className="text-[#0F172A]">{payload.meta.asof}</b></span>
            <span className="block">Volume: <b className="text-[#0F172A]">{Number(payload.meta.row_count).toLocaleString()}</b> events</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT REGION */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Connection Notice Bar using bq-health */}
        {bqHealth && (
          bqHealth.connected ? (
            <div className="bg-emerald-50 border-b border-emerald-200 px-8 py-2.5 flex items-center justify-between gap-2.5 text-xs text-emerald-800 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <p className="font-semibold truncate">
                  Live data connected (through {payload?.meta?.asof || "unknown"})
                </p>
              </div>
              <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                Active Session
              </div>
            </div>
          ) : (
            (() => {
              let reasonStr = "key absent";
              if (!bqHealth.keyPresent || bqHealth.keyFormat === "absent") {
                reasonStr = "key absent";
              } else if (!bqHealth.parsedOk || bqHealth.keyFormat === "invalid") {
                reasonStr = bqHealth.reason || "key unparseable";
              } else {
                reasonStr = `query failed: ${bqHealth.reason || "unknown error"}`;
              }
              return (
                <div className="bg-amber-50 border-b border-amber-200 px-8 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs text-amber-800 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    <p className="font-semibold">
                      Live data unavailable — <span className="font-normal text-amber-700">{reasonStr}</span>
                    </p>
                  </div>
                </div>
              );
            })()
          )
        )}
        
        {/* HEADER AREA - Editorial Filter Bar */}
        <header className="bg-white border-b border-[#1A1A1A]/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-8 py-4 shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-[#0F172A] tracking-tight uppercase">
                {activeTab === "tab-overview" && "Corporate Summary"}
                {activeTab === "tab-categories" && "Channel Categories"}
                {activeTab === "tab-partners" && "Partner Analytics"}
                {activeTab === "tab-customers" && "Customer Ledger"}
                {activeTab === "tab-international" && "Regional Growth"}
                {activeTab === "tab-orders" && "Fulfillment Ledger"}
              </h2>
              {activeChips.length > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-[10px] font-bold text-rose-500 underline hover:text-rose-700"
                >
                  Clear All Filters
                </button>
              )}
            </div>
            {/* Filter chips list */}
            {activeChips.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {activeChips.map(c => (
                  <span key={c.k} className="inline-flex items-center gap-1.5 bg-[#0284C7]/10 border border-[#0284C7]/20 text-[#0284C7] rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {c.label}
                    <button onClick={() => clearFilter(c.k)} className="hover:text-rose-600 font-extrabold focus:outline-none">
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Global Slicers */}
          <div className="flex flex-col gap-2">
            {activeTab !== "tab-orders" && (filterState.brand !== 'all' || filterState.status !== 'all' || filterState.partner !== 'all' || filterState.month !== 'all') && (
              <div className="bg-amber-50 text-amber-800 text-[10px] font-bold px-3 py-1.5 rounded-md border border-amber-200 inline-block">
                Warning: The selected filter applies to the Orders grid only. Live breakdowns are not yet filtered.
              </div>
            )}
            <div className="flex flex-wrap gap-3 items-center">
            {/* Brand filter */}
            <div className="flex flex-col">
              <span className="text-[8px] font-extrabold uppercase text-[#94A3B8] tracking-widest mb-1">Brand Scope</span>
              <select
                value={filterState.brand}
                onChange={(e) => setFilterState(prev => ({ ...prev, brand: e.target.value }))}
                className="bg-white border border-[#1A1A1A]/15 rounded-lg px-3 py-1.5 text-xs text-[#0F172A] font-semibold focus:outline-none focus:ring-1 focus:ring-[#0284C7] tracking-wide"
              >
                <option value="all">All Brands</option>
                <option value="bc">Black Clover</option>
                <option value="cmc">CMC Design</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="flex flex-col">
              <span className="text-[8px] font-extrabold uppercase text-[#94A3B8] tracking-widest mb-1">Fulfillment Status</span>
              <select
                value={filterState.status}
                onChange={(e) => setFilterState(prev => ({ ...prev, status: e.target.value }))}
                className="bg-white border border-[#1A1A1A]/15 rounded-lg px-3 py-1.5 text-xs text-[#0F172A] font-semibold focus:outline-none focus:ring-1 focus:ring-[#0284C7] tracking-wide"
              >
                <option value="all">All Statuses</option>
                {availableStatuses.map(s => (
                  <option key={s} value={s.toLowerCase()}>{s}</option>
                ))}
              </select>
            </div>

            {/* Partner filter */}
            <div className="flex flex-col">
              <span className="text-[8px] font-extrabold uppercase text-[#94A3B8] tracking-widest mb-1">Partner Channel</span>
              <select
                value={filterState.partner}
                onChange={(e) => setFilterState(prev => ({ ...prev, partner: e.target.value }))}
                className="bg-white border border-[#1A1A1A]/15 rounded-lg px-3 py-1.5 text-xs text-[#0F172A] font-semibold focus:outline-none focus:ring-1 focus:ring-[#0284C7] tracking-wide max-w-[150px]"
              >
                <option value="all">All Partners</option>
                {payload.partners.map((p: any) => (
                  <option key={p[0]} value={p[0]}>{p[0]}</option>
                ))}
              </select>
            </div>

            {/* Month filter */}
            <div className="flex flex-col">
              <span className="text-[8px] font-extrabold uppercase text-[#94A3B8] tracking-widest mb-1">Month Period</span>
              <select
                value={filterState.month}
                onChange={(e) => setFilterState(prev => ({ ...prev, month: e.target.value }))}
                className="bg-white border border-[#1A1A1A]/15 rounded-lg px-3 py-1.5 text-xs text-[#0F172A] font-semibold focus:outline-none focus:ring-1 focus:ring-[#0284C7] tracking-wide"
              >
                <option value="all">All Months</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <div className="p-8 overflow-y-auto h-full space-y-8" id="main-scroll">
          
          {/* TAB 1: OVERVIEW SUMMARY */}
          {activeTab === "tab-overview" && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Header Title Area with Editorial font pairing */}
              <div>
                <h3 className="text-4xl font-light tracking-tight text-[#0F172A]">
                  Fiscal <span className="font-serif italic text-[#0284C7]">Momentum</span>
                </h3>
                <p className="mt-1 text-xs text-[#64748B]">
                  Live performance tracking across brand subsidiaries, operational pipelines, and key account managers.
                </p>
              </div>

              {/* STAT CARDS - EDITORIAL ACCENT BORDERS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-5 border-l-2 border-[#0284C7] shadow-sm">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">MTD Sales YOY</p>
                  <p className="text-3xl font-black text-[#0F172A] mt-1">{compactUsd(agg.mtd)}</p>
                  <p className={`text-[10px] font-bold mt-1.5 flex items-center gap-1 ${agg.mtd >= agg.pmtd ? "text-emerald-600" : "text-rose-500"}`}>
                    {agg.mtd >= agg.pmtd ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {pctYoy(agg.mtd, agg.pmtd)} vs PY ({compactUsd(agg.pmtd)})
                  </p>
                </div>

                <div className="bg-white p-5 border-l-2 border-[#0284C7]/50 shadow-sm">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">YTD Sales YOY</p>
                  <p className="text-3xl font-black text-[#0F172A] mt-1">{compactUsd(agg.ytd)}</p>
                  <p className={`text-[10px] font-bold mt-1.5 flex items-center gap-1 ${agg.ytd >= agg.pytd ? "text-emerald-600" : "text-rose-500"}`}>
                    {agg.ytd >= agg.pytd ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {pctYoy(agg.ytd, agg.pytd)} vs PY ({compactUsd(agg.pytd)})
                  </p>
                </div>

                <div className="bg-white p-5 border-l-2 border-emerald-500 shadow-sm">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">QTD Sales Performance</p>
                  <p className="text-3xl font-black text-[#0F172A] mt-1">{compactUsd(agg.qtd)}</p>
                  <p className="text-[10px] font-bold text-emerald-600 mt-1.5">
                    PQTD: {compactUsd(agg.pqtd)}
                  </p>
                </div>

                <div className="bg-white p-5 border-l-2 border-indigo-500 shadow-sm">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">Average Order Value</p>
                  <p className="text-3xl font-black text-[#0F172A] mt-1">
                    {agg.ytdOrders > 0 ? fmtUsd(agg.ytd / agg.ytdOrders, 2) : "—"}
                  </p>
                  <p className="text-[10px] font-bold text-[#64748B] mt-1.5 uppercase tracking-wide">
                    YTD: {Number(agg.ytdOrders).toLocaleString()} orders
                  </p>
                </div>
              </div>

              {/* BIGQUERY AUDITED WAREHOUSE METRICS SECTION */}
              <div className="space-y-4 pt-4 border-t border-[#1A1A1A]/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0F172A] flex items-center gap-2">
                      <span>BigQuery Audited Warehouse Metrics</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0284C7]" />
                    </h4>
                    <p className="text-[10px] text-[#64748B] mt-0.5">High-fidelity metrics verified directly against live data warehouse schemas.</p>
                  </div>
                  <div className="text-[10px] text-[#64748B] font-semibold bg-white border border-[#1A1A1A]/10 px-3 py-1 rounded shadow-sm shrink-0">
                    Data through: <span className="text-[#0284C7] font-bold">Data through {payload.meta.asof}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Bookings Gross */}
                  <div className="bg-white p-5 border border-[#1A1A1A]/10 shadow-sm rounded-lg hover:border-[#1A1A1A]/20 transition">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">Bookings (Gross)</p>
                    <p className="text-2xl font-black text-[#0F172A] mt-1">
                      {fmtUsd(payload.kpis.bookings_gross_ytd_usd, 0)}
                    </p>
                    <p className="text-[10px] text-indigo-600 mt-1 font-bold">YTD Gross Booking Value</p>
                  </div>

                  {/* Recognized Revenue */}
                  <div className="bg-white p-5 border border-[#1A1A1A]/10 shadow-sm rounded-lg hover:border-[#1A1A1A]/20 transition">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">Recognized Revenue</p>
                    <p className="text-2xl font-black text-[#0F172A] mt-1">
                      {fmtUsd(payload.kpis.recognized_ytd_usd, 0)}
                    </p>
                    <p className="text-[10px] text-indigo-600 mt-1 font-bold font-mono">Recognized YTD</p>
                  </div>

                  {/* Returns (display absolute value, labeled "Returns") */}
                  <div className="bg-white p-5 border border-[#1A1A1A]/10 shadow-sm rounded-lg hover:border-[#1A1A1A]/20 transition">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">Returns</p>
                    <p className="text-2xl font-black text-rose-600 mt-1">
                      {fmtUsd(Math.abs(payload.kpis.returns_ytd_usd), 0)}
                    </p>
                    <p className="text-[10px] text-rose-500 mt-1 font-bold">Authorized Returns &amp; Credits</p>
                  </div>

                  {/* Cancelled */}
                  <div className="bg-white p-5 border border-[#1A1A1A]/10 shadow-sm rounded-lg hover:border-[#1A1A1A]/20 transition">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">Cancelled</p>
                    <p className="text-2xl font-black text-[#0F172A] mt-1">
                      {fmtUsd(payload.kpis.cancelled_ytd_usd, 0)}
                    </p>
                    <p className="text-[10px] text-rose-500 mt-1 font-bold">Client Cancellations</p>
                  </div>

                  {/* Open Backlog */}
                  <div className="bg-white p-5 border border-[#1A1A1A]/10 shadow-sm rounded-lg hover:border-[#1A1A1A]/20 transition">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">Open Backlog</p>
                    <p className="text-2xl font-black text-[#0F172A] mt-1">
                      {fmtUsd(payload.kpis.open_backlog_ytd_usd, 0)}
                    </p>
                    <p className="text-[10px] text-amber-600 mt-1 font-bold">Outstanding Backlog Value</p>
                  </div>

                  {/* AOV YTD */}
                  <div className="bg-white p-5 border border-[#1A1A1A]/10 shadow-sm rounded-lg hover:border-[#1A1A1A]/20 transition">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">Average Order Value (YTD)</p>
                    <p className="text-2xl font-black text-[#0F172A] mt-1">
                      {fmtUsd(payload.kpis.aov_ytd, 2)}
                    </p>
                    <p className="text-[10px] text-indigo-600 mt-1 font-bold font-mono">
                      Across {Number(payload.kpis.orders_ytd).toLocaleString()} Orders
                    </p>
                  </div>

                  {/* Partner Share YTD */}
                  <div className="bg-white p-5 border border-[#1A1A1A]/10 shadow-sm rounded-lg hover:border-[#1A1A1A]/20 transition">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">Partner Channels YTD</p>
                    <p className="text-2xl font-black text-[#0F172A] mt-1">
                      {fmtUsd(payload.kpis.partner_ytd_usd, 0)}
                    </p>
                    <p className="text-[10px] text-indigo-600 mt-1 font-bold">
                      {((payload.kpis.partner_ytd_usd / (payload.kpis.company_ytd_usd || 1)) * 100).toFixed(1)}% of YTD Sales
                    </p>
                  </div>

                  {/* Customers YTD (approximate counts, labeled exactly as requested) */}
                  <div className="bg-white p-5 border border-[#1A1A1A]/10 shadow-sm rounded-lg hover:border-[#1A1A1A]/20 transition">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">customers (approx)</p>
                    <p className="text-2xl font-black text-[#0F172A] mt-1">
                      {Number(payload.kpis.customers_ytd).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 font-bold">
                      customer order-days
                    </p>
                  </div>
                </div>
              </div>

              {/* HISTORICAL REVENUE TRENDING PLOTS (High fidelity custom responsive SVG line/bar chart) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Daily strip - custom high-fidelity visual */}
                <div className="bg-white p-6 border border-[#1A1A1A]/10 shadow-sm rounded-lg flex flex-col">
                  <div className="mb-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0F172A]">Sales Daily Velocity (Last 14 Days)</h4>
                    <p className="text-[10px] text-[#64748B] mt-0.5">Click a day to filter Operations Tab raw orders to that specific day.</p>
                  </div>
                  <div className="h-44 flex items-end gap-1 pb-2 border-b border-[#1A1A1A]/10 relative">
                    {payload.daily14.filter((d: any) => filterState.brand === "all" || d[3] === filterState.brand).map((d: any, idx: number) => {
                      const maxVal = Math.max(...payload.daily14.map((x: any) => x[1]), 1);
                      const heightPct = (d[1] / maxVal) * 85;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setFilterState(prev => ({ ...prev, day: d[0] }));
                            setActiveTab("tab-orders");
                          }}
                          className="group flex-1 flex flex-col items-center cursor-pointer h-full justify-end relative"
                        >
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-1 bg-[#0F172A] text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition duration-150 z-20 pointer-events-none whitespace-nowrap font-mono">
                            {d[0]}: {fmtUsd(d[1], 0)} ({d[2]} ord)
                          </div>
                          <div
                            style={{ height: `${Math.max(4, heightPct)}%` }}
                            className={`w-full rounded-t-sm transition-all duration-300 ${
                              filterState.day === d[0] ? "bg-amber-500" : "bg-[#0284C7] hover:bg-[#0284C7]/80"
                            }`}
                          ></div>
                          <span className="text-[9px] font-bold text-[#64748B] mt-1.5 scale-90">{d[0].substring(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Weekly strip */}
                <div className="bg-white p-6 border border-[#1A1A1A]/10 shadow-sm rounded-lg flex flex-col">
                  <div className="mb-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0F172A]">Sales Weekly Rolling Volume</h4>
                    <p className="text-[10px] text-[#64748B] mt-0.5">YTD Sat–Fri billing cycles indicating global scale.</p>
                  </div>
                  <div className="h-44 flex items-end gap-1.5 pb-2 border-b border-[#1A1A1A]/10 relative">
                    {payload.weekly14.filter((w: any) => filterState.brand === "all" || w[3] === filterState.brand).map((w: any, idx: number) => {
                      const maxVal = Math.max(...payload.weekly14.map((x: any) => x[1]), 1);
                      const heightPct = (w[1] / maxVal) * 85;
                      return (
                        <div
                          key={idx}
                          className="group flex-1 flex flex-col items-center h-full justify-end relative"
                        >
                          <div className="absolute bottom-full mb-1 bg-[#0F172A] text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition duration-150 z-20 pointer-events-none whitespace-nowrap font-mono">
                            Week of {w[0]}: {fmtUsd(w[1], 0)}
                          </div>
                          <div
                            style={{ height: `${Math.max(4, heightPct)}%` }}
                            className="w-full bg-[#10B981] hover:bg-[#10B981]/80 rounded-t-sm transition-all duration-300"
                          ></div>
                          <span className="text-[9px] font-bold text-[#64748B] mt-1.5 scale-90">{w[0].substring(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RECONCILIATION FUNNEL & CHANNEL DISTRIBUTION */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Funnel Widget */}
                <div className="bg-white p-6 border border-[#1A1A1A]/10 shadow-sm rounded-lg">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0F172A] mb-4">Reconciliation Funnel Distribution</h4>
                  <div className="space-y-4">
                    {/* Calculations */}
                    {(() => {
                      const totalPipeline = funnel.revenue + funnel.closed_shipped + funnel.closed_pending + funnel.closed_unshipped;
                      const funnelLines = [
                        { label: "Total Operational Pipeline", value: totalPipeline, color: "bg-[#0F172A]" },
                        { label: "Open Outstanding Revenue (Billed / Pending)", value: funnel.revenue, color: "bg-[#0284C7]" },
                        { label: "Closed &amp; Shipped Orders", value: funnel.closed_shipped, color: "bg-emerald-600" },
                        { label: "Closed — Pending Shipment", value: funnel.closed_pending, color: "bg-amber-500" },
                        { label: "Closed — Unshipped", value: funnel.closed_unshipped, color: "bg-amber-400" },
                        { label: "Client Cancellations", value: funnel.cancelled, color: "bg-rose-500" },
                        { label: "Authorized Returns & Credits", value: funnel.return, color: "bg-rose-400" }
                      ];

                      return funnelLines.map((line, idx) => {
                        const pct = totalPipeline > 0 ? (line.value / totalPipeline) * 100 : 0;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-medium text-[#1A1A1A]" dangerouslySetInnerHTML={{ __html: line.label }}></span>
                              <span className="font-mono font-bold text-[#0F172A]">
                                {fmtUsd(line.value, 0)} {pct > 0 && idx > 0 ? `(${pct.toFixed(1)}%)` : ""}
                              </span>
                            </div>
                            <div className="w-full bg-[#F8F7F3] rounded-full h-2 overflow-hidden border border-[#1A1A1A]/5">
                              <div className={`${line.color} h-2 transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0.5, idx === 0 ? 100 : pct))}%` }}></div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Monthly Momentum stacked plot */}
                <div className="bg-white p-6 border border-[#1A1A1A]/10 shadow-sm rounded-lg flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0F172A]">Monthly Volume split (Last 12 Months)</h4>
                    <p className="text-[10px] text-[#64748B] mt-0.5">Dynamic brand-wise stacking. Click a month bar to filter entire dashboard.</p>
                  </div>
                  <div className="h-48 flex items-end gap-2 pb-2 mt-6 border-b border-[#1A1A1A]/10 relative">
                    {dynamicMonthly.slice(-12).map((m: any, idx: number) => {
                      const totalVal = m[1] + m[3];
                      const maxVal = Math.max(...dynamicMonthly.slice(-12).map((x: any) => x[1] + x[3]), 1);
                      const heightBc = (m[1] / maxVal) * 85;
                      const heightCmc = (m[3] / maxVal) * 85;

                      const isSelected = filterState.month === m[0];

                      return (
                        <div
                          key={idx}
                          onClick={() => setDrillFilter("month", m[0])}
                          className={`group flex-1 flex flex-col items-center cursor-pointer h-full justify-end relative rounded-t ${
                            isSelected ? "ring-2 ring-amber-500 ring-offset-2" : ""
                          }`}
                        >
                          <div className="absolute bottom-full mb-1 bg-[#0F172A] text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition duration-150 z-20 pointer-events-none whitespace-nowrap font-mono">
                            {m[0]} - BC: {compactUsd(m[1])} | CMC: {compactUsd(m[3])}
                          </div>
                          
                          <div className="w-full flex flex-col justify-end">
                            {/* CMC Bar */}
                            <div style={{ height: `${heightCmc}%` }} className="w-full bg-[#10B981] hover:bg-[#10B981]/90 rounded-t-sm"></div>
                            {/* BC Bar */}
                            <div style={{ height: `${heightBc}%` }} className="w-full bg-[#0284C7] hover:bg-[#0284C7]/90"></div>
                          </div>

                          <span className="text-[9px] font-bold text-[#64748B] mt-1.5 tracking-tighter">{m[0].substring(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 items-center justify-center mt-3 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 bg-[#0284C7] rounded-sm"></div>
                      <span>Black Clover</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 bg-[#10B981] rounded-sm"></div>
                      <span>CMC Design</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHANNEL CATEGORIES */}
          {activeTab === "tab-categories" && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-4xl font-light tracking-tight text-[#0F172A]">
                  Channel <span className="font-serif italic text-[#0284C7]">Categories</span>
                </h3>
                <p className="mt-1 text-xs text-[#64748B]">
                  Revenue, market share, and averages mapped by core product categorization channels. Click on any row to drill down.
                </p>
              </div>

              <div className="bg-white border border-[#1A1A1A]/10 shadow-sm rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8F7F3] border-b border-[#1A1A1A]/10 text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">
                      <th className="px-6 py-4">Channel Name</th>
                      <th className="px-6 py-4">Lead Account Executive</th>
                      <th className="px-6 py-4 text-right">YTD Revenue</th>
                      <th className="px-6 py-4 text-center">Market Share</th>
                      <th className="px-6 py-4 text-right">PYTD Revenue</th>
                      <th className="px-6 py-4 text-right">Growth YOY</th>
                      <th className="px-6 py-4 text-right">YTD Orders</th>
                      <th className="px-6 py-4 text-right">YTD Customer Order-Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]/5 text-[#1A1A1A]">
                    {dynamicCategories.map((cat: any, idx: number) => {
                      const isSelected = filterState.category === cat[0];
                      const totalYtd = dynamicCategories.reduce((acc: number, val: any) => acc + val[2], 0);
                      const sharePct = totalYtd > 0 ? (cat[2] / totalYtd) * 100 : 0;
                      return (
                        <tr
                          key={idx}
                          onClick={() => setDrillFilter("category", cat[0])}
                          className={`hover:bg-[#F8F7F3]/50 cursor-pointer transition ${
                            isSelected ? "bg-[#0284C7]/5 font-bold" : ""
                          }`}
                        >
                          <td className="px-6 py-4 flex items-center gap-2">
                            {cat[0]}
                            {isSelected && <span className="text-[9px] bg-[#0284C7] text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">Active Filter</span>}
                          </td>
                          <td className="px-6 py-4 text-[#64748B] font-medium">{cat[1]}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-[#0F172A]">{fmtUsd(cat[2], 0)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-[#0284C7] h-1.5" style={{ width: `${Math.min(100, sharePct)}%` }}></div>
                              </div>
                              <span className="text-[10px] font-mono text-[#64748B] w-8">{sharePct.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-[#64748B]">{fmtUsd(cat[3], 0)}</td>
                          <td className={`px-6 py-4 text-right font-bold ${cat[2] >= cat[3] ? "text-emerald-600" : "text-rose-500"}`}>
                            {pctYoy(cat[2], cat[3])}
                          </td>
                          <td className="px-6 py-4 text-right font-mono">{Number(cat[4]).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-mono text-indigo-600">{Number(cat[5]).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* SALES CHANNELS (Q2) */}
              <div className="mt-8">
                <h3 className="text-4xl font-light tracking-tight text-[#0F172A]">
                  Sales <span className="font-serif italic text-[#0284C7]">Channels</span>
                </h3>
              </div>
              <div className="bg-white border border-[#1A1A1A]/10 shadow-sm rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8F7F3] border-b border-[#1A1A1A]/10 text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">
                      <th className="px-6 py-4">Sales Channel</th>
                      <th className="px-6 py-4 text-right">YTD Revenue</th>
                      <th className="px-6 py-4 text-center">Market Share</th>
                      <th className="px-6 py-4 text-right">PYTD Revenue</th>
                      <th className="px-6 py-4 text-right">Growth YOY</th>
                      <th className="px-6 py-4 text-right">YTD Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]/5 text-[#1A1A1A]">
                    {dynamicChannels.map((cat: any, idx: number) => {
                      const totalYtd = dynamicChannels.reduce((acc: number, val: any) => acc + val[2], 0);
                      const sharePct = totalYtd > 0 ? (cat[2] / totalYtd) * 100 : 0;
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-[#F8F7F3]/50 transition"
                        >
                          <td className="px-6 py-4 font-bold">{cat[0]}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-[#0F172A]">{fmtUsd(cat[2], 0)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-[#0284C7] h-1.5" style={{ width: `${Math.min(100, sharePct)}%` }}></div>
                              </div>
                              <span className="text-[10px] font-mono text-[#64748B] w-8">{sharePct.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-[#64748B]">{fmtUsd(cat[3], 0)}</td>
                          <td className={`px-6 py-4 text-right font-bold ${cat[2] >= cat[3] ? "text-emerald-600" : "text-rose-500"}`}>
                            {pctYoy(cat[2], cat[3])}
                          </td>
                          <td className="px-6 py-4 text-right font-mono">{Number(cat[4]).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PARTNER ANALYTICS */}
          {activeTab === "tab-partners" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h3 className="text-4xl font-light tracking-tight text-[#0F172A]">
                    Partner <span className="font-serif italic text-[#0284C7]">Intelligence</span>
                  </h3>
                  <p className="mt-1 text-xs text-[#64748B]">
                    Detailed breakdowns grouped by core product classification channels. Select on any partner to inspect historical active months.
                  </p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder="Search global partners..."
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white border border-[#1A1A1A]/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0284C7] text-[#1A1A1A] w-64 shadow-sm"
                  />
                </div>
              </div>

              {/* Grouped Lists */}
              {(() => {
                const term = partnerSearch.toLowerCase();
                const grouped: Record<string, any[]> = {};
                
                dynamicPartners.forEach((p: any) => {
                  if (term && !p[0].toLowerCase().includes(term) && !p[1].toLowerCase().includes(term)) return;
                  const cat = p[1] || "Unmapped";
                  if (!grouped[cat]) grouped[cat] = [];
                  grouped[cat].push(p);
                });

                const sortedGroups = Object.keys(grouped).sort();

                if (sortedGroups.length === 0) {
                  return (
                    <div className="bg-white border border-[#1A1A1A]/10 p-12 text-center rounded-lg shadow-sm">
                      <AlertCircle className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                      <p className="text-sm font-semibold text-[#0F172A]">No partners match your criteria</p>
                      <button onClick={() => setPartnerSearch("")} className="mt-2 text-xs font-bold text-[#0284C7] underline">Clear Search Query</button>
                    </div>
                  );
                }

                return sortedGroups.map((cat, groupIdx) => {
                  const partners = grouped[cat];
                  return (
                    <div key={groupIdx} className="bg-white border border-[#1A1A1A]/10 shadow-sm rounded-lg overflow-hidden">
                      <div className="bg-[#F8F7F3] px-6 py-3 border-b border-[#1A1A1A]/10 flex justify-between items-center">
                        <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0F172A]">{cat} Partners</h4>
                        <span className="text-[10px] font-bold bg-[#0284C7]/10 text-[#0284C7] px-2.5 py-0.5 rounded-full uppercase">
                          {partners.length} Accounts
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-[#1A1A1A]/5 text-[9px] font-extrabold uppercase tracking-wider text-[#64748B]">
                              <th className="px-6 py-3">Partner Name</th>
                              <th className="px-6 py-3">Key Account AE</th>
                              <th className="px-6 py-3 text-right">YTD Sales</th>
                              <th className="px-6 py-3 text-right">PYTD Sales</th>
                              <th className="px-6 py-3 text-right">YoY Variance</th>
                              <th className="px-6 py-3 text-right">T12M Value</th>
                              <th className="px-6 py-3 text-right">YTD Orders</th>
                              <th className="px-6 py-3 text-right">Total Customer Order-Days</th>
                              <th className="px-6 py-3 text-right">First Order Year</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1A1A1A]/5">
                            {partners.map((p: any, pIdx: number) => {
                              const yoyVal = p[4] > 0 ? ((p[3] - p[4]) / p[4]) * 100 : 0;
                              return (
                                <tr
                                  key={pIdx}
                                  onClick={() => {
                                    const mData = payload.partner_months[p[0]] || [];
                                    setPartnerModalData({ partner: p[0], months: mData });
                                  }}
                                  className="hover:bg-[#F8F7F3]/30 cursor-pointer transition"
                                >
                                  <td className="px-6 py-3 font-bold text-[#0284C7]">{p[0]}</td>
                                  <td className="px-6 py-3 text-[#64748B]">{p[2]}</td>
                                  <td className="px-6 py-3 text-right font-mono font-bold text-[#0F172A]">{fmtUsd(p[3], 0)}</td>
                                  <td className="px-6 py-3 text-right font-mono text-[#64748B]">{fmtUsd(p[4], 0)}</td>
                                  <td className={`px-6 py-3 text-right font-bold ${p[3] >= p[4] ? "text-emerald-600" : "text-rose-500"}`}>
                                    {pctYoy(p[3], p[4])}
                                  </td>
                                  <td className="px-6 py-3 text-right font-mono text-[#64748B]">{fmtUsd(p[5], 0)}</td>
                                  <td className="px-6 py-3 text-right font-mono">{Number(p[7]).toLocaleString()}</td>
                                  <td className="px-6 py-3 text-right font-mono text-indigo-600">{Number(p[8]).toLocaleString()}</td>
                                  <td className="px-6 py-3 text-right text-slate-400 font-mono">{(p[10] || "—").substring(0, 4)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* TAB 4: CUSTOMERS LEDGER */}
          {activeTab === "tab-customers" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h3 className="text-4xl font-light tracking-tight text-[#0F172A]">
                    Customer <span className="font-serif italic text-[#0284C7]">Ledger</span>
                  </h3>
                  <p className="mt-1 text-xs text-[#64748B]">
                    Analysis and health diagnostics across our top 500 active purchasing accounts. Click on any row to drill Operations tab raw orders to that account.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  {/* Health Filter */}
                  <select
                    value={customerHealthFilter}
                    onChange={(e) => setCustomerHealthFilter(e.target.value)}
                    className="bg-white border border-[#1A1A1A]/10 rounded-lg px-3 py-2 text-xs text-[#0F172A] font-semibold focus:outline-none focus:ring-1 focus:ring-[#0284C7]"
                  >
                    <option value="all">Health: All</option>
                    <option value="ACTIVE">Active (&lt;30d)</option>
                    <option value="COOLING">Cooling (30–90d)</option>
                    <option value="AT RISK">At Risk (&gt;90d)</option>
                    <option value="LAPSED">Lapsed</option>
                  </select>

                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white border border-[#1A1A1A]/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0284C7] text-[#1A1A1A] w-64 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Customer Tables */}
              <div className="bg-white border border-[#1A1A1A]/10 shadow-sm rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8F7F3] border-b border-[#1A1A1A]/10 text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">
                      <th className="px-6 py-4">Customer Name</th>
                      <th className="px-6 py-4 text-right">YTD Revenue</th>
                      <th className="px-6 py-4 text-right">YTD Orders</th>
                      <th className="px-6 py-4 text-right">Last Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]/5 text-[#1A1A1A]">
                    {filteredCustomers.map((c: any, idx: number) => {
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-[#F8F7F3]/40 cursor-pointer transition"
                        >
                          <td className="px-6 py-4 font-bold text-[#0F172A]">{c.customer_name}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">{fmtUsd(c.ytd_usd, 0)}</td>
                          <td className="px-6 py-4 text-right font-mono">{Number(c.ytd_orders).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-mono text-[#64748B]">{c.last_order ? (typeof c.last_order === 'object' && c.last_order !== null ? (c.last_order.value || c.last_order) : c.last_order) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: REGIONAL GROWTH */}
          {activeTab === "tab-international" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h3 className="text-4xl font-light tracking-tight text-[#0F172A]">
                  Regional <span className="font-serif italic text-[#0284C7]">Growth</span>
                </h3>
                <p className="mt-1 text-xs text-[#64748B]">
                  Revenue distribution and geographical mapping of key international expansion territories.
                </p>
              </div>

              {/* STAT CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 border-l-2 border-[#0284C7] shadow-sm">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">Canada &amp; UK Focus</p>
                  <p className="text-3xl font-black text-[#0F172A] mt-1">
                    {compactUsd(dynamicInternational.reduce((acc: number, r: any) => acc + r[4], 0))}
                  </p>
                  <p className="text-[10px] text-[#64748B] mt-1 uppercase tracking-wider font-bold">Lifetime Value</p>
                </div>

                <div className="bg-white p-5 border-l-2 border-[#10B981] shadow-sm">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">Active Regional Accounts</p>
                  <p className="text-3xl font-black text-[#0F172A] mt-1">
                    {Number(dynamicInternational.reduce((acc: number, r: any) => acc + r[6], 0)).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-1 uppercase tracking-wider font-bold">YTD Active Base</p>
                </div>

                <div className="bg-white p-5 border-l-2 border-indigo-500 shadow-sm">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">International YTD Volume</p>
                  <p className="text-3xl font-black text-[#0F172A] mt-1">
                    {compactUsd(dynamicInternational.reduce((acc: number, r: any) => acc + r[2], 0))}
                  </p>
                  <p className="text-[10px] text-[#64748B] mt-1 uppercase tracking-wider font-bold">Across 8 subregions</p>
                </div>
              </div>

              {/* GEOGRAPHIC GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Tables */}
                <div className="col-span-3 bg-white border border-[#1A1A1A]/10 shadow-sm rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8F7F3] border-b border-[#1A1A1A]/10 text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">
                      <th className="px-6 py-4">Customer Name</th>
                      <th className="px-6 py-4 text-right">YTD Revenue</th>
                      <th className="px-6 py-4 text-right">YTD Orders</th>
                      <th className="px-6 py-4 text-right">Last Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]/5 text-[#1A1A1A]">
                    {filteredCustomers.map((c: any, idx: number) => {
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-[#F8F7F3]/40 cursor-pointer transition"
                        >
                          <td className="px-6 py-4 font-bold text-[#0F172A]">{c.customer_name}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">{fmtUsd(c.ytd_usd, 0)}</td>
                          <td className="px-6 py-4 text-right font-mono">{Number(c.ytd_orders).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-mono text-[#64748B]">{c.last_order ? (typeof c.last_order === 'object' && c.last_order !== null ? (c.last_order.value || c.last_order) : c.last_order) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>

                {/* Region graphic distribution - custom high-fidelity SVG chart */}
                <div className="col-span-2 bg-white p-6 border border-[#1A1A1A]/10 shadow-sm rounded-lg flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0F172A] mb-1">Geographical Share Distribution</h4>
                    <p className="text-[10px] text-[#64748B]">Lifetime market penetrations categorized in subregions.</p>
                  </div>

                  <div className="my-6 relative flex justify-center items-center h-48">
                    {/* Editorial Pie Chart (rendered beautiful high quality SVG ring) */}
                    <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                      {(() => {
                        const data = dynamicInternational.slice(0, 5);
                        const total = data.reduce((acc: number, r: any) => acc + r[4], 0);
                        let accumulatedPercent = 0;
                        const colors = ["#0284C7", "#10B981", "#F59E0B", "#8B5CF6", "#F43F5E"];

                        return data.map((r: any, idx: number) => {
                          const pct = total > 0 ? (r[4] / total) * 100 : 0;
                          const strokeDashArray = `${pct} ${100 - pct}`;
                          const strokeDashOffset = 100 - accumulatedPercent;
                          accumulatedPercent += pct;

                          return (
                            <circle
                              key={idx}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                              stroke={colors[idx % colors.length]}
                              strokeWidth="12"
                              strokeDasharray={strokeDashArray}
                              strokeDashoffset={strokeDashOffset}
                              className="transition-all duration-300"
                            />
                          );
                        });
                      })()}
                    </svg>
                  </div>

                  <div className="space-y-1.5">
                    {dynamicInternational.slice(0, 5).map((r: any, idx: number) => {
                      const colors = ["#0284C7", "#10B981", "#F59E0B", "#8B5CF6", "#F43F5E"];
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }}></div>
                            <span className="font-medium">{r[0]} ({r[1].toUpperCase()})</span>
                          </div>
                          <span className="font-mono text-[#64748B]">{fmtUsd(r[4], 0)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: OPERATIONS & OPS */}
          {activeTab === "tab-orders" && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-4xl font-light tracking-tight text-[#0F172A]">
                  Operational <span className="font-serif italic text-[#0284C7]">Fulfillment</span>
                </h3>
                <p className="mt-1 text-xs text-[#64748B]">
                  Track warehouse shipping velocity, unshipped order backlogs, and real-time ledger outputs.
                </p>
              </div>

              {/* OPS STATS STRIP */}
              {payload.ops && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-5 border-l-2 border-emerald-500 shadow-sm">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">Median Days to Ship</p>
                    <p className="text-3xl font-black text-[#0F172A] mt-1">{payload.ops.median_ship_days} Days</p>
                    <p className="text-[10px] text-emerald-600 mt-1 uppercase tracking-wider font-bold">Target &lt; 5 Days</p>
                  </div>

                  <div className="bg-white p-5 border-l-2 border-emerald-500 shadow-sm">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">Shipped &le; 3 Days</p>
                    <p className="text-3xl font-black text-[#0F172A] mt-1">{payload.ops.pct3}%</p>
                    <p className="text-[10px] text-emerald-600 mt-1 uppercase tracking-wider font-bold">Fast-track high performers</p>
                  </div>

                  <div className="bg-white p-5 border-l-2 border-emerald-500 shadow-sm">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">Shipped &le; 7 Days</p>
                    <p className="text-3xl font-black text-[#0F172A] mt-1">{payload.ops.pct7}%</p>
                    <p className="text-[10px] text-[#64748B] mt-1 uppercase tracking-wider font-bold">Industry standard SLA</p>
                  </div>

                  <div className="bg-white p-5 border-l-2 border-rose-500 shadow-sm">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">Unshipped backlog value</p>
                    <p className="text-3xl font-black text-[#0F172A] mt-1">{fmtUsd(payload.ops.backlog_value, 0)}</p>
                    <p className="text-[10px] text-rose-500 mt-1 uppercase tracking-wider font-bold">
                      {payload.ops.backlog_count} Pending orders
                    </p>
                  </div>
                </div>
              )}

              {/* RAW TRANSACTION LEDGER */}
              <div className="bg-white border border-[#1A1A1A]/10 shadow-sm rounded-lg overflow-hidden">
                <div className="bg-[#F8F7F3] p-4 border-b border-[#1A1A1A]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-[#94A3B8]" />
                      <input
                        type="text"
                        placeholder="Search document # or customer..."
                        value={gridSearch}
                        onChange={(e) => setGridSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white border border-[#1A1A1A]/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0284C7] text-[#1A1A1A] w-64 shadow-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">
                    {gridData ? `Displaying ${gridData.totalRows} records match selected parameters` : "Querying warehouse..."}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8F7F3] border-b border-[#1A1A1A]/10 text-[9px] font-extrabold uppercase tracking-widest text-[#64748B]">
                      <th className="px-6 py-4">Customer Name</th>
                      <th className="px-6 py-4 text-right">YTD Revenue</th>
                      <th className="px-6 py-4 text-right">YTD Orders</th>
                      <th className="px-6 py-4 text-right">Last Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]/5 text-[#1A1A1A]">
                    {filteredCustomers.map((c: any, idx: number) => {
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-[#F8F7F3]/40 cursor-pointer transition"
                        >
                          <td className="px-6 py-4 font-bold text-[#0F172A]">{c.customer_name}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">{fmtUsd(c.ytd_usd, 0)}</td>
                          <td className="px-6 py-4 text-right font-mono">{Number(c.ytd_orders).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-mono text-[#64748B]">{c.last_order ? c.last_order.value || c.last_order : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>

                {/* Pagination footer */}
                {gridData && (
                  <div className="bg-[#F8F7F3] p-4 border-t border-[#1A1A1A]/10 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    <span>
                      Page <b className="text-[#0F172A]">{gridData.currentPage}</b> of <b className="text-[#0F172A]">{gridData.totalPages}</b>
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setGridPage(p => Math.max(1, p - 1))}
                        disabled={gridData.currentPage <= 1 || gridLoading}
                        className="px-4 py-2 bg-white border border-[#1A1A1A]/10 rounded-lg hover:bg-slate-50 transition disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </button>
                      <button
                        onClick={() => setGridPage(p => Math.min(gridData.totalPages, p + 1))}
                        disabled={gridData.currentPage >= gridData.totalPages || gridLoading}
                        className="px-4 py-2 bg-white border border-[#1A1A1A]/10 rounded-lg hover:bg-slate-50 transition disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                      >
                        Next <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* DAILY ENTRY MODAL - Beautiful clean Editorial style */}
      {showEntryModal && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#F8F7F3] border border-[#1A1A1A]/10 p-8 rounded-xl w-full max-w-md shadow-2xl space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-[#0F172A] uppercase">Add Transaction</h3>
                <p className="text-[11px] text-[#64748B]">Manual transaction ingestion to live NetSuite datastream.</p>
              </div>
              <button
                onClick={() => {
                  setShowEntryModal(false);
                  setEntryMessage(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {entryMessage && (
              <div className={`p-3 rounded-lg text-xs font-bold uppercase tracking-wider ${
                entryMessage.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}>
                {entryMessage.text}
              </div>
            )}

            <form onSubmit={handleEntrySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-[#64748B]">Document # (INV- / SO-)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SO-104829"
                  value={entryForm.document_number}
                  onChange={(e) => setEntryForm(prev => ({ ...prev, document_number: e.target.value }))}
                  className="w-full bg-white border border-[#1A1A1A]/10 px-3.5 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0284C7] font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-[#64748B]">Billing Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nordic Outfitters Ltd"
                  value={entryForm.customer_name}
                  onChange={(e) => setEntryForm(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="w-full bg-white border border-[#1A1A1A]/10 px-3.5 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0284C7] font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-[#64748B]">Posting Date</label>
                  <input
                    type="date"
                    required
                    value={entryForm.order_date}
                    onChange={(e) => setEntryForm(prev => ({ ...prev, order_date: e.target.value }))}
                    className="w-full bg-white border border-[#1A1A1A]/10 px-3.5 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0284C7] font-semibold font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-[#64748B]">Net Amount (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 18450.00"
                    value={entryForm.amount_net}
                    onChange={(e) => setEntryForm(prev => ({ ...prev, amount_net: e.target.value }))}
                    className="w-full bg-white border border-[#1A1A1A]/10 px-3.5 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0284C7] font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-[#64748B]">Transaction Status</label>
                <select
                  value={entryForm.status}
                  onChange={(e) => setEntryForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-white border border-[#1A1A1A]/10 px-3.5 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0284C7] font-semibold"
                >
                  <option value="Pending Fulfillment">Pending Fulfillment</option>
                  <option value="Billed">Billed</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEntryModal(false);
                    setEntryMessage(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg font-bold text-[#64748B] bg-slate-100 hover:bg-slate-200 border border-[#1A1A1A]/5 text-xs uppercase tracking-wider transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEntry}
                  className="flex-1 px-4 py-2.5 rounded-lg font-bold text-white bg-[#0284C7] hover:bg-[#0284C7]/90 text-xs uppercase tracking-wider transition"
                >
                  {savingEntry ? "Ingesting..." : "Save Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PARTNER DETAIL DRILLDOWN MODAL */}
      {partnerModalData && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#F8F7F3] border border-[#1A1A1A]/10 p-8 rounded-xl w-full max-w-2xl shadow-2xl space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-[#0F172A] uppercase">{partnerModalData.partner} Analysis</h3>
                <p className="text-[11px] text-[#64748B]">Active monthly revenue streams and historical patterns.</p>
              </div>
              <button
                onClick={() => setPartnerModalData(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Custom SVG Bar chart */}
            <div className="bg-white p-6 border border-[#1A1A1A]/10 rounded-lg">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B] mb-4">Historical Billing per Month (Last 12 Active)</h4>
              <div className="h-40 flex items-end gap-1.5 pb-2 border-b border-[#1A1A1A]/10">
                {partnerModalData.months.slice(-12).map((m: any, idx: number) => {
                  const maxVal = Math.max(...partnerModalData.months.slice(-12).map((x: any) => x[1]), 1);
                  const heightPct = (m[1] / maxVal) * 85;
                  return (
                    <div key={idx} className="group flex-1 flex flex-col items-center h-full justify-end relative">
                      <div className="absolute bottom-full mb-1 bg-[#0F172A] text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition duration-150 z-20 pointer-events-none whitespace-nowrap font-mono">
                        {m[0]}: {fmtUsd(m[1], 0)} ({m[2]} ord)
                      </div>
                      <div style={{ height: `${Math.max(4, heightPct)}%` }} className="w-full bg-[#0284C7] hover:bg-[#0284C7]/80 rounded-t-sm"></div>
                      <span className="text-[8px] font-bold text-[#64748B] mt-1.5 scale-90">{m[0].substring(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => {
                  setFilterState(prev => ({ ...prev, partner: partnerModalData.partner }));
                  setPartnerModalData(null);
                  setActiveTab("tab-overview");
                }}
                className="flex-1 px-4 py-2.5 bg-[#0284C7] hover:bg-[#0284C7]/90 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition text-center"
              >
                Filter Entire Dashboard to {partnerModalData.partner}
              </button>
              <button
                onClick={() => {
                  setFilterState(prev => ({ ...prev, partner: partnerModalData.partner }));
                  setPartnerModalData(null);
                  setActiveTab("tab-orders");
                }}
                className="flex-1 px-4 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition text-center"
              >
                View Linked Transactions &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
