# Grateful Dead-iverse

A **markdown corpus** of Grateful Dead shows and songs, aligned with the catalog at [deadiverse.com](https://deadiverse.com).

## Why this exists

Setlists, song text, and related metadata are easier to review and improve when they live in plain files under version control than when they only exist inside a CMS. This repo is a durable, linkable snapshot: you can diff changes, cite a file in a discussion, and follow links between a show and its songs without special tooling.

Each file is **Markdown** with **YAML front matter** (structured fields) and a **body** for readable text—lyrics, notes, and a human-friendly setlist view with links into `data/songs/`.

## What’s here

| Path | Contents |
| --- | --- |
| `data/shows/YYYY/MM/{name}.md` | One show per file (`1972-04-07`, `1972-04-07a`, … when multiple shows share a date) |
| `data/songs/{slug}.md` | One song per file; `slug` matches the identifier used on deadiverse.com |
| `reports/` | Manifest and optional duplicate-candidate reports bundled with periodic updates |

Audio, images, and other media are not stored here—only text and metadata.

## Contributing

Corrections and improvements are welcome via pull request. See **[CONTRIBUTING.md](CONTRIBUTING.md)** for how files are structured and how to open a PR.

## License

Setlist facts and factual metadata: contributions welcome via PR. **Lyrics** and other prose may be subject to separate copyright—see **[CONTRIBUTING.md](CONTRIBUTING.md)**.
