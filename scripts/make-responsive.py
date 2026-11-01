#!/usr/bin/env python3
"""Makes the responsive photo variants served by the site from each public/media/<key>/poster.jpg.

Writes poster-<width>.avif and poster-<width>.webp next to the source, for every width in WIDTHS
that is no larger than the source. Re-run after replacing a poster.jpg, then commit the results.
The build reads the files that exist, so a missing size is simply left out of srcset.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
WIDTHS = [480, 800, 1280, 1920]
WEBP_QUALITY = 72
AVIF_QUALITY = 55

for src in sorted(ROOT.glob('public/media/*/poster.jpg')):
    image = Image.open(src).convert('RGB')
    for old in src.parent.glob('poster-*.*'):
        old.unlink()
    for width in WIDTHS:
        if width > image.width:
            continue
        height = round(image.height * width / image.width)
        resized = image if width == image.width else image.resize((width, height), Image.LANCZOS)
        resized.save(src.parent / f'poster-{width}.webp', 'WEBP', quality=WEBP_QUALITY, method=6)
        resized.save(src.parent / f'poster-{width}.avif', 'AVIF', quality=AVIF_QUALITY, speed=4)
    print(src.relative_to(ROOT))
