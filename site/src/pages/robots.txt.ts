import type { APIRoute } from 'astro';

/** robots.txt pointing crawlers at the `@astrojs/sitemap` index (origin from `SITE_URL`). */
export const GET: APIRoute = ({ site }) => {
	const sitemapUrl = new URL('sitemap-index.xml', site).href;
	return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
