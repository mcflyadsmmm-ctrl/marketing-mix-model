/**
 * Shared bar / column geometry — the line explorers already share hover
 * coalescing via chart-smooth. Bars were still inventing width, gap, and
 * corner radius per chart, which is why 90-day day views turned into
 * hairline needles and sparse grain looked like fat blocks.
 */

export type ChartBarKind = "single" | "pair" | "stack";

export type ChartBarLayout = {
  band: number;
  barW: number;
  rx: number;
  pairW: number;
  pairGap: number;
  pairBarW: number;
  barX: (index: number) => number;
  centerX: (index: number) => number;
  pairX: (index: number) => number;
};

function fillRatio(count: number, kind: ChartBarKind): number {
  const dense =
    count <= 7 ? 0.52 : count <= 14 ? 0.56 : count <= 31 ? 0.62 : count <= 60 ? 0.72 : 0.82;
  switch (kind) {
    case "single":
      return dense;
    case "pair":
      return Math.min(0.78, dense + 0.06);
    case "stack":
      return Math.min(0.8, dense + 0.02);
    default: {
      const _never: never = kind;
      return _never;
    }
  }
}

function clampBarWidth(raw: number, band: number, count: number): number {
  const minW =
    count >= 50 ? Math.max(2.4, band * 0.68) : count >= 24 ? 3.2 : Math.min(4.5, band * 0.7);
  const maxW = count <= 8 ? Math.min(band * 0.64, 48) : count <= 16 ? 40 : Math.min(band * 0.88, 36);
  return Math.min(maxW, Math.max(minW, raw));
}

/** Adaptive column fill — sparse charts breathe, dense day series pack. */
export function chartBarWidth(
  band: number,
  count: number,
  kind: ChartBarKind = "single",
): number {
  if (!(band > 0) || count <= 0) return 0;
  return clampBarWidth(band * fillRatio(count, kind), band, count);
}

export function chartBarRadius(barW: number): number {
  if (!(barW > 0)) return 0;
  if (barW < 3) return 0.6;
  if (barW < 6) return 1.2;
  if (barW < 12) return 2;
  return 2.6;
}

export function chartPairInnerGap(pairW: number): number {
  return pairW >= 16 ? 1.2 : 0.6;
}

/**
 * How many x-axis date marks to aim for. Always keep first + last via
 * overviewChartLabelIndices — this only sets the thinning budget.
 */
export function chartXAxisMaxLabels(count: number): number {
  if (count <= 8) return count;
  if (count <= 16) return 8;
  if (count <= 40) return 7;
  return 6;
}

export function chartBarLayout(args: {
  plotLeft: number;
  plotWidth: number;
  count: number;
  kind?: ChartBarKind;
}): ChartBarLayout {
  const kind = args.kind ?? "single";
  const count = Math.max(0, args.count);
  const band = count > 0 && args.plotWidth > 0 ? args.plotWidth / count : 0;
  const filled = chartBarWidth(band, count, kind);
  const pairW = kind === "pair" ? filled : filled;
  const pairGap = kind === "pair" ? chartPairInnerGap(pairW) : 0;
  const pairBarW = kind === "pair" ? Math.max(1, (pairW - pairGap) / 2) : filled;
  const barW = kind === "pair" ? pairBarW : filled;
  const rx = chartBarRadius(barW);

  const barX = (index: number) =>
    args.plotLeft + band * index + (band - (kind === "pair" ? pairW : barW)) / 2;
  const centerX = (index: number) => args.plotLeft + band * index + band / 2;
  const pairX = (index: number) => args.plotLeft + band * index + (band - pairW) / 2;

  return {
    band,
    barW,
    rx,
    pairW,
    pairGap,
    pairBarW,
    barX,
    centerX,
    pairX,
  };
}

export function chartBarPlotClassName(
  hot: boolean,
  extra?: string | null,
): string {
  return ["mcfly-chart__plot", hot ? "mcfly-chart__plot--hot" : null, extra]
    .filter(Boolean)
    .join(" ");
}

export function chartBarShellClassName(base: string, hot: boolean): string {
  return hot ? `${base} mcfly-chart--hot` : base;
}
