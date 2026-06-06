# Build Plan — CredVault

## Core Principle

Features are ordered so every layer is testable before the next one is added. Rust crypto is built and verified first — nothing else is meaningful without it. UI is always built with mock data before real IPC is wired. Each feature must be completable and verifiable in one agent session. Mobile adaptations come last, after the desktop vault is fully proven.

---

## Phase 0 — Working Desktop Vault

### 01 Tauri Project Scaffold

Set up the Tauri 2.0 project with React + TypeScript + Vite. Establish the full folder structure from `architecture.md`. Configure TypeScript strict mode, Tailwind with the design tokens from `ui-tokens.md`, and the Tauri `allowlist` scoped to the vault path only.

**UI:**
- Render a placeholder `<LockScreen />` with a hardcoded "Vault Locked" heading and a disabled input field
- Confirm Tailwind tokens apply (background color, font, accent color visible)

**Logic:**
- Tauri 2.0 project initialises and runs on desktop (`cargo tauri dev`)
- Vite dev server serves the React app inside the Tauri window
- `tsconfig.json` has `strict: true`; zero TypeScript errors on scaffold

**Exit criteria:** `cargo tauri dev` opens a window showing the placeholder lock screen with correct dark background and font.

---

### 02 Rust Crypto Layer

Implement all cryptographic operations in `crypto.rs`. No Tauri commands yet — test via Rust unit tests only.

**UI:**
- None at this stage

**Logic:**
- `derive_key(password: &str, salt: &[u8; 16], params: Argon2Params) -> SecretVec<u8>` — Argon2id with 64MB memory, 3 iterations, parallelism 4
- `encrypt(key: &[u8], plaintext: &[u8]) -> (Nonce, Vec<u8>, Tag)` — AES-256-GCM with random nonce via `OsRng`
- `decrypt(key: &[u8], nonce: &[u8], ciphertext: &[u8], tag: &[u8]) -> Result<Vec<u8>, CryptoError>` — returns `Err` on tag mismatch
- `zeroize` called on key material in all code paths including error paths
- Unit tests: encrypt-then-decrypt round trip succeeds; wrong password returns error; tampered ciphertext returns error

**Exit criteria:** `cargo test` in `src-tauri/` passes all crypto unit tests. A wrong key or tampered ciphertext never returns `Ok`.

---

### 03 Vault File Read/Write

Implement `vault.rs`: the binary vault file format, atomic write, and header parsing.

**UI:**
- None at this stage

**Logic:**
- `write_vault_header(params: &VaultHeader) -> Vec<u8>` — serializes the 44-byte plaintext header (magic + version + salt + argon2 params + created_at)
- `parse_vault_header(bytes: &[u8]) -> Result<VaultHeader, VaultError>` — validates magic bytes, extracts params
- `atomic_write(path: &Path, data: &[u8]) -> Result<(), VaultError>` — writes to `path.with_extension("tmp")` then renames to `path`
- `read_vault(path: &Path) -> Result<(VaultHeader, Vec<u8>), VaultError>` — reads file, parses header, returns header + encrypted payload
- Unit tests: write then read round trip; atomic write leaves no tmp file on success; invalid magic bytes returns error

**Exit criteria:** `cargo test` passes vault read/write tests. A vault file written by `write_vault` can be parsed by `parse_vault_header` with correct field values.

---

### 04 Tauri Commands (IPC Bridge)

Expose the four Rust commands to the frontend via `commands.rs` and wire `lib/ipc.ts`.

**UI:**
- None yet — commands will be tested via the browser console (`window.__TAURI__.invoke`)

**Logic:**
- `create_vault(password: String, path: String) -> Result<(), String>` — derives key, encrypts empty vault body, writes vault file
- `unlock_vault(password: String, path: String) -> Result<Vec<Entry>, String>` — reads vault, derives key, decrypts, deserializes entries
- `save_vault(password: String, path: String, entries: Vec<Entry>) -> Result<(), String>` — serializes entries, derives key, encrypts, atomic write
- `generate_password(length: u32, opts: GeneratorOpts) -> Result<String, String>` — returns random password string
- `lib/ipc.ts`: typed wrappers for each command with matching TypeScript return types
- `lib/types.ts`: `Entry`, `VaultConfig`, `GeneratorOpts` interfaces

**Exit criteria:** From the Tauri dev console: `invoke('create_vault', {...})` creates a `vault.cvault` file; `invoke('unlock_vault', {...})` returns an empty array; `invoke('unlock_vault', {...})` with wrong password returns an error string.

---

### 05 Lock Screen UI

Build the real `LockScreen` component. Wired to `unlock_vault` via `VaultContext`.

**UI:**
- Dark full-screen layout centered vertically
- App name and tagline at top
- Master password input (type=password, monospace font)
- Unlock button (primary orange accent)
- Error state: inline message below input ("Incorrect password") — never clears the input
- First-run variant: two inputs (password + confirm), warning text block below about no recovery

**Logic:**
- `VaultContext`: initial state `{ locked: true, entries: null, isDirty: false }`
- On unlock success: set `entries`, set `locked = false`, start auto-lock timer
- On unlock error: surface error message, do not change locked state
- First-run detection: `invoke('vault_exists', { path })` returns bool; renders create-vault form if false

**Exit criteria:** Typing the correct master password unlocks the vault and renders the (empty) vault shell. Typing the wrong password shows the error message. First-run shows the two-input create form with the no-recovery warning.

---

### 06 Entry List UI

Build `VaultShell`, `EntryList`, and `EntryRow` with mock data. No real entries yet.

**UI:**
- `VaultShell`: top bar with app name, lock button on the right; main content area; add button (bottom right or top right)
- `EntryList`: scrollable list of `EntryRow` components
- `EntryRow`: title (bold), username (muted, truncated); copy-username icon button; copy-password icon button; delete icon button
- Passwords are never shown in the list — copy button copies without revealing
- Empty state: centered message "No credentials yet. Add your first entry."
- Mock data: 3–5 hardcoded entries to validate layout and spacing

**Logic:**
- None yet — all interactions are no-ops with `console.log` stubs
- Lock button: calls `VaultContext.lockVault()` immediately (no timer needed here)

**Exit criteria:** Unlocking the vault renders the entry list with mock data. Each row shows title and username. Copy and delete buttons are visible. Empty state renders when the array is empty.

---

### 07 Add Entry Form

Build `AddEntry` with the inline `PasswordGenerator`. Mock data only — no save yet.

**UI:**
- Full-screen or slide-in panel (desktop: right panel; mobile: full screen)
- Fields: Title (required), Username, Password (type=password, monospace), URL
- Password field has a reveal toggle (eye icon) — hidden by default
- Below the password field: inline `PasswordGenerator` — length slider (8–64), character set toggles (uppercase, lowercase, numbers, symbols), "Generate" button that fills the password field
- Save button (primary) and Cancel button (secondary)
- Validation: Title is required — show inline error if empty on submit

**Logic:**
- `invoke('generate_password', { length, opts })` wired to the Generate button
- Form state managed with `useState` locally in the component
- On Save (mock): `console.log(entry)`, close panel

**Exit criteria:** Add entry form renders with all fields. Password generator generates a password and fills the field. Reveal toggle shows/hides the password. Submitting with no title shows a validation error.

---

### 08 Wire Entry CRUD to Vault

Connect add, edit, and delete to `VaultContext` and `save_vault`. Real persistence.

**UI:**
- `EntryDetail`: click a row in `EntryList` to open the detail/edit panel
- Same fields as `AddEntry`, pre-filled with existing values
- Delete button in `EntryDetail` opens `ConfirmDialog`: "Delete this entry? This cannot be undone." — two buttons: Delete (destructive red) and Cancel
- After delete, panel closes and entry is gone from the list

**Logic:**
- `VaultContext`: `addEntry(entry)`, `updateEntry(id, fields)`, `deleteEntry(id)` — each mutates the entries array, sets `isDirty = true`, debounces 500ms, then calls `ipc.saveVault(password, path, entries)`
- `password` and `path` held in `VaultContext` (received at unlock, never stored to disk)
- After save: `isDirty = false`
- On save error: surface error toast, keep `isDirty = true`

**Exit criteria:** Add an entry, lock the vault, unlock it — the entry is still there. Edit a field, re-lock and re-unlock — the edited value persists. Delete an entry — it is gone after re-lock and re-unlock.

---

### 09 Clipboard Auto-Clear

Wire copy buttons to `useClipboard` hook with countdown toast.

**UI:**
- `ClipboardToast`: appears bottom-center when clipboard is set — "Clipboard clears in 30s" — countdown ticks each second
- Two buttons on the toast: "Clear now" and "Keep" (dismisses toast without clearing)
- Toast disappears when the clipboard is cleared or "Keep" is pressed
- Only one toast at a time — a second copy replaces the first countdown

**Logic:**
- `useClipboard(timeout: number)`: calls `navigator.clipboard.writeText(value)`, sets a timeout to call `navigator.clipboard.writeText('')`, tracks countdown in state
- Called from `EntryRow` copy-username and copy-password buttons
- Timeout value read from `VaultContext` (from `config.json`)

**Exit criteria:** Clicking copy shows the toast with a live countdown. Clicking "Clear now" empties the clipboard immediately. Clicking "Keep" dismisses the toast and leaves the clipboard intact. A second copy resets the countdown.

---

### 10 Auto-Lock Timer

Implement `useAutoLock` — inactivity detection and vault lock on timeout.

**UI:**
- No visible UI for the timer itself
- When the timer fires, the app transitions to `LockScreen` (existing component)
- Lock button in the top bar remains functional as a manual trigger

**Logic:**
- `useAutoLock(timeoutMs: number, onLock: () => void)`: listens to `mousemove`, `keydown`, `mousedown`, `touchstart` on `window`; resets a timer on each event; calls `onLock()` when the timer expires
- On mobile: also listens to Tauri app `blur` event (app goes to background) and locks immediately
- `onLock()` calls `VaultContext.lockVault()`: sets `entries = null`, `locked = true`, clears the password from context

**Exit criteria:** With timeout set to 10 seconds for testing: no interaction for 10 seconds locks the vault and shows the lock screen. Any mouse/keyboard activity resets the timer. Lock button locks immediately.

---

## Phase 1 — Sync + Polish

### 11 Settings Screen

Build `Settings` with vault path picker and timeout controls.

**UI:**
- Three sections: "Vault", "Security", "Clipboard"
- Vault section: current vault file path (truncated), "Change path" button that opens a native file picker (Tauri dialog)
- Security section: lock timeout — a numeric input or slider (1–60 minutes), with a "5 min (default)" label
- Clipboard section: clipboard clear timeout — numeric input (15–120 seconds), with "30s (default)" label
- "Sync now" button at the bottom — manually triggers the sync check
- All changes save immediately to `config.json` via `invoke('save_config', config)`

**Logic:**
- `invoke('pick_vault_path')` — opens Tauri native file picker, returns selected path
- `invoke('save_config', { syncPath, lockTimeoutMs, clipboardTimeoutMs })` — writes `config.json`
- `invoke('load_config')` — reads `config.json`; called on app start to populate `VaultContext` with config values

**Exit criteria:** Changing the lock timeout in Settings and restarting the app applies the new timeout. Changing the vault path moves the vault file and the app still unlocks. Sync Now button is clickable (logic wired in next feature).

---

### 12 Sync — On-Open Pull and On-Save Push

Wire vault read/write to the sync path. Implement the on-open check.

**UI:**
- Small sync status indicator in the top bar: a sync icon that shows "synced", "syncing...", or "conflict" states
- No UI changes needed for on-save push — it's invisible (writes to sync path on every save)

**Logic:**
- `invoke('check_sync', { localPath, syncPath })` — reads both vault headers (plaintext), compares `modified_at` timestamps; returns `{ status: 'ok' | 'pull' | 'conflict', localTs?, syncTs? }`
- If `pull`: copy sync path vault to local path before unlocking
- `save_vault` already writes to the configured path — if that path is a Dropbox folder, Dropbox handles the rest
- `useSync` hook runs `check_sync` on app start, before the lock screen is shown

**Exit criteria:** With two machines pointing at the same Dropbox folder path: a credential added on machine A appears on machine B after opening the app. The sync status indicator shows "synced" after the check completes.

---

### 13 Conflict Resolution

Detect and resolve vault conflicts from simultaneous writes.

**UI:**
- `ConfirmDialog` variant: "Two versions of your vault exist."
- Shows both timestamps: "This device — saved 14:32:01 today" and "Cloud version — saved 14:32:00 today"
- Two buttons: "Keep this device's version" and "Keep cloud version"
- Blocking — the user cannot proceed until a choice is made

**Logic:**
- `invoke('check_sync')` detects OS conflict copies (Dropbox creates `vault (conflicted copy ...).cvault`)
- Returns `{ status: 'conflict', localTs, syncTs, conflictPath }`
- User choice calls `invoke('resolve_conflict', { keep: 'local' | 'sync', conflictPath, localPath, syncPath })`
- Discards the unchosen file; copies the chosen file to both paths

**Exit criteria:** Manually creating a second vault file with a conflict-copy filename triggers the conflict dialog on next app open. Choosing either option resolves correctly — the chosen vault unlocks, the other is deleted.

---

### 14 Search

Wire `SearchBar` to client-side entry filtering.

**UI:**
- `SearchBar`: text input at the top of `VaultShell`, always visible when unlocked
- Filters `EntryList` in real time as the user types — matches against `title` (case-insensitive, substring)
- Empty search shows all entries
- No results: "No entries match '[query]'"
- Clear button (×) inside the input field

**Logic:**
- `useState` for `searchQuery` in `VaultShell`
- `filteredEntries = entries.filter(e => e.title.toLowerCase().includes(query.toLowerCase()))`
- No debounce needed — purely client-side, synchronous

**Exit criteria:** Typing in the search bar filters entries in real time. Clearing the search shows all entries. The no-results message appears when nothing matches.

---

### 15 UI Polish Pass

Typography, spacing, transitions, and edge-case states.

**UI:**
- Audit every component against `ui-tokens.md` and `ui-rules.md` — fix any deviations
- Add transition: vault shell fades in after unlock (150ms opacity); lock screen fades in on lock
- `EntryRow` hover state: subtle background lift
- Disabled states: all buttons show `opacity-50 cursor-not-allowed` when their action is unavailable
- Error toast (bottom-center, red): for save failures and unexpected errors — auto-dismisses after 4 seconds
- Ensure passwords are never visible in any component unless the user has clicked the reveal toggle

**Logic:**
- No new logic — this feature is UI only

**Exit criteria:** Every screen matches the design tokens. No raw colors or font sizes hardcoded in components. Transitions play on lock/unlock. The app looks and feels cohesive end-to-end.

---

## Phase 2 — Mobile

### 16 Mobile Tauri Targets

Add iOS and Android build targets to the Tauri project.

**UI:**
- No UI changes yet — verify the existing UI renders in a mobile WebView without layout breaks

**Logic:**
- Add `ios` and `android` targets following Tauri 2.0 mobile setup docs
- Verify `cargo tauri ios dev` and `cargo tauri android dev` build without errors
- Tauri `allowlist` and `capabilities` scoped for mobile equivalents

**Exit criteria:** The app builds and runs on an iOS simulator and Android emulator. Existing functionality (lock/unlock, CRUD) works on both. No layout breaks on a 390px viewport.

---

### 17 Mobile UI Adaptations

Adapt the layout for touch interfaces.

**UI:**
- Bottom tab bar replaces the top nav for mobile: tabs for Vault, Add, Settings
- `EntryRow`: swipe left to reveal copy-username and copy-password action buttons (instead of always-visible icon buttons)
- All tap targets minimum 44×44px
- Password generator in `AddEntry` uses a full-width layout optimized for mobile
- Settings screen uses a grouped list layout (iOS-style sections)

**Logic:**
- Detect platform via `import { platform } from '@tauri-apps/plugin-os'`
- Render mobile or desktop layout conditionally based on platform
- Swipe gesture detection via touch event handlers on `EntryRow`

**Exit criteria:** On a physical iOS or Android device: all five screens are accessible via the bottom tab bar. Swipe-to-reveal works on entry rows. All buttons are comfortably tappable. No horizontal scrolling on any screen.

---

### 18 Mobile Auto-Lock on Background

Lock the vault when the app goes to background on mobile.

**UI:**
- No new UI — the existing `LockScreen` is shown when the user returns to the app

**Logic:**
- Listen to Tauri's app lifecycle events: `onResume` and `onPause` (or equivalent in Tauri 2.0 mobile API)
- On `onPause`: call `VaultContext.lockVault()` immediately
- On desktop: no change — existing inactivity timer remains

**Exit criteria:** On a physical device: opening the vault, pressing the home button, and returning to the app shows the lock screen. The vault unlocks normally after re-entering the master password.

---

### 19 Cross-Device Vault Compatibility Test

Verify a vault created on desktop opens correctly on mobile and vice versa.

**UI:**
- No new UI

**Logic:**
- Create a vault on desktop, add 5 entries, point both desktop and mobile at the same Dropbox path
- Open on mobile, verify all 5 entries appear
- Add an entry on mobile, open on desktop, verify the new entry appears
- Verify `vault.cvault` binary format is identical regardless of platform (it must be — Rust handles both)

**Exit criteria:** A vault created on macOS opens on iOS and Android with all entries intact. An entry added on Android appears on macOS after sync. No format or encoding differences between platforms.
