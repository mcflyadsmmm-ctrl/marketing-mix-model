/**
 * Goals — one saved target. Not Settings.
 * Nothing on this page says "at goal" until the merchant saves a number.
 */
import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { requireAdmin } from "../lib/public-app-gate.server";
import { ensureShop, getOrCreateSettings } from "../lib/mer-dashboard.server";
import prisma from "../db.server";
import { PRODUCT_NOUN } from "../lib/product-labels";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await requireAdmin(request);
  const shop = await ensureShop(session.shop);
  const settings = await getOrCreateSettings(shop.id);
  return {
    savedTarget:
      settings.targetMerSavedAt != null ? settings.targetMer : null,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await requireAdmin(request);
  const shop = await ensureShop(session.shop);
  await getOrCreateSettings(shop.id);
  const form = await request.formData();
  const targetMer = parseFloat(String(form.get("targetMer") ?? ""));
  if (!Number.isFinite(targetMer) || targetMer <= 0) {
    return { error: "Enter one target greater than 0.", success: false as const };
  }
  await prisma.settings.update({
    where: { shopId: shop.id },
    data: { targetMer, targetMerSavedAt: new Date() },
  });
  return { error: null, success: true as const, targetMer };
};

export default function GoalsPage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const saving = navigation.state !== "idle";
  return (
    <s-page heading="Goals">
      <section className="mcfly-panel mcfly-settings-panel--soft" aria-label="One target">
        <h2 className="mcfly-settings-template__heading">One target</h2>
        <p className="mcfly-panel__muted">
          {PRODUCT_NOUN.totalRoas} target for this shop. Empty until you save
          a number. This page does not compare you to a target you never set.
        </p>
        <Form method="post">
          <label className="mcfly-settings-field__label" htmlFor="goal-target">
            Target
          </label>
          <input
            id="goal-target"
            className="mcfly-field mcfly-settings-field__input"
            name="targetMer"
            type="number"
            step="0.1"
            min="0.1"
            inputMode="decimal"
            autoComplete="off"
            placeholder="e.g. 4.0"
            defaultValue={data.savedTarget ?? ""}
          />
          <button
            type="submit"
            className="mcfly-btn mcfly-btn--primary"
            disabled={saving || undefined}
          >
            Save target
          </button>
        </Form>
        {actionData && "error" in actionData && actionData.error ? (
          <p className="mcfly-settings-error" role="alert">
            {actionData.error}
          </p>
        ) : null}
        {data.savedTarget != null ? (
          <p className="mcfly-panel__muted">Saved target {data.savedTarget}×.</p>
        ) : (
          <p className="mcfly-panel__muted">No target saved.</p>
        )}
      </section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
