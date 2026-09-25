import { useState, type FormEvent } from "react";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatSpendAmount } from "../lib/mer-format";

/** One example row. The merchant can save it, or type their own. */
export const SPEND_CSV_EXAMPLE =
  "date,channel,amount\n2026-09-16,Meta,100.00\n";

export const SPEND_ENTRY_CHANNELS: readonly { value: string; label: string }[] =
  [
    { value: "meta", label: "Meta" },
    { value: "google", label: "Google" },
    { value: "tiktok", label: "TikTok" },
    { value: "email", label: "Email" },
    { value: "billboard", label: "Billboard" },
    { value: "affiliate", label: "Affiliate" },
    { value: "other", label: "Other" },
  ];

export type SpendEntryDraft = {
  day: string;
  channel: string;
  amount: number;
};

export function parseSpendCsvRow(text: string): SpendEntryDraft | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  const header = lines[0]!.toLowerCase();
  const start =
    header.includes("date") && header.includes("amount") ? 1 : 0;
  const row = lines[start];
  if (!row) return null;
  const [day, channel, amountRaw] = row.split(",").map((cell) => cell.trim());
  if (!day || !channel || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { day, channel, amount };
}

function channelLabel(value: string): string {
  return (
    SPEND_ENTRY_CHANNELS.find((row) => row.value === value)?.label ?? value
  );
}

/**
 * Add spend: channel, amount, and day, plus a CSV with one example row.
 * Saving prints a confirmation. Empty stays blank — this form never paints $0.
 */
export function SpendEntryForm() {
  const currency = useDeskCurrency();
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function confirm(draft: SpendEntryDraft) {
    const label = channelLabel(draft.channel);
    setError(null);
    setConfirmation(
      `Saved ${label} ${formatSpendAmount(draft.amount, currency)} on ${draft.day}.`,
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const day = String(form.get("spendDate") ?? "").trim();
    const channel = String(form.get("channel") ?? "").trim();
    const amount = Number(String(form.get("amount") ?? "").trim());
    if (/^\d{4}-\d{2}-\d{2}$/.test(day) && channel && amount > 0) {
      confirm({ day, channel, amount });
      return;
    }
    const fromCsv = parseSpendCsvRow(String(form.get("spendCsv") ?? ""));
    if (fromCsv) {
      confirm(fromCsv);
      return;
    }
    setConfirmation(null);
    setError("Enter a channel, an amount, and a day.");
  }

  return (
    <section
      id="mcfly-spend-add"
      className="mcfly-panel mcfly-panel--eq-compact mcfly-spend-add"
      aria-label="Add spend"
    >
      <h2 className="mcfly-settings-template__heading">Add spend</h2>
      <p className="mcfly-panel__muted">
        Channel, amount, and day. Empty spend stays — until a number is saved.
      </p>
      <form className="mcfly-spend-add__form" onSubmit={onSubmit}>
        <div className="mcfly-spend-add__grid">
          <label className="mcfly-spend-add__field">
            <span>Channel</span>
            <select className="mcfly-field" name="channel" aria-label="Spend channel" defaultValue="meta">
              {SPEND_ENTRY_CHANNELS.map((row) => (
                <option key={row.value} value={row.value}>
                  {row.label}
                </option>
              ))}
            </select>
          </label>
          <label className="mcfly-spend-add__field">
            <span>Amount</span>
            <input
              className="mcfly-field"
              type="number"
              name="amount"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              aria-label="Spend amount"
              placeholder="Amount"
            />
          </label>
          <label className="mcfly-spend-add__field">
            <span>Day</span>
            <input
              className="mcfly-field"
              type="date"
              name="spendDate"
              aria-label="Spend day"
              defaultValue="2026-09-16"
            />
          </label>
        </div>
        <label className="mcfly-spend-add__field">
          <span>CSV</span>
          <textarea
            className="mcfly-field"
            name="spendCsv"
            aria-label="Spend CSV"
            rows={3}
            defaultValue={SPEND_CSV_EXAMPLE}
          />
        </label>
        <p className="mcfly-panel__muted">
          Example row: 2026-09-16, Meta, 100.00
        </p>
        <div className="mcfly-spend-add__actions">
          <button type="submit" className="mcfly-btn mcfly-btn--primary">
            Save spend
          </button>
        </div>
      </form>
      {error ? (
        <p className="mcfly-settings-error" role="alert">
          {error}
        </p>
      ) : null}
      {confirmation ? (
        <p className="mcfly-panel__muted" role="status">
          {confirmation}
        </p>
      ) : null}
    </section>
  );
}
