import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { isCorpusMarkdown } from './corpus-paths.mjs';
import {
	keepRepoFileMissingFromExport,
	repoWinsOverIncoming,
} from './modified-gmt.mjs';

/**
 * @typedef {{ path: string, reason: string }} PendingImport
 * @typedef {{ added: string[], modified: string[], deleted: string[], pendingImport: PendingImport[], onlyReportsChanged: boolean }} ApplyResult
 */

function listRepoCorpusFiles(repoRoot) {
	const out = [];
	const dataRoot = path.join(repoRoot, 'data');
	if (!fs.existsSync(dataRoot)) {
		return out;
	}
	function walk(dir) {
		for (const name of fs.readdirSync(dir)) {
			const abs = path.join(dir, name);
			const st = fs.statSync(abs);
			if (st.isDirectory()) {
				walk(abs);
			} else if (st.isFile()) {
				const rel = path.relative(repoRoot, abs).replace(/\\/g, '/');
				if (isCorpusMarkdown(rel)) {
					out.push(rel);
				}
			}
		}
	}
	walk(dataRoot);
	return out.sort();
}

/**
 * @param {string} repoRoot
 * @param {string} stagingRoot extracted export tree
 * @param {string} exportGeneratedAt from site latest.json
 * @param {boolean} dryRun
 * @returns {ApplyResult}
 */
export function applyExportToRepo(repoRoot, stagingRoot, exportGeneratedAt, dryRun = false) {
	const incoming = new Map();
	const stagingData = path.join(stagingRoot, 'data');
	if (fs.existsSync(stagingData)) {
		for (const rel of listRepoCorpusFiles(stagingRoot)) {
			const abs = path.join(stagingRoot, rel);
			incoming.set(rel, fs.readFileSync(abs, 'utf8'));
		}
	}

	const result = {
		added: [],
		modified: [],
		deleted: [],
		pendingImport: [],
		onlyReportsChanged: false,
	};

	const repoFiles = listRepoCorpusFiles(repoRoot);
	const repoSet = new Set(repoFiles);

	for (const rel of repoFiles) {
		const repoAbs = path.join(repoRoot, rel);
		const repoContent = fs.readFileSync(repoAbs, 'utf8');
		if (incoming.has(rel)) {
			const incContent = incoming.get(rel);
			if (repoWinsOverIncoming(repoContent, incContent)) {
				result.pendingImport.push({
					path: rel,
					reason: 'repo_modified_gmt_newer_than_incoming',
				});
				incoming.delete(rel);
				continue;
			}
			if (repoContent !== incContent) {
				result.modified.push(rel);
				if (!dryRun) {
					fs.mkdirSync(path.dirname(repoAbs), { recursive: true });
					fs.writeFileSync(repoAbs, incContent);
				}
			}
			incoming.delete(rel);
			continue;
		}

		if (keepRepoFileMissingFromExport(repoContent, exportGeneratedAt)) {
			result.pendingImport.push({
				path: rel,
				reason: 'missing_from_export_repo_edited_after_export',
			});
			continue;
		}
		result.deleted.push(rel);
		if (!dryRun) {
			fs.unlinkSync(repoAbs);
		}
	}

	for (const [rel, content] of incoming) {
		result.added.push(rel);
		if (!dryRun) {
			const abs = path.join(repoRoot, rel);
			fs.mkdirSync(path.dirname(abs), { recursive: true });
			fs.writeFileSync(abs, content);
		}
	}

	const reportsSrc = path.join(stagingRoot, 'reports');
	const reportsDest = path.join(repoRoot, 'reports');
	let reportsTouched = false;
	if (fs.existsSync(reportsSrc)) {
		fs.mkdirSync(reportsDest, { recursive: true });
		for (const name of fs.readdirSync(reportsSrc)) {
			if (!name.endsWith('.json')) {
				continue;
			}
			const src = path.join(reportsSrc, name);
			const dest = path.join(reportsDest, name);
			const next = fs.readFileSync(src, 'utf8');
			const prev = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : '';
			if (next !== prev) {
				reportsTouched = true;
			}
			if (!dryRun) {
				fs.writeFileSync(dest, next);
			}
		}
	}

	const readmeSrc = path.join(stagingRoot, 'README-export.md');
	if (fs.existsSync(readmeSrc)) {
		const dest = path.join(repoRoot, 'README-export.md');
		const next = fs.readFileSync(readmeSrc, 'utf8');
		const prev = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : '';
		if (next !== prev) {
			reportsTouched = true;
		}
		if (!dryRun) {
			fs.writeFileSync(dest, next);
		}
	}

	const dataChanged =
		result.added.length > 0 ||
		result.modified.length > 0 ||
		result.deleted.length > 0;
	result.onlyReportsChanged = reportsTouched && !dataChanged;

	return result;
}

/**
 * @param {string} repoRoot
 * @returns {string|undefined}
 */
export function readRepoContentHash(repoRoot) {
	const manifestPath = path.join(repoRoot, 'reports', 'export-manifest.json');
	if (!fs.existsSync(manifestPath)) {
		return undefined;
	}
	try {
		const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
		return typeof data.content_hash === 'string' ? data.content_hash : undefined;
	} catch {
		return undefined;
	}
}
