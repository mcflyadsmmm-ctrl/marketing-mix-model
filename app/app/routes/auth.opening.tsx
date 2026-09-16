import { useEffect } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { appRoutePath } from "../../scripts/shopify-app-path.mjs";

function safeNextPath(raw: string | null): string {
  const path = appRoutePath(raw || "/app");
  if (path === "/app" || path.startsWith("/app/")) return path;
  return "/app";
}

export const loader = ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));
  const params = new URLSearchParams(url.searchParams);
  params.delete("next");
  const qs = params.toString();
  return {
    href: qs ? `${next}?${qs}` : next,
    apiKey: process.env.SHOPIFY_API_KEY || "",
  };
};

export default function AuthOpening() {
  const { href, apiKey } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(href, { replace: true });
  }, [href, navigate]);

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-page>
        <s-section heading="Opening Mcfly Analytics">
          <s-paragraph>Loading the desk…</s-paragraph>
          <s-paragraph>
            If this stays here, refresh or reopen the app from Shopify Admin.{" "}
            <s-link href="/support">Support</s-link>
          </s-paragraph>
        </s-section>
      </s-page>
    </AppProvider>
  );
}
