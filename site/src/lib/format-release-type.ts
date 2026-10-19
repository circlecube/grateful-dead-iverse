const SPECIAL: Record<string, string> = {
	ep: 'EP',
	lp: 'LP',
	'box-set': 'Box set',
	'remix-album': 'Remix album',
};

/** `release` taxonomy slug → readable label (`box-set` → Box set). */
export function formatReleaseType(slug: string): string {
	if (SPECIAL[slug]) {
		return SPECIAL[slug];
	}
	const words = slug.split('-').filter(Boolean).join(' ');
	return words.charAt(0).toUpperCase() + words.slice(1);
}

export function formatReleaseTypes(slugs: string[]): string {
	return slugs.map(formatReleaseType).join(', ');
}
