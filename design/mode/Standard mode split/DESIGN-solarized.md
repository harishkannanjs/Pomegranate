# DESIGN-solarized.md — Solarized theme

> Uses the **Standard mode** UI language from `DESIGN.md` §1B — NOT the
> TUI language from §1, which is reserved for the Pomegranate signature theme
> only. This means ordinary rounded sliding toggles (not bracketed `[ Y ]`/
> `[ N ]`), rounded cards and buttons, a normal tab bar, and no box-drawing
> panel borders, status bar, or blinking-cursor treatment anywhere in the
> product while this theme is active.
> This file defines only the Solarized palette and font.

**Mood**: calm, low-contrast-by-design, scientifically engineered for
eye comfort over long reading sessions (Solarized's entire premise — its
values were tuned using CIELAB lightness math, not chosen by eye). This
theme should feel the least "punchy" of the set on purpose — do not
increase contrast beyond spec to make it look more "modern."

**Font**: Source Code Pro — a neutral, precise monospace that doesn't
compete with Solarized's own carefully engineered subtlety.

### Dark

| Token | Hex | Use |
|---|---|---|
| `read.bg-base` | `#002b36` | Page/app background (base03) |
| `read.bg-surface` | `#073642` | Panels, cards, code blocks (base02) |
| `read.bg-surface-raised` | `#0a4a5a` | Hover, active panel |
| `read.border` | `#586e75` | Panel borders, dividers (base01) |
| `read.border-strong` | `#657b83` | Emphasized borders (base00) |
| `read.text-primary` | `#93a1a1` | Body text, headings (base1) |
| `read.text-secondary` | `#839496` | Metadata, captions (base0) |
| `read.text-tertiary` | `#586e75` | Disabled/placeholder |
| `read.accent` | `#268bd2` | Links, active states |
| `chrome.danger` | `#dc322f` | Destructive actions |
| `chrome.success` | `#859900` | Confirmations |

### Light

| Token | Hex | Use |
|---|---|---|
| `read.bg-base` | `#fdf6e3` | Page/app background (base3) |
| `read.bg-surface` | `#eee8d5` | Panels, cards (base2) |
| `read.bg-surface-raised` | `#e4ddc4` | Hover state |
| `read.border` | `#93a1a1` | Panel borders (base1) |
| `read.border-strong` | `#839496` | Emphasized borders (base0) |
| `read.text-primary` | `#586e75` | Body text, headings (base01) |
| `read.text-secondary` | `#657b83` | Metadata, captions (base00) |
| `read.text-tertiary` | `#93a1a1` | Disabled/placeholder |
| `read.accent` | `#268bd2` | Links, active states (same accent both modes — Solarized's signature blue works at both ends) |
| `chrome.danger` | `#dc322f` | Destructive actions |
| `chrome.success` | `#859900` | Confirmations |

**Note**: unlike every other theme in this set, Solarized dark and light
share the same accent hue exactly — that's correct, not an oversight; it's
core to the palette's identity.
