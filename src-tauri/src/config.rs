use serde::{Deserialize, Serialize};
use std::path::Path;
use tauri::Manager;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ConfigError {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    #[error("serialization error: {0}")]
    Serialization(String),
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct VaultConfig {
    pub vault_path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_path: Option<String>,
    pub lock_timeout_ms: u64,
    pub clipboard_timeout_ms: u64,
    pub clipboard_auto_clear: bool,
}

impl Default for VaultConfig {
    fn default() -> Self {
        Self {
            vault_path: String::new(),
            sync_path: None,
            lock_timeout_ms: 300_000,
            clipboard_timeout_ms: 30_000,
            clipboard_auto_clear: true,
        }
    }
}

pub fn read_config(path: &Path) -> Result<VaultConfig, ConfigError> {
    if !path.exists() {
        return Ok(VaultConfig::default());
    }
    let data = std::fs::read_to_string(path)?;
    serde_json::from_str(&data).map_err(|e| ConfigError::Serialization(e.to_string()))
}

pub fn write_config(path: &Path, config: &VaultConfig) -> Result<(), ConfigError> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let data = serde_json::to_string_pretty(config)
        .map_err(|e| ConfigError::Serialization(e.to_string()))?;
    std::fs::write(path, data)?;
    Ok(())
}

fn config_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, ConfigError> {
    let data_dir = app.path().app_data_dir().map_err(|e| {
        ConfigError::Io(std::io::Error::other(e.to_string()))
    })?;
    Ok(data_dir.join("config.json"))
}

pub fn read_config_from_app(app: &tauri::AppHandle) -> Result<VaultConfig, ConfigError> {
    let path = config_path(app)?;
    read_config(&path)
}

pub fn write_config_to_app(app: &tauri::AppHandle, config: &VaultConfig) -> Result<(), ConfigError> {
    let path = config_path(app)?;
    write_config(&path, config)
}
