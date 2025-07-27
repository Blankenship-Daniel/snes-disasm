/**
 * Central Logger Configuration for SNES Disassembler
 *
 * Provides a robust logging system using Pino with:
 * - Environment-specific configuration
 * - Structured logging with context
 * - Performance tracking
 * - File and console output
 * - Log rotation support
 */

import pino from 'pino';
import { performance } from 'perf_hooks';

// Log levels enum for type safety
enum LogLevel {
  FATAL = 'fatal',
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

// Performance tracking interface
interface PerformanceContext {
  operation: string;
  startTime: number;
  metadata?: Record<string, any>;
}

// Logger configuration interface
interface LoggerConfig {
  level: LogLevel;
  prettyPrint: boolean;
  timestamp: boolean;
  fileOutput?: {
    enabled: boolean;
    filepath: string;
    maxSize?: string;
    maxFiles?: number;
  };
}

// Default configuration based on environment
const getDefaultConfig = (): LoggerConfig => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const logLevel = (process.env.LOG_LEVEL as LogLevel) || (isDevelopment ? LogLevel.DEBUG : LogLevel.INFO);

  return {
    level: logLevel,
    prettyPrint: isDevelopment,
    timestamp: true,
    fileOutput: {
      enabled: !isDevelopment,
      filepath: './logs/snes-disassembler.log',
      maxSize: '10M',
      maxFiles: 5
    }
  };
};

// Create the main logger instance
const config = getDefaultConfig();

const pinoConfig: pino.LoggerOptions = {
  level: config.level,
  timestamp: config.timestamp ? pino.stdTimeFunctions.isoTime : false,
  formatters: {
    level: (label: string) => {
      return { level: label };
    }
  },
  serializers: {
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  }
};

// Add pretty printing for development
if (config.prettyPrint) {
  pinoConfig.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
      messageFormat: '[{component}] {msg}',
      errorLikeObjectKeys: ['err', 'error']
    }
  };
}

// Create base logger
const baseLogger = pino(pinoConfig);

// Enhanced logger class with additional functionality
export class Logger {
  private logger: pino.Logger;
  private component: string;
  private performanceTrackers: Map<string, PerformanceContext> = new Map();

  constructor(component: string, parentLogger?: pino.Logger) {
    this.component = component;
    this.logger = (parentLogger ?? baseLogger).child({ component });
  }

  // Basic logging methods
  fatal(message: string, data?: any): void {
    this.logger.fatal(data, message);
  }

  error(message: string, error?: Error | Record<string, unknown>): void {
    if (error instanceof Error) {
      this.logger.error({ err: error }, message);
    } else {
      this.logger.error(error, message);
    }
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.logger.warn(data, message);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.logger.info(data, message);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.logger.debug(data, message);
  }

  trace(message: string, data?: Record<string, unknown>): void {
    this.logger.trace(data, message);
  }

  // Performance tracking methods
  startPerformanceTracking(operation: string, metadata?: Record<string, any>): string {
    const trackingId = `${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const context: PerformanceContext = {
      operation,
      startTime: performance.now(),
      metadata
    };

    this.performanceTrackers.set(trackingId, context);
    this.debug(`Started performance tracking for ${operation}`, { trackingId, metadata });

    return trackingId;
  }

  endPerformanceTracking(trackingId: string, additionalData?: any): number | null {
    const context = this.performanceTrackers.get(trackingId);
    if (!context) {
      this.warn('Performance tracking context not found', { trackingId });
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - context.startTime;

    this.info(`Completed ${context.operation}`, {
      duration: `${duration.toFixed(2)}ms`,
      trackingId,
      metadata: context.metadata,
      ...additionalData
    });

    this.performanceTrackers.delete(trackingId);
    return duration;
  }

  // ROM processing specific methods
  logROMInfo(romPath: string, size: number, checksum?: string): void {
    this.info('ROM loaded successfully', {
      path: romPath,
      sizeBytes: size,
      sizeKB: Math.round(size / 1024),
      checksum
    });
  }

  logDisassemblyProgress(address: number, instruction: string, progress?: number): void {
    this.debug('Disassembling instruction', {
      address: `0x${address.toString(16).toUpperCase()}`,
      instruction,
      progress: progress ? `${progress.toFixed(1)}%` : undefined
    });
  }

  logAnalysisResult(analysisType: string, result: Record<string, unknown>): void {
    this.info(`Analysis completed: ${analysisType}`, result);
  }

  // Audio processing specific methods
  logAudioProcessing(operation: string, sampleRate?: number, channels?: number, duration?: number): void {
    this.info(`Audio processing: ${operation}`, {
      sampleRate,
      channels,
      durationMs: duration
    });
  }

  logBRRDecoding(blockCount: number, sampleCount: number, compressionRatio?: number): void {
    this.info('BRR decoding completed', {
      blocks: blockCount,
      samples: sampleCount,
      compressionRatio: compressionRatio ? `${compressionRatio.toFixed(2)}:1` : undefined
    });
  }

  // Error handling with context
  logErrorWithContext(error: Error, context: string, additionalData?: any): void {
    this.error(`Error in ${context}`, {
      err: error,
      context,
      stack: error.stack,
      ...additionalData
    });
  }

  // Memory usage logging
  logMemoryUsage(operation?: string): void {
    const memUsage = process.memoryUsage();
    this.debug('Memory usage', {
      operation,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
    });
  }

  // Create child logger for sub-components
  child(childComponent: string): Logger {
    return new Logger(`${this.component}:${childComponent}`, this.logger);
  }

  // Get the underlying Pino logger for advanced usage
  getPinoLogger(): pino.Logger {
    return this.logger;
  }
}

// Create and export the main application logger
const mainLogger = new Logger('SNES-Disassembler');

// Factory function to create component-specific loggers
export function createLogger(component: string): Logger {
  return new Logger(component);
}

// Utility functions for application lifecycle logging
export function logApplicationStartup(version?: string, config?: any): void {
  mainLogger.info('🚀 SNES Disassembler starting up', {
    version,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    config
  });
}

export function logApplicationShutdown(exitCode: number = 0): void {
  mainLogger.info('🛑 SNES Disassembler shutting down', { exitCode });
}

// Performance measurement decorator
export function measurePerformance(logger: Logger, operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const trackingId = logger.startPerformanceTracking(`${target.constructor.name}.${propertyName}`, {
        operation,
        arguments: args.length
      });

      try {
        const result = await method.apply(this, args);
        logger.endPerformanceTracking(trackingId, { success: true });
        return result;
      } catch (error) {
        logger.endPerformanceTracking(trackingId, { success: false, error: error instanceof Error ? error.message : String(error) });
        throw error;
      }
    };
  };
}

