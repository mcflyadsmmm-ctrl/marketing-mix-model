import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Sessions may already be gone on repeat deliveries.
  if (session) {
    await db.session.deleteMany({ where: { shop } });
  }

  // Cascade deletes Settings + SpendEntry via Prisma relations.
  await db.shop.deleteMany({ where: { domain: shop } });

  return new Response();
};
