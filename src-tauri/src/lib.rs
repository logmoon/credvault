mod commands;
mod crypto;
mod generator;
mod vault;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(commands::SessionState(std::sync::Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            commands::create_vault,
            commands::unlock_vault,
            commands::lock_vault,
            commands::save_vault,
            commands::generate_password,
            commands::vault_exists,
            commands::get_default_vault_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
