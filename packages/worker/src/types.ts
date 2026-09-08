export type OrchestratorPhase =
  | "preflight"
  | "sync"
  | "recon"
  | "snapshot"
  | "allocate"
  | "report";

export type PhaseStatus = "running" | "success" | "failed" | "skipped";

export type PhaseResult = {
  phase: OrchestratorPhase;
  status: PhaseStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  metrics?: Record<string, unknown>;
  errors?: string[];
};

export type ShopContext = {
  id: string;
  domain: string;
};

export type OrchestratorDeps = {
  /** List shops to process (all installed stores). */
  listShops: () => Promise<ShopContext[]>;
  /** Run unit tests / build gates. */
  runPreflight: () => Promise<{ passed: boolean; details: string[] }>;
  /** Sync Meta + Google spend for a shop between dates. */
  syncSpend: (
    shopId: string,
    from: string,
    to: string,
  ) => Promise<{ totalRows: number; metaWritten: number; googleWritten: number }>;
  /** Fetch cash sales for period (Shopify Admin or fallback). */
  fetchSales: (
    shop: ShopContext,
    from: string,
    to: string,
  ) => Promise<{ sales: number; warning?: string }>;
  /** Load total spend for period from DB. */
  fetchSpendTotal: (shopId: string, from: string, to: string) => Promise<number>;
  /** Previous snapshot spend for recon. */
  fetchPreviousSnapshotSpend: (
    shopId: string,
    from: string,
    to: string,
  ) => Promise<number | null>;
  /** Persist MER snapshot + allocation JSON. */
  writeSnapshot: (input: {
    shopId: string;
    from: string;
    to: string;
    sales: number;
    spend: number;
    mer: number | null;
    breakEvenMer: number;
    channelMix: unknown;
    allocation: unknown | null;
    reconStatus: string;
    reconDelta: number | null;
  }) => Promise<void>;
  /** Persist phase row for audit trail. */
  logPhase: (input: {
    runId: string;
    shopId?: string;
    phase: OrchestratorPhase;
    status: PhaseStatus;
    metrics?: Record<string, unknown>;
    errors?: string[];
  }) => Promise<void>;
  /** Build allocation suggestion from cash inputs. */
  buildAllocation: (input: {
    shopId: string;
    sales: number;
    spend: number;
    from: string;
    to: string;
  }) => Promise<unknown | null>;
  now?: () => Date;
};

export type OrchestratorOptions = {
  /** YYYY-MM-DD inclusive range end (default: yesterday UTC). */
  toDate?: string;
  /** Lookback days for sync window (default: 14). */
  lookbackDays?: number;
  /** Fail run when spend recon delta exceeds this fraction (default: 0.05). */
  reconThreshold?: number;
  /** Max shops per run (safety). */
  maxShops?: number;
};

export type OrchestratorReport = {
  runId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  phases: PhaseResult[];
  shops: Array<{
    shopId: string;
    domain: string;
    sales: number;
    spend: number;
    mer: number | null;
    reconStatus: string;
    reconDelta: number | null;
    allocationActions: number;
    warnings: string[];
  }>;
  killCriteria: {
    reconBreaches: number;
    belowBreakEven: number;
    noAllocationWhenSpend: number;
  };
  ok: boolean;
};
