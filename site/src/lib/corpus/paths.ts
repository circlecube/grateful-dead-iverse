import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

/** Absolute path to repo `data/` (sibling of `site/`). */
export const CORPUS_DATA_DIR = path.resolve(SITE_ROOT, '..', 'data');

/** Last URL segment under `/shows/{year}/{month}/` (e.g. `30`, `07a`). */
export function showDaySlug(name: string, date: string): string {
	if (name === date) {
		const parts = date.split('-');
		return parts[2] ?? name;
	}
	if (name.startsWith(date)) {
		const day = date.split('-')[2] ?? '';
		return day + name.slice(date.length);
	}
	return name;
}

export type ShowUrlInput = {
	year: string;
	month: string;
	date?: string;
	day?: string;
	name?: string;
	showName?: string;
	href?: string;
};

export function showUrl(show: ShowUrlInput): string {
	if (show.href) {
		return show.href;
	}
	const day =
		show.day ??
		showDaySlug(show.name ?? show.showName ?? '', show.date ?? '');
	return `/shows/${show.year}/${show.month}/${day}/`;
}

export function songUrl(slug: string): string {
	return `/songs/${slug}/`;
}

export function showKey(year: string, month: string, day: string): string {
	return `${year}/${month}/${day}`;
}
