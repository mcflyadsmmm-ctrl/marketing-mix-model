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
  useNavigation,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { calculateBreakEvenMer } from "@mcfly/mer-core";
import { authenticate } from "../shopify.server";
import {
  ensureShop,
  getOrCreateSettings,
  marginIsConfirmed,
} from "../lib/mer-dashboard.server";
import { formatMer, formatPercent } from "../lib/mer-format";
import { getSampleDeskEnabled } from "../lib/sample-desk.server";
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
  return {
    settings,
    breakEvenMer: calculateBreakEvenMer(settings.marginPct),
    showRitualBanner: !marginIsConfirmed(settings),
    shotMode,
    useSampleDesk,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const form = await request.formData();

  const marginPct = parseFloat(String(form.get("marginPct") ?? "0")) / 100;
  const targetMer = parseFloat(String(form.get("targetMer") ?? "0"));

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
      error: "Target MER must be positive",
      success: false as const,
      breakEvenMer: null as number | null,
      marginPct: null as number | null,
    };
  }

  const breakEvenMer = calculateBreakEvenMer(marginPct);
  if (breakEvenMer === null) {
    return {
      error: "Could not compute break-even MER from that margin",
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
  const { settings, breakEvenMer, showRitualBanner, shotMode, useSampleDesk } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const fieldIds = useId();
  const marginFieldId = `${fieldIds}-margin`;
  const targetFieldId = `${fieldIds}-target`;
  const marginHintId = `${fieldIds}-margin-hint`;
  const targetHintId = `${fieldIds}-target-hint`;

  const isSaving = navigation.state === "submitting";
  const isRevalidating =
    navigation.state === "loading" && navigation.formMethod != null;

  const [marginInput, setMarginInput] = useState(
    () => (settings.marginPct * 100).toFixed(1),
  );
  const [targetInput, setTargetInput] = useState(() =>
    String(settings.targetMer),
  );

  useEffect(() => {
    setMarginInput((settings.marginPct * 100).toFixed(1));
    setTargetInput(String(settings.targetMer));
  }, [settings.marginPct, settings.targetMer, settings.updatedAt]);

  useEffect(() => {
    if (!actionData) return;
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
  };

  const handleDiscard = () => {
    syncFormPreviewFromSaved();
  };

  const marginConfirmed = settings.marginConfirmedAt != null;
  const marginDecimal = parseFloat(marginInput) / 100;
  const previewBreakEven = Number.isFinite(marginDecimal)
    ? calculateBreakEvenMer(marginDecimal)
    : null;
  const previewMatchesSaved =
    previewBreakEven !== null &&
    breakEvenMer !== null &&
    Math.abs(previewBreakEven - breakEvenMer) < 0.005 &&
    Math.abs(marginDecimal - settings.marginPct) < 0.0005;

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
        className={
          shotMode
            ? "mcfly-desk mcfly-desk--chrome mcfly-desk--shot"
            : "mcfly-desk mcfly-desk--chrome"
        }
      >
        <header className="mcfly-topbar mcfly-topbar--settings">
          <div>
            <p className="mcfly-topbar__def mcfly-topbar__def--solo">
              Confirm margin to lock break-even MER · 1 ÷ margin · not platform
              ROAS
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
              Target {formatMer(Number.parseFloat(targetInput) || settings.targetMer)}
            </span>
          </div>
        </div>

        {useSampleDesk && !shotMode ? (
          <s-banner tone="warning" heading="Sample desk is on elsewhere">
            <s-paragraph>
              Margin and break-even here are your real settings. Cash MER /
              Allocation may still show sample till until you turn sample desk{" "}
              <strong>OFF</strong> on the <s-link href="/app/demo">Demo</s-link>{" "}
              tab. Required before App Store review.
            </s-paragraph>
          </s-banner>
        ) : null}

        {isSaving || isRevalidating ? (
          <s-banner tone="info" heading="Confirming margin">
            <s-stack direction="inline" gap="small" alignItems="center">
              <s-spinner
                size="base"
                accessibilityLabel="Saving settings"
              ></s-spinner>
              <s-paragraph>
                Confirming your margin and target MER — waiting on the real
                save, not sample numbers.
              </s-paragraph>
            </s-stack>
          </s-banner>
        ) : null}

        {showRitualBanner && !shotMode ? (
          <s-banner tone="info" heading="Trusted MER in under 10 minutes">
            <s-paragraph>Three steps, in order:</s-paragraph>
            <ol className="mcfly-settings-guide">
              <li>
                Confirm contribution margin below — defaults are preview only
                until you save; then break-even locks as 1 ÷ margin.
              </li>
              <li>
                Add ad spend on <s-link href="/app/spend">Spend</s-link>.
              </li>
              <li>
                Read cash MER on <s-link href="/app">Cash MER</s-link>.
              </li>
            </ol>
          </s-banner>
        ) : null}

        {actionData?.success &&
        actionData.breakEvenMer !== null &&
        !isSaving ? (
          <s-banner tone="success" heading="Break-even MER locked">
            <s-paragraph>
              Margin confirmed. At{" "}
              {formatPercent(actionData.marginPct ?? settings.marginPct)}{" "}
              margin, break-even MER is {formatMer(actionData.breakEvenMer)}.
              Cash MER must clear this line.
            </s-paragraph>
            <s-paragraph>
              Next: log spend on <s-link href="/app/spend">Spend</s-link>, then
              open <s-link href="/app">Cash MER</s-link>.
            </s-paragraph>
          </s-banner>
        ) : null}

        <section
          className={`mcfly-settings-lock mcfly-settings-lock--${lockState}`}
          aria-label="Break-even MER lock"
          aria-busy={isSaving || undefined}
        >
          <p className="mcfly-settings-lock__kicker">Ritual instrument</p>
          <p className="mcfly-settings-lock__label">Break-even MER</p>
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
              ? "Enter a contribution margin to preview the lock line"
              : lockState === "locked"
                ? `Break-even locked · need ${formatMer(previewBreakEven)}× sales per $1 spend`
                : marginConfirmed
                  ? "Preview — use Admin Save to update the lock · Discard restores last save"
                  : "Preview only — use Admin Save to confirm margin & lock break-even"}
          </p>
        </section>

        {/* Polaris Settings template: description column + form column */}
        <div className="mcfly-settings-template">
          <aside className="mcfly-settings-template__desc">
            <h2 className="mcfly-settings-template__heading">
              Confirm margin to lock break-even
            </h2>
            <p className="mcfly-settings-template__copy">
              Contribution margin after COGS sets break-even MER as 1 ÷ margin.
              Until you save, defaults are preview only — not locked. Cash MER
              (Shopify sales ÷ ad spend) must clear the confirmed line — not
              platform ROAS.
            </p>
            <p className="mcfly-settings-template__copy">
              Dirty fields open the Admin save bar. Save confirms margin and
              locks break-even on the scoreboard; Discard restores the last
              saved margin and target.
            </p>
          </aside>

          <section className="mcfly-panel mcfly-settings-form mcfly-settings-template__form">
            <div className="mcfly-panel__head">
              <h2>MER inputs</h2>
              <p className="mcfly-panel__muted">
                Quiet form · margin first, target second
              </p>
            </div>
            <Form
              method="post"
              key={String(settings.updatedAt)}
              data-save-bar
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
                  Contribution margin and target MER
                </legend>

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
                    inputMode="decimal"
                    autoComplete="off"
                    aria-describedby={marginHintId}
                    defaultValue={(settings.marginPct * 100).toFixed(1)}
                    onChange={(event) =>
                      setMarginInput(event.currentTarget.value)
                    }
                  />
                  <span
                    id={marginHintId}
                    className="mcfly-settings-field__hint"
                  >
                    Gross contribution after COGS — sets the break-even line
                    above.
                  </span>
                </div>

                <div className="mcfly-settings-field">
                  <label
                    className="mcfly-settings-field__label"
                    htmlFor={targetFieldId}
                  >
                    Target MER
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
                    ad spend).
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
                    <s-link href="/app">Open Cash MER</s-link>
                  ) : null}
                </div>
              </fieldset>
            </Form>
            {!shotMode ? (
              <p className="mcfly-settings-aside-link">
                <s-link href="/app/demo">Demo & sample desk</s-link>
                <span className="mcfly-panel__muted">
                  {" "}
                  — listing screenshots and desk rehearsals (not primary nav).
                </span>
              </p>
            ) : null}
          </section>
        </div>

        {!shotMode ? (
          <footer className="mcfly-settings-footer-help">
            <s-stack alignItems="center">
              <s-text>
                Learn more about{" "}
                <s-link href="https://mcflyads.com/support" target="_blank">
                  cash MER support
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
