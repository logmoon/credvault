# UI Tokens — CredVault

## Colors

### Accent / Brand

| Token | Hex | Usage |
|---|---|---|
| `accent.DEFAULT` | `#E8600A` | Primary buttons, active states, focus rings, key highlights |
| `accent.dark` | `#C4500A` | Button hover state |
| `accent.light` | `#FF7A28` | Accent on dark surfaces when full orange is too heavy |
| `accent.muted` | `#E8600A66` | Selected row background (40% opacity accent) |

### Backgrounds

| Token | Hex | Usage |
|---|---|---|
| `surface.window` | `#141414` | App window / page background |
| `surface.DEFAULT` | `#1C1C1C` | Card / section backgrounds |
| `surface.raised` | `#252525` | Input fields, raised controls, secondary cards |
| `surface.overlay` | `#2E2E2E` | Modals, dropdowns, tooltips |
| `surface.hover` | `#FFFFFF0D` | (white 5%) Row hover tint — overlaid on surface.DEFAULT |

### Text

| Token | Hex | Usage |
|---|---|---|
| `text.primary` | `#F0EFEC` | Main body text, labels, entry titles |
| `text.secondary` | `#A09E9A` | Usernames in entry rows, muted labels, subtitles |
| `text.muted` | `#6B6966` | Placeholders, disabled text, hints |
| `text.inverse` | `#141414` | Text on accent-colored backgrounds |

### Status

| Token | Hex | Usage |
|---|---|---|
| `status.success` | `#3A8A5C` | Sync confirmed, saved indicator |
| `status.warning` | `#C4840A` | Conflict detected badge |
| `status.error` | `#C43030` | Error messages, destructive actions |
| `status.error.muted` | `#C430301A` | Error background tint (e.g. input border on validation fail) |

### Borders

| Token | Usage |
|---|---|
| `border-white/8` | Default card and section borders (Tailwind opacity modifier) |
| `border-white/12` | Input field borders — slightly more visible |
| `border-white/20` | Hover or focused borders on inputs |
| `border-accent/50` | Accent-colored focus ring |

---

## Typography

| Style | Font | Size | Weight | Line Height | Color Token | Usage |
|---|---|---|---|---|---|---|
| App title | System sans | 14px | 500 | 1.2 | `text.secondary` | Window title bar |
| Section heading | System sans | 11px | 500 | 1.2 | `text.muted` | Settings section labels (uppercase tracked) |
| Entry title | System sans | 14px | 500 | 1.4 | `text.primary` | Entry row title |
| Entry username | System sans | 12px | 400 | 1.4 | `text.secondary` | Entry row username |
| Body / label | System sans | 13px | 400 | 1.5 | `text.primary` | Form labels, settings values |
| Input text | JetBrains Mono | 13px | 400 | 1.5 | `text.primary` | Password fields, vault path |
| Password display | JetBrains Mono | 13px | 400 | 1.5 | `text.primary` | Any revealed password string |
| Button text | System sans | 13px | 500 | 1 | varies | Button labels |
| Caption / hint | System sans | 11px | 400 | 1.4 | `text.muted` | Field hints, timestamps |
| Toast text | System sans | 12px | 400 | 1.4 | `text.primary` | Clipboard countdown toast |
| Warning block | System sans | 12px | 400 | 1.6 | `#C4840A` | First-run no-recovery warning |

**Font stack:**
- UI: System sans (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)
- Monospace: `'JetBrains Mono', 'Fira Code', 'Consolas', monospace`

Section headings use `letter-spacing: 0.08em` and `text-transform: uppercase` — applied as a combined Tailwind variant.

---

## Spacing

Base unit: **4px**. All spacing uses multiples of 4.

| Token | px | Tailwind | Usage |
|---|---|---|---|
| `space-1` | 4px | `p-1` / `gap-1` | Icon padding, tight inline gaps |
| `space-2` | 8px | `p-2` / `gap-2` | Button padding (vertical), icon-to-label gap |
| `space-3` | 12px | `p-3` / `gap-3` | Input padding, row padding (vertical) |
| `space-4` | 16px | `p-4` / `gap-4` | Card padding, section gaps |
| `space-5` | 20px | `p-5` / `gap-5` | Between sections |
| `space-6` | 24px | `p-6` / `gap-6` | Page padding, large section gaps |
| `space-8` | 32px | `p-8` / `gap-8` | Lock screen vertical padding |

---

## Component Tokens

### Cards / Sections

| Property | Value |
|---|---|
| Background | `surface.DEFAULT` (`#1C1C1C`) |
| Border | `1px solid rgba(255,255,255,0.08)` |
| Border radius | `8px` |
| Padding | `16px` |
| Shadow | none — flat |

### Entry Rows

| State | Background |
|---|---|
| Default | transparent |
| Hover | `rgba(255,255,255,0.05)` |
| Selected / active | `rgba(232,96,10,0.10)` (accent muted) |
| Border radius | `6px` |
| Padding | `10px 12px` |
| Height | `56px` (two-line: title + username) |

### Buttons — Primary (Accent)

| Property | Value |
|---|---|
| Background | `#E8600A` |
| Background (hover) | `#C4500A` |
| Background (disabled) | `#E8600A` at 40% opacity |
| Text color | `#FFFFFF` |
| Font size | 13px, weight 500 |
| Padding | `8px 16px` |
| Border radius | `6px` |
| Border | none |
| Transition | `background-color 120ms ease` |

### Buttons — Secondary (Ghost)

| Property | Value |
|---|---|
| Background | transparent |
| Background (hover) | `rgba(255,255,255,0.08)` |
| Text color | `text.secondary` (`#A09E9A`) |
| Text color (hover) | `text.primary` (`#F0EFEC`) |
| Font size | 13px, weight 400 |
| Padding | `8px 16px` |
| Border radius | `6px` |
| Border | `1px solid rgba(255,255,255,0.12)` |
| Transition | `background-color 120ms ease, color 120ms ease` |

### Buttons — Destructive

| Property | Value |
|---|---|
| Background | transparent |
| Background (hover) | `rgba(196,48,48,0.15)` |
| Text color | `#C43030` |
| Border | `1px solid rgba(196,48,48,0.30)` |
| All other properties | same as secondary |

### Inputs

| State | Property | Value |
|---|---|---|
| Default | Background | `surface.raised` (`#252525`) |
| Default | Border | `1px solid rgba(255,255,255,0.12)` |
| Default | Border radius | `6px` |
| Default | Padding | `8px 12px` |
| Default | Font size | 13px |
| Default | Text color | `text.primary` |
| Focus | Border | `1px solid rgba(232,96,10,0.50)` |
| Focus | Outline | none (ring replaced by border color change) |
| Error | Border | `1px solid rgba(196,48,48,0.60)` |
| Disabled | Opacity | 50% |

### Toast (Clipboard Countdown)

| Property | Value |
|---|---|
| Background | `surface.overlay` (`#2E2E2E`) |
| Border | `1px solid rgba(255,255,255,0.12)` |
| Border radius | `8px` |
| Padding | `10px 16px` |
| Position | bottom-center, fixed, 24px from bottom |
| Font size | 12px |
| Text color | `text.primary` |
| Shadow | none |

### Modal / Confirm Dialog

| Property | Value |
|---|---|
| Overlay | `rgba(0,0,0,0.60)` |
| Dialog background | `surface.overlay` (`#2E2E2E`) |
| Dialog border | `1px solid rgba(255,255,255,0.12)` |
| Dialog border radius | `10px` |
| Dialog padding | `24px` |
| Max width | `400px` |
| Title font | 14px, weight 500, `text.primary` |
| Body font | 13px, weight 400, `text.secondary` |
