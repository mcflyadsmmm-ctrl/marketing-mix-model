/** Shop ISO 4217 currency + cent rounding for spend writes. */

const ISO_4217 = /^[A-Z]{3}$/;

/** Persistable ISO code. Unknown / empty → USD (legacy rows and SAMPLE). */
export function shopCurrencyCode(code: string | null | undefined): string {
  const normalized = (code ?? "").trim().toUpperCase();
  return ISO_4217.test(normalized) ? normalized : "USD";
}

/** Round to cents so Float/Decimal writes don't drift (0.1 + 0.2). */
export function roundMoney(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/** Prisma Decimal | number | string → finite number for MER math. */
export function toMoneyNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (value != null && typeof value === "object" && "toString" in value) {
    const n = Number(String(value));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** True when two stored amounts match after cent rounding. */
export function moneyEquals(left: unknown, right: unknown): boolean {
  return roundMoney(toMoneyNumber(left)) === roundMoney(toMoneyNumber(right));
}
