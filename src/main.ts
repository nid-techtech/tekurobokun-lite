import { config } from "./config/config";
import { BarcodeKeyboardSource } from "./input/InputSource";
import { InputRouter } from "./input/InputRouter";
import { DriveStateMachine } from "./drive/DriveStateMachine";

// AppOrchestrator配線はB系タスクで本格化する。A6時点では走行状態遷移の暫定表示のみ。
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
});

router.onDrive((key) => driveStateMachine.handleKey(key));
router.onAudio((key) => console.log("[audio]", key));
router.onDebugToggle(() => console.log("[debug] toggle"));
