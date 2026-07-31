export type {
  SpendDay,
  SpendSource,
  SpendSyncRange,
  SpendRepository,
  SpendWriteResult,
  SyncShopSpendResult,
} from "./types.js";

export {
  createMetaSpendClient,
  MockMetaSpendClient,
  MetaSpendClientLive,
  normalizeMetaAdAccountId,
  type MetaSpendClient,
  type MetaSpendClientConfig,
} from "./meta/client.js";

export {
  createGoogleSpendClient,
  MockGoogleSpendClient,
  GoogleSpendClientLive,
  normalizeGoogleCustomerId,
  type GoogleSpendClient,
  type GoogleSpendClientConfig,
} from "./google/client.js";

export {
  syncShopSpend,
  type SyncShopSpendOptions,
} from "./sync/job.js";
