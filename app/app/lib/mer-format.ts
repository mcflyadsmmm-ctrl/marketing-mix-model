export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMer(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(2);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
