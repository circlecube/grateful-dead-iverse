/** Turn corpus band slug into a readable label (e.g. `the-grateful-dead` → The Grateful Dead). */
export function formatBandSlug(slug: string): string {
	return slug
		.split('-')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

export function formatBandList(bands: string[]): string {
	return bands.map(formatBandSlug).join(', ');
}
