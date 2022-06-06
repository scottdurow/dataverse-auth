import { LogLevel } from "@azure/msal-common";

export interface LogEntry {
  Level: LogLevel;
  Message: string;
}
export class SimpleLogger {
  private logToConsole = false;
  public output: LogEntry[] = [];
  constructor(logToConsole = false) {
    this.logToConsole = logToConsole;
  }
  AppendLog(log: LogEntry[]): void {
    this.output = this.output.concat(log);
  }
  Log = (level: LogLevel, message: string): void => {
    this.output.push({ Level: level, Message: message });
    if (this.logToConsole) {
      if ((level as LogLevel) === LogLevel.Error) {
        console.error(message);
      } else {
        console.debug(message);
      }
    }
  };

  OutputToConsole(verbose: boolean): void {
    this.output
      .filter((l) => (l.Level as LogLevel) === LogLevel.Error || verbose)
      .forEach((l) => {
        if (l.Level === LogLevel.Error) {
          console.error(l.Message);
        } else {
          console.log(l.Message);
        }
      });
  }
}
