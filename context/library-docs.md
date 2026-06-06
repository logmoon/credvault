# Library Docs — CredVault

## Tauri 2.0

### Setup / Initialisation

Tauri 2.0 is initialised via `cargo tauri dev` (development) and `cargo tauri build` (production). The frontend communicates with Rust exclusively through `invoke`.

```typescript
// src/lib/ipc.ts — all invoke calls live here
import { invoke } from '@tauri-apps/api/core';

export async function unlockVault(password: string, path: string): Promise<Entry[]> {
  return invoke<Entry[]>('unlock_vault', { password, path });
}
```

```rust
// src-tauri/src/main.rs — register all commands here
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::create_vault,
            commands::unlock_vault,
            commands::save_vault,
            commands::generate_password,
            commands::check_sync,
            commands::resolve_conflict,
            commands::save_config,
            commands::load_config,
            commands::vault_exists,
            commands::pick_vault_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Common Patterns

**Tauri command definition (Rust):**
```rust
// src-tauri/src/commands.rs
#[tauri::command]
pub async fn unlock_vault(password: String, path: String) -> Result<Vec<Entry>, String> {
    let path = PathBuf::from(&path);
    vault::read_vault(&path)
        .and_then(|(header, payload)| {
            crypto::decrypt_vault(&password, &header, &payload)
        })
        .map_err(|e| e.to_string())
}
```

**File picker (Tauri dialog):**
```typescript
import { open } from '@tauri-apps/plugin-dialog';

const path = await open({
  directory: false,
  filters: [{ name: 'CredVault', extensions: ['cvault'] }],
});
```

**Platform detection:**
```typescript
import { platform } from '@tauri-apps/plugin-os';

const isMobile = ['ios', 'android'].includes(await platform());
```

### Rules
- Never call `invoke` outside `lib/ipc.ts`
- All command arguments must be plain serializable values — no `undefined`, no class instances, no functions
- Tauri 2.0 uses capability-based permissions: keep `tauri.conf.json` `allowlist` scoped to only the vault path and app data dir — no wildcards
- `invoke` always returns a Promise — always `await` it; never `.then()` chains
- Tauri commands return `Result<T, String>` in Rust — `invoke` throws on `Err`, so always wrap in try/catch or let the error propagate intentionally

---

## argon2 (RustCrypto)

### Setup / Initialisation

```rust
use argon2::{Argon2, Algorithm, Version, Params};

fn build_argon2() -> Argon2<'static> {
    let params = Params::new(
        65_536,  // m_cost: 64 MB
        3,       // t_cost: 3 iterations
        4,       // p_cost: 4 parallel lanes
        Some(32) // output length: 32 bytes (256-bit key)
    ).expect("valid argon2 params");

    Argon2::new(Algorithm::Argon2id, Version::V0x13, params)
}
```

### Common Patterns

**Key derivation:**
```rust
use argon2::PasswordHasher;
use rand::RngCore;
use zeroize::Zeroizing;

pub fn derive_key(password: &str, salt: &[u8; 16]) -> Result<Zeroizing<[u8; 32]>, CryptoError> {
    let argon2 = build_argon2();
    let mut key = Zeroizing::new([0u8; 32]);
    argon2
        .hash_password_into(password.as_bytes(), salt, key.as_mut())
        .map_err(|_| CryptoError::KeyDerivationFailed)?;
    Ok(key)
}
```

**Generating a random salt:**
```rust
use rand::{RngCore, rngs::OsRng};

let mut salt = [0u8; 16];
OsRng.fill_bytes(&mut salt);
```

### Rules
- Always use `Argon2id` (not Argon2i or Argon2d) — it is the recommended variant
- Always use `Zeroizing<T>` to wrap the output key — it zeroes on drop automatically
- Never log, print, or return the derived key — it must stay in `crypto.rs`
- The salt is stored in the vault file header in plaintext — this is correct and expected
- The Argon2 parameters (memory, iterations, parallelism) are read from the vault header on each unlock so that future parameter upgrades remain backwards-compatible

---

## aes-gcm (RustCrypto)

### Setup / Initialisation

```rust
use aes_gcm::{Aes256Gcm, KeyInit, AeadCore, AeadInPlace};
use aes_gcm::aead::Aead;
```

### Common Patterns

**Encrypt:**
```rust
use aes_gcm::{Aes256Gcm, KeyInit, Nonce};
use aes_gcm::aead::Aead;
use rand::{RngCore, rngs::OsRng};

pub fn encrypt(key: &[u8; 32], plaintext: &[u8]) -> Result<(Vec<u8>, Vec<u8>), CryptoError> {
    let cipher = Aes256Gcm::new(key.into());

    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|_| CryptoError::EncryptionFailed)?;

    Ok((nonce_bytes.to_vec(), ciphertext)) // ciphertext includes the 16-byte auth tag appended
}
```

**Decrypt:**
```rust
pub fn decrypt(key: &[u8; 32], nonce: &[u8; 12], ciphertext: &[u8]) -> Result<Vec<u8>, CryptoError> {
    let cipher = Aes256Gcm::new(key.into());
    let nonce = Nonce::from_slice(nonce);

    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| CryptoError::DecryptionFailed) // tag mismatch → wrong password
}
```

### Rules
- The nonce must be unique per encryption — always generate via `OsRng`, never reuse
- `aes-gcm`'s `encrypt()` appends the 16-byte auth tag to the ciphertext automatically — do not add it separately
- A decryption error (tag mismatch) always means "wrong password" from the user's perspective — surface it as such
- Never use a static or hardcoded nonce — even for testing
- The key passed to `Aes256Gcm::new()` must be exactly 32 bytes — enforce this at the type level with `&[u8; 32]`

---

## zeroize + secrecy (RustCrypto)

### Setup / Initialisation

```rust
use zeroize::{Zeroize, Zeroizing};
use secrecy::{Secret, ExposeSecret};
```

### Common Patterns

**Automatic zeroing on drop:**
```rust
// Zeroizing<T> wraps any T: Zeroize and zeroes it when dropped
let key: Zeroizing<[u8; 32]> = derive_key(password, &salt)?;
// key is automatically zeroed when it goes out of scope
```

**Wrapping a sensitive string (master password):**
```rust
// Prevents the password from being accidentally logged or cloned carelessly
use secrecy::SecretString;

pub fn unlock_vault(password: SecretString, path: &Path) -> Result<Vec<Entry>, VaultError> {
    let key = derive_key(password.expose_secret(), &salt)?;
    // ...
}
```

**Manual zeroing when Zeroizing<T> isn't convenient:**
```rust
let mut raw_key = [0u8; 32];
// ... fill raw_key ...
raw_key.zeroize(); // explicit zero before it goes out of scope
```

### Rules
- Every `[u8; 32]` or `Vec<u8>` holding key material must be wrapped in `Zeroizing<T>` or manually `zeroize()`d before it goes out of scope
- The master password string received from Tauri should be treated as sensitive — zero it or drop it as early as possible after key derivation
- `secrecy::Secret<T>` prevents `Debug` printing of sensitive values — use it for types that should never appear in logs
- Do not `.clone()` a `Zeroizing<T>` unless absolutely necessary — cloning creates an unwrapped copy

---

## serde / serde_json

### Setup / Initialisation

```rust
use serde::{Serialize, Deserialize};
use serde_json;
```

### Common Patterns

**Vault body struct:**
```rust
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct VaultBody {
    pub schema_version: u32,
    pub vault_id: String,
    pub created_at: u64,
    pub modified_at: u64,
    pub entries: Vec<Entry>,
    pub deleted_entry_ids: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    pub id: String,
    pub created_at: u64,
    pub modified_at: u64,
    pub title: String,
    pub username: String,
    pub password: String,
    pub url: Option<String>,
}
```

**Serialize to bytes for encryption:**
```rust
let json_bytes = serde_json::to_vec(&vault_body)
    .map_err(|e| VaultError::SerializationFailed(e.to_string()))?;
// encrypt json_bytes
```

**Deserialize after decryption:**
```rust
let vault_body: VaultBody = serde_json::from_slice(&plaintext_bytes)
    .map_err(|e| VaultError::DeserializationFailed(e.to_string()))?;
```

### Rules
- Use `#[serde(rename_all = "camelCase")]` on all structs so Rust snake_case fields map to TypeScript camelCase automatically
- Serialize to `Vec<u8>` (via `to_vec`) not to `String` (via `to_string`) — the bytes go directly into the encryption function
- If deserialization fails, it is a vault corruption or format version mismatch — return a clear `VaultError`, never panic

---

## React Context

### Setup / Initialisation

```typescript
// src/context/VaultContext.tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type VaultState = {
  locked: boolean;
  entries: Entry[] | null;
  isDirty: boolean;
  config: VaultConfig | null;
  lockVault: () => void;
  unlockVault: (entries: Entry[], password: string, config: VaultConfig) => void;
  addEntry: (entry: Entry) => void;
  updateEntry: (id: string, fields: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
};

const VaultContext = createContext<VaultState | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  // ... implementation
  return <VaultContext.Provider value={state}>{children}</VaultContext.Provider>;
}

export function useVault(): VaultState {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used within VaultProvider');
  return ctx;
}
```

### Common Patterns

**Consuming context in a component:**
```typescript
import { useVault } from '../context/VaultContext';

export function EntryList() {
  const { entries, deleteEntry } = useVault();
  // ...
}
```

**Triggering a save after mutation (debounced):**
```typescript
// Inside VaultProvider
const saveDebounceRef = useRef<ReturnType<typeof setTimeout>>();

const triggerSave = useCallback((entries: Entry[]) => {
  clearTimeout(saveDebounceRef.current);
  saveDebounceRef.current = setTimeout(async () => {
    await ipc.saveVault(passwordRef.current, configRef.current.vaultPath, entries);
  }, 500);
}, []);
```

### Rules
- `VaultContext` is the single source of truth for all vault state — no component duplicates entries in local state
- The master password is held in a `useRef` inside `VaultProvider` — refs don't trigger re-renders and the value doesn't need to be reactive
- `entries` is `null` (not `[]`) when the vault is locked — this distinction matters for locked/unlocked conditional rendering
- Always call `lockVault()` (which nulls entries) rather than directly setting state in components

---

## Tailwind CSS v3

### Setup / Initialisation

All design tokens are defined in `tailwind.config.ts` as theme extensions. Never use raw Tailwind color names (e.g. `bg-zinc-900`) in components — always use the semantic token names defined below.

```typescript
// tailwind.config.ts
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // See ui-tokens.md for all values
        accent: { DEFAULT: '#E8600A', dark: '#C4500A', light: '#FF7A28', muted: '#E8600A33' },
        surface: { DEFAULT: '#1C1C1C', raised: '#252525', overlay: '#2E2E2E' },
        // ... etc
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
};
```

### Common Patterns

**A standard card:**
```tsx
<div className="bg-surface-raised border border-white/8 rounded-lg p-4">
  {/* content */}
</div>
```

**Accent button:**
```tsx
<button className="bg-accent hover:bg-accent-dark text-white font-medium px-4 py-2 rounded-md transition-colors">
  Unlock
</button>
```

**Monospace password field:**
```tsx
<input
  type="password"
  className="font-mono bg-surface border border-white/12 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:border-accent/60"
/>
```

### Rules
- Never use raw Tailwind palette names in components (`bg-zinc-900`, `text-gray-400`) — always use semantic token names from `tailwind.config.ts`
- Opacity modifiers on borders (`border-white/8`) are preferred over a separate border color token for dark-mode borders
- No custom CSS files — all styling goes through Tailwind utilities
- Transitions only on interactive elements: `transition-colors` for color changes, `transition-opacity` for show/hide

---

## lucide-react

### Setup / Initialisation

```typescript
import { Eye, EyeOff, Copy, Trash2, Lock, Plus, Search, Settings, X } from 'lucide-react';
```

### Common Patterns

**Icon in a button:**
```tsx
<button aria-label="Copy password" className="p-2 rounded hover:bg-white/8 transition-colors">
  <Copy size={16} className="text-text-muted" />
</button>
```

**Icon with text:**
```tsx
<button className="flex items-center gap-2 ...">
  <Plus size={16} />
  Add entry
</button>
```

### Rules
- Use size `16` for inline/action icons, size `20` for nav/header icons
- Always add `aria-label` to icon-only buttons
- Use `className` on the icon to set color — never `color` prop
- Only outline icons — lucide-react is all outline by default, no filled variants needed
