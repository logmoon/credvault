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

    let vault_id = Uuid::new_v4().to_string();
    let now = vault::now_timestamp();
    let body = vault::VaultBody {
        schema_version: 1,
        vault_id,
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
        version: 2,
        argon2_salt: salt,
        argon2_params: params,
        created_at: now,
        modified_at: now,
    };

    let mut vault_bytes = vault::write_vault_header(&header);
    vault_bytes.extend_from_slice(&nonce);
    vault_bytes.extend_from_slice(&ciphertext);
    vault_bytes.extend_from_slice(&tag);
    vault::atomic_write(&path, &vault_bytes).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn unlock_vault(
    password: String,
    path: String,
    state: tauri::State<SessionState>,
) -> Result<Vec<vault::Entry>, String> {
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

    // Cache key + metadata for the session
    let mut session = state.0.lock().map_err(|e| e.to_string())?;
    *session = Some(VaultSession {
        key,
        header,
        body_meta: VaultBodyMeta {
            schema_version: body.schema_version,
            vault_id: body.vault_id,
            created_at: body.created_at,
            deleted_entry_ids: body.deleted_entry_ids,
        },
        path,
    });

    Ok(entries)
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
    let (key, mut header, body_meta, path) = {
        let session = state.0.lock().map_err(|e| e.to_string())?;
        let s = session.as_ref().ok_or("Vault is not unlocked")?;
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

    // Update header's modified_at so the plaintext header stays in sync
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

/// Scan a vault file's parent directory for a cloud-sync conflict copy.
/// Returns the conflict file path, or null if none found.
/// Matches any `.cvault` file containing "conflict" in its name (case-insensitive).
#[tauri::command]
pub fn check_conflict(vault_path: String) -> Result<Option<String>, String> {
    let vault_path = PathBuf::from(&vault_path);
    let dir = vault_path.parent().ok_or("Cannot determine vault directory")?;

    let entries = std::fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_lowercase();
        if name.contains("conflict") && name.ends_with(".cvault") {
            return Ok(Some(entry.path().to_string_lossy().to_string()));
        }
    }

    Ok(None)
}
