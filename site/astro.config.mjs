// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
	integrations: [
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
