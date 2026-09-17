/**
 * Chart interaction smoothness — hover hit-testing, series hold while a
 * navigation is in flight, and abort helpers so a cancelled period/tab load
 * never paints empty sales.
 */

export type ChartPlotGeometry = {
  viewWidth: number;
  plotLeft: number;
  plotWidth: number;
};

export type ChartViewPoint = {
  x: number;
  y: number;
};

export type ExplorerPointerHover =
  | { kind: "seg"; bucketKey: string; channel: string }
  | { kind: "dot"; bucketKey: string }
  | null;

export function clampChartIndex(
  index: number | null,
  length: number,
): number | null {
  if (index == null || !Number.isFinite(index) || length <= 0) return null;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return Math.floor(index);
}

export function chartSeriesId(
  parts: ReadonlyArray<string | number | null | undefined>,
): string {
  return parts.map((part) => (part == null ? "" : String(part))).join("|");
}

export function holdChartValue<T>(
  current: T,
  held: T | null | undefined,
  isLoading: boolean,
): T {
  if (isLoading && held != null) return held;
  return current;
}

export function isChartRequestAborted(
  signal: AbortSignal | null | undefined,
): boolean {
  return Boolean(signal?.aborted);
}

export function throwIfChartRequestAborted(
  signal: AbortSignal | null | undefined,
): void {
  if (!signal?.aborted) return;
  const reason = signal.reason;
  if (reason instanceof DOMException) throw reason;
  throw new DOMException("Chart request aborted", "AbortError");
}

export function isChartAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (
    typeof error === "object" &&
    error != null &&
    "name" in error &&
    (error as { name?: string }).name === "AbortError"
  ) {
    return true;
  }
  return false;
}

export function clientPointToViewBox(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  viewWidth: number,
  viewHeight: number,
): ChartViewPoint | null {
  if (!(rect.width > 0) || !(rect.height > 0)) return null;
  if (!(viewWidth > 0) || !(viewHeight > 0)) return null;
  return {
    x: ((clientX - rect.left) / rect.width) * viewWidth,
    y: ((clientY - rect.top) / rect.height) * viewHeight,
  };
}

export function chartIndexFromClientX(
  clientX: number,
  plotLeft: number,
  plotWidth: number,
  count: number,
): number | null {
  if (!(count > 0) || !(plotWidth > 0)) return null;
  const x = clientX - plotLeft;
  if (x < 0 || x > plotWidth) return null;
  return clampChartIndex(Math.floor((x / plotWidth) * count), count);
}

export function chartIndexFromViewX(
  clientX: number,
  rectLeft: number,
  rectWidth: number,
  geometry: ChartPlotGeometry,
  count: number,
): number | null {
  if (!(rectWidth > 0) || !(geometry.viewWidth > 0)) return null;
  const viewX = ((clientX - rectLeft) / rectWidth) * geometry.viewWidth;
  return chartIndexFromClientX(
    viewX,
    geometry.plotLeft,
    geometry.plotWidth,
    count,
  );
}

export function chartIndexFromPlotFraction(
  clientX: number,
  rectLeft: number,
  rectWidth: number,
  count: number,
): number | null {
  if (!(rectWidth > 0) || !(count > 0)) return null;
  const fraction = (clientX - rectLeft) / rectWidth;
  if (fraction < 0 || fraction > 1) return null;
  return clampChartIndex(Math.floor(fraction * count), count);
}

export function explorerHoverFromViewPoint(args: {
  viewX: number;
  viewY: number;
  padL: number;
  padR: number;
  padT: number;
  plotH: number;
  viewW: number;
  buckets: ReadonlyArray<{
    key: string;
    bars: ReadonlyArray<{ channel: string; amount: number }>;
  }>;
  leftCeil: number;
  merPoints: ReadonlyArray<{ key: string; x: number; y: number | null }>;
  salesLead: boolean;
}): ExplorerPointerHover {
  const {
    viewX,
    viewY,
    padL,
    padR,
    padT,
    plotH,
    viewW,
    buckets,
    leftCeil,
    merPoints,
    salesLead,
  } = args;
  const count = buckets.length;
  const plotW = viewW - padL - padR;
  if (!(count > 0) || !(plotW > 0) || !(plotH > 0)) return null;
  if (viewX < padL || viewX > padL + plotW) return null;

  const index = chartIndexFromClientX(viewX, padL, plotW, count);
  if (index == null) return null;
  const bucket = buckets[index];
  if (!bucket) return null;

  const mer = merPoints[index];
  if (
    !salesLead &&
    mer != null &&
    mer.y != null &&
    Math.abs(viewY - mer.y) <= 12
  ) {
    return { kind: "dot", bucketKey: mer.key };
  }

  if (viewY < padT || viewY > padT + plotH) {
    const fallback = bucket.bars.find((seg) => seg.amount > 0);
    return fallback
      ? { kind: "seg", bucketKey: bucket.key, channel: fallback.channel }
      : { kind: "dot", bucketKey: bucket.key };
  }

  if (leftCeil > 0) {
    let yCursor = padT + plotH;
    for (const seg of bucket.bars) {
      if (!(seg.amount > 0)) continue;
      const height = (seg.amount / leftCeil) * plotH;
      const top = yCursor - height;
      if (viewY <= yCursor && viewY >= top) {
        return { kind: "seg", bucketKey: bucket.key, channel: seg.channel };
      }
      yCursor = top;
    }
  }

  const lastSeg = [...bucket.bars].reverse().find((seg) => seg.amount > 0);
  if (lastSeg) {
    return { kind: "seg", bucketKey: bucket.key, channel: lastSeg.channel };
  }
  return { kind: "dot", bucketKey: bucket.key };
}

export function scheduleChartFrame(callback: () => void): number {
  if (typeof requestAnimationFrame === "function") {
    return requestAnimationFrame(callback);
  }
  return setTimeout(callback, 0) as unknown as number;
}

export function cancelChartFrame(handle: number | null | undefined): null {
  if (handle == null) return null;
  if (typeof requestAnimationFrame === "function") {
    cancelAnimationFrame(handle);
  } else if (typeof clearTimeout === "function") {
    clearTimeout(handle);
  }
  return null;
}

export function chartTipClassName(args: {
  open: boolean;
  edge?: "left" | "mid" | "right" | null;
  below?: boolean;
}): string {
  const classes = ["mcfly-chart__tip"];
  if (args.edge) classes.push(`mcfly-chart__tip--${args.edge}`);
  if (args.below) classes.push("mcfly-chart__tip--below");
  if (args.open) classes.push("mcfly-chart__tip--on");
  return classes.join(" ");
}
