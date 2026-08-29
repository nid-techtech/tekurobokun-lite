import p5 from "p5";

export const FACIAL_CANVAS_WIDTH = 800;
export const FACIAL_CANVAS_HEIGHT = 600;

// アニメーションなし。初期化時に1回描画するのみ（imple 4.8準拠）。
export class FacialEngine {
  constructor(container: HTMLElement) {
    new p5((s: p5) => {
      s.setup = () => {
        s.createCanvas(FACIAL_CANVAS_WIDTH, FACIAL_CANVAS_HEIGHT);
        s.noLoop();
        s.background(0);
      };
    }, container);
  }
}
