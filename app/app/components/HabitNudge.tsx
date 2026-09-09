import { useEffect, useState } from "react";
import {
  HABIT_NUDGE_COPY,
  HABIT_NUDGE_DISMISS_KEY,
  HABIT_NUDGE_SESSION_KEY,
  decideHabitNudgeReveal,
  habitAllocationHref,
} from "../lib/habit-nudge";

type Props = {
  /** From {@link decideHabitNudgeEligible} — trusted + cashActionReady + live desk. */
  eligible: boolean;
  periodPreset: string;
};

/**
 * Calm L10 Monday habit — dismissible info banner below Love-V1 critical budget.
 * Once per session unless permanently dismissed. Never a hero primary (Love-V2).
 */
export function HabitNudge({ eligible, periodPreset }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [sessionConsumed, setSessionConsumed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!eligible) {
      setHydrated(true);
      return;
    }

    let localDismissed = false;
    let sessionDone = false;
    try {
      localDismissed = window.localStorage.getItem(HABIT_NUDGE_DISMISS_KEY) === "1";
    } catch {
      localDismissed = false;
    }
    try {
      sessionDone = window.sessionStorage.getItem(HABIT_NUDGE_SESSION_KEY) === "1";
    } catch {
      sessionDone = false;
    }

    setDismissed(localDismissed);
    setSessionConsumed(sessionDone);
    setHydrated(true);
  }, [eligible]);

  const reveal = decideHabitNudgeReveal({
    eligible,
    dismissed,
    sessionConsumed,
    hydrated,
  });

  // Mark session after reveal so remounts this tab hide — do not flip React
  // sessionConsumed while visible (that would unmount immediately).
  useEffect(() => {
    if (!reveal.show) return;
    try {
      window.sessionStorage.setItem(HABIT_NUDGE_SESSION_KEY, "1");
    } catch {
      /* private mode — next hydrate may show again this visit */
    }
  }, [reveal.show]);

  if (!reveal.show) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(HABIT_NUDGE_DISMISS_KEY, "1");
    } catch {
      /* private mode — hide this paint */
    }
    setDismissed(true);
  }

  return (
    <s-banner
      tone="info"
      heading={HABIT_NUDGE_COPY.heading}
      dismissible
      onDismiss={dismiss}
    >
      <s-paragraph>{HABIT_NUDGE_COPY.body}</s-paragraph>
      <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
        <s-button href={HABIT_NUDGE_COPY.updateSpendHref} variant="secondary">
          {HABIT_NUDGE_COPY.updateSpendLabel}
        </s-button>
        <s-button href={habitAllocationHref(periodPreset)} variant="tertiary">
          {HABIT_NUDGE_COPY.allocationLabel}
        </s-button>
        <s-button href={HABIT_NUDGE_COPY.goalsHref} variant="tertiary">
          {HABIT_NUDGE_COPY.goalsLabel}
        </s-button>
        <s-button variant="tertiary" onClick={dismiss}>
          {HABIT_NUDGE_COPY.dismissLabel}
        </s-button>
      </div>
    </s-banner>
  );
}
