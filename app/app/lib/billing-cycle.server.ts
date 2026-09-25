/**
 * Paid-cycle row keyed by shop domain.
 * Uninstall keeps a future paid end. shop/redact deletes it.
 * Trials are not written here.
 */

import prisma from "../db.server";
import { uninstallKeepsPaidCycle } from "./billing-subscription";

export function normalizeBillingShopDomain(shopDomain: string): string {
  return shopDomain.trim().toLowerCase();
}

export async function readPaidCycleEnd(
  shopDomain: string,
): Promise<Date | null> {
  const row = await prisma.shopBillingCycle.findUnique({
    where: { shopDomain: normalizeBillingShopDomain(shopDomain) },
    select: { paidCycleEndsAt: true },
  });
  return row?.paidCycleEndsAt ?? null;
}

export async function writePaidCycle(input: {
  shopDomain: string;
  paidCycleEndsAt: Date;
  cancelAtEndOfCycle: boolean;
}): Promise<void> {
  const shopDomain = normalizeBillingShopDomain(input.shopDomain);
  await prisma.shopBillingCycle.upsert({
    where: { shopDomain },
    create: {
      shopDomain,
      paidCycleEndsAt: input.paidCycleEndsAt,
      cancelAtEndOfCycle: input.cancelAtEndOfCycle,
    },
    update: {
      paidCycleEndsAt: input.paidCycleEndsAt,
      cancelAtEndOfCycle: input.cancelAtEndOfCycle,
    },
  });
}

export async function clearPaidCycle(shopDomain: string): Promise<void> {
  await prisma.shopBillingCycle.deleteMany({
    where: { shopDomain: normalizeBillingShopDomain(shopDomain) },
  });
}

/**
 * Uninstall stops the next cycle. Shopify does that on its side.
 * Keep the paid end when it is still in the future so reinstall does not
 * look unpaid and start another charge. Drop a missing or expired end.
 * Does not record trial use.
 */
export async function noteUninstallStopsNextCycle(
  shopDomain: string,
  now: Date = new Date(),
): Promise<"kept" | "dropped"> {
  const domain = normalizeBillingShopDomain(shopDomain);
  const row = await prisma.shopBillingCycle.findUnique({
    where: { shopDomain: domain },
    select: { paidCycleEndsAt: true },
  });
  if (
    !row ||
    !uninstallKeepsPaidCycle(row.paidCycleEndsAt.toISOString(), now)
  ) {
    if (row) await prisma.shopBillingCycle.deleteMany({ where: { shopDomain: domain } });
    return "dropped";
  }
  await prisma.shopBillingCycle.update({
    where: { shopDomain: domain },
    data: { cancelAtEndOfCycle: true },
  });
  return "kept";
}
