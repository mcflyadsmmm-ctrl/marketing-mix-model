/**
 * Desk wiring for {@link liveDeskTabAllowed}.
 *
 * SAMPLE freeze paints the Snowdevil book (watermark stays on the data-mode
 * bar). Live stage closes Customers / Growth / LTV until that rung is open.
 * Overview and Orders stay on their existing routes: at `overview_orders`
 * those surfaces are allowed, and `/app/orders` still redirects Home.
 */

import { deskPanelChipsForPath, type DeskPanelChip } from "./desk-panel-rail";
import {
  liveDeskTabAllowed,
  type LiveUnparkStage,
  type LiveUnparkTab,
} from "./live-unpark";

export type LiveDeskNavState = {
  stage: LiveUnparkStage;
  sampleDesk: boolean;
  customersLocked: boolean;
  growthLocked: boolean;
  ltvLocked: boolean;
};

export type CustomersLivePageDecision =
  | {
      serve: "locked";
      stage: LiveUnparkStage;
      copy: string;
    }
  | {
      serve: "open";
      stage: LiveUnparkStage;
      sampleDesk: boolean;
      ltvOpen: boolean;
      growthOpen: boolean;
    };

/** SAMPLE desk bypasses the stage gate. Live honors `liveDeskTabAllowed`. */
export function liveDeskSurfaceOpen(input: {
  sampleDesk: boolean;
  stage: LiveUnparkStage;
  surface: LiveUnparkTab;
}): boolean {
  if (input.sampleDesk) return true;
  return liveDeskTabAllowed(input.surface, input.stage);
}

export function liveDeskLockedCopy(
  surface: "customers" | "growth" | "ltv",
  stage: LiveUnparkStage,
): string {
  switch (surface) {
    case "customers":
      if (stage === "overview_orders") {
        return "Customers, Growth, and LTV are locked while Live is on Overview and Orders. This page is empty on purpose. Returning dollars are not on this rung — not $0.";
      }
      return "Customers, Growth, and LTV are locked at this Live stage. This page is empty on purpose — not $0.";
    case "growth":
      return "Growth is locked at this Live stage. Come-back stays empty — not $0.";
    case "ltv":
      return "LTV is locked at this Live stage. First 90 days and the year stay empty until that rung opens — not $0.";
    default: {
      const _never: never = surface;
      return _never;
    }
  }
}

/**
 * `/app/customers` is the Customers tab. When that tab is closed the page
 * does not load Live returning dollars, Growth, or LTV. When Customers is
 * open, Growth and LTV still follow their own rungs.
 */
export function customersLivePageDecision(input: {
  sampleDesk: boolean;
  stage: LiveUnparkStage;
}): CustomersLivePageDecision {
  if (input.sampleDesk) {
    return {
      serve: "open",
      stage: input.stage,
      sampleDesk: true,
      ltvOpen: true,
      growthOpen: true,
    };
  }
  const customers = liveDeskTabAllowed("customers", input.stage);
  const growth = liveDeskTabAllowed("growth", input.stage);
  const ltv = liveDeskTabAllowed("ltv", input.stage);
  if (!customers) {
    return {
      serve: "locked",
      stage: input.stage,
      copy: liveDeskLockedCopy("customers", input.stage),
    };
  }
  return {
    serve: "open",
    stage: input.stage,
    sampleDesk: false,
    ltvOpen: ltv,
    growthOpen: growth,
  };
}

export function liveDeskNavState(input: {
  sampleDesk: boolean;
  stage: LiveUnparkStage;
}): LiveDeskNavState {
  const decision = customersLivePageDecision(input);
  if (decision.serve === "locked") {
    return {
      stage: input.stage,
      sampleDesk: false,
      customersLocked: true,
      growthLocked: true,
      ltvLocked: true,
    };
  }
  return {
    stage: input.stage,
    sampleDesk: input.sampleDesk,
    customersLocked: false,
    growthLocked: !decision.growthOpen,
    ltvLocked: !decision.ltvOpen,
  };
}

export function deskNavLabel(
  item: { path: string; label: string },
  nav: Pick<LiveDeskNavState, "customersLocked">,
): string {
  if (item.path === "/app/customers" && nav.customersLocked) {
    return "Customers · locked";
  }
  return item.label;
}

export function liveDeskPanelChips(
  pathname: string,
  liveDeskNav: LiveDeskNavState | null,
): readonly (DeskPanelChip & { locked: boolean })[] {
  const chips = deskPanelChipsForPath(pathname);
  if (!liveDeskNav) {
    return chips.map((item) => ({ ...item, locked: false }));
  }
  const onCustomers = chips.some((item) => item.panel === "returning");
  if (onCustomers && liveDeskNav.customersLocked) return [];
  return chips.map((item) => {
    if (item.panel === "ltv" && liveDeskNav.ltvLocked) {
      return { ...item, label: "LTV · locked", locked: true };
    }
    if (item.panel === "growth" && liveDeskNav.growthLocked) {
      return { ...item, label: "Growth · locked", locked: true };
    }
    return { ...item, locked: false };
  });
}

/** Locked Customers URL. Drops `panel` so Growth / LTV are not selected. */
export function customersStageLockedPath(request: Request): string {
  const url = new URL(request.url);
  const next = new URLSearchParams(url.searchParams);
  next.delete("panel");
  const qs = next.toString();
  return `/app/customers${qs ? `?${qs}` : ""}`;
}
