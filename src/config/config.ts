import configDefault from "./config.default.json";

export interface DriveConfig {
  forwardSpeed: number;
  turnSpeed: number;
  arduinoTimeoutMs: number;
  keepAliveIntervalMs: number;
}

export interface EyesConfig {
  offsetX: number; // キャンバス中央からの左右オフセット(px)
  y: number;
  outerRadius: number;
  innerRadius: number;
  strokeWeight: number;
}

export interface MouthConfig {
  y: number;
  width: number;
  height: number;
  segments: number;
  strokeWeight: number;
}

export interface FacialConfig {
  eyes: EyesConfig;
  mouth: MouthConfig;
}

export interface AppConfig {
  drive: DriveConfig;
  facial: FacialConfig;
}

export const config: AppConfig = configDefault;
