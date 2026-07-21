import { createGoogleSpendClient } from "../google/client.js";
import { createMetaSpendClient } from "../meta/client.js";
import type {
  SpendRepository,
  SpendSyncRange,
  SyncShopSpendResult,
} from "../types.js";

export type SyncShopSpendOptions = {
  meta?: { useMock?: boolean; accessToken?: string; adAccountId?: string };
  google?: {
    useMock?: boolean;
    developerToken?: string;
    customerId?: string;
    refreshToken?: string;
  };
};

/**
 * Orchestration stub: pull Meta + Google daily spend and persist via repository.
 * Defaults to mock clients until OAuth credentials are wired by a human.
 */
export async function syncShopSpend(
  shopId: string,
  from: string,
  to: string,
  repository: SpendRepository,
  options: SyncShopSpendOptions = {},
): Promise<SyncShopSpendResult> {
  const range: SpendSyncRange = { from, to };

  const metaClient = createMetaSpendClient({
    useMock: options.meta?.useMock ?? true,
    accessToken: options.meta?.accessToken,
    adAccountId: options.meta?.adAccountId,
  });

  const googleClient = createGoogleSpendClient({
    useMock: options.google?.useMock ?? true,
    developerToken: options.google?.developerToken,
    customerId: options.google?.customerId,
    refreshToken: options.google?.refreshToken,
  });

  const [metaRows, googleRows] = await Promise.all([
    metaClient.fetchDailySpend(range),
    googleClient.fetchDailySpend(range),
  ]);

  const meta = await repository.upsertSpendDays(shopId, metaRows);
  const google = await repository.upsertSpendDays(shopId, googleRows);

  return {
    shopId,
    range,
    meta,
    google,
    totalRows: meta.written + google.written,
  };
}
