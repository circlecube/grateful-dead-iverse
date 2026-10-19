import type { TracklistEntry } from './types';

export function normalizeTracklist(raw: unknown): TracklistEntry[] {
	if (!Array.isArray(raw)) {
		return [];
	}
	return raw.filter((row): row is TracklistEntry => typeof row === 'object' && row !== null);
}

/** Number of tracks (every tracklist row counts once; suite parts are not counted separately). */
export function countReleaseTracks(tracklist: TracklistEntry[]): number {
	return tracklist.filter((row) => (row.title ?? row.name ?? '').trim() !== '').length;
}

/** Group tracks by disc number (defaults to 1) preserving order. */
export function groupByDisc(tracklist: TracklistEntry[]): Array<{ disc: number; tracks: TracklistEntry[] }> {
	const groups = new Map<number, TracklistEntry[]>();
	for (const row of tracklist) {
		const disc = Number(row.disc ?? 1) || 1;
		const list = groups.get(disc) ?? [];
		list.push(row);
		groups.set(disc, list);
	}
	return [...groups.entries()]
		.sort((a, b) => a[0] - b[0])
		.map(([disc, tracks]) => ({ disc, tracks }));
}
