import { useEffect } from "react";
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
  useNavigation,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  calculateBreakEvenMer,
} from "@mcfly/mer-core";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { requireAdmin } from "../lib/public-app-gate.server";
import {
  ensureShop,
  getOrCreateSettings,
  marginIsConfirmed,
  marginIsStale,
} from "../lib/mer-dashboard.server";
import { formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import {
  applySampleDeskIntent,
  getSampleDeskEnabled,
  isSampleDeskIntent,
  isSampleOnlyFreeze,
} from "../lib/sample-desk.server";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { TRIAL_VS_VIEW } from "../lib/sample-live-handoff";
import { ProUpgradeButton } from "../components/ProUpgradeButton";
import {
  getComplianceDataExportPackage,
  listComplianceDataExportsForShop,
} from "../lib/compliance-export-retrieve.server";
import {
  getShopBillingSnapshot,
  syncShopProFromShopify,
} from "../lib/billing.server";
import { isBillingEnabled } from "../lib/billing-flag.server";
import { BILLING_HONESTY } from "../lib/entitlements";
import { FLY_SUPPORT_URL } from "../lib/public-origin";
import prisma from "../db.server";

type ShopifyToast = {
  show?: (message: string, options?: { duration?: number; isError?: boolean }) => void;
};

function showAdminToast(
  message: string,
  options?: { duration?: number; isError?: boolean },
) {
  const bridge = (
    window as Window & { shopify?: { toast?: ShopifyToast } }
  ).shopify;
  bridge?.toast?.show?.(message, options);
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await requireAdmin(request);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const shop = await ensureShop(session.shop);
  if (isBillingEnabled()) {
    try {
      await syncShopProFromShopify(admin, shop.id);
    } catch {
      // Fail open on sync — cached proBillingActive still applies.
    }
  }
  const shopFresh = await prisma.shop.findUniqueOrThrow({
    where: { id: shop.id },
    select: {
      proBillingActive: true,
    },
  });
  const settings = await getOrCreateSettings(shop.id);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  const sampleOnlyFreeze = isSampleOnlyFreeze();
  const marginConfirmed = marginIsConfirmed(settings);
  const liveSpendCount = await prisma.spendEntry.count({
    where: { shopId: shop.id, NOT: { source: "sample" } },
  });
  const complianceExports = await listComplianceDataExportsForShop(
    session.shop,
    20,
  );
  const billing = getShopBillingSnapshot(session.shop, {
    sampleDesk: useSampleDesk,
    paidPro: shopFresh.proBillingActive,
  });
  const billingError = url.searchParams.get("billingError");
  return {
    settings,
    breakEvenMer: calculateBreakEvenMer(settings.marginPct),
    showRitualBanner: !marginConfirmed,
    marginStale: marginConfirmed && marginIsStale(settings),
    hasLiveSpend: liveSpendCount > 0,
    shotMode,
    useSampleDesk,
    sampleOnlyFreeze,
    complianceExports,
    billing,
    billingError: billingError?.trim() || null,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await requireAdmin(request);
  const shop = await ensureShop(session.shop);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "save_margin");

  // Pro upgrade lives on /app/billing (top-frame confirmation). Keep Settings clean.

  if (isSampleDeskIntent(intent)) {
    await getOrCreateSettings(shop.id);
    await applySampleDeskIntent(shop.id, intent);
    if (intent === "use-sample" || intent === "use-real") {
      const url = new URL(request.url);
      url.pathname = "/app";
      if (intent === "use-real") url.searchParams.set("guide", "real");
      else url.searchParams.delete("guide");
      return redirect(`${url.pathname}${url.search}`);
    }
    return {
      error: null,
      success: true as const,
      breakEvenMer: null as number | null,
      marginPct: null as number | null,
    };
  }

  if (intent === "download_compliance_export") {
    const exportId = String(form.get("exportId") ?? "");
    const pack = await getComplianceDataExportPackage(session.shop, exportId);
    if (!pack) {
      return {
        error: "Privacy export not found for this shop.",
        success: false as const,
        breakEvenMer: null as number | null,
        marginPct: null as number | null,
        compliancePackage: null as string | null,
      };
    }
    return {
      error: null,
      success: true as const,
      breakEvenMer: null as number | null,
      marginPct: null as number | null,
      compliancePackage: pack.packageJson,
      complianceExportId: pack.id,
      complianceOrderCount: pack.orderFactCount,
    };
  }

  return {
    error: "The one target lives on Goals.",
    success: false as const,
    breakEvenMer: null as number | null,
    marginPct: null as number | null,
  };
};

export default function SettingsPage() {
  const {
    settings,
    hasLiveSpend,
    shotMode,
    useSampleDesk,
    sampleOnlyFreeze,
    complianceExports,
    billing,
    billingError,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";
  const isRevalidating =
    navigation.state === "loading" && navigation.formMethod != null;

  useEffect(() => {
    if (!actionData) return;
    if (
      actionData.success &&
      "compliancePackage" in actionData &&
      actionData.compliancePackage
    ) {
      const blob = new Blob([actionData.compliancePackage], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mcfly-level1-export-${actionData.complianceExportId ?? "package"}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showAdminToast(
        `Downloaded Level-1 package (${actionData.complianceOrderCount ?? 0} order fact(s))`,
        { duration: 4500 },
      );
      return;
    }
    if (actionData.success && actionData.breakEvenMer !== null) {
      showAdminToast(
        `Margin saved · break-even ${formatMer(actionData.breakEvenMer)}`,
        { duration: 4500 },
      );
      return;
    }
    if (actionData.error) {
      showAdminToast(actionData.error, { duration: 5000, isError: true });
    }
  }, [actionData]);

  return (
    <s-page heading={shotMode ? undefined : "Settings"} inlineSize="base">
      <div
        className={[
          "mcfly-desk",
          "mcfly-desk--chrome",
          "mcfly-settings",
          "mcfly-settings--soft",
          shotMode ? "mcfly-desk--shot" : null,
          useSampleDesk ? "mcfly-desk--sample" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <header className="mcfly-topbar mcfly-topbar--settings">
          <div>
            <p className="mcfly-topbar__def mcfly-topbar__def--solo">
              Billing and support, not reports. The one target is on Goals.
            </p>
          </div>
        </header>

        {useSampleDesk && !shotMode ? (
          <SampleDeskBanner
            note={
              sampleOnlyFreeze
                ? `Settings here are real. ${PRODUCT_NOUN.totalRoas} is Sample shop — sample mode stays on until your orders replace it.`
                : `Settings here are real. ${PRODUCT_NOUN.totalRoas} may still show Sample data.`
            }
          />
        ) : null}

        {isSaving || isRevalidating ? (
          <section
            className="mcfly-state mcfly-state--loading mcfly-state--soft"
            aria-live="polite"
            aria-label="Saving"
          >
            <p className="mcfly-state__copy">Saving target…</p>
          </section>
        ) : null}

        {actionData?.success && !isSaving ? (
          <s-banner tone="success" heading="Saved">
            <s-paragraph>
              {`Target ${PRODUCT_NOUN.totalRoas} updated.`}
              {hasLiveSpend
                ? ` Open ${PRODUCT_NOUN.totalRoas} when ready.`
                : " Next: add daily spend on Spend Upload."}
            </s-paragraph>
            <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
              {hasLiveSpend ? (
                <s-button href="/app/roas" variant="primary">
                  {PRODUCT_NOUN.openTotalRoas}
                </s-button>
              ) : (
                <s-button href="/app/spend" variant="primary">
                  {PRODUCT_NOUN.setupAddSpend}
                </s-button>
              )}
            </div>
          </s-banner>
        ) : null}

        {!shotMode ? (
          <section
            className="mcfly-panel mcfly-settings-panel--soft"
            style={{ marginTop: "1.25rem" }}
            aria-label="Support"
          >
            <h2 className="mcfly-settings-template__heading">Need help?</h2>
            <p className="mcfly-panel__muted">
              Email a human — no ticket form. Numbers here are this shop’s Shopify orders.
            </p>
            <p className="mcfly-panel__muted" style={{ marginTop: "0.5rem" }}>
              <a href="mailto:mcflyadsmmm@gmail.com">mcflyadsmmm@gmail.com</a>
              {" · "}
              <s-link href={FLY_SUPPORT_URL} target="_blank">
                Open Support
              </s-link>
            </p>
          </section>
        ) : null}

        <p className="mcfly-panel__muted">
          The one target lives on Goals. Settings does not ask for it.
        </p>

        {!shotMode ? (
          <section
            className="mcfly-panel mcfly-settings-panel--soft"
            style={{ marginTop: "1.25rem" }}
            aria-label="Your plan"
          >
            <h2 className="mcfly-settings-template__heading">Your plan</h2>
            <p className="mcfly-panel__muted">
              {billing.headline} — {billing.detail}
            </p>
            {billingError ? (
              <p
                className="mcfly-pro-upgrade__error"
                role="alert"
                style={{ marginTop: "0.75rem" }}
              >
                {billingError}
              </p>
            ) : null}
            <p className="mcfly-control__k" style={{ marginTop: "0.75rem" }}>
              7 days, then $39. Trial and paid both keep the full desk, up to
              24 months of orders. Spend stays optional. One plan.
            </p>
            <ul className="mcfly-settings-guide">
              {billing.deskBullets.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="mcfly-panel__muted" style={{ marginTop: "0.75rem" }}>
              {BILLING_HONESTY.flat} {BILLING_HONESTY.cancel} {TRIAL_VS_VIEW}
            </p>
            {!billing.entitlements.isPro ? (
              billing.enabled ? (
                <div style={{ marginTop: "0.85rem" }}>
                  <ProUpgradeButton />
                  {billing.testCharges ? (
                    <p
                      className="mcfly-panel__muted"
                      style={{ marginTop: "0.5rem" }}
                    >
                      Development store — Shopify will not charge a live card.
                    </p>
                  ) : null}
                </div>
              ) : (
                <p
                  className="mcfly-panel__muted"
                  style={{ marginTop: "0.75rem" }}
                >
                  Start 7-day trial opens when billing is on this host. One Live shop view, not a Sample plan.
                  Trial and paid keep Customers, LTV, and up to 24 months of orders.
                </p>
              )
            ) : (
              <div style={{ marginTop: "0.85rem" }}>
                <p className="mcfly-panel__muted">
                  This shop has the whole desk. Uninstall in Admin stops the
                  next 30-day cycle. The current cycle may still charge.
                </p>
                {billing.enabled ? (
                  <div style={{ marginTop: "0.65rem" }}>
                    <ProUpgradeButton mode="manage" variant="secondary" />
                  </div>
                ) : null}
              </div>
            )}
            {actionData &&
            "proMessage" in actionData &&
            actionData.proMessage ? (
              <p
                className="mcfly-panel__muted"
                style={{ marginTop: "0.5rem" }}
              >
                {String(actionData.proMessage)}
              </p>
            ) : null}
          </section>
        ) : null}

        {!shotMode ? (
          <details className="mcfly-details mcfly-settings-more mcfly-settings-more--soft">
            <summary>More — privacy</summary>
            <div className="mcfly-settings-more__body">
              <section
                className="mcfly-panel mcfly-settings-panel--soft"
                style={{ marginTop: "1rem" }}
                aria-label="Privacy data exports"
              >
                <h2 className="mcfly-settings-template__heading">
                  Privacy data exports
                </h2>
                <p className="mcfly-panel__muted">
                  When Shopify asks for a customer’s data, download the package
                  here. It includes order ids and amounts — never name, email,
                  or phone.
                </p>
                {complianceExports.length === 0 ? (
                  <p className="mcfly-panel__muted">
                    No customer data requests yet.
                  </p>
                ) : (
                  <ul className="mcfly-settings-guide">
                    {complianceExports.map((row) => (
                      <li key={row.id}>
                        Customer {row.customerNumericId} · {row.orderFactCount}{" "}
                        fact(s) · {new Date(row.createdAt).toLocaleString()}{" "}
                        <Form method="post" style={{ display: "inline" }}>
                          <input
                            type="hidden"
                            name="intent"
                            value="download_compliance_export"
                          />
                          <input type="hidden" name="exportId" value={row.id} />
                          <s-button type="submit" variant="tertiary">
                            Download JSON
                          </s-button>
                        </Form>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </details>
        ) : null}

        {!shotMode ? (
          <footer className="mcfly-settings-footer-help">
            <s-stack alignItems="center">
              <s-text>
                Stuck? Email{" "}
                <s-link href="mailto:mcflyadsmmm@gmail.com">
                  mcflyadsmmm@gmail.com
                </s-link>
                {" or "}
                <s-link href={FLY_SUPPORT_URL} target="_blank">
                  Open Support
                </s-link>
                .
              </s-text>
            </s-stack>
          </footer>
        ) : null}
      </div>
    </s-page>
  );
}

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/settings" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
