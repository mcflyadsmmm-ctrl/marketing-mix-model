import { useState } from "react";
import { Link } from "react-router";
import { useDeskHref } from "../lib/desk-base-path";
import { copyDeskText } from "./SlackInsightCard";

/**
 * Three first wins already on the desk. No settings wall, no ad login.
 * Hidden by the book page when shot mode is on.
 */
export function MorningHabitStrip() {
  const deskHref = useDeskHref();

  return (
    <nav className="mcfly-morning-habit" aria-label="This morning">
      <p className="mcfly-morning-habit__k">This morning</p>
      <Link className="mcfly-desk-tabs__pill" to={deskHref("/app")}>
        Month close
      </Link>
      <Link
        className="mcfly-desk-tabs__pill"
        to={deskHref("/app/customers?panel=growth")}
      >
        Who to save
      </Link>
      <Link className="mcfly-desk-tabs__pill" to={deskHref("/app/goals")}>
        Set a target
      </Link>
    </nav>
  );
}

/** Copies one morning sentence. The sentence is morningSentence(...) at the call site. */
export function CopyMorningSentence({ sentence }: { sentence: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="mcfly-share-card__btn mcfly-morning-copy"
      onClick={() => {
        void copyDeskText(sentence).then((ok) => {
          if (!ok) return;
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        });
      }}
    >
      {copied ? "Copied" : "Copy morning"}
    </button>
  );
}

/** Copies Shopify Total Sales ÷ typed spend from the Spend first fold. */
export function CopySpendPair({ text }: { text: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;

  return (
    <button
      type="button"
      className="mcfly-share-card__btn mcfly-spend-pair-copy"
      onClick={() => {
        void copyDeskText(text).then((ok) => {
          if (!ok) return;
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        });
      }}
    >
      {copied ? "Copied" : "Copy pair"}
    </button>
  );
}
