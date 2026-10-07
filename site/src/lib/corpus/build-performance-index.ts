import { formatVenueLocation } from '../venue-location';
import { showHasRecording } from '../show-recording';
import { showDaySlug, showKey } from './paths';
import type { PerformanceRef, SetlistEntry, ShowRecord, SongPerformanceIndex, SongRecord, SongStatsExport } from './types';

function refFromShow(show: ShowRecord, row: SetlistEntry, setLabel: string, setPosition: number): PerformanceRef {
	return {
		showName: show.name,
		day: show.day,
		date: show.date,
		year: show.year,
		month: show.month,
		venueName: show.venueName,
		location: formatVenueLocation(show.venue),
		setLabel,
		setPosition,
		duration: row.duration ? String(row.duration) : '',
		coverArtist: row.cover_artist ? String(row.cover_artist) : '',
		segueIntoNext: Boolean(row.segue_into_next),
		hasRecording: showHasRecording(show.links),
	};
}

/** All performances of `songSlug` on a single show (setlist order). */
export function performancesForSongInShow(show: ShowRecord, songSlug: string): PerformanceRef[] {
	const refs: PerformanceRef[] = [];
	let setLabel = '';
	let setPosition = 0;

	for (const row of show.setlist) {
		if (row.entry_type === 'note') {
			const label = row.notes ?? row.title ?? '';
			if (label) {
				setLabel = String(label);
			}
			continue;
		}
		if (row.entry_type !== 'song-post' || !row.name) {
			continue;
		}
		setPosition += 1;
		if (String(row.name) !== songSlug) {
			continue;
		}
		refs.push(refFromShow(show, row, setLabel, setPosition));
	}

	return refs;
}

export function buildPerformanceIndex(shows: ShowRecord[]): Map<string, SongPerformanceIndex> {
	const sorted = [...shows].sort((a, b) => a.date.localeCompare(b.date));
	const map = new Map<string, SongPerformanceIndex>();

	for (const show of sorted) {
		let setLabel = '';
		let setPosition = 0;
		for (const row of show.setlist) {
			if (row.entry_type === 'note') {
				const label = row.notes ?? row.title ?? '';
				if (label) {
					setLabel = String(label);
				}
				continue;
			}
			if (row.entry_type !== 'song-post' || !row.name) {
				continue;
			}
			setPosition += 1;
			const slug = String(row.name);
			let entry = map.get(slug);
			if (!entry) {
				entry = { playCount: 0, firstPlayed: null, performances: [] };
				map.set(slug, entry);
			}
			const ref = refFromShow(show, row, setLabel, setPosition);
			entry.performances.push(ref);
			entry.playCount = entry.performances.length;
			if (!entry.firstPlayed) {
				entry.firstPlayed = ref;
			}
		}
	}

	return map;
}

export function resolveSongStats(
	song: SongRecord,
	index: Map<string, SongPerformanceIndex>,
	showsByKey: Map<string, ShowRecord>
): SongPerformanceIndex {
	const computed = index.get(song.name) ?? {
		playCount: 0,
		firstPlayed: null,
		performances: [],
	};
	const exported: SongStatsExport = song.stats ?? {};
	const exportCount = typeof exported.play_count === 'number' ? exported.play_count : 0;
	const playCount = exportCount > 0 ? exportCount : computed.playCount;

	let firstPlayed = computed.firstPlayed;
	if (exported.first_played?.date && exported.first_played?.name) {
		const date = exported.first_played.date;
		const parts = date.split('-');
		const year = parts[0] ?? '';
		const month = parts[1] ?? '';
		const showName = String(exported.first_played.name);
		const day = showDaySlug(showName, date);
		const fromCorpus = showsByKey.get(showKey(year, month, day));
		firstPlayed = fromCorpus
			? refFromShow(fromCorpus, { entry_type: 'song-post', name: song.name }, '', 0)
			: {
					showName,
					day,
					date,
					year,
					month,
					venueName: '',
					location: '',
					setLabel: '',
					setPosition: 0,
					duration: '',
					coverArtist: '',
					segueIntoNext: false,
					hasRecording: false,
				};
	}

	return {
		playCount,
		firstPlayed,
		performances: computed.performances,
	};
}
