/**
 * Map a spend channel label to the desk fill token used by
 * `.mcfly-spend-dot--*` / `.mcfly-channel__fill--*` / `--mcfly-*`.
 */
export function channelFillKey(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("meta")) return "meta";
  if (n.includes("google")) return "google";
  if (n.includes("microsoft") || n.includes("bing")) return "microsoft";
  if (n.includes("tiktok")) return "tiktok";
  if (n.includes("pinterest")) return "pinterest";
  if (n.includes("snapchat") || n === "snap") return "snapchat";
  if (n.includes("reddit")) return "reddit";
  if (n === "x" || n.includes("twitter") || n.includes("x ads")) return "x";
  if (n.includes("linkedin")) return "linkedin";
  if (n.includes("amazon")) return "amazon";
  if (n.includes("apple search") || n.includes("apple_search")) return "apple_search";
  if (n.includes("affiliate")) return "affiliate";
  if (n.includes("email") || n.includes("klaviyo")) return "email";
  return "other";
}

/** CSS custom-property color for SVG pie slices. */
export function channelCssVar(fillKey: string): string {
  return `var(--mcfly-${fillKey}, var(--mcfly-other))`;
}

/** How many distinct fills a merchant's own named channels can take. */
export const NAMED_EXTRA_FILL_COUNT = 6;

/**
 * A named extra reaches the desk two ways: as a slug on the slice key
 * (`other:billboard`) and as the merchant's label ("Billboard"). Both must
 * pick the same colour, so normalize to letters and digits before hashing.
 */
function normalizeExtra(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * Stable fill for a merchant-named channel. Billboard is its own series on
 * every surface, never folded into the grey Other band.
 */
export function namedExtraFillKey(name: string): string {
  const norm = normalizeExtra(name);
  if (!norm) return "other";
  let hash = 0;
  for (let i = 0; i < norm.length; i += 1) {
    hash = (hash * 31 + norm.charCodeAt(i)) >>> 0;
  }
  return `extra-${(hash % NAMED_EXTRA_FILL_COUNT) + 1}`;
}

/**
 * Fill for a spend slice key: `meta`, unlabeled `other`, or a named extra
 * like `other:billboard`.
 */
export function sliceFillKey(sliceKey: string): string {
  const [base, slug] = sliceKey.split(":");
  if (base === "other" && slug) return namedExtraFillKey(slug);
  return base || "other";
}
