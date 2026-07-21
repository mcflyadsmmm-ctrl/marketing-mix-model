import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getAllConnectorStatuses } from "../lib/connectors/types";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const connectors = await getAllConnectorStatuses(session.shop);
  return { connectors };
};

export default function ConnectionsPage() {
  const { connectors } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Connections">
      <s-section heading="Ad platform spend (coming soon)">
        <s-paragraph>
          Phase 2 will connect Meta Marketing API and Google Ads API for automatic
          daily spend sync. v1 Truth MVP uses manual spend entry only.
        </s-paragraph>

        <s-stack direction="block" gap="base">
          {connectors.map((connector) => (
            <s-box
              key={connector.provider}
              padding="base"
              borderWidth="base"
              borderRadius="base"
            >
              <s-stack direction="block" gap="small">
                <s-heading>{providerLabel(connector.provider)}</s-heading>
                <s-text tone={connector.connected ? "success" : "subdued"}>
                  {connector.connected ? "Connected" : "Not connected"}
                </s-text>
                <s-text tone="subdued">{connector.message}</s-text>
                <s-button disabled variant="secondary">
                  Connect {providerLabel(connector.provider)} (Phase 2)
                </s-button>
              </s-stack>
            </s-box>
          ))}
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Why manual first?">
        <s-paragraph>
          OAuth and App Review for Meta and Google take calendar time. Manual spend
          entry lets design partners validate MER math before live pipes ship.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

function providerLabel(provider: string): string {
  return provider === "meta" ? "Meta Ads" : "Google Ads";
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
