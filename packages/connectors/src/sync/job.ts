import { createGoogleSpendClient } from "../google/client.js";
import { createMetaSpendClient } from "../meta/client.js";
import type {
  SpendRepository,
  SpendSyncRange,
  SyncShopSpendResult,
} from "../types.js";

export type SyncShopSpendOptions = {
  meta?: {
    enabled?: boolean;
    useMock?: boolean;
    accessToken?: string;
    adAccountId?: string;
  };
  google?: {
    enabled?: boolean;
    useMock?: boolean;
    developerToken?: string;
    customerId?: string;
    refreshToken?: string;
    clientId?: string;
    clientSecret?: string;
    loginCustomerId?: string;
  };
};

/**
 * Orchestration: pull Meta + Google daily spend and persist via repository.
 * Defaults to mock clients until OAuth credentials are wired by a human.
 * Set `enabled: false` to skip a platform (no silent mock writes).
 */
export async function syncShopSpend(
  shopId: string,
  from: string,
  to: string,
  repository: SpendRepository,
  options: SyncShopSpendOptions = {},
): Promise<SyncShopSpendResult> {
  const range: SpendSyncRange = { from, to };
  const metaEnabled = options.meta?.enabled !== false;
  const googleEnabled = options.google?.enabled !== false;

  const emptyUpsert = { written: 0, skipped: 0, created: 0, updated: 0 };

  const metaPromise = metaEnabled
    ? (async () => {
        const client = createMetaSpendClient({
          useMock: options.meta?.useMock ?? true,
          accessToken: options.meta?.accessToken,
          adAccountId: options.meta?.adAccountId,
        });
        const rows = await client.fetchDailySpend(range);
        return repository.upsertSpendDays(shopId, rows);
      })()
    : Promise.resolve(emptyUpsert);

  const googlePromise = googleEnabled
    ? (async () => {
        const client = createGoogleSpendClient({
          useMock: options.google?.useMock ?? true,
          developerToken: options.google?.developerToken,
          customerId: options.google?.customerId,
          refreshToken: options.google?.refreshToken,
          clientId: options.google?.clientId,
          clientSecret: options.google?.clientSecret,
          loginCustomerId: options.google?.loginCustomerId,
        });
        const rows = await client.fetchDailySpend(range);
        return repository.upsertSpendDays(shopId, rows);
      })()
    : Promise.resolve(emptyUpsert);

  const [meta, google] = await Promise.all([metaPromise, googlePromise]);

  return {
    shopId,
    range,
    meta,
    google,
    totalRows: meta.written + google.written,
  };
}
