# DESIGN-dracula.md — Dracula theme

> Uses the **Standard mode** UI language from `DESIGN.md` §1B — NOT the
> TUI language from §1, which is reserved for the Pomegranate signature theme
> only. This means ordinary rounded sliding toggles (not bracketed `[ Y ]`/
> `[ N ]`), rounded cards and buttons, a normal tab bar, and no box-drawing
> panel borders, status bar, or blinking-cursor treatment anywhere in the
> product while this theme is active.
> This file defines only the Dracula palette and font. **The light variant
> below is Pomegranate's own design** — Dracula has no official light palette;
> this was built by inverting Dracula's own background/foreground roles
> and darkening its accents for contrast, rather than inventing new colors.

**Mood**: vibrant, playful, a little gothic — the most saturated and
high-energy theme in the set. Purple/pink/cyan/green all appear at real
strength; this is the one theme where "one accent used sparingly" bends
slightly, since Dracula's identity is built on multiple vivid accents
working together (syntax-highlighting-style), not a single restrained one.

**Font**: Fira Code — ligature support suits Dracula's long history as a
programmer-editor theme.

### Dark

| Token | Hex | Use |
|---|---|---|
| `read.bg-base` | `#282a36` | Page/app background |
| `read.bg-surface` | `#21222c` | Panels, cards, code blocks |
| `read.bg-surface-raised` | `#44475a` | Hover, active panel |
| `read.border` | `#44475a` | Panel borders, dividers |
| `read.border-strong` | `#6272a4` | Emphasized borders |
| `read.text-primary` | `#f8f8f2` | Body text, headings |
| `read.text-secondary` | `#6272a4` | Metadata, captions |
| `read.text-tertiary` | `#4d5273` | Disabled/placeholder |
| `read.accent` | `#bd93f9` | Links, active states (purple) |
| `chrome.danger` | `#ff5555` | Destructive actions |
| `chrome.success` | `#50fa7b` | Confirmations |

Secondary accent (used only for the toggle-ON fill and active-tab
indicator, to give this theme its characteristic multi-color liveliness):
`#ff79c6` (pink).

### Light (Pomegranate-designed companion — not official Dracula)

| Token | Hex | Use |
|---|---|---|
| `read.bg-base` | `#f6f5fa` | Page/app background (pale lavender-white) |
| `read.bg-surface` | `#ffffff` | Panels, cards |
| `read.bg-surface-raised` | `#ececf5` | Hover state |
| `read.border` | `#d7d5e6` | Panel borders |
| `read.border-strong` | `#b7b3d6` | Emphasized borders |
| `read.text-primary` | `#282a36` | Body text, headings (Dracula's own dark bg, as text) |
| `read.text-secondary` | `#4d4f6b` | Metadata, captions |
| `read.text-tertiary` | `#7b7d9e` | Disabled/placeholder |
| `read.accent` | `#7841c9` | Links, active states (darkened purple for contrast on white) |
| `chrome.danger` | `#c9302c` | Destructive actions |
| `chrome.success` | `#1c9c4a` | Confirmations |

Secondary accent (light): `#c23f8f` (darkened pink), same limited use as
dark mode.
