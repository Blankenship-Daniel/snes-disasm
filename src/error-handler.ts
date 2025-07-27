/**
 * Error Handler Module
 * 
 * Centralized error handling for the SNES disassembler
 */

export enum ErrorType {
  PARSING_ERROR = 'PARSING_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  IO_ERROR = 'IO_ERROR',
  ANALYSIS_ERROR = 'ANALYSIS_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export interface DisassemblerError {
  type: ErrorType;
  message: string;
  context?: any;
  timestamp: Date;
  recoverable: boolean;
}

export class ErrorHandler {
  private errors: DisassemblerError[] = [];
  private errorCallback?: (error: DisassemblerError) => void;

  /**
   * Set error callback for custom error handling
   */
  setErrorCallback(callback: (error: DisassemblerError) => void): void {
    this.errorCallback = callback;
  }

  /**
   * Handle an error
   */
  handleError(type: ErrorType, message: string, context?: any, recoverable: boolean = true): void {
    const error: DisassemblerError = {
      type,
      message,
      context,
      timestamp: new Date(),
      recoverable
    };

    this.errors.push(error);

    if (this.errorCallback) {
      this.errorCallback(error);
    } else {
      // Default error handling
      console.error(`[${type}] ${message}`, context);
    }

    if (!recoverable) {
      throw new Error(`Fatal error: ${message}`);
    }
  }

  /**
   * Get all recorded errors
   */
  getErrors(): DisassemblerError[] {
    return [...this.errors];
  }

  /**
   * Clear error history
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Get errors of a specific type
   */
  getErrorsByType(type: ErrorType): DisassemblerError[] {
    return this.errors.filter(error => error.type === type);
  }

  /**
   * Check if there are any fatal errors
   */
  hasFatalErrors(): boolean {
    return this.errors.some(error => !error.recoverable);
  }

  /**
   * Generate error summary
   */
  getErrorSummary(): string {
    const errorCounts = new Map<ErrorType, number>();
    
    for (const error of this.errors) {
      errorCounts.set(error.type, (errorCounts.get(error.type) || 0) + 1);
    }

    const summary = Array.from(errorCounts.entries())
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');

    return `Total errors: ${this.errors.length} (${summary})`;
  }
}
