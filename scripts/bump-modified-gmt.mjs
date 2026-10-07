#!/usr/bin/env node
/**
 * Set front matter modified_gmt to current UTC for corpus show/song markdown files.
 *
 * Usage:
 *   npm run bump-modified-gmt -- path/to/file.md ...
 *   git diff --cached --name-only -- data/ | xargs npm run bump-modified-gmt --
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { isCorpusMarkdown, repoRootFromScriptsDir, utcModifiedGmtNow } from './lib/corpus-paths.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = repoRootFromScriptsDir(__dirname);

const args = process.argv.slice(2).filter((a) => a !== '--');
if (args.length === 0) {
  console.error('Usage: bump-modified-gmt.mjs <file.md> [file2.md ...]');
  process.exit(1);
}

let updated = 0;
let skipped = 0;

for (const arg of args) {
  const abs = path.isAbsolute(arg) ? arg : path.resolve(repoRoot, arg);
  const rel = path.relative(repoRoot, abs).replace(/\\/g, '/');

  if (!isCorpusMarkdown(rel)) {
    skipped += 1;
    continue;
  }
  if (!fs.existsSync(abs)) {
    console.warn(`skip (missing): ${rel}`);
    skipped += 1;
    continue;
  }

  const raw = fs.readFileSync(abs, 'utf8');
  const parsed = matter(raw);
  const next = utcModifiedGmtNow();
  const prev = parsed.data?.modified_gmt;

  if (prev === next) {
    skipped += 1;
    continue;
  }

  parsed.data.modified_gmt = next;
  const out = matter.stringify(parsed.content, parsed.data, {
    lineWidth: -1,
  });
  fs.writeFileSync(abs, out.endsWith('\n') ? out : `${out}\n`, 'utf8');
  console.log(`${rel}: modified_gmt → ${next}`);
  updated += 1;
}

if (updated === 0 && skipped === args.length) {
  process.exit(0);
}

process.exit(0);
