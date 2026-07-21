#!/usr/bin/env node
/**
 * Mint a per-shop API token for Sheets companion.
 * Usage: node scripts/mint-api-token.mjs your-store.myshopify.com [label]
 */
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";

const prisma = new PrismaClient();
const domain = process.argv[2];
const label = process.argv[3] ?? "sheets";

if (!domain) {
  console.error("Usage: node scripts/mint-api-token.mjs <shop-domain> [label]");
  process.exit(1);
}

const normalized = domain.includes(".myshopify.com")
  ? domain
  : `${domain}.myshopify.com`;

const shop = await prisma.shop.upsert({
  where: { domain: normalized },
  create: { domain: normalized },
  update: {},
});

const token = `mcfly_${randomBytes(32).toString("base64url")}`;
const tokenHash = createHash("sha256").update(token).digest("hex");

await prisma.apiToken.create({
  data: {
    shopId: shop.id,
    tokenHash,
    label,
  },
});

console.log("Shop:", normalized);
console.log("Token (save now — shown once):", token);
console.log("\nSheets Script Properties:");
console.log("MCFLY_API_BASE=https://YOUR-HOST/v1");
console.log("MCFLY_API_TOKEN=" + token);
console.log("MCFLY_SHOP_ID=" + normalized);

await prisma.$disconnect();
