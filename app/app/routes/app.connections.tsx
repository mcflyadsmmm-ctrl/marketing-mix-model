import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  createGoogleSpendClient,
  createMetaSpendClient,
} from "@mcfly/connectors";
import { authenticate } from "../shopify.server";
import { ensureShop } from "../lib/mer-dashboard.server";
import { createSpendRepository } from "../lib/spend-repository.server";
import {
  hasGoogleOauthCredentials,
  hasMetaOauthCredentials,
  isSpendOauthEnabled,
  isSpendOauthMockAllowed,
  isSpendOauthShopAllowlisted,
  recentUtcDayRange,
  SPEND_OAUTH_SHOP_NOT_ALLOWLISTED,
} from "../lib/spend-oauth-flag.server";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { getShopEntitlements } from "../lib/entitlements.server";
import { PRO_UPSELL } from "../lib/entitlements";
import { getSampleDeskEnabled } from "../lib/sample-desk.server";

const OAUTH_NOT_CONFIGURED = "OAuth credentials not configured";
const SAMPLE_DESK_CONNECT_BLOCK =
  "Sample preview is on. Tap Real store at the top of the page before connecting or syncing ad spend. CSV and connector writes stay blocked while Sample is on.";

type ConnectIntent = "connect_meta" | "connect_google" | "sync_mock";

function parseIntent(raw: FormDataEntryValue | null): ConnectIntent | null {
  const value = String(raw ?? "");
  if (
    value === "connect_meta" ||
    value === "connect_google" ||
    value === "sync_mock"
  ) {
    return value;
  }
  return null;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  const entitlements = getShopEntitlements(session.shop, {
    sampleDesk: useSampleDesk,
  });
  const oauthEnabled = isSpendOauthEnabled();
  const mockAllowed = isSpendOauthMockAllowed();
  return {
    oauthEnabled,
    mockAllowed,
    metaCredentialsPresent: hasMetaOauthCredentials(),
    googleCredentialsPresent: hasGoogleOauthCredentials(),
    entitlements,
    useSampleDesk,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  if (!isSpendOauthEnabled()) {
    return {
      ok: false as const,
      message:
        "Connected spend is off. Set MCFLY_SPEND_OAUTH=1 when App Review credentials exist.",
    };
  }

  const form = await request.formData();
  const intent = parseIntent(form.get("intent"));
  if (!intent) {
    return { ok: false as const, message: "Unknown action." };
  }

  const shop = await ensureShop(session.shop);
  const repository = createSpendRepository();
  const range = recentUtcDayRange(7);
  const mockAllowed = isSpendOauthMockAllowed();

  try {
    switch (intent) {
      case "connect_meta": {
        if (hasMetaOauthCredentials()) {
          const client = createMetaSpendClient({
            useMock: false,
            accessToken: process.env.META_ACCESS_TOKEN,
            adAccountId: process.env.META_AD_ACCOUNT_ID,
          });
          const rows = await client.fetchDailySpend(range);
          const result = await repository.upsertSpendDays(shop.id, rows);
          return {
            ok: true as const,
            message: `Meta LIVE Insights sync — ${result.written} day(s) written (source meta). Amounts only; App Review remains a human gate.`,
          };
        }
        if (mockAllowed) {
          const client = createMetaSpendClient({ useMock: true });
          const rows = await client.fetchDailySpend(range);
          const result = await repository.upsertSpendDays(shop.id, rows);
          return {
            ok: true as const,
            message: `Meta MOCK sync — ${result.written} day(s) written (source meta). Not live Marketing API. CSV remains the Free path.`,
          };
        }
        return { ok: false as const, message: OAUTH_NOT_CONFIGURED };
      }
      case "connect_google": {
        if (hasGoogleOauthCredentials()) {
          const client = createGoogleSpendClient({
            useMock: false,
            developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
            customerId: process.env.GOOGLE_ADS_CUSTOMER_ID,
            refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
          });
          const rows = await client.fetchDailySpend(range);
          const result = await repository.upsertSpendDays(shop.id, rows);
          return {
            ok: true as const,
            message: `Google LIVE GAQL sync — ${result.written} day(s) written (source google). Amounts only; Ads API developer token / OAuth remain human gates.`,
          };
        }
        if (mockAllowed) {
          const client = createGoogleSpendClient({ useMock: true });
          const rows = await client.fetchDailySpend(range);
          const result = await repository.upsertSpendDays(shop.id, rows);
          return {
            ok: true as const,
            message: `Google MOCK sync — ${result.written} day(s) written (source google). Not live Ads API. CSV remains the Free path.`,
          };
        }
        return { ok: false as const, message: OAUTH_NOT_CONFIGURED };
      }
      case "sync_mock": {
        if (!mockAllowed) {
          return {
            ok: false as const,
            message:
              "Mock sync is off. Set MCFLY_SPEND_OAUTH_MOCK=1 for local connector mocks.",
          };
        }
        const metaClient = createMetaSpendClient({ useMock: true });
        const googleClient = createGoogleSpendClient({ useMock: true });
        const [metaRows, googleRows] = await Promise.all([
          metaClient.fetchDailySpend(range),
          googleClient.fetchDailySpend(range),
        ]);
        const meta = await repository.upsertSpendDays(shop.id, metaRows);
        const google = await repository.upsertSpendDays(shop.id, googleRows);
        return {
          ok: true as const,
          message: `MOCK Meta+Google sync — ${meta.written + google.written} day(s) written (sources meta/google). Deterministic fixtures only — Free path is still paste CSV on Spend.`,
        };
      }
      default: {
        const _exhaustive: never = intent;
        return {
          ok: false as const,
          message: `Unhandled intent: ${String(_exhaustive)}`,
        };
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connect action failed";
    if (
      /not configured|OAuth credentials not configured/i.test(message) &&
      !mockAllowed
    ) {
      return { ok: false as const, message: OAUTH_NOT_CONFIGURED };
    }
    return { ok: false as const, message };
  }
};

export default function ConnectionsPage() {
  const {
    oauthEnabled,
    mockAllowed,
    metaCredentialsPresent,
    googleCredentialsPresent,
    entitlements,
    useSampleDesk,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const busy = navigation.state === "submitting";
  const intent = navigation.formData?.get("intent")?.toString() ?? null;

  const metaMode = metaCredentialsPresent
    ? "LIVE Insights (env tokens present)"
    : mockAllowed
      ? "MOCK only (set META_ACCESS_TOKEN + META_AD_ACCOUNT_ID for live)"
      : "blocked (no credentials, mock off)";
  const googleMode = googleCredentialsPresent
    ? "LIVE GAQL (env tokens present)"
    : mockAllowed
      ? "MOCK only (set Google Ads + GOOGLE_CLIENT_ID/SECRET for live)"
      : "blocked (no credentials, mock off)";

  return (
    <s-page heading="Connections" inlineSize="base">
      <div className="mcfly-desk mcfly-desk--chrome">
        {useSampleDesk ? (
          <SampleDeskBanner note="SAMPLE is on — connection syncs still write labeled practice spend. Turn SAMPLE off before App Store review." />
        ) : null}
        {entitlements.showProTeaser ? (
          <s-banner tone="info" heading="Free · Meta + Google connection test">
            <s-paragraph>
              Free includes Meta + Google spend sync (CSV or MOCK/OAuth below).
              Prove Shopify sales vs Meta/Google spend in minutes — then Pro (
              {PRO_UPSELL.short}) unlocks every channel + Customer LTV.
            </s-paragraph>
            <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
              <s-button href="/app/settings" variant="primary">
                {PRO_UPSELL.upgradeCta}
              </s-button>
              <s-button href="/app/demo" variant="secondary">
                Preview Pro on sample desk
              </s-button>
            </div>
          </s-banner>
        ) : null}

        {!oauthEnabled ? (
          <s-banner tone="info" heading="CSV-first spend (Free Meta + Google)">
            <s-paragraph>
              Free path starts on Spend: paste or upload Meta / Google CSV — no ad
              logins required. Download a blank template, fill in Sheets or Excel,
              paste back. Optional pipe tools (SyncWith / Coupler / Supermetrics)
              are nominative only — you pay those tools; Mcfly does not claim
              “Works with” badges. Meta + Google OAuth inside Mcfly is near-term
              (App Review / credentials) — enable with MCFLY_SPEND_OAUTH when ready.
            </s-paragraph>
            <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
              <s-button href="/app/spend#mcfly-spend-uploads" variant="primary">
                Paste / upload spend
              </s-button>
              <s-button href="/app/spend#mcfly-spend-sheets" variant="secondary">
                Sheets template steps
              </s-button>
            </div>
          </s-banner>
        ) : (
          <>
            <s-banner tone="info" heading="Connected spend — near-term OAuth">
              <s-paragraph>
                CSV / paste on Spend remains the default Free path. OAuth below
                is amounts-only (no pixels / attribution) when credentials exist
                — otherwise mock when <code>MCFLY_SPEND_OAUTH_MOCK=1</code>. Not
                a “Works with Meta/Google” claim until App Review clears (human
                gate).
              </s-paragraph>
            </s-banner>

            {actionData ? (
              <s-banner
                tone={actionData.ok ? "success" : "warning"}
                heading={actionData.ok ? "Sync result" : "Connect blocked"}
              >
                <s-paragraph>{actionData.message}</s-paragraph>
              </s-banner>
            ) : null}

            <s-section heading="Ad platforms">
              <s-stack direction="block" gap="base">
                <s-paragraph>
                  Meta: {metaMode}. Google: {googleMode}.
                  {mockAllowed
                    ? " Mock path ON (MCFLY_SPEND_OAUTH_MOCK=1)."
                    : " Mock path OFF."}
                </s-paragraph>

                <s-stack direction="inline" gap="base">
                  <Form method="post">
                    <input type="hidden" name="intent" value="connect_meta" />
                    <s-button
                      type="submit"
                      variant="primary"
                      {...(busy && intent === "connect_meta"
                        ? { loading: true }
                        : {})}
                    >
                      {metaCredentialsPresent ? "Sync Meta (live)" : "Connect Meta"}
                    </s-button>
                  </Form>
                  <Form method="post">
                    <input type="hidden" name="intent" value="connect_google" />
                    <s-button
                      type="submit"
                      variant="primary"
                      {...(busy && intent === "connect_google"
                        ? { loading: true }
                        : {})}
                    >
                      {googleCredentialsPresent
                        ? "Sync Google (live)"
                        : "Connect Google"}
                    </s-button>
                  </Form>
                </s-stack>

                {mockAllowed ? (
                  <Form method="post">
                    <input type="hidden" name="intent" value="sync_mock" />
                    <s-button
                      type="submit"
                      variant="secondary"
                      {...(busy && intent === "sync_mock"
                        ? { loading: true }
                        : {})}
                    >
                      Sync mock Meta + Google
                    </s-button>
                  </Form>
                ) : null}
              </s-stack>
            </s-section>

            <s-section heading="Free path + optional automation">
              <s-paragraph>
                Prefer{" "}
                <s-link href="/app/spend#mcfly-spend-uploads">
                  paste / upload on Spend
                </s-link>{" "}
                — CSV-first, always available. Sheets steps and optional pipe
                templates (SyncWith / Coupler / Supermetrics — you pay them;
                nominative only, no “Works with” claim) live on Spend. OAuth
                connect above is near-term retention when App Review clears.
              </s-paragraph>
              <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
                <s-button href="/app/spend#mcfly-spend-uploads" variant="secondary">
                  Paste / upload spend
                </s-button>
                <s-button href="/app/spend#mcfly-spend-sheets" variant="tertiary">
                  Sheets template steps
                </s-button>
              </div>
            </s-section>
          </>
        )}
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
