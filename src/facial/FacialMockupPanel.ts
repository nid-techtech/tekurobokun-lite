import type { FacialConfig } from "../config/config";

// 開発時のみ使用する座標調整UI（B3）。目・口の各パラメータをスライダーで
// リアルタイム編集し、config.default.json に貼り戻せるJSONを出力する。

interface SliderSpec {
  label: string;
  min: number;
  max: number;
  step: number;
  get(config: FacialConfig): number;
  set(config: FacialConfig, value: number): void;
}

const CANVAS_HEIGHT = 600;

const SLIDERS: SliderSpec[] = [
  { label: "目: 中央からのXオフセット", min: 0, max: 400, step: 1, get: (c) => c.eyes.offsetX, set: (c, v) => (c.eyes.offsetX = v) },
  { label: "目: Y座標", min: 0, max: CANVAS_HEIGHT, step: 1, get: (c) => c.eyes.y, set: (c, v) => (c.eyes.y = v) },
  { label: "目: 外径半径", min: 10, max: 200, step: 1, get: (c) => c.eyes.outerRadius, set: (c, v) => (c.eyes.outerRadius = v) },
  { label: "目: 内径半径", min: 5, max: 150, step: 1, get: (c) => c.eyes.innerRadius, set: (c, v) => (c.eyes.innerRadius = v) },
  { label: "目: 線太さ", min: 1, max: 20, step: 1, get: (c) => c.eyes.strokeWeight, set: (c, v) => (c.eyes.strokeWeight = v) },
  { label: "口: Y座標", min: 0, max: CANVAS_HEIGHT, step: 1, get: (c) => c.mouth.y, set: (c, v) => (c.mouth.y = v) },
  { label: "口: 幅", min: 20, max: 700, step: 1, get: (c) => c.mouth.width, set: (c, v) => (c.mouth.width = v) },
  { label: "口: 高さ", min: 10, max: 300, step: 1, get: (c) => c.mouth.height, set: (c, v) => (c.mouth.height = v) },
  { label: "口: 線太さ", min: 1, max: 20, step: 1, get: (c) => c.mouth.strokeWeight, set: (c, v) => (c.mouth.strokeWeight = v) },
  { label: "口: 分割数", min: 1, max: 10, step: 1, get: (c) => c.mouth.segments, set: (c, v) => (c.mouth.segments = v) },
];

export class FacialMockupPanel {
  constructor(container: HTMLElement, initialConfig: FacialConfig, onChange: (config: FacialConfig) => void) {
    const config: FacialConfig = JSON.parse(JSON.stringify(initialConfig));

    const panel = document.createElement("div");
    panel.id = "facial-mockup-panel";

    const title = document.createElement("h2");
    title.textContent = "座標調整（開発用）";
    panel.appendChild(title);

    for (const spec of SLIDERS) {
      const row = document.createElement("label");
      row.className = "facial-mockup-row";

      const labelText = document.createElement("span");
      labelText.textContent = spec.label;

      const valueText = document.createElement("span");
      valueText.className = "facial-mockup-value";
      valueText.textContent = String(spec.get(config));

      const input = document.createElement("input");
      input.type = "range";
      input.min = String(spec.min);
      input.max = String(spec.max);
      input.step = String(spec.step);
      input.value = String(spec.get(config));
      input.addEventListener("input", () => {
        const value = Number(input.value);
        spec.set(config, value);
        valueText.textContent = String(value);
        onChange(config);
      });

      row.append(labelText, input, valueText);
      panel.appendChild(row);
    }

    const exportButton = document.createElement("button");
    exportButton.type = "button";
    exportButton.textContent = "config出力";

    const exportOutput = document.createElement("textarea");
    exportOutput.id = "facial-mockup-export";
    exportOutput.readOnly = true;
    exportOutput.rows = 12;
    exportOutput.placeholder = "「config出力」を押すとconfig.default.json用のJSONがここに表示されます";

    exportButton.addEventListener("click", () => {
      exportOutput.value = JSON.stringify({ facial: config }, null, 2);
      exportOutput.focus();
      exportOutput.select();
    });

    panel.append(exportButton, exportOutput);
    container.appendChild(panel);
  }
}
