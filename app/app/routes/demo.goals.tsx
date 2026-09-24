/**
 * Public Goals — one saved target. Not Settings.
 * Nothing here says "at goal" until the merchant saves a number.
 */
import { useEffect, useState, type FormEvent } from "react";
import type { HeadersFunction } from "react-router";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { deskPageShouldRevalidate } from "../lib/desk-tab-flow";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import {
  parseSavedTarget,
  readSavedTarget,
  writeSavedTarget,
} from "../lib/saved-desk-target";

export const shouldRevalidate = deskPageShouldRevalidate;

export const headers: HeadersFunction = () => publicDemoHeaders();

export default function DemoGoals() {
  const [savedTarget, setSavedTarget] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setSavedTarget(readSavedTarget());
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = parseSavedTarget(
      String(new FormData(event.currentTarget).get("targetMer") ?? ""),
    );
    if (target == null) {
      setError("Enter one target greater than 0.");
      setSavedNotice(null);
      return;
    }
    writeSavedTarget(target);
    setSavedTarget(target);
    setError(null);
    setSavedNotice(`Saved target ${target}×.`);
  }

  return (
    <s-page heading="Goals">
      <section className="mcfly-panel mcfly-settings-panel--soft" aria-label="One target">
        <h2 className="mcfly-settings-template__heading">One target</h2>
        <p className="mcfly-panel__muted">
          {PRODUCT_NOUN.totalRoas} target for this shop. Empty until you save
          a number. This page does not compare you to a target you never set.
        </p>
        <form onSubmit={onSubmit}>
          <label className="mcfly-settings-field__label" htmlFor="goal-target">
            Target
          </label>
          <input
            id="goal-target"
            className="mcfly-field mcfly-settings-field__input"
            name="targetMer"
            type="number"
            step="0.1"
            min="0.1"
            inputMode="decimal"
            autoComplete="off"
            placeholder="e.g. 4.0"
            key={savedTarget ?? "empty"}
            defaultValue={savedTarget ?? ""}
          />
          <button type="submit" className="mcfly-btn mcfly-btn--primary">
            Save target
          </button>
        </form>
        {error ? (
          <p className="mcfly-settings-error" role="alert">
            {error}
          </p>
        ) : null}
        {savedNotice ? (
          <p className="mcfly-panel__muted" role="status">
            {savedNotice}
          </p>
        ) : null}
        {savedTarget != null ? (
          <p className="mcfly-panel__muted">Saved target {savedTarget}×.</p>
        ) : (
          <p className="mcfly-panel__muted">No target saved.</p>
        )}
      </section>
    </s-page>
  );
}
