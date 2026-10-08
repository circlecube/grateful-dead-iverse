/**
 * Rasterize public/og-default.png from deadiverse-icon-face.svg + deadiverse-logo-text.svg.
 * Colors match site/src/styles/tokens.css (--dv-chrome-bg, --dv-accent-2).
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

/** @see site/src/styles/tokens.css */
const COLORS = {
	chromeBg: '#0a1c27',
	accent2: '#f2c33a',
};

const WIDTH = 1200;
const HEIGHT = 630;
const ACCENT_BAR = 3;

const iconPath = path.join(publicDir, 'deadiverse-icon-face.svg');
const logoPath = path.join(publicDir, 'deadiverse-logo-text.svg');
const outPng = path.join(publicDir, 'og-default.png');
const outSvg = path.join(publicDir, 'og-default.svg');

const iconSize = 220;
const logoWidth = 500;
const gap = 32;

const bgSvg = Buffer.from(
	`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.chromeBg}"/>
  <rect y="${HEIGHT - ACCENT_BAR}" width="${WIDTH}" height="${ACCENT_BAR}" fill="${COLORS.accent2}"/>
</svg>`,
);

const iconMeta = await sharp(iconPath).metadata();
const iconHeight = Math.round(iconSize * ((iconMeta.height ?? iconSize) / (iconMeta.width ?? iconSize)));

const icon = await sharp(iconPath)
	.resize(iconSize, iconHeight, { fit: 'contain' })
	.png()
	.toBuffer();

const logoMeta = await sharp(logoPath).metadata();
const logoHeight = Math.round(logoWidth * ((logoMeta.height ?? 87) / (logoMeta.width ?? 526)));

const logo = await sharp(logoPath)
	.resize(logoWidth, logoHeight, { fit: 'contain' })
	.png()
	.toBuffer();

const blockHeight = iconHeight + gap + logoHeight;
const top = Math.round((HEIGHT - ACCENT_BAR - blockHeight) / 2);
const iconLeft = Math.round((WIDTH - iconSize) / 2);
const logoLeft = Math.round((WIDTH - logoWidth) / 2);

await sharp(bgSvg)
	.composite([
		{ input: icon, left: iconLeft, top },
		{ input: logo, left: logoLeft, top: top + iconHeight + gap },
	])
	.png()
	.toFile(outPng);

const wrapperSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="Grateful Dead-iverse">
  <title>Grateful Dead-iverse</title>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.chromeBg}"/>
  <rect y="${HEIGHT - ACCENT_BAR}" width="${WIDTH}" height="${ACCENT_BAR}" fill="${COLORS.accent2}"/>
  <image href="deadiverse-icon-face.svg" x="${iconLeft}" y="${top}" width="${iconSize}" height="${iconHeight}"/>
  <image href="deadiverse-logo-text.svg" x="${logoLeft}" y="${top + iconHeight + gap}" width="${logoWidth}" height="${logoHeight}"/>
</svg>
`;

writeFileSync(outSvg, wrapperSvg, 'utf8');
console.log(`Wrote ${outPng} and ${outSvg}`);
