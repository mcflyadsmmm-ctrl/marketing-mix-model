import { useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";

import { CpaWindowCards } from "../components/CpaWindowCards";
import { DeskBookPage } from "../components/DeskBookPage";
import { CPA_CONTRAST, type CpaWindowId } from "../lib/cpa-desk";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import { loadPublicSamplePage } from "../lib/public-sample-page.server";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadPublicSamplePage(request);
};

export default function PublicDemoCpa() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [selectedId, setSelectedId] = useState<CpaWindowId>("this_month");
  return (
    <DeskBookPage
      heading="CPA"
      tillLabel={data.tillLabel}
      preset={data.preset}
      shotMode={data.shotMode}
      useSampleDesk
      isLoading={navigation.state === "loading"}
      retryHref="/demo/cpa"
    >
      <p className="mcfly-book__lede">{CPA_CONTRAST}</p>
      <CpaWindowCards
        windows={data.cpaWindows}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <p className="mcfly-book__lede">
        {PRODUCT_NOUN.totalRoas} uses the same SAMPLE spend. Cash CPA is entered
        spend ÷ identified SAMPLE buyers — never a platform pixel.
      </p>
    </DeskBookPage>
  );
}
