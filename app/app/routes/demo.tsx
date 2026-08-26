import type { MetaFunction } from "react-router";

import { OriginShell } from "./_index/OriginShell";
import styles from "./_index/styles.module.css";

/**
 * `/demo` used to be a static `site/demo.html` with no matching Remix route,
 * so `/demo.data` answered 404 while `/demo` answered 200 — a page and its
 * data route disagreeing on the same origin. It also still carried a retired
 * pitch: a named example shop, third-party pipe vendors, and a claim of
 * parity with ad-platform reporting.
 *
 * This is deliberately a description of the Sample desk rather than an
 * embedded copy of it: every control on the real chart is a link into
 * `/app/*`, and client-navigating a logged-out visitor into the embedded app
 * is exactly the kind of dead-end this route exists to remove.
 */
export const meta: MetaFunction = () => [
  { title: "Sample desk — Mcfly Analytics" },
  {
    name: "description",
    content:
      "See ad spend beside Shopify sales, day by day. Sample data shows the whole desk before you switch to Live data. 7-day full-access trial, then $39 per store per month.",
  },
];

export default function DemoPage() {
  return (
    <OriginShell>
      <main id="main" className={styles.article}>
        <h1>The Sample desk</h1>
        <p className={styles.lede}>
          Every Mcfly install opens on Sample data — a full example shop you can
          click around before you point it at your own numbers. Switch to Live
          data whenever you want; those are the only two views.
        </p>

        <h2>What the desk shows</h2>
        <ul>
          <li>
            Your ad spend by channel, day by day, stacked against that day’s
            Shopify sales. Stacked bar or line, on day, week, month or quarter
            buckets.
          </li>
          <li>
            <strong>Cash left after ads</strong> — sales minus spend, per day.
            Not profit: Mcfly does not read your cost per item, so it never
            pretends to know your margin.
          </li>
          <li>
            Mix percent — where the money went. Never a claim about which
            channel caused the sale.
          </li>
          <li>
            New versus returning customer cash beside the spend that ran over
            the same dates, with Cash CAC. Dates aligned, not attribution.
          </li>
          <li>This week against last week, on the same chart.</li>
          <li>Your sales goal restated as dollars of leftover cash.</li>
        </ul>

        <h2>Billboards are a channel</h2>
        <p>
          Type <strong>$400 billboard</strong> next to yesterday’s sales and it
          becomes its own series in its own colour — not a grey “Other” lump.
          Anything you buy counts: print, radio, podcasts, a sponsorship,
          an agency retainer.
        </p>

        <h2>Days with no spend are $0, not guesses</h2>
        <p>
          A day you did not run ads shows as a $0 hole in the mix, and the till
          for that day still shows what it sold. Mcfly never interpolates spend
          you did not enter and never fills a gap to make a chart look tidy.
        </p>

        <h2>How the numbers get in</h2>
        <p>
          Sales come from Shopify. Spend is whatever you type or paste — one
          day’s invoice, or an Ads Manager CSV export when you have many days.
          No pixel, no ad-account login, no tracking script.
        </p>

        <h2>Pricing</h2>
        <p>
          A 7-day full-access trial, then $39 per store per month for the whole
          desk. See <a href="/pricing">Pricing</a>, or{" "}
          <a href="/support">Support</a> if you have a question first.
        </p>
      </main>
    </OriginShell>
  );
}
