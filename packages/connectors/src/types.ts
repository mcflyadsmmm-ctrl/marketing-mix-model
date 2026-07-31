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
  /** created + updated (rows actually written). */
  written: number;
  /** Existing rows whose amount+source already matched — left alone. */
  skipped: number;
  /** New shop+channel+day rows. */
  created: number;
  /** Existing rows whose amount/source was replaced. */
  updated: number;
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
