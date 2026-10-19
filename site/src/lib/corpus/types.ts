export type SetlistEntryType = 'note' | 'song-post' | 'song-text' | string;

export interface SetlistEntry {
	entry_type: SetlistEntryType;
	title?: string;
	name?: string;
	id?: number;
	notes?: string;
	cover_artist?: string;
	duration?: string;
	segue_into_next?: boolean;
}

export interface ShowLinks {
	[key: string]: string | string[] | Array<{ label: string; url: string }> | undefined;
	other?: Array<{ label: string; url: string }>;
}

export interface ShowRecord {
	filePath: string;
	id: number;
	name: string;
	/** URL segment: day of month, with optional suffix (e.g. `30`, `07a`). */
	day: string;
	date: string;
	year: string;
	month: string;
	band: string;
	venueName: string;
	venue: Record<string, unknown>;
	setlist: SetlistEntry[];
	links: ShowLinks;
	notes: string;
	permalink: string;
	modifiedGmt: string;
	/** Present when front matter `cancelled: true` (exported from deadiverse cancelled shows). */
	cancelled?: boolean;
}

export interface SongStatsExport {
	play_count?: number;
	first_played?: {
		date?: string;
		id?: number;
		name?: string;
		show_path?: string;
	};
}

export interface SongContributor {
	musicians: string[];
	credit_type: string;
	credit_note: string;
}

export interface SongRecord {
	filePath: string;
	id: number;
	name: string;
	title: string;
	band: string[];
	contributors: SongContributor[];
	links: ShowLinks;
	chordsSourceUrl: string;
	alsoKnownAs: string[];
	/** Original artist for covers (front matter `attribution`). */
	attribution: string;
	stats: SongStatsExport;
	lyrics: string;
	lyricAnnotations: string;
	songNotes: string;
	chordSheet: string;
	permalink: string;
	modifiedGmt: string;
}

export interface PerformanceRef {
	showName: string;
	day: string;
	date: string;
	year: string;
	month: string;
	venueName: string;
	location: string;
	setLabel: string;
	setPosition: number;
	duration: string;
	coverArtist: string;
	segueIntoNext: boolean;
	hasRecording: boolean;
	/** Dev fixture or other override; when set, `showUrl()` uses this path. */
	href?: string;
}

export interface SongPerformanceIndex {
	playCount: number;
	firstPlayed: PerformanceRef | null;
	performances: PerformanceRef[];
}

export interface DuplicatePeerLink {
	label: string;
	href?: string;
	externalHref?: string;
}

export interface EntityDuplicateNotice {
	reasons: string[];
	peers: DuplicatePeerLink[];
}

export interface TracklistPart {
	title?: string;
	name?: string;
	id?: number;
	credits?: string;
	notes?: string;
	live_context?: string;
}

export interface TracklistEntry {
	entry_type: 'song-post' | 'song-text' | string;
	track?: number;
	disc?: number;
	title?: string;
	name?: string;
	id?: number;
	duration?: string;
	segue_into_next?: boolean;
	credits?: string;
	notes?: string;
	suite?: boolean;
	parts?: TracklistPart[];
}

export interface ReleaseSourceShow {
	id?: number;
	name?: string;
	date?: string;
	/** Relative path from the release file, e.g. `../shows/1973/12/1973-12-19.md`. */
	show_path?: string;
	coverage?: 'full' | 'partial' | string;
	notes?: string;
}

export interface ReleaseRecord {
	filePath: string;
	id: number;
	name: string;
	title: string;
	band: string[];
	/** `release` taxonomy slugs (album, live, compilation…). */
	releaseTypes: string[];
	/** `YYYY-MM-DD` or empty. */
	releaseDate: string;
	releaseDateAlt: string;
	links: ShowLinks;
	sourceShows: ReleaseSourceShow[];
	tracklist: TracklistEntry[];
	notes: string;
	permalink: string;
	modifiedGmt: string;
}

/** A release that lists a show as a source (for the cross-link on show pages). */
export interface ShowReleaseRef {
	release: ReleaseRecord;
	coverage: string;
}

export interface CorpusData {
	shows: ShowRecord[];
	releases: ReleaseRecord[];
	releasesBySlug: Map<string, ReleaseRecord>;
	/** Show `id` → releases that list it under `source_shows`. */
	releasesByShowId: Map<number, ShowReleaseRef[]>;
	songs: SongRecord[];
	songsBySlug: Map<string, SongRecord>;
	showsById: Map<number, ShowRecord>;
	showsByKey: Map<string, ShowRecord>;
	years: string[];
	performanceBySlug: Map<string, SongPerformanceIndex>;
	duplicateShowById: Map<number, EntityDuplicateNotice>;
	duplicateSongBySlug: Map<string, EntityDuplicateNotice>;
}
