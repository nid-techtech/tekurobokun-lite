import { invoke } from "@tauri-apps/api/core";
import { config } from "./config/config";
import { BarcodeKeyboardSource } from "./input/InputSource";
import { InputRouter } from "./input/InputRouter";
import { DriveStateMachine } from "./drive/DriveStateMachine";
import { FacialEngine } from "./facial/FacialEngine";
import { AudioSlotRegistry } from "./audio/AudioSlotRegistry";
import { AudioPlayer } from "./audio/AudioPlayer";
import { DebugHUD, type DebugSnapshot } from "./facial/DebugHUD";

// AppOrchestrator配線はB系タスクで本格化する。A10実機結合テスト用にSerialLinkへの接続先を暫定的にハードコードしている。
const ARDUINO_PORT_NAME = "COM5";

const inputSource = new BarcodeKeyboardSource();
const router = new InputRouter(inputSource);
const driveStateMachine = new DriveStateMachine(config.drive);

const facialContainer = document.querySelector<HTMLDivElement>("#facial-container");
if (facialContainer) {
  new FacialEngine(facialContainer, config.facial);
}

driveStateMachine.onStateChange((state, command) => {
  console.log("[drive] state ->", state, command);
  invoke("serial_set_command", { l: command.l, r: command.r }).catch((e) =>
    console.error("[serial] send failed:", e),
  );
});

const audioSlotRegistry = new AudioSlotRegistry(config.audio.slots);
const audioPlayer = new AudioPlayer(config.audio.errorSound);

let currentCaption: string | null = null;
audioPlayer.onPlaybackStart((caption) => {
  currentCaption = caption;
});
audioPlayer.play(config.audio.startupGreeting);

router.onDrive((key) => driveStateMachine.handleKey(key));
router.onAudio((key) => audioPlayer.play(audioSlotRegistry.resolve(key)));

// B7: `/`キーでON/OFFをトグルする。全可変パラメータ+発話キャプションをオーバーレイ表示。
const debugHUD = new DebugHUD(document.body);
let debugHUDEnabled = false;
router.onDebugToggle(() => {
  debugHUDEnabled = !debugHUDEnabled;
  debugHUD.setEnabled(debugHUDEnabled);
});

function buildDebugSnapshot(): DebugSnapshot {
  const { l, r } = driveStateMachine.getMotorCommand();
  return {
    params: {
      driveState: driveStateMachine.getCurrentState(),
      motorL: l,
      motorR: r,
      forwardSpeed: config.drive.forwardSpeed,
      turnSpeed: config.drive.turnSpeed,
      arduinoTimeoutMs: config.drive.arduinoTimeoutMs,
      keepAliveIntervalMs: config.drive.keepAliveIntervalMs,
      "eyes.offsetX": config.facial.eyes.offsetX,
      "eyes.y": config.facial.eyes.y,
      "eyes.outerRadius": config.facial.eyes.outerRadius,
      "eyes.innerRadius": config.facial.eyes.innerRadius,
      "eyes.strokeWeight": config.facial.eyes.strokeWeight,
      "mouth.y": config.facial.mouth.y,
      "mouth.width": config.facial.mouth.width,
      "mouth.height": config.facial.mouth.height,
      "mouth.segments": config.facial.mouth.segments,
      "mouth.strokeWeight": config.facial.mouth.strokeWeight,
    },
    currentCaption,
  };
}

function tickDebugHUD(): void {
  debugHUD.update(buildDebugSnapshot());
  requestAnimationFrame(tickDebugHUD);
}
requestAnimationFrame(tickDebugHUD);

invoke("serial_connect", { portName: ARDUINO_PORT_NAME })
  .then((connectedPort) => console.log("[serial] connected:", connectedPort))
  .catch((e) => console.error("[serial] connect failed:", e));
