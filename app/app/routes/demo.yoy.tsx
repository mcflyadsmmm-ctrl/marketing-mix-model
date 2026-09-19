import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";

import { DeskBookPage } from "../components/DeskBookPage";
import { OverviewYoyCards } from "../components/OverviewYoyCards";
import { YOY_ANALYTICS_LEDE } from "../lib/yoy-workspace";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import { loadPublicSamplePage } from "../lib/public-sample-page.server";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadPublicSamplePage(request);
};

export default function PublicDemoYoy() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  return (
    <DeskBookPage
      heading="YoY"
      tillLabel={data.tillLabel}
      preset={data.preset}
      shotMode={data.shotMode}
      useSampleDesk
      isLoading={navigation.state === "loading"}
      showPeriod={false}
      retryHref="/demo/yoy"
    >
      <p className="mcfly-book__lede">{YOY_ANALYTICS_LEDE}</p>
      <OverviewYoyCards cards={data.yoyCards} salesPending={false} />
    </DeskBookPage>
  );
}
