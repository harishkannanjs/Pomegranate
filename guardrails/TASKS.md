# TASKS.md — Current phase only: Phase 8 (Highlighter)

> Per `ROADMAP.md` Phase 8 and master prompt instructions. Each item is scoped to be one reviewable unit of work.

- [x] Task 1: Initialize Phase 8 task checklist and create feature branch `feat/phase-8-highlighter`.
- [x] Task 2: Implement Highlighter core data model, schema validation, and defensive localStorage layer (`src/lib/highlighter/storage.ts` & `types.ts`).
- [x] Task 3: Implement re-anchoring algorithm with context matching, single-match fallback, multi-node wrapping, and excluded element filtering (`src/lib/highlighter/anchor.ts`).
- [x] Task 4: Build client-side Markdown exporter for visitor highlights (`src/lib/highlighter/export.ts`).
- [x] Task 5: Create `src/components/Highlighter.astro` with floating selection control, click-to-remove popover, and "Your highlights on this post" drawer/panel.
- [x] Task 6: Style Highlighter components with Phase 2 mode-aware chrome (TUI mode for Blogly theme, Standard mode for community themes) using `color-mix` with `read.accent`.
- [x] Task 7: Wire Highlighter into `src/layouts/BlogPostLayout.astro` and integrate with Astro view transitions (`astro:page-load`, `astro:after-swap`).
- [x] Task 8: Activate Highlighter toggle in `src/components/dashboard/SettingsTab.astro` and `src/site.config.ts` (removing "coming soon" badge and disabled attribute).
- [x] Task 9: Resolve interaction conflicts with `AudioReader`, `TextMagnifier`, Reader Mode (Eye Comfort), and responsive mobile selection.
- [x] Task 10: Write unit test suite (`tests/highlighter.test.ts`) covering:
  - Exact context match
  - Unrelated edit elsewhere in post
  - Text-only single-match fallback
  - Text-only ambiguous multiple matches (dropped silently)
  - Passage removed (dropped silently)
  - Inline element spanning (bold, links, code)
  - Storage error handling (quota exceeded, corrupt JSON, disabled storage)
- [x] Task 11: Update `AGENTS.md` to document the Highlighter component, storage key schema, and slug change limitations.
- [x] Task 12: Run complete project verification suite (`bun run astro check`, `bun run lint`, `bun run format:check`, `bun run test`, `bun run build`).
