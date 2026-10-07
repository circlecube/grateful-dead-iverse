import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { showUrl } from './paths';
import type { EntityDuplicateNotice, SongRecord } from './types';

const SITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const REPORTS_DIR = path.resolve(SITE_ROOT, '..', 'reports');

const SHOW_REPORT = path.join(REPORTS_DIR, 'duplicate-show-candidates.json');
const SONG_REPORT = path.join(REPORTS_DIR, 'duplicate-song-candidates.json');

const SHOW_REASON_LABELS: Record<string, string> = {
	same_date_same_band: 'same band and calendar date',
	different_venue_names: 'different venue names',
	matching_setlist_fingerprint: 'matching setlist fingerprint',
};

function humanizeShowReasons(reasons: string[]): string[] {
	return reasons.map((r) => SHOW_REASON_LABELS[r] ?? r.replaceAll('_', ' '));
}

function readJsonFile(filePath: string): unknown {
	if (!fs.existsSync(filePath)) {
		return null;
	}
	try {
		return JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
	} catch {
		return null;
	}
}

export function buildShowDuplicateIndex(
	showsById: Map<number, ShowRecord>
): Map<number, EntityDuplicateNotice> {
	const index = new Map<number, EntityDuplicateNotice>();
	const raw = readJsonFile(SHOW_REPORT) as { groups?: unknown[] } | null;
	if (!raw?.groups) {
		return index;
	}

	for (const group of raw.groups) {
		if (!group || typeof group !== 'object') continue;
		const g = group as {
			reasons?: string[];
			shows?: Array<{ id?: number; date?: string; venue?: string; permalink?: string }>;
		};
		const entries = g.shows ?? [];
		const reasons = humanizeShowReasons(g.reasons ?? []);

		for (const entry of entries) {
			const id = Number(entry.id);
			if (!id) continue;

			const peers = entries
				.filter((other) => Number(other.id) !== id)
				.map((other) => {
					const otherId = Number(other.id);
					const inCorpus = showsById.get(otherId);
					const label =
						[inCorpus?.date ?? other.date, inCorpus?.venueName ?? other.venue]
							.filter(Boolean)
							.join(' — ') || `Show #${otherId}`;
					return {
						label,
						href: inCorpus ? showUrl(inCorpus) : undefined,
						externalHref: inCorpus ? undefined : other.permalink,
					};
				});

			index.set(id, { reasons, peers });
		}
	}

	return index;
}

export function buildSongDuplicateIndex(
	songsBySlug: Map<string, SongRecord>
): Map<string, EntityDuplicateNotice> {
	const index = new Map<string, EntityDuplicateNotice>();
	const raw = readJsonFile(SONG_REPORT) as { groups?: unknown[] } | null;
	if (!raw?.groups) {
		return index;
	}

	for (const group of raw.groups) {
		if (!group || typeof group !== 'object') continue;
		const g = group as {
			title?: string;
			songs?: Array<{ id?: number; name?: string; title?: string; permalink?: string }>;
		};
		const entries = g.songs ?? [];
		const reasons = ['similar titles (per duplicate-song report)'];

		for (const entry of entries) {
			const slug = String(entry.name ?? '');
			if (!slug) continue;

			const peers = entries
				.filter((other) => String(other.name ?? '') !== slug)
				.map((other) => {
					const otherSlug = String(other.name ?? '');
					const inCorpus = songsBySlug.get(otherSlug);
					const label = inCorpus?.title ?? other.title ?? otherSlug;
					return {
						label,
						href: inCorpus ? `/songs/${otherSlug}/` : undefined,
						externalHref: inCorpus ? undefined : other.permalink,
					};
				});

			index.set(slug, { reasons, peers });
		}
	}

	return index;
}
