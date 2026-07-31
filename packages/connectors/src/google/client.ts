import type { SpendDay, SpendSyncRange } from "../types.js";

export type GoogleSpendClientConfig = {
  developerToken?: string;
  customerId?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  /** Optional MCC / manager customer id for `login-customer-id` header. */
  loginCustomerId?: string;
  useMock?: boolean;
};

export interface GoogleSpendClient {
  fetchDailySpend(range: SpendSyncRange): Promise<SpendDay[]>;
}

const GOOGLE_ADS_API_VERSION = "v17";

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

/** Strip dashes for Google Ads customer resource paths / headers. */
export function normalizeGoogleCustomerId(customerId: string): string {
  return customerId.replace(/-/g, "").trim();
}

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleAdsSearchRow = {
  segments?: { date?: string };
  metrics?: { costMicros?: string | number };
};

type GoogleAdsSearchResponse = {
  results?: GoogleAdsSearchRow[];
  nextPageToken?: string;
  error?: { message?: string; status?: string; code?: number };
};

async function refreshGoogleAccessToken(config: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<string> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const text = await res.text().catch(() => "");
  let json: GoogleTokenResponse = {};
  try {
    json = JSON.parse(text) as GoogleTokenResponse;
  } catch {
    // non-JSON body — surface raw text below
  }
  if (!res.ok || !json.access_token) {
    const detail =
      json.error_description || json.error || text || `HTTP ${res.status}`;
    throw new Error(`Google OAuth token refresh failed: ${detail}`);
  }
  return json.access_token;
}

function mapGoogleSearchRow(
  row: GoogleAdsSearchRow,
  currency: string,
): SpendDay | null {
  const date = row.segments?.date?.trim();
  if (!date) return null;
  const micros = Number(row.metrics?.costMicros ?? 0);
  if (!Number.isFinite(micros)) return null;
  return {
    date,
    channel: "Google",
    amount: micros / 1_000_000,
    currency,
    source: "google",
  };
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

/**
 * Live Google Ads GAQL cost pull — amounts only (no pixels / attribution).
 * Requires human GCP + Ads API developer token + OAuth (App Review not claimed).
 */
export class GoogleSpendClientLive implements GoogleSpendClient {
  constructor(private readonly config: GoogleSpendClientConfig) {}

  async fetchDailySpend(range: SpendSyncRange): Promise<SpendDay[]> {
    const {
      developerToken,
      customerId,
      refreshToken,
      clientId,
      clientSecret,
      loginCustomerId,
    } = this.config;

    if (!developerToken || !customerId || !refreshToken || !clientId || !clientSecret) {
      throw new Error(
        "Google Ads API not configured. Need developerToken, customerId, refreshToken, clientId, and clientSecret.",
      );
    }

    const accessToken = await refreshGoogleAccessToken({
      clientId,
      clientSecret,
      refreshToken,
    });

    const customerIdClean = normalizeGoogleCustomerId(customerId);

    // Account currency — never hardcode USD for non-USD Ads accounts.
    let currency = "USD";
    {
      const currencyHeaders: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": developerToken,
        "Content-Type": "application/json",
      };
      if (loginCustomerId?.trim()) {
        currencyHeaders["login-customer-id"] =
          normalizeGoogleCustomerId(loginCustomerId);
      }
      const currencyRes = await fetch(
        `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerIdClean}/googleAds:search`,
        {
          method: "POST",
          headers: currencyHeaders,
          body: JSON.stringify({
            query: "SELECT customer.currency_code FROM customer LIMIT 1",
          }),
        },
      );
      if (!currencyRes.ok) {
        const text = await currencyRes.text().catch(() => "");
        throw new Error(
          `Google Ads currency lookup HTTP ${currencyRes.status}${text ? `: ${text.slice(0, 400)}` : ""}`,
        );
      }
      const currencyJson = (await currencyRes.json()) as {
        results?: Array<{ customer?: { currencyCode?: string } }>;
        error?: { message?: string };
      };
      if (currencyJson.error?.message) {
        throw new Error(
          `Google Ads currency lookup error: ${currencyJson.error.message}`,
        );
      }
      const code = currencyJson.results?.[0]?.customer?.currencyCode?.trim();
      if (!code) {
        throw new Error(
          "Google Ads currency lookup returned no customer.currency_code — refusing silent USD default.",
        );
      }
      currency = code.toUpperCase();
    }

    const query =
      `SELECT segments.date, metrics.cost_micros FROM customer ` +
      `WHERE segments.date BETWEEN '${range.from}' AND '${range.to}' ` +
      `ORDER BY segments.date`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": developerToken,
      "Content-Type": "application/json",
    };
    if (loginCustomerId?.trim()) {
      headers["login-customer-id"] = normalizeGoogleCustomerId(loginCustomerId);
    }

    const rows: SpendDay[] = [];
    let pageToken: string | undefined;

    do {
      const body: { query: string; pageToken?: string } = { query };
      if (pageToken) body.pageToken = pageToken;

      const res = await fetch(
        `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerIdClean}/googleAds:search`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `Google Ads search HTTP ${res.status}${text ? `: ${text.slice(0, 400)}` : ""}`,
        );
      }

      const json = (await res.json()) as GoogleAdsSearchResponse;
      if (json.error?.message) {
        throw new Error(`Google Ads search error: ${json.error.message}`);
      }

      for (const row of json.results ?? []) {
        const mapped = mapGoogleSearchRow(row, currency);
        if (mapped) rows.push(mapped);
      }

      pageToken = json.nextPageToken?.trim() || undefined;
    } while (pageToken);

    return rows;
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
