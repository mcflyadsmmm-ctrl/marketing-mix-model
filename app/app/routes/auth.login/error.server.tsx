import type { LoginError } from "@shopify/shopify-app-react-router/server";
import { LoginErrorType } from "@shopify/shopify-app-react-router/server";

interface LoginErrorMessage {
  shop?: string;
}

/**
 * App Store 2.3.1: never ask merchants to type a shop domain.
 * Auth arrives with ?shop= from Shopify; bare /auth/login redirects to mcflyads.com.
 */
export function loginErrorMessage(loginErrors: LoginError): LoginErrorMessage {
  if (loginErrors?.shop === LoginErrorType.MissingShop) {
    return {
      shop: "Install Mcfly Analytics from the Shopify App Store.",
    };
  } else if (loginErrors?.shop === LoginErrorType.InvalidShop) {
    return {
      shop: "Install Mcfly Analytics from the Shopify App Store.",
    };
  }

  return {};
}
