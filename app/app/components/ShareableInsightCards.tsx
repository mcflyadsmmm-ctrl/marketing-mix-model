import { useState } from "react";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { useDeskHref } from "../lib/desk-base-path";
import {
  shareableInsightKicker,
  type ShareableInsightCard,
  type ShareableInsightEmpty,
  type ShareableInsightEmptyKind,
  type ShareableInsightKind,
  type ShareableInsightView,
} from "../lib/shareable-insights";
import { downloadShareableInsightPng } from "../lib/shareable-insight-png";

type Tone = "returning" | "typicalOrder" | "daysToSecond" | "ltvPeek";

function emptyValue(empty: ShareableInsightEmpty): string {
  switch (empty.kind) {
    case "syncing":
      return "Waiting on orders";
    case "thin":
    case "young":
      return `${empty.orders.toLocaleString()} on file`;
    default: {
      const _exhaustive: never = empty.kind;
      return _exhaustive;
    }
  }
}

function emptyFloor(kind: ShareableInsightEmptyKind, need: number): string {
  switch (kind) {
    case "syncing":
    case "thin":
    case "young":
      return `Floor: ${need} paid orders — not $0.`;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function cardIcon(kind: ShareableInsightKind): "customers" | "orders" | "clock" | "sales" {
  switch (kind) {
    case "returning":
      return "customers";
    case "typicalOrder":
      return "orders";
    case "daysToSecond":
      return "clock";
    case "ltvPeek":
      return "sales";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

async function copyInsightLine(line: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(line);
      return true;
    } catch {
      // Fall through to the execCommand path in older admin embeds.
    }
  }
  if (typeof document === "undefined") return false;
  const ta = document.createElement("textarea");
  ta.value = line;
  ta.setAttribute("readonly", "true");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand("copy");
  ta.remove();
  return ok;
}

function InsightPoster({
  card,
  shopBrand,
  sample,
  periodLabel,
  onOpen,
}: {
  card: ShareableInsightCard;
  shopBrand: string;
  sample: boolean;
  periodLabel: string;
  onOpen: () => void;
}) {
  const tone: Tone = card.kind;
  return (
    <button
      type="button"
      className={`mcfly-share-card__poster mcfly-share-card__poster--${tone}`}
      onClick={onOpen}
    >
      <span className="mcfly-share-card__mark">
        <span className="mcfly-share-card__brand">Mcfly Analytics</span>
        <span className="mcfly-share-card__shop">
          {sample ? `${shopBrand} · SAMPLE` : shopBrand}
          <span aria-hidden="true"> · </span>
          {periodLabel}
        </span>
      </span>
      <span className="mcfly-share-card__k">
        <DeskIcon name={cardIcon(card.kind)} />
        {card.label}
      </span>
      <span className="mcfly-share-card__v">{card.value}</span>
      <span className="mcfly-share-card__line">{card.line}</span>
      <span className="mcfly-share-card__formula">{card.formula}</span>
      <span className="mcfly-share-card__trust">{card.trust}</span>
    </button>
  );
}

/**
 * Soft shareable cards from order-history truths already on the desk.
 * Screenshot the poster, copy the line, or save a PNG. First-win empties
 * are ActionCard-shaped. Not a dump. Sales-five IA stays.
 */
export function ShareableInsightCards({
  view,
  shotMode = false,
}: {
  view: ShareableInsightView;
  shotMode?: boolean;
}) {
  const drill = useDeskDrill();
  const deskHref = useDeskHref();
  const [copied, setCopied] = useState<ShareableInsightKind | null>(null);
  const empty = view.empty;

  if (empty) {
    return (
      <section
        className="mcfly-panel mcfly-cust-card mcfly-cust-card--soft mcfly-share-cards"
        aria-label="Share a number"
      >
        <div className="mcfly-panel__head">
          <h2>Share a number</h2>
          <p className="mcfly-panel__muted">
            Screenshot-ready · order history only
          </p>
        </div>
        <button
          type="button"
          className="mcfly-cust-rfm__empty"
          data-kind={empty.kind}
          onClick={() =>
            drill?.openDrill({
              title: "Share a number",
              value: emptyValue(empty),
              kicker: empty.verb,
              blocks: [
                { k: "What this is", v: empty.copy },
                {
                  k: "What fills next",
                  v: `Floor: ${empty.need} paid orders with identified buyers. Then returning $, typical order, days-to-second, or what a new buyer is worth — the same truths already on this desk. Never a fake $0 card.`,
                },
              ],
              next: "Order history only — not a guess.",
            })
          }
        >
          <span className="mcfly-cust-rfm__empty-k">First win</span>
          <span className="mcfly-cust-rfm__empty-verb">{empty.verb}</span>
          <span className="mcfly-cust-rfm__empty-v">{emptyValue(empty)}</span>
          <span className="mcfly-cust-rfm__empty-line">{empty.copy}</span>
          <span className="mcfly-cust-rfm__empty-line">
            {emptyFloor(empty.kind, empty.need)}
          </span>
        </button>
        <div
          className="mcfly-cust-empty__ghost mcfly-cust-empty__ghost--bars"
          aria-hidden="true"
        >
          {[0.48, 0.72, 0.4, 0.62].map((h, i) => (
            <span key={i} className="mcfly-cust-empty__col">
              <span
                className="mcfly-cust-empty__col-a"
                style={{ height: `${h * 100}%` }}
              />
              <span
                className="mcfly-cust-empty__col-b"
                style={{ height: `${Math.max(16, (1 - h) * 55)}%` }}
              />
            </span>
          ))}
        </div>
      </section>
    );
  }

  if (!view.available || view.cards.length === 0) return null;

  return (
    <section
      className="mcfly-panel mcfly-cust-card mcfly-cust-card--soft mcfly-share-cards mcfly-desk-anchor"
      aria-label="Share a number"
    >
      <div className="mcfly-panel__head">
        <h2>Share a number</h2>
        <p className="mcfly-panel__muted">
          {shareableInsightKicker(view.cards.length)}
        </p>
      </div>

      <div className="mcfly-share-cards__grid">
        {view.cards.map((card) => (
          <article
            key={card.kind}
            className="mcfly-share-card"
            data-kind={card.kind}
          >
            <InsightPoster
              card={card}
              shopBrand={view.shopBrand}
              sample={view.sample}
              periodLabel={view.periodLabel}
              onOpen={() =>
                drill?.openDrill({
                  title: card.label,
                  value: card.value,
                  kicker: "Shareable",
                  blocks: [
                    { k: "What this is", v: card.line },
                    { k: "Formula", v: card.formula },
                    { k: "Trust", v: card.trust },
                  ],
                  next: "Screenshot the card, copy the line, or save a PNG. Order history only.",
                  nextHref: deskHref(card.nextHref),
                  nextLabel: card.nextLabel,
                })
              }
            />
            {shotMode ? null : (
              <div className="mcfly-share-card__actions">
                <button
                  type="button"
                  className="mcfly-share-card__btn"
                  onClick={() => {
                    void copyInsightLine(card.line).then((ok) => {
                      if (!ok) return;
                      setCopied(card.kind);
                      window.setTimeout(() => {
                        setCopied((cur) => (cur === card.kind ? null : cur));
                      }, 1600);
                    });
                  }}
                >
                  {copied === card.kind ? "Copied" : "Copy line"}
                </button>
                <button
                  type="button"
                  className="mcfly-share-card__btn"
                  onClick={() =>
                    downloadShareableInsightPng(card, {
                      shopBrand: view.shopBrand,
                      sample: view.sample,
                      periodLabel: view.periodLabel,
                    })
                  }
                >
                  Save PNG
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      <p className="mcfly-share-cards__meta">
        <DeskIcon name="chart" /> Screenshot the card or copy the line. Same
        formulas as the desk — not a guess.
      </p>
    </section>
  );
}
