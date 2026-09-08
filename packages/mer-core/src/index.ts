export {
  calculateMer,
  calculateAmer,
  calculateBreakEvenMer,
  computeContributionMarginFromStack,
  isAboveBreakEven,
  formatMer,
  type CostStackInput,
} from "./mer.js";

export {
  suggestAllocation,
  portfolioCutPercent,
  clampSpendFloorCutPct,
  SPEND_FLOOR_PCT,
  spendFloorMaxCutPct,
  type AllocationChannelInput,
  type AllocationAction,
  type ChannelEfficiency,
  type SuggestAllocationInput,
  type SuggestAllocationResult,
} from "./allocation.js";
