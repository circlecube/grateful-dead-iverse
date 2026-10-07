import path from 'node:path';

const CORPUS_MD = /^data\/(shows|songs)\/.+\.md$/;

export function isCorpusMarkdown(relPath) {
  return CORPUS_MD.test(relPath.replace(/\\/g, '/'));
}

export function repoRootFromScriptsDir(scriptsDir) {
  return path.resolve(scriptsDir, '..');
}

/** @returns {string} ISO-8601 UTC like exports: 2026-05-28T18:44:17+00:00 */
export function utcModifiedGmtNow() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00');
}
