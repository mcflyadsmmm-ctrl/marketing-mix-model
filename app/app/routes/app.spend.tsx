import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { ensureShop } from "../lib/mer-dashboard.server";
import { resolvePeriod, type PeriodPreset } from "../lib/periods";
import prisma from "../db.server";

const CHANNELS = [
  { value: "meta", label: "Meta" },
  { value: "google", label: "Google" },
  { value: "other", label: "Other" },
] as const;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const entries = await prisma.spendEntry.findMany({
    where: { shopId: shop.id },
    orderBy: { periodStart: "desc" },
    take: 20,
  });
  return { entries };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const form = await request.formData();

  const channel = String(form.get("channel") ?? "other");
  const amount = parseFloat(String(form.get("amount") ?? "0"));
  const period = (String(form.get("period") ?? "mtd") as PeriodPreset) || "mtd";
  const note = String(form.get("note") ?? "").trim() || null;

  if (!["meta", "google", "other"].includes(channel)) {
    return { error: "Invalid channel", success: false };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a positive spend amount", success: false };
  }

  const range = resolvePeriod(period);
  await prisma.spendEntry.create({
    data: {
      shopId: shop.id,
      channel: channel as "meta" | "google" | "other",
      amount,
      periodStart: range.start,
      periodEnd: range.end,
      note,
    },
  });

  return { error: null, success: true };
};

export default function SpendEntryPage() {
  const { entries } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <s-page heading="Spend entry">
      <s-section heading="Add manual spend">
        <Form method="post">
          <s-stack direction="block" gap="base">
            <label>
              <s-text>Channel</s-text>
              <select name="channel" defaultValue="meta" style={{ display: "block", marginTop: 4 }}>
                {CHANNELS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <s-text>Amount (USD)</s-text>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="5000"
                style={{ display: "block", marginTop: 4, width: "100%", maxWidth: 240 }}
              />
            </label>

            <label>
              <s-text>Period</s-text>
              <select name="period" defaultValue="mtd" style={{ display: "block", marginTop: 4 }}>
                <option value="mtd">Month to date</option>
                <option value="qtd">Quarter to date</option>
                <option value="ytd">Year to date</option>
              </select>
            </label>

            <label>
              <s-text>Note (optional)</s-text>
              <input
                name="note"
                type="text"
                placeholder="e.g. Meta Ads Manager total"
                style={{ display: "block", marginTop: 4, width: "100%", maxWidth: 400 }}
              />
            </label>

            {actionData?.error && (
              <s-text tone="critical">{actionData.error}</s-text>
            )}
            {actionData?.success && (
              <s-text tone="success">Spend entry saved.</s-text>
            )}

            <s-button type="submit" variant="primary" {...(isSubmitting ? { loading: true } : {})}>
              Save spend
            </s-button>
          </s-stack>
        </Form>
      </s-section>

      <s-section heading="Recent entries">
        {entries.length === 0 ? (
          <s-paragraph>
            <s-text tone="subdued">No spend entries yet.</s-text>
          </s-paragraph>
        ) : (
          <s-stack direction="block" gap="base">
            {entries.map((entry) => (
              <s-box key={entry.id} padding="base" borderWidth="base" borderRadius="base">
                <s-stack direction="inline" gap="base">
                  <s-text>{entry.channel}</s-text>
                  <s-text>${entry.amount.toLocaleString()}</s-text>
                  <s-text tone="subdued">
                    {entry.periodStart.toLocaleDateString()} – {entry.periodEnd.toLocaleDateString()}
                  </s-text>
                  {entry.note && <s-text tone="subdued">{entry.note}</s-text>}
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}
      </s-section>

      <s-section slot="aside" heading="Truth MVP">
        <s-paragraph>
          v1 uses manual spend entry. Live Meta and Google sync arrives in Phase 2
          after OAuth App Review.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
