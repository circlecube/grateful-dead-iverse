import { songUrl } from './corpus/paths';

/** Matches `data/_fixtures/show.md` front matter `id`. */
export const FIXTURE_SHOW_ID = 99999001;

/** Matches `data/_fixtures/song.md` front matter `name`. */
export const FIXTURE_SONG_SLUG = 'site-fixture-showcase';

export const FIXTURES_INDEX_PATH = '/dev/';
export const FIXTURE_SHOW_PATH = '/dev/fixture-show/';
export const FIXTURE_SONG_PATH = '/dev/fixture-song/';
export const FIXTURES_BACK_LABEL = '← Fixtures';

export function resolveSongHref(slug: string): string {
	if (slug === FIXTURE_SONG_SLUG) {
		return FIXTURE_SONG_PATH;
	}
	return songUrl(slug);
}

export function resolveShowHrefForFixture(showId: number): string | undefined {
	if (showId === FIXTURE_SHOW_ID) {
		return FIXTURE_SHOW_PATH;
	}
	return undefined;
}
