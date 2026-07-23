import { unauthenticated } from "../shopify.server";
import { fetchShopifySales } from "./shopify-sales.server";
import type { DateRange } from "./periods";

export type ShopSalesApiResult = {
  totalSales: number;
  orderCount: number;
  newCustomers: number;
  returningCustomers: number;
  guestOrders: number;
  warning?: string;
};

/**
 * Fetch Shopify sales for API + overnight worker using stored offline session.
 */
export async function fetchShopifySalesForShop(
  shopDomain: string,
  range: DateRange,
): Promise<ShopSalesApiResult> {
  try {
    const { admin } = await unauthenticated.admin(shopDomain);
    const sales = await fetchShopifySales(admin, range);
    return {
      totalSales: sales.totalSales,
      orderCount: sales.orderCount,
      newCustomers: sales.newCustomers,
      returningCustomers: sales.returningCustomers,
      guestOrders: sales.guestOrders,
    };
  } catch (err) {
    return {
      totalSales: 0,
      orderCount: 0,
      newCustomers: 0,
      returningCustomers: 0,
      guestOrders: 0,
      warning:
        err instanceof Error
          ? err.message
          : "No Shopify session — install app on store first",
    };
  }
}
