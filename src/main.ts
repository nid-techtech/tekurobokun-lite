import { config } from "./config/config";
import { BarcodeKeyboardSource } from "./input/InputSource";

// AppOrchestrator配線はA5以降で実装する。A3時点ではInputSourceのkeydown確認のみ。
console.log("drive config:", config.drive);

const inputSource = new BarcodeKeyboardSource();
inputSource.onKeyDown((key) => {
  console.log("keydown:", key);
});
