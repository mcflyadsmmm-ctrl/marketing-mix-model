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
import { PRODUCT_NOUN } from "../lib/product-labels";
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
        message: `Loaded ${result.days.toLocaleString()} days of matched sales + spend. Open ${PRODUCT_NOUN.deskTitle} → 3 yr.`,
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
      return {
        ok: true as const,
        message: `Sample desk on — ${PRODUCT_NOUN.totalRoas} reads sample sales + spend.`,
      };
    }
    if (intent === "disable") {
      await setSampleDeskEnabled(shop.id, false);
      return {
        ok: true as const,
        message: `Sample desk off — ${PRODUCT_NOUN.totalRoas} reads live sales again.`,
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
      <div className="mcfly-desk mcfly-desk--chrome">
        <div className="mcfly-demo-off-warning" role="alert">
          <p className="mcfly-demo-off-warning__kicker">Before App Store review</p>
          <p className="mcfly-demo-off-warning__title">
            Turn sample desk OFF before reviewer smoke
          </p>
          <p className="mcfly-demo-off-warning__body">
            Listing shots use sample data. <code>?shot=1</code> only hides the
            SAMPLE banner — {PRODUCT_NOUN.totalRoas}, Spend, and Allocation stay
            sample until OFF. App Store review and install smoke must see live
            live sales only — leave SAMPLE on and reviewers may reject for
            fake metrics.
          </p>
          {stats.enabled ? (
            <Form method="post" className="mcfly-demo-off-warning__action">
              <input type="hidden" name="intent" value="disable" />
              <s-button
                type="submit"
                tone="critical"
                variant="primary"
                {...(busy && intent === "disable" ? { loading: true } : {})}
              >
                Turn sample desk OFF now
              </s-button>
            </Form>
          ) : (
            <p className="mcfly-demo-off-warning__status">Sample desk is OFF — live Shopify.</p>
          )}
        </div>

        <s-banner tone="info" heading="Listing screenshots and desk rehearsals">
          <s-paragraph>
            Loads <strong>3 years</strong> of matched daily Shopify-like sales
            and multi-channel spend into Mcfly (not Shopify Admin). Clearly
            labeled sample — preview the desk before live data.
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

        <s-section heading="Prepare listing shots">
          <s-paragraph>
            One click seeds ~1,095 days of sales + Meta/Google/Microsoft/TikTok/Affiliate/Email/Other
            spend ({PRODUCT_NOUN.totalRoas} ≈ {formatMer(3.5)}) and turns sample desk ON.
            Deterministic — same shape every run.
          </s-paragraph>
          <Form method="post">
            <input type="hidden" name="intent" value="prepare" />
            <s-button
              type="submit"
              variant="primary"
              {...(busy && intent === "prepare" ? { loading: true } : {})}
            >
              Prepare listing shots
            </s-button>
          </Form>
          {actionData && "result" in actionData && actionData.result ? (
            <p className="mcfly-breakdown-note">
              Seeded sales {formatCurrency(actionData.result.totalSales)} · spend{" "}
              {formatCurrency(actionData.result.totalSpend)} ·{" "}
              {PRODUCT_NOUN.totalRoas} ≈{" "}
              {formatMer(
                actionData.result.totalSpend > 0
                  ? actionData.result.totalSales / actionData.result.totalSpend
                  : null,
              )}
            </p>
          ) : null}

          <s-paragraph>
            Then capture in order (~1600×900, crop browser chrome). Shot mode (
            <code>?shot=1</code>) hides the sample banner:
          </s-paragraph>
          <div className="mcfly-demo-steps">
            <s-link href="/app?period=y3&shot=1">
              1 · {PRODUCT_NOUN.deskTitle} → 3 yr (shot)
            </s-link>
            <s-link href="/app?period=mtd&shot=1">
              2 · {PRODUCT_NOUN.deskTitle} → MTD · equation panel (shot)
            </s-link>
            <s-link href="/app/spend?shot=1">3 · Spend (shot)</s-link>
            <s-link href="/app/allocation?period=y3&shot=1">4 · Allocation → 3 yr (shot)</s-link>
            <s-link href="/app/settings?shot=1">5 · Settings (shot)</s-link>
          </div>
          <s-paragraph>
            <s-text tone="neutral">
              Shot list + captions: <code>docs/LISTING_VISUAL_PACK.md</code>.
            </s-text>
          </s-paragraph>
        </s-section>

        <s-section heading="Advanced">
          <s-stack direction="block" gap="base">
            <Form method="post">
              <input type="hidden" name="intent" value="seed" />
              <s-button type="submit" {...(busy && intent === "seed" ? { loading: true } : {})}>
                Seed only (keep current ON/OFF)
              </s-button>
            </Form>
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
