import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";

import { DeskBookPage } from "../components/DeskBookPage";
import { PeriodControl } from "../components/PeriodControl";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import { loadPublicSamplePage } from "../lib/public-sample-page.server";
import { spendChannelLabel } from "../lib/spend-channel-label";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadPublicSamplePage(request);
};

export default function PublicDemoAllocation() {
  const data = useLoaderData<typeof loader>();
  const currency = useDeskCurrency();
  const navigation = useNavigation();
  const total = data.channelSpend.reduce((sum, row) => sum + row.amount, 0);
  return (
    <DeskBookPage
      heading={PRODUCT_NOUN.spendAllocation}
      tillLabel={data.tillLabel}
      preset={data.preset}
      shotMode={data.shotMode}
      useSampleDesk
      isLoading={navigation.state === "loading"}
      retryHref="/demo/allocation"
    >
      {!data.shotMode ? <PeriodControl preset={data.preset} /> : null}
      <p className="mcfly-book__lede">
        Shopify Analytics channel reports are sessions and attribution. This page is
        entered SAMPLE spend mix — not Ads Manager login.
      </p>
      <div className="mcfly-well mcfly-well--scoreboard mcfly-well--soft">
        <div className="mcfly-public-mix">
          {data.channelSpend.map((row) => {
            const share = total > 0 ? row.amount / total : 0;
            return (
              <div className="mcfly-public-mix__row" key={row.channel}>
                <span>{spendChannelLabel({ channel: row.channel })}</span>
                <span className="mcfly-public-mix__bar">
                  <span
                    className="mcfly-public-mix__fill"
                    style={{ width: `${Math.max(2, Math.round(share * 100))}%` }}
                  />
                </span>
                <strong>{formatCurrency(row.amount, currency)}</strong>
              </div>
            );
          })}
        </div>
      </div>
    </DeskBookPage>
  );
}
