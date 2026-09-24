import { useLocation, useNavigation } from "react-router";
import type { ShouldRevalidateFunctionArgs } from "react-router";

/**
 * Orders, Spend, Goals, Customers, Settings.
 * The address is the tab. A loaded desk swaps the view in place.
 */

const DESK_TAB_SUFFIX = ["", "/spend", "/goals", "/customers", "/settings"] as const;

export function deskTabPath(pathname: string): string | null {
  const current = pathname.replace(/\/$/, "") || "/";
  for (const base of ["/app", "/demo"] as const) {
    for (const suffix of DESK_TAB_SUFFIX) {
      if (current === `${base}${suffix}`) return current;
    }
  }
  return null;
}

function isMutation(formMethod: string | undefined): boolean {
  if (!formMethod) return false;
  return formMethod.toUpperCase() !== "GET";
}

/** Layout auth and chrome stay put when the merchant changes tabs. */
export function deskShellShouldRevalidate({
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs): boolean {
  if (isMutation(formMethod)) return defaultShouldRevalidate;
  const from = deskTabPath(currentUrl.pathname);
  const to = deskTabPath(nextUrl.pathname);
  if (from && to) return false;
  return defaultShouldRevalidate;
}

/**
 * A tab already on screen does not refetch when the merchant comes back
 * to the same window, or when a panel query only scrolls.
 */
export function deskPageShouldRevalidate({
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs): boolean {
  if (isMutation(formMethod)) return true;
  const samePeriod =
    currentUrl.searchParams.get("period") === nextUrl.searchParams.get("period");
  if (currentUrl.pathname !== nextUrl.pathname && samePeriod) return false;
  if (
    currentUrl.pathname === nextUrl.pathname &&
    samePeriod &&
    currentUrl.searchParams.get("panel") !== nextUrl.searchParams.get("panel")
  ) {
    return false;
  }
  return defaultShouldRevalidate;
}

/** True when this screen is refreshing. A different tab is a swap, not a reload. */
export function deskNavigationRefreshesThisTab(
  currentPathname: string,
  nextPathname: string | null,
  state: "idle" | "loading" | "submitting",
): boolean {
  if (state === "idle") return false;
  if (!nextPathname) return state === "loading";
  const here = deskTabPath(currentPathname);
  const next = deskTabPath(nextPathname);
  if (here && next && here !== next) return false;
  return state === "loading";
}

export function useDeskTabRefresh(): boolean {
  const navigation = useNavigation();
  const location = useLocation();
  return deskNavigationRefreshesThisTab(
    location.pathname,
    navigation.location?.pathname ?? null,
    navigation.state,
  );
}
