mod commands;
mod platform;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::get_font_profiles,
            commands::scan_wow_installations,
            commands::backup_fonts,
            commands::apply_font_pack
        ])
        .run(tauri::generate_context!())
        .expect("failed to run WoW Font Manager");
}
