#!/usr/bin/env bash
# Letterbox a Spend Admin crop into listing shot 05 (1600×900).
# Usage: bash scripts/listing-shot-05.sh /path/to/spend-crop.png
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IN="${1:?Usage: $0 /path/to/spend-crop.png}"
OUT="$ROOT/docs/listing-assets/shots/05-spend-csv.png"
python3 - "$IN" "$OUT" <<'PY'
import sys
from pathlib import Path
from PIL import Image

src, dest = Path(sys.argv[1]), Path(sys.argv[2])
im = Image.open(src).convert("RGB")
tw, th = 1600, 900
scale = min(tw / im.width, th / im.height)
nw, nh = max(1, int(im.width * scale)), max(1, int(im.height * scale))
resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
canvas = Image.new("RGB", (tw, th), (248, 250, 252))
canvas.paste(resized, ((tw - nw) // 2, (th - nh) // 2))
dest.parent.mkdir(parents=True, exist_ok=True)
canvas.save(dest, "PNG", optimize=True)
print(f"Wrote {dest} ({im.size[0]}×{im.size[1]} → 1600×900)")
PY
