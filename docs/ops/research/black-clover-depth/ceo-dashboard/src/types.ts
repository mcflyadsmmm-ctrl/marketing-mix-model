export interface MetaData {
  asof: string;
  lifetime_total: number;
  partner_count: number;
  customer_count: number;
}

export interface KPIState {
  ytd: number;
  pytd: number;
  qtd: number;
  pqtd: number;
  mtd: number;
  pmtd: number;
  ytd_orders: number;
  pytd_orders: number;
  ytd_customers: number;
  pytd_customers: number;
  ytd_new_customers: number;
  bookings_gross_ytd_usd: number;
  recognized_ytd_usd: number;
  returns_ytd_usd: number;
  cancelled_ytd_usd: number;
  open_backlog_ytd_usd: number;
  aov_ytd: number;
}

export interface CubeRow {
  month: string;
  partner: string;
  category: string;
  status: string;
  brand: "bc" | "cmc";
  channel: string;
  subregion: string;
  net_usd: number;
  orders: number;
  funnel_bucket: string;
  isTdFlag: boolean;
}

export interface CategoryRow {
  category: string;
  ytd_sales: number;
  pytd_sales: number;
  pct_change: number;
}

export interface PartnerRow {
  partner: string;
  ytd: number;
  pytd: number;
  change: number;
  t12m: number;
  lifetime: number;
  last_order: string;
}

export interface CustomerRow {
  customer_id: string;
  name: string;
  email: string;
  city: string;
  state: string;
  lifetime_sales: number;
  order_count: number;
  last_order_date: string;
  tag: "VIP" | "ACTIVE" | "AT RISK";
  is_new: boolean;
}

export interface RegionBreakdown {
  region: string;
  ytd: number;
  pytd: number;
  pct: number;
}

export interface SubregionRow {
  subregion: string;
  ytd: number;
  pytd: number;
  change: number;
}

export interface RepRow {
  rep_name: string;
  rep_key: string;
  category: string;
  territory: string;
  ytd: number;
  goal: number;
  attainment_pct: number;
}

export interface WeeklyTrendRow {
  week: string;
  net_usd: number;
  py_net_usd: number;
  orders: number;
}

export interface DailyTrendRow {
  date: string;
  net_usd: number;
  orders: number;
}

export interface OpsMetrics {
  median_ship_days: number;
  pct3: number;
  pct7: number;
  backlog_count: number;
  backlog_value: number;
}

export interface DashboardPayload {
  meta: MetaData;
  kpis: KPIState;
  cube: CubeRow[];
  categories: CategoryRow[];
  partners: PartnerRow[];
  customers: CustomerRow[];
  international: RegionBreakdown[];
  subregions: SubregionRow[];
  reps: RepRow[];
  weekly14: WeeklyTrendRow[];
  daily14: DailyTrendRow[];
  ops: OpsMetrics;
  partner_months: Record<string, [string, number, number][]>;
  isLive: boolean;
  bqError: string | null;
}

export interface GlobalFilters {
  brand: "All" | "bc" | "cmc";
  period: "MTD" | "QTD" | "YTD" | "T12M" | "All" | string; // string for custom YYYY-MM
  channel: string; // "All" or a specific channel name
}

export interface OrderRow {
  order_id: string;
  order_date: string;
  brand: string;
  channel: string;
  partner: string;
  category: string;
  customer: string;
  net_usd: number;
  status: string;
  tracking_number: string;
  ship_days: number | null;
  state: string;
  country: string;
}
