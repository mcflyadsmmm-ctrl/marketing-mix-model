import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { PostSpendBodySchema } from "@mcfly/api-contract";
import prisma from "../db.server";
import { authenticateApiRequest, jsonError } from "../lib/api-auth.server";
import { ensureShop } from "../lib/mer-dashboard.server";

function dayBounds(date: string): { start: Date; end: Date } {
  const [y, m, d] = date.split("-").map(Number);
  return {
    start: new Date(y, m - 1, d),
    end: new Date(y, m - 1, d, 23, 59, 59, 999),
  };
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

  const accepted = await prisma.$transaction(async (tx) => {
    let count = 0;
    for (const entry of entries) {
      const channel = mapChannel(entry.channel);
      const { start, end } = dayBounds(entry.date);
      // Upsert on shopId+channel+periodStart (SpendEntry_shopId_channel_periodStart_key) —
      // re-posting the same shop/channel/day updates that row (latest write wins), no summing.
      // source: csv — API posts are desk imports; clears sample so sample-OFF keeps spend.
      await tx.spendEntry.upsert({
        where: {
          shopId_channel_periodStart: { shopId: shop.id, channel, periodStart: start },
        },
        create: {
          shopId: shop.id,
          channel,
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
