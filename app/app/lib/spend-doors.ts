/**
 * The three ways to get spend onto the desk, named on the page so a merchant
 * picks one in the first session without a tutorial. Client-safe.
 *
 * The fill-in-the-blank template is primary: it gives a merchant an explicit
 * daily spine for their full history, then accepts the same file back.
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
