import { useEffect, useId, useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigation,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  calculateBreakEvenMer,
} from "@mcfly/mer-core";
import { authenticate } from "../shopify.server";
import {
  ensureShop,
  getOrCreateSettings,
  marginIsConfirmed,
  marginIsStale,
} from "../lib/mer-dashboard.server";
import { formatMer, formatPercent } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { parseSalesBasis } from "../lib/sales-basis";
import { getSampleDeskEnabled, getSamplePreviewAllowed } from "../lib/sample-desk.server";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
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
  const { admin, session } = await authenticate.admin(request);
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
  const samplePreviewAllowed = await getSamplePreviewAllowed(shop.id);
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
    samplePreviewAllowed,
    complianceExports,
    billing,
    billingError: billingError?.trim() || null,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "save_margin");

  // Pro upgrade lives on /app/billing (top-frame confirmation). Keep Settings clean.

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

  const targetMer = parseFloat(String(form.get("targetMer") ?? "0"));
  if (!Number.isFinite(targetMer) || targetMer <= 0) {
    return {
      error: `Target ${PRODUCT_NOUN.totalRoas} must be positive`,
      success: false as const,
      breakEvenMer: null as number | null,
      marginPct: null as number | null,
    };
  }

  const marginRaw = String(form.get("marginPct") ?? "").trim();
  const salesBasisRaw = form.get("salesBasis");
  // Desk religion: Shopify Total Sales only.
  const salesBasis =
    salesBasisRaw != null && String(salesBasisRaw).trim() !== ""
      ? parseSalesBasis(salesBasisRaw, "total")
      : "total";

  const updateData: {
    targetMer: number;
    salesBasis: ReturnType<typeof parseSalesBasis>;
    marginPct?: number;
    marginOverride?: boolean;
    marginConfirmedAt?: Date;
  } = {
    targetMer,
    salesBasis,
  };

  let breakEvenMer: number | null = null;
  let marginPct: number | null = null;

  if (marginRaw !== "") {
    marginPct = parseFloat(marginRaw) / 100;
    if (!Number.isFinite(marginPct) || marginPct <= 0 || marginPct > 1) {
      return {
        error: "Profit margin must be between 0.1% and 100% (or leave blank)",
        success: false as const,
        breakEvenMer: null as number | null,
        marginPct: null as number | null,
      };
    }
    breakEvenMer = calculateBreakEvenMer(marginPct);
    if (breakEvenMer === null) {
      return {
        error: `Could not compute ${PRODUCT_NOUN.breakEvenTotalRoas} from that margin`,
        success: false as const,
        breakEvenMer: null as number | null,
        marginPct: null as number | null,
      };
    }
    updateData.marginPct = marginPct;
    updateData.marginOverride = true;
    updateData.marginConfirmedAt = new Date();
  }

  await prisma.settings.update({
    where: { shopId: shop.id },
    data: updateData,
  });

  return {
    error: null,
    success: true as const,
    breakEvenMer,
    marginPct,
    targetMer,
  };
};

export default function SettingsPage() {
  const {
    settings,
    breakEvenMer,
    marginStale,
    hasLiveSpend,
    shotMode,
    useSampleDesk,
    samplePreviewAllowed,
    complianceExports,
    billing,
    billingError,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const location = useLocation();
  const dataModeAction = `/app/data-mode${location.search}`;
  const returnTo = `${location.pathname}${location.search}`;
  const fieldIds = useId();
  const marginFieldId = `${fieldIds}-margin`;
  const targetFieldId = `${fieldIds}-target`;
  const marginHintId = `${fieldIds}-margin-hint`;
  const targetHintId = `${fieldIds}-target-hint`;

  const isSaving = navigation.state === "submitting";
  const isRevalidating =
    navigation.state === "loading" && navigation.formMethod != null;

  const marginConfirmed = settings.marginConfirmedAt != null;
  const [marginInput, setMarginInput] = useState(() =>
    marginConfirmed ? (settings.marginPct * 100).toFixed(1) : "",
  );

  useEffect(() => {
    setMarginInput(
      settings.marginConfirmedAt != null
        ? (settings.marginPct * 100).toFixed(1)
        : "",
    );
  }, [
    settings.marginPct,
    settings.marginConfirmedAt,
    settings.updatedAt,
  ]);

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
    if (actionData.success && "targetMer" in actionData) {
      showAdminToast(
        `Target ${PRODUCT_NOUN.totalRoas} saved · ${formatMer(Number(actionData.targetMer))}`,
        { duration: 4000 },
      );
      return;
    }
    if (actionData.error) {
      showAdminToast(actionData.error, { duration: 5000, isError: true });
    }
  }, [actionData]);

  const handleDiscard = () => {
    setMarginInput(
      settings.marginConfirmedAt != null
        ? (settings.marginPct * 100).toFixed(1)
        : "",
    );
  };

  const marginDecimal = parseFloat(marginInput) / 100;
  const previewBreakEven =
    marginInput.trim() !== "" && Number.isFinite(marginDecimal)
      ? calculateBreakEvenMer(marginDecimal)
      : marginConfirmed
        ? breakEvenMer
        : null;

  return (
    <s-page heading={shotMode ? undefined : "Settings"} inlineSize="base">
      <div
        className={[
          "mcfly-desk",
          "mcfly-desk--chrome",
          shotMode ? "mcfly-desk--shot" : null,
          useSampleDesk ? "mcfly-desk--sample" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <header className="mcfly-topbar mcfly-topbar--settings">
          <div>
            <p className="mcfly-topbar__def mcfly-topbar__def--solo">
              {PRODUCT_NOUN.definition}. Set your target. Profit margin is
              optional — only if you want break-even.
            </p>
          </div>
        </header>

        {useSampleDesk && !shotMode ? (
          <SampleDeskBanner
            note={`Settings here are real. ${PRODUCT_NOUN.totalRoas} may still show Sample data until you switch to Live data.`}
          />
        ) : null}

        {isSaving || isRevalidating ? (
          <s-banner tone="info" heading="Saving">
            <s-stack direction="inline" gap="small" alignItems="center">
              <s-spinner
                size="base"
                accessibilityLabel="Saving settings"
              ></s-spinner>
              <s-paragraph>Saving target and optional margin…</s-paragraph>
            </s-stack>
          </s-banner>
        ) : null}

        {marginStale && !shotMode ? (
          <s-banner tone="warning" heading="Reconfirm profit margin">
            <s-paragraph>
              Margin was last confirmed more than 90 days ago. Typical DTC
              profit margin is 25–45% — reconfirm when COGS or AOV shifts.
            </s-paragraph>
          </s-banner>
        ) : null}

        {actionData?.success && !isSaving ? (
          <s-banner tone="success" heading="Saved">
            <s-paragraph>
              {actionData.breakEvenMer != null
                ? `Target updated. At ${formatPercent(actionData.marginPct ?? settings.marginPct)} margin, break-even is ${formatMer(actionData.breakEvenMer)}.`
                : `Target ${PRODUCT_NOUN.totalRoas} updated. Profit margin stays optional — add it anytime for break-even.`}
              {hasLiveSpend
                ? ` Open ${PRODUCT_NOUN.totalRoas} when ready.`
                : " Next: paste daily spend on Spend."}
            </s-paragraph>
            <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
              {hasLiveSpend ? (
                <s-button href="/app" variant="primary">
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

        <div className="mcfly-settings-template">
          <aside className="mcfly-settings-template__desc">
            <h2 className="mcfly-settings-template__heading">
              Set your Total ROAS target
            </h2>
            <p className="mcfly-settings-template__copy">
              {PRODUCT_NOUN.definition}. Target is the operating goal (e.g. 4.0 =
              $4 sales per $1 spend). Profit margin is optional — use average
              contribution margin from AOV and cost of goods when you want
              break-even on the desk.
            </p>
          </aside>

          <section className="mcfly-panel mcfly-settings-form mcfly-settings-template__form">
            <div className="mcfly-panel__head">
              <h2>Desk targets</h2>
              <p className="mcfly-panel__muted">
                Target required · margin optional
              </p>
            </div>
            <Form
              method="post"
              key={String(settings.updatedAt)}
              data-save-bar
              data-discard-confirmation
              onReset={handleDiscard}
              aria-busy={isSaving || undefined}
            >
              <input type="hidden" name="salesBasis" value="total" />
              <fieldset
                className="mcfly-settings-fields"
                disabled={isSaving}
                aria-describedby={
                  actionData?.error ? `${fieldIds}-error` : undefined
                }
              >
                <legend className="mcfly-settings-fields__legend">
                  Target {PRODUCT_NOUN.totalRoas} and optional margin
                </legend>

                <div className="mcfly-settings-field">
                  <label
                    className="mcfly-settings-field__label"
                    htmlFor={targetFieldId}
                  >
                    Target {PRODUCT_NOUN.totalRoas}
                  </label>
                  <input
                    id={targetFieldId}
                    className="mcfly-field mcfly-settings-field__input"
                    name="targetMer"
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    inputMode="decimal"
                    autoComplete="off"
                    aria-describedby={targetHintId}
                    defaultValue={settings.targetMer}
                  />
                  <span id={targetHintId} className="mcfly-settings-field__hint">
                    Operating goal — e.g. 4.0 means $4 Shopify Total Sales per
                    $1 ad spend. Same field as Goals.
                  </span>
                </div>

                <div className="mcfly-settings-field">
                  <label
                    className="mcfly-settings-field__label"
                    htmlFor={marginFieldId}
                  >
                    Profit margin average{" "}
                    <span className="mcfly-settings-field__optional">
                      (optional)
                    </span>
                  </label>
                  <input
                    id={marginFieldId}
                    className="mcfly-field mcfly-settings-field__input"
                    name="marginPct"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    inputMode="decimal"
                    autoComplete="off"
                    aria-describedby={marginHintId}
                    placeholder="e.g. 35"
                    value={marginInput}
                    onChange={(event) =>
                      setMarginInput(event.currentTarget.value)
                    }
                  />
                  <span id={marginHintId} className="mcfly-settings-field__hint">
                    Completely optional. Contribution margin after product cost
                    — roughly (AOV − average COGS) ÷ AOV. Typical DTC 25–45%.
                    Leave blank to skip break-even.
                    {previewBreakEven != null
                      ? ` Break-even preview: ${formatMer(previewBreakEven)}.`
                      : ""}
                  </span>
                </div>

                {actionData?.error ? (
                  <p
                    id={`${fieldIds}-error`}
                    className="mcfly-settings-error"
                    role="alert"
                  >
                    {actionData.error}
                  </p>
                ) : null}
              </fieldset>
            </Form>
          </section>
        </div>

        {!shotMode ? (
          <section
            className="mcfly-panel"
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
              ${billing.amount}/{billing.currencyCode} per store / month after a
              7-day full-access trial
            </p>
            <ul className="mcfly-settings-guide">
              {billing.proBullets.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="mcfly-panel__muted" style={{ marginTop: "0.75rem" }}>
              {BILLING_HONESTY.flat} {BILLING_HONESTY.cancel}
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
                  Start 7-day trial opens when billing is on this host. The
                  whole desk is included — Sample data | Live data is the view,
                  not a plan.
                </p>
              )
            ) : (
              <div style={{ marginTop: "0.85rem" }}>
                <p className="mcfly-panel__muted">
                  This shop has the whole desk. Uninstall in Admin stops the
                  next 30-day cycle.
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
          <details className="mcfly-details mcfly-settings-more">
            <summary>More — Sample data and privacy</summary>
            <div className="mcfly-settings-more__body">
              <section
                className="mcfly-panel"
                style={{ marginTop: "0.75rem" }}
                aria-label="Sample data"
              >
                <h2 className="mcfly-settings-template__heading">
                  Sample data
                </h2>
                <p className="mcfly-panel__muted">
                  Sample data | Live data sits at the top of every page.
                  Sample data is example numbers so you can click around. Live
                  data is this shop’s Shopify sales and the spend you add.
                </p>
                <p className="mcfly-panel__muted" style={{ marginTop: "0.5rem" }}>
                  Right now:{" "}
                  <strong>
                    {useSampleDesk
                      ? PRODUCT_NOUN.sampleData
                      : PRODUCT_NOUN.liveData}
                  </strong>
                  {samplePreviewAllowed
                    ? " · Sample data option is available"
                    : " · Sample data option is hidden"}
                </p>
                <div
                  className="mcfly-decision__actions"
                  style={{ marginTop: "0.85rem" }}
                >
                  {samplePreviewAllowed ? (
                    <Form method="post" action={dataModeAction}>
                      <input
                        type="hidden"
                        name="intent"
                        value="hide-sample-preview"
                      />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <s-button type="submit" variant="primary">
                        Live data only — hide Sample data
                      </s-button>
                    </Form>
                  ) : (
                    <Form method="post" action={dataModeAction}>
                      <input
                        type="hidden"
                        name="intent"
                        value="allow-sample-preview"
                      />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <s-button type="submit" variant="secondary">
                        Show Sample data option again
                      </s-button>
                    </Form>
                  )}
                  {samplePreviewAllowed && !useSampleDesk ? (
                    <Form method="post" action={dataModeAction}>
                      <input type="hidden" name="intent" value="use-sample" />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <s-button type="submit" variant="tertiary">
                        Switch to Sample data now
                      </s-button>
                    </Form>
                  ) : null}
                  {samplePreviewAllowed && useSampleDesk ? (
                    <Form method="post" action={dataModeAction}>
                      <input type="hidden" name="intent" value="use-real" />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <s-button type="submit" variant="tertiary">
                        Switch to Live data now
                      </s-button>
                    </Form>
                  ) : null}
                </div>
              </section>

              <section
                className="mcfly-panel"
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
                Learn more about{" "}
                <s-link href={FLY_SUPPORT_URL} target="_blank">
                  {PRODUCT_NOUN.totalRoas} support
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

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
