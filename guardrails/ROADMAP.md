# ROADMAP.md — Pomegranate (glyph.sh → Blogly → Pomegranate)

> Continuing in the existing codebase (decided). Phases are ordered so
> nothing touches the ~15 already-working, pivot-unrelated components
> (Mermaid, KaTeX, Asciinema, Spoiler, Sidenote, ChangelogPopover,
> SeriesStrip, RelatedPosts, PrevNextNav, TableOfContents,
> ReadingProgressBar, GiscusComments, OG-image generation, RSS, Pagefind,
> the `Blogs/` content loader) until there's a harness that would catch a
> regression in them.

## Phase 1: Harden what exists
- Delivers: a test harness and a CI gate that can actually catch a
  regression — none exists today (no lint/test config, no test-focused CI
  job, only the deploy workflow).
- Depends on: nothing — this must come first per the non-negotiable rule
  that a repo with no test harness gets "build the harness" as phase 1,
  before any feature work.
- Exit criteria: `bun run` lint and test commands exist and run in CI on
  every PR (not just on push to main); a smoke test renders the homepage
  and one blog post without error; CI fails on a deliberately broken build
  to confirm the gate actually blocks bad merges.

## Phase 2: Theme-pack architecture (TUI mode / Standard mode split)
- Delivers: the dual-mode token system from `design/DESIGN.md` §1/§1B,
  replacing the current hardcoded Catppuccin-only CSS — a loadable
  theme-pack format (`read` + `chrome` tokens, dark + light, per theme)
  and the two structural component sets (TUI widgets for Pomegranate, standard
  widgets for every community theme).
- Depends on: Phase 1 (so this refactor is covered by the new harness as
  it lands).
- Exit criteria: switching the active theme in a config value re-skins
  every page and every dashboard screen correctly in both TUI and
  Standard mode, verified against all 7 `design/DESIGN-*.md` files with no
  visual breakage; the ~15 untouched components render unchanged under
  every theme.

## Phase 3: Rename glyph.sh → Blogly
- Delivers: `package.json` name, `site.config.ts` defaults, README, and
  all in-app copy updated from "glyph.sh"/"Glyph" to "Blogly."
- Depends on: nothing technically, but sequenced after Phase 2 so theme
  work isn't done under the old name.
- Exit criteria: no remaining "glyph"/"Glyph" string in user-facing copy
  or config defaults (grep-verifiable); existing GitHub remote/repo
  naming addressed as a separate, explicit decision (not silently
  renamed).

## Phase 3 Addendum: Rebrand Blogly → Pomegranate
- Delivers: product rename from Blogly to Pomegranate across `package.json`,
  `wrangler.toml`, `site.config.ts`, `profile.json`, UI wordmarks (`pomegranate_`),
  all `localStorage` keys (`pomegranate_*`), auth storage (`.pomegranate/`),
  tests, and documentation. Rethemes the signature theme from Blogly (dark-blue/Monocraft)
  to Pomegranate (deep burgundy/rose `#210F13`, `#320B21`, `#490C19`, `#82545D`, `#B59D9F`,
  `#991E34`, and Consolas system monospace font stack per `design/DESIGN.md` §2).
  Adds `read.accent-fill` to the theme schema and all theme packs.
- Depends on: Phase 2, Phase 3.
- Exit criteria: zero occurrences of `blogly`/`Blogly` outside explicit historical
  records; all tests pass; `bun run astro check`, `bun run lint`, `bun run test`, and
  `bun run build` succeed cleanly.

## Phase 4: Dashboard restructure — File Upload & Settings tabs
- Delivers: `BlogUploader.astro` evolved into the full File Upload tab
  (Tier 1/Tier 2 conversion dispatcher, raw/preview split, Preview/Save
  CTAs); `ProfileEditor.astro`/`profile.astro` evolved into the Settings
  tab (theme/font pickers, Features toggle list, Post Management,
  Deploy, Privacy, Advanced) per `SPEC.md`.
- Depends on: Phase 2 (the dashboard must render correctly in both
  theme modes from day one, not be retrofitted after).
- Exit criteria: every acceptance criterion in `SPEC.md` under "Required
  behavior and user experience" is manually verified; every Feature
  toggle actually hides/shows its component on a live-previewed post.

## Phase 5: File-conversion pipeline
- Delivers: the Tier 1 (Turndown, Mammoth, pdf-parse, Papaparse,
  Tesseract.js) and Tier 2 (Groq Whisper, BYOK) dispatcher described in
  `SPEC.md`.
- Depends on: Phase 4 (needs the File Upload tab to exist as a home for
  it).
- Exit criteria: one sample file per supported type (.docx, .pdf, .png,
  .csv, .mp3-with-key) produces a reviewable Markdown draft; Tier 2
  without a key configured fails with a clear, plain-language message
  rather than a silent error.

## Phase 6: OAuth landing page + Codespace automation
- Delivers: the minimal hosted OAuth relay, the "Get Started" →
  authorize → confirmation screen → same-tab staged-progress → running
  Codespace flow from the finalized workflow discussion.
- Depends on: Phase 4/5 being deployable to a Codespace successfully
  (no point automating provisioning of a dashboard that isn't finished).
- Exit criteria: a fresh GitHub account can go from landing page to a
  running dashboard with exactly two clicks + one confirmation, verified
  end-to-end in a real browser.

## Phase 7: Device Flow push-to-GitHub + multi-target deploy
- Delivers: GitHub Device Flow integration in the local dashboard
  (replacing/confirming the existing one-click push), plus the
  GitHub-Pages (API-based, no redirect) and Vercel/Netlify/Cloudflare
  (redirect + manual URL paste) deploy buttons.
- Depends on: Phase 6 (needs a real GitHub identity already connected).
- Exit criteria: pushing a saved change updates the live repo; each of
  the four deploy buttons reaches the correct destination with the repo
  pre-filled.

## Phase 8: Highlighter
- Delivers: the `Highlighter.astro` component and its `localStorage`
  schema/re-anchoring logic from `SPEC.md`.
- Depends on: Phase 2 (must render correctly in both theme modes).
- Exit criteria: a highlight survives a reload, disappears after
  `localStorage` is cleared, and is dropped (not misplaced) after the
  highlighted passage is edited out of the post.
