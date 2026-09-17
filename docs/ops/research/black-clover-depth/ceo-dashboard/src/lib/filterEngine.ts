import { useMemo } from "react";
import { CubeRow, GlobalFilters } from "../types";

// Format currency in clean executive style: e.g. $26.36M or $405K or $12,450
export function formatMoney(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return "$0.00";
  const absVal = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  
  if (absVal >= 1000000) {
    return `${sign}$${(absVal / 1000000).toFixed(2)}M`;
  } else if (absVal >= 1000) {
    return `${sign}$${(absVal / 1000).toFixed(1)}K`;
  } else {
    return `${sign}$${absVal.toFixed(2)}`;
  }
}

// Format percent with sign and arrow
export function formatPercent(val: number): string {
  if (val === undefined || val === null || isNaN(val) || !isFinite(val)) return "0.0%";
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(1)}%`;
}

// Get month ranges for CY and PY relative to meta.asof
export function getPeriodMonths(period: string, asof: string): { cy: string[]; py: string[] } {
  // asof is YYYY-MM-DD
  const asofParts = asof.split("-");
  const asofYear = parseInt(asofParts[0]) || 2026;
  const asofMonthNum = parseInt(asofParts[1]) || 7; // e.g. 7 for July
  
  const cyMonths: string[] = [];
  const pyMonths: string[] = [];
  
  const formatMonth = (y: number, m: number) => {
    return `${y}-${m.toString().padStart(2, "0")}`;
  };

  switch (period) {
    case "YTD":
      for (let m = 1; m <= asofMonthNum; m++) {
        cyMonths.push(formatMonth(asofYear, m));
        pyMonths.push(formatMonth(asofYear - 1, m));
      }
      break;
      
    case "MTD":
      cyMonths.push(formatMonth(asofYear, asofMonthNum));
      pyMonths.push(formatMonth(asofYear - 1, asofMonthNum));
      break;
      
    case "QTD": {
      // Determine quarter of the current asofMonth
      const quarter = Math.floor((asofMonthNum - 1) / 3) + 1; // 1, 2, 3, 4
      const startMonth = (quarter - 1) * 3 + 1;
      for (let m = startMonth; m <= asofMonthNum; m++) {
        cyMonths.push(formatMonth(asofYear, m));
        pyMonths.push(formatMonth(asofYear - 1, m));
      }
      break;
    }
      
    case "T12M": {
      // Last 12 months ending in asofMonth
      let currY = asofYear;
      let currM = asofMonthNum;
      for (let i = 0; i < 12; i++) {
        cyMonths.unshift(formatMonth(currY, currM));
        pyMonths.unshift(formatMonth(currY - 1, currM));
        
        currM--;
        if (currM === 0) {
          currM = 12;
          currY--;
        }
      }
      break;
    }
      
    case "All":
      // Let All mean everything. For PY, we'll map all previous year's months
      // We'll populate cy with all available months in 2025/2026
      for (let m = 1; m <= 12; m++) {
        cyMonths.push(formatMonth(2025, m));
        cyMonths.push(formatMonth(2026, m));
        pyMonths.push(formatMonth(2024, m));
        pyMonths.push(formatMonth(2025, m));
      }
      break;
      
    default:
      // Custom single month e.g. "2026-05"
      if (period.includes("-")) {
        cyMonths.push(period);
        const parts = period.split("-");
        const yr = parseInt(parts[0]);
        const mo = parts[1];
        pyMonths.push(`${yr - 1}-${mo}`);
      } else {
        // Fallback YTD
        for (let m = 1; m <= asofMonthNum; m++) {
          cyMonths.push(formatMonth(asofYear, m));
          pyMonths.push(formatMonth(asofYear - 1, m));
        }
      }
      break;
  }
  
  return { cy: cyMonths, py: pyMonths };
}

// Hook to filter the cube and calculate core summaries
export function useFilteredCube(
  cube: CubeRow[],
  filters: GlobalFilters,
  asof: string
) {
  return useMemo(() => {
    if (!cube || cube.length === 0) {
      return {
        cyRows: [],
        pyRows: [],
        metrics: {
          salesCY: 0,
          salesPY: 0,
          salesChange: 0,
          ordersCY: 0,
          ordersPY: 0,
          ordersChange: 0,
          aovCY: 0,
          aovPY: 0,
          aovChange: 0,
          backlogCY: 0,
          returnsCY: 0,
          cancelledCY: 0,
          bookingsCY: 0
        },
        monthlyTrend: [],
        brandSplit: []
      };
    }

    const { cy: cyMonths, py: pyMonths } = getPeriodMonths(filters.period, asof);

    // Filter by Brand & Channel
    const applyGlobalSlicers = (row: CubeRow, allowedMonths: string[]) => {
      // Month alignment
      if (!allowedMonths.includes(row.month)) return false;
      
      // Brand filter
      if (filters.brand !== "All") {
        const rowBrand = row.brand.toLowerCase();
        const filtBrand = filters.brand.toLowerCase();
        if (rowBrand !== filtBrand) return false;
      }
      
      // Channel filter
      if (filters.channel !== "All") {
        if (row.channel !== filters.channel) return false;
      }
      
      return true;
    };

    const cyRows = cube.filter(r => applyGlobalSlicers(r, cyMonths));
    const pyRows = cube.filter(r => applyGlobalSlicers(r, pyMonths));

    // KPI Metrics calculation
    const salesCY = cyRows.reduce((acc, r) => acc + (r.funnel_bucket !== "Cancelled" ? r.net_usd : 0), 0);
    const salesPY = pyRows.reduce((acc, r) => acc + (r.funnel_bucket !== "Cancelled" ? r.net_usd : 0), 0);
    const salesChange = salesPY > 0 ? ((salesCY - salesPY) / salesPY) * 100 : 0;

    const ordersCY = cyRows.reduce((acc, r) => acc + (r.funnel_bucket !== "Cancelled" ? r.orders : 0), 0);
    const ordersPY = pyRows.reduce((acc, r) => acc + (r.funnel_bucket !== "Cancelled" ? r.orders : 0), 0);
    const ordersChange = ordersPY > 0 ? ((ordersCY - ordersPY) / ordersPY) * 100 : 0;

    const aovCY = ordersCY > 0 ? salesCY / ordersCY : 0;
    const aovPY = ordersPY > 0 ? salesPY / ordersPY : 0;
    const aovChange = aovPY > 0 ? ((aovCY - aovPY) / aovPY) * 100 : 0;

    const backlogCY = cyRows.reduce((acc, r) => acc + (r.funnel_bucket === "Unshipped Backlog" ? r.net_usd : 0), 0);
    const returnsCY = cyRows.reduce((acc, r) => acc + (r.funnel_bucket === "Returns" ? Math.abs(r.net_usd) : 0), 0);
    const cancelledCY = cyRows.reduce((acc, r) => acc + (r.funnel_bucket === "Cancellations" ? Math.abs(r.net_usd) : 0), 0);
    
    // Bookings Gross = Sales + Backlog + Cancellations - Returns or similar. Let's make bookings consistent
    const bookingsCY = salesCY + backlogCY + cancelledCY;

    // Brand split data for donut
    const brandTotals: Record<string, number> = {};
    cyRows.forEach(r => {
      if (r.funnel_bucket !== "Cancelled") {
        brandTotals[r.brand] = (brandTotals[r.brand] || 0) + r.net_usd;
      }
    });
    const brandSplit = Object.keys(brandTotals).map(key => ({
      name: key === "bc" ? "Black Clover" : "CMC Design",
      value: parseFloat(brandTotals[key].toFixed(2)),
      color: key === "bc" ? "#0f172a" : "#10b981"
    }));

    // Monthly trend list
    const monthMapCY: Record<string, { month: string; sales: number; orders: number }> = {};
    const monthMapPY: Record<string, { month: string; sales: number; orders: number }> = {};
    
    cyRows.forEach(r => {
      if (r.funnel_bucket !== "Cancelled") {
        if (!monthMapCY[r.month]) monthMapCY[r.month] = { month: r.month, sales: 0, orders: 0 };
        monthMapCY[r.month].sales += r.net_usd;
        monthMapCY[r.month].orders += r.orders;
      }
    });

    pyRows.forEach(r => {
      if (r.funnel_bucket !== "Cancelled") {
        if (!monthMapPY[r.month]) monthMapPY[r.month] = { month: r.month, sales: 0, orders: 0 };
        monthMapPY[r.month].sales += r.net_usd;
        monthMapPY[r.month].orders += r.orders;
      }
    });

    // Create sorted list of combined trends
    const uniqueSortedMonths = Array.from(new Set([...cyMonths, ...pyMonths])).sort();
    
    const monthlyTrend = uniqueSortedMonths.map(m => {
      const cyItem = monthMapCY[m];
      const pyItem = monthMapPY[m];
      
      // Find the corresponding prior year month for overlay
      const parts = m.split("-");
      const yr = parseInt(parts[0]);
      const mo = parts[1];
      const pyMonthKey = `${yr - 1}-${mo}`;
      const pyOverlayItem = monthMapPY[pyMonthKey] || monthMapCY[pyMonthKey];

      return {
        month: m,
        salesCY: cyItem ? parseFloat(cyItem.sales.toFixed(2)) : 0,
        ordersCY: cyItem ? cyItem.orders : 0,
        salesPY: pyOverlayItem ? parseFloat(pyOverlayItem.sales.toFixed(2)) : (pyItem ? parseFloat(pyItem.sales.toFixed(2)) : 0),
        ordersPY: pyOverlayItem ? pyOverlayItem.orders : (pyItem ? pyItem.orders : 0)
      };
    }).filter(t => cyMonths.includes(t.month)); // limit display to selected period months

    return {
      cyRows,
      pyRows,
      metrics: {
        salesCY,
        salesPY,
        salesChange,
        ordersCY,
        ordersPY,
        ordersChange,
        aovCY,
        aovPY,
        aovChange,
        backlogCY,
        returnsCY,
        cancelledCY,
        bookingsCY
      },
      monthlyTrend,
      brandSplit
    };
  }, [cube, filters, asof]);
}
