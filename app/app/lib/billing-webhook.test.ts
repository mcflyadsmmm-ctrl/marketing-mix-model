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
    },
  },
}));

import prisma from "../db.server";

const findUnique = prisma.shop.findUnique as unknown as ReturnType<typeof vi.fn>;
const update = prisma.shop.update as unknown as ReturnType<typeof vi.fn>;

describe("billing webhook helpers", () => {
  beforeEach(() => {
    findUnique.mockReset();
    update.mockReset();
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
