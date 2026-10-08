import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EXPORT_MANIFEST = path.resolve(SITE_ROOT, '..', 'reports', 'export-manifest.json');

/** ISO time when this static build started (same for all pages in one `astro build`). */
export const SITE_BUILD_TIME_ISO = new Date().toISOString();

export interface CorpusExportMeta {
	generatedAt: string;
	contentHash?: string;
	showCount?: number;
	songCount?: number;
}

let exportMetaCache: CorpusExportMeta | null | undefined;

export function getCorpusExportMeta(): CorpusExportMeta | null {
	if (exportMetaCache !== undefined) {
		return exportMetaCache;
	}
	if (!fs.existsSync(EXPORT_MANIFEST)) {
		exportMetaCache = null;
		return null;
	}
	try {
		const raw = JSON.parse(fs.readFileSync(EXPORT_MANIFEST, 'utf8')) as Record<string, unknown>;
		const generatedAt = String(raw.generated_at ?? '').trim();
		if (!generatedAt) {
			exportMetaCache = null;
			return null;
		}
		exportMetaCache = {
			generatedAt,
			contentHash:
				typeof raw.content_hash === 'string' ? raw.content_hash : undefined,
			showCount: typeof raw.show_count === 'number' ? raw.show_count : undefined,
			songCount: typeof raw.song_count === 'number' ? raw.song_count : undefined,
		};
		return exportMetaCache;
	} catch {
		exportMetaCache = null;
		return null;
	}
}

const freshnessFormatter = new Intl.DateTimeFormat('en-US', {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
	hour: 'numeric',
	minute: '2-digit',
	timeZone: 'UTC',
});

/** Format corpus `modified_gmt` or ISO export timestamps for the footer. */
export function formatFreshnessTimestamp(iso: string): string | null {
	const trimmed = iso.trim();
	if (!trimmed) {
		return null;
	}
	const ms = Date.parse(trimmed.includes('T') ? trimmed : `${trimmed}T00:00:00+00:00`);
	if (Number.isNaN(ms)) {
		return null;
	}
	return `${freshnessFormatter.format(new Date(ms))} UTC`;
}
