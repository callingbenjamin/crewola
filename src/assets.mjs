// Asset URLs for the templates. Files under public/ get a ?v=<content hash> suffix, so vercel.json can cache any
// versioned request for a year: a changed file gets a new URL, and the HTML (never cached) always points at it.
// Fonts are the exception: styles.css loads them by plain URL (a font file's name carries its version, and
// /fonts/ is cached for a year), so the preload must use that same plain URL or the font downloads twice.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { esc } from './layout.mjs';

const versions = new Map();

// "/styles.css" -> "/styles.css?v=1a2b3c4d5e". Stops the build if the file does not exist.
export function asset(path) {
  if (!versions.has(path)) {
    const file = `public${path}`;
    if (!existsSync(file)) throw new Error(`asset ${path}: no such file in public/`);
    versions.set(path, createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 10));
  }
  return `${path}?v=${versions.get(path)}`;
}

const WIDTHS = [480, 800, 1280, 1920];
const FORMATS = [['avif', 'image/avif'], ['webp', 'image/webp']];

// Pixel size of a JPEG, read from its SOF marker (no image library needed).
function jpegSize(file) {
  const b = readFileSync(file);
  for (let i = 2; i < b.length;) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error(`${file}: could not read the image size`);
}

// A <picture> for /media/<key>/poster.jpg: AVIF and WebP at every width that scripts/make-responsive.py made,
// with the JPEG as the fallback. `lazySrc` leaves the URLs in data- attributes so site.js can load them later.
// `attrs` is extra HTML for the <img> (class, loading, fetchpriority...). `maxWidth` leaves out larger files.
export function posterPicture(key, { sizes, attrs = '', lazySrc = false, maxWidth = Infinity }) {
  const base = `/media/${key}/poster`;
  const { width, height } = jpegSize(`public${base}.jpg`);
  const srcAttr = lazySrc ? 'data-srcset' : 'srcset';
  const sources = FORMATS.map(([ext, type]) => {
    const set = WIDTHS.filter(w => w <= maxWidth && existsSync(`public${base}-${w}.${ext}`)).map(w => `${asset(`${base}-${w}.${ext}`)} ${w}w`);
    return set.length ? `<source type="${type}" ${srcAttr}="${set.join(', ')}" sizes="${esc(sizes)}">` : '';
  }).join('');
  const src = `${lazySrc ? 'data-src' : 'src'}="${asset(`${base}.jpg`)}"`;
  return `<picture>${sources}<img ${src} width="${width}" height="${height}" alt=""${attrs ? ` ${attrs}` : ''}></picture>`;
}
