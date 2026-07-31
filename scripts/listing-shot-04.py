#!/usr/bin/env python3
"""Generate App Store shot 04 — Free vs Pro pricing panel at $39 (Polaris-faithful mock)."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/listing-assets/shots/04-free-pro-pricing.png"
RAW = ROOT / "docs/listing-assets/shots/raw/04-free-pro-pricing-raw.png"
W, H = 1600, 900

BG = (246, 246, 247)
CARD = (255, 255, 255)
INK = (32, 34, 35)
MUTED = (109, 113, 117)
BORDER = (225, 227, 229)
GREEN = (0, 128, 96)
ACCENT = (0, 91, 211)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def rounded(draw: ImageDraw.ImageDraw, xy, radius: int, fill, outline=None) -> None:
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=1)


def main() -> None:
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f_title = font(28, bold=True)
    f_body = font(18)
    f_small = font(15)
    f_k = font(14, bold=True)
    f_cta = font(17, bold=True)

    # Outer app chrome card
    rounded(d, (48, 40, 1552, 860), 16, CARD, BORDER)

    # Heading
    d.text((88, 72), "Free · Meta + Google", fill=INK, font=f_title)
    detail = (
        "Free desk: Meta + Google spend, Total ROAS, break-even. "
        "Pro ($39/store/mo flat at launch) adds Customer LTV, all channels, "
        "and advanced Goals / Monday Close. Listing stays Free — no charges until Billing is announced."
    )
    # wrap detail
    x, y = 88, 118
    line = ""
    for word in detail.split():
        trial = f"{line} {word}".strip()
        if d.textlength(trial, font=f_body) > 1380:
            d.text((x, y), line, fill=MUTED, font=f_body)
            y += 26
            line = word
        else:
            line = trial
    if line:
        d.text((x, y), line, fill=MUTED, font=f_body)

    # Two columns
    left = (88, 220, 760, 620)
    right = (840, 220, 1512, 620)
    rounded(d, left, 12, CARD, BORDER)
    rounded(d, right, 12, (245, 248, 255), ACCENT)

    d.text((112, 248), "FREE", fill=MUTED, font=f_k)
    free_bullets = [
        "Total ROAS = Shopify sales after returns ÷ spend",
        "Break-even from your profit margin",
        "Meta + Google spend (CSV / Connections)",
        "Basic allocation for Meta + Google",
        "Full SAMPLE preview of Pro features",
    ]
    by = 290
    for b in free_bullets:
        d.text((112, by), f"•  {b}", fill=INK, font=f_small)
        by += 36

    d.text((864, 248), "MCFLY ANALYTICS PRO · $39 / USD", fill=ACCENT, font=f_k)
    pro_bullets = [
        "Everything in Free",
        "All spend channels (TikTok, Amazon, Other…)",
        "Customer LTV from Shopify order cohorts (no email CRM)",
        "Full-year sales plan + YoY goals",
        "Lock any period + export finance CSV",
        "Deeper spend history as it ships",
    ]
    by = 290
    for b in pro_bullets:
        d.text((864, by), f"•  {b}", fill=INK, font=f_small)
        by += 36

    # CTA
    cta = (88, 660, 420, 720)
    rounded(d, cta, 10, GREEN)
    d.text((118, 676), "Upgrade to Pro — $39/mo", fill=CARD, font=f_cta)

    foot = (
        "Flat desk fee — never a GMV tax. App Store listing stays Free until "
        "Pro Billing is announced. Design partners: MCFLY_PRO_SHOPS."
    )
    d.text((88, 760), foot, fill=MUTED, font=f_small)

    RAW.parent.mkdir(parents=True, exist_ok=True)
    img.save(RAW, "PNG")
    img.save(OUT, "PNG")
    print(f"Wrote {OUT} and {RAW} ({W}x{H})")


if __name__ == "__main__":
    main()
