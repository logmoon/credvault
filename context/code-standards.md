# Code Standards — CredVault

## Engineering Mindset

1. **Read before writing.** Check existing context files, types, and components before creating anything new. The architecture is defined — follow it.
2. **One concern per file.** A component renders. A hook manages state. A utility transforms data. Never mix.
3. **Explicit over clever.** If the intent isn't obvious in 5 seconds, rewrite it to be obvious. No clever one-liners in security-sensitive code.
4. **Fail loudly in development, gracefully in production.** `console.error` and early returns in dev; user-facing error messages in prod. Never silent failures.
5. **Never commit a workaround without a comment.** If you're doing something non-obvious to work around a Tauri or platform limitation, write a `// REASON:` comment explaining exactly why.
6. **Security over convenience.** When a decision trades security for UX, the answer is always security. No exceptions.

---

## TypeScript

- **Strict mode is mandatory.** `tsconfig.json` must have `"strict": true`. No suppressions.
- **No `any`.** If you don't know the type, use `unknown` and narrow it. `any` is a lint error.
- **Explicit return types on all exported functions.** Internal helpers may rely on inference if the return type is obvious, but every export in `lib/ipc.ts` and `lib/types.ts` must be explicitly typed.
- **Use `type` for data shapes, `interface` for extendable contracts.** In practice: `type Entry = {...}`, `type VaultConfig = {...}`. `interface` is only used if something explicitly `extends` it — rare in this codebase.
- **No non-null assertions (`!`).** Use optional chaining (`?.`) and explicit null checks instead. If you're certain something is non-null, prove it with a narrowing check.
- **`undefined` over `null` for optional fields.** Align with TypeScript idioms. The one exception is `VaultContext.entries`, which is `Entry[] | null` to make the locked/unlocked distinction explicit.
- **Prefer `const` over `let`.** `let` only when reassignment is actually needed.

```typescript
// Correct
export type Entry = {
  id: string;
  createdAt: number;
  modifiedAt: number;
  title: string;
  username: string;
  password: string;
  url?: string;
};

export async function unlockVault(password: string, path: string): Promise<Entry[]> {
  return invoke<Entry[]>('unlock_vault', { password, path });
}

// Wrong
const unlockVault = async (password, path) => { // no types
  return invoke('unlock_vault', { password, path }); // no generic
};
```

---

## Rust

- **Clippy is the law.** All code must pass `cargo clippy -- -D warnings`. No `#[allow(...)]` suppressions without a `// REASON:` comment.
- **No `unwrap()` or `expect()` in non-test code.** Use `?` for propagation or explicit `match`/`if let` with meaningful error messages.
- **No `panic!` in library code.** Commands return `Result<T, String>` — all errors propagate to the frontend as error strings, never panics.
- **`unsafe` is banned.** No `unsafe` blocks. The RustCrypto crates used here do not require it.
- **All key material uses `secrecy::Secret<T>` or is immediately zeroed with `zeroize`.** A `Vec<u8>` holding key bytes that doesn't get zeroed is a bug.
- **Error types:** Define a crate-level `enum CryptoError` and `enum VaultError` with `thiserror`. Commands convert these to `String` at the command boundary only — inner functions propagate typed errors.

```rust
// Correct
pub fn decrypt(key: &[u8; 32], nonce: &[u8; 12], ciphertext: &[u8]) -> Result<Vec<u8>, CryptoError> {
    let cipher = Aes256Gcm::new(key.into());
    cipher
        .decrypt(nonce.into(), ciphertext)
        .map_err(|_| CryptoError::DecryptionFailed)
}

// Wrong
pub fn decrypt(key: &[u8], nonce: &[u8], ciphertext: &[u8]) -> Vec<u8> {
    let cipher = Aes256Gcm::new(key.into());
    cipher.decrypt(nonce.into(), ciphertext).unwrap() // panics on bad password
}
```

---

## React / Tauri Conventions

- **No direct `invoke` calls outside `lib/ipc.ts`.** Every Tauri command goes through a typed wrapper in `ipc.ts`. Components and hooks import from `ipc.ts`, never from `@tauri-apps/api/core` directly.
- **Context provides state, hooks provide behaviour.** `VaultContext` holds data. Hooks (`useAutoLock`, `useClipboard`, `useSync`) perform side effects and call context methods. Components read context and call hook functions.
- **No data fetching in components.** Components receive data as props or read from context. They never call `ipc.*` functions directly.
- **Server components do not exist.** This is a Tauri app — everything runs client-side. No `use server`, no `getServerSideProps`, no server-side patterns.
- **One `useEffect` = one concern.** Never combine multiple unrelated side effects in a single `useEffect`. Each `useEffect` must have a clear, single purpose and a correct cleanup function.

---

## File and Folder Naming

| Thing | Convention | Example |
|---|---|---|
| React components | PascalCase, `.tsx` | `EntryRow.tsx` |
| Hooks | camelCase, `use` prefix, `.ts` | `useAutoLock.ts` |
| Utilities / lib files | camelCase, `.ts` | `ipc.ts`, `types.ts` |
| Rust source files | snake_case, `.rs` | `crypto.rs`, `vault.rs` |
| Tailwind config | camelCase, `.ts` | `tailwind.config.ts` |
| Context files | PascalCase with `Context` suffix | `VaultContext.tsx` |
| CSS class names | Tailwind utilities only — no custom class names except for design tokens |

---

## Component Structure

Every `.tsx` file follows this order:

```typescript
// 1. External imports (React, Tauri, third-party)
import { useState, useCallback } from 'react';

// 2. Internal imports (types, context, hooks, other components)
import { type Entry } from '../lib/types';
import { useVault } from '../context/VaultContext';

// 3. Local type definitions (props interface)
type EntryRowProps = {
  entry: Entry;
  onSelect: (id: string) => void;
};

// 4. Component definition (function declaration, not arrow function for named export)
export function EntryRow({ entry, onSelect }: EntryRowProps) {
  // 4a. Hooks (useState, useContext, custom hooks) — at the top, no conditions
  const { copyToClipboard } = useClipboard(30_000);
  const [isDeleting, setIsDeleting] = useState(false);

  // 4b. Derived values and handlers
  const handleCopyPassword = useCallback(() => {
    copyToClipboard(entry.password);
  }, [entry.password, copyToClipboard]);

  // 4c. JSX return
  return (
    <div className="...">
      {/* ... */}
    </div>
  );
}
```

No default exports from component files. Named exports only.

---

## Error Handling

**Rust side:** All errors from crypto and vault operations are typed (`CryptoError`, `VaultError`). Tauri commands (`commands.rs`) convert these to `Result<T, String>` using `.map_err(|e| e.to_string())`. The error string is what the frontend receives.

**TypeScript side:** All `ipc.ts` wrappers wrap `invoke` in `try/catch`. Errors are returned as `{ success: false, error: string }` shaped objects or re-thrown depending on context:

```typescript
// For operations where the caller needs to handle errors:
export async function unlockVault(password: string, path: string): Promise<Entry[]> {
  // Throws on failure — caller shows error message
  return invoke<Entry[]>('unlock_vault', { password, path });
}

// For operations where failure is non-fatal (e.g. sync check):
export async function checkSync(localPath: string, syncPath: string): Promise<SyncStatus> {
  try {
    return await invoke<SyncStatus>('check_sync', { localPath, syncPath });
  } catch (e) {
    console.error('Sync check failed:', e);
    return { status: 'ok' }; // fail open — user can still use the vault
  }
}
```

**User-facing errors:** Shown as inline messages (lock screen, form fields) or error toasts (bottom-center, auto-dismiss 4 seconds). Never `alert()`. Never raw error strings exposed to the user — always a human-readable message.

---

## Environment Variables / Config

No environment variables are used at runtime — this is a local desktop app with no server. The only config is `config.json` at `~/.credvault/config.json`.

For build-time configuration, use Vite's `import.meta.env`:

```typescript
// vite.config.ts or .env files only — never in component code
VITE_APP_VERSION=1.0.0
```

The `config.json` schema:
```typescript
type VaultConfig = {
  vaultPath: string;           // absolute path to vault.cvault
  syncPath?: string;           // absolute path to sync folder (if configured)
  lockTimeoutMs: number;       // default: 300_000 (5 min)
  clipboardTimeoutMs: number;  // default: 30_000 (30 sec)
};
```

---

## Approved Dependencies

Adding any dependency not on this list requires updating this file first and confirming it aligns with the minimal-dependency philosophy.

**Frontend (npm):**
| Package | Purpose |
|---|---|
| `react` + `react-dom` | UI framework |
| `typescript` | Language |
| `vite` | Build tool |
| `@tauri-apps/api` | Tauri IPC and platform APIs |
| `@tauri-apps/plugin-os` | Platform detection (mobile vs desktop) |
| `tailwindcss` | Styling |
| `autoprefixer` + `postcss` | Tailwind pipeline |
| `lucide-react` | Icon set (outline icons only) |
| `uuid` | UUID v4 generation for entry IDs (client-side) |

**Rust (Cargo):**
| Crate | Purpose |
|---|---|
| `tauri` (2.x) | App framework |
| `argon2` | Argon2id key derivation |
| `aes-gcm` | AES-256-GCM encryption |
| `zeroize` | Secure memory wipe |
| `secrecy` | Wrapper for sensitive values |
| `rand` | OS-backed random (OsRng) |
| `serde` + `serde_json` | Vault body serialization |
| `thiserror` | Typed error enums |
| `uuid` | UUID v4 for entry IDs (Rust side) |

No analytics, telemetry, logging SDKs, CDN scripts, or HTTP client libraries.
