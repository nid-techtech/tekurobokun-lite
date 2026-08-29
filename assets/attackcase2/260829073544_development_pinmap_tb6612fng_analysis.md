# Arduino ピン配線解析（TB6612FNG デュアルモータードライバー）

対象ソース: [arduino_sketch/dualmotor_arduino/dualmotor_arduino.ino](../../arduino_sketch/dualmotor_arduino/dualmotor_arduino.ino)

## 1. ピン割り当て一覧

| Arduino ピン | 役割（コード上の変数） | TB6612FNG 接続先 | 機能 |
|---|---|---|---|
| D3 | `pinSTBY` | STBY | ドライバの動作許可（HIGH=動作／LOW=スタンバイ・両チャンネル停止） |
| D4 | `pinAin1` | AIN1 | モーターA（左）回転方向制御ビット1 |
| D5 | `pinAin2` | AIN2 | モーターA（左）回転方向制御ビット2 |
| D9 | `pinPWMA` | PWMA | モーターA（左）speed制御PWM |
| D6 | `pinBin1` | BIN1 | モーターB（右）回転方向制御ビット1 |
| D7 | `pinBin2` | BIN2 | モーターB（右）回転方向制御ビット2 |
| D10 | `pinPWMB` | PWMB | モーターB（右）speed制御PWM |

補足: D3, D9, D10 はいずれも Arduino Uno のPWM対応ピン（490Hz, 8bit分解能, 0-255）であり、`analogWrite()` によるモーター速度制御に適合している。STBYは常時HIGHで固定運用されており、PWMではなくデジタルON/OFFとして扱われている。

## 2. TB6612FNGについて（Web調査）

TB6612FNGはデュアルHブリッジ方式のDCモータードライバーIC。

- **STBY**: HIGHで動作、LOWでスタンバイ（両チャンネル同時に無効化される低消費電力モード）
- **AIN1/AIN2（BIN1/BIN2）**: 各チャンネルの回転方向を決めるロジック入力
  - 一般的な真理値表: `(1,0)=正転`, `(0,1)=逆転`, `(0,0)=ショートブレーキ`, `(1,1)=ストップ（High-Z）`
- **PWMA/PWMB**: PWM信号のデューティ比でモーター速度（出力電圧の平均値）を制御
- チャンネルあたり連続1.2A・ピーク3.2Aまで対応、モーター電源電圧2.5V〜13.5V
- ロジック電源電圧2.7V〜5.5V対応のため3.3V/5V系のマイコンに直結可能

参考:
- [TB6612FNG Motor Driver IC Pinout, Datasheet, Equivalent, and Specifications](https://components101.com/ics/tb6612fng-motor-driver-ic-pinout-datasheet-equivalent-circuit-specs)
- [Controlling DC Motors with TB6612FNG and Arduino](https://lastminuteengineers.com/tb6612fng-dc-motor-control-arduino-tutorial/)
- [Arduino UNO Pinout Reference](https://lastminuteengineers.com/arduino-pinout/)

## 3. コードの制御ロジック解析

### 3.1 起動処理（`setup()`）

1. `Serial.begin(115200)` — PC側（Electronアプリ）との通信を115200bpsで開始
2. 全制御ピンを `OUTPUT` に設定
3. `pinSTBY` を `HIGH` にして TB6612FNG を常時動作可能状態にする
4. `stopMotors()` を呼び両モーターを停止状態で初期化

### 3.2 メインループ（`loop()`）

シリアル受信バッファにデータがあれば1行読み取り、`"L,R\n"` 形式（例: `"50,-30\n"`）をカンマで分割し、`L`（左速度）・`R`（右速度）を整数変換して `setMotors()` に渡す。カンマの位置が不正（`commaIndex <= 0`）な場合は無視される。

### 3.3 `setMotors(lSpeed, rSpeed)`

- 入力値は `constrain()` で -100〜100 の範囲に丸められる
- 速度0のときは方向ピンを両方LOWにし、PWMも0（停止）
- 正の値: 各モーターのIN1=HIGH, IN2=LOWとし正転方向、`map(speed, 0, 100, 0, 255)` でPWM値を算出
- 負の値: IN1=LOW, IN2=HIGHとし逆転方向、絶対値をPWM値に変換

トラックA（左）とトラックB（右）で全く同じロジックが独立して適用されており、左右の極性はコード上固定（左右で反転させる配線・ロジックにはなっていない）。コード内コメントに「Was: LOW,HIGH -> Now: HIGH,LOW」とあり、過去に正転方向の極性を反転させる修正が入った履歴が読み取れる。

### 3.4 `stopMotors()`

両チャンネルの方向ピンをすべてLOWにし、PWMを0にする単純な全停止処理（TB6612FNGの真理値表上はショートブレーキ相当の (0,0) 状態）。

## 4. PC側（Electron/TypeScript）とのインターフェース

[dualmotor-controller/electron/main.ts](../../dualmotor-controller/electron/main.ts) がNode.js `serialport` パッケージ経由でArduinoとシリアル通信する。

- `SerialPort` を `baudRate: 115200` でオープン（Arduino側の `Serial.begin(115200)` と一致）
- `ReadlineParser`（`\n`区切り）でArduinoからの受信データをパースし、レンダラープロセスへ `serial:data` イベントとして転送
- `serial:write` ハンドラでレンダラーから受け取ったコマンド文字列（`"L,R\n"` 形式と推定）をそのままシリアルポートに書き込む
- `devMode` フラグにより、実機ポートなしでコンソールログのみ行う開発用モード（`[DEV MODE] TX: ...`）を備える

## 5. 配線図（テキスト）

```
Arduino Uno              TB6612FNG
─────────────            ─────────
D3  ─────────────────►   STBY
D4  ─────────────────►   AIN1  ┐
D5  ─────────────────►   AIN2  ├─ モーターA（左）
D9  ─────────────────►   PWMA  ┘
D6  ─────────────────►   BIN1  ┐
D7  ─────────────────►   BIN2  ├─ モーターB（右）
D10 ─────────────────►   PWMB  ┘
```

※ TB6612FNGのVM（モーター電源）、VCC（ロジック電源）、GND、AO1/AO2、BO1/BO2（モーター出力端子）の実配線は本ソースコードには現れないため、回路図または別資料の確認が必要（未確認事項）。

## 6. 未確認・要確認事項

- TB6612FNGの電源系統（VM/VCC/GND）の実配線・使用電圧
- モーター出力端子（AO1/AO2, BO1/BO2）と実モーターの対応
- ショートブレーキ（0,0）とストップ（1,1）のどちらの停止方式を意図しているか（現状コードは(0,0)＝ブレーキ相当を使用）
