# DESIGN-nord.md — Nord theme

> Uses the **Standard mode** UI language from `DESIGN.md` §1B — NOT the
> TUI language from §1, which is reserved for the Pomegranate signature theme
> only. This means ordinary rounded sliding toggles (not bracketed `[ Y ]`/
> `[ N ]`), rounded cards and buttons, a normal tab bar, and no box-drawing
> panel borders, status bar, or blinking-cursor treatment anywhere in the
> product while this theme is active.
> This file defines only the Nord palette and font. **The light variant
> below is Pomegranate's own design** — Nord has no official light palette;
> this was built by inverting Nord's own tones (Snow Storm as backgrounds,
> Polar Night as text) rather than inventing new colors, so it still reads
> as unmistakably "Nord" to anyone who knows the original.

**Mood**: icy, minimal, restrained — the coolest and most desaturated
theme in the set. Should feel quiet and clinical, almost the opposite of
Tokyo Night's neon energy despite both being "cool" palettes.

**Font**: JetBrains Mono (Nord's own official brand assets and most
community implementations already pair it this way — no reason to
deviate).

### Dark

| Token | Hex | Use |
|---|---|---|
| `read.bg-base` | `#2e3440` | Page/app background (nord0) |
| `read.bg-surface` | `#242933` | Panels, cards, code blocks |
| `read.bg-surface-raised` | `#3b4252` | Hover, active panel (nord1) |
| `read.border` | `#434c5e` | Panel borders, dividers (nord2) |
| `read.border-strong` | `#4c566a` | Emphasized borders (nord3) |
| `read.text-primary` | `#eceff4` | Body text, headings (nord6) |
| `read.text-secondary` | `#d8dee9` | Metadata, captions (nord4) |
| `read.text-tertiary` | `#4c566a` | Disabled/placeholder (nord3) |
| `read.accent` | `#88c0d0` | Links, active states (nord8, "frost") |
| `chrome.danger` | `#bf616a` | Destructive actions (nord11) |
| `chrome.success` | `#a3be8c` | Confirmations (nord14) |

### Light (Pomegranate-designed companion — not official Nord)

| Token | Hex | Use |
|---|---|---|
| `read.bg-base` | `#eceff4` | Page/app background (nord6, inverted role) |
| `read.bg-surface` | `#ffffff` | Panels, cards |
| `read.bg-surface-raised` | `#e5e9f0` | Hover state (nord5) |
| `read.border` | `#d8dee9` | Panel borders (nord4) |
| `read.border-strong` | `#b8c2d6` | Emphasized borders |
| `read.text-primary` | `#2e3440` | Body text, headings (nord0, inverted role) |
| `read.text-secondary` | `#4c566a` | Metadata, captions (nord3) |
| `read.text-tertiary` | `#7b88a1` | Disabled/placeholder |
| `read.accent` | `#5e81ac` | Links, active states (nord10, darkened frost blue for contrast on white) |
| `chrome.danger` | `#b64752` | Destructive actions (nord11, darkened) |
| `chrome.success` | `#7a9a5e` | Confirmations (nord14, darkened) |

**Note**: the light accent (`#5e81ac`) is deliberately the darkest of
Nord's four "frost" blues, not the brightest (`#88c0d0`, used in dark
mode) — needed for contrast on a white background, and it's still
recognizably part of the same frost family.
