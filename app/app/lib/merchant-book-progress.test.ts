import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { orderRowWindowDayCount } from "./live-ingest-depth";
import {
  LIVE_SALES_ERROR,
  dayOneOrdersCopy,
  describeBookLoad,
  historyLoadCopy,
  loadedBookRangeLine,
  monthsFinishedPhrase,
} from "./merchant-book-progress";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "../..");

/** Wednesday inside September so this month has closed days. */
const NOW = new Date(Date.UTC(2026, 8, 24, 15, 0, 0));

function load(partial: {
  completeDays: number;
  windowDays: number;
  remainingDays: number;
}) {
  return { ...partial, now: NOW };
}

describe("describeBookLoad", () => {
  it("keeps this month usable and counts only finished prior months", () => {
    const early = describeBookLoad(
      load({ completeDays: 10, windowDays: 730, remainingDays: 720 }),
    );
    expect(early.kind).toBe("this_month_ready");
    expect(early.monthsFinished).toBe(0);
    expect(early.partial).toBe(true);
    expect(early.bookSealed).toBe(false);

    const withAugust = describeBookLoad(
      load({ completeDays: 23 + 31, windowDays: 730, remainingDays: 676 }),
    );
    expect(withAugust.monthsFinished).toBe(1);
    expect(monthsFinishedPhrase(withAugust.monthsFinished)).toBe(
      "1 month finished",
    );
  });

  it("does not call a short finished window the 24-month book", () => {
    const short = describeBookLoad(
      load({ completeDays: 90, windowDays: 90, remainingDays: 0 }),
    );
    expect(short.bookSealed).toBe(false);
    expect(short.partial).toBe(true);
  });

  it("seals only when the window is the 24-month book and nothing is left", () => {
    const fullDays = orderRowWindowDayCount(NOW);
    const sealed = describeBookLoad(
      load({
        completeDays: fullDays,
        windowDays: fullDays,
        remainingDays: 0,
      }),
    );
    expect(sealed.kind).toBe("sealed");
    expect(sealed.bookSealed).toBe(true);
    expect(sealed.monthsFinished).toBe(24);
  });
});

describe("stored month counts", () => {
  it("uses the crawl’s months finished and does not recount days", () => {
    const copy = historyLoadCopy({
      completeDays: 2,
      windowDays: 730,
      remainingDays: 700,
      monthsFinished: 3,
      bookSealed: false,
      now: NOW,
    });
    expect(copy?.heading).toBe("This month is ready");
    expect(copy?.body).toContain("3 months finished");
    expect(copy?.body).not.toMatch(/%/);

    expect(
      loadedBookRangeLine({
        completeDays: 2,
        windowDays: 730,
        remainingDays: 0,
        monthsFinished: 24,
        bookSealed: true,
        now: NOW,
      }),
    ).toBe("The 24-month book is sealed.");
  });
});

describe("historyLoadCopy", () => {
  it("names months finished and never a percent", () => {
    const copy = historyLoadCopy(
      load({ completeDays: 12, windowDays: 90, remainingDays: 78 }),
    );
    expect(copy?.heading).toBe("This month is ready");
    expect(copy?.body).toMatch(/newest first/);
    expect(copy?.body).toMatch(/0 months finished/);
    expect(`${copy?.heading} ${copy?.body}`).not.toMatch(/%/);
    expect(copy?.body).not.toMatch(/\d+ of \d+/);
  });

  it("says this month is still loading when no closed day is on file", () => {
    const copy = historyLoadCopy(
      load({ completeDays: 0, windowDays: 730, remainingDays: 730 }),
    );
    expect(copy?.heading).toBe("This month is still loading");
    expect(copy?.body).toMatch(/0 months finished/);
    expect(copy?.body).toMatch(/newest first/);
    expect(copy?.body).toMatch(/not \$0|Nothing on the desk is \$0/);
  });

  it("stays quiet once the open window has no days left", () => {
    expect(
      historyLoadCopy(
        load({ completeDays: 90, windowDays: 90, remainingDays: 0 }),
      ),
    ).toBeNull();
  });
});

describe("loadedBookRangeLine", () => {
  it("says the range is partial while months are still loading", () => {
    const line = loadedBookRangeLine(
      load({ completeDays: 23 + 31, windowDays: 730, remainingDays: 676 }),
    );
    expect(line).toMatch(/Customers and LTV/);
    expect(line).toMatch(/1 month finished/);
    expect(line).toMatch(/range is partial/);
    expect(line).not.toMatch(/%/);
    expect(line).not.toMatch(/sealed/);
  });

  it("says when the 24-month book is sealed", () => {
    const fullDays = orderRowWindowDayCount(NOW);
    expect(
      loadedBookRangeLine(
        load({
          completeDays: fullDays,
          windowDays: fullDays,
          remainingDays: 0,
        }),
      ),
    ).toBe("The 24-month book is sealed.");
  });

  it("stays off the sample desk", () => {
    expect(
      loadedBookRangeLine({
        ...load({ completeDays: 10, windowDays: 730, remainingDays: 720 }),
        sample: true,
      }),
    ).toBeNull();
  });
});

describe("dayOneOrdersCopy", () => {
  it("opens on Orders with a flat trial and ads off", () => {
    const copy = dayOneOrdersCopy({
      orderCount: 0,
      completeDays: 0,
      windowDays: 730,
      remainingDays: 730,
      salesPending: true,
      now: NOW,
    });
    expect(copy?.heading).toBe("Orders");
    expect(copy?.body).toMatch(/7 days, then \$39 per store per month, flat/);
    expect(copy?.body).toMatch(/Ads stay off/);
    expect(copy?.body).toMatch(/not sample numbers/);
    expect(copy?.body).not.toMatch(/pixel|path credit|MTA|%/i);
  });

  it("names an empty shop without borrowing sample numbers", () => {
    const copy = dayOneOrdersCopy({
      orderCount: 0,
      completeDays: 90,
      windowDays: 90,
      remainingDays: 0,
      salesPending: false,
      now: NOW,
    });
    expect(copy?.heading).toBe("No orders yet");
    expect(copy?.body).toMatch(/not sample numbers/);
    expect(copy?.body).toMatch(/not \$0/);
    expect(copy?.body).not.toMatch(/24-month book is sealed/);
  });

  it("does not greet a sample desk as a live shop", () => {
    expect(
      dayOneOrdersCopy({
        orderCount: 0,
        completeDays: 0,
        windowDays: 730,
        remainingDays: 730,
        salesPending: true,
        sample: true,
        now: NOW,
      }),
    ).toBeNull();
  });
});

describe("live sales error and app url", () => {
  it("keeps sample numbers off a failed live load", () => {
    expect(LIVE_SALES_ERROR).toMatch(/Sample shop/);
    expect(LIVE_SALES_ERROR).toMatch(/this shop/);
    expect(LIVE_SALES_ERROR).not.toMatch(/%/);
  });

  it("keeps application_url on the Fly host", () => {
    for (const file of [
      "shopify.app.toml",
      "shopify.app.public.toml",
      "shopify.app.custom.toml",
    ]) {
      const text = readFileSync(join(appRoot, file), "utf8");
      expect(text, file).toMatch(
        /application_url = "https:\/\/mcfly-analytics\.fly\.dev"/,
      );
    }
  });
});
