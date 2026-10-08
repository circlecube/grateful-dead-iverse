import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
	keepRepoFileMissingFromExport,
	repoWinsOverIncoming,
} from '../scripts/lib/modified-gmt.mjs';
import { applyExportToRepo } from '../scripts/lib/sync-apply.mjs';

const repoMd = (modified) => `---
id: 1
modified_gmt: '${modified}'
---
body
`;

test('repo wins when modified_gmt is newer', () => {
	const older = repoMd('2026-01-01T00:00:00+00:00');
	const newer = repoMd('2026-06-01T00:00:00+00:00');
	assert.equal(repoWinsOverIncoming(newer, older), true);
	assert.equal(repoWinsOverIncoming(older, newer), false);
});

test('keep file missing from export when repo edited after export time', () => {
	const content = repoMd('2026-06-02T00:00:00+00:00');
	assert.equal(
		keepRepoFileMissingFromExport(content, '2026-06-01T12:00:00+00:00'),
		true
	);
	assert.equal(
		keepRepoFileMissingFromExport(content, '2026-06-03T00:00:00+00:00'),
		false
	);
});

test('apply keeps newer repo file and applies incoming otherwise', () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-apply-'));
	const staging = path.join(root, 'staging');
	const repo = path.join(root, 'repo');
	fs.mkdirSync(path.join(repo, 'data', 'songs'), { recursive: true });
	fs.mkdirSync(path.join(staging, 'data', 'songs'), { recursive: true });

	fs.writeFileSync(
		path.join(repo, 'data', 'songs', 'keep.md'),
		repoMd('2099-01-01T00:00:00+00:00')
	);
	fs.writeFileSync(
		path.join(staging, 'data', 'songs', 'keep.md'),
		repoMd('2026-01-01T00:00:00+00:00')
	);
	fs.writeFileSync(
		path.join(staging, 'data', 'songs', 'new.md'),
		repoMd('2026-05-01T00:00:00+00:00')
	);

	const result = applyExportToRepo(
		repo,
		staging,
		'2026-04-01T00:00:00+00:00',
		false
	);

	assert.equal(result.pendingImport.length, 1);
	assert.equal(result.pendingImport[0].path, 'data/songs/keep.md');
	assert.ok(result.added.includes('data/songs/new.md'));
	assert.match(
		fs.readFileSync(path.join(repo, 'data', 'songs', 'keep.md'), 'utf8'),
		/2099-01-01/
	);

	fs.rmSync(root, { recursive: true, force: true });
});
