import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  applyAppSubscriptionWebhook,
  proActiveFromSubscriptionStatus,
} from "./billing-webhook.server";

vi.mock("../db.server", () => ({
  default: {
    shop: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    shopBillingCycle: {
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import prisma from "../db.server";

const findUnique = prisma.shop.findUnique as unknown as ReturnType<typeof vi.fn>;
const update = prisma.shop.update as unknown as ReturnType<typeof vi.fn>;
const create = prisma.shop.create as unknown as ReturnType<typeof vi.fn>;
const findCycle = prisma.shopBillingCycle.findUnique as unknown as ReturnType<
  typeof vi.fn
>;
const deleteCycle = prisma.shopBillingCycle.deleteMany as unknown as ReturnType<
  typeof vi.fn
>;

describe("billing webhook helpers", () => {
  beforeEach(() => {
    findUnique.mockReset();
    update.mockReset();
    create.mockReset();
    findCycle.mockReset();
    deleteCycle.mockReset();
    findCycle.mockResolvedValue(null);
    deleteCycle.mockResolvedValue({ count: 0 });
    create.mockResolvedValue({});
  });

  it("ACTIVE unlocks Pro; CANCELLED clears", () => {
    expect(proActiveFromSubscriptionStatus("ACTIVE")).toBe(true);
    expect(proActiveFromSubscriptionStatus("CANCELLED")).toBe(false);
    expect(proActiveFromSubscriptionStatus("DECLINED")).toBe(false);
  });

  it("sets Pro on ACTIVE Mcfly plan webhook", async () => {
    findUnique.mockResolvedValue({
      id: "shop1",
      proSubscriptionGid: null,
      proBillingActive: false,
    });
    update.mockResolvedValue({});
    const result = await applyAppSubscriptionWebhook("acme.myshopify.com", {
      app_subscription: {
        admin_graphql_api_id: "gid://shopify/AppSubscription/1",
        name: "Mcfly Analytics Pro",
        status: "ACTIVE",
      },
    });
    expect(result).toEqual({ touched: true, active: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: "shop1" },
      data: {
        proBillingActive: true,
        proSubscriptionGid: "gid://shopify/AppSubscription/1",
      },
    });
  });

  it("clears Pro on DECLINED for known GID", async () => {
    findUnique.mockResolvedValue({
      id: "shop1",
      proSubscriptionGid: "gid://shopify/AppSubscription/1",
      proBillingActive: true,
    });
    update.mockResolvedValue({});
    const result = await applyAppSubscriptionWebhook("acme.myshopify.com", {
      app_subscription: {
        admin_graphql_api_id: "gid://shopify/AppSubscription/1",
        name: "Mcfly Analytics Pro",
        status: "DECLINED",
      },
    });
    expect(result).toEqual({ touched: true, active: false });
    expect(update).toHaveBeenCalledWith({
      where: { id: "shop1" },
      data: {
        proBillingActive: false,
        proSubscriptionGid: null,
      },
    });
  });

  it("creates the shop when ACTIVE arrives before the row exists", async () => {
    findUnique.mockResolvedValue(null);
    const result = await applyAppSubscriptionWebhook("acme.myshopify.com", {
      app_subscription: {
        admin_graphql_api_id: "gid://shopify/AppSubscription/9",
        name: "Mcfly Analytics",
        status: "ACTIVE",
      },
    });
    expect(result).toEqual({ touched: true, active: true });
    expect(create).toHaveBeenCalledWith({
      data: {
        domain: "acme.myshopify.com",
        proBillingActive: true,
        proSubscriptionGid: "gid://shopify/AppSubscription/9",
      },
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("keeps Pro on CANCELLED while a paid cycle has not ended", async () => {
    findUnique.mockResolvedValue({
      id: "shop1",
      proSubscriptionGid: "gid://shopify/AppSubscription/1",
      proBillingActive: true,
    });
    findCycle.mockResolvedValue({
      paidCycleEndsAt: new Date("2099-01-01T00:00:00.000Z"),
    });
    update.mockResolvedValue({});
    const result = await applyAppSubscriptionWebhook("acme.myshopify.com", {
      app_subscription: {
        admin_graphql_api_id: "gid://shopify/AppSubscription/1",
        name: "Mcfly Analytics",
        status: "CANCELLED",
      },
    });
    expect(result).toEqual({ touched: true, active: true });
    expect(deleteCycle).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { id: "shop1" },
      data: {
        proBillingActive: true,
        proSubscriptionGid: "gid://shopify/AppSubscription/1",
      },
    });
  });

  it("clears Pro on CANCELLED for known GID", async () => {
    findUnique.mockResolvedValue({
      id: "shop1",
      proSubscriptionGid: "gid://shopify/AppSubscription/1",
      proBillingActive: true,
    });
    update.mockResolvedValue({});
    const result = await applyAppSubscriptionWebhook("acme.myshopify.com", {
      app_subscription: {
        admin_graphql_api_id: "gid://shopify/AppSubscription/1",
        name: "Mcfly Analytics Pro",
        status: "CANCELLED",
      },
    });
    expect(result).toEqual({ touched: true, active: false });
    expect(update).toHaveBeenCalledWith({
      where: { id: "shop1" },
      data: {
        proBillingActive: false,
        proSubscriptionGid: null,
      },
    });
    expect(deleteCycle).toHaveBeenCalledWith({
      where: { shopDomain: "acme.myshopify.com" },
    });
  });

  it("ignores unrelated subscription names", async () => {
    findUnique.mockResolvedValue({
      id: "shop1",
      proSubscriptionGid: null,
      proBillingActive: false,
    });
    const result = await applyAppSubscriptionWebhook("acme.myshopify.com", {
      app_subscription: {
        admin_graphql_api_id: "gid://other",
        name: "Some Other App",
        status: "ACTIVE",
      },
    });
    expect(result.touched).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
