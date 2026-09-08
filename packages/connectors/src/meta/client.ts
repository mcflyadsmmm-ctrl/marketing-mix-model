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

const META_GRAPH_VERSION = "v21.0";

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

/** Normalize to `act_XXX` (Meta Insights path requires the act_ prefix). */
export function normalizeMetaAdAccountId(adAccountId: string): string {
  const trimmed = adAccountId.trim();
  if (!trimmed) return trimmed;
  return trimmed.startsWith("act_") ? trimmed : `act_${trimmed}`;
}

type MetaInsightsRow = {
  spend?: string | number;
  date_start?: string;
  account_currency?: string;
};

type MetaInsightsResponse = {
  data?: MetaInsightsRow[];
  paging?: { next?: string };
  error?: { message?: string; type?: string; code?: number };
};

function mapMetaInsightRow(row: MetaInsightsRow): SpendDay | null {
  const date = row.date_start?.trim();
  if (!date) return null;
  const amount = Number(row.spend ?? 0);
  if (!Number.isFinite(amount)) return null;
  const currency =
    typeof row.account_currency === "string" && row.account_currency.trim()
      ? row.account_currency.trim().toUpperCase()
      : "USD";
  return {
    date,
    channel: "Meta",
    amount,
    currency,
    source: "meta",
  };
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

/**
 * Live Meta Marketing API Insights pull — amounts only (no pixels / attribution).
 * Requires human OAuth + Marketing API App Review for `ads_read` (not claimed done).
 */
export class MetaSpendClientLive implements MetaSpendClient {
  constructor(private readonly config: MetaSpendClientConfig) {}

  async fetchDailySpend(range: SpendSyncRange): Promise<SpendDay[]> {
    if (!this.config.accessToken || !this.config.adAccountId) {
      throw new Error(
        "Meta OAuth not configured. Create a Meta Developer app, complete OAuth, and pass accessToken + adAccountId.",
      );
    }

    const actId = normalizeMetaAdAccountId(this.config.adAccountId);
    const timeRange = JSON.stringify({
      since: range.from,
      until: range.to,
    });
    const params = new URLSearchParams({
      fields: "spend,date_start,account_currency",
      time_increment: "1",
      level: "account",
      time_range: timeRange,
      access_token: this.config.accessToken,
    });

    let url: string | null =
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${actId}/insights?${params.toString()}`;

    const rows: SpendDay[] = [];

    while (url) {
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `Meta Insights HTTP ${res.status}${body ? `: ${body.slice(0, 400)}` : ""}`,
        );
      }

      const json = (await res.json()) as MetaInsightsResponse;
      if (json.error?.message) {
        throw new Error(
          `Meta Insights error: ${json.error.message}${
            json.error.code != null ? ` (code ${json.error.code})` : ""
          }`,
        );
      }

      for (const row of json.data ?? []) {
        const mapped = mapMetaInsightRow(row);
        if (mapped) rows.push(mapped);
      }

      url = json.paging?.next?.trim() || null;
    }

    return rows;
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
