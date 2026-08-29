mod serial_link;

use serial_link::{serial_connect, serial_list_ports, serial_send_command, SerialLinkState};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(SerialLinkState::default())
        .invoke_handler(tauri::generate_handler![
            serial_list_ports,
            serial_connect,
            serial_send_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
