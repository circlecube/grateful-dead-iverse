#!/usr/bin/env node
/**
 * ZIP corpus markdown files that differ from a base git ref (for bulk import).
 *
 * Usage:
 *   npm run zip-changed
 *   npm run zip-changed -- --base origin/main --output dist/my-changes.zip
 *   npm run zip-changed -- --include-uncommitted
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import archiver from 'archiver';
import { isCorpusMarkdown, repoRootFromScriptsDir } from './lib/corpus-paths.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = repoRootFromScriptsDir(__dirname);

function parseArgs(argv) {
  const opts = {
    base: 'origin/main',
    output: '',
    includeUncommitted: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--base' && argv[i + 1]) {
      opts.base = argv[++i];
    } else if (a === '--output' && argv[i + 1]) {
      opts.output = argv[++i];
    } else if (a === '--include-uncommitted') {
      opts.includeUncommitted = true;
    } else if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    }
  }
  if (!opts.output) {
    const stamp = new Date().toISOString().slice(0, 10);
    opts.output = path.join('dist', `corpus-changes-${stamp}.zip`);
  }
  return opts;
}

function printHelp() {
  console.log(`zip-changed.mjs — bundle changed show/song markdown for import

Options:
  --base <ref>           Git ref to compare against (default: origin/main)
  --output <path>        Output ZIP path (default: dist/corpus-changes-YYYY-MM-DD.zip)
  --include-uncommitted  Also include unstaged/staged changes vs HEAD

ZIP layout matches export: data/shows/... and data/songs/... at archive root.
`);
}

function git(args) {
  return execSync(`git ${args}`, { encoding: 'utf8', cwd: repoRoot }).trim();
}

function resolveBase(ref) {
  try {
    git(`rev-parse --verify ${ref}`);
    return ref;
  } catch {
    const fallback = ref.replace(/^origin\//, '');
    try {
      git(`rev-parse --verify ${fallback}`);
      console.warn(`note: using local branch "${fallback}" (${ref} not found)`);
      return fallback;
    } catch {
      console.error(`Could not resolve git ref: ${ref}`);
      process.exit(1);
    }
  }
}

function listChangedFiles(base, includeUncommitted) {
  const sets = new Set();

  try {
    const committed = git(
      `diff --name-only --diff-filter=ACM ${base}...HEAD -- data/shows data/songs`
    );
    for (const line of committed.split('\n')) {
      if (line) sets.add(line.replace(/\\/g, '/'));
    }
  } catch {
    // No commits yet or invalid range; try two-dot diff.
    try {
      const committed = git(
        `diff --name-only --diff-filter=ACM ${base} -- data/shows data/songs`
      );
      for (const line of committed.split('\n')) {
        if (line) sets.add(line.replace(/\\/g, '/'));
      }
    } catch {
      /* empty */
    }
  }

  if (includeUncommitted) {
    try {
      const dirty = git('diff --name-only --diff-filter=ACM HEAD -- data/shows data/songs');
      for (const line of dirty.split('\n')) {
        if (line) sets.add(line.replace(/\\/g, '/'));
      }
      const staged = git('diff --cached --name-only --diff-filter=ACM -- data/shows data/songs');
      for (const line of staged.split('\n')) {
        if (line) sets.add(line.replace(/\\/g, '/'));
      }
    } catch {
      /* empty */
    }
  }

  return [...sets].filter(isCorpusMarkdown).sort();
}

async function writeZip(files, outputRel) {
  const outputAbs = path.resolve(repoRoot, outputRel);
  fs.mkdirSync(path.dirname(outputAbs), { recursive: true });

  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(outputAbs);
    const archive = archiver('zip', { zlib: { level: 9 } });

    out.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(out);

    for (const rel of files) {
      const abs = path.join(repoRoot, rel);
      if (!fs.existsSync(abs)) {
        console.warn(`skip (missing): ${rel}`);
        continue;
      }
      archive.file(abs, { name: rel });
    }

    archive.finalize();
  });

  return outputAbs;
}

const opts = parseArgs(process.argv.slice(2));
const base = resolveBase(opts.base);
const files = listChangedFiles(base, opts.includeUncommitted);

if (files.length === 0) {
  console.log(`No changed corpus files under data/shows or data/songs (base: ${base}).`);
  process.exit(0);
}

console.log(`Packaging ${files.length} file(s) vs ${base} → ${opts.output}`);
const zipPath = await writeZip(files, opts.output);
console.log(`Wrote ${zipPath}`);
