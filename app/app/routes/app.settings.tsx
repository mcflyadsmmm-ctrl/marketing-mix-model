import { useEffect, useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { calculateBreakEvenMer } from "@mcfly/mer-core";
import { authenticate } from "../shopify.server";
import {
  ensureShop,
  getOrCreateSettings,
  settingsHaveBeenSaved,
} from "../lib/mer-dashboard.server";
import { formatMer, formatPercent } from "../lib/mer-format";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const shop = await ensureShop(session.shop);
  const settings = await getOrCreateSettings(shop.id);
  return {
    settings,
    breakEvenMer: calculateBreakEvenMer(settings.marginPct),
    showRitualBanner: !settingsHaveBeenSaved(settings),
    shotMode,
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
  const { settings, breakEvenMer, showRitualBanner, shotMode } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [marginInput, setMarginInput] = useState(
    () => (settings.marginPct * 100).toFixed(1),
  );

  useEffect(() => {
    setMarginInput((settings.marginPct * 100).toFixed(1));
  }, [settings.marginPct, settings.updatedAt]);

  const marginDecimal = parseFloat(marginInput) / 100;
  const previewBreakEven = Number.isFinite(marginDecimal)
    ? calculateBreakEvenMer(marginDecimal)
    : null;
  const previewMatchesSaved =
    previewBreakEven !== null &&
    breakEvenMer !== null &&
    Math.abs(previewBreakEven - breakEvenMer) < 0.005 &&
    Math.abs(marginDecimal - settings.marginPct) < 0.0005;

  const lockState = previewBreakEven === null
    ? "empty"
    : previewMatchesSaved
      ? "locked"
      : "preview";

  const marginDisplay = Number.isFinite(marginDecimal)
    ? formatPercent(marginDecimal)
    : "—";

  return (
    <s-page heading={shotMode ? undefined : "Settings"} inlineSize="small">
      <div className={shotMode ? "mcfly-desk mcfly-desk--shot" : "mcfly-desk"}>
        <header className="mcfly-topbar mcfly-topbar--settings">
          <div>
            <h1 className="mcfly-topbar__title">Settings</h1>
            <p className="mcfly-topbar__def">
              Margin locks break-even MER · 1 ÷ margin · not platform ROAS
            </p>
          </div>
        </header>

        <div className="mcfly-ctx" aria-live="polite">
          <div className="mcfly-ctx__main">
            <span className="mcfly-ctx__brand">Break-even lock</span>
            <span className="mcfly-ctx__sep" aria-hidden="true">
              ·
            </span>
            <span className="mcfly-ctx__asof">
              {lockState === "locked"
                ? "Saved on the scoreboard"
                : lockState === "preview"
                  ? "Preview — save to lock"
                  : "Enter margin to preview"}
            </span>
          </div>
          <div className="mcfly-ctx__chips">
            <span
              className={`mcfly-ctx-chip ${
                lockState === "locked"
                  ? "mcfly-ctx-chip--up"
                  : lockState === "preview"
                    ? "mcfly-ctx-chip--flat"
                    : "mcfly-ctx-chip--flat"
              }`}
            >
              BE{" "}
              {previewBreakEven === null ? "—.——" : formatMer(previewBreakEven)}
            </span>
            <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">
              Target {formatMer(settings.targetMer)}
            </span>
          </div>
        </div>

        {showRitualBanner && !shotMode ? (
          <s-banner tone="info" heading="Trusted MER in under 10 minutes">
            <s-paragraph>Three steps, in order:</s-paragraph>
            <ol className="mcfly-settings-guide">
              <li>
                Set contribution margin below — break-even MER locks as 1 ÷
                margin.
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

        {actionData?.success && actionData.breakEvenMer !== null ? (
          <s-banner tone="success" heading="Break-even MER locked">
            <s-paragraph>
              At {formatPercent(actionData.marginPct ?? settings.marginPct)}{" "}
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
                ? `Locked · need ${formatMer(previewBreakEven)}× sales per $1 spend`
                : "Preview — save to lock on the Cash MER scoreboard"}
          </p>
        </section>

        <section className="mcfly-panel mcfly-settings-form">
          <div className="mcfly-panel__head">
            <h2>MER inputs</h2>
            <p className="mcfly-panel__muted">
              Quiet form · margin first, target second
            </p>
          </div>
          <Form method="post">
            <div className="mcfly-settings-fields">
              <label className="mcfly-settings-field">
                <span className="mcfly-settings-field__label">
                  Contribution margin (%)
                </span>
                <input
                  className="mcfly-field mcfly-settings-field__input"
                  name="marginPct"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  required
                  value={marginInput}
                  onChange={(event) =>
                    setMarginInput(event.currentTarget.value)
                  }
                />
                <span className="mcfly-settings-field__hint">
                  Gross contribution after COGS — sets the break-even line above.
                </span>
              </label>

              <label className="mcfly-settings-field">
                <span className="mcfly-settings-field__label">Target MER</span>
                <input
                  className="mcfly-field mcfly-settings-field__input"
                  name="targetMer"
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  defaultValue={settings.targetMer}
                />
                <span className="mcfly-settings-field__hint">
                  Operating goal above break-even (e.g. 4.0 = $4 sales per $1 ad
                  spend).
                </span>
              </label>

              {actionData?.error ? (
                <p className="mcfly-settings-error">{actionData.error}</p>
              ) : null}

              <div className="mcfly-settings-form__actions">
                <s-button
                  type="submit"
                  variant="primary"
                  {...(isSubmitting ? { loading: true } : {})}
                >
                  {lockState === "locked" ? "Save settings" : "Lock break-even"}
                </s-button>
                {!shotMode ? (
                  <s-link href="/app">Open Cash MER</s-link>
                ) : null}
              </div>
            </div>
          </Form>
        </section>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
