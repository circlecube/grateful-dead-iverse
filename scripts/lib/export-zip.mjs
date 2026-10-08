import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { validateExportZipEntries } from './allowed-export-paths.mjs';

/**
 * @param {string} zipPath
 * @returns {string[]}
 */
export function listZipEntries(zipPath) {
	const out = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' });
	return out
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
}

/**
 * @param {string} zipPath
 * @param {string} destDir
 */
export function extractZipSafely(zipPath, destDir) {
	const entries = listZipEntries(zipPath);
	const check = validateExportZipEntries(entries);
	if (!check.ok) {
		throw new Error(`Invalid export zip (${check.reason}): ${check.entry ?? ''}`);
	}
	fs.mkdirSync(destDir, { recursive: true });
	execFileSync('unzip', ['-q', '-o', zipPath, '-d', destDir], { stdio: 'inherit' });
}
