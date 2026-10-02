# DESIGN-tokyo-night.md — Tokyo Night theme

> Uses the **Standard mode** UI language from `DESIGN.md` §1B — NOT the
> TUI language from §1, which is reserved for the Pomegranate signature theme
> only. This means ordinary rounded sliding toggles (not bracketed `[ Y ]`/
> `[ N ]`), rounded cards and buttons, a normal tab bar, and no box-drawing
> panel borders, status bar, or blinking-cursor treatment anywhere in the
> product while this theme is active.
> This file defines only the Tokyo Night palette and font.

**Mood**: neon-nocturnal, city-at-night — cool blue-purple base with
vivid, slightly electric accent colors. The most "cyberpunk" of the
available themes; leans into it rather than softening it.

**Font**: Cascadia Code (its ligature-friendly, slightly technical
character suits Tokyo Night's coder-at-night identity).

### Dark — "Night"

| Token | Hex | Use |
|---|---|---|
| `read.bg-base` | `#1a1b26` | Page/app background |
| `read.bg-surface` | `#16161e` | Panels, cards, code blocks |
| `read.bg-surface-raised` | `#292e42` | Hover, active panel |
| `read.border` | `#292e42` | Panel borders, dividers |
| `read.border-strong` | `#3b4261` | Emphasized borders |
| `read.text-primary` | `#c0caf5` | Body text, headings |
| `read.text-secondary` | `#a9b1d6` | Metadata, captions |
| `read.text-tertiary` | `#565f89` | Disabled/placeholder |
| `read.accent` | `#7aa2f7` | Links, active states |
| `chrome.danger` | `#f7768e` | Destructive actions |
| `chrome.success` | `#9ece6a` | Confirmations |

### Light — "Day"

| Token | Hex | Use |
|---|---|---|
| `read.bg-base` | `#e1e2e7` | Page/app background |
| `read.bg-surface` | `#f7f7fb` | Panels, cards |
| `read.bg-surface-raised` | `#d3d4db` | Hover state |
| `read.border` | `#9699a3` | Panel borders |
| `read.border-strong` | `#6c6e75` | Emphasized borders |
| `read.text-primary` | `#3760bf` | Body text, headings |
| `read.text-secondary` | `#5a4a78` | Metadata, captions |
| `read.text-tertiary` | `#848cb5` | Disabled/placeholder |
| `read.accent` | `#2e7de9` | Links, active states |
| `chrome.danger` | `#f52a65` | Destructive actions |
| `chrome.success` | `#587539` | Confirmations |

**Signature touch**: since Tokyo Night's whole identity is "city lights
against a dark sky," the primary toggle-ON fill and active-tab indicator
should use the slightly more saturated `#7dcfff` (cyan) rather than the
base accent, for a touch more neon presence in exactly those two spots —
everywhere else, use `read.accent` as normal.
