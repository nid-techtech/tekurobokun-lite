use std::io::Write;
use std::sync::Mutex;
use std::time::Duration;

use serialport::SerialPort;

const BAUD_RATE: u32 = 115_200;
const WRITE_TIMEOUT: Duration = Duration::from_millis(100);

pub struct SerialLinkState {
    port: Mutex<Option<Box<dyn SerialPort>>>,
}

impl Default for SerialLinkState {
    fn default() -> Self {
        Self {
            port: Mutex::new(None),
        }
    }
}

#[tauri::command]
pub fn serial_list_ports() -> Result<Vec<String>, String> {
    serialport::available_ports()
        .map(|ports| ports.into_iter().map(|p| p.port_name).collect())
        .map_err(|e| e.to_string())
}

// port_name未指定時は、利用可能なポートのうち最初の1つに接続を試みる。
#[tauri::command]
pub fn serial_connect(
    state: tauri::State<SerialLinkState>,
    port_name: Option<String>,
) -> Result<String, String> {
    let resolved_port_name = match port_name {
        Some(name) => name,
        None => {
            let ports = serialport::available_ports().map_err(|e| e.to_string())?;
            ports
                .first()
                .map(|p| p.port_name.clone())
                .ok_or_else(|| "利用可能なシリアルポートが見つかりません".to_string())?
        }
    };

    let port = serialport::new(&resolved_port_name, BAUD_RATE)
        .timeout(WRITE_TIMEOUT)
        .open()
        .map_err(|e| format!("ポート {resolved_port_name} への接続に失敗しました: {e}"))?;

    let mut guard = state.port.lock().map_err(|e| e.to_string())?;
    *guard = Some(port);

    Ok(resolved_port_name)
}

// 仕様5節のプロトコルに従い"L,R\n"形式でモーターコマンドを送信する。
#[tauri::command]
pub fn serial_send_command(
    state: tauri::State<SerialLinkState>,
    l: i32,
    r: i32,
) -> Result<(), String> {
    if !(-100..=100).contains(&l) || !(-100..=100).contains(&r) {
        return Err(format!(
            "モーターコマンドは-100〜100の範囲で指定してください (l={l}, r={r})"
        ));
    }

    let mut guard = state.port.lock().map_err(|e| e.to_string())?;
    let port = guard
        .as_mut()
        .ok_or_else(|| "シリアルポートが接続されていません".to_string())?;

    let command = format!("{l},{r}\n");
    port.write_all(command.as_bytes())
        .map_err(|e| format!("コマンド送信に失敗しました: {e}"))
}
