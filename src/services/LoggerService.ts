export type LogLevel = 'log' | 'warn' | 'info' | 'error' | 'debug' | 'trace';

export class LoggingService {
  static log(...args: any[]): void {
    return this._log('log', ...args);
  }

  static warn(...args: any[]): void {
    return this._log('warn', ...args);
  }

  static info(...args: any[]): void {
    return this._log('info', ...args);
  }

  static error(...args: any[]): void {
    return this._log('error', ...args);
  }

  static debug(...args: any[]): void {
    return this._log('debug', ...args);
  }

  static trace(...args: any[]): void {
    return this._log('trace', ...args);
  }

  static _log(level: LogLevel, ...args: any[]): void {
    console[level](...args);
  }
}
