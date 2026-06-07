# Memory — 07 Add Entry Form (completed)

Last updated: 2026-06-06

## What was built

- `src/components/PasswordGenerator.tsx` — New toggle-based password generator: collapsed by default, clickable header toggles controls panel open/closed. Length slider (8–64), four character set checkboxes (uppercase, lowercase, numbers, symbols), Generate button. Calls `ipc.generatePassword` on generate.
- `src/components/AddEntry.tsx` — New form component for creating credential entries. Fields: Title (required, inline validation), Username, Password (visible by default with reveal toggle), URL. Inline PasswordGenerator below password field. Save calls `VaultContext.addEntry()` and closes panel. Cancel and Escape close without saving.
- `src/components/VaultShell.tsx` — Added `rightPanel` state (`'add' | 'edit' | null`), conditional rendering of AddEntry in right panel, FAB button (bottom-right, accent, rounded-full, no shadow, hidden when AddEntry open).
- `src/components/EntryRow.tsx` — Selected state changed from `bg-accent-muted` to `bg-surface-raised` with `border-l-2 border-accent`. Transparent border by default to prevent layout shift.
- `tailwind.config.ts` — Removed `accent.muted` token (no longer used).
- `context/ui-registry.md` — Updated EntryRow and VaultShell; added PasswordGenerator and AddEntry entries.

## Decisions made

- **Right panel state union type**: Using `'add' | 'edit' | null` from the start avoids refactoring when EntryDetail arrives in Phase 08.
- **FAB design**: Bottom-right, accent-colored, circular (`rounded-full`), no shadow (flat-surface rule). Hidden when AddEntry is open.
- **Password visible by default**: `showPassword` defaults to `true` in AddEntry context — user can see what they type or what the generator produces. Matches MacOS Keychain Access behavior.
- **PasswordGenerator toggle pattern**: Header is always visible; clicking it toggles the controls panel. No separate collapse button to hunt for.
- **Selected row style**: Neutral `bg-surface-raised` background (`#252525`) with 2px accent-orange left border. Clear three-level hierarchy: transparent → hover lift → raised surface. Replaces earlier accent-tint approach (tried 20%, 30%, 40%, 80% — none felt right).
- **Enter key guard**: Only submits from `HTMLInputElement` targets, not buttons — prevents accidental save when Cancel or reveal toggle is focused.
- **Add Entry flow**: FAB click → right panel renders AddEntry → Save calls addEntry + closes → entry appears in list immediately (no persistence through lock/unlock yet).

## Problems solved

- FAB had `shadow-lg` — violated "never use drop shadow" design rule. Removed.
- Enter key on Cancel button triggered save — fixed by adding `e.target instanceof HTMLInputElement` guard in keydown handler.
- Selected row tint went through 4 iterations (20% → 30% → 40% → 80% accent opacity) before settling on neutral raised background + accent border approach.
- PasswordGenerator had a separate collapse button that required precise targeting — restructured as a single toggle header instead.

## Current state

- `npx tsc --noEmit` → 0 errors
- `npx vite build` → clean build
- `cargo clippy -- -D warnings` → clean
- `cargo test` → 26/26 tests pass
- AddEntry form renders in right panel, FAB toggles it open/closed
- PasswordGenerator works end to end (generates password from Rust `generator.rs`)
- Save constructs Entry with `uuid.v4()` and calls `addEntry` — entry appears in list
- No persistence through lock/unlock yet (Phase 08)
- Lock screen → unlock → VaultShell → AddEntry flow works end to end
- `accent.muted` removed from tailwind config; EntryRow uses `bg-surface-raised` + `border-l-2 border-accent`

## Next session starts with

**Phase 08 — Wire Entry CRUD to Vault**: Connect add, edit, delete to `VaultContext` and `save_vault`. Build `EntryDetail` component (view/edit form pre-filled with existing values, delete button with `ConfirmDialog`). Add debounced save (500ms) in `VaultContext`. Remove `MOCK_ENTRIES` from `VaultContext`. Ensure entries survive a full lock/unlock cycle.

## Open questions

None.
