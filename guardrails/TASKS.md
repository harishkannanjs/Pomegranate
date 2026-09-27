# TASKS.md — Current phase only: Phase 2 (Theme-pack architecture)

> Per `ROADMAP.md` Phase 2. Each item is scoped to be one reviewable unit of work.

- [ ] Define the theme-pack schema (TypeScript types + Zod schema) for `read.*` and `chrome.*` tokens across `dark` and `light` modes, `mode: "tui" | "standard"`, and `font`.
- [ ] Transcribe all 7 theme packs as typed data (`blogly`, `catppuccin`, `gruvbox`, `solarized`, `tokyo-night`, `nord`, `dracula`) matching exact hex values and fonts from `design/DESIGN*.md`.
- [ ] Build CSS custom-property injection and token bindings in `src/styles/global.css` driven by `data-theme="<id>"` and `data-mode="dark|light"` on `<html>`.
- [ ] Add self-hosted font definitions for all theme fonts (JetBrains Mono, Monocraft, IBM Plex Mono, Source Code Pro, Cascadia Code, Fira Code) without external CDNs.
- [ ] Build mode-aware chrome components (Button, Toggle, Checkbox/Radio, Panel/Card with titled-border, TabBar, Input, LoadingIndicator) with separated TUI vs. Standard sub-templates.
- [ ] Sweep the ~15 untouched blog components for hardcoded Catppuccin hex values and replace with `read.*` token references while preserving existing markup and behavior.
- [ ] Add theme-switch regression tests covering all 7 themes in both dark and light modes (14 states) rendering homepage and post pages without error.
- [ ] Visually verify all 14 theme × mode combinations against their design specs with zero visual breakage.
