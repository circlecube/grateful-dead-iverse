import { countPlayedSongs, hasSetlistDisplay } from './corpus';
import type { ShowRecord, SongRecord } from './corpus/types';
import { truncateMetaDescription } from './site-meta';
import { formatVenueLocation } from './venue-location';

export function descriptionForHome(showCount: number, songCount: number): string {
	return truncateMetaDescription(
		`Explore ${showCount.toLocaleString()} Grateful Dead shows and ${songCount.toLocaleString()} songs—setlists, lyrics, venues, and live play history from the open markdown corpus.`,
	);
}

export function descriptionForShow(show: ShowRecord): string {
	const location = formatVenueLocation(show.venue);
	const played = countPlayedSongs(show.setlist);
	const hasSetlist = hasSetlistDisplay(show.setlist);
	const venuePart = show.venueName ? ` at ${show.venueName}` : '';
	const locationPart = location ? ` (${location})` : '';
	const setlistPart = hasSetlist
		? `${played.toLocaleString()} songs in the setlist.`
		: 'Setlist and notes from the open corpus.';
	return truncateMetaDescription(
		`Grateful Dead concert on ${show.date}${venuePart}${locationPart}. ${setlistPart}`,
	);
}

export function descriptionForSong(song: SongRecord, playCount: number): string {
	const aka =
		song.alsoKnownAs.length > 0 ? ` Also known as ${song.alsoKnownAs.join('; ')}.` : '';
	const attribution = song.attribution ? ` Cover: ${song.attribution}.` : '';
	return truncateMetaDescription(
		`${song.title}: lyrics, chord sheet, and ${playCount.toLocaleString()} known live performances in the Grateful Dead markdown corpus.${attribution}${aka}`,
	);
}

export function descriptionForSongIndex(songCount: number): string {
	return truncateMetaDescription(
		`Alphabetical index of ${songCount.toLocaleString()} Grateful Dead songs with lyrics, stats, and performance history.`,
	);
}

export function descriptionForShowsYear(year: string, showCount: number): string {
	return truncateMetaDescription(
		`${showCount.toLocaleString()} Grateful Dead shows from ${year}—dates, venues, and setlists from the open markdown corpus.`,
	);
}

export function descriptionForShowsIndex(yearCount: number, showCount: number): string {
	return truncateMetaDescription(
		`Browse ${showCount.toLocaleString()} Grateful Dead shows across ${yearCount.toLocaleString()} years of tours and concerts.`,
	);
}

export function descriptionForAllShows(showCount: number): string {
	return truncateMetaDescription(
		`Complete sortable list of ${showCount.toLocaleString()} Grateful Dead shows in the open markdown corpus.`,
	);
}
