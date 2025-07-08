import {LogLevel} from "~/enums/logLevel.enum.ts";

export class Logger {
    static defaultLevel = LogLevel.WARN;
    static level: number;
    static separator = ''.padEnd(60, '—');
    static enumValues: {[key: string]: LogLevel} = {
        "INFO": LogLevel.INFO,
        "ERROR": LogLevel.ERROR,
        'WARNING': LogLevel.WARN,
        'WARN': LogLevel.WARN,
        'DEBUG': LogLevel.DEBUG
    }
    static Colors = {
        Error:      "\x1b[38;2;255;51;0m",      // Bright Red (#FF3300)
        Warning:    "\x1b[38;2;255;204;0m",     // Orange Yellow (#FFCC00)
        Info:       "\x1b[38;2;75;162;135m",    // Digital soil green (#4BA287)
        Debug:      "\x1b[38;2;128;128;128m",   // Dark Grey
        Highlight:  "\x1b[38;2;99;192;50m",     // Green
        Reset:      "\x1b[0m",
    }

    static get timestamp() {
        return `[${
            (new Date().toISOString())
                .substring(0, 23)
                .replace("T", " ")
        }]`;
    }

    static convertLogLevelToEnum (logLevel?: string): LogLevel {
        if (!logLevel) {
            Logger.warn(`LOG_LEVEL undefined, defaulting to ${Logger.defaultLevel}`);
            return Logger.defaultLevel;
        }

        return Logger.enumValues[logLevel] ?? Logger.defaultLevel;
    }

    /**
     * Highlights/emphasizes the string with colors for easier reading in logs.
     * @param {string} input - the input to emphasize
     */
    static em(input: string) {
        return `${Logger.Colors.Highlight}${input}${Logger.Colors.Reset}`;
    }

    static error(...args: unknown[]) {
        if (Logger.level >= LogLevel.ERROR) console.error(`${Logger.timestamp} ${Logger.Colors.Error}[ERROR]${Logger.Colors.Reset}`, ...args);
    }

    static warn(...args: unknown[]) {
        if (Logger.level >= LogLevel.WARN) console.warn(`${Logger.timestamp}  ${Logger.Colors.Warning}[WARN]${Logger.Colors.Reset}`, ...args);
    }

    static info(...args: unknown[]) {
        if (Logger.level >= LogLevel.INFO) console.info(`${Logger.timestamp}  ${Logger.Colors.Info}[INFO]${Logger.Colors.Reset}`, ...args);
    }

    static debug(...args: unknown[]) {
        if (Logger.level >= LogLevel.DEBUG) console.debug(`${Logger.timestamp} ${Logger.Colors.Debug}[DEBUG]${Logger.Colors.Reset}`, ...args);
    }
}
