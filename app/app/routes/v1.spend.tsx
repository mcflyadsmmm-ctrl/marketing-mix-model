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
  let accepted = 0;

  for (const entry of parsed.data.entries) {
    const channel = mapChannel(entry.channel);
    const { start, end } = dayBounds(entry.date);
    await prisma.spendEntry.create({
      data: {
        shopId: shop.id,
        channel,
        amount: entry.amount,
        periodStart: start,
        periodEnd: end,
        note: `api:${entry.currency}`,
      },
    });
    accepted += 1;
  }

  return Response.json(
    { accepted, shopId: shop.id },
    { status: 201 },
  );
};
