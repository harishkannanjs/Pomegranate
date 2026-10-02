# TASKS.md — Current phase only: Phase 3 Addendum (Rebrand Blogly → Pomegranate)

> Per `ROADMAP.md` Phase 3 Addendum and master prompt instructions. Each item is scoped to be one reviewable unit of work.

- [x] Task 1: Create feature branch `feat/rebrand-pomegranate`.
- [x] Task 2: Implement Pomegranate palette tokens in `src/lib/themes/packs.ts` and `src/styles/theme-tokens.css` per `design/DESIGN.md` §2.3 (dark) and §2.4 (light).
- [x] Task 3: Add `read.accent-fill` to `ReadTokens` type, Zod schema (`src/lib/themes/schema.ts`), and all 7 theme packs in `src/lib/themes/packs.ts` (defaulting to `accent` for the 6 community themes).
- [x] Task 4: Configure signature font stack as system monospace `Consolas, "Courier New", Courier, monospace` with zero font binary downloads.
- [x] Task 5: Rename product from Blogly to Pomegranate across configuration files (`package.json`, `wrangler.toml`, `profile.json`, `src/site.config.ts`, `.gitignore`, `astro.config.mjs`).
- [x] Task 6: Rename UI wordmarks to `pomegranate_` and update all localStorage keys from `blogly_*` to `pomegranate_*` in components and layouts.
- [x] Task 7: Update Highlighter storage prefix to `pomegranate:highlights:` and mark class to `pomegranate-highlight` (`src/lib/highlighter/`, `src/components/Highlighter.astro`, `tests/highlighter.test.ts`).
- [x] Task 8: Update all test assertions across `tests/themes.test.ts`, `tests/dashboard.test.ts`, `tests/conversion.test.ts`, `tests/device-flow-deploy.test.ts`, `tests/highlighter.test.ts`, and `tests/home.test.ts`.
- [x] Task 9: Update all documentation: `AGENTS.md`, `guardrails/SPEC.md`, `guardrails/ROADMAP.md`, `guardrails/TASKS.md`, the six community design specs in `design/mode/Standard mode split/`, and `README.md`.
- [x] Task 10: Run repository grep to verify zero occurrences of `blogly`/`Blogly` outside explicit historical records.
- [x] Task 11: Run full verification suite (`bun run astro check`, `bun run lint`, `bun run test`, `bun run format`, `bun run build`).
