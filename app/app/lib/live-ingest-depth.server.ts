import prisma from "../db.server";
import { isBillingEnabled } from "./billing-flag.server";
import { isProShop } from "./entitlements.server";
import {
  liveIngestDepth,
  resolveLiveIngestWindowDays,
  shopMayIngestFullHistory,
  type LiveIngestDepth,
} from "./live-ingest-depth";

export {
  liveIngestDepth,
  resolveLiveIngestWindowDays,
  shopMayIngestFullHistory,
  ORDER_ROW_WINDOW_MONTHS,
  orderRowWindowDayCount,
  resolveOrderRowWindowDays,
  type LiveIngestDepth,
} from "./live-ingest-depth";

export async function shopIsProForIngest(shopId: string): Promise<boolean> {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { domain: true, proBillingActive: true },
  });
  if (!shop) return false;
  return isProShop(shop.domain, { paidPro: shop.proBillingActive });
}

export async function shopLiveIngestDepth(
  shopId: string,
): Promise<LiveIngestDepth> {
  const isPro = await shopIsProForIngest(shopId);
  return liveIngestDepth({
    billingEnabled: isBillingEnabled(),
    isPro,
  });
}
