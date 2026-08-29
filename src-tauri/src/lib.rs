mod serial_link;

use std::sync::Arc;

use serial_link::{
    serial_connect, serial_list_ports, serial_set_command, spawn_keepalive_task, SerialLinkState,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let serial_state = Arc::new(SerialLinkState::default());
    spawn_keepalive_task(serial_state.clone());

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(serial_state)
        .invoke_handler(tauri::generate_handler![
            serial_list_ports,
            serial_connect,
            serial_set_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
