/**
 * Structured logger for production use
 *
 * Outputs JSON in production (easy to parse in log aggregators like Railway, Vercel)
 * Outputs readable format in development
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
  [key: string]: unknown;
}

const isProduction = process.env.NODE_ENV === 'production';

// Sensitive fields to redact from logs
const REDACT_FIELDS = new Set([
  'password',
  'passwordHash',
  'newPassword',
  'currentPassword',
  'token',
  'resetPasswordToken',
  'authorization',
  'cookie',
  'secret',
  'apiKey',
]);

function redactSensitiveData(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveData);
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (REDACT_FIELDS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      result[key] = redactSensitiveData(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function formatLogEntry(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const redactedContext = context ? redactSensitiveData(context) as LogContext : {};

  if (isProduction) {
    // JSON format for production (log aggregators)
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...redactedContext,
    });
  }

  // Readable format for development
  const contextStr = redactedContext
    ? ' ' + JSON.stringify(redactedContext, null, 0)
    : '';
  return `[${timestamp.split('T')[1].slice(0, 8)}] ${level.toUpperCase().padEnd(5)} ${message}${contextStr}`;
}

function writeLog(level: LogLevel, message: string, context?: LogContext) {
  const entry = formatLogEntry(level, message, context);

  switch (level) {
    case 'error':
    case 'fatal':
      console.error(entry);
      break;
    case 'warn':
      console.warn(entry);
      break;
    case 'debug':
      if (!isProduction) console.debug(entry);
      break;
    default:
      console.log(entry);
  }
}

// Core logger
export const logger = {
  debug: (message: string, context?: LogContext) => writeLog('debug', message, context),
  info: (message: string, context?: LogContext) => writeLog('info', message, context),
  warn: (message: string, context?: LogContext) => writeLog('warn', message, context),
  error: (message: string, context?: LogContext) => writeLog('error', message, context),
  fatal: (message: string, context?: LogContext) => writeLog('fatal', message, context),
};

// Convenience functions for common logging patterns
export const log = {
  // API request logging
  api: (method: string, path: string, extra?: LogContext) => {
    logger.info(`${method} ${path}`, { type: 'api', ...extra });
  },

  // Authentication events
  auth: (event: string, userId?: string, extra?: LogContext) => {
    logger.info(`Auth: ${event}`, { type: 'auth', userId, ...extra });
  },

  // Subscription/payment events
  subscription: (event: string, userId: string, extra?: LogContext) => {
    logger.info(`Subscription: ${event}`, { type: 'subscription', userId, ...extra });
  },

  // Database operations (debug level)
  db: (operation: string, model: string, extra?: LogContext) => {
    logger.debug(`DB: ${operation} ${model}`, { type: 'db', ...extra });
  },

  // Errors with context
  error: (message: string, error?: Error | unknown, extra?: LogContext) => {
    const errorContext: LogContext = { type: 'error' };

    if (error instanceof Error) {
      errorContext.errorMessage = error.message;
      errorContext.errorName = error.name;
      if (!isProduction) {
        errorContext.errorStack = error.stack;
      }
    } else if (error !== null && error !== undefined) {
      errorContext.error = error;
    }

    logger.error(message, { ...errorContext, ...extra });
  },

  // Webhook events
  webhook: (source: string, event: string, extra?: LogContext) => {
    logger.info(`Webhook: ${source} ${event}`, { type: 'webhook', source, event, ...extra });
  },

  // Email events
  email: (event: string, to: string, extra?: LogContext) => {
    logger.info(`Email: ${event}`, { type: 'email', to, ...extra });
  },
};

export default logger;
