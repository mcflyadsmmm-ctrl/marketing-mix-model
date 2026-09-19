import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";

import { DeskBookPage } from "../components/DeskBookPage";
import { DeskLane } from "../components/DeskLane";
import { BookFactGrid } from "../components/ShopifyBookSection";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import { loadPublicSamplePage } from "../lib/public-sample-page.server";
import { useDeskCurrency } from "../lib/desk-currency";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadPublicSamplePage(request);
};

export default function PublicDemoLtv() {
  const data = useLoaderData<typeof loader>();
  const currency = useDeskCurrency();
  const navigation = useNavigation();
  const money = (n: number | null) =>
    n != null && Number.isFinite(n) && n > 0 ? formatCurrency(n, currency) : "—";
  return (
    <DeskBookPage
      heading={PRODUCT_NOUN.ltvTitle}
      tillLabel={data.tillLabel}
      preset={data.preset}
      shotMode={data.shotMode}
      useSampleDesk
      isLoading={navigation.state === "loading"}
      showPeriod={false}
      retryHref="/demo/ltv"
    >
      <p className="mcfly-book__lede">{PRODUCT_NOUN.ltvNotInShopify}</p>
      <DeskLane rank="first" label="What a new buyer is worth">
        <BookFactGrid
          facts={[
            {
              k: "First 30 days",
              v: money(data.ltv.revenue30),
              d: "Average dollars per new buyer in their first 30 days. Observed SAMPLE order history — not an estimate.",
            },
            {
              k: "First 90 days",
              v: money(data.ltv.revenue90),
              d: "Average dollars per new buyer in their first 90 days.",
            },
            {
              k: "First 365 days",
              v: money(data.ltv.revenue365),
              d: "Average dollars per new buyer in their first year when the book is long enough.",
            },
          ]}
        />
      </DeskLane>
    </DeskBookPage>
  );
}
