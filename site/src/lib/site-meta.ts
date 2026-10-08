/** Site origin for canonical URLs and Open Graph (`SITE_URL` in Cloudflare Pages → https://grateful.deadiverse.com). */
export const SITE_NAME = 'Grateful Dead-iverse';

export const DEFAULT_DESCRIPTION =
	'Browse Grateful Dead shows and songs—setlists, lyrics, venues, and play history—from the open markdown corpus.';

export const OG_IMAGE_PATH = '/og-default.png';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export function absoluteUrl(path: string, site: URL | string): string {
	const base = typeof site === 'string' ? site : site.origin;
	const normalized = path.startsWith('/') ? path : `/${path}`;
	return new URL(normalized, base).href;
}

/** Prefer corpus `permalink` (deadiverse.com) for canonical when valid; otherwise this page URL. */
export function resolveCanonicalUrl(permalink: string | undefined, pageUrl: URL): string {
	const trimmed = permalink?.trim();
	if (!trimmed) {
		return pageUrl.href;
	}
	try {
		const url = new URL(trimmed);
		if (url.protocol === 'https:' || url.protocol === 'http:') {
			return url.href;
		}
	} catch {
		// invalid permalink — keep static site URL
	}
	return pageUrl.href;
}

export function absoluteOgImage(site: URL | string): string {
	return absoluteUrl(OG_IMAGE_PATH, site);
}

/** Keep meta description within common crawler limits. */
export function truncateMetaDescription(text: string, max = 160): string {
	const trimmed = text.replace(/\s+/g, ' ').trim();
	if (trimmed.length <= max) {
		return trimmed;
	}
	return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}
