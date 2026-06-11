# Memory — Phase 14 Search

Last updated: 2026-06-11

## What was built

- **`src/components/SearchBar.tsx`** — new component: text input with Search icon (left, decorative), clear X button (right, only when query non-empty). Props: `value`, `onChange`. Styled with standard input tokens (`bg-surface`, `border-border-subtle`, `rounded-md`, `text-sm`).
- **`src/components/EntryList.tsx`** — added optional `searchQuery` prop. When entries are empty and `searchQuery` is set, shows "No entries match '[query]'" instead of the default "No entries yet" empty state.
- **`src/components/VaultShell.tsx`** — added `searchQuery` state, `useMemo`-based `filteredEntries` computation (case-insensitive substring match on `entry.title`), wired SearchBar into the sidebar above EntryList.

## Decisions made

- **Search state in VaultShell**: `useState` in the parent that owns both SearchBar and EntryList. Not a custom hook — single synchronous filter doesn't warrant the abstraction.
- **Filtering via useMemo**: Synchronous, case-insensitive `.includes()` on `entry.title` only. No debounce — purely client-side, instant.
- **No-results in EntryList**: EntryList receives `searchQuery` prop and chooses between "no entries" and "no results" empty states internally. Keeps empty-state logic co-located.
- **SearchBar as separate file**: Consistent with the architecture's listed component structure, even though it's a small component.

## Problems solved

- (none — straightforward feature, no blockers)

## Current state

- `npx tsc --noEmit`: 0 errors
- `npx vite build`: clean
- Reviewed via `/review` — no issues found. User confirmed satisfied.
- Imprinted to `context/ui-registry.md`.

## Next session starts with

**Phase 15 — UI Polish Pass.** Audit every component against `ui-tokens.md` and `ui-rules.md`, fix any deviations. Add transitions (fade in/out on lock/unlock), hover states, disabled states, error toasts, ensure passwords are never visible unless revealed.

## Open questions

- (none)
