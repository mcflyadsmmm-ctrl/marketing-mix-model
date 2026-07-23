import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { ensureShop, getOrCreateSettings } from "../lib/mer-dashboard.server";
import { formatCurrency, formatMer } from "../lib/mer-format";
import {
  clearSampleDesk,
  getSampleDeskStats,
  seedThreeYearSampleDesk,
  setSampleDeskEnabled,
} from "../lib/sample-desk.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  await getOrCreateSettings(shop.id);
  const stats = await getSampleDeskStats(shop.id);
  return { stats };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  await getOrCreateSettings(shop.id);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");

  try {
    if (intent === "prepare") {
      const result = await seedThreeYearSampleDesk(shop.id, 3.5);
      await setSampleDeskEnabled(shop.id, true);
      return {
        ok: true as const,
        message: `Ready — ${result.days.toLocaleString()} days seeded, sample desk is ON. Open the shot links below.`,
        result,
      };
    }
    if (intent === "seed") {
      const result = await seedThreeYearSampleDesk(shop.id, 3.5);
      return {
        ok: true as const,
        message: `Loaded ${result.days.toLocaleString()} days of matched sales + spend. Open Cash MER → 3 yr.`,
        result,
      };
    }
    if (intent === "enable") {
      const stats = await getSampleDeskStats(shop.id);
      if (stats.dayCount === 0) {
        return {
          ok: false as const,
          message: "Seed the 3-year sample first.",
        };
      }
      await setSampleDeskEnabled(shop.id, true);
      return { ok: true as const, message: "Sample desk on — Cash MER reads sample till + spend." };
    }
    if (intent === "disable") {
      await setSampleDeskEnabled(shop.id, false);
      return {
        ok: true as const,
        message: "Sample desk off — Cash MER reads live Shopify again.",
      };
    }
    if (intent === "clear") {
      await clearSampleDesk(shop.id);
      return { ok: true as const, message: "Sample sales + sample spend cleared." };
    }
    return { ok: false as const, message: "Unknown action." };
  } catch (err) {
    return {
      ok: false as const,
      message: err instanceof Error ? err.message : "Sample desk action failed",
    };
  }
};

export default function DemoPage() {
  const { stats } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const busy = navigation.state === "submitting";
  const intent = navigation.formData?.get("intent")?.toString();

  return (
    <s-page heading="Demo" inlineSize="base">
      <div className="mcfly-desk">
        <s-banner tone="info" heading="For listing screenshots + desk rehearsals">
          <s-paragraph>
            Loads <strong>3 years</strong> of matched daily Shopify-like sales and multi-channel spend
            into Mcfly (not into Shopify Admin). Clearly sample. Turn off before App Store review if
            reviewers should see live till only.
          </s-paragraph>
        </s-banner>

        {actionData ? (
          <s-banner
            tone={actionData.ok ? "success" : "critical"}
            heading={actionData.ok ? "Done" : "Needs a fix"}
          >
            <s-paragraph>{actionData.message}</s-paragraph>
          </s-banner>
        ) : null}

        <s-section heading="Sample desk status">
          <div className="mcfly-panel">
            <div className="mcfly-breakdown-row">
              <span>Mode</span>
              <strong>{stats.enabled ? "SAMPLE on" : "Live Shopify"}</strong>
            </div>
            <div className="mcfly-breakdown-row">
              <span>Sample sales days</span>
              <strong>{stats.dayCount.toLocaleString()}</strong>
            </div>
            <div className="mcfly-breakdown-row">
              <span>Sample spend rows</span>
              <strong>{stats.spendCount.toLocaleString()}</strong>
            </div>
            {stats.start && stats.end ? (
              <p className="mcfly-breakdown-note">
                Range {stats.start.toISOString().slice(0, 10)} → {stats.end.toISOString().slice(0, 10)}
              </p>
            ) : (
              <p className="mcfly-breakdown-note">No sample loaded yet.</p>
            )}
          </div>
        </s-section>

        <s-section heading="1 · Load 3 years">
          <s-paragraph>
            Generates ~1,095 days of till sales + Meta/Google/Microsoft/TikTok/Affiliate/Email/Other
            spend targeting cash MER ≈ {formatMer(3.5)}. Deterministic — same shape every run.
          </s-paragraph>
          <Form method="post">
            <input type="hidden" name="intent" value="seed" />
            <s-button
              type="submit"
              variant="primary"
              {...(busy && intent === "seed" ? { loading: true } : {})}
            >
              Load 3-year sample desk
            </s-button>
          </Form>
          {actionData && "result" in actionData && actionData.result ? (
            <p className="mcfly-breakdown-note">
              Seeded sales {formatCurrency(actionData.result.totalSales)} · spend{" "}
              {formatCurrency(actionData.result.totalSpend)} · MER ≈{" "}
              {formatMer(
                actionData.result.totalSpend > 0
                  ? actionData.result.totalSales / actionData.result.totalSpend
                  : null,
              )}
            </p>
          ) : null}
        </s-section>

        <s-section heading="2 · Use it for screenshots">
          <s-stack direction="block" gap="base">
            <Form method="post">
              <input type="hidden" name="intent" value="enable" />
              <s-button type="submit" {...(busy && intent === "enable" ? { loading: true } : {})}>
                Turn sample desk ON
              </s-button>
            </Form>
            <Form method="post">
              <input type="hidden" name="intent" value="disable" />
              <s-button type="submit" {...(busy && intent === "disable" ? { loading: true } : {})}>
                Turn sample desk OFF (live Shopify)
              </s-button>
            </Form>
            <s-paragraph>Then capture the listing shots in order:</s-paragraph>
            <div className="mcfly-demo-steps">
              <s-link href="/app?period=y3&shot=1">1 · Cash MER → 3 yr (shot mode)</s-link>
              <s-link href="/app/spend">2 · Spend</s-link>
              <s-link href="/app/allocation?period=y3">3 · Allocation</s-link>
            </div>
            <s-paragraph>
              <s-text tone="neutral">
                Shot mode hides the sample banner so the frame reads clean. Capture at ~1600×900,
                crop browser chrome. Shot list: <code>docs/LISTING_VISUAL_PACK.md</code>.
              </s-text>
            </s-paragraph>
          </s-stack>
        </s-section>

        <s-section heading="Clear">
          <Form method="post">
            <input type="hidden" name="intent" value="clear" />
            <s-button
              type="submit"
              tone="critical"
              {...(busy && intent === "clear" ? { loading: true } : {})}
            >
              Delete sample data
            </s-button>
          </Form>
        </s-section>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
