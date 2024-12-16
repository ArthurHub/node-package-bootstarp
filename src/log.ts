// Therefore those skilled at the unorthodox
// are infinite as heaven and earth,
// inexhaustible as the great rivers.
// When they come to an end,
// they begin again,
// like the days and months;
// they die and are reborn,
// like the four seasons.
//
// - Sun Tsu, The Art of War.
//
// ArthurHub, 2024

import picocolors from 'picocolors';
import { WriteStream } from 'tty';

// workaround until picocolors improves its color detection
// https://github.com/alexeyraspopov/picocolors/issues/85
export const pc = picocolors.createColors(WriteStream.prototype.hasColors());

class Logger {
  private debugMode = false;

  enableDebug(): void {
    this.debugMode = true;
  }

  debug(text: string, lines?: string[] | string): void {
    if (!this.debugMode) {
      return;
    }

    console.log(`${pc.green('debug >')} ${text}`);
    this.lines(lines);
  }

  info(text: string, lines?: string[] | string): void {
    console.log(`${pc.gray('info  >')} ${text}`);
    this.lines(lines);
  }

  warn(text: string, lines?: string[] | string): void {
    console.log(`${pc.yellow('WARN  >')} ${text}`);
    this.lines(lines);
  }

  error(text: unknown, lines?: string[] | string): void {
    const message = text instanceof Error ? this.colorizeTrace(text.stack) : text;
    console.log(`${pc.redBright('ERROR >')} ${message as string}`);
    this.lines(lines);
  }

  colorizeJson(json: unknown): string {
    const jsonString = JSON.stringify(json, null, 2);
    try {
      return jsonString.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)|(\b(true|false|null)\b)|(\b-?\d+(\.\d+)?([eE][+-]?\d+)?\b)/g,
        (match) => {
          let color = pc.white;
          if (match.startsWith('"')) {
            if (match.endsWith(':')) {
              color = pc.cyan; // Key
            } else {
              color = pc.green; // String value
            }
          } else if (/true|false/.test(match)) {
            color = pc.magenta; // Boolean
          } else if (match.includes('null')) {
            color = pc.red; // Null
          } else if (/\b-?\d+(\.\d+)?([eE][+-]?\d+)?\b/.test(match)) {
            color = pc.yellow; // Number
          }
          return color(match);
        },
      );
    } catch {
      return jsonString;
    }
  }

  colorizeTrace(trace?: string): string {
    if (!trace) {
      return '';
    }
    try {
      return trace
        .split('\n')
        .map((line) => {
          if (line.startsWith('Error:')) {
            // Highlight the error message
            return pc.red(line);
          } else if (line.trim().startsWith('at')) {
            // Colorize stack trace lines
            return line.replace(
              /(at\s)([\w.<>\s]+)\s\((.*):(\d+):(\d+)\)/,
              (_, at: string, method: string, file: string, line: string, column: string) =>
                `${pc.gray(at)}${pc.cyan(method)} ${pc.green(`(${file}:${pc.gray(`${line}:${column}`)})`)}`,
            );
          } else {
            // Default gray for other lines
            return pc.gray(line);
          }
        })
        .join('\n');
    } catch {
      return trace;
    }
  }

  private lines(lines?: string[] | string): void {
    if (lines === undefined) {
      return;
    }

    if (!Array.isArray(lines)) {
      console.log(`  ${lines}`);
      return;
    }

    for (const line of lines) {
      console.log(`  ${line}`);
    }
  }
}

export const log = new Logger();
