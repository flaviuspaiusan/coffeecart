// Generează o singură dată (și la nevoie) imaginile optimizate și iconițele site-ului.
// Rulare: `npm run assets`  (nu face parte din `npm run build`; rezultatele sunt comise în repo).
//
// Atenție: fișierele ORIGINALE din public/assets NU se șterg și nu se redenumesc —
// meniul din Supabase le referă prin cale (ex. /assets/espresso_image_....png).
// Se creează doar variante .webp lângă ele, plus fișiere noi cu nume descriptive.

import sharp from 'sharp'
import { mkdir, writeFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const ASSETS = 'public/assets'
const IMG = 'public/assets/img'
const OG = 'public/og'
const BRAND_BROWN = '#9a6a4a'
const CREAM = '#f7f4ec'

await mkdir(IMG, { recursive: true })
await mkdir(OG, { recursive: true })

// ── 1. Fotografii de pe site → WebP responsive, cu nume descriptive ──────────────────────────
const PHOTOS = {
    'presso-nunta.jpg': 'presso-coffee-cart-nunta-miri',
    'presso-piscina.jpg': 'presso-coffee-cart-piscina',
    'presso-salon.jpg': 'presso-coffee-cart-salon-evenimente',
    'presso-terasa.jpg': 'presso-coffee-cart-terasa',
    '4.jpeg': 'presso-coffee-cart-bar-flori-eveniment',
    '5.jpeg': 'presso-coffee-cart-cuplu-pahare-cafea',
    '6.jpeg': 'presso-coffee-cart-barista-prepara-cafea',
}
const WIDTHS = [480, 800, 1200]

for (const [src, name] of Object.entries(PHOTOS)) {
    const meta = await sharp(path.join(ASSETS, src)).metadata()
    const widths = [...new Set(WIDTHS.map((w) => Math.min(w, meta.width)))]
    for (const w of widths) {
        const out = path.join(IMG, `${name}-${w}.webp`)
        const info = await sharp(path.join(ASSETS, src))
            .rotate()
            .resize({ width: w, withoutEnlargement: true })
            .webp({ quality: 78, effort: 5 })
            .toFile(out)
        console.log(`${out}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`)
    }
}

// ── 2. Logo → WebP 1x / 2x pentru header (înălțime afișată 55px) ────────────────────────────
for (const w of [110, 220]) {
    const out = path.join(IMG, `presso-coffee-cart-logo-${w}.webp`)
    const info = await sharp(path.join(ASSETS, 'logo.jpeg')).resize({ width: w }).webp({ quality: 92 }).toFile(out)
    console.log(`${out}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`)
}

// ── 3. Imagini meniu PNG → WebP 640px (același nume de bază, lângă original) ────────────────
for (const file of await readdir(ASSETS)) {
    if (!file.endsWith('.png')) continue
    const out = path.join(ASSETS, file.replace(/\.png$/, '.webp'))
    const info = await sharp(path.join(ASSETS, file)).resize({ width: 640 }).webp({ quality: 80, effort: 5 }).toFile(out)
    console.log(`${out}  ${(info.size / 1024).toFixed(0)} KB`)
}

// ── 4. Favicon / iconițe (monogramă „P" în arcada logo-ului, desenată vectorial) ──────────
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M11 57V30a21 21 0 0 1 42 0v27z" fill="none" stroke="${BRAND_BROWN}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M27 47V22h7.5a6.8 6.8 0 0 1 0 13.6H27" fill="none" stroke="${BRAND_BROWN}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
await writeFile('public/favicon.svg', FAVICON_SVG)

const rasterIcon = (size, { background } = {}) => {
    let img = sharp(Buffer.from(FAVICON_SVG), { density: Math.max(72, (size / 64) * 72 * 4) }).resize(size, size)
    if (background) img = img.flatten({ background })
    return img.png()
}

// ICO cu 3 imagini PNG (16/32/48), format valid și suportat de toate browserele moderne
const icoSizes = [16, 32, 48]
const icoPngs = await Promise.all(icoSizes.map((s) => rasterIcon(s).toBuffer()))
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(icoSizes.length, 4)
let offset = 6 + 16 * icoSizes.length
const entries = icoSizes.map((s, i) => {
    const e = Buffer.alloc(16)
    e.writeUInt8(s, 0)
    e.writeUInt8(s, 1)
    e.writeUInt8(0, 2)
    e.writeUInt8(0, 3)
    e.writeUInt16LE(1, 4)
    e.writeUInt16LE(32, 6)
    e.writeUInt32LE(icoPngs[i].length, 8)
    e.writeUInt32LE(offset, 12)
    offset += icoPngs[i].length
    return e
})
await writeFile('public/favicon.ico', Buffer.concat([header, ...entries, ...icoPngs]))

// apple-touch-icon: fără transparență, cu fundal crem și puțin padding
await sharp({ create: { width: 180, height: 180, channels: 3, background: CREAM } })
    .composite([{ input: await rasterIcon(136).toBuffer(), gravity: 'center' }])
    .png()
    .toFile('public/apple-touch-icon.png')
await rasterIcon(192, { background: CREAM }).toFile('public/icon-192.png')
await rasterIcon(512, { background: CREAM }).toFile('public/icon-512.png')
console.log('favicon.svg, favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png')

// ── 5. Imagini Open Graph 1200×630 (JPEG): logo + fotografii reale ────────────────────────
const W = 1200
const H = 630
const PANEL = 420

const cover = (file, w, h, position = 'centre') =>
    sharp(file).resize({ width: w, height: h, fit: 'cover', position }).toBuffer()

async function ogImage(outName, tiles) {
    const logo = await sharp(path.join(ASSETS, 'logo.jpeg')).resize({ width: 340 }).toBuffer()
    const logoMeta = await sharp(logo).metadata()
    const layers = [
        {
            input: logo,
            left: Math.round((PANEL - logoMeta.width) / 2),
            top: Math.round((H - logoMeta.height) / 2),
            blend: 'multiply',
        },
    ]
    for (const t of tiles) {
        layers.push({ input: await cover(t.file, t.w, t.h, t.position), left: t.x, top: t.y })
    }
    const out = path.join(OG, outName)
    const info = await sharp({ create: { width: W, height: H, channels: 3, background: CREAM } })
        .composite(layers)
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(out)
    console.log(`${out}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`)
}

const a = (f) => path.join(ASSETS, f)
const half = (W - PANEL) / 2 // 390

await ogImage('og-home.jpg', [
    { file: a('presso-terasa.jpg'), x: PANEL, y: 0, w: half, h: H },
    { file: a('presso-nunta.jpg'), x: PANEL + half, y: 0, w: half, h: H },
])
await ogImage('og-oferta.jpg', [
    { file: a('presso-nunta.jpg'), x: PANEL, y: 0, w: half, h: H },
    { file: a('presso-salon.jpg'), x: PANEL + half, y: 0, w: half, h: H },
])
await ogImage('og-meniu.jpg', [
    { file: a('espresso_image_1778599544907.png'), x: PANEL, y: 0, w: half, h: H / 2 },
    { file: a('cappuccino_image_1778599606617.png'), x: PANEL + half, y: 0, w: half, h: H / 2 },
    { file: a('iced_coffee_image_1778599653110.png'), x: PANEL, y: H / 2, w: half, h: H / 2 },
    { file: a('latte_macchiato_image_1778599636109.png'), x: PANEL + half, y: H / 2, w: half, h: H / 2 },
])

if (!existsSync('public/og/og-home.jpg')) throw new Error('OG image generation failed')
console.log('Gata.')
