import type { SpendDay, SpendSyncRange } from "../types.js";

export type MetaSpendClientConfig = {
  accessToken?: string;
  adAccountId?: string;
  /** When true, returns deterministic mock data (default until OAuth). */
  useMock?: boolean;
};

export interface MetaSpendClient {
  fetchDailySpend(range: SpendSyncRange): Promise<SpendDay[]>;
}

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/** Deterministic mock — stable for tests and local dev without Meta OAuth. */
export class MockMetaSpendClient implements MetaSpendClient {
  constructor(private readonly adAccountId = "act_mock") {}

  async fetchDailySpend(range: SpendSyncRange): Promise<SpendDay[]> {
    return eachDay(range.from, range.to).map((date) => {
      const seed = hashSeed(`${this.adAccountId}:${date}`);
      const amount = 80 + (seed % 120);
      return {
        date,
        channel: "Meta",
        amount: Math.round(amount * 100) / 100,
        currency: "USD",
        source: "meta" as const,
      };
    });
  }
}

/** Live client stub — requires human OAuth + Marketing API app review. */
export class MetaSpendClientLive implements MetaSpendClient {
  constructor(private readonly config: MetaSpendClientConfig) {}

  async fetchDailySpend(_range: SpendSyncRange): Promise<SpendDay[]> {
    if (!this.config.accessToken || !this.config.adAccountId) {
      throw new Error(
        "Meta OAuth not configured. Create a Meta Developer app, complete OAuth, and pass accessToken + adAccountId.",
      );
    }
    throw new Error(
      "Meta Marketing API fetch not implemented — wire after OAuth credentials exist.",
    );
  }
}

export function createMetaSpendClient(
  config: MetaSpendClientConfig = { useMock: true },
): MetaSpendClient {
  if (config.useMock !== false) {
    return new MockMetaSpendClient(config.adAccountId);
  }
  return new MetaSpendClientLive(config);
}
