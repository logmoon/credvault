# Project Overview — CredVault

## About the Project

CredVault is a local-first, zero-knowledge credential manager for a single user across multiple devices. The user creates one vault — an encrypted file on disk — protected by a single master password. Inside the vault are credential entries: title, username, password, and URL. The app unlocks the vault with the master password, decrypts the entries into memory, and re-encrypts on every save. When the app locks, nothing sensitive remains in memory or on disk. Sync is achieved by pointing the vault file at a folder already managed by Dropbox, iCloud, or Google Drive — the sync provider moves an encrypted blob it cannot read.

## The Problem It Solves

Every mainstream password manager either runs a server that holds (or could hold) your credentials, or relies on a browser extension with a large attack surface. Users who care about privacy have no simple, auditable option: a single encrypted file, decrypted locally, synced as a dumb blob. CredVault fills that gap — no accounts, no servers, no extensions, no cloud vendor who knows your passwords. If the app stops existing tomorrow, the vault format is documented and decryptable with standard CLI tools.

## Pages / Screens

```
/lock-screen          Master password input, unlock button, first-run warning
/vault                Main credential list — search bar, entry rows, add button
/vault/entry/:id      Entry detail — view and edit a single credential
/vault/add            Add new entry form with inline password generator
/settings             Vault file path, lock timeout, clipboard timeout, sync now
```

On mobile, navigation is tab-based (bottom bar) rather than route-based, but the same five views exist.

## Core User Flow

### First Run
1. App opens to lock screen with no vault present
2. User is prompted to create a vault — enters and confirms master password
3. One-time warning is shown: "There is no password recovery. If you forget your master password, your data cannot be recovered — by anyone."
4. Vault file is created at the default path (`~/.credvault/vault.cvault`)
5. Vault unlocks and the empty entry list is shown

### Daily Use
1. App opens to lock screen
2. User types master password → vault decrypts → entry list appears
3. User searches for a credential, clicks copy username or copy password
4. Clipboard auto-clears after 30 seconds; a toast countdown is visible
5. User closes the app or walks away — vault auto-locks after 5 minutes of inactivity

### Adding / Editing a Credential
1. User clicks "Add" → add entry form opens
2. Fills in title, username, URL; uses inline password generator for the password field
3. Saves → vault re-encrypts and writes atomically to disk
4. Entry appears immediately in the list

### Sync (after settings configured)
1. User points vault path to a Dropbox/iCloud/Google Drive folder in Settings
2. On next app open, app checks if a newer vault exists at that path and pulls it
3. On every save, vault is written to the sync path
4. If a conflict copy is detected, user sees a simple two-option prompt: keep this device's version or keep the cloud version

## Features In Scope

- Create vault with master password (Argon2id + AES-256-GCM)
- Unlock and lock vault with master password
- Add, edit, delete credential entries (title, username, password, URL)
- One-click copy username to clipboard
- One-click copy password to clipboard (does not reveal the password)
- Clipboard auto-clear after configurable timeout (default 30 seconds) with toast countdown
- Password generator with configurable length and character set (uppercase, lowercase, numbers, symbols)
- Auto-lock after configurable inactivity timeout (default 5 min desktop, 1 min mobile)
- Search entries by title (client-side, instant)
- Settings screen: vault file path picker, lock timeout, clipboard timeout
- Sync via user-configured folder path (any local or cloud-synced path)
- Conflict detection with simple keep-this / keep-cloud resolution prompt
- Mobile UI adaptations: bottom tab nav, larger touch targets, swipe-to-copy, lock on background
- Atomic vault writes (write-to-tmp then rename) to prevent corruption

## Features Out of Scope

- Secure notes or any non-credential entry type
- File or folder encryption
- Browser autofill extension
- Shared or team vaults
- Any server operated by the developer
- Password recovery flow of any kind
- TOTP / 2FA code display (post-launch)
- Biometric unlock (post-launch)
- Import from Bitwarden JSON or Chrome CSV (post-launch)
- Vault health view — weak password detection, duplicate detection (post-launch)
- Light mode (dark-first; light mode is a future option)
- Custom categories or tags on entries
- Attachments of any kind

## Target User

A solo developer, sysadmin, or technically literate individual who manages many credentials across multiple machines, distrusts cloud password managers on principle, and wants an auditable, self-contained solution they can understand top to bottom. They are comfortable setting up a Dropbox folder, understand what encryption means at a high level, and will not call support if they forget their master password — they already know that's the deal.

## Success Criteria

- A vault can be created, locked, and unlocked on desktop with the correct master password
- An incorrect master password never unlocks the vault (AES-GCM auth tag failure)
- Credential entries survive a full lock-unlock cycle with no data loss
- The vault file on disk is not human-readable without the master password
- Clipboard is cleared automatically after the configured timeout
- The vault file written by the desktop app can be unlocked on mobile pointing at the same sync path
- A simulated conflict (two vault files with different timestamps) surfaces the resolution prompt
- Auto-lock triggers after the configured inactivity period with no user interaction
