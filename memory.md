# Memory — Phase 15 UI Polish Pass

Last updated: 2026-06-11

## What was built

- **`src/components/ErrorToast.tsx`** — new component: fixed bottom-center toast, red-tinted (`bg-status-error/15` + `border-status-error/30`), auto-dismisses after 4s. Wired into VaultContext save-failure path — replaces silent `console.error` with user-facing error.
- **VaultContext.tsx** — added `error`/`addError`/`clearError` state. `addError` called in the save failure catch block. Error cleared on vault lock.
- **App.tsx** — added `FadeIn` wrapper component (`transition-opacity duration-150` via rAF pattern). LockScreen and VaultShell each fade in on mount. ErrorToast rendered below the locked/unlocked branch.
- **All primary/confirm buttons** — added `disabled:cursor-not-allowed` across UnlockView, CreateVaultView, AddEntry, EntryDetail, ConfirmDialog, PasswordGenerator.
- **Dialog backgrounds fixed** — ConfirmDialog, ConflictDialog, Settings all changed from `bg-surface-window` to `bg-surface-overlay`.
- **Shadows removed** — `shadow-sm` dropped from ClipboardToast, auto-lock toast, and vault picker dropdown.
- **Orphan `transition-opacity` removed** from ClipboardToast (no effect — always mounted/unmounted).
- **CreateVaultView save location collapsed** — path now shown as compact one-liner below the vault name input (`text-xs text-text-muted` + "Change" link with `hover:text-accent`). Removed separate section with folder icon button and border — saves ~50px.
- **AddEntry password hidden by default** — added `initialPasswordVisible={false}` to EntryForm. Matches ui-rules: passwords always hidden by default everywhere.

## Decisions made

- **Error state in VaultContext, not standalone**: The error string lives in VaultContext (single source of truth for app state), ErrorToast is a pure presentation component in App.tsx. This avoids a separate notification system.
- **FadeIn uses rAF pattern**: `requestAnimationFrame` inside `useEffect` ensures the `opacity-0` class is applied first before transitioning to `opacity-100` — reliable CSS transition trigger.
- **Error toast no interactive elements**: Unlike ClipboardToast, the error toast has no "Clear now" or "×" button — purely informational, auto-dismissed after 4s. Save failures are transient and users don't need to act on them.
- **CreateVaultView save location as inline one-liner**: Replaced full section (label + path display + bordered button) with a compact path + "Change" link under the vault name. The warning callout stays visible — it's security-critical and non-dismissable per spec.

## Problems solved

- (none — straightforward polish pass, no blockers)

## Current state

- `npx tsc --noEmit`: 0 errors
- `npx vite build`: clean
- All Phase 15 items complete: fade transitions, error toast, disabled cursors, dialog bg fix, shadow removal, password visibility consistency
- Phase 14 (Search) completed in prior session
- Progress tracker needs updating — Phase 14 and 15 both now complete

## Next session starts with

**Phase 16 — Mobile Tauri Targets.** Add iOS and Android build targets to the Tauri project. Verify the existing UI renders in a mobile WebView without layout breaks. Then Phase 17 (Mobile UI Adaptations) follows.

## Open questions

- (none)
