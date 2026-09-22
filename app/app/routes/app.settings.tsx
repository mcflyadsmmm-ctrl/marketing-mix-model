import { useEffect, useId } from "react";
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
import { parseSalesBasis } from "../lib/sales-basis";
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
import { parseHabitGoalInput } from "../lib/goals-habit";
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

  if (intent === "save_habit_goals") {
    const returningSalesTarget = parseHabitGoalInput(
      form.get("returningSalesTarget"),
    );
    if (Number.isNaN(returningSalesTarget)) {
      return {
        error: "Enter a non-negative returning-$ target — or leave blank to unset",
        success: false as const,
        breakEvenMer: null as number | null,
        marginPct: null as number | null,
        intent: "save_habit_goals" as const,
      };
    }
    await prisma.settings.update({
      where: { shopId: shop.id },
      data: { ltvTarget: null, returningSalesTarget },
    });
    return {
      error: null,
      success: true as const,
      breakEvenMer: null as number | null,
      marginPct: null as number | null,
      intent: "save_habit_goals" as const,
      returningSalesTarget,
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
  const fieldIds = useId();
  const targetFieldId = `${fieldIds}-target`;
  const targetHintId = `${fieldIds}-target-hint`;

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
    if (
      actionData.success &&
      "intent" in actionData &&
      actionData.intent === "save_habit_goals"
    ) {
      showAdminToast("Returning-$ target saved", { duration: 4000 });
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
              This page is your target {PRODUCT_NOUN.totalRoas} and billing —
              not reports.
            </p>
          </div>
        </header>

        {useSampleDesk && !shotMode ? (
          <SampleDeskBanner
            note={
              sampleOnlyFreeze
                ? `Settings here are real. ${PRODUCT_NOUN.totalRoas} is Snowdevil SAMPLE — Live is parked until launch.`
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

        <div className="mcfly-settings-template mcfly-settings-template--soft">
          <aside className="mcfly-settings-template__desc">
            <h2 className="mcfly-settings-template__heading">
              Set your Total ROAS target
            </h2>
            <p className="mcfly-settings-template__copy">
              {PRODUCT_NOUN.definition}. Target is the operating goal (e.g. 4.0 =
              $4 sales per $1 spend).
            </p>
          </aside>

          <section className="mcfly-panel mcfly-settings-form mcfly-settings-template__form mcfly-settings-panel--soft">
            <div className="mcfly-panel__head">
              <h2>Desk targets</h2>
              <p className="mcfly-panel__muted">
                Target {PRODUCT_NOUN.totalRoas}
              </p>
            </div>
            <Form
              method="post"
              key={String(settings.updatedAt)}
              data-save-bar
              data-discard-confirmation
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
                  Target {PRODUCT_NOUN.totalRoas}
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

        <div className="mcfly-settings-template mcfly-settings-template--soft">
          <aside className="mcfly-settings-template__desc">
            <h2 className="mcfly-settings-template__heading">
              Order-history targets
            </h2>
            <p className="mcfly-settings-template__copy">
              Year returning $ — tracked from order history on{" "}
              <s-link href="/app/goals">Goals</s-link>. LTV Target Line is
              the observed average there and on LTV — no typing. No spend,
              CPA, or ROAS. Leave blank to unset returning $.
            </p>
          </aside>

          <section
            className="mcfly-panel mcfly-settings-form mcfly-settings-template__form mcfly-settings-panel--soft"
            aria-label="Order-history targets"
          >
            <div className="mcfly-panel__head">
              <h2>Order-history targets</h2>
              <p className="mcfly-panel__muted">Optional · zero spend</p>
            </div>
            <Form method="post">
              <input type="hidden" name="intent" value="save_habit_goals" />
              <fieldset className="mcfly-settings-fields" disabled={isSaving}>
                <legend className="mcfly-settings-fields__legend">
                  Year returning-$ target
                </legend>
                <div className="mcfly-settings-field">
                  <label
                    className="mcfly-settings-field__label"
                    htmlFor={`${fieldIds}-returning-target`}
                  >
                    Year returning-$ target
                  </label>
                  <input
                    id={`${fieldIds}-returning-target`}
                    className="mcfly-field mcfly-settings-field__input"
                    name="returningSalesTarget"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    defaultValue={
                      settings.returningSalesTarget != null &&
                      settings.returningSalesTarget > 0
                        ? String(Math.round(settings.returningSalesTarget))
                        : ""
                    }
                    placeholder="e.g. 800000"
                  />
                  <span className="mcfly-settings-field__hint">
                    Returning-buyer dollars in the Goals year. Guests stay
                    out. Same field as Goals. LTV Target Line is the
                    observed average — not set here. SAMPLE with no typed
                    target stays unset, like Live.
                  </span>
                </div>
                <button
                  type="submit"
                  className="mcfly-btn mcfly-btn--primary"
                  disabled={isSaving || undefined}
                >
                  Save returning-$ target
                </button>
              </fieldset>
            </Form>
          </section>
        </div>

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
              $39 per store / month after a 7-day full-access trial
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
                  Start 7-day trial opens when billing is on this host. The
                  whole desk is included — one Live shop view, not a Sample
                  plan.
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
