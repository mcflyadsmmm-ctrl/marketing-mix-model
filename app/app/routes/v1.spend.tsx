import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { PostSpendBodySchema } from "@mcfly/api-contract";
import prisma from "../db.server";
import { authenticateApiRequest, jsonError } from "../lib/api-auth.server";
import {
  assertChannelsAllowed,
  getShopEntitlements,
} from "../lib/entitlements.server";
import { ensureShop } from "../lib/mer-dashboard.server";
import { utcMidnightFromDayKey } from "../lib/shop-local-day";

/** UTC day bounds for a YYYY-MM-DD key — matches SalesDayFact / spine day stamps. */
function dayBounds(date: string): { start: Date; end: Date } {
  const start = utcMidnightFromDayKey(date);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { start, end };
}

function mapChannel(channel: string) {
  const normalized = channel.toLowerCase();
  if (normalized.includes("meta") || normalized.includes("facebook")) return "meta" as const;
  if (normalized.includes("google")) return "google" as const;
  if (normalized.includes("microsoft") || normalized.includes("bing")) return "microsoft" as const;
  if (normalized.includes("tiktok")) return "tiktok" as const;
  if (normalized.includes("pinterest")) return "pinterest" as const;
  if (normalized.includes("snapchat") || normalized === "snap") return "snapchat" as const;
  if (normalized.includes("reddit")) return "reddit" as const;
  if (
    normalized === "x" ||
    normalized.includes("twitter") ||
    normalized.includes("x ads")
  ) {
    return "x" as const;
  }
  if (normalized.includes("linkedin")) return "linkedin" as const;
  if (normalized.includes("amazon")) return "amazon" as const;
  if (normalized.includes("apple search") || normalized.includes("apple_search")) {
    return "apple_search" as const;
  }
  if (normalized.includes("affiliate")) return "affiliate" as const;
  if (normalized.includes("email") || normalized.includes("klaviyo")) return "email" as const;
  return "other" as const;
}

export const loader = async (_args: LoaderFunctionArgs) => {
  return jsonError("Method not allowed", 405);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) {
    return jsonError(auth.message, auth.status);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = PostSpendBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, 400, "invalid_body");
  }

  const shop = await ensureShop(auth.shopDomain);
  const entries = parsed.data.entries;
  const entitlements = getShopEntitlements(auth.shopDomain);
  const channelGate = assertChannelsAllowed(
    entitlements,
    entries.map((entry) => mapChannel(entry.channel)),
  );
  if (channelGate) {
    return jsonError(channelGate, 403, "pro_required");
  }

  const accepted = await prisma.$transaction(async (tx) => {
    let count = 0;
    for (const entry of entries) {
      const channel = mapChannel(entry.channel);
      const { start, end } = dayBounds(entry.date);
      // Upsert on shopId+channel+customKey+periodStart —
      // re-posting the same shop/channel/day updates that row (latest write wins), no summing.
      // source: csv — API posts are desk imports; clears sample so sample-OFF keeps spend.
      await tx.spendEntry.upsert({
        where: {
          shopId_channel_customKey_periodStart: {
            shopId: shop.id,
            channel,
            customKey: "",
            periodStart: start,
          },
        },
        create: {
          shopId: shop.id,
          channel,
          customKey: "",
          amount: entry.amount,
          periodStart: start,
          periodEnd: end,
          note: `api:${entry.currency}`,
          source: "csv",
        },
        update: {
          amount: entry.amount,
          periodEnd: end,
          note: `api:${entry.currency}`,
          source: "csv",
        },
      });
      count += 1;
    }
    return count;
  });

  return Response.json(
    { accepted, shopId: shop.id },
    { status: 201 },
  );
};
