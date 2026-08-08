# CredVault

A local-first, zero-knowledge credential manager. One encrypted file, one master password, no accounts, no servers.

CredVault keeps your credentials in a single encrypted vault file on your own disk. The vault is protected by Argon2id + AES-256-GCM; it decrypts locally and re-encrypts on every save. Sync is a side effect: point the vault at a Dropbox, iCloud, or Google Drive folder and the sync provider moves an encrypted blob it cannot read.

## Features

- Create and unlock a vault with a single master password (Argon2id, 64 MB memory cost)
- AES-256-GCM authenticated encryption — a wrong password never returns data
- Add, edit, and delete credentials: title, username, password, URL
- One-click copy of username or password; clipboard auto-clears after a configurable timeout
- Built-in password generator (length 8–64, configurable character sets)
- Auto-lock after inactivity (configurable, default 5 minutes)
- Client-side instant search
- Sync via any user-configured folder path (local or cloud-synced), with conflict detection and resolution
- Atomic vault writes — a crash mid-save never corrupts the vault
- Zero-knowledge by design: no accounts, no telemetry, no network calls

## Download

Installers are attached to each [GitHub Release](https://github.com/logmoon/credvault/releases):

- **Linux**: `.deb` (Debian/Ubuntu), `.rpm` (Fedora/openSUSE), and `.AppImage`
- **Windows**: `.msi` and NSIS `.exe` installer

Linux packages require glibc 2.35+ (Ubuntu 22.04+, Debian 12+, Fedora 37+).

### Arch Linux

```bash
git clone https://github.com/logmoon/credvault.git
cd credvault
makepkg -si
```

Compiles and installs `credvault` from source with a launcher entry and `/usr/bin/credvault`. Once published to the AUR: `yay -S credvault`.

## Build from Source

### Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) 18+ and npm
- **Linux only:** WebKitGTK 4.1 and friends:

  ```bash
  sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
  ```

### Commands

```bash
npm install

# development (opens a window with hot reload)
npm run tauri dev

# production build for the current platform
npx tauri build
```

The build output lands in `src-tauri/target/release/bundle/`.

## Usage

1. Launch CredVault. On first run you are asked to create a vault with a master password.
2. **There is no password recovery.** Your master password is the only key to your vault. If you forget it, your data cannot be recovered — by anyone.
3. Add credentials with the **+** button. Passwords are never shown by default; use the eye toggle to reveal, or the copy button to copy without revealing.
4. The app locks itself after the configured inactivity timeout, and wipes the clipboard after the configured copy timeout.
5. For sync, set the vault path to a folder managed by Dropbox, iCloud, or Google Drive in **Settings**. The sync provider moves an encrypted blob it cannot read.

## Security Model

- The master password is never stored. A 32-byte AES key is derived with Argon2id, used once, and zeroed from memory immediately after each operation.
- All encryption and decryption happens in Rust. The frontend never sees a key, a salt, or raw cipher primitives.
- Decrypted credentials exist only in memory while the vault is unlocked. Locking the vault (manually or via inactivity) drops them from state.
- The vault file is binary and unreadable without the master password.
- No accounts, no servers, no telemetry. The app makes no network requests.

## Vault Format

The vault is a self-contained binary file (`.cvault`) with a plaintext header (magic bytes, Argon2 parameters, salt, timestamps) followed by an AES-256-GCM encrypted JSON payload. The format is versioned and documented in [`context/architecture.md`](context/architecture.md) — if the app stopped existing tomorrow, the vault could still be decrypted with standard CLI tools.

## License

[GPL-3.0](LICENSE)
