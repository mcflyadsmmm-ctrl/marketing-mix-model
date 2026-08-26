import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigation,
} from "react-router";
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
  SAMPLE_DESK_TARGET_MER,
} from "../lib/sample-desk.server";

/** Only allow in-app return paths (embedded Admin). Preserve shop/host query. */
function safeAppReturnTo(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? "").trim();
  if (!value.startsWith("/app")) return null;
  if (value.includes("://") || value.includes("//")) return null;
  return value;
}

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
      const result = await seedThreeYearSampleDesk(
        shop.id,
        SAMPLE_DESK_TARGET_MER,
      );
      await setSampleDeskEnabled(shop.id, true);
      return {
        ok: true as const,
        message: `Sample data ready — ${result.days.toLocaleString()} days. Open Total ROAS to explore.`,
        result,
      };
    }
    if (intent === "seed") {
      const result = await seedThreeYearSampleDesk(
        shop.id,
        SAMPLE_DESK_TARGET_MER,
      );
      return {
        ok: true as const,
        message: `Sample data ready — ${result.days.toLocaleString()} days. Open ${PRODUCT_NOUN.deskTitle}.`,
        result,
      };
    }
    if (intent === "enable") {
      const stats = await getSampleDeskStats(shop.id);
      if (stats.dayCount === 0) {
        const result = await seedThreeYearSampleDesk(
          shop.id,
          SAMPLE_DESK_TARGET_MER,
        );
        return {
          ok: true as const,
          message: `Sample data ready — ${result.days.toLocaleString()} days.`,
          result,
        };
      }
      // Refresh to latest impressive series when turning SAMPLE back on.
      const result = await seedThreeYearSampleDesk(
        shop.id,
        SAMPLE_DESK_TARGET_MER,
      );
      await setSampleDeskEnabled(shop.id, true);
      return {
        ok: true as const,
        message: `${PRODUCT_NOUN.samplePreviewOn} · refreshed (~${formatMer(SAMPLE_DESK_TARGET_MER)}× Total ROAS).`,
        result,
      };
    }
    if (intent === "disable") {
      await setSampleDeskEnabled(shop.id, false);
      const returnTo = safeAppReturnTo(form.get("returnTo"));
      if (returnTo) {
        return redirect(returnTo);
      }
      return {
        ok: true as const,
        message: `Using Live data — ${PRODUCT_NOUN.totalRoas} reads this shop’s sales again. Sample data chrome is off.`,
      };
    }
    if (intent === "clear") {
      await clearSampleDesk(shop.id);
      return { ok: true as const, message: "Sample data cleared." };
    }
    return { ok: false as const, message: "Unknown action." };
  } catch (err) {
    return {
      ok: false as const,
      message: err instanceof Error ? err.message : "Sample data action failed",
    };
  }
};

export default function DemoPage() {
  const { stats } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const location = useLocation();
  const busy = navigation.state === "submitting";
  const intent = navigation.formData?.get("intent")?.toString();
  const demoAction = `${location.pathname}${location.search}`;

  return (
    <s-page heading={PRODUCT_NOUN.samplePreview} inlineSize="base">
      <div
        className={[
          "mcfly-desk",
          "mcfly-desk--chrome",
          stats.enabled ? "mcfly-desk--sample" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {stats.enabled ? (
          <s-banner tone="info" heading={PRODUCT_NOUN.samplePreviewOffReviewTitle}>
            <s-paragraph>
              {PRODUCT_NOUN.samplePreviewOffReviewBody}
            </s-paragraph>
            <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
              <s-button href="/app" variant="primary">
                {PRODUCT_NOUN.openTotalRoas}
              </s-button>
              <Form method="post" action={demoAction}>
                <input type="hidden" name="intent" value="disable" />
                <input type="hidden" name="returnTo" value={`/app${location.search}`} />
                <s-button
                  type="submit"
                  variant="secondary"
                  {...(busy && intent === "disable" ? { loading: true } : {})}
                >
                  {PRODUCT_NOUN.samplePreviewOffCta}
                </s-button>
              </Form>
            </div>
          </s-banner>
        ) : (
          <s-banner tone="success" heading={PRODUCT_NOUN.samplePreviewLiveStore}>
            <s-paragraph>{PRODUCT_NOUN.samplePreviewLiveStoreBody}</s-paragraph>
            <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
              <s-button href="/app" variant="primary">
                {PRODUCT_NOUN.openTotalRoas}
              </s-button>
              <s-button href="/app/spend" variant="secondary">
                Go to Spend
              </s-button>
            </div>
          </s-banner>
        )}

        {actionData ? (
          <s-banner
            tone={actionData.ok ? "success" : "critical"}
            heading={actionData.ok ? "Done" : "Needs a fix"}
          >
            <s-paragraph>{actionData.message}</s-paragraph>
          </s-banner>
        ) : null}

        {stats.enabled ? (
          <s-section heading="Sample data">
            <s-paragraph>
              Sample data stays labeled on Total ROAS, Goals, and Spend. Switch to
              Live data at the top when you want this shop’s Shopify numbers.
            </s-paragraph>
            <div className="mcfly-decision__actions">
              <s-button href="/app" variant="secondary">
                {PRODUCT_NOUN.openTotalRoas}
              </s-button>
              <Form method="post" action={demoAction}>
                <input type="hidden" name="intent" value="prepare" />
                <s-button
                  type="submit"
                  variant="tertiary"
                  {...(busy && intent === "prepare" ? { loading: true } : {})}
                >
                  Refresh sample numbers
                </s-button>
              </Form>
            </div>
            <div className="mcfly-breakdown-row" style={{ marginTop: "1rem" }}>
              <span>Status</span>
              <strong>Sample data on</strong>
            </div>
            <div className="mcfly-breakdown-row">
              <span>Sample days</span>
              <strong>{stats.dayCount.toLocaleString()}</strong>
            </div>
            {actionData && "result" in actionData && actionData.result ? (
              <p className="mcfly-breakdown-note">
                Sample sales {formatCurrency(actionData.result.totalSales)} · spend{" "}
                {formatCurrency(actionData.result.totalSpend)} ·{" "}
                {PRODUCT_NOUN.totalRoas} ≈{" "}
                {formatMer(
                  actionData.result.totalSpend > 0
                    ? actionData.result.totalSales / actionData.result.totalSpend
                    : null,
                )}
              </p>
            ) : null}
          </s-section>
        ) : (
          <s-section heading="Sample data (optional)">
            <s-paragraph>
              Prefer Sample data | Live data at the top of any page. This page can
              also load matched example sales and spend. Numbers are labeled
              Sample data and never pretend to be this shop.
            </s-paragraph>
            <Form method="post" action={demoAction}>
              <input type="hidden" name="intent" value="prepare" />
              <s-button
                type="submit"
                variant="secondary"
                {...(busy && intent === "prepare" ? { loading: true } : {})}
              >
                Load Sample data
              </s-button>
            </Form>
            <div className="mcfly-breakdown-row" style={{ marginTop: "1rem" }}>
              <span>Status</span>
              <strong>Live data</strong>
            </div>
            <div className="mcfly-breakdown-row">
              <span>Sample days on file</span>
              <strong>{stats.dayCount.toLocaleString()}</strong>
            </div>
            {actionData && "result" in actionData && actionData.result ? (
              <p className="mcfly-breakdown-note">
                Sample sales {formatCurrency(actionData.result.totalSales)} · spend{" "}
                {formatCurrency(actionData.result.totalSpend)} ·{" "}
                {PRODUCT_NOUN.totalRoas} ≈{" "}
                {formatMer(
                  actionData.result.totalSpend > 0
                    ? actionData.result.totalSales / actionData.result.totalSpend
                    : null,
                )}
              </p>
            ) : null}
          </s-section>
        )}

        <s-section heading="Your real job">
          <s-paragraph>
            {PRODUCT_NOUN.spendJob}. Exact daily spend by platform — any period,
            any day of the week. Cold path: margin → spend → Total ROAS.
          </s-paragraph>
          <div className="mcfly-decision__actions">
            <s-button href="/app/settings" variant="secondary">
              {PRODUCT_NOUN.setupAdjustMargin}
            </s-button>
            <s-button href="/app/spend" variant="primary">
              Go to Spend
            </s-button>
            <s-button href="/app" variant="secondary">
              {PRODUCT_NOUN.openTotalRoas}
            </s-button>
            <s-button href="/app" variant="tertiary">
              Open Overview
            </s-button>
          </div>
        </s-section>

        <details className="mcfly-panel" style={{ marginTop: "1rem" }}>
          <summary className="mcfly-panel__head">
            <h2>Listing shots (ops)</h2>
            <p className="mcfly-panel__muted">Staff only — App Store screenshots</p>
          </summary>
          <s-paragraph>
            After SAMPLE is on, open shot links with <code>?shot=1</code>. Leave
            SAMPLE off for App Store review smoke.
          </s-paragraph>
          <ul>
            <li>
              <s-link href="/app?period=mtd&shot=1">Overview MTD shot</s-link>
            </li>
            <li>
              <s-link href="/app/spend?shot=1">Spend shot</s-link>
            </li>
            <li>
              <s-link href="/app/goals?shot=1">Goals shot</s-link>
            </li>
            <li>
              <s-link href="/app/allocation?period=mtd&shot=1">
                Allocation shot
              </s-link>
            </li>
          </ul>
          <Form method="post" action={demoAction} style={{ marginTop: "0.75rem" }}>
            <input type="hidden" name="intent" value="clear" />
            <s-button
              type="submit"
              tone="critical"
              variant="tertiary"
              {...(busy && intent === "clear" ? { loading: true } : {})}
            >
              Clear SAMPLE data
            </s-button>
          </Form>
        </details>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
