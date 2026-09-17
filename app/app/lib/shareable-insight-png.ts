/**
 * Canvas PNG for a shareable insight card. Draws from already-sealed
 * numbers — never invents a blank poster. Browser-only; unit tests stay on the lib.
 */

import {
  shareableInsightPngName,
  type ShareableInsightCard,
} from "./shareable-insights";

export type ShareableInsightPngMeta = {
  shopBrand: string;
  sample: boolean;
  periodLabel: string;
};

const W = 1080;
const H = 1080;

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function paintShareableInsightPng(
  ctx: CanvasRenderingContext2D,
  card: ShareableInsightCard,
  meta: ShareableInsightPngMeta,
): void {
  ctx.fillStyle = "#f4f7fa";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 56, 56, W - 112, H - 112, 36);
  ctx.fill();

  ctx.fillStyle = "#0369a1";
  ctx.font = "700 28px 'Source Sans 3', 'Segoe UI', sans-serif";
  ctx.fillText("Mcfly Analytics", 108, 150);

  ctx.fillStyle = "#5a6f85";
  ctx.font = "600 24px 'Source Sans 3', 'Segoe UI', sans-serif";
  const kicker = meta.sample
    ? `${meta.shopBrand} · SAMPLE · ${meta.periodLabel}`
    : `${meta.shopBrand} · ${meta.periodLabel}`;
  ctx.fillText(kicker, 108, 196);

  ctx.fillStyle = "#5a6f85";
  ctx.font = "750 22px 'Source Sans 3', 'Segoe UI', sans-serif";
  ctx.fillText(card.label.toUpperCase(), 108, 320);

  ctx.fillStyle = "#152536";
  ctx.font = "700 96px Fraunces, Georgia, serif";
  ctx.fillText(card.value, 108, 430);

  ctx.fillStyle = "#202223";
  ctx.font = "500 34px 'Source Sans 3', 'Segoe UI', sans-serif";
  let y = 520;
  for (const line of wrapLines(ctx, card.line, W - 220)) {
    ctx.fillText(line, 108, y);
    y += 48;
  }

  ctx.fillStyle = "#0369a1";
  ctx.font = "600 26px 'Source Sans 3', 'Segoe UI', sans-serif";
  y += 24;
  for (const line of wrapLines(ctx, card.formula, W - 220)) {
    ctx.fillText(line, 108, y);
    y += 40;
  }

  ctx.fillStyle = "#5a6f85";
  ctx.font = "500 24px 'Source Sans 3', 'Segoe UI', sans-serif";
  y += 12;
  for (const line of wrapLines(ctx, card.trust, W - 220)) {
    ctx.fillText(line, 108, y);
    y += 36;
  }

  ctx.fillStyle = "#7a8b9c";
  ctx.font = "600 20px 'Source Sans 3', 'Segoe UI', sans-serif";
  ctx.fillText("Order history · not a guess", 108, H - 110);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function downloadShareableInsightPng(
  card: ShareableInsightCard,
  meta: ShareableInsightPngMeta,
): boolean {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  paintShareableInsightPng(ctx, card, meta);
  const href = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = href;
  a.download = shareableInsightPngName(card.kind, meta.shopBrand);
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  return true;
}
