# UI Registry

_Written by `/imprint` after building any UI component. Read this before building a new one — never duplicate a pattern that already exists here._

---

## Components

### LockScreen

File: `src/components/LockScreen.tsx`
Last updated: 2026-06-06

| Property | Class |
|---|---|
| Page background | `bg-surface-window` |
| Input background | `bg-surface` |
| Input border | `border border-white/12` |
| Input radius | `rounded-md` |
| Input padding | `px-3 py-2` |
| Input text | `text-sm text-text-primary font-mono` |
| Input placeholder | `placeholder-text-muted` |
| Input focus | `focus:outline-none focus:border-accent/50` |
| Input appearance | `appearance-none` |
| Label text | `text-xs text-text-secondary` |
| Label bottom margin | `mb-1.5` |
| Label font | `font-mono` (for credential fields) |
| Button — primary | `bg-accent hover:bg-accent-dark disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors` |
| Button — icon ghost | `p-1 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary` |
| App title | `text-sm text-text-secondary font-medium` |
| Tagline / caption | `text-xs text-text-muted` |
| Error text | `text-xs text-status-error` |
| Warning callout | `bg-surface-raised border-l-4 border-status-warning rounded-r-md p-4` with `text-xs leading-relaxed text-status-warning` |
| Icon size (inline) | `size={16}` (lucide-react) |

**Pattern notes:**
- Lock screen content area is constrained to `w-[360px]` max, centered with slight upward offset (`paddingTop: 5vh`).
- Inputs with icon insets use additional `pr-10` padding to prevent text overlap with the icon button.
- Custom password reveal toggle uses lucide-react `Eye`/`EyeOff` icons positioned `absolute right-2 top-1/2 -translate-y-1/2` inside a `relative` wrapper.
- Every input that uses a reveal toggle should also suppress the browser-native toggle with `appearance-none` and CSS pseudo-element rules in `index.css`.

### EntryRow

File: `src/components/EntryRow.tsx`
Last updated: 2026-06-06

| Property | Class |
|---|---|
| Row background (default) | transparent |
| Row background (hover) | `bg-surface-hover` |
| Row background (selected) | `bg-accent-muted` |
| Border radius | `rounded-md` |
| Text — title | `text-sm text-text-primary font-medium truncate` |
| Text — username | `text-xs text-text-secondary truncate` |
| Vertical padding | `py-2.5` |
| Horizontal padding | `px-3` |
| Button spacing | `gap-1` |
| Icon button | `p-2 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary` |
| Icon size | `size={16}` (lucide-react) |
| Icon — username copy | `User` |
| Icon — password copy | `Key` |

**Pattern notes:**
- Row is `cursor-pointer` — entire row is clickable to select.
- Copy buttons use `e.stopPropagation()` on the container `div` to prevent row selection when clicking copy.
- Every icon-only button has `aria-label` and `title` for accessibility.
- No delete button on the row — delete only appears in EntryDetail.

### VaultShell

File: `src/components/VaultShell.tsx`
Last updated: 2026-06-06

| Property | Class |
|---|---|
| Page background | `bg-surface-window` |
| Header background | transparent (inherits page bg) |
| Header border | `border-b border-white/8` |
| Header padding | `px-6 py-3` |
| App name text | `text-sm text-text-secondary font-medium` |
| Lock button text | `text-xs text-text-muted hover:text-text-primary transition-colors` |
| Sidebar width | `w-[280px]` |
| Sidebar separator | `border-r border-white/8` |
| Right panel | `flex-1` (empty background, no placeholder content) |

**Pattern notes:**
- Layout is `flex flex-col` at root level: header full-width, then `flex flex-1 overflow-hidden` for sidebar + right panel below.
- Sidebar uses `shrink-0` to prevent collapsing.
- Right panel is intentionally empty when nothing is selected — matches ui-rules "no placeholder" spec.
