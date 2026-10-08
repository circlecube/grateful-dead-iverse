# Grateful Dead-iverse

A **markdown corpus** of Grateful Dead shows and songs, aligned with the catalog at [deadiverse.com](https://deadiverse.com). Browse it on the web at **[grateful.deadiverse.com](https://grateful.deadiverse.com)**.

## Why this exists

Setlists, song text, and related metadata are easier to review and improve when they live in plain files under version control than when they only exist inside a CMS. This repo is a durable, linkable snapshot: you can diff changes, cite a file in a discussion, and follow links between a show and its songs without special tooling.

Each file is **Markdown** with **YAML front matter** (structured fields) and a **body** for readable text—lyrics, notes, and a human-friendly setlist view with links into `data/songs/`.

## What’s here

| Path | Contents |
| --- | --- |
| `data/shows/YYYY/MM/{name}.md` | One show per file (`1972-04-07`, `1972-04-07a`, … when multiple shows share a date) |
| `data/songs/{slug}.md` | One song per file; `slug` matches the identifier used on deadiverse.com |
| `reports/` | Manifest and optional duplicate-candidate reports bundled with periodic updates |
| `site/` | Static read-only browser for the corpus ([Astro](https://astro.build)); see below |
| `docs/plans/` | Implementation plans (including the static site) |

Audio, images, and other media are not stored here—only text and metadata.

## Static site (browse the corpus)

The **`site/`** app builds a simplified, deadiverse-styled static viewer: show and song pages, indexes (shows by year, song A–Z), setlists that link to songs, and song pages that list performances with play counts and first-played callouts. It is **not** a copy of deadiverse.com—no jukebox, accounts, or crowd features.

- **Live site:** [grateful.deadiverse.com](https://grateful.deadiverse.com) — Cloudflare Pages, rebuilds on pushes to `main`
- **Local preview:** `cd site && npm install && npm run dev` (or `npm run site:dev` from the repo root; Node ≥ 20). The dev server reads `../data`.

## Contributing

Corrections and improvements are welcome via pull request. See **[CONTRIBUTING.md](CONTRIBUTING.md)** for how files are structured and how to open a PR. **[AGENTS.md](AGENTS.md)** summarizes the corpus for automated assistants.

## License

Setlist facts and factual metadata: contributions welcome via PR. **Lyrics** and other prose may be subject to separate copyright—see **[CONTRIBUTING.md](CONTRIBUTING.md)**.
