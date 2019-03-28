export enum LogLevel {
  TRACE,
  INFO,
  WARN,
  ERROR,
  TEST,
  NONE,
}

export default class Log {
  public static level: LogLevel = LogLevel.TRACE;

  public static trace(msg: string): void {
    if (Log.level <= LogLevel.TRACE) {
      console.log(`[${new Date().toLocaleString()}] [TRACE] ${msg}`);
    }
  }

  public static info(msg: string): void {
    if (Log.level <= LogLevel.INFO) {
      console.info(`[${new Date().toLocaleString()}] [INFO] ${msg}`);
    }
  }

  public static warn(msg: string): void {
    if (Log.level <= LogLevel.WARN) {
      console.warn(`[${new Date().toLocaleString()}] [WARN] ${msg}`);
    }
  }

  public static error(msg: string): void {
    if (Log.level <= LogLevel.ERROR) {
      console.error(`[${new Date().toLocaleString()}] [ERROR] ${msg}`);
    }
  }
}