import type { ActionFunctionArgs, HeadersFunction } from "react-router";
import { redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { ensureShop, getOrCreateSettings } from "../lib/mer-dashboard.server";
import {
  sampleDeskNeedsSeed,
  seedThreeYearSampleDesk,
  setSampleDeskEnabled,
  setSamplePreviewAllowed,
  SAMPLE_DESK_TARGET_MER,
} from "../lib/sample-desk.server";

/** Only allow in-app return paths (embedded Admin). */
function safeAppReturnTo(raw: FormDataEntryValue | null): string {
  const value = String(raw ?? "").trim();
  if (!value.startsWith("/app")) return "/app";
  if (value.includes("://") || value.includes("//")) return "/app";
  return value;
}

function withGuideParam(path: string, guide: string | null): string {
  const qIndex = path.indexOf("?");
  const pathname = qIndex >= 0 ? path.slice(0, qIndex) : path;
  const search = qIndex >= 0 ? path.slice(qIndex + 1) : "";
  const params = new URLSearchParams(search);
  if (guide) params.set("guide", guide);
  else params.delete("guide");
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/**
 * POST-only data-mode switcher for the global Sample | Real toggle.
 * Intents: use-sample | use-real | allow-sample-preview | hide-sample-preview
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  await getOrCreateSettings(shop.id);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  const returnTo = safeAppReturnTo(form.get("returnTo"));

  if (intent === "use-sample") {
    // Re-seed when SAMPLE is empty or still on UTC-midnight stamps that collide
    // with live CSV unique keys. Noon stamps coexist; skip a 3-year rewrite then.
    if (await sampleDeskNeedsSeed(shop.id)) {
      await seedThreeYearSampleDesk(shop.id, SAMPLE_DESK_TARGET_MER);
    }
    await setSampleDeskEnabled(shop.id, true);
    return redirect(withGuideParam(returnTo, null));
  }

  if (intent === "use-real") {
    await setSampleDeskEnabled(shop.id, false);
    return redirect(withGuideParam(returnTo, "real"));
  }

  if (intent === "allow-sample-preview") {
    await setSamplePreviewAllowed(shop.id, true);
    return redirect(withGuideParam(returnTo, null));
  }

  if (intent === "hide-sample-preview") {
    await setSamplePreviewAllowed(shop.id, false);
    return redirect(withGuideParam(returnTo, "real"));
  }

  return redirect(returnTo);
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
