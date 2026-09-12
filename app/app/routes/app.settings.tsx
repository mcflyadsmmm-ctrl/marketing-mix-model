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
import { isActivationQuery, spendSkipHref } from "../lib/install-stickiness";
import { parseSalesBasis } from "../lib/sales-basis";
import {
  parseTargetMerInput,
  targetMerFieldValue,
  targetMerSavedCopy,
  TARGET_MER_CLEARED_COPY,
} from "../lib/target-mer";
import { getSampleDeskEnabled, getSamplePreviewAllowed } from "../lib/sample-desk.server";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { listingCaptureFromRequest } from "../lib/listing-capture";
import { DeepHistoryBanner } from "../components/DeepHistoryBanner";
import {
  CASH_NOT_ATTRIBUTION,
  resolveDeepHistoryHonesty,
  scopesIncludeReadAllOrders,
} from "../lib/deep-history-honesty";
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
import { enqueueSalesFactsBackfill } from "../lib/sales-backfill-kick.server";
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
  const shotMode = listingCaptureFromRequest(request);
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
  if (!useSampleDesk && !shotMode) {
    void enqueueSalesFactsBackfill({
      shopId: shop.id,
      grantedScopes: session.scope,
      reason: "settings_open",
    }).catch(() => {
      // Overview / auth / tick still own the fill path
    });
  }
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
    hasReadAllOrders: scopesIncludeReadAllOrders(session.scope),
    shopDomain: session.shop,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "save_margin");

  // Start $39 plan lives on /app/billing (top-frame confirmation). Keep Settings clean.

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

  // Blank target is valid and means "clear the goal rail" — never a 0 sentinel.
  const target = parseTargetMerInput(form.get("targetMer"));
  if (!target.ok) {
    return {
      error: target.error,
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
    salesBasis: ReturnType<typeof parseSalesBasis>;
    targetMer?: number;
    targetMerConfirmedAt?: Date | null;
    marginPct?: number;
    marginOverride?: boolean;
    marginConfirmedAt?: Date;
  } = {
    salesBasis,
  };

  if (target.operation === "set") {
    updateData.targetMer = target.targetMer;
    updateData.targetMerConfirmedAt = new Date();
  } else {
    // Clear drops only the confirmation. The last number stays for allocation /
    // pacing / Goals internals, and margin is never touched here.
    updateData.targetMerConfirmedAt = null;
  }

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
    targetMer: target.operation === "set" ? target.targetMer : null,
    targetCleared: target.operation === "clear",
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
    hasReadAllOrders,
    shopDomain,
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

  // Only the target/margin save owns the success banner — a privacy download
  // must not read as "targets saved".
  const targetSave =
    actionData?.success && "targetCleared" in actionData ? actionData : null;

  const marginConfirmed = settings.marginConfirmedAt != null;
  const [marginInput, setMarginInput] = useState(() =>
    marginConfirmed ? (settings.marginPct * 100).toFixed(1) : "",
  );
  // Unconfirmed target loads blank — the non-null default is not a merchant goal.
  const targetFieldValue = targetMerFieldValue(settings);
  const [targetInput, setTargetInput] = useState(targetFieldValue);

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
    setTargetInput(targetFieldValue);
  }, [targetFieldValue, settings.updatedAt]);

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
    if (actionData.success && "targetCleared" in actionData) {
      // Target and break-even are different numbers — never one merged claim.
      const targetLine = actionData.targetCleared
        ? TARGET_MER_CLEARED_COPY
        : targetMerSavedCopy(Number(actionData.targetMer));
      showAdminToast(
        actionData.breakEvenMer != null
          ? `${targetLine} Margin saved · break-even ${formatMer(actionData.breakEvenMer)}`
          : targetLine,
        { duration: 4500 },
      );
      return;
    }
    if (actionData.error) {
      showAdminToast(actionData.error, { duration: 5000, isError: true });
    }
  }, [actionData]);

  // Discard/reset restores the loader state for both fields.
  const handleDiscard = () => {
    setMarginInput(
      settings.marginConfirmedAt != null
        ? (settings.marginPct * 100).toFixed(1)
        : "",
    );
    setTargetInput(targetFieldValue);
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
          shotMode ? "mcfly-desk--shot mcfly-desk--listing" : null,
          useSampleDesk ? "mcfly-desk--sample" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <header className="mcfly-topbar mcfly-topbar--settings">
          <div>
            <p className="mcfly-topbar__def mcfly-topbar__def--solo">
              {isActivationQuery(location.search) && !shotMode
                ? `${CASH_NOT_ATTRIBUTION} Margin is optional for break-even. Paste spend first for Total ROAS — or save margin here, then go to Spend.`
                : `${CASH_NOT_ATTRIBUTION} Set an optional target. Profit margin unlocks break-even — Total ROAS is sales ÷ spend either way.`}
            </p>
          </div>
        </header>

        {!shotMode && !useSampleDesk && hasLiveSpend ? (
          <DeepHistoryBanner
            kind={
              resolveDeepHistoryHonesty({
                hasReadAllOrders,
                useSampleDesk,
                shotMode,
              }).kind
            }
            shopDomain={shopDomain}
          />
        ) : null}

        {isActivationQuery(location.search) && !shotMode ? (
          <s-banner tone="info" heading="Optional — break-even margin">
            <s-paragraph>
              Profit margin unlocks break-even only. Total ROAS does not wait —
              type one day of spend first, then come back if you want break-even
              locked.
            </s-paragraph>
            <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
              <s-link href={spendSkipHref(location.search)}>
                Go to Spend — type one day
              </s-link>
            </div>
          </s-banner>
        ) : null}

        {useSampleDesk && !shotMode ? (
          <SampleDeskBanner
            note={`Settings here are real. ${PRODUCT_NOUN.totalRoas} may still show SAMPLE numbers until you switch to your real store.`}
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

        {false && marginStale && !shotMode ? (
          <s-banner tone="warning" heading="Reconfirm profit margin">
            <s-paragraph>
              Margin was last confirmed more than 90 days ago. Typical DTC
              profit margin is 25–45% — reconfirm when COGS or AOV shifts.
            </s-paragraph>
          </s-banner>
        ) : null}

        {targetSave && !isSaving ? (
          <s-banner tone="success" heading="Saved">
            <s-paragraph>
              {targetSave.targetCleared
                ? TARGET_MER_CLEARED_COPY
                : targetMerSavedCopy(Number(targetSave.targetMer))}
              {targetSave.breakEvenMer != null
                ? ` Separately, at ${formatPercent(targetSave.marginPct ?? settings.marginPct)} margin your ${PRODUCT_NOUN.breakEvenTotalRoas} is ${formatMer(targetSave.breakEvenMer)} — the floor, not your target.`
                : " Profit margin stays optional — add it anytime for break-even."}
              {hasLiveSpend
                ? ` Open ${PRODUCT_NOUN.totalRoas} when ready.`
                : " Next: paste daily spend on Spend."}
            </s-paragraph>
            <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
              {hasLiveSpend ? (
                <s-button href="/app/sales" variant="primary">
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
              {PRODUCT_NOUN.definition}. Target is an optional operating goal
              (e.g. 4.0 = $4 sales per $1 spend) — leave it blank and Overview
              shows actual only. Profit margin is optional too — use average
              contribution margin from AOV and cost of goods when you want
              break-even on the desk.
            </p>
          </aside>

          <section className="mcfly-panel mcfly-settings-form mcfly-settings-template__form">
            <div className="mcfly-panel__head">
              <h2>Desk targets</h2>
              <p className="mcfly-panel__muted">
                Target optional · margin optional
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
                  Optional target {PRODUCT_NOUN.totalRoas}
                </legend>

                <div className="mcfly-settings-field">
                  <label
                    className="mcfly-settings-field__label"
                    htmlFor={targetFieldId}
                  >
                    Target {PRODUCT_NOUN.totalRoas}{" "}
                    <span className="mcfly-settings-field__optional">
                      (optional)
                    </span>
                  </label>
                  <input
                    id={targetFieldId}
                    className="mcfly-field mcfly-settings-field__input"
                    name="targetMer"
                    type="number"
                    step="0.1"
                    min="0.1"
                    inputMode="decimal"
                    autoComplete="off"
                    aria-describedby={targetHintId}
                    placeholder="e.g. 4.0"
                    value={targetInput}
                    onChange={(event) =>
                      setTargetInput(event.currentTarget.value)
                    }
                  />
                  <span id={targetHintId} className="mcfly-settings-field__hint">
                    Your operating goal — for example, 4.0 means $4 in Shopify
                    Total Sales per $1 of ad spend. Leave blank to show actual
                    only.
                  </span>
                </div>

                <p className="mcfly-panel__muted">
                  Margin / break-even controls are coming back in a later
                  release — Total ROAS target above still saves normally.
                </p>

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
          <details className="mcfly-details mcfly-settings-more">
            <summary>More — sample desk, billing, privacy</summary>
            <div className="mcfly-settings-more__body">
              <section
                className="mcfly-panel"
                style={{ marginTop: "0.75rem" }}
                aria-label="Practice desk (SAMPLE)"
              >
                <h2 className="mcfly-settings-template__heading">
                  Practice desk (SAMPLE)
                </h2>
                <p className="mcfly-panel__muted">
                  SAMPLE is preview data only — not a feature unlock. Practice
                  from Demo or here; the live desk does not show a Sample | Real
                  toggle. When you are done practicing, hide Sample so the desk
                  only shows your live Shopify numbers.
                </p>
                <p className="mcfly-panel__muted" style={{ marginTop: "0.5rem" }}>
                  Right now:{" "}
                  <strong>
                    {useSampleDesk ? "Sample preview" : "Real store"}
                  </strong>
                  {samplePreviewAllowed
                    ? " · Sample option is available"
                    : " · Sample option is hidden"}
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
                        Real store only — hide Sample
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
                        Show Sample option again
                      </s-button>
                    </Form>
                  )}
                  {samplePreviewAllowed && !useSampleDesk ? (
                    <Form method="post" action={dataModeAction}>
                      <input type="hidden" name="intent" value="use-sample" />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <s-button type="submit" variant="tertiary">
                        Switch to Sample now
                      </s-button>
                    </Form>
                  ) : null}
                  {samplePreviewAllowed && useSampleDesk ? (
                    <Form method="post" action={dataModeAction}>
                      <input type="hidden" name="intent" value="use-real" />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <s-button type="submit" variant="tertiary">
                        Switch to Real store now
                      </s-button>
                    </Form>
                  ) : null}
                </div>
              </section>

              <section
                className="mcfly-panel"
                style={{ marginTop: "1rem" }}
                aria-label="Plan and billing"
              >
                <h2 className="mcfly-settings-template__heading">
                  {billing.headline}
                </h2>
                <p className="mcfly-panel__muted">{billing.detail}</p>
                <div
                  className="mcfly-control__grid"
                  style={{ marginTop: "0.75rem" }}
                >
                  <div className="mcfly-control__tile">
                    <p className="mcfly-control__k">
                      7-day trial · then ${billing.amount}/
                      {billing.currencyCode} · mo
                    </p>
                    <ul className="mcfly-settings-guide">
                      {billing.proBullets.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                {!billing.entitlements.isPro ? (
                  billing.enabled ? (
                    <div style={{ marginTop: "0.85rem" }}>
                      <ProUpgradeButton />
                      {billing.testCharges ? (
                        <p
                          className="mcfly-panel__muted"
                          style={{ marginTop: "0.5rem" }}
                        >
                          Test charge mode — Shopify will not invoice real money
                          until production billing is confirmed.
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p
                      className="mcfly-panel__muted"
                      style={{ marginTop: "0.75rem" }}
                    >
                      One desk during trial and at $39/mo: TikTok CSV, LTV, and
                      Goals are included. SAMPLE is preview data only.
                    </p>
                  )
                ) : (
                  <p
                    className="mcfly-panel__muted"
                    style={{ marginTop: "0.75rem" }}
                  >
                    This shop is on the $39 desk.
                  </p>
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

              <section
                className="mcfly-panel"
                style={{ marginTop: "1rem" }}
                aria-label="Privacy data exports"
              >
                <h2 className="mcfly-settings-template__heading">
                  Privacy data exports
                </h2>
                <p className="mcfly-panel__muted">
                  When Shopify sends a customer data request, Mcfly stores an
                  order package (order ids, amounts, dates, and a hashed
                  customer key — never name, email, or phone). Download packages
                  here to fulfill the request.
                </p>
                {complianceExports.length === 0 ? (
                  <p className="mcfly-panel__muted">
                    No data_request packages yet.
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
                <s-link href="https://mcflyads.com/support" target="_blank">
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
