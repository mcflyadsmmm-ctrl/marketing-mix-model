/**
 * One saved Total ROAS target for the public desk.
 * Session only — the public demo has no shop row.
 * Spend grades "at goal" only after this number is saved.
 */

export const SAVED_TARGET_STORAGE_KEY = "mcfly.savedTarget";

export function parseSavedTarget(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}

export function readSavedTarget(): number | null {
  if (typeof sessionStorage === "undefined") return null;
  return parseSavedTarget(sessionStorage.getItem(SAVED_TARGET_STORAGE_KEY));
}

export function writeSavedTarget(value: number): void {
  sessionStorage.setItem(SAVED_TARGET_STORAGE_KEY, String(value));
}
