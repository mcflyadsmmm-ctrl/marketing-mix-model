#!/usr/bin/env python3
"""v12 — one public brand on mcflyads.com heads (favicon, titles, OG, canonical)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"

ICON_BLOCK = """  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
  <link rel="icon" href="/favicon-192.png" type="image/png" sizes="192x192" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
  <link rel="manifest" href="/manifest.webmanifest" />
  <meta name="theme-color" content="#05070b" />
"""

ICON_LINE = re.compile(
    r"^[ \t]*<(?:link rel=\"(?:icon|shortcut icon|apple-touch-icon|manifest)\"[^>]*>|meta name=\"theme-color\"[^>]*>)\s*$",
    re.I,
)

TITLES = {
    "index.html": "Deeper Shopify numbers Analytics does not show. | Mcfly Analytics",
    "about.html": "About | Mcfly Analytics",
    "demo.html": "Demo — Total ROAS | Mcfly Analytics",
    "pricing.html": "Pricing — 7-day then $39 | Mcfly Analytics",
    "product.html": "Total ROAS desk | Mcfly Analytics",
    "privacy.html": "Privacy | Mcfly Analytics",
    "terms.html": "Terms | Mcfly Analytics",
    "support.html": "Support | Mcfly Analytics",
    "cookies.html": "Cookies | Mcfly Analytics",
    "security.html": "Security | Mcfly Analytics",
    "dpa.html": "DPA | Mcfly Analytics",
    "faq.html": "FAQ | Mcfly Analytics",
    "mer-calculator.html": "MER calculator | Mcfly Analytics",
    "break-even-roas-calculator.html": "Break-even ROAS calculator | Mcfly Analytics",
    "404.html": "Not found | Mcfly Analytics",
    "app.html": "The Shopify desk | Mcfly Analytics",
}


def suffix_title(text: str) -> str:
    text = re.sub(r"\s*\|\s*Mcfly Ads\s*$", " | Mcfly Analytics", text)
    text = re.sub(r"\s*\|\s*Mcfly\s*$", " | Mcfly Analytics", text)
    text = re.sub(r"\s*—\s*Mcfly Ads\s*$", " | Mcfly Analytics", text)
    text = re.sub(r"\s*—\s*Mcfly\s*$", " | Mcfly Analytics", text)
    if "Mcfly Analytics" not in text and text.strip():
        text = re.sub(r"\s*$", " | Mcfly Analytics", text)
        text = re.sub(r"(?: \| Mcfly Analytics)+$", " | Mcfly Analytics", text)
    return text


def unify_file(path: Path) -> None:
    raw = path.read_text(encoding="utf-8")
    html = raw.replace("https://mcfly-analytics.fly.dev", "https://mcflyads.com")
    html = html.replace('content="Mcfly Ads"', 'content="Mcfly Analytics"')
    html = html.replace(
        'Mcfly <span class="ads">Ads</span>',
        'Mcfly <span class="ads">Analytics</span>',
    )
    html = re.sub(
        r'<script src="/assets/chrome\.js\?v=[^"]+"',
        '<script src="/assets/chrome.js?v=20260828v12"',
        html,
    )
    html = re.sub(
        r'<script src="/assets/mcfly/chrome\.js\?v=[^"]+"',
        '<script src="/assets/mcfly/chrome.js?v=20260828v12"',
        html,
    )
    html = re.sub(
        r'href="/assets/mcfly/mcfly\.css\?v=[^"]+"',
        'href="/assets/mcfly/mcfly.css?v=20260828v12"',
        html,
    )
    html = html.replace('content="v11"', 'content="v12"')

    lines = html.splitlines(keepends=True)
    out = []
    inserted = False
    for line in lines:
        if ICON_LINE.match(line.rstrip("\n")):
            if not inserted:
                # Keep indent of first dropped line roughly
                out.append(ICON_BLOCK if ICON_BLOCK.endswith("\n") else ICON_BLOCK + "\n")
                inserted = True
            continue
        out.append(line)
        if (not inserted) and re.search(r'<meta name="viewport"', line, re.I):
            out.append(ICON_BLOCK if ICON_BLOCK.endswith("\n") else ICON_BLOCK + "\n")
            inserted = True
    html = "".join(out)
    if not inserted:
        html = html.replace("<head>", "<head>\n" + ICON_BLOCK, 1)

    name = path.name
    title = TITLES.get(name)
    if title is None:
        m = re.search(r"<title>(.*?)</title>", html, re.S)
        if m:
            title = suffix_title(re.sub(r"\s+", " ", m.group(1)).strip())
            title = title.replace("&amp;", "&")
    if title:
        html = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", html, count=1, flags=re.S)
        html = re.sub(
            r'(<meta property="og:title" content=")[^"]*(")',
            rf"\1{title}\2",
            html,
            count=1,
        )
        html = re.sub(
            r'(<meta name="twitter:title" content=")[^"]*(")',
            rf"\1{title}\2",
            html,
            count=1,
        )

    html = re.sub(
        r'(<meta property="og:image" content=")https://mcflyads\.com/assets/brand/og-custom-analytics\.jpg(")',
        r"\1https://mcflyads.com/assets/brand/og-cash-mer.jpg\2",
        html,
    )
    html = re.sub(
        r'(<meta name="twitter:image" content=")https://mcflyads\.com/assets/brand/og-custom-analytics\.jpg(")',
        r"\1https://mcflyads.com/assets/brand/og-cash-mer.jpg\2",
        html,
    )

    if html != raw:
        path.write_text(html, encoding="utf-8")
        print("updated", path.relative_to(ROOT))
    else:
        print("unchanged", path.relative_to(ROOT))


def main() -> None:
    files = sorted(SITE.rglob("*.html"))
    for path in files:
        if "node_modules" in path.parts:
            continue
        unify_file(path)


if __name__ == "__main__":
    main()
