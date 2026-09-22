import { useState } from "react";
import type { SlackInsight } from "../lib/shareable-insights";

export async function copyDeskText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the execCommand path in older admin embeds.
    }
  }
  if (typeof document === "undefined") return false;
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "true");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand("copy");
  ta.remove();
  return ok;
}

/**
 * One Slack-style quote from a number already on the desk.
 * Select the line, or copy the mrkdwn. No card when the insight is null —
 * never a blank and never $0.
 */
export function SlackInsightCard({
  insight,
  shotMode = false,
}: {
  insight: SlackInsight | null;
  shotMode?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  if (!insight) return null;

  return (
    <aside
      className="mcfly-slack-insight"
      aria-label={`Share ${insight.label}`}
      data-slack-insight={insight.id}
      data-slack={insight.slack}
    >
      <p className="mcfly-slack-insight__k">Share</p>
      <p className="mcfly-slack-insight__label">{insight.label}</p>
      <p className="mcfly-slack-insight__line">{insight.line}</p>
      <p className="mcfly-slack-insight__formula">{insight.formula}</p>
      <p className="mcfly-slack-insight__trust">{insight.trust}</p>
      {shotMode ? null : (
        <button
          type="button"
          className="mcfly-share-card__btn"
          onClick={() => {
            void copyDeskText(insight.slack).then((ok) => {
              if (!ok) return;
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            });
          }}
        >
          {copied ? "Copied" : "Copy for Slack"}
        </button>
      )}
    </aside>
  );
}
