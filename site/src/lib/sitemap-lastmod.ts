import { getCorpus } from './corpus/load-corpus';
import { showUrl, songUrl } from './corpus/paths';

/** Latest of two ISO timestamps (empty / invalid values ignored). */
function later(a: string | undefined, b: string): string {
	if (!b || Number.isNaN(Date.parse(b))) {
		return a ?? '';
	}
	if (!a || Date.parse(b) > Date.parse(a)) {
		return b;
	}
	return a;
}

/**
 * Map of site path (e.g. `/songs/dark-star/`) → corpus `modified_gmt`, for sitemap `<lastmod>`.
 * Index pages (`/`, `/shows/`, `/shows/all/`, `/shows/{year}/`, `/songs/`) use the newest entry they list.
 */
export function buildSitemapLastmod(): Map<string, string> {
	const { shows, songs } = getCorpus();
	const lastmod = new Map<string, string>();
	const bump = (key: string, value: string) => {
		const next = later(lastmod.get(key), value);
		if (next) {
			lastmod.set(key, next);
		}
	};

	for (const show of shows) {
		bump(showUrl(show), show.modifiedGmt);
		bump(`/shows/${show.year}/`, show.modifiedGmt);
		bump('/shows/', show.modifiedGmt);
		bump('/shows/all/', show.modifiedGmt);
		bump('/', show.modifiedGmt);
	}
	for (const song of songs) {
		bump(songUrl(song.name), song.modifiedGmt);
		bump('/songs/', song.modifiedGmt);
		bump('/', song.modifiedGmt);
	}

	return lastmod;
}
