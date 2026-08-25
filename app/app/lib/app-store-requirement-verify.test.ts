/**
 * Deterministic source checks for Shopify App Store requirements that can be
 * evidenced without Partner Dashboard access or an authenticated Admin session.
 */
import { readFileSync, readdirSync, type Dirent } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const appSourceRoot = join(repoRoot, "app/app");

function readRepo(rel: string): string {
  return readFileSync(join(repoRoot, rel), "utf8");
}

function walkFiles(
  directory: string,
  include: (path: string, entry: Dirent) => boolean,
): string[] {
  let entries: Dirent[];
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  return entries.flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walkFiles(path, include);
    return include(path, entry) ? [path] : [];
  });
}

const runtimeSourceFiles = walkFiles(
  appSourceRoot,
  (path, entry) =>
    entry.isFile() &&
    /\.(?:ts|tsx)$/.test(path) &&
    !/\.(?:test|spec)\.(?:ts|tsx)$/.test(path),
);

function runtimeSources(): Array<{ path: string; source: string }> {
  return runtimeSourceFiles.map((path) => ({
    path: relative(repoRoot, path).replaceAll("\\", "/"),
    source: readFileSync(path, "utf8"),
  }));
}

function publicScopes(toml: string): string[] {
  const match = toml.match(/^\s*scopes\s*=\s*"([^"]*)"/m);
  expect(match, "public TOML must declare access scopes").not.toBeNull();
  return (match?.[1] ?? "")
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function graphqlDocuments(source: string): string[] {
  return [...source.matchAll(/`#graphql\s*([\s\S]*?)`/g)].map(
    (match) => match[1] ?? "",
  );
}

describe("Shopify App Store source verification", () => {
  it("2.2.3 loads App Bridge first, before Links and Scripts", () => {
    const root = readRepo("app/app/root.tsx");
    const headStart = root.indexOf("<head>");
    const headEnd = root.indexOf("</head>");
    const appBridge = root.indexOf(
      '<script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"',
    );
    const links = root.indexOf("<Links");
    const scripts = root.indexOf("<Scripts");

    expect(headStart).toBeGreaterThan(-1);
    expect(headEnd).toBeGreaterThan(headStart);
    expect(root).toMatch(
      /\{loadAppBridge\s*\?\s*\([\s\S]*?<script src="https:\/\/cdn\.shopify\.com\/shopifycloud\/app-bridge\.js"/,
    );
    expect(appBridge).toBeGreaterThan(headStart);
    expect(appBridge).toBeLessThan(headEnd);
    expect(appBridge).toBeLessThan(links);
    expect(appBridge).toBeLessThan(scripts);
    expect(root.slice(headStart, appBridge)).not.toContain("<script");
  });

  it("2.2.4 runtime app source has no Admin REST client usage", () => {
    const restIndicators = [
      /@shopify\/shopify-api\/rest/i,
      /\badmin\s*\.\s*rest\b/i,
      /\/admin\/api\/[^\s"'`]*\.json\b/i,
    ];

    for (const file of runtimeSources()) {
      for (const indicator of restIndicators) {
        expect(file.source, `Admin REST indicator in ${file.path}`).not.toMatch(
          indicator,
        );
      }
    }
  });

  it("1.2.1 runtime app source has no off-platform app-subscription billing", () => {
    const offPlatformBillingIndicators = [
      /from\s+["'](?:stripe|@stripe\/stripe-js)["']/i,
      /from\s+["'][^"']*(?:paypal|braintree)[^"']*["']/i,
      /\bnew\s+Stripe\s*\(/,
      /\bstripe\s*\.\s*(?:checkout|subscriptions|paymentLinks)\b/i,
      /https?:\/\/checkout\.stripe\.com/i,
      /\bstripe\b[\s\S]{0,120}\b(?:checkout|create[-_/]?subscription)\b/i,
      /\bcheckout\s*\.\s*sessions\s*\.\s*create\s*\(/i,
      /\bpaypal\b[\s\S]{0,120}\b(?:checkout|subscription|billing)\b/i,
      /\b(?:checkout|subscription|billing)\b[\s\S]{0,120}\bpaypal\b/i,
    ];

    for (const file of runtimeSources()) {
      for (const indicator of offPlatformBillingIndicators) {
        expect(
          file.source,
          `off-platform billing indicator in ${file.path}`,
        ).not.toMatch(indicator);
      }
    }
  });

  it("1.3.1 runtime app source has no review-for-reward incentive", () => {
    const reviewRequest = String.raw`(?:leave|write|post|give|submit)\s+(?:us\s+)?a\s+(?:positive\s+)?review`;
    const incentive = String.raw`(?:extra\s+days?|discount|unlock(?:ed|s|ing)?|free\s+(?:days?|months?))`;
    const incentivePatterns = [
      new RegExp(`${reviewRequest}[\\s\\S]{0,120}${incentive}`, "i"),
      new RegExp(`${incentive}[\\s\\S]{0,120}${reviewRequest}`, "i"),
      /\breview\b[\s\S]{0,80}\bin exchange for\b[\s\S]{0,80}\b(?:days?|discount|unlock|free)\b/i,
    ];

    for (const file of runtimeSources()) {
      for (const indicator of incentivePatterns) {
        expect(file.source, `review incentive in ${file.path}`).not.toMatch(
          indicator,
        );
      }
    }
  });

  it("2.1.1 billing upgrade exits the embed through the top frame", () => {
    const bounce = readRepo("app/app/lib/billing-exit.server.ts");
    const navigation = readRepo("app/app/lib/billing-navigate.ts");
    const button = readRepo("app/app/components/ProUpgradeButton.tsx");

    expect(bounce).toContain('open(url, "_top")');
    expect(bounce).toContain('target="_top"');
    expect(navigation).toContain('openFn(url, "_top")');
    expect(navigation).toContain('anchor.target = "_top"');
    expect(button).toMatch(
      /navigateToBillingConfirmation\((?:plansUrl|data\.confirmationUrl)\)/,
    );
    expect(button).toContain("/app/billing");
  });

  it("2.3.1 auth.login does not harvest a myshopify domain", () => {
    const login = readRepo("app/app/routes/auth.login/route.tsx");

    expect(login).not.toMatch(
      /name=["']shop["']|myshopify\.com[\s\S]{0,120}<input|Enter your shop/i,
    );
    expect(login).not.toMatch(/<input\b/i);
  });

  it("3.2.1 public configs stay at PCD Level 1 without read_all_orders", () => {
    for (const path of [
      "app/shopify.app.toml",
      "app/shopify.app.public.toml",
    ]) {
      const scopes = publicScopes(readRepo(path));
      expect(scopes, path).toEqual(["read_orders", "read_customers"]);
      expect(scopes, path).not.toContain("read_all_orders");
    }
  });

  it("5.x payment, theme, checkout, and sales-channel categories remain N/A", () => {
    const extensionConfigs = walkFiles(
      join(repoRoot, "app/extensions"),
      (_path, entry) =>
        entry.isFile() && entry.name === "shopify.extension.toml",
    );
    const configSurface = [
      readRepo("app/shopify.app.toml"),
      ...extensionConfigs.map(
        (path) => `${relative(repoRoot, path)}\n${readFileSync(path, "utf8")}`,
      ),
    ].join("\n");
    const sourceSurface = runtimeSources()
      .map((file) => file.source)
      .join("\n");

    expect(configSurface).not.toMatch(
      /\btype\s*=\s*["'](?:theme|payments?_extension|channel_config)["']/i,
    );
    expect(configSurface).not.toMatch(
      /\b(?:theme_app_extension|purchase\.checkout|checkout_ui|write_payment_(?:gateway|sessions?))\b/i,
    );
    expect(sourceSurface).not.toMatch(
      /\b(?:paymentSession|refundSession|captureSession|voidSession)(?:Resolve|Reject|Create)\b/,
    );
  });

  it("PCD GraphQL selects only opaque customer id and numberOfOrders", () => {
    const salesSource = readRepo("app/app/lib/shopify-sales.server.ts");
    const documents = graphqlDocuments(salesSource);
    const documentSurface = documents.join("\n");
    const customerBlocks = [
      ...documentSurface.matchAll(/\bcustomer\s*\{([^}]*)\}/g),
    ].map((match) => match[1] ?? "");

    expect(documents.length).toBeGreaterThan(0);
    expect(customerBlocks.length).toBeGreaterThan(0);
    expect(documentSurface).not.toMatch(
      /\b(?:email|phone|firstName|lastName|addresses?|defaultAddress|shippingAddress|billingAddress)\b/,
    );
    for (const block of customerBlocks) {
      expect(block).toMatch(/\bid\b/);
      expect(block).toMatch(/\bnumberOfOrders\b/);
    }
  });
});
