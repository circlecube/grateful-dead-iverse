import test from 'node:test';
import assert from 'node:assert/strict';
import {
	isAllowedExportEntry,
	normalizeZipEntry,
	validateExportZipEntries,
} from '../scripts/lib/allowed-export-paths.mjs';

test('allows corpus paths', () => {
	assert.equal(isAllowedExportEntry('data/songs/bertha.md'), true);
	assert.equal(
		isAllowedExportEntry('data/shows/1977/05/1977-05-08.md'),
		true
	);
	assert.equal(isAllowedExportEntry('reports/export-manifest.json'), true);
	assert.equal(isAllowedExportEntry('README-export.md'), true);
});

test('rejects zip-slip and unexpected paths', () => {
	assert.equal(normalizeZipEntry('../etc/passwd'), null);
	assert.equal(isAllowedExportEntry('data/evil.php'), false);
	assert.equal(isAllowedExportEntry('package.json'), false);
	const check = validateExportZipEntries([
		'data/songs/a.md',
		'../../../tmp/x.md',
	]);
	assert.equal(check.ok, false);
});
