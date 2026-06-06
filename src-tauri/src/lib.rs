mod commands;
mod crypto;
mod generator;
mod vault;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::create_vault,
            commands::unlock_vault,
            commands::save_vault,
            commands::generate_password,
            commands::vault_exists,
            commands::get_default_vault_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
