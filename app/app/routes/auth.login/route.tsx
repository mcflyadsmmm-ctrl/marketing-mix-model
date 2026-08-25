import { AppProvider } from "@shopify/shopify-app-react-router/react";
import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { isShopifyEmbeddedSearch } from "../../../scripts/shopify-app-path.mjs";

/**
 * App Store 2.3.1: do not collect shop domains for install.
 * Design-partner / CLI OAuth always arrives with ?shop= already set.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  if (isShopifyEmbeddedSearch(url.searchParams)) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  throw redirect("/");
};

export default function AuthLoginRedirect() {
  return (
    <AppProvider embedded={false}>
      <s-page>
        <s-section heading="Install from Shopify">
          <s-paragraph>
            Mcfly Analytics installs from the Shopify App Store.
          </s-paragraph>
          <s-link href="/">Back to Mcfly Analytics</s-link>
        </s-section>
      </s-page>
    </AppProvider>
  );
}
