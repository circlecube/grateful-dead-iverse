// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';
import { defineConfig } from 'astro/config';
import { buildSitemapLastmod } from './src/lib/sitemap-lastmod.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Production site URL for canonical links, OG, and sitemap (set in Cloudflare Pages). */
const siteUrl = process.env.SITE_URL ?? 'https://grateful.deadiverse.com';

/** Lazily built on first sitemap entry so dev/preview never load the corpus here. */
/** @type {Map<string, string> | null} */
let sitemapLastmod = null;

// https://astro.build/config
export default defineConfig({
	site: siteUrl,
	integrations: [
		sitemap({
			filter: (page) => !page.includes('/dev/'),
			// <lastmod> from corpus `modified_gmt` (index pages use their newest entry).
			serialize: (item) => {
				sitemapLastmod ??= buildSitemapLastmod();
				const lastmod = sitemapLastmod.get(new URL(item.url).pathname);
				return lastmod ? { ...item, lastmod } : item;
			},
		}),
		pagefind(),
		{
			name: 'omit-dev-pages-from-production',
			hooks: {
				'astro:build:done': ({ dir }) => {
					if (process.env.NODE_ENV !== 'production') {
						return;
					}
					const devDir = fileURLToPath(new URL('./dev/', dir));
					if (fs.existsSync(devDir)) {
						fs.rmSync(devDir, { recursive: true, force: true });
					}
				},
			},
		},
	],
});
