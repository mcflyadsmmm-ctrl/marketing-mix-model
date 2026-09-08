/**
 * Shopify Admin GraphQL cost / THROTTLED helpers (Wave 1 — MAJOR_IMPROVEMENT_PLAN W1-4).
 *
 * Prefer Bulk Operations for historical imports ≫ ~250 records instead of deep
 * pagination that drains the cost bucket.
 */

export type GraphqlCostThrottleStatus = {
  maximumAvailable?: number;
  currentlyAvailable?: number;
  restoreRate?: number;
};

export type GraphqlCostExtensions = {
  requestedQueryCost?: number;
  actualQueryCost?: number;
  throttleStatus?: GraphqlCostThrottleStatus;
};

/** Alias used by shopify-sales.server.ts */
export type GraphqlCost = GraphqlCostExtensions;

export type GraphqlErrorLike = {
  message?: string;
  extensions?: { code?: string };
};

export type GraphqlJsonWithCost = {
  errors?: GraphqlErrorLike[];
  extensions?: { cost?: GraphqlCostExtensions };
};

type AdminGraphqlClient = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

export function isGraphqlThrottled(
  errors: GraphqlErrorLike[] | undefined,
): boolean {
  return Boolean(
    errors?.some((e) => {
      const code = String(e.extensions?.code ?? "").toUpperCase();
      if (code === "THROTTLED") return true;
      return /throttled/i.test(String(e.message ?? ""));
    }),
  );
}

/**
 * Deterministic wait from extensions.cost (research failure-vector formula).
 * Falls back to 1000ms when cost metadata is missing.
 */
export function waitMsForThrottle(cost: GraphqlCostExtensions | undefined): number {
  const requested = cost?.requestedQueryCost;
  const available = cost?.throttleStatus?.currentlyAvailable;
  const restore = cost?.throttleStatus?.restoreRate;
  if (
    typeof requested !== "number" ||
    typeof available !== "number" ||
    typeof restore !== "number" ||
    !(restore > 0)
  ) {
    return 1000;
  }
  const deficit = requested - available;
  if (deficit <= 0) return 100;
  return Math.ceil((deficit / restore) * 1000) + 100;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

/**
 * Run Admin GraphQL and retry once (default) after THROTTLED using cost restore math.
 */
export async function adminGraphqlJson<T extends GraphqlJsonWithCost>(
  admin: AdminGraphqlClient,
  query: string,
  variables?: Record<string, unknown>,
  opts?: { maxRetries?: number },
): Promise<T> {
  const maxRetries = opts?.maxRetries ?? 1;
  let attempt = 0;
  for (;;) {
    const response = await admin.graphql(
      query,
      variables ? { variables } : undefined,
    );
    const json = (await response.json()) as T;
    if (!isGraphqlThrottled(json.errors) || attempt >= maxRetries) {
      return json;
    }
    await sleep(waitMsForThrottle(json.extensions?.cost));
    attempt += 1;
  }
}
