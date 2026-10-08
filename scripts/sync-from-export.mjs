#!/usr/bin/env node
/**
 * Sync the corpus repo from a published site export (latest.json + zip).
 *
 * Usage:
 *   node scripts/sync-from-export.mjs --latest-url https://example.com/.../export-example.com-latest.json
 *   node scripts/sync-from-export.mjs --latest-url "$EXPORT_LATEST_URL" [--force] [--dry-run]
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyExportToRepo, readRepoContentHash } from './lib/sync-apply.mjs';
import { extractZipSafely } from './lib/export-zip.mjs';
import { repoRootFromScriptsDir } from './lib/corpus-paths.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRepoRoot = repoRootFromScriptsDir(__dirname);

const DEFAULT_MAX_ZIP_BYTES = 600 * 1024 * 1024;

function parseArgs(argv) {
	const opts = {
		latestUrl: process.env.EXPORT_LATEST_URL ?? '',
		repoRoot: defaultRepoRoot,
		force: false,
		dryRun: false,
		maxZipBytes: Number(process.env.MAX_EXPORT_ZIP_BYTES ?? DEFAULT_MAX_ZIP_BYTES),
	};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--latest-url' && argv[i + 1]) {
			opts.latestUrl = argv[++i];
		} else if (a === '--repo-root' && argv[i + 1]) {
			opts.repoRoot = path.resolve(argv[++i]);
		} else if (a === '--force') {
			opts.force = true;
		} else if (a === '--dry-run') {
			opts.dryRun = true;
		} else if (a === '--help' || a === '-h') {
			printHelp();
			process.exit(0);
		}
	}
	if (process.env.FORCE === 'true' || process.env.FORCE === '1') {
		opts.force = true;
	}
	return opts;
}

function printHelp() {
	console.log(`sync-from-export.mjs — apply a site corpus export to this repo

Options:
  --latest-url <url>   export-*-latest.json URL (or EXPORT_LATEST_URL)
  --repo-root <path>   corpus repo root (default: parent of scripts/)
  --force              sync even when content_hash matches
  --dry-run            compute diff only; do not write files
`);
}

/**
 * @param {import('node:http').IncomingMessage} res
 * @param {number} maxBytes
 */
async function readBodyWithLimit(res, maxBytes) {
	const chunks = [];
	let total = 0;
	for await (const chunk of res) {
		total += chunk.length;
		if (total > maxBytes) {
			throw new Error(`Download exceeded ${maxBytes} bytes`);
		}
		chunks.push(chunk);
	}
	return Buffer.concat(chunks);
}

async function fetchBuffer(url, maxBytes) {
	const res = await fetch(url, { redirect: 'follow' });
	if (!res.ok) {
		throw new Error(`HTTP ${res.status} for ${url}`);
	}
	return readBodyWithLimit(res.body, maxBytes);
}

function sha256Hex(buffer) {
	return crypto.createHash('sha256').update(buffer).digest('hex');
}

function writeGithubOutput(key, value) {
	const file = process.env.GITHUB_OUTPUT;
	if (file) {
		fs.appendFileSync(file, `${key}=${value}\n`);
	}
}

function appendStepSummary(markdown) {
	const file = process.env.GITHUB_STEP_SUMMARY;
	if (file) {
		fs.appendFileSync(file, `${markdown}\n`);
	}
}

async function main() {
	const opts = parseArgs(process.argv.slice(2));
	if (!opts.latestUrl) {
		console.error('Missing --latest-url or EXPORT_LATEST_URL');
		process.exit(1);
	}

	const metaBuf = await fetchBuffer(opts.latestUrl, 2 * 1024 * 1024);
	const meta = JSON.parse(metaBuf.toString('utf8'));
	const contentHash = meta.content_hash;
	const zipUrl = meta.zip_url;
	const zipSha = String(meta.zip_sha256 ?? '').toLowerCase();
	const zipBytes = Number(meta.zip_bytes ?? 0);
	const generatedAt = String(meta.generated_at ?? '');

	if (!zipUrl || !contentHash) {
		throw new Error('latest.json missing zip_url or content_hash');
	}

	const repoHash = readRepoContentHash(opts.repoRoot);
	if (!opts.force && repoHash && repoHash === contentHash) {
		console.log('Export unchanged (content_hash matches repo manifest).');
		writeGithubOutput('sync_status', 'unchanged');
		appendStepSummary('### Site sync\n\nNo changes (`content_hash` matches).');
		return;
	}

	const zipBuf = await fetchBuffer(zipUrl, opts.maxZipBytes);
	if (zipSha && sha256Hex(zipBuf) !== zipSha) {
		throw new Error('ZIP sha256 does not match metadata');
	}
	if (zipBytes > 0 && zipBuf.length !== zipBytes) {
		throw new Error(`ZIP size ${zipBuf.length} does not match metadata zip_bytes ${zipBytes}`);
	}

	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-sync-'));
	const zipPath = path.join(tmp, 'export.zip');
	const staging = path.join(tmp, 'staging');
	fs.writeFileSync(zipPath, zipBuf);
	extractZipSafely(zipPath, staging);

	const result = applyExportToRepo(
		opts.repoRoot,
		staging,
		generatedAt,
		opts.dryRun
	);

	fs.rmSync(tmp, { recursive: true, force: true });

	const summary = {
		status: result.onlyReportsChanged ? 'only_reports' : 'applied',
		content_hash: contentHash,
		generated_at: generatedAt,
		added: result.added.length,
		modified: result.modified.length,
		deleted: result.deleted.length,
		pending_import: result.pendingImport.length,
		dry_run: opts.dryRun,
	};

	console.log(JSON.stringify(summary, null, 2));

	const dataChanged =
		result.added.length > 0 ||
		result.modified.length > 0 ||
		result.deleted.length > 0;

	writeGithubOutput('sync_status', summary.status);
	writeGithubOutput('data_changed', dataChanged ? 'true' : 'false');
	writeGithubOutput('content_hash', contentHash);

	const pendingList =
		result.pendingImport.length > 0
			? result.pendingImport
					.slice(0, 50)
					.map((p) => `- \`${p.path}\` (${p.reason})`)
					.join('\n')
			: '_None_';

	appendStepSummary(
		`### Site sync

| | |
| --- | --- |
| **content_hash** | \`${contentHash}\` |
| **generated_at** | ${generatedAt} |
| **Added** | ${result.added.length} |
| **Modified** | ${result.modified.length} |
| **Deleted** | ${result.deleted.length} |
| **Pending import (kept repo)** | ${result.pendingImport.length} |

#### Pending import (first 50)

${pendingList}
`
	);

	if (result.onlyReportsChanged) {
		console.log('Only reports/ changed; skip opening a PR.');
		process.exit(0);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
