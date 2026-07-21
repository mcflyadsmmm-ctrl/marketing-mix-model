import type { SpendDay, SpendSyncRange } from "../types.js";

export type GoogleSpendClientConfig = {
  developerToken?: string;
  customerId?: string;
  refreshToken?: string;
  useMock?: boolean;
};

export interface GoogleSpendClient {
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

/** Deterministic mock — stable for tests and local dev without Google Ads OAuth. */
export class MockGoogleSpendClient implements GoogleSpendClient {
  constructor(private readonly customerId = "mock-customer") {}

  async fetchDailySpend(range: SpendSyncRange): Promise<SpendDay[]> {
    return eachDay(range.from, range.to).map((date) => {
      const seed = hashSeed(`${this.customerId}:${date}`);
      const amount = 50 + (seed % 90);
      return {
        date,
        channel: "Google",
        amount: Math.round(amount * 100) / 100,
        currency: "USD",
        source: "google" as const,
      };
    });
  }
}

/** Live client stub — requires human Google Cloud + Ads API developer token. */
export class GoogleSpendClientLive implements GoogleSpendClient {
  constructor(private readonly config: GoogleSpendClientConfig) {}

  async fetchDailySpend(_range: SpendSyncRange): Promise<SpendDay[]> {
    if (!this.config.developerToken || !this.config.customerId) {
      throw new Error(
        "Google Ads API not configured. Create GCP project, enable Ads API, obtain developer token, and OAuth refresh token.",
      );
    }
    throw new Error(
      "Google Ads API fetch not implemented — wire after developer token and OAuth exist.",
    );
  }
}

export function createGoogleSpendClient(
  config: GoogleSpendClientConfig = { useMock: true },
): GoogleSpendClient {
  if (config.useMock !== false) {
    return new MockGoogleSpendClient(config.customerId);
  }
  return new GoogleSpendClientLive(config);
}
