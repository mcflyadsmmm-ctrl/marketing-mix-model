import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { ensureShop, getOrCreateSettings } from "../lib/mer-dashboard.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const settings = await getOrCreateSettings(shop.id);
  return { settings };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const form = await request.formData();

  const marginPct = parseFloat(String(form.get("marginPct") ?? "0")) / 100;
  const targetMer = parseFloat(String(form.get("targetMer") ?? "0"));

  if (!Number.isFinite(marginPct) || marginPct <= 0 || marginPct > 1) {
    return { error: "Margin must be between 0.1% and 100%", success: false };
  }
  if (!Number.isFinite(targetMer) || targetMer <= 0) {
    return { error: "Target MER must be positive", success: false };
  }

  await prisma.settings.update({
    where: { shopId: shop.id },
    data: {
      marginPct: marginPct,
      targetMer,
    },
  });

  return { error: null, success: true };
};

export default function SettingsPage() {
  const { settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <s-page heading="Settings">
      <s-section heading="MER inputs">
        <Form method="post">
          <s-stack direction="block" gap="base">
            <label>
              <s-text>Contribution margin (%)</s-text>
              <input
                name="marginPct"
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                required
                defaultValue={(settings.marginPct * 100).toFixed(1)}
                style={{ display: "block", marginTop: 4, width: 120 }}
              />
            </label>
            <s-paragraph>
              <s-text tone="subdued">
                Break-even MER = 1 ÷ margin. At {(settings.marginPct * 100).toFixed(0)}% margin,
                break-even MER ≈ {(1 / settings.marginPct).toFixed(2)}.
              </s-text>
            </s-paragraph>

            <label>
              <s-text>Target MER</s-text>
              <input
                name="targetMer"
                type="number"
                step="0.1"
                min="0.1"
                required
                defaultValue={settings.targetMer}
                style={{ display: "block", marginTop: 4, width: 120 }}
              />
            </label>
            <s-paragraph>
              <s-text tone="subdued">
                Operating goal above break-even (e.g. 3.0 means $3 sales per $1 ad spend).
              </s-text>
            </s-paragraph>

            {actionData?.error && (
              <s-text tone="critical">{actionData.error}</s-text>
            )}
            {actionData?.success && (
              <s-text tone="success">Settings saved.</s-text>
            )}

            <s-button type="submit" variant="primary" {...(isSubmitting ? { loading: true } : {})}>
              Save settings
            </s-button>
          </s-stack>
        </Form>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
