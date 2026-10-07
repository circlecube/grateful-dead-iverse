import type { SongPerformanceIndex } from './corpus/types';

export function playCountForSong(
	slug: string,
	index: Map<string, SongPerformanceIndex>,
	exported?: number
): number {
	const fromIndex = index.get(slug)?.playCount ?? 0;
	if (typeof exported === 'number' && exported > 0) {
		return exported;
	}
	return fromIndex;
}
