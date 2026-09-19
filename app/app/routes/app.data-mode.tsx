import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { requireAdmin } from "../lib/public-app-gate.server";
import { ensureShop, getOrCreateSettings } from "../lib/mer-dashboard.server";
import {
  applySampleDeskIntent,
  isSampleDeskIntent,
  isSampleOnlyFreeze,
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
 * Legacy Sample | Live POST door. GET always redirects to Settings.
 * Merchant `use-sample` no-ops on Live hosts (`applySampleDeskIntent`).
 * Public Snowdevil lives on https://mcflyads.com/demo — not this route.
 *
 * Default export makes this a UI route so a SPA Form POST is encoded as
 * turbo-stream. Callers also use `reloadDocument` so Admin iframe toggles
 * never depend on decoding a raw 302 as turbo-stream.
 *
 * GET does not authenticate — a bare hit must not 410 /auth/opening. Settings
 * is the door and uses requireAdmin.
 */
export default function DataModeRoute() {
  return null;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  return redirect(`/app/settings${url.search}`);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await requireAdmin(request);
  const shop = await ensureShop(session.shop);
  await getOrCreateSettings(shop.id);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  const returnTo = safeAppReturnTo(form.get("returnTo"));

  if (isSampleDeskIntent(intent)) {
    if (
      isSampleOnlyFreeze() &&
      (intent === "use-real" || intent === "hide-sample-preview")
    ) {
      return redirect(withGuideParam(returnTo, null));
    }
    await applySampleDeskIntent(shop.id, intent);
    if (intent === "use-sample") {
      return redirect(withGuideParam(returnTo, null));
    }
    if (intent === "use-real" || intent === "hide-sample-preview") {
      return redirect(withGuideParam(returnTo, "real"));
    }
    return redirect(withGuideParam(returnTo, null));
  }

  return redirect(returnTo);
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
