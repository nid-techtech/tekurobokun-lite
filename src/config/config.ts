import configDefault from "./config.default.json";

export interface DriveConfig {
  forwardSpeed: number;
  turnSpeed: number;
  arduinoTimeoutMs: number;
  keepAliveIntervalMs: number;
}

export interface AppConfig {
  drive: DriveConfig;
}

export const config: AppConfig = configDefault;
