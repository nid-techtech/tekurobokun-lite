import { config } from "./config/config";
import { BarcodeKeyboardSource } from "./input/InputSource";
import { InputRouter } from "./input/InputRouter";

// AppOrchestrator配線はA5以降で実装する。A4時点ではInputRouterの3系統振り分け確認のみ。
console.log("drive config:", config.drive);

const inputSource = new BarcodeKeyboardSource();
const router = new InputRouter(inputSource);
router.onDrive((key) => console.log("[drive]", key));
router.onAudio((key) => console.log("[audio]", key));
router.onDebugToggle(() => console.log("[debug] toggle"));
