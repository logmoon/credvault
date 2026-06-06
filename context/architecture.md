# Architecture — CredVault

## Stack

| Layer | Technology | Purpose |
|---|---|---|
| Native shell | Tauri 2.0 | Cross-platform app container (desktop + iOS + Android) from one codebase |
| Frontend language | TypeScript (strict) | All UI code; typed IPC calls to Rust backend |
| Frontend framework | React 18 | Component tree, state management via hooks and context |
| Build tool | Vite | Dev server and production bundler for the React frontend |
| Styling | Tailwind CSS v3 | Utility-first styling; custom design tokens via `tailwind.config.ts` |
| Backend language | Rust (stable) | All cryptographic operations, file I/O, password generation |
| Key derivation | `argon2` crate (RustCrypto) | Argon2id — memory-hard KDF for master password |
| Encryption | `aes-gcm` crate (RustCrypto) | AES-256-GCM authenticated encryption/decryption |
| Secure memory | `zeroize` + `secrecy` crates | Zeroing key material from RAM after use; preventing accidental logging |
| Random generation | `rand` crate with `OsRng` | OS-backed CSPRNG for salts, nonces, and password generation |
| IPC | Tauri commands (`invoke`) | Typed bridge between React and Rust; the only way the frontend touches crypto or files |
| Serialization | `serde_json` | Vault body (de)serialized as JSON before encryption / after decryption |
| State management | React Context + `useState` | App-level vault state (locked/unlocked, entries, dirty flag, lock timer) |
| Deployment | Tauri build system | Produces native installers for macOS, Windows, Linux, iOS, Android |

## Folder Structure

```
credvault/
├── src/                          # React + TypeScript frontend
│   ├── components/               # Reusable UI components (no data fetching)
│   │   ├── LockScreen.tsx        # Master password input and unlock form
│   │   ├── VaultShell.tsx        # Authenticated wrapper; renders entry list + nav
│   │   ├── EntryList.tsx         # Scrollable list of credential rows
│   │   ├── EntryRow.tsx          # Single row: title, copy buttons, delete
│   │   ├── EntryDetail.tsx       # View/edit form for a selected entry
│   │   ├── AddEntry.tsx          # New entry form with inline password generator
│   │   ├── SearchBar.tsx         # Client-side search input
│   │   ├── Settings.tsx          # Vault path picker, timeouts, sync now
│   │   ├── PasswordGenerator.tsx # Configurable generator widget
│   │   ├── ClipboardToast.tsx    # Countdown toast for clipboard auto-clear
│   │   └── ConfirmDialog.tsx     # Generic confirmation modal (delete, conflict)
│   ├── context/
│   │   └── VaultContext.tsx      # Global vault state: locked, entries, dirty, timers
│   ├── hooks/
│   │   ├── useAutoLock.ts        # Inactivity timer; calls lockVault() on timeout
│   │   ├── useClipboard.ts       # Copy to clipboard + schedule auto-clear
│   │   └── useSync.ts            # On-open vault pull and conflict detection
│   ├── lib/
│   │   ├── ipc.ts                # Typed wrappers around Tauri `invoke` calls
│   │   └── types.ts              # Shared TypeScript types (Entry, VaultConfig, etc.)
│   ├── App.tsx                   # Root: renders LockScreen or VaultShell based on state
│   └── main.tsx                  # React entry point
│
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs               # Tauri app setup; registers all commands
│   │   ├── commands.rs           # #[tauri::command] handlers (thin; delegate to crypto/vault)
│   │   ├── crypto.rs             # Argon2id KDF, AES-256-GCM encrypt/decrypt, zeroize
│   │   ├── vault.rs              # Vault file read/write, header parsing, atomic save
│   │   └── generator.rs          # Password generation from configurable character set
│   └── Cargo.toml                # Rust dependencies
│
├── context/                      # Agent context files (this folder)
├── public/                       # Static assets (icons, fonts)
├── index.html                    # Vite entry HTML
├── tailwind.config.ts            # Design tokens — colors, spacing, font
├── vite.config.ts                # Vite + Tauri plugin config
└── tsconfig.json                 # TypeScript strict config
```

## System Boundaries

| Layer | Owns | Must Never |
|---|---|---|
| `components/` | UI rendering and user interaction only | Call Tauri `invoke` directly; fetch data; hold vault entries in local state |
| `context/VaultContext.tsx` | Global vault state: locked/unlocked, entries array, dirty flag, timers | Write to disk; call crypto; know about the vault file format |
| `hooks/` | Stateful side-effect logic (timers, clipboard, sync checks) | Render any JSX; hold entries; write to the vault directly |
| `lib/ipc.ts` | All `invoke` calls to Rust, typed and named | Contain any business logic; transform data beyond what TypeScript typing requires |
| `lib/types.ts` | Shared TypeScript type definitions | Import anything from the app; zero dependencies |
| `commands.rs` | Tauri command surface (parameter validation, return shaping) | Contain crypto logic; read or write files directly |
| `crypto.rs` | All cryptographic operations: KDF, encrypt, decrypt, zeroize | Be called from anywhere except `commands.rs`; return key material to JS |
| `vault.rs` | Vault file layout, atomic read/write, header parsing, conflict detection | Know anything about cryptography algorithms; call Argon2 or AES directly |
| `generator.rs` | Password string generation | Have access to vault data or key material |

## Data Flow

### Unlock Vault
```
User types master password
  → LockScreen component calls ipc.unlockVault(password, path)
    → invoke('unlock_vault', { password, path })
      → commands.rs: unlock_vault(password, path)
        → vault.rs: read_vault_file(path) → raw bytes + parsed header
        → crypto.rs: derive_key(password, salt, argon2_params) → 32-byte key
        → crypto.rs: decrypt(key, nonce, ciphertext) → plaintext JSON bytes
        → crypto.rs: zeroize(key)
        → serde_json: deserialize JSON → Vec<Entry>
        → return Vec<Entry> to frontend
      → ipc.ts receives Entry[]
    → VaultContext: set entries, set locked = false, start lock timer
  → App renders VaultShell
```

### Save Vault (after any mutation)
```
User edits/adds/deletes an entry
  → component dispatches to VaultContext: update entries, set isDirty = true
  → debounce 500ms
  → VaultContext calls ipc.saveVault(password, path, entries)
    → invoke('save_vault', { password, path, entries })
      → commands.rs: save_vault(password, path, entries)
        → serde_json: serialize entries → JSON bytes
        → crypto.rs: derive_key(password, salt, argon2_params) → key
        → crypto.rs: encrypt(key, plaintext) → nonce + ciphertext + auth_tag
        → crypto.rs: zeroize(key)
        → vault.rs: atomic_write(path, header + nonce + ciphertext + auth_tag)
          (write to .tmp, then rename to vault.cvault)
        → return Ok
    → VaultContext: set isDirty = false
```

### Lock Vault
```
Inactivity timer fires (or user clicks Lock)
  → useAutoLock hook calls VaultContext.lockVault()
    → VaultContext: set entries = null, set locked = true, clear timers
    → (JS GC collects decrypted entries from heap)
    → App renders LockScreen
    (Rust side has already zeroed the key immediately after each encrypt/decrypt)
```

### On-Open Sync Check
```
App starts → useSync hook runs
  → reads config.json for sync path
  → invoke('check_sync', { localPath, syncPath })
    → vault.rs: compare modified_at timestamps in both vault headers (plaintext)
    → if syncPath is newer: return { conflict: false, shouldPull: true }
    → if timestamps within same second: check for OS conflict copy filenames
    → if conflict copy found: return { conflict: true, localTs, syncTs }
  → if shouldPull: copy syncPath vault to localPath, reload
  → if conflict: show ConfirmDialog → user chooses → discard the other
```

## Vault File Format

```
vault.cvault (binary)
├── Header (plaintext, fixed layout)
│   ├── magic:        "CREDVLT"   7 bytes
│   ├── version:      u8          1 byte
│   ├── argon2_salt:  [u8; 16]    16 bytes
│   ├── argon2_mem:   u32 LE      4 bytes  (KB — default 65536 = 64MB)
│   ├── argon2_iter:  u32 LE      4 bytes  (default 3)
│   ├── argon2_par:   u32 LE      4 bytes  (default 4)
│   └── created_at:   u64 LE      8 bytes  (unix timestamp)
│
└── Encrypted payload (AES-256-GCM)
    ├── nonce:        [u8; 12]    12 bytes  (random per save)
    ├── ciphertext:   variable    encrypted JSON vault body
    └── auth_tag:     [u8; 16]    16 bytes  (GCM integrity tag)
```

Vault body JSON shape (pre-encryption):
```json
{
  "schema_version": 1,
  "vault_id": "uuid-v4",
  "created_at": 1700000000,
  "modified_at": 1700000000,
  "entries": [
    {
      "id": "uuid-v4",
      "created_at": 1700000000,
      "modified_at": 1700000000,
      "title": "Work Gmail",
      "url": "https://mail.google.com",
      "username": "user@example.com",
      "password": "hunter2"
    }
  ],
  "deleted_entry_ids": []
}
```

## Local Storage Layout

```
~/.credvault/          (or %APPDATA%\CredVault\ on Windows)
├── vault.cvault              Encrypted vault (primary)
├── vault.cvault.bak          Previous vault (one-session safety net)
└── config.json            Non-sensitive config: sync path, lock timeout, clipboard timeout
```

`config.json` is never encrypted. It contains no credentials or key material.

## Authentication

- **Provider:** None. There is no account, server, or session token.
- **Method:** Master password → Argon2id → 32-byte AES key → AES-256-GCM decryption.
- **Protected routes:** All vault content. The `LockScreen` is always rendered when `VaultContext.locked === true`. No vault data is accessible or visible in the locked state.
- **Public routes:** Lock screen only.
- **Session handling:** The decrypted entries live in React state (VaultContext). The Rust key is zeroed immediately after each operation. On lock, React state is set to null.
- **After unlock:** App transitions to `VaultShell`. Lock timer starts. Any inactivity beyond the configured timeout re-locks the vault.

## Invariants

1. **Crypto never leaves Rust.** All key derivation, encryption, and decryption happen in `crypto.rs`. The JS layer never sees a key, a salt used for derivation, or raw cipher primitives.
2. **The master key never persists.** The 32-byte AES key is derived, used, and zeroed within a single Rust function call. It is never stored, cached, returned, or passed between functions.
3. **Plaintext entries never touch disk.** Decrypted vault JSON exists only in Rust memory (briefly, during encrypt/decrypt) and in React state. Never written to any file, never logged.
4. **All file writes are atomic.** `vault.rs` always writes to a `.tmp` file and renames it. A crash mid-write leaves the previous vault intact.
5. **The frontend never calls file or crypto APIs directly.** All disk access and crypto operations go through `lib/ipc.ts` → Tauri `invoke` → Rust commands. No direct filesystem calls from React.
6. **Components never hold entries in local state.** Credential data lives only in `VaultContext`. Components receive entries as props or read from context — they do not store a copy.
7. **An incorrect master password always fails before returning data.** AES-GCM authentication tag verification happens in Rust before any JSON is deserialized. A wrong password returns an error string, never partial data.
8. **Lock is always reachable.** The auto-lock timer runs in `useAutoLock` and cannot be suppressed by any UI state. Even if the user is mid-edit, inactivity beyond the timeout triggers a lock.
9. **Config is never sensitive.** `config.json` holds only timeout values and the vault file path. It must never be used to store any part of the vault, any key material, or any plaintext credential.
10. **No network calls from the renderer.** The Tauri `allowlist` scopes filesystem access to the vault path and app data directory only. No HTTP requests originate from the frontend — sync is entirely via the local filesystem path the user configures.
