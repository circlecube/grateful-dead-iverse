import matter from 'gray-matter';

/**
 * @param {unknown} value
 * @returns {number|null} ms since epoch
 */
export function parseModifiedGmt(value) {
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value.getTime();
	}
	if (typeof value !== 'string' || value.trim() === '') {
		return null;
	}
	const normalized = value.includes('T') ? value : `${value}T00:00:00+00:00`;
	const ms = Date.parse(normalized);
	return Number.isNaN(ms) ? null : ms;
}

/**
 * @param {string} repoFileContent
 * @param {string} incomingFileContent
 * @returns {boolean} true when repo version should win over incoming
 */
export function repoWinsOverIncoming(repoFileContent, incomingFileContent) {
	const repo = matter(repoFileContent);
	const incoming = matter(incomingFileContent);
	const repoMs = parseModifiedGmt(repo.data?.modified_gmt);
	const incMs = parseModifiedGmt(incoming.data?.modified_gmt);
	if (repoMs === null || incMs === null) {
		return false;
	}
	return repoMs > incMs;
}

/**
 * Site omitted this path from the export; keep repo copy if edited after the export was built.
 *
 * @param {string} repoFileContent
 * @param {string} exportGeneratedAt ISO from site metadata
 * @returns {boolean}
 */
export function keepRepoFileMissingFromExport(repoFileContent, exportGeneratedAt) {
	const repoMs = parseModifiedGmt(matter(repoFileContent).data?.modified_gmt);
	const exportMs = parseModifiedGmt(exportGeneratedAt);
	if (repoMs === null || exportMs === null) {
		return false;
	}
	return repoMs > exportMs;
}
