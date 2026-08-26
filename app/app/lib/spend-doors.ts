/**
 * The three ways to get spend onto the desk, named on the page so a merchant
 * picks one in the first session without a tutorial. Client-safe.
 *
 * Order is fastest-first: typing one bill beats picking a template, which beats
 * wrangling an Ads Manager export.
 */

export type SpendDoor = {
  /** Anchor on /app/spend. */
  href: string;
  title: string;
  /** What it is for, in the merchant's terms. */
  hint: string;
};

export const SPEND_DOORS: readonly SpendDoor[] = [
  {
    href: "#mcfly-spend-add",
    title: "Type it",
    hint: "One channel, one amount, one period. Fastest — start here.",
  },
  {
    href: "#mcfly-spend-csv",
    title: "Paste or upload a CSV",
    hint: "Already have an Ads Manager export? Drop it in.",
  },
  {
    href: "#mcfly-spend-platforms",
    title: "Pick your channels",
    hint: "Get a template shaped like the channels you actually buy.",
  },
] as const;
