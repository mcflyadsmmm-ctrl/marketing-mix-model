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
import { ensureShop, getOrCreateSettings, settingsHaveBeenSaved } from "../lib/mer-dashboard.server";
import { formatMer, formatPercent } from "../lib/mer-format";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const settings = await getOrCreateSettings(shop.id);
  return {
    settings,
    breakEvenMer: calculateBreakEvenMer(settings.marginPct),
    showRitualBanner: !settingsHaveBeenSaved(settings),
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
  const { settings, breakEvenMer, showRitualBanner } = useLoaderData<typeof loader>();
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

  return (
    <s-page heading="Settings" inlineSize="small">
      <div className="mcfly-desk">
        {showRitualBanner ? (
          <s-banner tone="info" heading="Trusted MER in under 10 minutes">
            <s-paragraph>Three steps, in order:</s-paragraph>
            <ol className="mcfly-settings-guide">
              <li>Set contribution margin below — break-even MER locks as 1 ÷ margin.</li>
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
              At {formatPercent(actionData.marginPct ?? settings.marginPct)} margin, break-even MER
              is {formatMer(actionData.breakEvenMer)}. Cash MER must clear this line.
            </s-paragraph>
            <s-paragraph>
              Next: log spend on <s-link href="/app/spend">Spend</s-link>, then open{" "}
              <s-link href="/app">Cash MER</s-link>.
            </s-paragraph>
          </s-banner>
        ) : null}

        <s-section heading="MER inputs">
          <Form method="post">
            <s-stack direction="block" gap="base">
              <label>
                <s-text>Contribution margin (%)</s-text>
                <input
                  className="mcfly-field"
                  name="marginPct"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  required
                  value={marginInput}
                  onChange={(event) => setMarginInput(event.currentTarget.value)}
                />
              </label>

              <div className="mcfly-hero">
                <p className="mcfly-hero__label">Break-even MER</p>
                <p className="mcfly-hero__value">
                  {previewBreakEven === null ? "—" : formatMer(previewBreakEven)}
                </p>
                <p className="mcfly-hero__equation">1 ÷ margin</p>
                <div className="mcfly-hero__rail">
                  <span className="mcfly-chip">
                    {previewBreakEven === null
                      ? "Enter a margin to preview"
                      : previewMatchesSaved
                        ? `Saved · need ${formatMer(previewBreakEven)}× sales per $1 spend`
                        : "Preview — save to lock on the scoreboard"}
                  </span>
                </div>
              </div>

              <label>
                <s-text>Target MER</s-text>
                <input
                  className="mcfly-field"
                  name="targetMer"
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  defaultValue={settings.targetMer}
                />
              </label>
              <s-paragraph>
                <s-text tone="neutral">
                  Operating goal above break-even (e.g. 4.0 means $4 sales per $1 ad spend).
                </s-text>
              </s-paragraph>

              {actionData?.error ? <s-text tone="critical">{actionData.error}</s-text> : null}

              <s-button type="submit" variant="primary" {...(isSubmitting ? { loading: true } : {})}>
                Save settings
              </s-button>
            </s-stack>
          </Form>
        </s-section>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
