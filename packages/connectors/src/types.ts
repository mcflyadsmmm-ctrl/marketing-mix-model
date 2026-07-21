export type SpendSource = "meta" | "google" | "manual" | "csv";

export type SpendDay = {
  date: string;
  channel: string;
  amount: number;
  currency: string;
  source: SpendSource;
};

export type SpendSyncRange = {
  from: string;
  to: string;
};

export type SpendWriteResult = {
  written: number;
  skipped: number;
};

/** Repository port — app DB layer implements this. */
export interface SpendRepository {
  upsertSpendDays(shopId: string, rows: SpendDay[]): Promise<SpendWriteResult>;
}

export type SyncShopSpendResult = {
  shopId: string;
  range: SpendSyncRange;
  meta: SpendWriteResult;
  google: SpendWriteResult;
  totalRows: number;
};
