/**
 * The three ways to get spend onto the desk, named on the page so a merchant
 * picks one in the first session without a tutorial. Client-safe.
 */

export type SpendDoor = {
  href: string;
  title: string;
  /** What it is for, in the merchant's terms. */
  hint: string;
};

export const SPEND_DOORS: readonly SpendDoor[] = [
  {
    href: "#mcfly-spend-add",
    title: "Add a day",
    hint: "One channel, one date, one amount.",
  },
  {
    href: "#mcfly-spend-recurring",
    title: "Daily amount until I change it",
    hint: "Meta $40 a day from this date until you stop it.",
  },
  {
    href: "/app/spend/import",
    title: "Import or backfill",
    hint: "Template, Ads Manager CSV, or spread one bill across days.",
  },
] as const;

export const SPEND_IMPORT_DOORS: readonly SpendDoor[] = [
  {
    href: "#mcfly-spend-platforms",
    title: "Download Template and Upload",
    hint: "Fill daily spend back to the history floor. Start here.",
  },
  {
    href: "#mcfly-spend-csv",
    title: "Upload an Ads Manager CSV",
    hint: "Already have a daily export? Paste or upload it.",
  },
  {
    href: "#mcfly-spend-add",
    title: "Add one bill",
    hint: "Helper for one channel, amount, and date range.",
  },
] as const;
