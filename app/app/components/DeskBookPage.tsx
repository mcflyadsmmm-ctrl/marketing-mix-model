import { useEffect, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { MorningHabitStrip } from "./MorningHabitStrip";
import { PeriodControl } from "./PeriodControl";
import { SalesLoadError } from "./SalesLoadError";
import { deskBookHonestyNotices } from "../lib/desk-history";
import type { LiveIngestDepth } from "../lib/live-ingest-depth";
import {
  orderHistoryProgressMessage,
  truncatedOrderFactsMessage,
  type OrderHistoryProgressInput,
} from "../lib/cash-trust-copy";
import type { PeriodPreset } from "../lib/periods";

export function DeskBookPage({
  heading,
  tillLabel,
  preset,
  shotMode,
  useSampleDesk,
  isLoading,
  showPeriod = true,
  orderBookDepth,
  orderFactsTruncated = false,
  orderBackfillProgress = null,
  todaySalesTruncated = false,
  todaySalesUnavailable = false,
  shopifyOrderWindowLimited = false,
  periodLabel = "",
  salesError = false,
  salesErrorBody = "Sales didn’t load. Retry to see this shop’s orders.",
  retryHref,
  children,
}: {
  heading: string;
  tillLabel: string;
  preset: PeriodPreset;
  shotMode: boolean;
  useSampleDesk: boolean;
  isLoading: boolean;
  /** False when clocks are baked into the cards (YoY this / last / last year). */
  showPeriod?: boolean;
  /** Trial and paid both say up to 24 months. Required even when compact. */
  orderBookDepth: LiveIngestDepth;
  /** Closed-day OrderFact crawl still running — typical order / LTV are not $0. */
  orderFactsTruncated?: boolean;
  /** Closed-day OrderFact crawl progress — X of Y when days remain. */
  orderBackfillProgress?: OrderHistoryProgressInput | null;
  /** Open-day live top-up hit the page cap — today is not a finished book. */
  todaySalesTruncated?: boolean;
  /** Open-day live top-up failed — closed days may still show. */
  todaySalesUnavailable?: boolean;
  /** Period wider than ~60-day `read_orders` — YTD / Last 12 months are not a year. */
  shopifyOrderWindowLimited?: boolean;
  periodLabel?: string;
  salesError?: boolean;
  salesErrorBody?: string;
  retryHref?: string;
  children: ReactNode;
}) {
  let panel: string | null = null;
  try {
    const [searchParams] = useSearchParams();
    const raw = searchParams.get("panel")?.trim() ?? "";
    panel = raw || null;
  } catch {
    panel = null;
  }

  useEffect(() => {
    if (!panel || typeof document === "undefined") return;
    document
      .getElementById(`mcfly-${panel}`)
      ?.scrollIntoView({ block: "start" });
  }, [panel]);

  const notices = shotMode
    ? []
    : deskBookHonestyNotices({
        periodLabel,
        todaySalesTruncated,
        todaySalesUnavailable,
        shopifyOrderWindowLimited,
      });
  const orderProgress =
    !shotMode && !shopifyOrderWindowLimited && orderBackfillProgress
      ? orderHistoryProgressMessage(orderBackfillProgress)
      : null;
  const truncatedClosedDay = truncatedOrderFactsMessage();

  return (
    <s-page heading={shotMode ? undefined : heading} inlineSize="large">
      <div
        className={[
          "mcfly-desk",
          shotMode ? "mcfly-desk--shot" : null,
          useSampleDesk ? "mcfly-desk--sample" : null,
          isLoading && !shotMode ? "mcfly-desk--loading" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {isLoading && !shotMode ? (
          <section
            className="mcfly-state mcfly-state--loading"
            aria-live="polite"
          >
            <p className="mcfly-state__copy">Refreshing this period…</p>
          </section>
        ) : null}

        <div className="mcfly-ctx" aria-live="polite">
          <div className="mcfly-ctx__main">
            <span className="mcfly-ctx__asof">{tillLabel}</span>
            {showPeriod ? (
              <PeriodControl
                preset={preset}
                shotMode={shotMode}
                compact
                orderBookDepth={orderBookDepth}
              />
            ) : null}
          </div>
        </div>

        {shotMode ? null : <MorningHabitStrip />}

        {notices.map((notice) => (
          <s-banner
            key={notice.heading}
            tone={notice.tone}
            heading={notice.heading}
          >
            <s-paragraph>{notice.body}</s-paragraph>
          </s-banner>
        ))}

        {orderProgress ? (
          <s-banner tone="info" heading={orderProgress.heading}>
            <s-paragraph>{orderProgress.body}</s-paragraph>
          </s-banner>
        ) : null}

        {orderFactsTruncated &&
        !orderProgress &&
        !shotMode &&
        !shopifyOrderWindowLimited ? (
          <p className="mcfly-book__lede">{truncatedClosedDay.body}</p>
        ) : null}

        {salesError && !shotMode && retryHref ? (
          <SalesLoadError body={salesErrorBody} retryHref={retryHref} />
        ) : null}

        {children}
      </div>
    </s-page>
  );
}
