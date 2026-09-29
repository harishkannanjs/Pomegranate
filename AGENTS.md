# AGENTS.md — Blogly (repo: glyph.sh)

> Repository-specific rules only. Global cross-project rules (scoped diffs,
> confirm before destructive actions, run checks before declaring done,
> never guess dependency versions, independent review) live outside this
> repo and are not repeated here.

## Design specs — read before any UI/theming work

Full visual and interaction specs live in `design/`, not in this file:
`design/DESIGN.md` (the Blogly signature theme, and the two structural UI
languages — TUI mode for Blogly, Standard mode for every community theme
— that everything else inherits from) plus one file per community theme:
`design/DESIGN-catppuccin.md`, `design/DESIGN-gruvbox.md`,
`design/DESIGN-solarized.md`, `design/DESIGN-tokyo-night.md`,
`design/DESIGN-nord.md`, `design/DESIGN-dracula.md`. Any task touching a
component's markup, styling, or a theme/token value must read the
relevant `design/DESIGN*.md` file(s) first — do not infer visual behavior
from this file or from existing CSS alone, since the current CSS
(Catppuccin-only) predates the dual-mode architecture those specs define.

## What this repo actually is right now

The product is **Blogly**, a general-purpose, forkable blog-authoring tool.
The in-code rename from `glyph.sh` to `Blogly` is complete across `package.json`,
`site.config.ts`, `profile.json`, UI wordmarks (`blogly_`), and documentation.
Note that the underlying GitHub repository and git remote intentionally retain the
name `glyph.sh` (`github.com/harishkannanjs/glyph.sh`) to preserve external links,
fork relationships, and stars. Treat any task that touches the onboarding flow,
file conversion, or dashboard settings as **pivot work**, not a bug fix — check
`SPEC.md`/`ROADMAP.md` before assuming current behavior is the target behavior.

## Real architecture

- **Framework**: Astro 5 (`astro@5.18.2`, locked), static output only
  (`output` not set to `server`/`hybrid` anywhere — keep it static).
- **Content**: two content-collection entry points exist —
  `src/content.config.ts` (Astro 5's expected root location) and
  `src/content/config.ts`. The former re-exports/points at the latter as a
  compatibility shim for Astro 5's loader API — don't "clean up" one
  without checking the other still resolves.
- **Content storage**: NOT the default `src/content/blog/` convention.
  Posts live in repo-root `Blogs/standalone/*.md|mdx` and
  `Blogs/series/<series-name>/*.md|mdx`, loaded via a **custom loader** at
  `src/lib/blog-loader.ts` that also auto-infers missing title/description/
  pubDate/tags/word-count from file content and path when frontmatter omits
  them. Any schema change must be made in both the Zod schema
  (`src/content.config.ts`) and the loader's inference logic, or the two
  will silently disagree.
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite` plugin, not the v3
  PostCSS pipeline) + `src/styles/global.css`. Currently hardcodes
  Catppuccin Mocha/Latte as the only theme — the planned theme-pack system
  (see `SPEC.md`) does not exist yet as an abstraction; today it's one
  fixed palette.
- **Font**: `@fontsource/jetbrains-mono`, self-hosted, no Google Fonts/CDN
  call.
- **Components** (`src/components/`): each reader-facing feature is one
  self-contained `.astro` file — `AudioReader`, `ReaderModeButton` (this
  IS "Eye Comfort" — distraction-free layout + warm/blue-light-reduced
  palette, `Alt+R`), `TextMagnifier`, `Highlighter`, `CopyLinkButton`,
  `CopyMarkdownButton`, `CommandPalette`, `Mermaid`, `Asciinema`,
  `Spoiler`, `Sidenote`/`Footnotes`, `ChangelogPopover`, `SeriesStrip`,
  `RelatedPosts`, `PrevNextNav`, `TableOfContents`, `ReadingProgressBar`,
  `GiscusComments`.
- **Highlighter** (`src/components/Highlighter.astro`, `src/lib/highlighter/`):
  Client-side passage highlighting persisted in `localStorage` under
  `blogly:highlights:<postSlug>` with schema `{ id, text, contextBefore, contextAfter, color, createdAt }`.
  Zero network transmission. Re-anchoring algorithm matches
  `contextBefore + text + contextAfter` first, falling back to `text` alone only
  if exactly one match exists in the rendered prose (drops silently on
  ambiguity or removal). Wrapped per text-node segment with `<mark>` to safely
  span inline formatting (bold, links, inline code). Accepted limitation:
  changing a published post's slug orphans its highlights in visitors' browsers.
- **Local dashboard**: `src/pages/profile.astro` +
  `src/components/ProfileEditor.astro` (author identity/social/bio editing)
  and `src/components/BlogUploader.astro` (current content-intake —
  presently a `.md`/`.mdx` drag-drop, NOT the planned universal
  any-file-to-Markdown conversion pipeline with Tier 1/Tier 2 and a
  raw/preview split — that's future work, not current behavior).
- **OG images**: build-time generation via `satori` + `@resvg/resvg-js`,
  wired in `src/lib/og-image.ts` and `src/pages/og/`.
- **Search**: Pagefind (`pagefind@1.5.2`), indexed as a post-build step.
- **Comments**: Giscus (GitHub Discussions), config in `profile.json` →
  `site.config.ts`. No backend of ours involved.
- **Deploy**: GitHub Pages only, via `.github/workflows/deploy.yml`. No
  Vercel/Netlify/Cloudflare deploy paths exist in the repo yet.
- **Onboarding**: none, currently. README documents a manual
  `git clone` → `bun install` → `bun run dev` flow. The planned landing-page
  OAuth-fork-and-launch-Codespace flow (see `SPEC.md`) has no code yet —
  don't assume any OAuth/backend scaffolding already exists.

## Exact commands (pulled from `package.json` and CI, not invented)

| Purpose | Command |
|---|---|
| Install deps | `bun install` |
| Dev server | `bun run dev` (alias: `bun run start`) |
| Type/content-schema check | `bun run astro check` |
| Lint codebase | `bun run lint` |
| Check formatting | `bun run format:check` |
| Format codebase | `bun run format` |
| Run test suite | `bun run test` |
| Production build (site + OG images) | `bun run build:astro` |
| Full build (check → build → search index) | `bun run build` |
| Build Pagefind index only | `bun run pagefind` |
| Preview a production build locally | `bun run preview` |

Verification tooling is configured via Vitest (`bun run test`), ESLint
(`bun run lint`), Prettier (`bun run format` / `bun run format:check`),
and Astro's schema check (`bun run astro check`).

CI verification runs via `.github/workflows/ci.yml` on every pull request
and push: `bun install --frozen-lockfile` → `bun run astro check` →
`bun run lint` → `bun run format:check` → `bun run test`.
The GitHub Pages deployment pipeline (`.github/workflows/deploy.yml`) is
maintained as a distinct concern and triggers on push to deploy artifacts.

## Boundaries — do not touch without explicit instruction

- `Blogs/standalone/` and `Blogs/series/` — these are user content, not
  scaffolding. Don't edit, restructure, or delete existing posts as a side
  effect of an unrelated change.
- `profile.json` — holds the live author identity/config; treat as user
  data, not a fixture to overwrite for convenience.
- `dist/`, `.astro/` — generated output, gitignored; never hand-edit,
  never commit.
- `public/profile-logo.jpg` — verify it's actually tracked in git before
  relying on it (it has been found untracked in a prior audit of this
  repo; check `git ls-files` before assuming any `public/` asset is really
  committed).
- `bun.lock` — only regenerate via `bun install`; never hand-edit.

## Project-specific gotchas

- Astro 5's content-loader API means `src/content.config.ts` (root) and
  `src/content/config.ts` (subfolder) can drift out of sync if only one is
  edited — always check both when touching the content schema.
- The custom `blog-loader.ts` auto-infers metadata the Zod schema marks
  optional. A "missing field" bug report may actually be inference
  behavior, not a schema bug — check the loader before "fixing" the
  schema.
- `getRelativePath()` in `site.config.ts` exists specifically to handle a
  GitHub Pages sub-path deployment (`/reponame/...`) vs. a root domain.
  Any new internal link/asset reference must go through it, or it will
  break under a GitHub Pages sub-path deploy while working fine in local
  dev (which serves from root).
- Mermaid/Asciinema are integrated as components but are not in
  `package.json` as npm dependencies — they're loaded client-side (CDN or
  bundled script), not server-rendered. Don't assume `bun install` alone
  makes them available; verify how each component actually loads its
  runtime before modifying it.

## Review & Verification

Adjusted to what's actually true of this repo — equipped with Vitest,
ESLint, Prettier, and Astro schema checks, connected to GitHub Actions CI:

1. Local check before opening a PR: run `bun run astro check`,
   `bun run lint`, `bun run format:check`, `bun run test`, and
   `bun run build` — all must succeed cleanly.
2. Frontend/UI changes: verify the live rendered result — this is a
   visual, component-heavy site (themes, reader tools, code blocks); a
   successful build does not mean a feature renders or behaves correctly.
   If a Playwright MCP server or similar is available in your environment,
   use it to check the rendered page rather than relying on the build
   passing alone.
3. Unfamiliar or fast-moving library APIs (Astro 5's content-loader API,
   Tailwind v4's Vite-plugin config, MDX 4) change faster than training
   data — check current docs (e.g. via a Context7 MCP server, if
   available) rather than assuming a remembered API shape is still
   current.
4. Open the PR against `origin` (`harishkannanjs/glyph.sh`). If a GitHub
   review app/MCP server is connected in your environment, let it run.
5. Run a second, independent pass from fresh context (a new session, or a
   human) — never the same session that implemented the change.
6. Resolve every review comment explicitly — fix the root cause or record
   why current behavior is intentional. Never blanket-accept or
   blanket-dismiss a batch of comments.
7. Before merge: confirm the build is green, review comments are actually
   resolved (not just acknowledged), and the change has been manually
   verified running — then merge. This is a human action, not automated.

No Sentry DSN or config was found in this repo, so no Sentry-specific step
is included — add one if/when Sentry (or equivalent) is actually wired up.
