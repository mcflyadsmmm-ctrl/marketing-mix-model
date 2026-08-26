import { useState } from "react";
import type { SpendAdvertisePlatform } from "../lib/spend-export-guides";
import {
  CSV_CLEANUP_HINT,
  LONG_FORMAT_EXAMPLE,
  META_NATIVE_EXAMPLE,
} from "../lib/spend-walkthrough";

type SpendExportWalkthroughProps = {
  platforms: readonly SpendAdvertisePlatform[];
  exampleCsv: string;
  exampleHref: string;
  onUseExample: (text: string) => void;
};

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  return false;
}

/**
 * Ads Manager click-paths that already live in spend-export-guides.ts.
 * Must render on Spend — merchants cannot guess Day + Amount spent.
 */
export function SpendExportWalkthrough({
  platforms,
  exampleCsv,
  exampleHref,
  onUseExample,
}: SpendExportWalkthroughProps) {
  const [copied, setCopied] = useState<"template" | "meta" | "long" | null>(
    null,
  );
  const shown = platforms.slice(0, 4);
  const autoOpen = shown.length <= 2;

  async function copyKind(
    kind: "template" | "meta" | "long",
    text: string,
  ) {
    const ok = await copyText(text);
    if (ok) {
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    }
    onUseExample(text);
  }

  return (
    <div className="mcfly-spend-guides" id="mcfly-spend-guides">
      <h3 className="mcfly-spend-guides__title">How to export the right file</h3>
      <p className="mcfly-spend-guides__lede">
        Shopify already has your sales. This file is <strong>spend only</strong>{" "}
        — one row per day. {CSV_CLEANUP_HINT}
      </p>

      {shown.length === 0 ? (
        <p className="mcfly-spend-guides__lede">
          Pick channels in Template columns above, then follow the export steps
          here.
        </p>
      ) : (
        shown.map((platform) => (
          <details
            key={platform.id}
            className="mcfly-spend-guides__plat"
            open={autoOpen}
          >
            <summary>{platform.title}</summary>
            <p className="mcfly-spend-guides__hint">{platform.productHint}</p>
            <ol className="mcfly-spend-guides__steps">
              {platform.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="mcfly-spend-guides__cols">
              Columns we need: {platform.columnsNeeded.join(" · ")}
            </p>
            {platform.tips.length > 0 ? (
              <ul className="mcfly-spend-guides__tips">
                {platform.tips.slice(0, 3).map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            ) : null}
            {platform.cadenceNote ? (
              <p className="mcfly-spend-guides__hint">{platform.cadenceNote}</p>
            ) : null}
          </details>
        ))
      )}

      <div className="mcfly-spend-guides__samples">
        <p className="mcfly-spend-guides__samples-k">Copy a working example</p>
        <div className="mcfly-spend-guides__sample-row">
          <s-button href={exampleHref} variant="primary">
            Download filled example
          </s-button>
          <s-button
            type="button"
            variant="secondary"
            onClick={() => {
              void copyKind("template", exampleCsv);
            }}
          >
            {copied === "template" ? "Copied into paste box" : "Copy template rows"}
          </s-button>
        </div>
        <div className="mcfly-spend-guides__sample-row">
          <s-button
            type="button"
            variant="tertiary"
            onClick={() => {
              void copyKind("meta", META_NATIVE_EXAMPLE);
            }}
          >
            {copied === "meta" ? "Copied" : "Meta export sample"}
          </s-button>
          <s-button
            type="button"
            variant="tertiary"
            onClick={() => {
              void copyKind("long", LONG_FORMAT_EXAMPLE);
            }}
          >
            {copied === "long" ? "Copied" : "date, channel, amount"}
          </s-button>
        </div>
      </div>
    </div>
  );
}

type SpendHowToProps = {
  empty: boolean;
};

export function SpendHowTo({ empty }: SpendHowToProps) {
  if (!empty) return null;
  return (
    <section className="mcfly-spend-howto" aria-label="How to add spend">
      <h2>Put last month’s ads next to Shopify</h2>
      <ol>
        <li>
          <strong>One invoice</strong> — type amount, date, and channel in Add
          spend (billboards included).
        </li>
        <li>
          <strong>Many days</strong> — export Ads Manager with a Day breakdown
          and Amount spent, then paste below.
        </li>
        <li>
          <strong>A monthly bill</strong> — divide it into daily rows and save.
          We split it across the month so it sits next to daily Shopify sales.
        </li>
      </ol>
      <p>
        Sales load from Shopify automatically. Empty days are not $0 — add them
        when you have the invoices. Last month is enough to start.
      </p>
    </section>
  );
}
