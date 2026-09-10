import type { SpendChannel } from "@prisma/client";
import prisma from "../db.server";
import {
  createSpendRepository,
  normalizeSpendEntrySource,
} from "./spend-repository.server";
import { utcMidnightFromDayKey, shopLocalDayKey } from "./shop-local-day";
import { localDayKey } from "./sample-desk.server";
import { roundMoney, shopCurrencyCode } from "./spend-money";
import { salesDayFactWindowStartUtc } from "./sales-facts.server";

const MAX_FILL_DAYS = 2000;

/** Sources a merchant (or CSV) wrote — recurring fill must not overwrite these. */
const CORRECTION_SOURCES = new Set([
  "manual",
  "csv",
  "meta",
  "google",
  "sample",
]);

export type RecurringSpendRuleView = {
  id: string;
  channel: SpendChannel;
  customKey: string;
  note: string | null;
  amount: number;
  currency: string;
  startDateKey: string;
  endDateKey: string | null;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function ymdKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function addUtcYmd(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return ymdKey(next);
}

export function previousSpendYmd(key: string): string {
  return addUtcYmd(key, -1);
}

export function spendYmdRangeInclusive(fromKey: string, toKey: string): string[] {
  return eachYmdInclusive(fromKey, toKey);
}

function eachYmdInclusive(fromKey: string, toKey: string): string[] {
  if (fromKey > toKey) return [];
  const days: string[] = [];
  let cursor = fromKey;
  for (let i = 0; i < MAX_FILL_DAYS; i++) {
    days.push(cursor);
    if (cursor === toKey) break;
    cursor = addUtcYmd(cursor, 1);
  }
  return days;
}

function maxYmd(a: string, b: string): string {
  return a >= b ? a : b;
}

function minYmd(a: string, b: string): string {
  return a <= b ? a : b;
}

export async function listRecurringSpend(
  shopId: string,
): Promise<RecurringSpendRuleView[]> {
  const rows = await prisma.recurringSpend.findMany({
    where: { shopId, endDate: null },
    orderBy: [{ channel: "asc" }, { startDate: "desc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    channel: row.channel,
    customKey: row.customKey,
    note: row.note,
    amount: roundMoney(Number(row.amount)),
    currency: shopCurrencyCode(row.currency),
    startDateKey: ymdKey(row.startDate),
    endDateKey: row.endDate ? ymdKey(row.endDate) : null,
  }));
}

export async function startRecurringSpend(opts: {
  shopId: string;
  channel: SpendChannel;
  customKey: string;
  amount: number;
  currency: string;
  startDateKey: string;
  note: string | null;
}): Promise<void> {
  const amount = roundMoney(opts.amount);
  const currency = shopCurrencyCode(opts.currency);
  const startDate = utcMidnightFromDayKey(opts.startDateKey);
  const customKey = opts.customKey;
  const note = opts.note;

  const open = await prisma.recurringSpend.findMany({
    where: {
      shopId: opts.shopId,
      channel: opts.channel,
      customKey,
      endDate: null,
    },
  });

  for (const rule of open) {
    const priorStart = ymdKey(rule.startDate);
    if (priorStart === opts.startDateKey) {
      await prisma.recurringSpend.update({
        where: { id: rule.id },
        data: { amount, currency, note },
      });
      return;
    }
    const lastDay = previousSpendYmd(opts.startDateKey);
    if (lastDay < priorStart) {
      await prisma.recurringSpend.update({
        where: { id: rule.id },
        data: { endDate: rule.startDate },
      });
    } else {
      await prisma.recurringSpend.update({
        where: { id: rule.id },
        data: { endDate: utcMidnightFromDayKey(lastDay) },
      });
    }
  }

  await prisma.recurringSpend.create({
    data: {
      shopId: opts.shopId,
      channel: opts.channel,
      customKey,
      amount,
      currency,
      startDate,
      note,
    },
  });
}

export async function stopRecurringSpend(opts: {
  shopId: string;
  ruleId: string;
  throughDateKey: string;
}): Promise<void> {
  const rule = await prisma.recurringSpend.findFirst({
    where: { id: opts.ruleId, shopId: opts.shopId },
  });
  if (!rule) return;
  const startKey = ymdKey(rule.startDate);
  const endKey =
    opts.throughDateKey < startKey ? startKey : opts.throughDateKey;
  await prisma.recurringSpend.update({
    where: { id: rule.id },
    data: { endDate: utcMidnightFromDayKey(endKey) },
  });
}

/**
 * Write recurring days through `throughYmd` (typically yesterday).
 * Existing manual/csv/meta/google/sample rows are corrections — left alone.
 * Missing days and existing `recurring` rows are filled/updated from the rule.
 */
export async function materializeRecurringSpend(opts: {
  shopId: string;
  currency: string;
  throughYmd: string;
  floorYmd: string;
}): Promise<{ written: number }> {
  const throughYmd = opts.throughYmd;
  const floorYmd = opts.floorYmd;
  if (throughYmd < floorYmd) return { written: 0 };

  const rules = await prisma.recurringSpend.findMany({
    where: {
      shopId: opts.shopId,
      startDate: { lte: utcMidnightFromDayKey(throughYmd) },
      OR: [{ endDate: null }, { endDate: { gte: utcMidnightFromDayKey(floorYmd) } }],
    },
  });
  if (rules.length === 0) return { written: 0 };

  const repository = createSpendRepository();
  let written = 0;

  for (const rule of rules) {
    const startKey = maxYmd(ymdKey(rule.startDate), floorYmd);
    const ruleEnd = rule.endDate ? ymdKey(rule.endDate) : throughYmd;
    const endKey = minYmd(ruleEnd, throughYmd);
    const days = eachYmdInclusive(startKey, endKey);
    if (days.length === 0) continue;

    const periodStarts = days.map((d) => utcMidnightFromDayKey(d));
    const existing = await prisma.spendEntry.findMany({
      where: {
        shopId: opts.shopId,
        channel: rule.channel,
        customKey: rule.customKey,
        periodStart: { in: periodStarts },
      },
      select: { periodStart: true, source: true },
    });
    const blocked = new Set<string>();
    for (const row of existing) {
      const source = normalizeSpendEntrySource(row.source);
      if (CORRECTION_SOURCES.has(source)) {
        blocked.add(ymdKey(row.periodStart));
      }
    }

    const toWrite = days
      .filter((date) => !blocked.has(date))
      .map((date) => ({
        date,
        channel: rule.channel,
        amount: roundMoney(Number(rule.amount)),
        currency: shopCurrencyCode(rule.currency || opts.currency),
        source: "recurring" as const,
        customKey: rule.customKey,
        note: rule.note ?? undefined,
      }));

    if (toWrite.length === 0) continue;
    const result = await repository.upsertSpendDays(opts.shopId, toWrite);
    written += result.written;
  }

  return { written };
}

/**
 * Fill open recurring rules through yesterday for a live shop.
 * Sample desks skip — those dollars are the SAMPLE book, not this rule.
 */
export async function materializeRecurringSpendForShop(opts: {
  shopId: string;
  currencyCode: string | null | undefined;
  ianaTimezone: string | null | undefined;
  sampleOn: boolean;
  now?: Date;
}): Promise<{ written: number }> {
  if (opts.sampleOn) return { written: 0 };
  const now = opts.now ?? new Date();
  const todayKey = opts.ianaTimezone
    ? shopLocalDayKey(now, opts.ianaTimezone)
    : localDayKey(now);
  return materializeRecurringSpend({
    shopId: opts.shopId,
    currency: shopCurrencyCode(opts.currencyCode),
    throughYmd: previousSpendYmd(todayKey),
    floorYmd: salesDayFactWindowStartUtc().toISOString().slice(0, 10),
  });
}
