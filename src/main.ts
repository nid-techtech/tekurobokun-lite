import { invoke } from "@tauri-apps/api/core";
import { config } from "./config/config";
import { BarcodeKeyboardSource } from "./input/InputSource";
import { InputRouter } from "./input/InputRouter";
import { DriveStateMachine } from "./drive/DriveStateMachine";

// AppOrchestrator配線はB系タスクで本格化する。A10実機結合テスト用にSerialLinkへの接続先を暫定的にハードコードしている。
const ARDUINO_PORT_NAME = "COM5";

const inputSource = new BarcodeKeyboardSource();
const router = new InputRouter(inputSource);
const driveStateMachine = new DriveStateMachine(config.drive);

const driveStateDisplay = document.querySelector<HTMLDivElement>("#drive-state-display");

function renderDriveState(): void {
  if (!driveStateDisplay) return;
  const state = driveStateMachine.getCurrentState();
  const { l, r } = driveStateMachine.getMotorCommand();
  driveStateDisplay.textContent = `state: ${state}  (L=${l}, R=${r})`;
}

renderDriveState();
driveStateMachine.onStateChange((state, command) => {
  console.log("[drive] state ->", state, command);
  renderDriveState();
  invoke("serial_set_command", { l: command.l, r: command.r }).catch((e) =>
    console.error("[serial] send failed:", e),
  );
});

router.onDrive((key) => driveStateMachine.handleKey(key));
router.onAudio((key) => console.log("[audio]", key));
router.onDebugToggle(() => console.log("[debug] toggle"));

invoke("serial_connect", { portName: ARDUINO_PORT_NAME })
  .then((connectedPort) => console.log("[serial] connected:", connectedPort))
  .catch((e) => console.error("[serial] connect failed:", e));
