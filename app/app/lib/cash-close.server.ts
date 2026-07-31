/**
 * Monday Cash Close — Prisma persistence (server-only).
 * Pure helpers live in `./cash-close` (client-safe).
 */

import type { CashClose } from "@prisma/client";
import prisma from "../db.server";
import {
  buildCloseExceptions,
  canLockCashClose,
  validateCloseDecision,
  type CloseMetricsInput,
} from "./cash-close";

export {
  buildCloseExceptions,
  canLockCashClose,
  formatCashCloseCsv,
  formatCashCloseMemo,
  formatTillTruthMemo,
  computeGrossMer,
  returnsHaircut,
  isCloseDecision,
  MAX_CUT_PCT,
  parseExceptionsJson,
  validateCloseDecision,
  CLOSE_DECISIONS,
  type CloseDecision,
  type CloseException,
  type CloseMetricsInput,
  type CashCloseCsvRow,
  type CashCloseMemoPace,
  type CashCloseMemoExtras,
} from "./cash-close";

export async function listCashCloses(
  shopId: string,
  limit = 12,
): Promise<CashClose[]> {
  const take = Math.max(1, Math.min(50, Math.floor(limit)));
  return prisma.cashClose.findMany({
    where: { shopId },
    orderBy: { lockedAt: "desc" },
    take,
  });
}

export async function getCashCloseForPeriod(
  shopId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<CashClose | null> {
  return prisma.cashClose.findUnique({
    where: {
      shopId_periodStart_periodEnd: {
        shopId,
        periodStart,
        periodEnd,
      },
    },
  });
}

export async function getCashCloseById(
  shopId: string,
  id: string,
): Promise<CashClose | null> {
  return prisma.cashClose.findFirst({
    where: { id, shopId },
  });
}

export type LockCashCloseResult =
  | { ok: true; close: CashClose }
  | { ok: false; error: string };

/**
 * Persist an immutable weekly/period close.
 * Refuses duplicate lock for the same shop + period window.
 */
export async function lockCashClose(input: {
  shopId: string;
  metrics: CloseMetricsInput;
  decision: string;
  decisionNote?: string | null;
  cutPct?: number | null;
}): Promise<LockCashCloseResult> {
  const gate = canLockCashClose(input.metrics);
  if (!gate.ok) {
    return { ok: false, error: gate.reason ?? "Cannot save this period." };
  }

  const validated = validateCloseDecision(input.decision, input.cutPct);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }

  const existing = await getCashCloseForPeriod(
    input.shopId,
    input.metrics.period.start,
    input.metrics.period.end,
  );
  if (existing) {
    return {
      ok: false,
      error: `This period is already saved (${existing.periodLabel}). Download the CSV or pick another period.`,
    };
  }

  const exceptions = buildCloseExceptions(input.metrics);
  const prior = await prisma.cashClose.findFirst({
    where: { shopId: input.shopId },
    orderBy: { lockedAt: "desc" },
  });

  const netSales = input.metrics.netSales;
  const spend = input.metrics.totalSpend;
  const mer = input.metrics.mer;
  const deltaSales = prior ? netSales - prior.netSales : null;
  const deltaSpend = prior ? spend - prior.spend : null;
  const deltaMer =
    prior && mer != null && prior.mer != null ? mer - prior.mer : null;

  const note =
    input.decisionNote != null && String(input.decisionNote).trim() !== ""
      ? String(input.decisionNote).trim().slice(0, 2000)
      : null;

  try {
    const close = await prisma.cashClose.create({
      data: {
        shopId: input.shopId,
        periodStart: input.metrics.period.start,
        periodEnd: input.metrics.period.end,
        periodLabel: input.metrics.period.label,
        netSales,
        grossSales: input.metrics.grossSales,
        spend,
        mer,
        breakEvenMer: input.metrics.breakEvenMer,
        marginPct: input.metrics.marginPct,
        coveragePct: input.metrics.spendCoverage.coveragePct,
        reconStatus: input.metrics.spendRecon?.status ?? "none",
        cashActionReady: input.metrics.cashActionReady,
        exceptionsJson: JSON.stringify(exceptions),
        decision: validated.decision,
        decisionNote: note,
        cutPct: validated.cutPct,
        priorCloseId: prior?.id ?? null,
        deltaSales,
        deltaSpend,
        deltaMer,
      },
    });
    return { ok: true, close };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique constraint") || msg.includes("CashClose_shopId")) {
      return {
        ok: false,
        error:
          "This period is already saved. Refresh and download the existing export.",
      };
    }
    return { ok: false, error: "Failed to save this period. Try again." };
  }
}
