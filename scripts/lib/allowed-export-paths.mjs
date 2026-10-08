/**
 * Zip entry paths allowed in a site corpus export (zip-slip safe).
 */

/**
 * @param {string} entry
 * @returns {string|null} Normalized posix path or null if invalid.
 */
export function normalizeZipEntry(entry) {
	if (typeof entry !== 'string' || entry === '') {
		return null;
	}
	let p = entry.replace(/\\/g, '/').replace(/^\/+/, '');
	if (p.includes('\0') || p.includes('..')) {
		return null;
	}
	const parts = p.split('/');
	if (parts.some((seg) => seg === '..')) {
		return null;
	}
	return p;
}

/**
 * @param {string} entry
 * @returns {boolean}
 */
export function isAllowedExportEntry(entry) {
	const p = normalizeZipEntry(entry);
	if (p === null || p.endsWith('/')) {
		return false;
	}
	if (p === 'README-export.md') {
		return true;
	}
	if (/^reports\/[^/]+\.json$/.test(p)) {
		return true;
	}
	if (/^data\/songs\/[^/]+\.md$/.test(p)) {
		return true;
	}
	if (/^data\/shows\/\d{4}\/\d{2}\/[^/]+\.md$/.test(p)) {
		return true;
	}
	return false;
}

/**
 * @param {string[]} entryNames
 * @returns {{ ok: true } | { ok: false, reason: string, entry?: string }}
 */
export function validateExportZipEntries(entryNames) {
	for (const raw of entryNames) {
		const p = normalizeZipEntry(raw);
		if (p === null) {
			return { ok: false, reason: 'invalid_path', entry: raw };
		}
		if (!isAllowedExportEntry(p)) {
			return { ok: false, reason: 'disallowed_path', entry: p };
		}
	}
	return { ok: true };
}
