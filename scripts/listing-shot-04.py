#!/usr/bin/env python3
"""App Store 4.2.2 — do not generate listing images that contain plan prices.

Historical output: docs/listing-assets/shots/04-free-pro-pricing.png
That PNG must never be uploaded to Partner (prices belong in Pricing details only).
Capture a product UI shot instead: /app/allocation?period=y3&shot=1
"""

from __future__ import annotations

import sys


def main() -> None:
    sys.exit(
        "Refusing to generate a pricing screenshot (App Store 4.2.2). "
        "Do not upload 04-free-pro-pricing.png. Recapture Allocation or Spend UI."
    )


if __name__ == "__main__":
    main()
