use crate::config;
use crate::crypto;
use crate::generator;
use crate::vault;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use zeroize::Zeroizing;
use tauri::Manager;
use uuid::Uuid;

#[tauri::command]
pub fn clear_clipboard() -> Result<(), String> {
    let mut clipboard = arboard::Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.clear().map_err(|e| e.to_string())?;
    Ok(())
}

/// In-memory session state held after unlock, cleared on lock.
/// Caches the derived key and vault metadata so saves skip Argon2 entirely.
pub struct VaultSession {
    pub key: Zeroizing<[u8; 32]>,
    pub header: vault::VaultHeader,
    pub body_meta: VaultBodyMeta,
    pub path: PathBuf,
}

/// The parts of VaultBody that saves don't modify — cached so we never
/// need to re-read+decrypt the file just to preserve them.
pub struct VaultBodyMeta {
    pub schema_version: u32,
    pub vault_id: String,
    pub created_at: u64,
    pub deleted_entry_ids: Vec<String>,
}

pub struct SessionState(pub Mutex<Option<VaultSession>>);

#[tauri::command]
pub fn create_vault(password: String, path: String) -> Result<(), String> {
    let path = PathBuf::from(&path);

    // Ensure parent directory exists — user may have picked a folder that doesn't exist yet
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let vault_uuid = Uuid::new_v4();
    let vault_id_str = vault_uuid.to_string();
    let now = vault::now_timestamp();
    let body = vault::VaultBody {
        schema_version: 1,
        vault_id: vault_id_str,
        created_at: now,
        modified_at: now,
        entries: Vec::new(),
        deleted_entry_ids: Vec::new(),
    };

    let json = serde_json::to_vec(&body).map_err(|e| e.to_string())?;

    let salt = crypto::generate_salt();
    let params = crypto::Argon2Params::default();
    let key = crypto::derive_key(&password, &salt, &params).map_err(|e| e.to_string())?;

    let (nonce, ciphertext, tag) = crypto::encrypt(&key, &json).map_err(|e| e.to_string())?;

    let header = vault::VaultHeader {
        version: vault::CURRENT_VERSION,
        argon2_salt: salt,
        argon2_params: params,
        created_at: now,
        modified_at: now,
        vault_id: *vault_uuid.as_bytes(),
    };

    let mut vault_bytes = vault::write_vault_header(&header);
    vault_bytes.extend_from_slice(&nonce);
    vault_bytes.extend_from_slice(&ciphertext);
    vault_bytes.extend_from_slice(&tag);
    vault::atomic_write(&path, &vault_bytes).map_err(|e| e.to_string())?;

    Ok(())
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UnlockResult {
    pub entries: Vec<vault::Entry>,
    pub vault_id: String,
}

#[tauri::command]
pub fn unlock_vault(
    password: String,
    path: String,
    state: tauri::State<SessionState>,
) -> Result<UnlockResult, String> {
    let path = PathBuf::from(&path);

    let (header, payload) = vault::read_vault(&path).map_err(|e| e.to_string())?;
    let (nonce, ciphertext, tag) = vault::split_payload(&payload).map_err(|e| e.to_string())?;

    // Argon2 runs here — once on unlock, never again until next lock/unlock
    let key = crypto::derive_key(&password, &header.argon2_salt, &header.argon2_params)
        .map_err(|e| e.to_string())?;

    let plaintext = crypto::decrypt(&key, nonce, ciphertext, tag).map_err(|e| e.to_string())?;
    let body: vault::VaultBody =
        serde_json::from_slice(&plaintext).map_err(|e| e.to_string())?;

    let entries = body.entries.clone();
    let vault_id = body.vault_id.clone();

    // Cache key + metadata for the session
    let mut session = state.0.lock().map_err(|e| e.to_string())?;
    *session = Some(VaultSession {
        key,
        header,
        body_meta: VaultBodyMeta {
            schema_version: body.schema_version,
            vault_id: vault_id.clone(),
            created_at: body.created_at,
            deleted_entry_ids: body.deleted_entry_ids,
        },
        path,
    });

    Ok(UnlockResult { entries, vault_id })
}

#[tauri::command]
pub fn lock_vault(state: tauri::State<SessionState>) {
    if let Ok(mut session) = state.0.lock() {
        *session = None;
    }
}

#[tauri::command]
pub async fn save_vault(
    entries: Vec<vault::Entry>,
    state: tauri::State<'_, SessionState>,
) -> Result<(), String> {
    let vault_id_str: String;
    let (key, mut header, body_meta, path) = {
        let session = state.0.lock().map_err(|e| e.to_string())?;
        let s = session.as_ref().ok_or("Vault is not unlocked")?;
        vault_id_str = s.body_meta.vault_id.clone();
        (
            s.key.clone(),
            s.header.clone(),
            VaultBodyMeta {
                schema_version: s.body_meta.schema_version,
                vault_id: s.body_meta.vault_id.clone(),
                created_at: s.body_meta.created_at,
                deleted_entry_ids: s.body_meta.deleted_entry_ids.clone(),
            },
            s.path.clone(),
        )
    };

    // No Argon2, no disk read, no decrypt — straight to encrypt + write
    let modified_at = vault::now_timestamp();
    let body = vault::VaultBody {
        schema_version: body_meta.schema_version,
        vault_id: body_meta.vault_id,
        created_at: body_meta.created_at,
        modified_at,
        entries,
        deleted_entry_ids: body_meta.deleted_entry_ids,
    };

    // Always write latest format — upgrades v1/v2 on first save
    header.version = vault::CURRENT_VERSION;
    // Set vault_id in header from body metadata
    let uuid = uuid::Uuid::parse_str(&vault_id_str).map_err(|e| e.to_string())?;
    header.vault_id = *uuid.as_bytes();
    header.modified_at = modified_at;

    let json = serde_json::to_vec(&body).map_err(|e| e.to_string())?;
    let (nonce, ciphertext, tag) = crypto::encrypt(&key, &json).map_err(|e| e.to_string())?;

    let mut vault_bytes = vault::write_vault_header(&header);
    vault_bytes.extend_from_slice(&nonce);
    vault_bytes.extend_from_slice(&ciphertext);
    vault_bytes.extend_from_slice(&tag);

    vault::atomic_write(&path, &vault_bytes).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn generate_password(length: u32, opts: generator::GeneratorOpts) -> Result<String, String> {
    Ok(generator::generate_password(length, &opts))
}

#[tauri::command]
pub fn vault_exists(path: String) -> bool {
    Path::new(&path).exists()
}

#[tauri::command]
pub fn get_default_vault_path(app: tauri::AppHandle) -> Result<String, String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
    let vault_path = data_dir.join("vault.cvault");
    Ok(vault_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn load_config(app: tauri::AppHandle) -> Result<config::VaultConfig, String> {
    config::read_config_from_app(&app).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_config(app: tauri::AppHandle, config: config::VaultConfig) -> Result<(), String> {
    config::write_config_to_app(&app, &config).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn pick_vault_path(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let file = app
        .dialog()
        .file()
        .add_filter("CredVault", &["cvault"])
        .blocking_pick_file();
    Ok(file.map(|f| f.to_string()))
}

#[tauri::command]
pub async fn pick_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let dir = app.dialog().file().blocking_pick_folder();
    Ok(dir.map(|d| d.to_string()))
}

#[tauri::command]
pub fn change_vault_path(
    new_path: String,
    state: tauri::State<SessionState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let new_path = PathBuf::from(&new_path);

    // Get current session data
    let old_path = {
        let session = state.0.lock().map_err(|e| e.to_string())?;
        let s = session.as_ref().ok_or("Vault is not unlocked")?;
        s.path.clone()
    };

    if new_path == old_path {
        return Ok(());
    }

    // Copy vault file from old path to new path
    if old_path.exists() {
        std::fs::copy(&old_path, &new_path).map_err(|e| e.to_string())?;
    }

    // Update SessionState.path
    {
        let mut session = state.0.lock().map_err(|e| e.to_string())?;
        if let Some(s) = session.as_mut() {
            s.path = new_path.clone();
        }
    }

    // Update config.json with new vault path
    let mut cfg = config::read_config_from_app(&app).map_err(|e| e.to_string())?;
    cfg.vault_path = new_path.to_string_lossy().to_string();
    config::write_config_to_app(&app, &cfg).map_err(|e| e.to_string())?;

    Ok(())
}

/// Sanitize a user-provided vault name to a valid filename stem.
/// E.g. "My Personal Vault" → "my-personal-vault"
#[tauri::command]
pub fn sanitize_vault_name(name: String) -> String {
    let sanitized: String = name
        .to_lowercase()
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == ' ' || *c == '-' || *c == '_')
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join("-")
        .trim_matches('-')
        .to_string();
    if sanitized.is_empty() { "vault".to_string() } else { sanitized }
}

/// Switch the current vault to a different vault file.
/// Reads the vault header to identify it, updates config with the new path,
/// and returns vault metadata for the lock screen.
#[tauri::command]
pub fn switch_vault(path: String, app: tauri::AppHandle) -> Result<SwitchVaultResult, String> {
    let path_buf = PathBuf::from(&path);

    if !path_buf.exists() {
        return Ok(SwitchVaultResult {
            exists: false,
            vault_name: config::vault_name_from_path(&path),
            vault_id: String::new(),
        });
    }

    let (header, _) = vault::read_vault(&path_buf).map_err(|e| e.to_string())?;

    let vault_id = if header.version >= 3 {
        uuid::Uuid::from_bytes(header.vault_id).to_string()
    } else {
        String::new()
    };

    let vault_name = config::vault_name_from_path(&path);

    // Update config with the new vault path
    let mut cfg = config::read_config_from_app(&app).map_err(|e| e.to_string())?;
    cfg.vault_path = path;
    cfg.vault_name = vault_name.clone();

    // Add to recent vaults (dedup by path, newest first)
    if !vault_id.is_empty() {
        cfg.recent_vaults.retain(|v| v.path != cfg.vault_path);
        cfg.recent_vaults.insert(0, config::RecentVault {
            vault_id: vault_id.clone(),
            name: vault_name.clone(),
            path: cfg.vault_path.clone(),
        });
    }

    config::write_config_to_app(&app, &cfg).map_err(|e| e.to_string())?;

    Ok(SwitchVaultResult {
        exists: true,
        vault_name,
        vault_id,
    })
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SwitchVaultResult {
    pub exists: bool,
    pub vault_name: String,
    pub vault_id: String,
}

/// Scan a vault file's parent directory for all conflict copies by matching vault_id.
/// Returns a list of all conflict file paths, or an empty list if none found.
#[tauri::command]
pub fn check_conflicts(vault_path: String) -> Result<Vec<String>, String> {
    let vault_path = PathBuf::from(&vault_path);
    if !vault_path.exists() {
        return Ok(Vec::new());
    }

    let (header, _) = vault::read_vault(&vault_path).map_err(|e| e.to_string())?;

    // Only v3+ vaults have vault_id in the header — can't match v1/v2
    if header.version < 3 {
        return Ok(Vec::new());
    }

    let dir = vault_path.parent().ok_or("Cannot determine vault directory")?;
    let vault_file_name = vault_path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("");

    let mut conflicts = Vec::new();
    let entries = std::fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_name = entry.file_name().to_string_lossy().to_string();

        // Skip the vault file itself
        if file_name == vault_file_name {
            continue;
        }

        if !file_name.ends_with(".cvault") {
            continue;
        }

        // Read candidate header and compare vault_id
        if let Ok((candidate_header, _)) = vault::read_vault(&entry.path()) {
            if candidate_header.version >= 3 && candidate_header.vault_id == header.vault_id {
                conflicts.push(entry.path().to_string_lossy().to_string());
            }
        }
    }

    Ok(conflicts)
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictFileInfo {
    pub path: String,
    pub file_name: String,
    pub modified_at: u64,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictsInfo {
    pub vault_modified_at: u64,
    pub conflicts: Vec<ConflictFileInfo>,
}

/// Read headers from the vault and all conflicting copies for display.
/// Returns the vault's modified_at timestamp and a list of conflict file info.
#[tauri::command]
pub fn get_conflicts_info(
    vault_path: String,
    conflict_paths: Vec<String>,
) -> Result<ConflictsInfo, String> {
    let (vault_header, _) = vault::read_vault(&PathBuf::from(&vault_path))
        .map_err(|e| e.to_string())?;

    let mut conflicts = Vec::new();
    for cp in &conflict_paths {
        let path = PathBuf::from(cp);
        if let Ok((header, _)) = vault::read_vault(&path) {
            conflicts.push(ConflictFileInfo {
                path: cp.clone(),
                file_name: path
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default(),
                modified_at: header.modified_at,
            });
        }
    }

    Ok(ConflictsInfo {
        vault_modified_at: vault_header.modified_at,
        conflicts,
    })
}

/// Resolve vault conflicts by choosing which version to keep.
///
/// If `keeper_path` equals `vault_path`: keep the current vault, delete all conflicts.
/// If `keeper_path` is one of the conflict paths: copy that file over the vault.
///
/// In both cases, all conflict copies are deleted after resolution.
/// Returns "resolved" (current vault kept) or "locked" (conflict copied over — needs re-unlock).
#[tauri::command]
pub fn resolve_conflicts(
    vault_path: String,
    keeper_path: String,
    conflict_paths: Vec<String>,
) -> Result<String, String> {
    let vault_path = PathBuf::from(&vault_path);
    let keeper_path = PathBuf::from(&keeper_path);

    if keeper_path == vault_path {
        // Keep current vault — just delete all conflicts
        for cp in &conflict_paths {
            let p = PathBuf::from(cp);
            if p.exists() {
                std::fs::remove_file(&p).map_err(|e| e.to_string())?;
            }
        }
        Ok("resolved".to_string())
    } else {
        // Copy the chosen conflict over the vault
        std::fs::copy(&keeper_path, &vault_path).map_err(|e| e.to_string())?;
        // Delete all conflicts
        for cp in &conflict_paths {
            let p = PathBuf::from(cp);
            if p.exists() {
                std::fs::remove_file(&p).map_err(|e| e.to_string())?;
            }
        }
        Ok("locked".to_string())
    }
}

/// Reveal a file in the system file manager.
/// Windows: explorer /select,path (selects the file)
/// macOS: open -R path (reveals in Finder)
/// Linux: xdg-open parent_dir (opens the parent folder)
#[tauri::command]
pub fn show_in_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        // explorer requires /select,<path> as one combined argument (not two separate args).
        // It also requires backslashes — forward slashes cause it to silently fall back
        // to opening the default shell folder (Desktop).
        let win_path = path.replace('/', "\\");
        std::process::Command::new("explorer")
            .arg(format!("/select,{}", win_path))
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg("-R")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        let parent = std::path::Path::new(&path).parent()
            .ok_or_else(|| "No parent directory for vault path".to_string())?;
        std::process::Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}
