import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelChartFrame,
  chartIndexFromPlotFraction,
  chartIndexFromViewX,
  clampChartIndex,
  scheduleChartFrame,
  type ChartPlotGeometry,
} from "./chart-smooth";

type PlotPointerTarget = {
  clientX: number;
  currentTarget: {
    getBoundingClientRect: () => { left: number; width: number };
  };
};

export function useChartHover(itemCount: number, seriesId: string) {
  const [hoverIndex, setHoverIndexState] = useState<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  const countRef = useRef(itemCount);
  countRef.current = itemCount;

  useEffect(() => {
    generationRef.current += 1;
    frameRef.current = cancelChartFrame(frameRef.current);
    setHoverIndexState(null);
    return () => {
      generationRef.current += 1;
      frameRef.current = cancelChartFrame(frameRef.current);
    };
  }, [seriesId]);

  useEffect(() => {
    setHoverIndexState((prev) => clampChartIndex(prev, itemCount));
  }, [itemCount]);

  const setHoverIndex = useCallback((index: number | null) => {
    const generation = generationRef.current;
    frameRef.current = cancelChartFrame(frameRef.current);
    frameRef.current = scheduleChartFrame(() => {
      if (generation !== generationRef.current) return;
      setHoverIndexState(clampChartIndex(index, countRef.current));
    });
  }, []);

  const clearHover = useCallback(() => {
    setHoverIndex(null);
  }, [setHoverIndex]);

  const moveFromEvent = useCallback(
    (event: PlotPointerTarget, geometry?: ChartPlotGeometry) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const next =
        geometry != null
          ? chartIndexFromViewX(
              event.clientX,
              rect.left,
              rect.width,
              geometry,
              countRef.current,
            )
          : chartIndexFromPlotFraction(
              event.clientX,
              rect.left,
              rect.width,
              countRef.current,
            );
      setHoverIndex(next);
    },
    [setHoverIndex],
  );

  return {
    hoverIndex,
    setHoverIndex,
    clearHover,
    moveFromEvent,
    onPlotPointerLeave: clearHover,
  };
}

export function useHeldChartSeries<T>(
  series: T,
  seriesId: string,
  isLoading: boolean,
): T {
  const heldRef = useRef({ id: seriesId, value: series });
  if (!isLoading) {
    heldRef.current = { id: seriesId, value: series };
  }
  return isLoading ? heldRef.current.value : series;
}

export function useCoalescedCallback<T>(apply: (value: T) => void) {
  const frameRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  const applyRef = useRef(apply);
  applyRef.current = apply;

  useEffect(() => {
    return () => {
      generationRef.current += 1;
      frameRef.current = cancelChartFrame(frameRef.current);
    };
  }, []);

  return useCallback((value: T) => {
    const generation = generationRef.current;
    frameRef.current = cancelChartFrame(frameRef.current);
    frameRef.current = scheduleChartFrame(() => {
      if (generation !== generationRef.current) return;
      applyRef.current(value);
    });
  }, []);
}
