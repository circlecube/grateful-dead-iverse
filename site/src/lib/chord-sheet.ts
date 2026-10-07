import {
	ChordProParser,
	ChordsOverWordsParser,
	HtmlDivFormatter,
	UltimateGuitarParser,
} from 'chordsheetjs';

const CHORDPRO_IN_LINE = /\[([A-Ga-g][#b]?[^\]\s]*)\]/;

function looksLikeChordPro(text: string): boolean {
	return CHORDPRO_IN_LINE.test(text) || text.includes('{');
}

function parseChordSheet(text: string) {
	const trimmed = text.trim();
	if (!trimmed) {
		return null;
	}

	const parsers = looksLikeChordPro(trimmed)
		? [ChordProParser, UltimateGuitarParser, ChordsOverWordsParser]
		: [UltimateGuitarParser, ChordsOverWordsParser, ChordProParser];

	for (const Parser of parsers) {
		try {
			return new Parser().parse(trimmed);
		} catch {
			// try next parser
		}
	}
	return null;
}

/** Render chord sheet source (ChordPro or chords-over-words) to HTML for static pages. */
export function renderChordSheetHtml(text: string): string | null {
	const song = parseChordSheet(text);
	if (!song) {
		return null;
	}
	try {
		return new HtmlDivFormatter().format(song);
	} catch {
		return null;
	}
}
