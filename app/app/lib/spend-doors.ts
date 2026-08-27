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
    title: "Add spend",
    hint: "Channel, amount, when. Fastest — start here.",
  },
  {
    href: "#mcfly-spend-csv",
    title: "Paste a file",
    hint: "Drop an Ads Manager CSV or paste daily rows.",
  },
  {
    href: "#mcfly-spend-platforms",
    title: "Fill many days",
    hint: "Choose channels and dates for a blank daily template.",
  },
] as const;
