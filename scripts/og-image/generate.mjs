// scripts/og-image/generate.mjs
//
// Rasterizes a static 1200x630 OG/Twitter-card SVG to public/og-image.png,
// plus the favicon-32.png / favicon-180.png raster set from the ember-tab
// mark (public/favicon.svg). Run once locally and commit the outputs — this
// is static content, not derived from data/stats.json, so it is *not* wired
// into the build pipeline.
//
//   node scripts/og-image/generate.mjs
//
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, '../../public/og-image.png');
const publicDir = resolve(__dirname, '../../public');

const WIDTH = 1200;
const HEIGHT = 630;
const BG = '#1B1814';
const CORE_EMISSIVE = '#ff4a1c';
const CORE_BASE = '#1a1108';
const TEXT_PRIMARY = '#F0EAD6';
const TEXT_SECONDARY = '#C5BBA1';
const ACCENT = '#34D3EE';

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${CORE_EMISSIVE}" stop-opacity="0.9" />
      <stop offset="55%" stop-color="${CORE_EMISSIVE}" stop-opacity="0.25" />
      <stop offset="100%" stop-color="${CORE_EMISSIVE}" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}" />

  <!-- molten-core glyph -->
  <circle cx="150" cy="315" r="150" fill="url(#coreGlow)" />
  <circle cx="150" cy="315" r="46" fill="${CORE_BASE}" stroke="${CORE_EMISSIVE}" stroke-width="2" />
  <circle cx="150" cy="315" r="22" fill="${CORE_EMISSIVE}" />

  <!-- accent tab mark, matches the nav/footer 16x3 bar -->
  <rect x="360" y="222" width="40" height="6" fill="${ACCENT}" />
  <text x="416" y="234" font-family="JetBrains Mono, ui-monospace, monospace" font-size="16" letter-spacing="3" fill="${TEXT_SECONDARY}">FOUNDRY</text>

  <text x="360" y="320" font-family="Instrument Serif, Georgia, serif" font-size="72" fill="${TEXT_PRIMARY}">Abhijit Bansal</text>
  <text x="360" y="376" font-family="Inter, Helvetica, Arial, sans-serif" font-size="26" fill="${TEXT_SECONDARY}">Foundry — privacy-first apps &amp; AI agent tooling</text>
</svg>
`;

await mkdir(dirname(outPath), { recursive: true });
await sharp(Buffer.from(svg)).png().toFile(outPath);
console.log(`[og-image] wrote ${outPath}`);

// favicon set — rasterized from the committed favicon.svg (ember-tab mark,
// fixed dark-mode accent since favicons don't get data-theme).
const faviconSvgPath = resolve(publicDir, 'favicon.svg');
const faviconSizes = [
  { size: 32, name: 'favicon-32.png' },
  { size: 180, name: 'favicon-180.png' },
];

for (const { size, name } of faviconSizes) {
  const dest = resolve(publicDir, name);
  await sharp(faviconSvgPath).resize(size, size).png().toFile(dest);
  console.log(`[favicon] wrote ${dest}`);
}
