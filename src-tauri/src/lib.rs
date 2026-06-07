mod commands;
mod config;
mod crypto;
mod generator;
mod vault;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(commands::SessionState(std::sync::Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            commands::create_vault,
            commands::unlock_vault,
            commands::lock_vault,
            commands::save_vault,
            commands::generate_password,
            commands::vault_exists,
            commands::get_default_vault_path,
            commands::clear_clipboard,
            commands::save_config,
            commands::load_config,
            commands::pick_vault_path,
            commands::change_vault_path,
            commands::check_conflict,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
