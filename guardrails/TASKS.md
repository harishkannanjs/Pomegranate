# TASKS.md — Current phase only: Phase 3 (Rename glyph.sh → Blogly)

> Per `ROADMAP.md` Phase 3. Each item is scoped to be one reviewable unit of work.

- [ ] Update `package.json` package name to "blogly" and description to reference Blogly.
- [ ] Update `src/site.config.ts` and `profile.json` default site name, title, and metadata strings from "glyph.sh"/"Glyph" to "Blogly".
- [ ] Update header wordmark in `src/components/Header.astro` and any other component branding to `blogly_` per `design/DESIGN.md`.
- [ ] Update page metadata, default OG image titles, layout templates, and HTML titles across `src/pages/` and `src/layouts/`.
- [ ] Update documentation (`README.md`, `MIGRATION.md`, root-level docs) from "glyph.sh"/"Glyph" to "Blogly".
- [ ] Update `AGENTS.md` to reflect completed in-code rename to Blogly while documenting the retained GitHub remote `glyph.sh`.
- [ ] Update test assertions that check for brand titles or site name strings to expect "Blogly".
- [ ] Perform a repository-wide case-insensitive grep sweep for `glyph` and `Glyph` to account for every occurrence.
