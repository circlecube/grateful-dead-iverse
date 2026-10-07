import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { normalizeContributors } from '../format-contributors';
import { normalizeSetlist } from './parse-setlist';
import { extractMarkdownSection } from './sections';
import { FIXTURE_SHOW_PATH } from '../fixture-routes';
import { performancesForSongInShow } from './build-performance-index';
import { CORPUS_DATA_DIR, showDaySlug } from './paths';
import type { ShowLinks, ShowRecord, SongPerformanceIndex, SongRecord } from './types';

const FIXTURE_DIR = path.join(CORPUS_DATA_DIR, '_fixtures');

function parseDateParts(date: string): { year: string; month: string } {
	const parts = date.split('-');
	return {
		year: parts[0] ?? '0000',
		month: parts[1] ?? '01',
	};
}

export function fixtureFilesPresent(): boolean {
	return fs.existsSync(path.join(FIXTURE_DIR, 'show.md')) && fs.existsSync(path.join(FIXTURE_DIR, 'song.md'));
}

export function loadFixtureShow(): ShowRecord | null {
	const filePath = path.join(FIXTURE_DIR, 'show.md');
	if (!fs.existsSync(filePath)) return null;
	const raw = fs.readFileSync(filePath, 'utf8');
	const parsed = matter(raw);
	const data = parsed.data as Record<string, unknown>;
	const date = String(data.date ?? '');
	const { year, month } = parseDateParts(date);
	const venue = (data.venue as Record<string, unknown>) ?? {};
	const name = String(data.name ?? 'fixture-show');

	return {
		filePath,
		id: Number(data.id ?? 0),
		name,
		day: showDaySlug(name, date),
		date,
		year,
		month,
		band: String(data.band ?? ''),
		venueName: typeof venue.name === 'string' ? venue.name : '',
		venue,
		setlist: normalizeSetlist(data.setlist),
		links: (data.links as ShowLinks) ?? {},
		notes: extractMarkdownSection(parsed.content, 'Notes'),
		permalink: String(data.permalink ?? ''),
		modifiedGmt: String(data.modified_gmt ?? ''),
	};
}

export function loadFixtureSong(): SongRecord | null {
	const filePath = path.join(FIXTURE_DIR, 'song.md');
	if (!fs.existsSync(filePath)) return null;
	const raw = fs.readFileSync(filePath, 'utf8');
	const parsed = matter(raw);
	const data = parsed.data as Record<string, unknown>;
	const bandRaw = data.band;
	const band = Array.isArray(bandRaw)
		? bandRaw.map((b) => String(b))
		: bandRaw
			? [String(bandRaw)]
			: [];

	return {
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
	};
}

export function buildFixtureSongStats(
	song: SongRecord,
	show: ShowRecord | null
): SongPerformanceIndex {
	const performances = (show ? performancesForSongInShow(show, song.name) : []).map((ref) => ({
		...ref,
		href: FIXTURE_SHOW_PATH,
	}));
	const exportCount = typeof song.stats?.play_count === 'number' ? song.stats.play_count : 0;

	return {
		playCount: exportCount > 0 ? exportCount : performances.length,
		firstPlayed: performances[0] ?? null,
		performances,
	};
}
