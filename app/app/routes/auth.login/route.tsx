import { AppProvider } from "@shopify/shopify-app-react-router/react";
import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

/**
 * App Store 2.3.1: do not collect shop domains for install.
 * Design-partner / CLI OAuth always arrives with ?shop= already set.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  if (shop) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  throw redirect("https://mcflyads.com/");
};

export default function AuthLoginRedirect() {
  return (
    <AppProvider embedded={false}>
      <s-page>
        <s-section heading="Install from Shopify">
          <s-paragraph>
            Mcfly installs from Shopify Admin or a Partner invite — not by typing
            your shop domain here.
          </s-paragraph>
          <s-link href="https://mcflyads.com/">Back to mcflyads.com</s-link>
        </s-section>
      </s-page>
    </AppProvider>
  );
}
