import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { loadDepthHeavyCharts } from "../lib/shopify-depth-heavy.server";

export const loader = async (args: LoaderFunctionArgs) => {
  return loadDepthHeavyCharts(args, "customers");
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
