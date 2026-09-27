# TASKS.md — Current phase only: Phase 4 (Dashboard Restructure)

> Per `ROADMAP.md` Phase 4 and prompt instructions. Each item is scoped to be one reviewable unit of work.

- [x] Initialize Phase 4 task checklist and create feature branch `feat/phase-4-dashboard-restructure`.
- [x] Implement backend dev middleware endpoints in `astro.config.mjs`: `/api/get-blog`, `/api/reorder-series`, `/api/git-revert`, and `/api/export-zip`.
- [x] Build the File Upload tab component (`src/components/dashboard/FileUploadTab.astro`):
  - File upload drag-and-drop zone with multi-format conversion stub (`convertToMarkdown(file)`).
  - Side-by-side / responsive raw markdown and live rendered preview split editor.
  - "Preview Blog site" CTA rendering live preview in real Astro layout.
  - "Save" CTA writing to repository and triggering push-to-GitHub mechanism.
- [x] Build the Settings tab component (`src/components/dashboard/SettingsTab.astro`):
  - Appearance section: Theme picker and Font picker with live visual previews wired to theme-pack system.
  - Features list: Individual toggles for AudioReader, ReaderMode (Eye Comfort), TextMagnifier, CopyLink, CopyMarkdown, TOC, ReadingProgressBar, RelatedPosts; Highlighter toggle marked "coming soon".
  - Post Management section: Standalone and Series post lists with view/edit in split editor, delete, and Series reordering.
  - Deploy section: GitHub Pages status and repository link (Vercel/Netlify/Cloudflare omitted per prompt boundary).
  - Privacy section: Storage explainer, opt-in cookie-free analytics toggle, footer privacy note.
  - Advanced section: Export site as zip, view/edit raw config, undo last change (git revert), reset theme/font defaults, custom domain, disconnect GitHub (marked "coming soon").
- [x] Wire Feature Toggles into `src/layouts/BlogPostLayout.astro` and footer privacy note into `src/layouts/BaseLayout.astro`.
- [x] Integrate dual-tab dashboard shell (`[File Upload]` / `[Settings]`) on `src/pages/profile.astro` using mode-aware chrome components (`TabBar`, `Panel`, `Button`, `Toggle`, `Input`) for TUI and Standard modes.
- [x] Add test suite in `tests/dashboard.test.ts` covering feature toggles, dashboard tab structure, and endpoint handlers.
- [x] Run full repository verification suite (`bun run astro check`, `bun run lint`, `bun run format:check`, `bun run test`, `bun run build`) and verify in browser.
