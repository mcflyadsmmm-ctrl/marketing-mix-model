import { useEffect, useState } from "react";
import type { FirstSessionPath } from "../lib/first-session-path";

/** localStorage — same hide pattern as ReviewAsk. */
export const SETUP_GUIDE_DISMISS_KEY = "mcfly-setup-guide";

type Props = {
  path: FirstSessionPath;
  /**
   * Home Setup Guide composition (Love-UX1). When dismissed, cold empty keeps
   * a single Add Spend primary so TTFV stays open.
   */
  dismissible?: boolean;
};

/**
 * Calm Overview Setup Guide — Shopify setup-guide composition.
 * Auto-checked steps come from `resolveFirstSessionPath`.
 */
export function FirstSessionGuide({ path, dismissible = true }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(SETUP_GUIDE_DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
    setHydrated(true);
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(SETUP_GUIDE_DISMISS_KEY, "1");
    } catch {
      /* private mode — still hide for this paint */
    }
    setDismissed(true);
  }

  const showChecklist =
    path.showFullGuide && !(dismissible && hydrated && dismissed);

  if (!showChecklist) {
    return (
      <div className="mcfly-cold-empty">
        <s-section accessibilityLabel={`Empty state — ${path.heading}`}>
          <s-grid gap="base" justifyItems="center" paddingBlock="base">
            <s-grid justifyItems="center" maxInlineSize="420px" gap="base">
              <s-stack alignItems="center">
                <s-heading>{path.heading}</s-heading>
                <s-paragraph>{path.body}</s-paragraph>
              </s-stack>
              <s-button
                variant="primary"
                href={path.primaryHref}
                aria-label={path.primaryLabel}
              >
                {path.primaryLabel}
              </s-button>
              <p className="mcfly-cold-empty__foot">
                Next:{" "}
                {path.footerLinks.map((link, index) => (
                  <span key={`${link.href}-${link.label}`}>
                    {index > 0 ? " · " : null}
                    <s-link href={link.href}>{link.label}</s-link>
                  </span>
                ))}
              </p>
            </s-grid>
          </s-grid>
        </s-section>
      </div>
    );
  }

  return (
    <div className="mcfly-cold-empty">
      <s-section accessibilityLabel={path.guideHeading}>
        <s-grid gap="base">
          <s-grid gap="small-200">
            <s-grid
              gridTemplateColumns="1fr auto auto"
              gap="small-300"
              alignItems="center"
            >
              <s-heading>{path.guideHeading}</s-heading>
              {dismissible ? (
                <s-button
                  accessibilityLabel="Dismiss Setup Guide"
                  variant="tertiary"
                  tone="neutral"
                  icon="x"
                  onClick={dismiss}
                />
              ) : null}
              <s-button
                accessibilityLabel="Toggle Setup Guide"
                variant="tertiary"
                tone="neutral"
                icon={expanded ? "chevron-up" : "chevron-down"}
                onClick={() => setExpanded((open) => !open)}
              />
            </s-grid>
            <s-paragraph>{path.body}</s-paragraph>
            <s-paragraph color="subdued">{path.guideProgressLabel}</s-paragraph>
          </s-grid>

          {expanded ? (
            <s-box borderRadius="base" border="base" background="base" padding="base">
              <ol className="mcfly-data-mode__steps">
                {path.steps.map((step) => {
                  const done = step.status === "done";
                  const isCurrent = step.status === "current";
                  const label = step.optional
                    ? `${step.label} (optional)`
                    : step.label;
                  return (
                    <li key={step.id} data-status={step.status}>
                      <s-checkbox label={label} checked={done} disabled />
                      <span>{step.hint}</span>
                      {isCurrent && !done ? (
                        <div style={{ marginTop: "0.35rem" }}>
                          <s-button href={step.href} variant="primary">
                            {step.label}
                          </s-button>
                        </div>
                      ) : !done ? (
                        <s-link href={step.href}>{step.label}</s-link>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
              <p className="mcfly-data-mode__steps-note">{path.guideNote}</p>
            </s-box>
          ) : null}
        </s-grid>
      </s-section>
    </div>
  );
}
