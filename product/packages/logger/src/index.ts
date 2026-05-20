export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  prefix?: string;
  enableTimestamp?: boolean;
  enableColors?: boolean;
}

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const colors: Record<LogLevel, string> = {
  debug: '#9ca3af',
  info: '#3b82f6',
  warn: '#f59e0b',
  error: '#ef4444',
};

function formatMessage(level: LogLevel, config: LoggerConfig, message: string): string {
  const parts: string[] = [];
  
  if (config.enableTimestamp) {
    parts.push(new Date().toISOString());
  }
  
  if (config.prefix) {
    parts.push(`[${config.prefix}]`);
  }
  
  parts.push(message);
  
  return parts.join(' ');
}

export function createLogger(config: LoggerConfig = {}): Logger {
  const { prefix = '', enableTimestamp = true, enableColors = true } = config;
  
  const log = (level: LogLevel, message: string, ...args: unknown[]) => {
    const formattedMessage = formatMessage(level, { prefix, enableTimestamp }, message);
    
    if (enableColors) {
      console.log(`%c${formattedMessage}`, `color: ${colors[level]}`, ...args);
    } else {
      console.log(formattedMessage, ...args);
    }
  };
  
  return {
    debug: (message: string, ...args: unknown[]) => log('debug', message, ...args),
    info: (message: string, ...args: unknown[]) => log('info', message, ...args),
    warn: (message: string, ...args: unknown[]) => log('warn', message, ...args),
    error: (message: string, ...args: unknown[]) => log('error', message, ...args),
  };
}

export const logger = createLogger({ prefix: 'funcup' });

export function captureError(error: Error, context?: Record<string, unknown>): void {
  logger.error(`[ERROR] ${error.message}`, context);
  
  if (typeof window !== 'undefined' && (window as unknown as { Sentry?: { captureException: (e: Error) => void } }).Sentry) {
    (window as unknown as { Sentry: { captureException: (e: Error) => void } }).Sentry.captureException(error);
  }
}