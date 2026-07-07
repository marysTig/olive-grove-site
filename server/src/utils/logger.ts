type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

class Logger {
  private readonly isProduction: boolean;
  private readonly isSilent: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isSilent = process.env.NODE_ENV === 'test';
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(data !== undefined && { data }),
    };
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (this.isSilent) return;

    const entry = this.formatMessage(level, message, data);

    if (this.isProduction) {
      // Structured JSON in production for log aggregation
      const output = JSON.stringify(entry);
      switch (level) {
        case 'error':
          console.error(output);
          break;
        case 'warn':
          console.warn(output);
          break;
        default:
          console.log(output);
      }
    } else {
      // Readable format in development
      const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
      switch (level) {
        case 'error':
          console.error(prefix, message, data ?? '');
          break;
        case 'warn':
          console.warn(prefix, message, data ?? '');
          break;
        case 'debug':
          console.debug(prefix, message, data ?? '');
          break;
        default:
          console.log(prefix, message, data ?? '');
      }
    }
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  debug(message: string, data?: unknown): void {
    if (!this.isProduction) {
      this.log('debug', message, data);
    }
  }
}

export const logger = new Logger();
