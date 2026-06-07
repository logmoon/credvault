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
| Row background (selected) | `bg-surface-raised border-l-2 border-accent` |
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
| Right panel | `flex-1 overflow-y-auto` |
| FAB | `fixed bottom-6 right-6 bg-accent hover:bg-accent-dark text-white rounded-full p-3 transition-colors` |
| FAB icon | `Plus` lucide-react `size={20}` |

**Pattern notes:**
- Layout is `flex flex-col` at root level: header full-width, then `flex flex-1 overflow-hidden` for sidebar + right panel below.
- Sidebar uses `shrink-0` to prevent collapsing.
- Right panel renders AddEntry or EntryDetail based on `rightPanel` state. When nothing is selected, it's empty — matches ui-rules "no placeholder" spec.
- FAB is hidden when AddEntry is open (`rightPanel === 'add'`).
- FAB has no shadow — follows flat-surface design rule.

### PasswordGenerator

File: `src/components/PasswordGenerator.tsx`
Last updated: 2026-06-06

| Property | Class |
|---|---|
| Toggle button text | `text-xs text-text-muted hover:text-text-secondary` |
| Toggle button layout | `flex items-center gap-1.5` |
| Panel background | `bg-surface-raised` |
| Panel border | `border border-white/8` |
| Panel radius | `rounded-md` |
| Panel padding | `p-3` |
| Panel spacing | `space-y-3` |
| Label text | `text-xs text-text-secondary` |
| Value text | `text-xs text-text-muted font-mono` (length value) |
| Slider | `w-full accent-accent` |
| Checkbox | `accent-accent` |
| Checkbox label | `text-xs text-text-secondary` |
| Generate button | `w-full text-xs text-text-secondary border border-white/12 rounded-md px-3 py-1.5 hover:bg-surface-hover transition-colors disabled:opacity-40` |
| Icon size | `size={14}` (lucide-react) |

**Pattern notes:**
- Collapsed by default — toggle link is always visible.
- Clicking the header toggles the controls panel open/closed. Chevron icon rotates to indicate state.
- Checkbox layout uses `flex flex-wrap gap-3` for the four character set options.
- Slider range is 8–64, displayed with current value to the right.

### AddEntry

File: `src/components/AddEntry.tsx`
Last updated: 2026-06-06

| Property | Class |
|---|---|
| Form container | `h-full flex flex-col p-6` |
| Form spacing | `space-y-4` |
| Heading | `text-sm text-text-primary font-medium` |
| Close button | `p-2 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary` |
| Label text | `text-xs text-text-secondary mb-1.5` |
| Label — password | `font-mono` (adds mono font for password labels) |
| Input — text | `w-full bg-surface border border-white/12 rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 appearance-none` |
| Input — error state | `border-status-error/60` |
| Input — password | same as text but with `font-mono` and `pr-10` for icon inset |
| Error text | `text-xs text-status-error mt-1` |
| Button — secondary (Cancel) | `text-sm text-text-secondary border border-white/12 rounded-md px-4 py-2 hover:bg-surface-hover transition-colors` |
| Button — primary (Save) | `bg-accent hover:bg-accent-dark disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors` |
| Footer separator | `border-t border-white/8 pt-6 mt-6` |
| Footer layout | `flex items-center justify-end gap-2` |
| Icon size | `size={16}` (lucide-react) |

**Pattern notes:**
- Form fills the right panel height — heading at top, fields in flex-1 scroll area, buttons pinned to bottom with top border separator.
- Title is the only required field — validation error shown inline below the input.
- Password field defaults to visible (`showPassword: true`) in AddEntry context.
- Escape closes the form. Enter submits if title is non-empty.
- Cancel and Save are always at the bottom-right, Cancel on the left, Save on the right.
