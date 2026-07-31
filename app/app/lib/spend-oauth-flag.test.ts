import { afterEach, describe, expect, it } from "vitest";
import {
  hasGoogleOauthCredentials,
  hasMetaOauthCredentials,
  isSpendOauthEnabled,
  isSpendOauthMockAllowed,
  recentUtcDayRange,
} from "./spend-oauth-flag.server";

const KEYS = [
  "MCFLY_SPEND_OAUTH",
  "MCFLY_SPEND_OAUTH_MOCK",
  "META_ACCESS_TOKEN",
  "META_AD_ACCOUNT_ID",
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GOOGLE_ADS_CUSTOMER_ID",
  "GOOGLE_ADS_REFRESH_TOKEN",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

describe("spend-oauth-flag", () => {
  afterEach(() => {
    for (const key of KEYS) {
      delete process.env[key];
    }
  });

  it("defaults OAuth scaffold off", () => {
    expect(isSpendOauthEnabled()).toBe(false);
    expect(isSpendOauthMockAllowed()).toBe(false);
    expect(hasMetaOauthCredentials()).toBe(false);
    expect(hasGoogleOauthCredentials()).toBe(false);
  });

  it("enables when MCFLY_SPEND_OAUTH=1", () => {
    process.env.MCFLY_SPEND_OAUTH = "1";
    process.env.MCFLY_SPEND_OAUTH_MOCK = "1";
    expect(isSpendOauthEnabled()).toBe(true);
    expect(isSpendOauthMockAllowed()).toBe(true);
  });

  it("detects Meta credential pair", () => {
    process.env.META_ACCESS_TOKEN = "tok";
    process.env.META_AD_ACCOUNT_ID = "act_1";
    expect(hasMetaOauthCredentials()).toBe(true);
  });

  it("requires Google Ads tokens plus GOOGLE_CLIENT_ID/SECRET", () => {
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN = "dev";
    process.env.GOOGLE_ADS_CUSTOMER_ID = "123";
    process.env.GOOGLE_ADS_REFRESH_TOKEN = "ref";
    expect(hasGoogleOauthCredentials()).toBe(false);

    process.env.GOOGLE_CLIENT_ID = "cid";
    process.env.GOOGLE_CLIENT_SECRET = "csecret";
    expect(hasGoogleOauthCredentials()).toBe(true);
  });

  it("builds an inclusive recent UTC day range", () => {
    const { from, to } = recentUtcDayRange(7);
    expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(from <= to).toBe(true);
  });
});
