import type { SpendDay, SpendRepository, SpendWriteResult } from "@mcfly/connectors";
import type { SpendChannel } from "@prisma/client";
import prisma from "../db.server";

function mapChannel(channel: string): SpendChannel {
  const normalized = channel.toLowerCase();
  if (normalized === "meta" || normalized === "facebook") return "meta";
  if (normalized === "google" || normalized === "google_ads") return "google";
  if (normalized === "microsoft" || normalized === "bing") return "microsoft";
  if (normalized === "tiktok") return "tiktok";
  if (normalized === "affiliate") return "affiliate";
  if (normalized === "email" || normalized === "klaviyo") return "email";
  return "other";
}

function dayBounds(date: string): { start: Date; end: Date } {
  const [y, m, d] = date.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Prisma-backed SpendRepository for connector sync jobs.
 * Upserts one SpendEntry per shop/channel/day.
 */
export function createSpendRepository(): SpendRepository {
  return {
    async upsertSpendDays(shopId: string, rows: SpendDay[]): Promise<SpendWriteResult> {
      let written = 0;
      let skipped = 0;

      for (const row of rows) {
        const channel = mapChannel(row.channel);
        const { start, end } = dayBounds(row.date);

        const existing = await prisma.spendEntry.findFirst({
          where: {
            shopId,
            channel,
            periodStart: start,
            periodEnd: end,
          },
        });

        if (existing) {
          if (existing.amount !== row.amount) {
            await prisma.spendEntry.update({
              where: { id: existing.id },
              data: {
                amount: row.amount,
                note: `sync:${row.source}`,
              },
            });
            written += 1;
          } else {
            skipped += 1;
          }
          continue;
        }

        await prisma.spendEntry.create({
          data: {
            shopId,
            channel,
            amount: row.amount,
            periodStart: start,
            periodEnd: end,
            note: `sync:${row.source}`,
          },
        });
        written += 1;
      }

      return { written, skipped };
    },
  };
}
