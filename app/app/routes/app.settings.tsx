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
  computeContributionMarginFromStack,
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
import { getSampleDeskEnabled, getSamplePreviewAllowed } from "../lib/sample-desk.server";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import {
  getComplianceDataExportPackage,
  listComplianceDataExportsForShop,
} from "../lib/compliance-export-retrieve.server";
import { getShopBillingSnapshot, requestProSubscription } from "../lib/billing.server";
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
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const shop = await ensureShop(session.shop);
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
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "save_margin");

  if (intent === "request_pro") {
    const returnUrl = new URL(request.url);
    returnUrl.pathname = "/app/settings";
    returnUrl.search = "";
    const result = await requestProSubscription({
      shopDomain: session.shop,
      returnUrl: returnUrl.toString(),
    });
    if (!result.ok) {
      return {
        error: result.error,
        success: false as const,
        breakEvenMer: null as number | null,
        marginPct: null as number | null,
        compliancePackage: null as string | null,
        proMessage: result.error,
      };
    }
    return {
      error: null,
      success: true as const,
      breakEvenMer: null as number | null,
      marginPct: null as number | null,
      compliancePackage: null as string | null,
      confirmationUrl: result.confirmationUrl,
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

  const parseFormPct = (
    raw: FormDataEntryValue | null,
  ): { ok: true; value: number | null } | { ok: false; error: string } => {
    const s = String(raw ?? "").trim();
    if (s === "") return { ok: true, value: null };
    const n = parseFloat(s);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      return { ok: false, error: "Cost stack percents must be between 0 and 100" };
    }
    return { ok: true, value: n / 100 };
  };

  const cogsParsed = parseFormPct(form.get("cogsPct"));
  const feesParsed = parseFormPct(form.get("paymentFeesPct"));
  const shippingParsed = parseFormPct(form.get("shippingPct"));
  if (!cogsParsed.ok) {
    return {
      error: cogsParsed.error,
      success: false as const,
      breakEvenMer: null as number | null,
      marginPct: null as number | null,
    };
  }
  if (!feesParsed.ok) {
    return {
      error: feesParsed.error,
      success: false as const,
      breakEvenMer: null as number | null,
      marginPct: null as number | null,
    };
  }
  if (!shippingParsed.ok) {
    return {
      error: shippingParsed.error,
      success: false as const,
      breakEvenMer: null as number | null,
      marginPct: null as number | null,
    };
  }

  const cogsPct = cogsParsed.value;
  const paymentFeesPct = feesParsed.value;
  const shippingPct = shippingParsed.value;
  const marginOverride =
    form.get("marginOverride") === "on" ||
    form.get("marginOverride") === "true" ||
    form.get("marginOverride") === "1";

  const hasStackInput =
    cogsPct != null || paymentFeesPct != null || shippingPct != null;
  const stackMargin =
    !marginOverride && hasStackInput
      ? computeContributionMarginFromStack({
          cogsPct: cogsPct ?? 0,
          paymentFeesPct: paymentFeesPct ?? 0,
          shippingPct: shippingPct ?? 0,
        })
      : null;

  let marginPct: number;
  if (!marginOverride && stackMargin != null) {
    marginPct = stackMargin;
  } else {
    marginPct = parseFloat(String(form.get("marginPct") ?? "0")) / 100;
  }

  const targetMer = parseFloat(String(form.get("targetMer") ?? "0"));

  if (!marginOverride && hasStackInput && stackMargin == null) {
    return {
      error:
        "Cost stack must sum to under 100% (COGS + fees + shipping). Or lock margin manually.",
      success: false as const,
      breakEvenMer: null as number | null,
      marginPct: null as number | null,
    };
  }

  if (!Number.isFinite(marginPct) || marginPct <= 0 || marginPct > 1) {
    return {
      error: "Margin must be between 0.1% and 100%",
      success: false as const,
      breakEvenMer: null as number | null,
      marginPct: null as number | null,
    };
  }
  if (!Number.isFinite(targetMer) || targetMer <= 0) {
    return {
      error: `Target ${PRODUCT_NOUN.totalRoas} must be positive`,
      success: false as const,
      breakEvenMer: null as number | null,
      marginPct: null as number | null,
    };
  }

  const breakEvenMer = calculateBreakEvenMer(marginPct);
  if (breakEvenMer === null) {
    return {
      error: `Could not compute ${PRODUCT_NOUN.breakEvenTotalRoas} from that margin`,
      success: false as const,
      breakEvenMer: null as number | null,
      marginPct: null as number | null,
    };
  }

  await prisma.settings.update({
    where: { shopId: shop.id },
    data: {
      marginPct,
      targetMer,
      cogsPct,
      paymentFeesPct,
      shippingPct,
      marginOverride,
      marginConfirmedAt: new Date(),
    },
  });

  return {
    error: null,
    success: true as const,
    breakEvenMer,
    marginPct,
  };
};

export default function SettingsPage() {
  const {
    settings,
    breakEvenMer,
    showRitualBanner,
    marginStale,
    hasLiveSpend,
    shotMode,
    useSampleDesk,
    samplePreviewAllowed,
    complianceExports,
    billing,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const location = useLocation();
  const dataModeAction = `/app/data-mode${location.search}`;
  const returnTo = `${location.pathname}${location.search}`;
  const fieldIds = useId();
  const marginFieldId = `${fieldIds}-margin`;
  const targetFieldId = `${fieldIds}-target`;
  const cogsFieldId = `${fieldIds}-cogs`;
  const feesFieldId = `${fieldIds}-fees`;
  const shippingFieldId = `${fieldIds}-shipping`;
  const overrideFieldId = `${fieldIds}-override`;
  const marginHintId = `${fieldIds}-margin-hint`;
  const targetHintId = `${fieldIds}-target-hint`;
  const stackHintId = `${fieldIds}-stack-hint`;

  const isSaving = navigation.state === "submitting";
  const isRevalidating =
    navigation.state === "loading" && navigation.formMethod != null;

  const pctDisplay = (v: number | null | undefined) =>
    v != null && Number.isFinite(v) ? (v * 100).toFixed(1) : "";

  const [marginInput, setMarginInput] = useState(
    () => (settings.marginPct * 100).toFixed(1),
  );
  const [targetInput, setTargetInput] = useState(() =>
    String(settings.targetMer),
  );
  const [cogsInput, setCogsInput] = useState(() => pctDisplay(settings.cogsPct));
  const [feesInput, setFeesInput] = useState(() =>
    pctDisplay(settings.paymentFeesPct),
  );
  const [shippingInput, setShippingInput] = useState(() =>
    pctDisplay(settings.shippingPct),
  );
  const [marginOverride, setMarginOverride] = useState(
    () => Boolean(settings.marginOverride),
  );

  useEffect(() => {
    setMarginInput((settings.marginPct * 100).toFixed(1));
    setTargetInput(String(settings.targetMer));
    setCogsInput(pctDisplay(settings.cogsPct));
    setFeesInput(pctDisplay(settings.paymentFeesPct));
    setShippingInput(pctDisplay(settings.shippingPct));
    setMarginOverride(Boolean(settings.marginOverride));
  }, [
    settings.marginPct,
    settings.targetMer,
    settings.cogsPct,
    settings.paymentFeesPct,
    settings.shippingPct,
    settings.marginOverride,
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
        `Margin confirmed · break-even locked at ${formatMer(actionData.breakEvenMer)}`,
        { duration: 4500 },
      );
      return;
    }
    if (actionData.error) {
      showAdminToast(actionData.error, { duration: 5000, isError: true });
    }
  }, [actionData]);

  const syncFormPreviewFromSaved = () => {
    setMarginInput((settings.marginPct * 100).toFixed(1));
    setTargetInput(String(settings.targetMer));
    setCogsInput(pctDisplay(settings.cogsPct));
    setFeesInput(pctDisplay(settings.paymentFeesPct));
    setShippingInput(pctDisplay(settings.shippingPct));
    setMarginOverride(Boolean(settings.marginOverride));
  };

  const handleDiscard = () => {
    syncFormPreviewFromSaved();
  };

  const parseLivePct = (raw: string): number | null => {
    const s = raw.trim();
    if (s === "") return null;
    const n = parseFloat(s);
    if (!Number.isFinite(n) || n < 0 || n > 100) return null;
    return n / 100;
  };

  const liveCogs = parseLivePct(cogsInput);
  const liveFees = parseLivePct(feesInput);
  const liveShipping = parseLivePct(shippingInput);
  const hasLiveStack =
    liveCogs != null || liveFees != null || liveShipping != null;
  const liveStackMargin =
    !marginOverride && hasLiveStack
      ? computeContributionMarginFromStack({
          cogsPct: liveCogs ?? 0,
          paymentFeesPct: liveFees ?? 0,
          shippingPct: liveShipping ?? 0,
        })
      : null;

  const marginConfirmed = settings.marginConfirmedAt != null;
  const marginDecimal = marginOverride
    ? parseFloat(marginInput) / 100
    : (liveStackMargin ??
      (Number.isFinite(parseFloat(marginInput) / 100)
        ? parseFloat(marginInput) / 100
        : NaN));
  const previewBreakEven = Number.isFinite(marginDecimal)
    ? calculateBreakEvenMer(marginDecimal)
    : null;
  const previewMatchesSaved =
    previewBreakEven !== null &&
    breakEvenMer !== null &&
    Math.abs(previewBreakEven - breakEvenMer) < 0.005 &&
    Math.abs(marginDecimal - settings.marginPct) < 0.0005 &&
    marginOverride === Boolean(settings.marginOverride);

  // Unconfirmed defaults are preview only — never claim "locked" before save.
  const lockState =
    previewBreakEven === null
      ? "empty"
      : marginConfirmed && previewMatchesSaved
        ? "locked"
        : "preview";

  const marginDisplay = Number.isFinite(marginDecimal)
    ? formatPercent(marginDecimal)
    : "—";

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
              Profit margin locks break-even (1 ÷ margin).
            </p>
          </div>
        </header>

        <div className="mcfly-ctx" aria-live="polite">
          <div className="mcfly-ctx__main">
            <span className="mcfly-ctx__brand">
              {marginConfirmed ? "Break-even locked" : "Confirm margin"}
            </span>
            <span className="mcfly-ctx__sep" aria-hidden="true">
              ·
            </span>
            <span className="mcfly-ctx__asof">
              {isSaving
                ? "Confirming margin…"
                : lockState === "locked"
                  ? "Confirmed on the scoreboard"
                  : lockState === "preview"
                    ? marginConfirmed
                      ? "Preview — save to update lock"
                      : "Preview — save to confirm & lock"
                    : "Enter margin to preview"}
            </span>
          </div>
          <div className="mcfly-ctx__chips">
            {useSampleDesk ? (
              <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">
                SAMPLE desk on
              </span>
            ) : null}
            <span
              className={`mcfly-ctx-chip ${
                lockState === "locked"
                  ? "mcfly-ctx-chip--up"
                  : "mcfly-ctx-chip--flat"
              }`}
            >
              BE{" "}
              {previewBreakEven === null ? "—.——" : formatMer(previewBreakEven)}
            </span>
            <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">
              Target {PRODUCT_NOUN.totalRoas}{" "}
              {formatMer(Number.parseFloat(targetInput) || settings.targetMer)}
            </span>
          </div>
        </div>

        {useSampleDesk && !shotMode ? (
          <SampleDeskBanner
            note={`Margin here is real. ${PRODUCT_NOUN.totalRoas} may still show SAMPLE numbers until you switch to your real store on Demo.`}
          />
        ) : null}

        {isSaving || isRevalidating ? (
          <s-banner tone="info" heading="Confirming margin">
            <s-stack direction="inline" gap="small" alignItems="center">
              <s-spinner
                size="base"
                accessibilityLabel="Saving settings"
              ></s-spinner>
              <s-paragraph>
                Confirming your margin and target — waiting on the real save,
                not sample numbers.
              </s-paragraph>
            </s-stack>
          </s-banner>
        ) : null}

        {showRitualBanner && !shotMode ? (
          <s-banner
            tone="info"
            heading="Break-even in under 10 minutes"
          >
            <s-paragraph>
              Confirm profit margin (typical DTC 25–45%) → save to lock
              break-even →{" "}
              <s-link href="/app/spend">{PRODUCT_NOUN.setupAddSpend}</s-link> →{" "}
              <s-link href="/app">{PRODUCT_NOUN.openTotalRoas}</s-link>.
            </s-paragraph>
          </s-banner>
        ) : null}

        {marginStale && !shotMode && !showRitualBanner ? (
          <s-banner tone="warning" heading="Reconfirm profit margin">
            <s-paragraph>
              Margin was last confirmed more than 90 days ago — soft warning for
              the cash close. Typical DTC profit margin is 25–45%; reconfirm
              quarterly so break-even stays trustworthy. Edit margin, then use
              the Admin save bar to refresh the lock.
            </s-paragraph>
          </s-banner>
        ) : null}

        {actionData?.success &&
        actionData.breakEvenMer !== null &&
        !isSaving ? (
          <s-banner tone="success" heading="Break-even locked — next step">
            <s-paragraph>
              Margin confirmed. At{" "}
              {formatPercent(actionData.marginPct ?? settings.marginPct)}{" "}
              margin, break-even is {formatMer(actionData.breakEvenMer)}.{" "}
              {PRODUCT_NOUN.totalRoas} must clear this line.
              {hasLiveSpend
                ? ` Spend is already in — open Total ROAS, then lock any period when you’re ready.`
                : " Next: paste daily Meta + Google spend — no ad logins."}
            </s-paragraph>
            <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
              {hasLiveSpend ? (
                <>
                  <s-button href="/app" variant="primary">
                    {PRODUCT_NOUN.openTotalRoas}
                  </s-button>
                  <s-button href="/app" variant="secondary">
                    {PRODUCT_NOUN.shareOverview}
                  </s-button>
                </>
              ) : (
                <>
                  <s-button href="/app/spend" variant="primary">
                    {PRODUCT_NOUN.setupAddSpend}
                  </s-button>
                  <s-button href="/app" variant="secondary">
                    {PRODUCT_NOUN.openTotalRoas}
                  </s-button>
                </>
              )}
            </div>
          </s-banner>
        ) : null}

        <section
          className={`mcfly-settings-lock mcfly-settings-lock--${lockState}`}
          aria-label={`${PRODUCT_NOUN.breakEvenTotalRoas} lock`}
          aria-busy={isSaving || undefined}
        >
          <p className="mcfly-settings-lock__kicker">Break-even lock</p>
          <p className="mcfly-settings-lock__label">
            {PRODUCT_NOUN.breakEvenTotalRoas}
          </p>
          <p className="mcfly-settings-lock__value">
            {previewBreakEven === null ? "—.——" : formatMer(previewBreakEven)}
          </p>
          <div className="mcfly-settings-eq" aria-label="Break-even equation">
            <span className="mcfly-settings-eq__term">
              <span className="mcfly-settings-eq__k">1</span>
            </span>
            <span className="mcfly-settings-eq__op">÷</span>
            <span className="mcfly-settings-eq__term">
              <span className="mcfly-settings-eq__k">Margin</span>
              <span className="mcfly-settings-eq__v">{marginDisplay}</span>
            </span>
            <span className="mcfly-settings-eq__op">=</span>
            <span className="mcfly-settings-eq__term mcfly-settings-eq__term--result">
              <span className="mcfly-settings-eq__k">Break-even</span>
              <span className="mcfly-settings-eq__v">
                {previewBreakEven === null
                  ? "—"
                  : formatMer(previewBreakEven)}
              </span>
            </span>
          </div>
          <p className="mcfly-settings-lock__rail">
            {lockState === "empty"
              ? "Enter a profit margin to preview the lock line"
              : lockState === "locked"
                ? `Break-even locked · need ${formatMer(previewBreakEven)}× sales per $1 spend`
                : marginConfirmed
                  ? "Preview — save to update the lock"
                  : "Preview only — save to confirm & lock break-even"}
          </p>
        </section>

        {/* Polaris Settings template: description column + form column */}
        <div className="mcfly-settings-template">
          <aside className="mcfly-settings-template__desc">
            <h2 className="mcfly-settings-template__heading">
              Confirm margin to lock break-even
            </h2>
            <p className="mcfly-settings-template__copy">
              Cost stack → contribution margin → break-even (1 ÷ margin).{" "}
              {PRODUCT_NOUN.totalRoas} must clear this line. Dirty fields open
              the Admin save bar — Discard restores. Defaults are preview only
              until you save. Typical DTC contribution margin 25–45%.
            </p>
          </aside>

          <section className="mcfly-panel mcfly-settings-form mcfly-settings-template__form">
            <div className="mcfly-panel__head">
              <h2>{PRODUCT_NOUN.totalRoas} inputs</h2>
              <p className="mcfly-panel__muted">
                Quiet form · cost stack → margin → target
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
              <fieldset
                className="mcfly-settings-fields"
                disabled={isSaving}
                aria-describedby={
                  actionData?.error ? `${fieldIds}-error` : undefined
                }
              >
                <legend className="mcfly-settings-fields__legend">
                  Cost stack, margin, and target {PRODUCT_NOUN.totalRoas}
                </legend>

                <div
                  className="mcfly-settings-stack"
                  aria-describedby={stackHintId}
                >
                  <p className="mcfly-settings-field__label">
                    Cost waterfall (% of net sales)
                  </p>
                  <div className="mcfly-settings-stack__grid">
                    <div className="mcfly-settings-field">
                      <label
                        className="mcfly-settings-field__label"
                        htmlFor={cogsFieldId}
                      >
                        COGS (%)
                      </label>
                      <input
                        id={cogsFieldId}
                        className="mcfly-field mcfly-settings-field__input"
                        name="cogsPct"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        inputMode="decimal"
                        autoComplete="off"
                        value={cogsInput}
                        onChange={(event) =>
                          setCogsInput(event.currentTarget.value)
                        }
                      />
                    </div>
                    <div className="mcfly-settings-field">
                      <label
                        className="mcfly-settings-field__label"
                        htmlFor={feesFieldId}
                      >
                        Payment fees (%)
                      </label>
                      <input
                        id={feesFieldId}
                        className="mcfly-field mcfly-settings-field__input"
                        name="paymentFeesPct"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        inputMode="decimal"
                        autoComplete="off"
                        value={feesInput}
                        onChange={(event) =>
                          setFeesInput(event.currentTarget.value)
                        }
                      />
                    </div>
                    <div className="mcfly-settings-field">
                      <label
                        className="mcfly-settings-field__label"
                        htmlFor={shippingFieldId}
                      >
                        Shipping (%)
                      </label>
                      <input
                        id={shippingFieldId}
                        className="mcfly-field mcfly-settings-field__input"
                        name="shippingPct"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        inputMode="decimal"
                        autoComplete="off"
                        value={shippingInput}
                        onChange={(event) =>
                          setShippingInput(event.currentTarget.value)
                        }
                      />
                    </div>
                  </div>
                  <p id={stackHintId} className="mcfly-settings-field__hint">
                    Contribution margin = 1 − (COGS + fees + shipping). Live
                    preview:{" "}
                    <strong>
                      {liveStackMargin != null
                        ? formatPercent(liveStackMargin)
                        : hasLiveStack
                          ? "—"
                          : formatPercent(
                              Number.isFinite(marginDecimal)
                                ? marginDecimal
                                : settings.marginPct,
                            )}
                    </strong>
                    {" · "}
                    BE{" "}
                    <strong>
                      {previewBreakEven == null
                        ? "—"
                        : formatMer(previewBreakEven)}
                    </strong>
                    . Store-level averages — not channel COGS.
                  </p>
                </div>

                <div className="mcfly-settings-field mcfly-settings-field--check">
                  <label
                    className="mcfly-settings-check"
                    htmlFor={overrideFieldId}
                  >
                    <input
                      id={overrideFieldId}
                      type="checkbox"
                      name="marginOverride"
                      value="true"
                      checked={marginOverride}
                      onChange={(event) => {
                        const next = event.currentTarget.checked;
                        setMarginOverride(next);
                        if (!next && liveStackMargin != null) {
                          setMarginInput((liveStackMargin * 100).toFixed(1));
                        }
                      }}
                    />
                    <span>Lock margin manually</span>
                  </label>
                  <span className="mcfly-settings-field__hint">
                    When off, margin follows the cost stack. When on, edit
                    contribution margin directly.
                  </span>
                </div>

                <div className="mcfly-settings-field">
                  <label
                    className="mcfly-settings-field__label"
                    htmlFor={marginFieldId}
                  >
                    Contribution margin (%)
                  </label>
                  <input
                    id={marginFieldId}
                    className="mcfly-field mcfly-settings-field__input"
                    name="marginPct"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    required
                    readOnly={!marginOverride && hasLiveStack}
                    inputMode="decimal"
                    autoComplete="off"
                    aria-describedby={marginHintId}
                    value={
                      !marginOverride && liveStackMargin != null
                        ? (liveStackMargin * 100).toFixed(1)
                        : marginInput
                    }
                    onChange={(event) =>
                      setMarginInput(event.currentTarget.value)
                    }
                  />
                  <span
                    id={marginHintId}
                    className="mcfly-settings-field__hint"
                  >
                    {marginOverride
                      ? "Manual lock — what you keep after product costs. Sets break-even above. Typical DTC 25–45%."
                      : hasLiveStack
                        ? "Computed from the cost stack. Enable “Lock margin manually” to edit directly."
                        : "What you keep after product costs. Or fill the cost stack above to compute it. Typical DTC 25–45%."}
                  </span>
                </div>

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
                    onChange={(event) =>
                      setTargetInput(event.currentTarget.value)
                    }
                  />
                  <span
                    id={targetHintId}
                    className="mcfly-settings-field__hint"
                  >
                    Operating goal above break-even (e.g. 4.0 = $4 sales per $1
                    ad spend). Same field as Goals — one source of truth.
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

                <div className="mcfly-settings-form__actions">
                  {!shotMode ? (
                    <s-link href="/app">{PRODUCT_NOUN.openTotalRoas}</s-link>
                  ) : null}
                </div>
              </fieldset>
            </Form>
            {!shotMode ? (
              <div className="mcfly-settings-more" aria-label="More tools">
                <p className="mcfly-settings-template__heading">More tools</p>
                <p className="mcfly-settings-aside-link">
                  <s-link href="/app">{PRODUCT_NOUN.shareOverview}</s-link>
                  <span className="mcfly-panel__muted">
                    {" "}
                    — finance export for any period
                  </span>
                </p>
                <p className="mcfly-settings-aside-link">
                  <s-link href="/app/allocation">Allocation</s-link>
                  <span className="mcfly-panel__muted">
                    {" "}
                    — cut / protect / shift vs break-even
                  </span>
                </p>
                <p className="mcfly-settings-aside-link">
                  <s-link href="/app/ltv">{PRODUCT_NOUN.ltvTitle}</s-link>
                  <span className="mcfly-panel__muted">
                    {" "}
                    — cohort LTV (Pro)
                  </span>
                </p>
                <p className="mcfly-settings-aside-link">
                  <s-link href="/app/connections">Connections</s-link>
                  <span className="mcfly-panel__muted">
                    {" "}
                    — optional Meta / Google OAuth (CSV-first on Spend)
                  </span>
                </p>
                <p className="mcfly-settings-aside-link">
                  <s-link href="/app/settings">Sample vs real</s-link>
                  <span className="mcfly-panel__muted">
                    {" "}
                    — use the top Sample | Real switch, or hide Sample here
                  </span>
                </p>
              </div>
            ) : null}
          </section>
        </div>

        {!shotMode ? (
          <section
            className="mcfly-panel"
            style={{ marginTop: "1rem" }}
            aria-label="Sample vs real store"
          >
            <h2 className="mcfly-settings-template__heading">
              Sample vs real store
            </h2>
            <p className="mcfly-panel__muted">
              The Sample | Real store switch sits at the top of every page. When
              you are done practicing, turn Sample off here so the desk only
              shows your live Shopify numbers.
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
        ) : null}

        {!shotMode ? (
          <section
            className="mcfly-panel"
            style={{ marginTop: "1rem" }}
            aria-label="Plan and billing"
          >
            <h2 className="mcfly-settings-template__heading">
              {billing.headline}
            </h2>
            <p className="mcfly-panel__muted">{billing.detail}</p>
            <div className="mcfly-control__grid" style={{ marginTop: "0.75rem" }}>
              <div className="mcfly-control__tile">
                <p className="mcfly-control__k">Free</p>
                <ul className="mcfly-settings-guide">
                  {billing.freeBullets.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
              <div className="mcfly-control__tile">
                <p className="mcfly-control__k">
                  {billing.planName} · ${billing.amount}/{billing.currencyCode}
                </p>
                <ul className="mcfly-settings-guide">
                  {billing.proBullets.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
            {!billing.entitlements.isPro ? (
              <Form method="post" style={{ marginTop: "0.85rem" }}>
                <input type="hidden" name="intent" value="request_pro" />
                <s-button type="submit" variant="primary">
                  {billing.upgradeCta}
                </s-button>
              </Form>
            ) : (
              <p className="mcfly-panel__muted" style={{ marginTop: "0.75rem" }}>
                This shop has Pro entitlements.
              </p>
            )}
            {actionData &&
            "proMessage" in actionData &&
            actionData.proMessage ? (
              <p className="mcfly-panel__muted" style={{ marginTop: "0.5rem" }}>
                {String(actionData.proMessage)}
              </p>
            ) : null}
            <p className="mcfly-panel__muted" style={{ marginTop: "0.65rem" }}>
              Flat desk fee — never a GMV tax. App Store listing stays Free until
              Pro Billing is announced. Design partners:{" "}
              <code>MCFLY_PRO_SHOPS</code>.
            </p>
          </section>
        ) : null}

        {!shotMode ? (
          <section
            className="mcfly-panel"
            style={{ marginTop: "1rem" }}
            aria-label="Privacy data exports"
          >
            <h2 className="mcfly-settings-template__heading">
              Privacy data exports
            </h2>
            <p className="mcfly-panel__muted">
              When Shopify sends a customer data request, Mcfly stores an order
              package (order ids, amounts, dates, and a hashed customer key —
              never name, email, or phone). Download packages here to fulfill the
              request. Auto-purged after 60 days; erased earlier on customer/shop
              redact and uninstall.
            </p>
            {complianceExports.length === 0 ? (
              <p className="mcfly-panel__muted">No data_request packages yet.</p>
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
