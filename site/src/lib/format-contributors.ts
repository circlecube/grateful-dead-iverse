import { formatBandSlug } from './format-band';
import type { SongContributor } from './corpus/types';

const CREDIT_TYPE_LABELS: Record<string, string> = {
	music: 'Music',
	lyrics: 'Lyrics',
	words: 'Words',
	composition: 'Composition',
};

export function formatCreditType(creditType: string): string {
	const key = creditType.trim().toLowerCase();
	return CREDIT_TYPE_LABELS[key] ?? formatBandSlug(key.replace(/_/g, '-'));
}

export function formatMusicianSlug(slug: string): string {
	return formatBandSlug(slug);
}

export function normalizeContributors(raw: unknown): SongContributor[] {
	if (!Array.isArray(raw)) {
		return [];
	}
	const out: SongContributor[] = [];
	for (const row of raw) {
		if (!row || typeof row !== 'object') continue;
		const r = row as Record<string, unknown>;
		const musiciansRaw = r.musicians;
		const musicians = Array.isArray(musiciansRaw)
			? musiciansRaw.map((m) => String(m)).filter(Boolean)
			: [];
		const credit_type = String(r.credit_type ?? '');
		if (!credit_type && musicians.length === 0) continue;
		out.push({
			musicians,
			credit_type,
			credit_note: String(r.credit_note ?? ''),
		});
	}
	return out;
}

export function formatContributorLine(row: SongContributor): string {
	const names = row.musicians.map(formatMusicianSlug).join(', ');
	const typeLabel = formatCreditType(row.credit_type);
	if (!names) return typeLabel;
	return `${typeLabel}: ${names}`;
}
