// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Production site URL for canonical links, OG, and sitemap (set in Cloudflare Pages). */
const siteUrl = process.env.SITE_URL ?? 'https://grateful.deadiverse.com';

// https://astro.build/config
export default defineConfig({
	site: siteUrl,
	integrations: [
		sitemap({
			filter: (page) => !page.includes('/dev/'),
		}),
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
