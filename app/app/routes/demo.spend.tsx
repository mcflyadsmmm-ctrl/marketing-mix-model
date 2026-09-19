import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";

import { DeskBookPage } from "../components/DeskBookPage";
import { PeriodControl } from "../components/PeriodControl";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import { loadPublicSamplePage } from "../lib/public-sample-page.server";
import { SAMPLE_LEDGER_HANDOFF } from "../lib/sample-live-handoff";
import { spendChannelLabel } from "../lib/spend-channel-label";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadPublicSamplePage(request);
};

export default function PublicDemoSpend() {
  const data = useLoaderData<typeof loader>();
  const currency = useDeskCurrency();
  const navigation = useNavigation();
  return (
    <DeskBookPage
      heading={PRODUCT_NOUN.uploadSpend}
      tillLabel={data.tillLabel}
      preset={data.preset}
      shotMode={data.shotMode}
      useSampleDesk
      isLoading={navigation.state === "loading"}
      retryHref="/demo/spend"
    >
      {!data.shotMode ? <PeriodControl preset={data.preset} language="spend" /> : null}
      <p className="mcfly-book__lede">{SAMPLE_LEDGER_HANDOFF}</p>
      <p className="mcfly-book__lede">
        Read-only SAMPLE ledger. In the installed app you type a day or paste an Ads
        Manager CSV. This demo does not save spend.
      </p>
      <div className="mcfly-well mcfly-well--scoreboard mcfly-well--soft">
        <table className="mcfly-public-ledger">
          <thead>
            <tr>
              <th>Day</th>
              <th>Sales</th>
              <th>Spend</th>
              <th>Channels</th>
            </tr>
          </thead>
          <tbody>
            {data.ledgerDays.map((day) => (
              <tr key={day.dateKey}>
                <td>{day.dateKey}</td>
                <td>{formatCurrency(day.sales, currency)}</td>
                <td>{formatCurrency(day.spend, currency)}</td>
                <td>
                  {Object.entries(day.spendByChannel)
                    .filter(([, amount]) => amount > 0)
                    .map(([channel]) =>
                      spendChannelLabel({ channel }),
                    )
                    .join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DeskBookPage>
  );
}
