# DESIGN-gruvbox.md — Gruvbox theme

> Uses the **Standard mode** UI language from `DESIGN.md` §1B — NOT the
> TUI language from §1, which is reserved for the Pomegranate signature theme
> only. This means ordinary rounded sliding toggles (not bracketed `[ Y ]`/
> `[ N ]`), rounded cards and buttons, a normal tab bar, and no box-drawing
> panel borders, status bar, or blinking-cursor treatment anywhere in the
> product while this theme is active.
> This file defines only the Gruvbox palette and font.

**Mood**: warm, earthy, retro — low-saturation ochres and rust tones
against a warm (not blue-tinted) near-black or cream background. Should
feel like a well-worn terminal setup, not a "modern SaaS dark mode."

**Font**: IBM Plex Mono — a warmer, more humanist monospace than
JetBrains Mono, matching Gruvbox's retro character.

### Dark

| Token | Hex | Use |
|---|---|---|
| `read.bg-base` | `#282828` | Page/app background |
| `read.bg-surface` | `#1d2021` | Panels, cards, code blocks |
| `read.bg-surface-raised` | `#3c3836` | Hover, active panel |
| `read.border` | `#504945` | Panel borders, dividers |
| `read.border-strong` | `#665c54` | Emphasized borders |
| `read.text-primary` | `#ebdbb2` | Body text, headings |
| `read.text-secondary` | `#bdae93` | Metadata, captions |
| `read.text-tertiary` | `#928374` | Disabled/placeholder |
| `read.accent` | `#d79921` | Links, active states (warm ochre, not blue — deliberate, matches Gruvbox's signature look) |
| `chrome.danger` | `#cc241d` | Destructive actions |
| `chrome.success` | `#98971a` | Confirmations |

### Light

| Token | Hex | Use |
|---|---|---|
| `read.bg-base` | `#fbf1c7` | Page/app background |
| `read.bg-surface` | `#f9f5d7` | Panels, cards |
| `read.bg-surface-raised` | `#ebdbb2` | Hover state |
| `read.border` | `#d5c4a1` | Panel borders |
| `read.border-strong` | `#bdae93` | Emphasized borders |
| `read.text-primary` | `#3c3836` | Body text, headings |
| `read.text-secondary` | `#665c54` | Metadata, captions |
| `read.text-tertiary` | `#7c6f64` | Disabled/placeholder |
| `read.accent` | `#af3a03` | Links, active states (burnt orange, darkened for contrast on cream) |
| `chrome.danger` | `#9d0006` | Destructive actions |
| `chrome.success` | `#79740e` | Confirmations |

**Note**: Gruvbox's background is warm-toned (slightly brown/olive-black),
not neutral — do not let any implementation default the background to a
neutral or blue-black gray, which would read as "wrong" to anyone who
already uses Gruvbox elsewhere.
