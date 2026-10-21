#!/usr/bin/env node
/**
 * ZIP corpus markdown files that differ from a base git ref (for bulk import).
 *
 * Usage:
 *   npm run zip-changed
 *   npm run zip-changed -- develop
 *   npm run zip-changed -- --base origin/main --output dist/my-changes.zip
 *   npm run zip-changed -- --include-uncommitted
 *   ZIP_CHANGED_BASE=main npm run zip-changed
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { ZipArchive } from 'archiver';
import { isCorpusMarkdown, repoRootFromScriptsDir } from './lib/corpus-paths.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = repoRootFromScriptsDir(__dirname);

function parseArgs(argv) {
  const opts = {
    base: process.env.ZIP_CHANGED_BASE || 'origin/main',
    output: '',
    includeUncommitted: false,
  };

  let i = 0;
  if (argv[0] && !argv[0].startsWith('-')) {
    opts.base = argv[0];
    i = 1;
  }

  for (; i < argv.length; i++) {
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
  <ref>                  Base ref (positional); same as --base
  --base <ref>           Git ref to compare against (default: origin/main, or ZIP_CHANGED_BASE)
  --output <path>        Output ZIP path (default: dist/corpus-changes-YYYY-MM-DD.zip)
  --include-uncommitted  Also include unstaged/staged changes vs HEAD

ZIP layout matches export: data/shows/..., data/songs/... and data/releases/... at archive root.

Examples:
  npm run zip-changed -- main
  npm run zip-changed -- --base origin/develop
  ZIP_CHANGED_BASE=feature/foo npm run zip-changed
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
      `diff --name-only --diff-filter=ACM ${base}...HEAD -- data/shows data/songs data/releases`
    );
    for (const line of committed.split('\n')) {
      if (line) sets.add(line.replace(/\\/g, '/'));
    }
  } catch {
    // No commits yet or invalid range; try two-dot diff.
    try {
      const committed = git(
        `diff --name-only --diff-filter=ACM ${base} -- data/shows data/songs data/releases`
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
      const dirty = git('diff --name-only --diff-filter=ACM HEAD -- data/shows data/songs data/releases');
      for (const line of dirty.split('\n')) {
        if (line) sets.add(line.replace(/\\/g, '/'));
      }
      const staged = git('diff --cached --name-only --diff-filter=ACM -- data/shows data/songs data/releases');
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
    const archive = new ZipArchive({ zlib: { level: 9 } });

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
