# TASKS.md — Current phase only: Phase 3 (Rename glyph.sh → Blogly)

> Per `ROADMAP.md` Phase 3. Each item is scoped to be one reviewable unit of work.

- [x] Update `package.json` package name to "blogly" and description to reference Blogly.
- [x] Update `src/site.config.ts` and `profile.json` default site name, title, and metadata strings from "glyph.sh"/"Glyph" to "Blogly".
- [x] Update header wordmark in `src/components/Header.astro` and any other component branding to `blogly_` per `design/DESIGN.md`.
- [x] Update page metadata, default OG image titles, layout templates, and HTML titles across `src/pages/` and `src/layouts/`.
- [x] Update documentation (`README.md`, `MIGRATION.md`, root-level docs) from "glyph.sh"/"Glyph" to "Blogly".
- [x] Update `AGENTS.md` to reflect completed in-code rename to Blogly while documenting the retained GitHub remote `glyph.sh`.
- [x] Update test assertions that check for brand titles or site name strings to expect "Blogly".
- [x] Perform a repository-wide case-insensitive grep sweep for `glyph` and `Glyph` to account for every occurrence.
