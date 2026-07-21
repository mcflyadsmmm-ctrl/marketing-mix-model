/**
 * Stub connector interfaces for future Meta / Google OAuth spend sync.
 * Live OAuth implementation comes in Phase 2 — do not wire credentials here.
 */

export type ConnectorProvider = "meta" | "google";

export interface ConnectorStatus {
  provider: ConnectorProvider;
  connected: boolean;
  lastSyncAt: Date | null;
  message: string;
}

export interface SpendConnector {
  provider: ConnectorProvider;
  /** Future: OAuth connect flow URL */
  getConnectUrl(shopDomain: string): string | null;
  /** Future: pull spend for date range from ad platform API */
  fetchSpend(
    shopDomain: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<number>;
  getStatus(shopDomain: string): Promise<ConnectorStatus>;
}

export class StubSpendConnector implements SpendConnector {
  constructor(public provider: ConnectorProvider) {}

  getConnectUrl(_shopDomain: string): string | null {
    return null;
  }

  async fetchSpend(
    _shopDomain: string,
    _periodStart: Date,
    _periodEnd: Date,
  ): Promise<number> {
    return 0;
  }

  async getStatus(_shopDomain: string): Promise<ConnectorStatus> {
    return {
      provider: this.provider,
      connected: false,
      lastSyncAt: null,
      message: "Manual spend entry only (OAuth coming in Phase 2)",
    };
  }
}

export const metaConnector = new StubSpendConnector("meta");
export const googleConnector = new StubSpendConnector("google");

export async function getAllConnectorStatuses(
  shopDomain: string,
): Promise<ConnectorStatus[]> {
  return Promise.all([
    metaConnector.getStatus(shopDomain),
    googleConnector.getStatus(shopDomain),
  ]);
}
