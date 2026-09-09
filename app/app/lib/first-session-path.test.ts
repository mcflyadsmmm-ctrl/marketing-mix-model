import { describe, expect, it } from "vitest";
import { PRODUCT_NOUN } from "./product-labels";
import {
  FIRST_SESSION_MINUTES,
  firstSessionPrimaryAction,
  resolveFirstSessionPath,
} from "./first-session-path";

const THEATER =
  /pixel|web pixel|multi-touch|mta|markov|shapley|meridian|robyn|true roas|view-through|path credit/i;

function cold(
  overrides: Partial<Parameters<typeof resolveFirstSessionPath>[0]> = {},
) {
  return resolveFirstSessionPath({
    marginConfirmed: false,
    hasLiveSpend: false,
    useSampleDesk: false,
    ...overrides,
  });
}

describe("resolveFirstSessionPath", () => {
  it("starts a cold merchant on Spend — margin optional, never a Settings wall", () => {
    const path = cold();
    expect(path.showColdEmpty).toBe(true);
    expect(path.emptyKind).toBe("spend_only");
    expect(path.showFullGuide).toBe(true);
    expect(path.showMarginNudge).toBe(false);
    expect(path.cashMerReady).toBe(false);
    expect(path.ritualReady).toBe(false);
    expect(path.steps.map((s) => s.id)).toEqual([
      "spend",
      "margin",
      "desk",
      "allocation",
    ]);
    expect(path.steps[0]).toMatchObject({
      status: "current",
      href: "/app/spend",
    });
    expect(path.steps[1]).toMatchObject({
      status: "todo",
      href: "/app/settings",
    });
    expect(path.steps[1].hint).toMatch(/optional/i);
    expect(path.steps[2]).toMatchObject({ status: "todo", href: "/app" });
    expect(path.steps[3]).toMatchObject({
      status: "todo",
      href: "/app/allocation",
    });
    expect(path.primaryHref).toBe("/app/spend");
    expect(path.primaryLabel).toBe(PRODUCT_NOUN.setupAddSpend);
    expect(path.heading).toMatch(new RegExp(String(FIRST_SESSION_MINUTES)));
    expect(path.body).toMatch(/Type one day/i);
    expect(path.body).toMatch(/no file/i);
    expect(path.body).toMatch(/optional/i);
    expect(path.body).toMatch(/break-even/i);
    expect(path.steps[0].hint).toMatch(/type one day/i);
    expect(path.footerLinks.map((l) => l.href)).toEqual([
      "/app/settings",
      "/app",
      "/app/allocation",
    ]);
    expect(firstSessionPrimaryAction(path)).toEqual({
      href: "/app/spend",
      label: PRODUCT_NOUN.setupAddSpend,
    });
  });

  it("after margin confirm, empty still owns Spend — not a second Settings wall", () => {
    const path = cold({
      marginConfirmed: true,
      hasLiveSpend: false,
      useSampleDesk: false,
    });
    expect(path.emptyKind).toBe("spend_only");
    expect(path.showColdEmpty).toBe(true);
    expect(path.showFullGuide).toBe(true);
    expect(path.steps[0].status).toBe("current");
    expect(path.steps[1].status).toBe("done");
    expect(path.primaryHref).toBe("/app/spend");
    expect(path.primaryLabel).toBe(PRODUCT_NOUN.setupAddSpend);
    expect(path.body).toMatch(/Margin is set/);
    expect(path.body).toContain(PRODUCT_NOUN.definition);
  });

  it("does not hide cash MER when spend exists but margin is still open", () => {
    const path = cold({
      marginConfirmed: false,
      hasLiveSpend: true,
      useSampleDesk: false,
    });
    expect(path.showColdEmpty).toBe(false);
    expect(path.emptyKind).toBeNull();
    expect(path.showFullGuide).toBe(false);
    expect(path.showMarginNudge).toBe(true);
    expect(path.cashMerReady).toBe(true);
    expect(path.ritualReady).toBe(false);
    expect(path.steps[0].status).toBe("done");
    expect(path.steps[1].status).toBe("current");
    expect(path.steps[2].status).toBe("done");
    expect(path.marginNudgeBody).toContain(PRODUCT_NOUN.definition);
    expect(path.marginNudgeBody).toContain(PRODUCT_NOUN.spendAllocation);
    expect(firstSessionPrimaryAction(path).label).toBe(
      PRODUCT_NOUN.setupAdjustMargin,
    );
  });

  it("marks Allocation current once margin and spend are in", () => {
    const path = cold({
      marginConfirmed: true,
      hasLiveSpend: true,
      useSampleDesk: false,
    });
    expect(path.showColdEmpty).toBe(false);
    expect(path.showFullGuide).toBe(false);
    expect(path.showMarginNudge).toBe(false);
    expect(path.cashMerReady).toBe(true);
    expect(path.ritualReady).toBe(true);
    expect(path.steps.map((s) => s.status)).toEqual([
      "done",
      "done",
      "done",
      "current",
    ]);
    expect(firstSessionPrimaryAction(path)).toEqual({
      href: "/app/spend",
      label: "Update spend",
    });
  });

  it("keeps SAMPLE honest — no real-store empty or setup banner", () => {
    const path = cold({
      marginConfirmed: false,
      hasLiveSpend: false,
      useSampleDesk: true,
    });
    expect(path.viewing).toBe("sample");
    expect(path.viewingHint).toMatch(/not your live Shopify till/i);
    expect(path.showColdEmpty).toBe(false);
    expect(path.showFullGuide).toBe(false);
    expect(path.showMarginNudge).toBe(false);
    expect(path.cashMerReady).toBe(true);
    expect(firstSessionPrimaryAction(path)).toEqual({
      href: "/app/spend",
      label: PRODUCT_NOUN.samplePreviewOffCta,
      postIntent: "use-real",
      postAction: "/app/data-mode",
      returnTo: "/app/spend",
    });
  });

  it("POSTs use-real for SAMPLE primary — never Demo, never a plain navigate-only switch", () => {
    const path = cold({ useSampleDesk: true });
    const action = firstSessionPrimaryAction(path);
    // `/app/data-mode` is POST-only; Overview one-taps via Form, then lands on Spend.
    expect(path.realStoreHref).toBe("/app/spend");
    expect(path.realStorePostAction).toBe("/app/data-mode");
    expect(action.postIntent).toBe("use-real");
    expect(action.postAction).toBe("/app/data-mode");
    expect(action.returnTo).toBe("/app/spend");
    expect(action.href).not.toBe("/app/demo");
    expect(action.postAction).not.toMatch(/\/app\/demo/);
    expect(action.label).toBe(PRODUCT_NOUN.samplePreviewOffCta);
    expect(action.label).toMatch(/real store/i);
  });

  it("keeps the period on the Real-store hand-off", () => {
    const path = cold({ useSampleDesk: true, search: "?period=mtd" });
    expect(path.realStoreHref).toBe("/app/spend?period=mtd");
    expect(path.realStorePostAction).toBe("/app/data-mode?period=mtd");
    const action = firstSessionPrimaryAction(path);
    expect(action.postAction).toBe("/app/data-mode?period=mtd");
    expect(action.returnTo).toBe("/app/spend?period=mtd");
  });

  it("never routes any first-session primary action to the Demo tab", () => {
    const paths = [
      cold(),
      cold({ marginConfirmed: true }),
      cold({ hasLiveSpend: true }),
      cold({ marginConfirmed: true, hasLiveSpend: true }),
      cold({ useSampleDesk: true }),
      cold({ useSampleDesk: true, hasLiveSpend: true }),
      cold({ useSampleDesk: true, shotMode: true }),
    ];
    for (const path of paths) {
      const { href, label, postAction } = firstSessionPrimaryAction(path);
      expect(href).not.toMatch(/\/app\/demo/);
      expect(postAction ?? "").not.toMatch(/\/app\/demo/);
      expect(label).not.toMatch(/demo/i);
    }
  });

  it("never treats shot mode as a first-session empty", () => {
    const path = cold({ shotMode: true });
    expect(path.showColdEmpty).toBe(false);
    expect(path.showFullGuide).toBe(false);
    expect(path.showMarginNudge).toBe(false);
  });

  it("preserves query strings on ritual hrefs", () => {
    const path = cold({ search: "?period=mtd" });
    expect(path.primaryHref).toBe("/app/spend?period=mtd");
    expect(path.steps[0].href).toBe("/app/spend?period=mtd");
    expect(path.steps[1].href).toBe("/app/settings?period=mtd");
    expect(path.steps[3].href).toBe("/app/allocation?period=mtd");
    expect(path.realStoreHref).toBe("/app/spend?period=mtd");
    expect(path.realStorePostAction).toBe("/app/data-mode?period=mtd");
  });

  it("shows full guide after Sample → Real with no spend yet", () => {
    const path = cold({ forceGuide: true });
    expect(path.showFullGuide).toBe(true);
    expect(path.showColdEmpty).toBe(true);
    expect(path.guideNote).toMatch(/optional/i);
  });

  it("refuses attribution-theater copy on the first-session path", () => {
    const paths = [
      cold(),
      cold({ marginConfirmed: true, hasLiveSpend: false, useSampleDesk: false }),
      cold({ marginConfirmed: false, hasLiveSpend: true, useSampleDesk: false }),
      cold({ marginConfirmed: true, hasLiveSpend: true, useSampleDesk: false }),
      cold({ useSampleDesk: true }),
    ];
    for (const path of paths) {
      const blob = [
        path.heading,
        path.body,
        path.guideHeading,
        path.guideNote,
        path.marginNudgeHeading,
        path.marginNudgeBody,
        path.viewingHint,
        ...path.steps.flatMap((s) => [s.label, s.hint]),
      ].join("\n");
      expect(blob).not.toMatch(THEATER);
      expect(blob).not.toMatch(/mcflyads\.com/i);
      expect(blob).not.toMatch(/gmv/i);
      expect(blob).not.toMatch(/Free|Pro ·|upgrade/i);
    }
  });
});
