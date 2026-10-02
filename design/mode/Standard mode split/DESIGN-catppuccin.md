# DESIGN-catppuccin.md — Catppuccin theme

> Uses the **Standard mode** UI language from `DESIGN.md` §1B — NOT the
> TUI language from §1, which is reserved for the Pomegranate signature theme
> only. This means ordinary rounded sliding toggles (not bracketed `[ Y ]`/
> `[ N ]`), rounded cards and buttons, a normal tab bar, and no box-drawing
> panel borders, status bar, or blinking-cursor treatment anywhere in the
> product while this theme is active. This file defines only the
> Catppuccin palette and font applied to that same Standard-mode shell.

**Mood**: soft, cozy, pastel — the most "warm and inviting" of the
available themes, without sacrificing the terminal structure underneath.
Selecting it should make the same dashboard feel gentler, not different in
kind.

**Font**: JetBrains Mono (Catppuccin's own ecosystem is built around
clean, humanist monospace fonts — Monocraft's blocky pixel style would
clash with its soft palette).

### Dark — "Mocha"

| Token | Hex | Use |
|---|---|---|
| `read.bg-base` | `#1e1e2e` | Page/app background |
| `read.bg-surface` | `#181825` | Panels, cards, code blocks |
| `read.bg-surface-raised` | `#313244` | Hover, active panel |
| `read.border` | `#45475a` | Panel borders, dividers |
| `read.border-strong` | `#585b70` | Emphasized borders |
| `read.text-primary` | `#cdd6f4` | Body text, headings |
| `read.text-secondary` | `#a6adc8` | Metadata, captions |
| `read.text-tertiary` | `#6c7086` | Disabled/placeholder |
| `read.accent` | `#89b4fa` | Links, active states |
| `chrome.danger` | `#f38ba8` | Destructive actions |
| `chrome.success` | `#a6e3a1` | Confirmations |

### Light — "Latte"

| Token | Hex | Use |
|---|---|---|
| `read.bg-base` | `#eff1f5` | Page/app background |
| `read.bg-surface` | `#ffffff` | Panels, cards |
| `read.bg-surface-raised` | `#e6e9ef` | Hover state |
| `read.border` | `#ccd0da` | Panel borders |
| `read.border-strong` | `#bcc0cc` | Emphasized borders |
| `read.text-primary` | `#4c4f69` | Body text, headings |
| `read.text-secondary` | `#6c6f85` | Metadata, captions |
| `read.text-tertiary` | `#8c8fa1` | Disabled/placeholder |
| `read.accent` | `#1e66f5` | Links, active states |
| `chrome.danger` | `#d20f39` | Destructive actions |
| `chrome.success` | `#40a02b` | Confirmations |

**Toggle and active-tab fill**: rendered in `read.accent` on both modes —
the soft periwinkle blue (Mocha) / saturated blue (Latte) should read as
calm rather than alarming, consistent with the palette's overall
character.
