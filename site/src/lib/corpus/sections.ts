/** Drop a leading `# Title` line so section headings align with corpus song bodies. */
export function stripLeadingMarkdownTitle(body: string): string {
	const trimmed = body.replace(/^\s+/, '');
	return trimmed.replace(/^#\s+[^\n]+\n+/, '');
}

export function extractMarkdownSection(body: string, heading: string): string {
	const normalized = stripLeadingMarkdownTitle(body);
	const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const startRe = new RegExp(`(?:^|\\n)## ${escaped}\\s*\\r?\\n+`);
	const startMatch = normalized.match(startRe);
	if (!startMatch || startMatch.index === undefined) {
		return '';
	}
	const contentStart = startMatch.index + startMatch[0].length;
	const rest = normalized.slice(contentStart);
	const nextHeading = rest.search(/\r?\n## /);
	const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
	return section.trim();
}
