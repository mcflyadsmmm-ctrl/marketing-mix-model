/**
 * Desk IA ranks — what to look at first vs secondary detail.
 * ADD ONLY: lanes wrap existing heroes. They never remove a niche board.
 */

export const DESK_LANE_RANKS = ["first", "next", "more"] as const;

export type DeskLaneRank = (typeof DESK_LANE_RANKS)[number];

export const DESK_LANE_HINT: Record<DeskLaneRank, string> = {
  first: "Look here first",
  next: "Then",
  more: "More detail",
};

export const DESK_DRILL_MORE = "More about this number";

export function deskLaneHint(rank: DeskLaneRank, hint?: string): string {
  if (hint && hint.trim()) return hint.trim();
  switch (rank) {
    case "first":
      return DESK_LANE_HINT.first;
    case "next":
      return DESK_LANE_HINT.next;
    case "more":
      return DESK_LANE_HINT.more;
    default: {
      const _never: never = rank;
      return _never;
    }
  }
}

export function deskLaneFoldLabel(label: string, open: boolean): string {
  const trimmed = label.trim() || "detail";
  return open ? `Hide ${trimmed}` : `Show ${trimmed}`;
}
