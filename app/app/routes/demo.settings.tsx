import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { calculateBreakEvenMer } from "@mcfly/mer-core";

import { DeskBookPage } from "../components/DeskBookPage";
import { formatMer } from "../lib/mer-format";
import { NUMBER_HONESTY } from "../lib/number-honesty";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import { loadPublicSamplePage } from "../lib/public-sample-page.server";
import { FLY_SUPPORT_URL } from "../lib/public-origin";

const LISTING = "https://apps.shopify.com/mcfly-analytics-public";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadPublicSamplePage(request);
};

export default function PublicDemoSettings() {
  const data = useLoaderData<typeof loader>();
  const be = calculateBreakEvenMer(data.marginPct);
  return (
    <DeskBookPage
      heading="Settings"
      tillLabel={data.tillLabel}
      preset={data.preset}
      shotMode={data.shotMode}
      useSampleDesk
      isLoading={false}
      showPeriod={false}
      retryHref="/demo/settings"
    >
      <p className="mcfly-book__lede">
        {PRODUCT_NOUN.sampleHint} Live is parked until launch. This public demo
        cannot switch to a live shop.
      </p>
      <div className="mcfly-well mcfly-well--scoreboard mcfly-well--soft">
        <p>
          <strong>Data</strong> · SAMPLE Snowdevil only. No Sample | Live toggle
          here.
        </p>
        <p>
          <strong>{PRODUCT_NOUN.totalRoas}</strong> · {NUMBER_HONESTY.formula}.
          Empty spend is —.
        </p>
        <p>
          <strong>SAMPLE goal</strong> · {formatMer(data.targetMer)}× · break-even{" "}
          {be != null ? `${formatMer(be)}×` : "—"} at{" "}
          {Math.round(data.marginPct * 100)}% margin.
        </p>
        <p>
          <strong>Plan</strong> · 7-day trial, then $39/store/month.{" "}
          <a href={LISTING} rel="noopener noreferrer">
            Install
          </a>
        </p>
        <p>
          Questions: <a href={FLY_SUPPORT_URL}>Support</a>
        </p>
      </div>
    </DeskBookPage>
  );
}
