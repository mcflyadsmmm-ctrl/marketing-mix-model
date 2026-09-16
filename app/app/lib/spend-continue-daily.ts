/**
 * First-fold spend: a typed daily amount continues until the merchant
 * changes it. One-off days are the opt-out, not the default.
 */

export function shouldContinueDailyAmount(opts: {
  continueDaily: boolean;
  editing: boolean;
  amount: number;
}): boolean {
  if (opts.editing) return false;
  if (!opts.continueDaily) return false;
  return Number.isFinite(opts.amount) && opts.amount > 0;
}

export function continueDailyCheckedDefault(editing: boolean): boolean {
  return !editing;
}
