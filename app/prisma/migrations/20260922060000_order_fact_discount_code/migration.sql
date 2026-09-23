-- Named discount code when Shopify sent DiscountCodeApplication.code.
-- Nullable; never invent from discount $. No backfill-cursor reset.

ALTER TABLE "OrderFact" ADD COLUMN IF NOT EXISTS "discountCode" TEXT;
