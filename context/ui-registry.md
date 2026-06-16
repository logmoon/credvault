# UI Registry

_Written by `/imprint` after building any UI component. Read this before building a new one — never duplicate a pattern that already exists here._

---

## Components

### LockScreen

File: `src/components/LockScreen.tsx`
Last updated: 2026-06-09

Orchestrator that determines which view to render. Does not own form UI — delegates to `UnlockView` or `CreateVaultView`.

| Property | Class |
|---|---|
| Page background | `bg-surface-window` |
| App title | `text-sm text-text-secondary font-medium` |
| Tagline / caption | `text-xs text-text-muted` |
| Loading text | `text-sm text-text-muted` |

**Pattern notes:**
- Lock screen content area is constrained to `w-[360px]` max, centered with slight upward offset (`paddingTop: 5vh`).
- On mount, loads config, resolves vault path, checks `vaultExists`. Sets mode to `'unlock'` or `'create'`.
- Owns shared state: `vaultPath`, `vaultName`, `password`, `error`, `submitting`.
- Passes setters down as props to sub-views.

---

### UnlockView

File: `src/components/UnlockView.tsx`
Last updated: 2026-06-09

Unlock form with vault picker. Used when a vault exists at the configured path.

| Property | Class |
|---|---|
| Vault picker button | `w-full flex items-center justify-center gap-1.5 text-sm text-text-primary font-medium hover:text-accent transition-colors` |
| Vault name text | `truncate` |
| Picker dropdown | `absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[320px] bg-surface-overlay border border-border-subtle rounded-lg z-50 p-3` |
| Picker heading | `text-xs text-text-muted mb-2` |
| Picker recent vault item | `w-full text-left px-3 py-2 rounded-md text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors` |
| Picker recent vault name | `text-xs font-medium` |
| Picker recent vault path | `text-xs text-text-muted truncate` |
| Picker action button | `flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors` |
| Input background | `bg-surface` |
| Input border | `border border-border-subtle` |
| Input radius | `rounded-md` |
| Input padding | `px-3 py-2` |
| Input text | `text-sm text-text-primary font-mono` |
| Input placeholder | `placeholder-text-muted` |
| Input focus | `focus:outline-none focus:border-accent/50` |
| Input disabled | `disabled:opacity-40 disabled:cursor-not-allowed` |
| Input appearance | `appearance-none` |
| Label text | `text-xs text-text-secondary mb-1.5 font-mono` |
| Error text | `text-xs text-status-error` |
| Button — primary | `bg-accent hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors` |

**Pattern notes:**
- Password input disabled when `vaultPath` is empty — forces user to select a vault first.
- Placeholder changes based on vaultPath: `'Select a vault first'` vs `'Enter master password'`.
- Picker click-outside uses `mousedown` event with `pickerRef` and `buttonRef` exclusion.
- Recent vaults limited to `slice(0, 3)` with `max-h-[200px] overflow-y-auto`.
- `autoFocus` only when vaultPath is set (`autoFocus={!!vaultPath}`).

---

### CreateVaultView

File: `src/components/CreateVaultView.tsx`
Last updated: 2026-06-09

Create vault form. Used when no vault exists at the configured path.

| Property | Class |
|---|---|
| Title | rendered by LockScreen: `text-sm text-text-muted text-center` |
| Input background | `bg-surface` |
| Input border | `border border-border-subtle` |
| Input radius | `rounded-md` |
| Input padding | `px-3 py-2` |
| Input text | `text-sm text-text-primary` (name field), `font-mono` (password fields) |
| Input placeholder | `placeholder-text-muted` |
| Input focus | `focus:outline-none focus:border-accent/50` |
| Input appearance | `appearance-none` |
| Label text | `text-xs text-text-secondary mb-1.5` |
| Label — password | `font-mono` (adds mono font for password labels) |
| Reveal toggle | `absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary` with `tabIndex={-1}` |
| Error text | `text-xs text-status-error` |
| Warning callout | `bg-surface-raised border-l-4 border-status-warning rounded-r-md p-4` with `text-xs leading-relaxed text-status-warning` |
| Save location path | `text-xs text-text-muted truncate` |
| Save location change | `text-xs text-text-muted hover:text-accent transition-colors` |
| Button — primary | `bg-accent hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors` |
| Switch link | `w-full text-center text-xs text-text-muted hover:text-text-secondary transition-colors mt-3` |

**Pattern notes:**
- Owns local state: `newVaultName`, `confirmPassword`, `showPassword`, `showConfirmPassword`, `localError`, `saveFolder`.
- Validates form fields locally before calling `onCreate(vaultName)`.
- `displayError = localError || error` — local form validation takes precedence over submission errors.
- All validation (name required, password required, password match) happens in component — LockScreen receives only the validated vault name.
- Password defaults to hidden (`showPassword` starts `false`).
- Auto-focuses on vault name input.
- Save location shown inline below vault name input as compact one-liner: path on the left, "Change" link on the right. `useEffect` syncs `saveFolder` when `defaultFolder` prop arrives async.

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
Last updated: 2026-06-07

| Property | Class |
|---|---|
| Page background | `bg-surface-window` |
| Header background | `bg-surface` |
| Header border | `border-b border-border-strong` |
| Header padding | `px-6 py-3` |
| App name text | `text-sm text-text-secondary font-medium` |
| Header icon button | `p-2 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary` with `aria-label` + `title` |
| Header icon size | `size={16}` (lucide-react — Settings, Lock icons) |
| Sidebar width | `w-[280px]` |
| Sidebar background | `bg-surface` |
| Sidebar separator | `border-r border-border-strong` |
| Sidebar flex | `shrink-0 flex flex-col min-h-0` |
| Right panel | `flex-1 flex flex-col min-h-0 relative overflow-hidden` |
| FAB | `fixed bottom-6 right-6 bg-accent hover:bg-accent-dark text-white rounded-full p-3 transition-colors` |
| FAB icon | `Plus` lucide-react `size={20}` |

**Pattern notes:**
- Layout is `flex flex-col` at root level: header full-width, then `flex flex-1 overflow-hidden` for sidebar + right panel below.
- Header and sidebar use `bg-surface` to visually separate from right panel `bg-surface-window`.
- Sidebar uses `shrink-0` to prevent collapsing, `min-h-0` for correct flex shrink behavior.
- Right panel uses `overflow-hidden` — child components (AddEntry, EntryDetail) manage their own scrolling via `absolute inset-0` + split scroll area / fixed footer.
- Right panel renders AddEntry or EntryDetail based on `rightPanel` state. When nothing is selected, it's empty — matches ui-rules "no placeholder" spec.
- FAB is hidden when AddEntry is open (`rightPanel === 'add'`).
- FAB has no shadow — follows flat-surface design rule.
- Separators use `border-border-strong` (15% white) — strongest border level for structural divisions.

### PasswordGenerator

File: `src/components/PasswordGenerator.tsx`
Last updated: 2026-06-07

| Property | Class |
|---|---|
| Toggle button text | `text-xs text-text-muted hover:text-text-secondary` |
| Toggle button layout | `flex items-center gap-1.5` |
| Panel background | `bg-surface-raised` |
| Panel border | `border border-border-subtle` |
| Panel radius | `rounded-md` |
| Panel padding | `p-3` |
| Panel spacing | `space-y-3` |
| Label text | `text-xs text-text-secondary` |
| Value text | `text-xs text-text-muted font-mono` (length value) |
| Slider | `w-full accent-accent` |
| Checkbox | `accent-accent` |
| Checkbox label | `text-xs text-text-secondary` |
| Generate button | `w-full text-xs text-text-secondary border border-border-subtle rounded-md px-3 py-1.5 hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed` |
| Icon size | `size={14}` (lucide-react) |

**Pattern notes:**
- Collapsed by default — toggle link is always visible.
- Clicking the header toggles the controls panel open/closed. Chevron icon rotates to indicate state.
- Checkbox layout uses `flex flex-wrap gap-3` for the four character set options.
- Slider range is 8–64, displayed with current value to the right.

### AddEntry

File: `src/components/AddEntry.tsx`
Last updated: 2026-06-07

| Property | Class |
|---|---|
| Form container | `absolute inset-0 flex flex-col` |
| Form spacing | `space-y-4` (inside scroll area) |
| Heading | `text-sm text-text-primary font-medium` |
| Close button | `p-2.5 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary` |
| Label text | `text-xs text-text-secondary mb-1.5` |
| Label — password | `font-mono` (adds mono font for password labels) |
| Input — text | `w-full bg-surface border border-border-subtle rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 appearance-none` |
| Input — error state | `border-status-error/60` |
| Input — password | same as text but with `font-mono` and `pr-10` for icon inset |
| Error text | `text-xs text-status-error mt-1` |
| Button — primary (Save) | `bg-accent hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors` |
| Footer separator | `border-t border-border shrink-0` |
| Footer layout | `flex items-center justify-end px-6 py-4` |
| Icon size | `size={16}` (lucide-react) |
| Close icon | `X size={18}` |

**Pattern notes:**
- Form uses `absolute inset-0 flex flex-col` — inner scroll area (`flex-1 overflow-y-auto min-h-0 p-6`) plus fixed footer (`shrink-0`).
- Title is the only required field — validation error shown inline below the input.
- Password field defaults to hidden (`initialPasswordVisible={false}`) in AddEntry context.
- Escape closes the form. Enter submits if title is non-empty.
- No Cancel button — only Save in the footer. Close via Escape or the X button.

### EntryForm

File: `src/components/EntryForm.tsx`
Last updated: 2026-06-07

| Property | Class |
|---|---|
| Container spacing | `space-y-4 flex-1 min-h-0` |
| Label text | `text-xs text-text-secondary mb-1.5` |
| Label — password | `font-mono` (adds mono font for password labels) |
| Input — text | `w-full bg-surface border border-border-subtle rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 appearance-none` |
| Input — error state | `border-status-error/60` |
| Input — password | same as text but with `font-mono` and `pr-10` for icon inset |
| Reveal toggle | `absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary` with `tabIndex={-1}` |
| Inline icon button | same as reveal toggle pattern (used for URL ExternalLink) |
| Error text | `text-xs text-status-error mt-1` |
| URL input icon | `ExternalLink` from lucide-react, `size={16}`, shown only when `isValidUrl` returns true |
| URL open call | `import { open } from '@tauri-apps/plugin-shell'` |
| Icon size | `size={16}` (lucide-react) |

**Pattern notes:**
- Wrapped in `React.memo` — prevents re-render when parent re-renders but form props haven't changed
- Password input always has `font-mono`, URL input does not
- `onChange` handler generates a curried function per field via `useCallback` — stable reference as long as `onChange` prop is stable
- `initialPasswordVisible` prop controls password visibility default (`true` for AddEntry, `false` for EntryDetail)
- URL ExternalLink button uses same absolute positioning as password reveal toggle — both inside a `relative` wrapper with `pr-10` on the input
- Both inline icon buttons have `tabIndex={-1}` to prevent tabbing to them

### EntryDetail

File: `src/components/EntryDetail.tsx`
Last updated: 2026-06-07

| Property | Class |
|---|---|
| Container | `absolute inset-0 flex flex-col` |
| Heading text | `text-sm text-text-primary font-medium truncate` |
| Close button | `p-2.5 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary` with `X size={18}` |
| Footer separator | `border-t border-border shrink-0` |
| Footer layout | `flex items-center justify-between px-6 py-4` |
| Button — destructive (Delete) | `flex items-center gap-1.5 text-sm text-status-error border border-status-error/30 rounded-md px-3 py-2 hover:bg-status-error/15 transition-colors` with `Trash2 size={14}` |
| Button — primary (Save) | `bg-accent hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors` |

**Pattern notes:**
- Accepts `entryId` prop and looks up entry from `useVault().entries` — does not receive entry data as prop
- Renders `null` when entry is not found (e.g. deleted while panel was open)
- Wraps `EntryForm` with `initialPasswordVisible={false}` — passwords are hidden by default in edit view
- Delete button on the left of footer, Save button on the right
- Delete opens `ConfirmDialog` with `destructive` variant — does not delete immediately
- Close button uses `p-2.5` (slightly larger than standard `p-2`) to match AddEntry close button
- Escape closes; Enter submits if title non-empty

### ConfirmDialog

File: `src/components/ConfirmDialog.tsx`
Last updated: 2026-06-07

| Property | Class |
|---|---|
| Overlay | `fixed inset-0 bg-black/60 flex items-center justify-center z-50` |
| Dialog background | `bg-surface-overlay` |
| Dialog border | `border border-border-subtle` |
| Dialog radius | `rounded-xl` |
| Dialog padding | `p-6` |
| Dialog max width | `max-w-[400px]` |
| Title text | `text-sm text-text-primary font-medium mb-2` |
| Message text | `text-sm text-text-secondary mb-6` |
| Button layout | `flex items-center justify-end gap-2` |
| Button — Cancel | `text-sm text-text-secondary border border-border-subtle rounded-md px-4 py-2 hover:bg-surface-hover transition-colors` |
| Button — destructive confirm | `text-sm font-medium text-status-error border border-status-error/30 hover:bg-status-error/15 rounded-md px-4 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed` |
| Button — normal confirm | `bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-md px-4 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed` |
| Loading label | `'Deleting…'` (suffix appended to confirmLabel when loading) |

**Pattern notes:**
- Overlay click dismisses (`onClick={onCancel}`); dialog `e.stopPropagation()` prevents overlay dismissal from inside the dialog
- Escape key dismisses via global `keydown` listener (registered in `useEffect`)
- `destructive` prop switches confirm button between accent and error styling
- `loading` prop adds `disabled:opacity-40 disabled:cursor-not-allowed` and changes confirm label to `'Deleting…'`

### ClipboardToast

File: `src/components/ClipboardToast.tsx`
Last updated: 2026-06-07

| Property | Class |
|---|---|
| Container | `absolute bottom-6 left-1/2 -translate-x-1/2` |
| Background | `bg-surface-overlay` |
| Border | `border border-border-subtle` |
| Border radius | `rounded-lg` |
| Padding | `px-4 py-2.5` |
| Text | `text-xs text-text-primary whitespace-nowrap` |
| Shadow | none |
**Pattern notes:**
- Two variants: `copied` shows "Copied — clears in {n}s" (with seconds), `cleared` shows "Clipboard cleared" (no seconds).
- Positioned absolutely inside the right panel (`relative` container on `<main>`) — not `fixed` relative to window.
- No interactive elements — just informational text, auto-dismissed by the hook after 1.5s.
- Seconds value (`timeoutSecs`) is captured at copy time and never updates — toast dismisses before it would tick.

### Settings

File: `src/components/Settings.tsx`
Last updated: 2026-06-07

| Property | Class |
|---|---|
| Overlay | `fixed inset-0 bg-black/60 flex items-center justify-center z-50` |
| Dialog background | `bg-surface-overlay` |
| Dialog border | `border border-border` |
| Dialog radius | `rounded-xl` |
| Dialog size | `w-[600px] max-w-[90vw] max-h-[80vh]` |
| Dialog layout | `flex flex-col` |
| Header layout | `flex items-center justify-between p-6 pb-0 shrink-0` |
| Header border | `border-b border-border-strong` |
| Heading text | `text-sm text-text-primary font-medium` |
| Close button | `p-2.5 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary` with `X size={18}` |
| Content scroll | `overflow-y-auto p-6 flex-1` |
| Section spacing | `space-y-5` |
| Section heading | `text-xs text-text-muted uppercase tracking-wider font-medium mb-2` |
| Card background | `bg-surface-raised` |
| Card border | `border border-border` |
| Card radius | `rounded-lg` |
| Card padding | `p-4` |
| Card spacing | `space-y-3` |
| Label text | `text-xs text-text-secondary` |
| Value text | `text-xs text-text-muted font-mono` |
| Path display | `text-sm text-text-primary truncate` |
| Directory text | `text-xs text-text-muted truncate` |
| Range slider | `w-full accent-accent` |
| Range min/max text | `text-xs text-text-muted` |
| Checkbox input | `accent-accent` |
| Checkbox label | `flex items-center gap-2 cursor-pointer` |
| Checkbox text | `text-xs text-text-secondary` |
| Button — secondary (Change path) | `text-sm text-text-secondary border border-border rounded-md px-3 py-1.5 hover:bg-surface-hover transition-colors shrink-0` |
| Button — disabled | `w-full text-sm text-text-muted border border-border rounded-md px-3 py-1.5 opacity-40 cursor-not-allowed` |

**Pattern notes:**
- Full-screen overlay modal (not right panel). Overlay click closes; Escape closes via keydown listener.
- Dialog is larger than ConfirmDialog — `w-[600px]` with `max-h-[80vh]` and internal scroll.
- No primary/save button — every change persists immediately on interaction.
- Header pinned at top (`shrink-0`), content scrolls internally (`overflow-y-auto flex-1`).
- Vault path section shows filename + parent directory path (two lines, both truncated).
- Range slider displays current value to the right as `font-mono` text.
- Sync Now button is always disabled until Phase 12.
- ConfirmDialog overlay shown for vault path overwrite confirmation — uses existing ConfirmDialog component.

### Conflict Banner

File: `src/components/VaultShell.tsx`
Last updated: 2026-06-11

| Property | Class |
|---|---|
| Banner background | `bg-surface-raised` |
| Banner border | `border-b border-border` |
| Banner padding | `px-6 py-3` |
| Banner layout | `flex items-center justify-between` |
| Icon container | `bg-status-warning/15 rounded-md p-1.5` |
| Icon | `AlertTriangle size={14} text-status-warning` |
| Text — title | `text-sm text-text-primary font-medium` |
| Text — subtitle | `text-xs text-text-muted mt-0.5` |
| Button — Review | `text-sm font-medium text-text-secondary border border-border rounded-md px-4 py-1.5 hover:bg-surface-hover hover:text-text-primary transition-colors` |

**Pattern notes:**
- Persistent notification bar below the header — visible until conflict is resolved.
- Two-line layout: title line + subtitle line with conflict count.
- Alert icon sits in a tinted rounded box rather than a raw icon, giving it more visual weight without being flashy.
- "Review" button matches secondary/ghost button pattern (`border border-border`, `hover:bg-surface-hover`).
- Replaced the previous `border-l-4 border-status-warning` heavy left-border approach with a cleaner inline icon box. The warning color is now used as a background tint rather than a border accent.

### ErrorToast

File: `src/components/ErrorToast.tsx`
Last updated: 2026-06-11

| Property | Class |
|---|---|
| Container | `fixed bottom-6 left-1/2 -translate-x-1/2 z-50` |
| Background | `bg-status-error/15` |
| Border | `border border-status-error/30` |
| Border radius | `rounded-lg` |
| Padding | `px-4 py-2.5` |
| Text | `text-xs text-status-error` |
| Shadow | none |

**Pattern notes:**
- Auto-dismisses after 4 seconds via `useEffect` timeout.
- Renders nothing when `message` is null — parent controls visibility by passing message or null.
- Uses `fixed` (not `absolute`) positioning — visible above both LockScreen and VaultShell.
- Error color is used as a background tint (`/15`) and border (`/30`), not as a solid background — matches the conflict banner pattern.
- No interactive elements — purely informational, auto-dismissed.

---

### ConflictDialog

File: `src/components/ConflictDialog.tsx`
Last updated: 2026-06-11

| Property | Class |
|---|---|
| Overlay | `fixed inset-0 bg-black/60 flex items-center justify-center z-50` |
| Dialog background | `bg-surface-overlay` |
| Dialog border | `border border-border-subtle` |
| Dialog radius | `rounded-xl` |
| Dialog width | `max-w-[460px]` |
| Dialog layout | `flex flex-col` |
| Header layout | `flex items-center justify-between p-5 pb-0` |
| Header title | `text-sm text-text-primary font-medium` with `AlertTriangle size={16} text-status-warning` |
| Close button | `p-1 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary` with `X size={16}` |
| Description text | `text-sm text-text-secondary px-5 pt-2 pb-3` |
| Loading text | `text-sm text-text-muted text-center py-6` |
| Error text | `text-xs text-status-error mb-3` |
| Vault option card | `w-full text-left bg-surface-raised border border-border-subtle rounded-lg p-4 cursor-pointer hover:border-accent/40 transition-colors` |
| Card — title | `text-sm text-text-primary font-medium` |
| Card — timestamp | `text-xs text-text-muted mt-1` |
| Card — keep label | `text-xs text-accent font-medium` |
| Card — conflict filename | `text-sm text-text-primary font-medium truncate` |
| Card layout | `flex items-start justify-between gap-3` |
| Cards container | `px-5 pb-5 space-y-2 max-h-[50vh] overflow-y-auto` |
| Footer separator | `border-t border-border` |
| Footer layout | `flex items-center justify-end gap-2 px-5 py-4` |
| Button — Cancel | `text-sm text-text-secondary border border-border-subtle rounded-md px-4 py-2 hover:bg-surface-hover transition-colors` |

**Pattern notes:**
- Full-screen overlay modal. Overlay click closes (disabled during loading/resolving); Escape closes via keydown listener.
- Loads conflict info on mount via `getConflictsInfo` IPC call. Renders once data arrives.
- Shows current vault as the first option card, followed by all conflict copies with their filenames and timestamps.
- "Keep this" label in accent color on the right of each card — user clicks the entire card to choose.
- Choosing "Current vault" deletes all conflicts (result: "resolved"). Choosing a conflict copy copies it over the vault (result: "locked" → vault is locked for re-unlock).
- Cards use `hover:border-accent/40` — accent border on hover instead of background tint, cleaner interaction signal.
- `max-h-[50vh]` on the cards container prevents the dialog from growing too tall when many conflicts exist.

### AutoLockToast (inline)

File: `src/App.tsx`
Last updated: 2026-06-07

| Property | Class |
|---|---|
| Container | `fixed bottom-6 left-1/2 -translate-x-1/2 z-50` |
| Background | `bg-surface-overlay` |
| Border | `border border-border-subtle` |
| Border radius | `rounded-lg` |
| Padding | `px-4 py-2.5` |
| Text | `text-xs text-text-primary` |
| Shadow | none |

**Pattern notes:**
- Rendered inline in AppContent, not as a separate component — lives above the locked/unlocked branch so it persists across transitions.
- Uses `fixed` (not `absolute`) positioning — must be visible above both LockScreen and VaultShell.
- `z-50` ensures it layers above all content.
- No interactive elements — auto-dismissed after 2s via `useEffect` in AppContent.
- Shares the same visual styling as ClipboardToast (`bg-surface-overlay`, `border-border-subtle`, `rounded-lg`, `px-4 py-2.5`, `text-xs`).
- No `transition-opacity` — appears/disappears instantly (matches the lock transition).

---

### SearchBar

File: `src/components/SearchBar.tsx`
Last updated: 2026-06-11

| Property | Class |
|---|---|
| Wrapper padding | `px-3 pt-3 pb-2 shrink-0` |
| Input background | `bg-surface` |
| Input border (idle) | `border border-border-subtle` |
| Input border (focus) | `focus:border-accent/50` |
| Border radius | `rounded-md` |
| Input padding | `pl-9 pr-8 py-2` |
| Input text | `text-sm text-text-primary` |
| Input placeholder | `placeholder-text-muted` |
| Search icon | `text-text-muted` |
| Clear button | `text-text-muted hover:text-text-secondary p-0.5 rounded hover:bg-surface-hover` |
| Focus outline | `focus:outline-none` |

**Pattern notes:**
- Search icon is absolutely positioned left, pointer-events-none (decorative only).
- Clear (×) button only renders when value is non-empty — no unused UI.
- Clear button uses `p-0.5` (smaller than standard `p-2`) because the icon is size 14 and the hit target is already adequate inside the input.
- Matches the standard input styling used in EntryForm and CreateVaultView (same bg-surface, border-border-subtle, rounded-md, py-2).
- No form or submit — purely a controlled input with `onChange` handler.
