import type { SetlistEntry } from './types';

export function normalizeSetlist(raw: unknown): SetlistEntry[] {
	if (!Array.isArray(raw)) {
		return [];
	}
	return raw.filter((row): row is SetlistEntry => typeof row === 'object' && row !== null);
}

export function songSlugsFromSetlist(setlist: SetlistEntry[]): string[] {
	const slugs: string[] = [];
	for (const row of setlist) {
		if (row.entry_type === 'song-post' && row.name) {
			slugs.push(String(row.name));
		}
	}
	return slugs;
}

export function countPlayedSongs(setlist: SetlistEntry[]): number {
	return songSlugsFromSetlist(setlist).length;
}

/** True when the setlist has at least one row that would render on the show page. */
export function hasSetlistDisplay(setlist: SetlistEntry[]): boolean {
	for (const row of setlist) {
		if (row.entry_type === 'note') {
			if ((row.notes ?? row.title ?? '').trim()) {
				return true;
			}
			continue;
		}
		if ((row.title ?? row.name ?? '').trim()) {
			return true;
		}
	}
	return false;
}
