import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { requireAdmin } from "../lib/public-app-gate.server";
import { PRODUCT_NOUN } from "../lib/product-labels";

/**
 * RETIRED: Meta/Google spend OAuth UI (`docs/RETIRED_SURFACES.md`).
 * CSV on Spend is the spend SoT. Old bookmarks used to redirect("/app/spend").
 * This page now says it in English so nobody hunts an ad-account zoo.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAdmin(request);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  return { shotMode };
};

export default function ConnectionsPage() {
  const { shotMode } = useLoaderData<typeof loader>();

  return (
    <s-page heading={shotMode ? undefined : "Connections"} inlineSize="base">
      <div
        className={[
          "mcfly-desk",
          "mcfly-desk--chrome",
          shotMode ? "mcfly-desk--shot" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <header className="mcfly-topbar mcfly-topbar--settings">
          <div>
            <p className="mcfly-topbar__def mcfly-topbar__def--solo">
              No ad accounts to connect. Spend is typed or CSV on Spend
              Upload.
            </p>
          </div>
        </header>

        <section className="mcfly-panel" aria-label="Spend in">
          <h2 className="mcfly-settings-template__heading">
            No ad accounts to connect
          </h2>
          <p className="mcfly-panel__muted">
            Mcfly Analytics does not link Meta, Google, or any ad account.
            Type a day or paste an Ads Manager CSV on Spend Upload. Sales stay
            in Shopify.
          </p>
          <div
            className="mcfly-decision__actions"
            style={{ marginTop: "0.85rem" }}
          >
            <s-button href="/app/spend" variant="primary">
              {PRODUCT_NOUN.setupAddSpend}
            </s-button>
          </div>
        </section>
      </div>
    </s-page>
  );
}

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/connections" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
