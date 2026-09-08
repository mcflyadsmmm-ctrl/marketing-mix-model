import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";

/** Standard Shop fields needed for shop-local day boundaries and fact currency. */
const SHOP_METADATA_QUERY = `#graphql
  query McflyShopMetadata {
    shop {
      ianaTimezone
      currencyCode
    }
  }
`;

type ShopMetadataJson = {
  data?: {
    shop?: {
      ianaTimezone?: string | null;
      currencyCode?: string | null;
    };
  };
  errors?: Array<{ message?: string }>;
};

export interface ShopMetadata {
  ianaTimezone: string | null;
  currencyCode: string | null;
}

/** Raw GraphQL pull — throws on Shopify errors so callers can decide how to handle failure. */
export async function fetchShopMetadata(admin: AdminApiContext): Promise<ShopMetadata> {
  const response = await admin.graphql(SHOP_METADATA_QUERY);
  const json = (await response.json()) as ShopMetadataJson;

  if (json.errors?.length) {
    throw new Error(
      json.errors.map((e) => e.message).filter(Boolean).join("; ") ||
        "Shopify GraphQL error",
    );
  }

  const shop = json.data?.shop;
  if (!shop) {
    throw new Error("Failed to fetch shop metadata from Shopify Admin API");
  }

  return {
    ianaTimezone: shop.ianaTimezone ?? null,
    currencyCode: shop.currencyCode ?? null,
  };
}

/**
 * Pull shop { ianaTimezone currencyCode } and persist on Shop.
 * Never blanks a stored value with a null Shopify response — a transient/partial
 * response should not erase timezone data the ingest lane depends on.
 */
export async function syncShopMetadata(
  admin: AdminApiContext,
  shopId: string,
): Promise<ShopMetadata> {
  const metadata = await fetchShopMetadata(admin);

  await prisma.shop.update({
    where: { id: shopId },
    data: {
      ...(metadata.ianaTimezone ? { ianaTimezone: metadata.ianaTimezone } : {}),
      ...(metadata.currencyCode ? { currencyCode: metadata.currencyCode } : {}),
    },
  });

  return metadata;
}

/**
 * Return the shop's current metadata, syncing from Shopify only when ianaTimezone
 * is missing. `ianaTimezone` may still be null on return — callers (sales-facts
 * backfill) must skip ingest rather than fall back to server-local time.
 */
export async function ensureShopMetadata(
  admin: AdminApiContext,
  shopId: string,
): Promise<ShopMetadata> {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { ianaTimezone: true, currencyCode: true },
  });

  if (shop?.ianaTimezone) {
    return { ianaTimezone: shop.ianaTimezone, currencyCode: shop.currencyCode ?? null };
  }

  try {
    return await syncShopMetadata(admin, shopId);
  } catch {
    // Honest fallback — caller sees the (possibly still-null) stored value,
    // never a fabricated timezone.
    return { ianaTimezone: shop?.ianaTimezone ?? null, currencyCode: shop?.currencyCode ?? null };
  }
}
