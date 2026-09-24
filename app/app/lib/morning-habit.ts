/**
 * One morning sentence from numbers already on the desk.
 * Typical order label, returning-sales share, optional goal line.
 * Thin or pending history is an honest floor. Never $0, never 0×,
 * never a fake last year. Order history only — no ad login, no spend.
 */

export const MORNING_HABIT_FLOOR_SENTENCE =
  "Morning read waits on a typical order and returning sales from this shop’s order history.";

/** Ready history, but this read does not carry those numbers. */
export const MORNING_HABIT_SPARSE_SENTENCE =
  "Typical order and returning sales are not on this read.";

export type MorningHistory = "ready" | "thin" | "pending";

export type MorningEmptyKind = "syncing" | "thin" | "young" | "unset";

export type MorningSentenceInput = {
  /** Already formatted on the desk, such as "$84". */
  typicalOrderLabel?: string | null;
  /** Returning sales ÷ (new $ + returning $), from 0 to 1. */
  returningSalesShare?: number | null;
  /** Goal line already written on Goals. Optional. */
  goalLine?: string | null;
  history?: MorningHistory;
};

export function morningHistoryFromEmpty(kind: MorningEmptyKind): MorningHistory {
  switch (kind) {
    case "syncing":
      return "pending";
    case "thin":
    case "young":
      return "thin";
    case "unset":
      return "ready";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function moneyAmounts(text: string): number[] {
  const matches = text.match(/[$£€]\s*\d[\d,]*(?:\.\d+)?/g) ?? [];
  return matches
    .map((match) => Number(match.replace(/[^0-9.]/g, "")))
    .filter((amount) => Number.isFinite(amount));
}

function hasZeroMoney(text: string): boolean {
  return moneyAmounts(text).some((amount) => amount === 0);
}

/** A zero multiple (0× / 0.00×). Leaves a real 10× alone — we still never invent one. */
function hasZeroMultiple(text: string): boolean {
  return /(?:^|[^\d.])0+(?:\.0+)?\s*×/.test(text);
}

function mentionsFakeLastYear(text: string): boolean {
  return /last year/i.test(text);
}

function isUnsafeDeskText(text: string): boolean {
  return (
    mentionsFakeLastYear(text) || hasZeroMoney(text) || hasZeroMultiple(text)
  );
}

function safeTypicalOrder(label: string | null | undefined): string | null {
  if (label == null) return null;
  const trimmed = label.trim();
  if (!trimmed || trimmed === "—" || trimmed === "-" || /^n\/a$/i.test(trimmed)) {
    return null;
  }
  if (isUnsafeDeskText(trimmed)) return null;
  return trimmed;
}

function safeGoalLine(line: string | null | undefined): string | null {
  if (line == null) return null;
  const trimmed = line.trim();
  if (!trimmed || isUnsafeDeskText(trimmed)) return null;
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function returningLine(share: number | null | undefined): string | null {
  if (share == null || !Number.isFinite(share) || share < 0 || share > 1) {
    return null;
  }
  const pct = Math.round(share * 100);
  if (pct <= 0) {
    return share === 0
      ? "Returning buyers are not carrying sales in this window."
      : null;
  }
  return `Returning buyers carry ${pct}% of sales.`;
}

function composeReadySentence(input: MorningSentenceInput): string {
  const typical = safeTypicalOrder(input.typicalOrderLabel);
  const parts = [
    typical ? `Typical order around ${typical}.` : null,
    returningLine(input.returningSalesShare),
    safeGoalLine(input.goalLine),
  ].filter((part): part is string => part != null);

  if (parts.length === 0) return MORNING_HABIT_SPARSE_SENTENCE;
  const sentence = parts.join(" ");
  if (isUnsafeDeskText(sentence)) return MORNING_HABIT_FLOOR_SENTENCE;
  return sentence;
}

/**
 * Growth's unsealed read ends in "— not $0." That hedge is honest on screen
 * and would wipe the whole clipboard, because a painted $0 is refused.
 * Keep the buyer count. Leave the on-screen line alone.
 */
export function growthCopyLine(line: string): string {
  return line.replace(/\s*—\s*not \$0\.?/, "").trim();
}

export function morningSentence(
  input: MorningSentenceInput = {},
): string {
  const history: MorningHistory = input.history ?? "ready";
  switch (history) {
    case "thin":
    case "pending":
      return MORNING_HABIT_FLOOR_SENTENCE;
    case "ready":
      return composeReadySentence(input);
    default: {
      const _exhaustive: never = history;
      return _exhaustive;
    }
  }
}

export type HabitMorningTargetSource = "typed" | "sample" | "average";

function paintedMoney(label: string | null | undefined): string | null {
  const safe = safeTypicalOrder(label);
  if (!safe || /^[\d,.\s]+$/.test(safe)) return null;
  return safe;
}

/**
 * Goals copy uses shop-currency labels from the board.
 * Bare "120,000" is not a sentence a teammate can paste.
 */
export function habitMorningGoalLine(input: {
  returningActual?: string | null;
  returningTarget?: string | null;
  returningPct?: number | null;
  returningMet?: boolean;
  targetSource?: HabitMorningTargetSource | null;
  ltvActual?: string | null;
  ltvWindow?: string | null;
}): string | null {
  const parts: string[] = [];
  const ltvActual = paintedMoney(input.ltvActual);
  const ltvWindow = input.ltvWindow?.trim();
  if (ltvActual && ltvWindow) {
    parts.push(
      `A new buyer is worth ${ltvActual} in the ${ltvWindow} — Target Line is that average, not a goal you set.`,
    );
  }

  const actual = paintedMoney(input.returningActual);
  const target = paintedMoney(input.returningTarget);
  const source = input.targetSource;
  if (actual && source) {
    const pct =
      input.returningPct != null && Number.isFinite(input.returningPct)
        ? Math.round(input.returningPct * 100)
        : null;
    switch (source) {
      case "sample":
        if (target && (input.returningMet || pct != null)) {
          parts.push(
            input.returningMet
              ? `Returning buyers already carry ${actual} this year — at the example stretch ${target} (example, not a target you typed).`
              : `Returning buyers carry ${actual} this year — ${pct}% of the example stretch ${target} (example, not a target you typed).`,
          );
        }
        break;
      case "typed":
        if (target && (input.returningMet || pct != null)) {
          parts.push(
            input.returningMet
              ? `Returning buyers already carry ${actual} this year — at your ${target} target.`
              : `Returning buyers carry ${actual} this year — ${pct}% of your ${target} target.`,
          );
        }
        break;
      case "average":
        parts.push(`Returning buyers carry ${actual} this year.`);
        break;
      default: {
        const _exhaustive: never = source;
        return _exhaustive;
      }
    }
  }

  if (parts.length === 0) return null;
  const line = parts.join(" ");
  if (isUnsafeDeskText(line)) return null;
  return line;
}
