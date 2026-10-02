# DESIGN.md — Pomegranate (default theme)

> This file defines **two separate UI languages**, not one — unchanged
> from the prior version of this document:
> - **§1 — TUI mode**, used *only* by the Pomegranate signature theme.
>   Every button, toggle, panel, and nav element in the entire product
>   is styled as a terminal-UI widget when this theme is active.
> - **§1B — Standard mode**, used by every community theme. Unaffected
>   by this rebrand — Catppuccin, Gruvbox, Solarized, Tokyo Night, Nord,
>   and Dracula keep their own palettes and the conventional rounded
>   component language exactly as already specified in their own
>   `design/DESIGN-*.md` files.
>
> §2 below replaces the old Blogly palette/font with Pomegranate's.
> **§1 and §1B are unchanged by this rebrand** — only the signature
> theme's colors, font, and name change.

## 1. TUI mode (Pomegranate theme only)

*(Unchanged from the prior version of this document — the full
structural spec: titled panel borders, bracketed `[ Y ]`/`[ N ]`
toggles, status bar, multiplexer-style tabs, inverted-selection,
blinking block cursor, sharp corners, prompt-style metadata. Carry that
full §1 text forward verbatim from the previous revision of this file
when implementing — it is not reproduced a second time here to avoid two
copies drifting out of sync; this rebrand changes none of it.)*

## 1B. Standard mode (every community theme)

*(Unchanged — carry the existing §1B text forward verbatim. Not affected
by this rebrand.)*

## 2. Pomegranate theme — palette and font

### 2.1 Source palette (given, verbatim)

| Name | Hex |
|---|---|
| One | `#490C19` |
| Two | `#210F13` |
| Three | `#991E34` |
| Four | `#82545D` |
| Five | `#B59D9F` |
| Six | `#320B21` |

### 2.2 Why the token mapping below isn't a naive 1:1 swap

WCAG AA contrast was checked for every pairing before assignment (not
eyeballed). Two real findings shaped the mapping:

- **Three (`#991E34`), the most vivid swatch, fails AA as foreground
  text against every dark background in this set** (1.9–2.3:1, needs
  4.5:1). It works beautifully as a **filled background** with white
  text on top (8.1:1) — so it's used for buttons, toggle-ON fill, active-
  tab fill, and badges, never as bare link-colored text on a dark
  surface.
- **Five (`#B59D9F`) is the only swatch with enough contrast (7.26:1) to
  serve as dark-mode foreground text or an accent stroke.** Since it
  therefore covers both body text and links, links are distinguished by
  an **underline**, not a different hue — which is also the traditional
  terminal-hyperlink convention (an OSC-8 terminal link renders
  underlined in the same foreground color, not recolored), so this reads
  as on-brand for a TUI product, not as a workaround.
- **No green or gold exists in this palette**, so "success" cannot be
  hue-distinguished from "danger"/accent. Success states use Five with a
  checkmark glyph (`✓`) rather than relying on color to carry the
  meaning; danger states use the Three fill + white text + a trash/warn
  glyph, and destructive actions get a confirmation step rather than
  depending on color alone to signal risk. Treat this as a structural
  rule, not a one-off choice — any new UI state introduced later should
  follow the same glyph-plus-fill pattern rather than inventing a hue
  outside this palette.
- **Border contrast is the one soft spot.** Four (`#82545D`) as a border
  sits at ≈2.5–2.8:1 against the dark surfaces — under the 3:1 non-text
  guideline. Mitigation: panels rely primarily on the titled box-border
  treatment plus a background-color step (per §1) to read as distinct,
  not on this line's contrast alone — border-strong (Five, 7.26:1) is
  used wherever a boundary needs to be unambiguous (focused inputs,
  emphasized dividers).

### 2.3 Dark (default)

| Token | Hex / value | Use |
|---|---|---|
| `read.bg-base` | `#210F13` (Two) | Page/app background |
| `read.bg-surface` | `#320B21` (Six) | Panels, cards, code blocks |
| `read.bg-surface-raised` | `#490C19` (One) | Hover state, active panel |
| `read.border` | `#82545D` (Four) | Panel borders, dividers — supporting cue, not sole differentiator (see 2.2) |
| `read.border-strong` | `#B59D9F` (Five) | Focused inputs, emphasized dividers |
| `read.text-primary` | `#B59D9F` (Five) | Body text, headings |
| `read.text-secondary` | `#B59D9F` at 75% opacity | Metadata, captions |
| `read.text-tertiary` | `#B59D9F` at 50% opacity | Disabled/placeholder |
| `read.accent` | `#B59D9F` (Five) + underline on interactive text | Links, cursor, focus-ring stroke |
| `read.accent-fill` | `#991E34` (Three), paired with `#FFFFFF` text | Buttons, toggle-ON fill, active-tab fill, badges |
| `chrome.danger` | `#991E34` (Three) fill + white text + warning glyph | Destructive actions (always confirm) |
| `chrome.success` | `#B59D9F` (Five) + checkmark glyph | Confirmations |

### 2.4 Light

Pomegranate has no official light swatches (same situation as the Nord
and Dracula companions) — the base/surface tones below are derived,
warm-tinted toward the palette's hue; every text/accent token reuses an
actual given swatch directly, verified by contrast:

| Token | Hex / value | Use |
|---|---|---|
| `read.bg-base` | `#FAF4F5` (derived) | Page/app background |
| `read.bg-surface` | `#FFFFFF` | Panels, cards |
| `read.bg-surface-raised` | `#F3E7E9` (derived) | Hover state |
| `read.border` | `#B59D9F` (Five) | Panel borders |
| `read.border-strong` | `#82545D` (Four, 5.72:1) | Emphasized borders |
| `read.text-primary` | `#210F13` (Two, 16.91:1) | Body text, headings |
| `read.text-secondary` | `#490C19` (One, 14.31:1) | Metadata, captions |
| `read.text-tertiary` | `#82545D` (Four, 5.72:1) | Disabled/placeholder |
| `read.accent` | `#991E34` (Three, 7.46:1) | Links, active states — works directly as text here, no underline-only workaround needed (dark-on-light naturally contrasts; the dark-mode constraint doesn't apply) |
| `read.accent-fill` | `#991E34` (Three) + white text (8.11:1) | Buttons, toggle-ON fill |
| `chrome.danger` | `#991E34` (Three) + warning glyph | Destructive actions (always confirm) |
| `chrome.success` | `#210F13` or `#490C19` + checkmark glyph | Confirmations |

### 2.5 Font — Consolas, implemented correctly

**Consolas cannot be self-hosted or bundled** the way Monocraft/
JetBrains Mono were — it's a Microsoft-licensed font shipped with
Windows/Office/Visual Studio, not freely redistributable as a web-font
file. Embedding the actual `.ttf` would violate Microsoft's license.

**Correct implementation**: reference it as a **system-font stack**,
never a hosted/bundled file:

```css
font-family: Consolas, "Courier New", Courier, monospace;
```

This renders as true Consolas for visitors whose own device already has
it installed (most Windows machines, since it ships with the OS) and
falls back gracefully elsewhere (Courier New is common on macOS/Windows;
generic `monospace` covers Linux). **This means Pomegranate will not look
pixel-identical across every visitor's device** — that's an inherent,
honest limitation of using a licensed system font rather than an open
one, not an implementation bug.

If fully consistent, self-hosted rendering across every platform matters
more than the literal name "Consolas," the closest open alternative is
**Cascadia Code** — Microsoft's own modern monospace, SIL-licensed,
explicitly designed in the same family as Consolas and freely
embeddable. Flagging this as an option, not substituting it unilaterally
— ship Consolas via the system stack above unless told otherwise.

### 2.6 Signature UI moments

- **Header/nav**: wordmark renders as `pomegranate_`, Five-colored, with
  the blinking-cursor underscore as its final character.
- **File Upload dropzone**: titled panel (`┌─ Drop a file, or click to
  browse ─┐`) with a dashed `border` while idle, `accent-fill` (Three)
  solid border while a file is dragged over it.
- **Live preview frame**: titled panel (`┌─ Live Preview ─┐`) with a
  small `✓ LIVE` indicator (Five + checkmark glyph, per 2.2's
  success-without-green rule) pulsing gently while up to date.
