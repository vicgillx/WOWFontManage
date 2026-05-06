mod commands;
mod platform;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::wow::get_font_profiles,
            commands::wow::scan_wow_installations,
            commands::wow::backup_fonts,
            commands::wow::apply_font_pack
        ])
        .run(tauri::generate_context!())
        .expect("failed to run WoW Font Manager");
}
