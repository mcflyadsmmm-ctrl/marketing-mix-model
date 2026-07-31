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
