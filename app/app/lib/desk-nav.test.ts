import { describe, expect, it } from "vitest";
import { deskNavHref, deskNavHrefFromSearch } from "./desk-nav";
import { spendAddHref, SPEND_ADD_HREF } from "./number-honesty";

describe("deskNavHref", () => {
  it("keeps period and shot, drops host/shop, and can hash to Add spend", () => {
    expect(deskNavHref("/app/spend")).toBe("/app/spend");
    expect(deskNavHref("/app/spend", { period: "lm" })).toBe(
      "/app/spend?period=lm",
    );
    expect(
      deskNavHref("/app", { period: "mtd", shot: true, hash: "mcfly-spend-add" }),
    ).toBe("/app?period=mtd&shot=1#mcfly-spend-add");
    expect(
      deskNavHrefFromSearch(
        "/app/goals",
        new URLSearchParams("period=ytd&host=abc&shop=x.myshopify.com"),
      ),
    ).toBe("/app/goals?period=ytd");
  });

  it("spend-add deep link stays the empty-opts default and can carry the clock", () => {
    expect(spendAddHref()).toBe(SPEND_ADD_HREF);
    expect(spendAddHref({ period: "lm" })).toBe(
      "/app/spend?period=lm#mcfly-spend-add",
    );
  });
});
