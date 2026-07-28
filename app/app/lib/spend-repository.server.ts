import type { SpendDay, SpendRepository, SpendSource, SpendWriteResult } from "@mcfly/connectors";
import type { SpendChannel } from "@prisma/client";
import prisma from "../db.server";

function mapChannel(channel: string): SpendChannel {
  const normalized = channel.toLowerCase();
  if (normalized === "meta" || normalized === "facebook") return "meta";
  if (normalized === "google" || normalized === "google_ads") return "google";
  if (normalized === "microsoft" || normalized === "bing") return "microsoft";
  if (normalized === "tiktok") return "tiktok";
  if (normalized === "pinterest") return "pinterest";
  if (normalized === "snapchat") return "snapchat";
  if (normalized === "reddit") return "reddit";
  if (normalized === "x" || normalized === "twitter" || normalized === "x_ads") {
    return "x";
  }
  if (normalized === "linkedin" || normalized === "linkedin_ads") return "linkedin";
  if (normalized === "amazon" || normalized === "amazon_ads") return "amazon";
  if (
    normalized === "apple_search" ||
    normalized === "apple search" ||
    normalized === "asa"
  ) {
    return "apple_search";
  }
  if (normalized === "affiliate") return "affiliate";
  if (normalized === "email" || normalized === "klaviyo" || normalized === "mailchimp") {
    return "email";
  }
  return "other";
}

function dayBounds(date: string): { start: Date; end: Date } {
  const [y, m, d] = date.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Persist SpendEntry.source for MER filters (live desk excludes `sample`).
 * Real imports (csv/manual/meta/google) must never leave `sample` in place.
 */
export function normalizeSpendEntrySource(source: SpendSource | string): string {
  const raw = String(source || "manual").toLowerCase().trim();
  if (raw === "sample") return "sample";
  if (raw === "csv" || raw.startsWith("csv")) return "csv";
  if (raw === "manual") return "manual";
  if (raw === "meta" || raw === "google") return "csv"; // connector sync → treat as non-sample cash
  return "csv";
}

/**
 * Prisma-backed SpendRepository for connector sync jobs + CSV/bill desk imports.
 * Upserts one SpendEntry per shop/channel/periodStart — latest write wins on
 * amount/periodEnd/note/source. Never sums duplicates.
 */
export function createSpendRepository(): SpendRepository {
  return {
    async upsertSpendDays(shopId: string, rows: SpendDay[]): Promise<SpendWriteResult> {
      let written = 0;
      let skipped = 0;

      await prisma.$transaction(async (tx) => {
        for (const row of rows) {
          const channel = mapChannel(row.channel);
          const { start, end } = dayBounds(row.date);
          const source = normalizeSpendEntrySource(row.source);

          const existing = await tx.spendEntry.findUnique({
            where: {
              shopId_channel_periodStart: { shopId, channel, periodStart: start },
            },
            select: { amount: true, source: true },
          });

          // Skip only when amount AND source already match — otherwise a sample
          // row with the same dollars would stay sample after a CSV re-import.
          if (
            existing &&
            existing.amount === row.amount &&
            existing.source === source
          ) {
            skipped += 1;
            continue;
          }

          await tx.spendEntry.upsert({
            where: {
              shopId_channel_periodStart: { shopId, channel, periodStart: start },
            },
            create: {
              shopId,
              channel,
              amount: row.amount,
              periodStart: start,
              periodEnd: end,
              note: `sync:${row.source}`,
              source,
            },
            update: {
              amount: row.amount,
              periodEnd: end,
              note: `sync:${row.source}`,
              source,
            },
          });
          written += 1;
        }
      });

      return { written, skipped };
    },
  };
}
