# SPEC.md — Pomegranate (formerly Blogly / glyph.sh)

> Describes the **target** product, per the pivot direction already decided.
> Where current repo behavior differs, that gap is roadmap work, not a spec
> ambiguity — see `ROADMAP.md`.

## Problem and intended users

Publishing platforms force a trade: **Medium/Substack-style platforms**
give zero-setup ease but no code ownership, platform risk (paywall/
algorithm/deplatforming), and weak support for technical content.
**Self-hosted options** (WordPress, plain static-site-generator themes)
give real ownership but demand ongoing technical maintenance (WordPress)
or developer skill just to get started (raw SSGs).

Pomegranate's position: **own your blog like a developer would, without
needing to be one.** Real files in the user's own GitHub repo (can't be
taken down, paywalled, or deprioritized by someone else's algorithm), zero
hosting cost (static output on GitHub Pages), zero ongoing maintenance
(nothing to patch — it's static files), but a setup and editing experience
that feels like using an app, not configuring a static-site generator.

**Intended users**: two groups, explicitly broader than "developers who
already know Markdown/Git":
1. Technical writers (security research, systems/robotics engineering,
   reverse engineering) who want rich technical content support (code
   diffs, Mermaid diagrams, KaTeX math, terminal recordings, spoilers).
2. General bloggers/writers with no assumed technical background, who
   need the entire GitHub/Markdown/deployment layer hidden behind a
   guided, visual, zero-jargon setup flow.

## Required behavior and user experience

### Onboarding
- Landing page "Get Started" → GitHub OAuth → user authorizes → **explicit
  confirmation screen** ("Connected as @username — ready to build your
  blog?") with a **Load Dashboard** button (does not auto-proceed on OAuth
  callback alone).
- On click: backend forks the repo into the user's account, creates a
  GitHub Codespace, and the *same tab* shows staged progress (`Forking
  your repository → Creating your environment → Installing dependencies →
  Starting your blog`) via polling, then navigates itself into the running
  dashboard once ready — no new-tab handoff (async `window.open` calls are
  blocked by browsers as popups; only a same-tab `location.href` redirect
  is reliable here).
- First-run wizard (one screen): choose theme + font (font choices are
  scoped per-theme, not a global list).

### The local dashboard — two tabs, no more
- **File Upload tab**: upload any file type → Tier 1 conversion (plain
  text, Markdown, HTML, DOCX, PDF text, CSV/JSON, and on-device image OCR
  via Tesseract.js — all free, no key, runs locally) or Tier 2 (BYOK:
  audio transcription via Groq's hosted Whisper) → raw/rendered split
  editor for review → **Preview Blog site** CTA → full live preview
  (rendered by the real Astro layout, not a mock renderer) → **Save** CTA
  → pushes to GitHub. This tab is also the permanent, ongoing home for
  adding/editing/deleting posts — not a first-run-only flow.
- **Settings tab**: Theme picker and Font picker (each shown as live
  visual previews, never bare names); a single **Features** list where
  every reader-facing tool is individually toggleable — Listen
  (AudioReader), Eye Comfort (ReaderModeButton), Magnifier, Copy page
  Link, Copy as MD, Highlighter, TOC, reading-progress bar, related posts;
  **Post Management** split into Standalone and Series (Series adds
  reorder); **Deploy** (GitHub Pages one-click via the existing GitHub
  token — no redirect; Vercel/Netlify/Cloudflare Pages via a synchronous
  new-tab redirect to that platform's own pre-filled import flow, with a
  manual "paste your live URL" field to close the loop, since there is no
  webhook-based status sync); **Privacy** (plain-language explainer of
  what's stored where — visitor highlights/reading-position/theme choice
  live only in the visitor's own browser; opt-in, cookie-free analytics
  toggle; a visible privacy note surfaced in the blog's own footer);
  **Advanced** (export site as zip, view/edit raw config, "undo my last
  change" as a plain-language git-revert, reset theme/font to Pomegranate
  defaults, custom domain, danger zone: disconnect GitHub / wipe local
  settings).

### Theming
- One theme-pack JSON contract covers both `read` tokens (blog-reading
  colors) and `chrome` tokens (dashboard-only: inputs, focus rings, hover,
  table rows, danger/success states) for both a `dark` and `light` mode —
  every theme, including community ones, must supply all four.
- Default: **Pomegranate theme** — deep burgundy/rose palette (§2 of
  `DESIGN.md`), Consolas system font stack (`Consolas, "Courier New", Courier, monospace`)
  used everywhere, full terminal chrome. Both a dark (default) and light
  variant, contrast-verified (WCAG AA).
- Community themes, v1: Catppuccin, Gruvbox, Solarized, Tokyo Night (all
  have official light+dark pairs) plus Nord and Dracula with
  Pomegranate-designed light companions (neither has an official one).
- **Switching theme in Settings re-skins the entire local dashboard AND
  the published blog together** — one shared token/font system drives
  both surfaces; there is no separate "dashboard theme."

### Highlighter (new feature, not yet built)
- Visitor selects text on a published post → floating control to
  highlight → stored as `{id, text, contextBefore, contextAfter, color,
  createdAt}` in the visitor's own `localStorage`, keyed per post slug.
  Nothing reaches the author or any server.
- Re-anchoring on page load: search rendered post text for
  `contextBefore + text + contextAfter` first, fall back to `text` alone,
  drop silently (not shown broken) if neither matches — survives normal
  post edits, degrades gracefully on heavy rewrites.

### Branding
- Free, open source, no paid tier, no license-gated feature removal.
  Attribution is achieved via multiple independent channels rather than
  one enforceable mechanism: a theme-aware "built with Pomegranate" footer
  badge, a `<meta name="generator">` tag, a small watermark baked into
  auto-generated OG images, and an opt-in "Pomegranate showcase" listing
  offered during onboarding.

## Architecture and major components

See `AGENTS.md` for what exists today. Target-state additions not yet
built: a landing-page OAuth relay (minimal hosted backend — the **only**
piece of Pomegranate-operated infrastructure in the whole product); GitHub
Device Flow integration in the local dashboard for push-to-GitHub (no
hosted backend); a theme-pack loader/schema replacing the current
hardcoded Catppuccin CSS; a file-conversion dispatcher (Tesseract.js,
Mammoth, pdf-parse, Turndown, Papaparse, Groq Whisper) replacing/extending
`BlogUploader.astro`; a `Highlighter.astro` component with `localStorage`
persistence; multi-target deploy buttons in the settings dashboard.

## Security and privacy requirements

- The local dashboard must never depend on any Pomegranate-operated backend —
  the only server Pomegranate runs is the landing-page OAuth relay, and it is
  stateless (exchanges an OAuth code for a token, does not store user
  data).
- The OAuth relay never receives or stores the user's GitHub token beyond
  the immediate fork+Codespace-creation calls it makes on the user's
  behalf during that one request.
- GitHub Device Flow token exchange for push-to-GitHub happens entirely
  from the local Bun process — never from browser JavaScript (avoids
  CORS/token-exposure issues) and never through a hosted intermediary.
- Visitor-side data (highlights, reading position, theme preference) is
  `localStorage`-only, per-visitor, never transmitted anywhere.
- Tier 1 file conversion runs entirely on the user's own machine; Tier 2
  (audio, optionally advanced OCR) is opt-in, BYOK, with explicit consent
  shown before any file leaves the device.
- The local dashboard (onboarding, File Upload tab, Settings tab) must be
  structurally absent from the production build output — not hidden, not
  unlinked, genuinely absent — and cannot produce any route, page, or client
  bundle in the built site.
- No sensitive identification numbers, financial account numbers, or
  similar are ever requested or stored by the product itself.

## Supported tool and dependency versions

Pinned from the actual lockfile (`bun.lock`), not assumed:
`astro@5.18.2`, `@astrojs/mdx@4.3.14`, `tailwindcss@4.3.3`,
`typescript@5.9.3`, `zod@3.25.76`, `pagefind@1.5.2`, `katex@0.16.47`.
Package manager: **bun** (CI uses `oven-sh/setup-bun`; `bun.lock` is the
source of truth — do not introduce `package-lock.json` or `yarn.lock`).

## Non-goals

- No built-in social feed, algorithmic discovery, or audience/follower
  system (unlike Medium/Substack) — explicitly out of scope; the showcase
  page is opt-in cross-promotion, not a platform feed.
- No built-in monetization/paywall features.
- No hosted/managed version of Pomegranate itself (the product is "fork it and
  run it," not a SaaS) — the OAuth relay is infrastructure to smooth
  onboarding, not a hosted product tier.
- No automatic deploy-status sync for Vercel/Netlify/Cloudflare Pages in
  v1 (would require either a webhook backend or per-platform OAuth,
  neither of which is in scope yet) — handled via manual URL entry
  instead.
- No SSR/hybrid Astro output — the product is static-only by design.
- [NEEDS INPUT: is a "series" allowed to mix standalone posts, or must
  every post in a series folder belong to that series exclusively? Not
  settled in prior discussion.]

## Acceptance criteria

Each criterion names an observable check — "make it work" is not
acceptable on its own:

- A user can go from the landing page to a running local dashboard with
  exactly two intentional clicks (Get Started, Authorize) plus one
  confirmation click (Load Dashboard) — verified by walking the flow
  end-to-end in a real browser, no manual terminal steps required.
- Switching theme in Settings changes both the dashboard chrome and a
  freshly-rendered blog post's appearance without a page requiring a full
  app restart — verified visually in both surfaces after one toggle.
- Uploading a `.docx`, a `.pdf`, and a `.png` (Tier 1, no key configured)
  each produce a non-empty, reviewable Markdown draft in the split editor
  — verified with one sample file per type.
- Disabling a Feature toggle (e.g. Magnifier) in Settings removes that
  tool from a live-previewed post without a full save/redeploy cycle —
  verified by toggling and re-checking the preview.
- A highlight made on a post survives a page reload and disappears after
  the relevant `localStorage` key is cleared — verified manually in
  devtools.
- The GitHub Pages deploy button requires no external sign-up and results
  in a live, reachable URL — verified by checking the deployed URL
  returns 200 after the workflow completes.
- The local dashboard (onboarding, File Upload tab, Settings tab) must be
  structurally absent from the production build output — not hidden, not
  unlinked, genuinely absent — verified by inspecting `bun run build`'s
  output directory.
- `bun run astro check` and `bun run build` both succeed with zero errors
  on a clean checkout — verified by actually running them, not assumed.
