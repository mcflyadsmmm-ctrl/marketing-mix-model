import type { SpendDay, SpendRepository, SpendSource, SpendWriteResult } from "@mcfly/connectors";
import type { SpendChannel } from "@prisma/client";
import prisma from "../db.server";
import {
  assertChannelsAllowed,
  getShopEntitlements,
} from "./entitlements.server";
import { utcMidnightFromDayKey } from "./shop-local-day";

/**
 * Rows per interactive transaction. With createMany + parallel updates and a
 * 60s txn timeout, 500 stays safe for multi-year Meta+Google re-imports.
 * Multi-year MER outside the SalesDayFact window stays facts-honest — spend
 * import never triggers unbounded Shopify GraphQL backfill.
 */
export const SPEND_UPSERT_BATCH_SIZE = 500;

const SPEND_UPSERT_TX_TIMEOUT_MS = 60_000;
const SPEND_UPSERT_TX_MAX_WAIT_MS = 10_000;

/** Thrown when a live write includes channels outside the shop's plan. */
export class SpendChannelEntitlementError extends Error {
  readonly code = "pro_required" as const;

  constructor(message: string) {
    super(message);
    this.name = "SpendChannelEntitlementError";
  }
}

export type SpendUpsertGate = {
  /** Skip shop lookup when caller already knows the domain. */
  shopDomain?: string;
  /** When set, assert against this list instead of resolving entitlements. */
  allowedChannels?: readonly string[];
  /** When true, skip channel entitlement checks (Pro). */
  canUseAllChannels?: boolean;
};

type PreparedSpendRow = {
  channel: SpendChannel;
  amount: number;
  periodStart: Date;
  periodEnd: Date;
  source: string;
};

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

/** UTC day bounds for a YYYY-MM-DD key — matches SalesDayFact / spine day stamps. */
function dayBounds(date: string): { start: Date; end: Date } {
  const start = utcMidnightFromDayKey(date);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { start, end };
}

/**
 * Persist SpendEntry.source for MER filters (live desk excludes `sample`).
 * Real imports (csv/manual/meta/google) must never leave `sample` in place.
 * Connector sync keeps `meta` / `google`; CSV/manual stay explicit.
 */
export function normalizeSpendEntrySource(source: SpendSource | string): string {
  const raw = String(source || "manual").toLowerCase().trim();
  if (raw === "sample") return "sample";
  if (raw === "csv" || raw.startsWith("csv")) return "csv";
  if (raw === "manual") return "manual";
  if (raw === "meta") return "meta";
  if (raw === "google") return "google";
  return "csv";
}

function isSampleOnlyWrite(rows: SpendDay[]): boolean {
  return (
    rows.length > 0 &&
    rows.every((row) => normalizeSpendEntrySource(row.source) === "sample")
  );
}

/**
 * Fail-closed channel gate for live spend writes.
 * SAMPLE-source batches are allowed (demo desk seed paths).
 */
export async function assertSpendWriteAllowed(
  shopId: string,
  rows: SpendDay[],
  gate?: SpendUpsertGate,
): Promise<void> {
  if (rows.length === 0) return;
  if (isSampleOnlyWrite(rows)) return;

  const channels = rows.map((row) => mapChannel(row.channel));

  if (gate?.canUseAllChannels) return;

  if (gate?.allowedChannels) {
    const allowed = new Set(gate.allowedChannels);
    const blocked = [...new Set(channels.filter((ch) => !allowed.has(ch)))].sort();
    if (blocked.length === 0) return;
    throw new SpendChannelEntitlementError(
      `Pro required for channel(s): ${blocked.join(", ")}. Free includes Meta, Google, and custom Other — named platforms need Pro.`,
    );
  }

  let domain = gate?.shopDomain?.trim();
  if (!domain) {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { domain: true },
    });
    if (!shop?.domain) {
      throw new SpendChannelEntitlementError(
        `Cannot resolve entitlements — shop not found (${shopId}).`,
      );
    }
    domain = shop.domain;
  }

  const entitlements = getShopEntitlements(domain);
  const err = assertChannelsAllowed(entitlements, channels);
  if (err) throw new SpendChannelEntitlementError(err);
}

function prepareSpendRows(rows: SpendDay[]): PreparedSpendRow[] {
  // Last write wins within the batch for the same shop/channel/day key.
  const byKey = new Map<string, PreparedSpendRow>();
  for (const row of rows) {
    const channel = mapChannel(row.channel);
    const { start, end } = dayBounds(row.date);
    const source = normalizeSpendEntrySource(row.source);
    byKey.set(`${channel}|${start.getTime()}`, {
      channel,
      amount: row.amount,
      periodStart: start,
      periodEnd: end,
      source,
    });
  }
  return Array.from(byKey.values());
}

function entryKey(channel: SpendChannel, periodStart: Date): string {
  return `${channel}|${periodStart.getTime()}`;
}

/**
 * One batch: single findMany for existing keys, then createMany for new rows
 * and parallel update only for changed rows. Preserves replace-on-reimport
 * (unique shopId+channel+periodStart; latest amount/source wins).
 */
async function upsertSpendDaysBatch(
  shopId: string,
  rows: SpendDay[],
): Promise<SpendWriteResult> {
  const prepared = prepareSpendRows(rows);
  if (prepared.length === 0) {
    return { written: 0, skipped: 0, created: 0, updated: 0 };
  }

  return prisma.$transaction(
    async (tx) => {
      const periodStarts = Array.from(
        new Map(prepared.map((r) => [r.periodStart.getTime(), r.periodStart])).values(),
      );
      const channels = Array.from(new Set(prepared.map((r) => r.channel)));

      const existing = await tx.spendEntry.findMany({
        where: {
          shopId,
          channel: { in: channels },
          periodStart: { in: periodStarts },
        },
        select: { amount: true, source: true, channel: true, periodStart: true },
      });

      const existingMap = new Map(
        existing.map((e) => [entryKey(e.channel, e.periodStart), e]),
      );

      const toCreate: PreparedSpendRow[] = [];
      const toUpdate: PreparedSpendRow[] = [];
      let skipped = 0;

      for (const row of prepared) {
        const key = entryKey(row.channel, row.periodStart);
        const prior = existingMap.get(key);
        // Skip only when amount AND source already match — otherwise a sample
        // row with the same dollars would stay sample after a CSV re-import.
        if (
          prior &&
          prior.amount === row.amount &&
          prior.source === row.source
        ) {
          skipped += 1;
          continue;
        }
        if (prior) {
          toUpdate.push(row);
        } else {
          toCreate.push(row);
        }
      }

      if (toCreate.length > 0) {
        await tx.spendEntry.createMany({
          data: toCreate.map((row) => ({
            shopId,
            channel: row.channel,
            amount: row.amount,
            periodStart: row.periodStart,
            periodEnd: row.periodEnd,
            note: `sync:${row.source}`,
            source: row.source,
          })),
        });
      }

      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map((row) =>
            tx.spendEntry.update({
              where: {
                shopId_channel_periodStart: {
                  shopId,
                  channel: row.channel,
                  periodStart: row.periodStart,
                },
              },
              data: {
                amount: row.amount,
                periodEnd: row.periodEnd,
                note: `sync:${row.source}`,
                source: row.source,
              },
            }),
          ),
        );
      }

      return {
        written: toCreate.length + toUpdate.length,
        skipped,
        created: toCreate.length,
        updated: toUpdate.length,
      };
    },
    {
      timeout: SPEND_UPSERT_TX_TIMEOUT_MS,
      maxWait: SPEND_UPSERT_TX_MAX_WAIT_MS,
    },
  );
}

/**
 * Prisma-backed SpendRepository for connector sync jobs + CSV/bill desk imports.
 * Upserts one SpendEntry per shop/channel/periodStart — latest write wins on
 * amount/periodEnd/note/source. Never sums duplicates.
 *
 * Batches: findMany + createMany/update in chunks of SPEND_UPSERT_BATCH_SIZE.
 * Live writes fail-closed on Free when any channel is outside Meta + Google.
 * All-sample batches skip the gate (SAMPLE desk).
 */
export function createSpendRepository(): SpendRepository & {
  upsertSpendDays(
    shopId: string,
    rows: SpendDay[],
    gate?: SpendUpsertGate,
  ): Promise<SpendWriteResult>;
} {
  return {
    async upsertSpendDays(
      shopId: string,
      rows: SpendDay[],
      gate?: SpendUpsertGate,
    ): Promise<SpendWriteResult> {
      if (rows.length === 0) {
        return { written: 0, skipped: 0, created: 0, updated: 0 };
      }

      await assertSpendWriteAllowed(shopId, rows, gate);

      let written = 0;
      let skipped = 0;
      let created = 0;
      let updated = 0;

      for (let i = 0; i < rows.length; i += SPEND_UPSERT_BATCH_SIZE) {
        const chunk = rows.slice(i, i + SPEND_UPSERT_BATCH_SIZE);
        const result = await upsertSpendDaysBatch(shopId, chunk);
        written += result.written;
        skipped += result.skipped;
        created += result.created;
        updated += result.updated;
      }

      return { written, skipped, created, updated };
    },
  };
}

/**
 * Dry-run replace/add/skip counts for a CSV upsert — no writes.
 * Same shop+channel+day key as upsertSpendDays (replace, never sum with DB).
 */
export async function previewSpendUpsert(
  shopId: string,
  rows: SpendDay[],
): Promise<Pick<SpendWriteResult, "created" | "updated" | "skipped" | "written">> {
  if (rows.length === 0) {
    return { written: 0, skipped: 0, created: 0, updated: 0 };
  }

  const prepared = prepareSpendRows(rows);
  if (prepared.length === 0) {
    return { written: 0, skipped: 0, created: 0, updated: 0 };
  }

  const periodStarts = Array.from(
    new Map(prepared.map((r) => [r.periodStart.getTime(), r.periodStart])).values(),
  );
  const channels = Array.from(new Set(prepared.map((r) => r.channel)));

  const existing = await prisma.spendEntry.findMany({
    where: {
      shopId,
      channel: { in: channels },
      periodStart: { in: periodStarts },
    },
    select: { amount: true, source: true, channel: true, periodStart: true },
  });

  const existingMap = new Map(
    existing.map((e) => [entryKey(e.channel, e.periodStart), e]),
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of prepared) {
    const key = entryKey(row.channel, row.periodStart);
    const prior = existingMap.get(key);
    if (
      prior &&
      prior.amount === row.amount &&
      prior.source === row.source
    ) {
      skipped += 1;
      continue;
    }
    if (prior) updated += 1;
    else created += 1;
  }

  return {
    written: created + updated,
    skipped,
    created,
    updated,
  };
}
