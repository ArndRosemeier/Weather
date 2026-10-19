#!/usr/bin/env node
/**
 * Generates the hero image set with the host's OpenRouter creative key, then
 * derives the responsive WebP sizes the app actually ships.
 *
 * Run: node scripts/generate-heroes.mjs
 * Output: public/heroes/<key>-320.webp|-800.webp|-1600.webp and public/icon-192.png|icon-512.png
 *
 * The printed CLI path is authoritative (the provider may return JPEG for a PNG
 * request); sharp re-encodes from whatever bytes arrive.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = process.cwd()
const RAW_DIR = path.join(ROOT, 'assets', 'raw-heroes')
const OUT_DIR = path.join(ROOT, 'public', 'heroes')
const MODEL = process.env.HERO_MODEL ?? 'meta/muse-image'
const RESOLUTION = process.env.HERO_RESOLUTION ?? '2K'

const STYLE = '— cinematic landscape photograph, ultra realistic, rich colour grading, high dynamic range, dramatic natural light, no people, no text, no watermark, no logos, subject centred, with the lower third of the frame calm and uncluttered for a text overlay, 3:2 aspect ratio'

const PROMPTS = {
  'clear-day': 'a vast deep-blue summer sky with the sun high and a few wispy cirrus clouds, brilliant sunlight and a subtle lens flare above a soft distant horizon',
  'clear-night': 'a star-filled night sky with the Milky Way arching over a dark distant horizon, deep indigo and faint warm airglow, long-exposure clarity',
  'partly-cloudy-day': 'towering white cumulus clouds against a vivid blue sky, sunbeams breaking through the cloud edges, dramatic sense of scale',
  'partly-cloudy-night': 'moonlit silver clouds drifting across a deep indigo night sky, soft rim light on the cloud tops, tranquil',
  overcast: 'a layered grey stratocumulus cloud deck filling the entire sky, soft diffuse light, quiet and minimal',
  fog: 'dense morning fog rolling over a forested valley at dawn, pale gold light, layered depth',
  drizzle: 'fine drizzle over a wet city street at dusk, glistening pavement and soft bokeh reflections',
  rain: 'steady rain over rooftops and a distant city skyline, visible rain streaks, moody blue-grey light',
  'heavy-rain': 'a torrential downpour beneath a dark towering storm cloud, sheets of rain and dramatic contrast',
  thunderstorm: 'a lightning bolt splitting a purple-black storm sky over open plains, illuminated cloud towers',
  snow: 'heavy snowfall over a pine forest and a small alpine village, soft white light, calm',
  wind: 'wind sweeping long grass across coastal dunes beneath fast streaking clouds, low golden sun',
  heat: 'shimmering heat haze over a sunbaked desert, pale bleached sky and an intense white sun',
  frost: 'hoarfrost crystals on branches in a cold blue dawn, pale pink light, crisp air',
}

mkdirSync(RAW_DIR, { recursive: true })
mkdirSync(OUT_DIR, { recursive: true })

function generate(key, prompt) {
  const out = path.join(RAW_DIR, `${key}.png`)
  if (existsSync(out)) {
    console.log(`skip ${key}: raw already present`)
    return out
  }
  console.log(`generating ${key}…`)
  execFileSync('or', [
    'image', `${prompt} ${STYLE}`,
    '--model', MODEL,
    '--aspect', '3:2',
    '--resolution', RESOLUTION,
    '--out', out,
  ], { stdio: 'inherit', timeout: 300_000 })
  if (!existsSync(out)) {
    // The CLI derives the extension from the returned bytes.
    const match = readdirSync(RAW_DIR).find((name) => name.startsWith(`${key}.`))
    if (!match) throw new Error(`generation produced no file for ${key}`)
    return path.join(RAW_DIR, match)
  }
  return out
}

const failures = []
for (const [key, prompt] of Object.entries(PROMPTS)) {
  try {
    const raw = generate(key, prompt)
    for (const width of [1600, 800, 320]) {
      const height = Math.round((width * 2) / 3)
      await sharp(raw)
        .resize({ width, height, fit: 'cover', position: 'centre' })
        .webp({ quality: width === 1600 ? 80 : 76 })
        .toFile(path.join(OUT_DIR, `${key}-${width}.webp`))
    }
    const bytes = 1600
    console.log(`ok ${key}`)
  } catch (error) {
    failures.push(`${key}: ${error.message}`)
    console.error(`FAILED ${key}: ${error.message}`)
  }
}

// App icons rendered from the hand-authored SVG mark.
const iconSvg = path.join(ROOT, 'public', 'icon.svg')
if (existsSync(iconSvg)) {
  for (const size of [192, 512]) {
    await sharp(iconSvg).resize(size, size).png().toFile(path.join(ROOT, 'public', `icon-${size}.png`))
  }
  await sharp(iconSvg).resize(180, 180).png().toFile(path.join(ROOT, 'public', 'apple-touch-icon.png'))
  console.log('ok icons')
}

if (failures.length > 0) {
  console.error(`\n${failures.length} hero image(s) failed:\n${failures.join('\n')}`)
  process.exit(1)
}
console.log('\nall heroes generated and optimised')
