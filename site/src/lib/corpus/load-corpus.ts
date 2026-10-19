import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { buildPerformanceIndex } from './build-performance-index';
import { buildShowDuplicateIndex, buildSongDuplicateIndex } from './load-duplicate-reports';
import { normalizeSetlist } from './parse-setlist';
import { normalizeContributors } from '../format-contributors';
import { extractMarkdownSection } from './sections';
import { normalizeTracklist } from './parse-tracklist';
import type {
	CorpusData,
	ReleaseRecord,
	ReleaseSourceShow,
	ShowLinks,
	ShowRecord,
	ShowReleaseRef,
	SongRecord,
} from './types';
import { CORPUS_DATA_DIR, showDaySlug, showKey } from './paths';

let cache: CorpusData | null = null;

function parseCancelledFlag(data: Record<string, unknown>): boolean {
	const raw = data.cancelled;
	return raw === true || raw === 'true' || raw === 1 || raw === '1';
}

function parseDateParts(date: string): { year: string; month: string } {
	const parts = date.split('-');
	return {
		year: parts[0] ?? '0000',
		month: parts[1] ?? '01',
	};
}

function loadShows(): ShowRecord[] {
	const pattern = path.join(CORPUS_DATA_DIR, 'shows', '**', '*.md');
	const files = fg.sync(pattern, { onlyFiles: true });
	const shows: ShowRecord[] = [];

	for (const filePath of files) {
		const raw = fs.readFileSync(filePath, 'utf8');
		const parsed = matter(raw);
		const data = parsed.data as Record<string, unknown>;
		const date = String(data.date ?? '');
		const { year, month } = parseDateParts(date);
		const venue = (data.venue as Record<string, unknown>) ?? {};
		const venueName = typeof venue.name === 'string' ? venue.name : '';

		const name = String(data.name ?? path.basename(filePath, '.md'));
		const cancelled = parseCancelledFlag(data);
		shows.push({
			filePath,
			id: Number(data.id ?? 0),
			name,
			day: showDaySlug(name, date),
			date,
			year,
			month,
			band: String(data.band ?? ''),
			venueName,
			venue,
			setlist: normalizeSetlist(data.setlist),
			links: (data.links as ShowLinks) ?? {},
			notes: extractMarkdownSection(parsed.content, 'Notes'),
			permalink: String(data.permalink ?? ''),
			modifiedGmt: String(data.modified_gmt ?? ''),
			...(cancelled ? { cancelled: true } : {}),
		});
	}

	return shows.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}

function loadSongs(): SongRecord[] {
	const pattern = path.join(CORPUS_DATA_DIR, 'songs', '*.md');
	const files = fg.sync(pattern, { onlyFiles: true });
	const songs: SongRecord[] = [];

	for (const filePath of files) {
		const raw = fs.readFileSync(filePath, 'utf8');
		const parsed = matter(raw);
		const data = parsed.data as Record<string, unknown>;
		const bandRaw = data.band;
		const band = Array.isArray(bandRaw)
			? bandRaw.map((b) => String(b))
			: bandRaw
				? [String(bandRaw)]
				: [];

		songs.push({
			filePath,
			id: Number(data.id ?? 0),
			name: String(data.name ?? path.basename(filePath, '.md')),
			title: String(data.title ?? data.name ?? ''),
			band,
			contributors: normalizeContributors(data.contributors),
			links: (data.links as ShowLinks) ?? {},
			chordsSourceUrl: String(data.chords_source_url ?? ''),
			alsoKnownAs: Array.isArray(data.also_known_as)
				? data.also_known_as.map((t) => String(t))
				: [],
			attribution:
				typeof data.attribution === 'string' ? data.attribution.trim() : '',
			stats: (data.stats as SongRecord['stats']) ?? {},
			lyrics: extractMarkdownSection(parsed.content, 'Lyrics'),
			lyricAnnotations: extractMarkdownSection(parsed.content, 'Lyric annotations'),
			songNotes: extractMarkdownSection(parsed.content, 'Notes'),
			chordSheet: extractMarkdownSection(parsed.content, 'Chord sheet'),
			permalink: String(data.permalink ?? ''),
			modifiedGmt: String(data.modified_gmt ?? ''),
		});
	}

	return songs.sort((a, b) => a.title.localeCompare(b.title));
}

function stringList(raw: unknown): string[] {
	if (Array.isArray(raw)) {
		return raw.map((v) => String(v)).filter(Boolean);
	}
	return raw ? [String(raw)] : [];
}

/** YAML dates may arrive as `Date` when unquoted; always return `YYYY-MM-DD` or the raw string. */
function dateString(raw: unknown): string {
	if (raw instanceof Date) {
		return raw.toISOString().slice(0, 10);
	}
	return raw == null ? '' : String(raw);
}

function loadReleases(): ReleaseRecord[] {
	const pattern = path.join(CORPUS_DATA_DIR, 'releases', '*.md');
	const files = fg.sync(pattern, { onlyFiles: true });
	const releases: ReleaseRecord[] = [];

	for (const filePath of files) {
		const parsed = matter(fs.readFileSync(filePath, 'utf8'));
		const data = parsed.data as Record<string, unknown>;
		const sourceShows = Array.isArray(data.source_shows)
			? (data.source_shows.filter(
					(row) => typeof row === 'object' && row !== null,
				) as ReleaseSourceShow[])
			: [];

		releases.push({
			filePath,
			id: Number(data.id ?? 0),
			name: String(data.name ?? path.basename(filePath, '.md')),
			title: String(data.title ?? data.name ?? ''),
			band: stringList(data.band),
			releaseTypes: stringList(data.release_types),
			releaseDate: dateString(data.release_date),
			releaseDateAlt: dateString(data.release_date_alt),
			links: (data.links as ShowLinks) ?? {},
			sourceShows,
			tracklist: normalizeTracklist(data.tracklist),
			notes: extractMarkdownSection(parsed.content, 'Notes'),
			permalink: String(data.permalink ?? ''),
			modifiedGmt: String(data.modified_gmt ?? ''),
		});
	}

	return releases.sort(
		(a, b) => a.releaseDate.localeCompare(b.releaseDate) || a.title.localeCompare(b.title),
	);
}

/** Map show id → releases that cite it as a source show (matched by id, then by show name). */
function buildReleasesByShowId(
	releases: ReleaseRecord[],
	shows: ShowRecord[],
	showsById: Map<number, ShowRecord>,
): Map<number, ShowReleaseRef[]> {
	const showsByName = new Map(shows.map((s) => [s.name, s]));
	const map = new Map<number, ShowReleaseRef[]>();
	for (const release of releases) {
		for (const source of release.sourceShows) {
			const show =
				(source.id != null ? showsById.get(Number(source.id)) : undefined) ??
				(source.name ? showsByName.get(String(source.name)) : undefined);
			if (!show) {
				continue;
			}
			const list = map.get(show.id) ?? [];
			if (!list.some((ref) => ref.release.name === release.name)) {
				list.push({ release, coverage: String(source.coverage ?? '') });
				map.set(show.id, list);
			}
		}
	}
	return map;
}

function buildReleasesBySongSlug(releases: ReleaseRecord[]): Map<string, ReleaseRecord[]> {
	const map = new Map<string, ReleaseRecord[]>();
	for (const release of releases) {
		const slugs = new Set<string>();
		for (const track of release.tracklist) {
			if (track.entry_type === 'song-post' && track.name) {
				slugs.add(String(track.name));
			}
			for (const part of track.parts ?? []) {
				if (part.name) {
					slugs.add(String(part.name));
				}
			}
		}
		for (const slug of slugs) {
			const list = map.get(slug) ?? [];
			list.push(release);
			map.set(slug, list);
		}
	}
	return map;
}

export function getCorpus(): CorpusData {
	if (cache) {
		return cache;
	}

	if (!fs.existsSync(CORPUS_DATA_DIR)) {
		throw new Error(`Corpus data not found at ${CORPUS_DATA_DIR}. Run from repo with data/ present.`);
	}

	const shows = loadShows();
	const songs = loadSongs();
	const releases = loadReleases();
	const songsBySlug = new Map(songs.map((s) => [s.name, s]));
	const showsById = new Map(shows.map((s) => [s.id, s]));
	const showsByKey = new Map(shows.map((s) => [showKey(s.year, s.month, s.day), s]));
	const releasesBySlug = new Map(releases.map((r) => [r.name, r]));
	const releasesByShowId = buildReleasesByShowId(releases, shows, showsById);
	const years = [...new Set(shows.map((s) => s.year))].sort();
	const performanceBySlug = buildPerformanceIndex(shows);
	const duplicateShowById = buildShowDuplicateIndex(showsById);
	const duplicateSongBySlug = buildSongDuplicateIndex(songsBySlug);

	cache = {
		shows,
		releases,
		releasesBySlug,
		releasesByShowId,
		releasesBySongSlug: buildReleasesBySongSlug(releases),
		songs,
		songsBySlug,
		showsById,
		showsByKey,
		years,
		performanceBySlug,
		duplicateShowById,
		duplicateSongBySlug,
	};

	return cache;
}
