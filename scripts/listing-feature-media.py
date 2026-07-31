#!/usr/bin/env python3
"""
App Store Feature media 1600×900 — Custom Data Science vibe
(matches mcflyads.com/custom-analytics favicon + OG: dark navy + cyan M).
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs/listing-assets"
OUT_PNG = OUT_DIR / "feature-media-1600x900.png"
OUT_JPG = OUT_DIR / "feature-media-1600x900.jpg"
MARK = ROOT / "site/assets/brand/favicon-custom-analytics-512.png"

W, H = 1600, 900

NAVY_DEEP = (5, 10, 20)
NAVY = (10, 18, 34)
NAVY_MID = (16, 28, 48)
CYAN = (94, 231, 240)  # #5ee7f0 — favicon
CYAN_DIM = (94, 231, 240, 90)
WHITE = (255, 255, 255)
MUTE = (148, 168, 188)
PANEL = (12, 22, 40)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    paths = [
        (
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
            if bold
            else "/System/Library/Fonts/Supplemental/Arial.ttf"
        ),
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in paths:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def dark_atmosphere() -> Image.Image:
    img = Image.new("RGB", (W, H), NAVY_DEEP)
    px = img.load()
    for y in range(H):
        for x in range(W):
            # vertical depth
            t = y / H
            r = int(5 + t * 6)
            g = int(8 + t * 10)
            b = int(16 + t * 18)
            # cyan glow top-right
            gx = (x - 1280) / 520
            gy = (y - 80) / 420
            glow = max(0.0, 1.0 - math.sqrt(gx * gx + gy * gy))
            glow = glow**2
            r = min(255, int(r + glow * 18))
            g = min(255, int(g + glow * 55))
            b = min(255, int(b + glow * 70))
            # soft left vignette lift
            lx = 1.0 - min(1.0, x / 900)
            r = min(255, int(r + lx * 4))
            g = min(255, int(g + lx * 6))
            b = min(255, int(b + lx * 10))
            px[x, y] = (r, g, b)
    return img


def draw_perspective_grid(base: Image.Image) -> Image.Image:
    """Faint cyan floor grid — light, not heavy texture."""
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    horizon = 620
    # horizontal lines
    for i in range(1, 12):
        y = horizon + int(i * i * 2.4)
        if y >= H:
            break
        alpha = max(12, 55 - i * 4)
        d.line((0, y, W, y), fill=(*CYAN, alpha), width=1)
    # converging verticals
    vanish_x = W // 2 + 180
    for i in range(-10, 11):
        x0 = vanish_x + i * 70
        alpha = 28 if abs(i) < 6 else 16
        d.line((x0, horizon, vanish_x + i * 160, H), fill=(*CYAN, alpha), width=1)
    # soft blur so it stays atmosphere, not noise
    overlay = overlay.filter(ImageFilter.GaussianBlur(0.6))
    return Image.alpha_composite(base.convert("RGBA"), overlay).convert("RGB")


def rounded(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int, int, int],
    radius: int,
    fill,
    outline=None,
    width: int = 1,
) -> None:
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def sparkline(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int]) -> None:
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    # values rising toward Total ROAS story
    pts = [0.35, 0.42, 0.38, 0.55, 0.52, 0.68, 0.72, 0.88, 0.94]
    coords = []
    for i, v in enumerate(pts):
        x = x0 + int(i * (w / (len(pts) - 1)))
        y = y1 - int(v * h)
        coords.append((x, y))
    draw.line(coords, fill=CYAN, width=3, joint="curve")
    # end spark (matches favicon corner spark)
    ex, ey = coords[-1]
    draw.ellipse((ex - 5, ey - 5, ex + 5, ey + 5), fill=CYAN)
    draw.ellipse((ex - 2, ey - 2, ex + 2, ey + 2), fill=WHITE)


def main() -> None:
    img = draw_perspective_grid(dark_atmosphere())
    d = ImageDraw.Draw(img, "RGBA")

    f_kicker = font(15, bold=True)
    f_brand = font(64, bold=True)
    f_tag = font(26)
    f_refuse = font(16)
    f_panel_k = font(13, bold=True)
    f_hero = font(92, bold=True)
    f_sub = font(18)
    f_chip = font(16, bold=True)

    # —— Left brand stack ——
    left = 96
    y = 210
    d.text((left, y), "CUSTOM DATA SCIENCE", fill=CYAN, font=f_kicker)
    y += 42
    d.text((left, y), "Mcfly", fill=WHITE, font=f_brand)
    y += 72
    d.text((left, y), "Analytics", fill=CYAN, font=f_brand)
    y += 92
    d.text((left, y), "Total ROAS = Total Sales ÷ spend", fill=WHITE, font=f_tag)
    y += 44
    d.text((left, y), "Break-even · Goals · Allocation — no pixels.", fill=MUTE, font=f_refuse)

    # Favicon mark bottom-left
    if MARK.exists():
        mark = Image.open(MARK).convert("RGBA").resize((56, 56), Image.Resampling.LANCZOS)
        img.paste(mark, (96, H - 96), mark)
        d = ImageDraw.Draw(img, "RGBA")
        d.text((168, H - 78), "mcflyads.com", fill=MUTE, font=f_refuse)

    # —— Right impact panel (glass) ——
    px0, py0, px1, py1 = 860, 170, 1504, 700
    # glow behind panel
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle((px0 - 8, py0 - 8, px1 + 8, py1 + 8), 28, fill=(*CYAN, 28))
    glow = glow.filter(ImageFilter.GaussianBlur(18))
    img = Image.alpha_composite(img.convert("RGBA"), glow)
    d = ImageDraw.Draw(img, "RGBA")

    rounded(d, (px0, py0, px1, py1), 24, (*PANEL, 230), (*CYAN, 70), 2)

    # Panel header
    d.text((px0 + 48, py0 + 40), "TOTAL ROAS", fill=CYAN, font=f_panel_k)
    d.text((px0 + 48, py0 + 72), "4.42×", fill=CYAN, font=f_hero)
    d.text(
        (px0 + 48, py0 + 186),
        "Shopify Total Sales ÷ ad spend",
        fill=MUTE,
        font=f_sub,
    )

    # Divider
    d.line((px0 + 48, py0 + 236, px1 - 48, py0 + 236), fill=(*CYAN, 40), width=1)

    # Sparkline
    sparkline(d, (px0 + 48, py0 + 270, px1 - 48, py0 + 400))

    # Break-even chip
    chip = "Above break-even  2.86×"
    cw = d.textlength(chip, font=f_chip)
    cx0 = px0 + 48
    cy0 = py0 + 440
    rounded(
        d,
        (cx0, cy0, int(cx0 + cw + 36), cy0 + 44),
        22,
        (8, 28, 36, 220),
        (*CYAN, 90),
        1,
    )
    d.ellipse((cx0 + 14, cy0 + 16, cx0 + 26, cy0 + 28), fill=CYAN)
    d.text((cx0 + 34, cy0 + 11), chip, fill=WHITE, font=f_chip)

    # Tiny rising spark (favicon echo) top-right of panel
    d.ellipse((px1 - 62, py0 + 36, px1 - 50, py0 + 48), fill=CYAN)
    d.line(
        (px1 - 92, py0 + 68, px1 - 72, py0 + 48, px1 - 64, py0 + 56, px1 - 48, py0 + 36),
        fill=CYAN,
        width=2,
        joint="curve",
    )

    rgb = img.convert("RGB")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    rgb.save(OUT_PNG, "PNG", optimize=True)
    rgb.save(OUT_JPG, "JPEG", quality=93, optimize=True)
    print(f"wrote {OUT_PNG}")
    print(f"wrote {OUT_JPG} ({rgb.size[0]}×{rgb.size[1]})")


if __name__ == "__main__":
    main()
