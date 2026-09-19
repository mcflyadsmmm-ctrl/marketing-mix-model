import { SHARE_MIN_ORDERS } from "./shareable-insights";

export type DeskScaleInput = {
  orderCount: number;
  identifiedBuyers: number;
  returningBuyers: number;
  returningSales: number;
  hasPriorYear: boolean;
  historyLimited: boolean;
  hasSpend: boolean;
};

export type DeskScale = {
  universal: true;
  hasOrders: boolean;
  hasBuyers: boolean;
  hasRepeats: boolean;
  hasPriorYear: boolean;
  hasCohortDesk: boolean;
  hasLtvYear: boolean;
  hasSpend: boolean;
};

/** What this shop’s desk can honestly show. Empty spend stays a gap — never 0.00×. */
export function deskScale(input: DeskScaleInput): DeskScale {
  return {
    universal: true,
    hasOrders: input.orderCount > 0,
    hasBuyers: input.identifiedBuyers > 0 || input.orderCount > 0,
    hasRepeats: input.returningBuyers > 0 || input.returningSales > 0,
    hasPriorYear: input.hasPriorYear,
    hasCohortDesk: input.identifiedBuyers >= SHARE_MIN_ORDERS,
    hasLtvYear: input.identifiedBuyers >= 1 && !input.historyLimited,
    hasSpend: input.hasSpend,
  };
}
