use crate::crypto;
use crate::generator;
use crate::vault;
use std::path::{Path, PathBuf};
use tauri::Manager;
use uuid::Uuid;

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
        version: 1,
        argon2_salt: salt,
        argon2_params: params,
        created_at: now,
    };

    let mut vault_bytes = vault::write_vault_header(&header);
    vault_bytes.extend_from_slice(&nonce);
    vault_bytes.extend_from_slice(&ciphertext);
    vault_bytes.extend_from_slice(&tag);
    vault::atomic_write(&path, &vault_bytes).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn unlock_vault(password: String, path: String) -> Result<Vec<vault::Entry>, String> {
    let path = PathBuf::from(&path);

    let (header, payload) = vault::read_vault(&path).map_err(|e| e.to_string())?;
    let (nonce, ciphertext, tag) = vault::split_payload(&payload).map_err(|e| e.to_string())?;

    let key =
        crypto::derive_key(&password, &header.argon2_salt, &header.argon2_params)
            .map_err(|e| e.to_string())?;

    let plaintext = crypto::decrypt(&key, nonce, ciphertext, tag).map_err(|e| e.to_string())?;

    let body: vault::VaultBody =
        serde_json::from_slice(&plaintext).map_err(|e| e.to_string())?;

    Ok(body.entries)
}

#[tauri::command]
pub fn save_vault(
    password: String,
    path: String,
    entries: Vec<vault::Entry>,
) -> Result<(), String> {
    let path = PathBuf::from(&path);

    let (header, payload) = vault::read_vault(&path).map_err(|e| e.to_string())?;
    let (nonce, ciphertext, tag) = vault::split_payload(&payload).map_err(|e| e.to_string())?;

    let key =
        crypto::derive_key(&password, &header.argon2_salt, &header.argon2_params)
            .map_err(|e| e.to_string())?;

    let plaintext = crypto::decrypt(&key, nonce, ciphertext, tag).map_err(|e| e.to_string())?;

    let mut body: vault::VaultBody =
        serde_json::from_slice(&plaintext).map_err(|e| e.to_string())?;

    body.entries = entries;
    body.modified_at = vault::now_timestamp();

    let json = serde_json::to_vec(&body).map_err(|e| e.to_string())?;
    let (new_nonce, new_ciphertext, new_tag) =
        crypto::encrypt(&key, &json).map_err(|e| e.to_string())?;

    let mut vault_bytes = vault::write_vault_header(&header);
    vault_bytes.extend_from_slice(&new_nonce);
    vault_bytes.extend_from_slice(&new_ciphertext);
    vault_bytes.extend_from_slice(&new_tag);
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
