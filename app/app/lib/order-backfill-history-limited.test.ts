import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueState = vi.fn();
const findUniqueShop = vi.fn();
const findFirstSession = vi.fn();

vi.mock("../db.server", () => ({
  default: {
    orderBackfillState: {
      findUnique: (...args: unknown[]) => findUniqueState(...args),
    },
    shop: {
      findUnique: (...args: unknown[]) => findUniqueShop(...args),
    },
    session: {
      findFirst: (...args: unknown[]) => findFirstSession(...args),
    },
  },
}));

import { getOrderBackfillHistoryLimited } from "./order-facts.server";

describe("getOrderBackfillHistoryLimited", () => {
  beforeEach(() => {
    findUniqueState.mockReset();
    findUniqueShop.mockReset();
    findFirstSession.mockReset();
  });

  it("returns false when granted scopes include read_all_orders (unstick UI)", async () => {
    findUniqueState.mockResolvedValue({ historyLimited: true });
    const limited = await getOrderBackfillHistoryLimited("shop_1", {
      grantedScopes: "read_orders,read_customers,read_all_orders",
    });
    expect(limited).toBe(false);
    expect(findUniqueState).not.toHaveBeenCalled();
  });

  it("reads the persisted flag when the token still lacks read_all_orders", async () => {
    findUniqueState.mockResolvedValue({ historyLimited: true });
    const limited = await getOrderBackfillHistoryLimited("shop_1", {
      grantedScopes: "read_orders,read_customers",
    });
    expect(limited).toBe(true);
    expect(findUniqueState).toHaveBeenCalledWith({
      where: { shopId: "shop_1" },
      select: { historyLimited: true },
    });
  });

  it("looks up the offline session when grant is not passed", async () => {
    findUniqueShop.mockResolvedValue({ domain: "acme.myshopify.com" });
    findFirstSession.mockResolvedValue({
      scope: "read_orders,read_customers,read_all_orders",
      isOnline: false,
    });
    const limited = await getOrderBackfillHistoryLimited("shop_1");
    expect(limited).toBe(false);
    expect(findFirstSession).toHaveBeenCalled();
  });
});
