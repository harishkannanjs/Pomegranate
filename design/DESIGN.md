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

Modeled on real terminal UI applications (`k9s`, `lazygit`, `btop`,
`gitui`, `tmux`/`vim` statuslines) — but tuned for a general, non-technical
audience, so every TUI-style control still needs a plain-language label
and normal click/tap behavior. "Feels like a terminal" describes the
visual language, not the required literacy to use it.

- **Sharp corners, always.** `border-radius: 0` everywhere except the two
  named exceptions below. No box-shadows — elevation is a background-color
  step plus a 1px border, nothing else.
- **Titled panel borders** — every major panel has its section name
  embedded in its top border:
  ```
  ┌─ Settings ──────────────────────────┐
  │  ...panel content...                 │
  └──────────────────────────────────────┘
  ```
  Built as a bordered `<div>` with the title as a background-colored label
  sitting on the border line (CSS, not literal rendered Unicode box-drawing
  characters as body text — keeps borders accessible and unaffected by
  text selection/zoom).
- **Toggle switches = bracketed Y/N, not a sliding pill.** A compact
  two-state control reading `[ Y ]` (filled in `accent-fill`, light text) when
  on, `[ N ]` (outlined only, muted text) when off. Whole control is one
  click/tap target — never requires reading the letter to know the state,
  since fill vs. outline already communicates it at a glance; the letter
  is there for people who want to double-check, not the sole indicator of
  state (color alone is never the only signal, keeping it accessible).
  Full keyboard support: `Space`/`Enter` flips it, visible focus ring.
- **Checkboxes/single-select as bracket glyphs**: `[x]` / `[ ]` for
  multi-select, `(•)` / `( )` for single-select, monospace-aligned.
- **Buttons carry their keyboard shortcut inline**, bracketed:
  `[ Save  ^S ]`, `[ Preview  ^P ]` — still normal clickable buttons, the
  shortcut is a label, not a requirement to use them.
- **Inputs styled as a terminal prompt line**: `[ email@example.com_ ]`,
  cursor-style blinking caret at the end when focused/empty.
- **A persistent status bar**, fixed to the bottom, always visible:
  current context on the left (`FILE UPLOAD` / `SETTINGS`), available
  shortcuts on the right — e.g. `^S Save   ^P Preview   ^K Command Palette`.
  Real, working shortcuts, not decoration.
- **Tabs styled like terminal-multiplexer tabs**: `[1 File Upload]
  [2 Settings]`, active tab shown via inverted foreground/background or accent fill.
- **List/menu selection = inverted colors** (foreground/background swap)
  on hover/focus, matching classic terminal selection behavior. Form
  controls (inputs, buttons) still get a standard 2px accent focus ring —
  inversion is for list-style rows specifically, not a replacement for
  accessible focus indication.
- **Blinking block cursor** (`█`) as the universal loading/busy indicator
  — file conversion, Codespace provisioning, save/push in progress. Never
  a spinner graphic.
- **Prompt-style metadata prefixes**: `$ 3 posts · 2 series`,
  `> Converting document...`.
- **One accent color**, used sparingly: active tab, focus ring, the `[ Y ]`
  fill, links, the blinking cursor.

**Exceptions to sharp corners**: the `[ Y ]`/`[ N ]` toggle and the
theme/font picker's live-preview thumbnail get `border-radius: 3–4px` —
at 0px they read as harder-to-parse click targets at small sizes.

## 1B. Standard mode (every community theme)

Modeled on conventional, familiar modern app settings UI — the reference
point is an ordinary grouped-list settings panel (the kind found in a
typical browser extension or mobile app: grouped card sections, muted
small-caps section labels, a sliding pill toggle, a full-width rounded CTA
button). Nothing terminal-flavored appears here at all — no box-drawing
borders, no status bar, no bracket widgets, no inverted-selection, no
blinking cursor.

- **Rounded corners throughout** — cards, buttons, inputs, toggles all use
  a normal modern radius (8–12px for cards/buttons, fully rounded/pill
  shape for toggles and primary CTAs).
- **Toggle switches = a standard sliding pill**: rounded track, circular
  knob that slides right (filled, theme's accent color) when on, left
  (muted/outline track) when off, with a smooth slide transition. This is
  the ordinary switch component used almost everywhere outside terminal
  tooling — deliberately the opposite of the Pomegranate theme's `[ Y ]`/`[ N ]`
  control.
  A disabled toggle (a feature not available in this context) renders
  fully muted/desaturated with no color, matching how a greyed-out option
  reads in any standard settings screen.
- **Grouped list sections**: each settings group (Appearance, Features,
  Post Management, Deploy, Privacy, Advanced) is a bordered/subtly-
  elevated rounded card containing stacked rows, each row separated by a
  thin 1px divider — label on the left, control on the right. A small,
  muted, uppercase-tracking section label sits above each group.
- **Buttons**: solid-fill rounded buttons for primary actions, outline
  rounded buttons for secondary ones. No inline keyboard-shortcut labels
  baked into the button text (shortcuts, if shown at all, appear as a
  separate small hint, not part of the button itself).
- **Inputs**: standard rounded text fields with normal placeholder text,
  no prompt-line styling, no blinking caret treatment beyond the browser's
  own default cursor.
- **Navigation**: a normal tab bar or sidebar — rounded active-tab
  indicator or underline, not multiplexer-style bracket tabs.
- **Loading/busy state**: a conventional spinner or progress bar, never
  the block-cursor treatment.
- **Elevation**: a soft, very subtle shadow is acceptable here (unlike TUI
  mode, which never uses shadows) — modern UI conventionally uses gentle
  elevation to separate a card from its background.

Each community theme applies its own palette and font to this exact
structural language — nothing below §1B changes between them; only colors
and typography do.

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
