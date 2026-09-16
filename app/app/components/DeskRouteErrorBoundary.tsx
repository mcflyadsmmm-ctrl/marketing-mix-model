import { useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { MerchantErrorRecovery } from "./MerchantErrorRecovery";
import {
  decorateShopifyBoundaryError,
  shouldDelegateShopifyBoundary,
} from "../lib/merchant-error-recovery";

/**
 * Page-level recovery so book tabs keep chrome. 401 / reauth still uses
 * Shopify's visual boundary; empty ErrorResponse data is replaced.
 */
export function DeskRouteErrorBoundary({
  retryHref,
}: {
  retryHref: string;
}) {
  const error = useRouteError();
  if (shouldDelegateShopifyBoundary(error)) {
    return boundary.error(decorateShopifyBoundaryError(error));
  }
  return <MerchantErrorRecovery error={error} retryHref={retryHref} />;
}
