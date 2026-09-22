import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DeskLane } from "../components/DeskLane";
import {
  deskLaneOpenAfterDefaultOpen,
  deskLaneTargetOpensFold,
} from "./desk-lane";

describe("DeskLane component — later defaultOpen is the cook, not a prop grep", () => {
  it("keeps a button fold with aria-expanded and hidden, never native details", () => {
    const closed = renderToStaticMarkup(
      createElement(
        DeskLane,
        {
          rank: "more",
          label: "Who the dollars sit with",
          fold: true,
          defaultOpen: false,
        },
        createElement("p", { id: "mcfly-spend-add" }, "Add a day"),
      ),
    );
    expect(closed).toContain("mcfly-lane__toggle");
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).toContain("hidden");
    expect(closed).toContain("Show Who the dollars sit with");
    expect(closed).not.toContain("<details");

    const opened = renderToStaticMarkup(
      createElement(
        DeskLane,
        {
          rank: "more",
          label: "More order detail",
          fold: true,
          defaultOpen: true,
        },
        createElement("p", { id: "mcfly-mix-close" }, "Weekday"),
      ),
    );
    expect(opened).toContain('aria-expanded="true"');
    expect(opened).toContain("Hide More order detail");
    expect(opened).not.toContain("<details");
  });

  it("a later defaultOpen / hash on the folded body opens; flipping false does not shut", () => {
    let open = false;
    open = deskLaneOpenAfterDefaultOpen(open, false);
    expect(open).toBe(false);
    open = deskLaneOpenAfterDefaultOpen(open, true);
    expect(open).toBe(true);
    open = deskLaneOpenAfterDefaultOpen(open, false);
    expect(open).toBe(true);

    const body = { contains: () => false };
    const fold = { contains: (other: unknown) => other === body };
    expect(deskLaneTargetOpensFold(body, fold)).toBe(true);
  });
});
