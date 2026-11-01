"""Regenerates the share images (public/og/*.png), the touch and app icons and public/favicon.ico.

Run after changing a headline or a hero photo:
    npm run build && python3 scripts/make-images.py
Needs Google Chrome on the PATH as google-chrome (headless screenshots, no other dependencies).
The mark is a fan in a chat bubble: public/brand/crewola-mark.svg (detailed, three blades) and
public/favicon.svg (the same shape drawn on a 16 px grid, so it stays legible in a tab).
"""
import json, pathlib, html, tempfile, subprocess, struct

ROOT = pathlib.Path(__file__).resolve().parent.parent
# The logo files are the source of truth: the ivory version sits on the graphite cards, the mark alone on the icon.
LOGO = (ROOT / 'public/brand/crewola-logo-ivory.svg').read_text()
MARK = (ROOT / 'public/brand/crewola-mark.svg').read_text()
FAVICON = (ROOT / 'public/favicon.svg').read_text()
FONT = (ROOT / 'public/fonts/geist-latin-v5.woff2').as_uri()

def card(eyebrow, lines, photo=None):
    bg = f'url({photo.as_uri()}) center/cover' if photo else '#20292C'
    return f'''<!doctype html><html><head><style>
@font-face{{font-family:Geist;src:url({FONT}) format('woff2');font-weight:400 700}}
body{{margin:0;width:1200px;height:630px;font-family:Geist;color:#F5F2EB;background:{bg};position:relative;overflow:hidden}}
.wash{{position:absolute;inset:0;background:linear-gradient(90deg,#20292Cf2 0%,#20292Ccc 48%,#20292C55 100%)}}
.in{{position:absolute;inset:0;padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between}}
.brand svg{{display:block;height:46px;width:300px}}
.eyebrow{{font-size:16px;letter-spacing:3px;text-transform:uppercase;color:#aaa8a3;margin-bottom:22px}}
h1{{font-weight:500;font-size:74px;line-height:1.08;letter-spacing:-2.8px;margin:0;max-width:820px}}
.bar{{width:120px;height:4px;background:#F2B544}}
</style></head><body><div class="wash"></div><div class="in">
<div class="brand">{LOGO}</div>
<div><div class="eyebrow">{html.escape(eyebrow)}</div><h1>{'<br>'.join(html.escape(l) for l in lines)}</h1></div>
<div class="bar"></div></div></body></html>'''

def icon(size):
    # The mark on the graphite tile, 71% of the width (the 180 px touch icon has always used 128 px).
    m = round(size * 128 / 180)
    return f'''<!doctype html><html><body style="margin:0;width:{size}px;height:{size}px;background:#20292C;display:grid;place-items:center">
<div style="width:{m}px;height:{m}px">{MARK.replace('<svg ', f'<svg width="{m}" height="{m}" style="display:block" ')}</div></body></html>'''

def tab_icon(size):
    return f'''<!doctype html><html><body style="margin:0;width:{size}px;height:{size}px;background:transparent">
{FAVICON.replace('<svg ', f'<svg width="{size}" height="{size}" style="display:block" ')}</body></html>'''

def shot(doc, out, w, h, transparent=False):
    tmp = pathlib.Path(tempfile.mkdtemp()) / 'page.html'
    tmp.write_text(doc)
    # Load from a file:// page so the local font and photo are allowed to load.
    subprocess.run(['google-chrome', '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
                    '--allow-file-access-from-files', '--virtual-time-budget=3000', f'--window-size={w},{h}',
                    *(['--default-background-color=00000000'] if transparent else []),
                    f'--screenshot={out}', tmp.as_uri()], check=True, capture_output=True)

def write_ico(pngs, out):
    # An .ico that holds PNG images (supported by every current browser), one entry per size.
    data = [p.read_bytes() for _, p in pngs]
    head = struct.pack('<HHH', 0, 1, len(pngs))
    offset = 6 + 16 * len(pngs)
    for (size, _), d in zip(pngs, data):
        head += struct.pack('<BBBBHHII', size % 256, size % 256, 0, 0, 1, 32, len(d), offset)
        offset += len(d)
    out.write_bytes(head + b''.join(data))

d = json.loads((ROOT / 'src/content/sectors/home-services.json').read_text())
shot(card('HVAC enquiry handling for home-service companies', d['hero']['headline'], ROOT / 'public/media/home-services/poster.jpg'),
     ROOT / 'public/og/home.png', 1200, 630)
shot(icon(180), ROOT / 'public/apple-touch-icon.png', 180, 180)
for size in (192, 512):
    shot(icon(size), ROOT / f'public/icon-{size}.png', size, size)
tmp = pathlib.Path(tempfile.mkdtemp())
pngs = []
for size in (16, 32, 48):
    shot(tab_icon(size), tmp / f'{size}.png', size, size, transparent=True)
    pngs.append((size, tmp / f'{size}.png'))
write_ico(pngs, ROOT / 'public/favicon.ico')
print('wrote public/og/home.png, public/apple-touch-icon.png, public/icon-192.png, public/icon-512.png and public/favicon.ico')
