#!/usr/bin/env node
/**
 * Fail the build if Pagefind did not emit a usable index (see docs/plans/2026-10-08-static-search.md).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pagefindDir = path.join(siteRoot, 'dist', 'pagefind');
const pagefindJs = path.join(pagefindDir, 'pagefind.js');
const entryPath = path.join(pagefindDir, 'pagefind-entry.json');
const dataDir = path.resolve(siteRoot, '..', 'data');

/** Fraction of corpus show + song files that must appear in the index. */
const MIN_COVERAGE = 0.95;

function fail(message) {
	console.error(message);
	console.error(
		'Hint: Pagefind index missing or too small — check data-pagefind-body on song/show templates and astro-pagefind integration.',
	);
	process.exit(1);
}

if (!fs.existsSync(pagefindJs)) {
	fail(`Expected Pagefind bundle at ${pagefindJs}`);
}

if (!fs.existsSync(entryPath)) {
	fail(`Expected Pagefind manifest at ${entryPath}`);
}

/** Count `.md` files under `dir`, recursively. */
function countMarkdown(dir) {
	if (!fs.existsSync(dir)) {
		return 0;
	}
	return fs.readdirSync(dir, { withFileTypes: true, recursive: true }).filter(
		(entry) => entry.isFile() && entry.name.endsWith('.md'),
	).length;
}

const corpusCount =
	countMarkdown(path.join(dataDir, 'shows')) + countMarkdown(path.join(dataDir, 'songs'));
if (corpusCount === 0) {
	fail(`No corpus markdown found under ${dataDir}/shows or ${dataDir}/songs`);
}
const minPages = Math.ceil(corpusCount * MIN_COVERAGE);

/** @type {{ languages?: Record<string, { page_count?: number }> }} */
const entry = JSON.parse(fs.readFileSync(entryPath, 'utf8'));
const pageCount = Object.values(entry.languages ?? {}).reduce(
	(max, lang) => Math.max(max, lang.page_count ?? 0),
	0,
);

if (pageCount < minPages) {
	fail(
		`Pagefind page_count ${pageCount} is below minimum ${minPages} (${MIN_COVERAGE * 100}% of ${corpusCount} show + song files)`,
	);
}

console.log(
	`Pagefind index OK (${pageCount} pages for ${corpusCount} show + song files, bundle at dist/pagefind/)`,
);
