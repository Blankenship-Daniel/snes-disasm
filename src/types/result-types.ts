/**
 * Result Types for Better Error Handling
 * 
 * Implements Result pattern for better error management
 * and eliminates need for try-catch everywhere.
 */

export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  success: true;
  data: T;
}

export interface Failure<E> {
  success: false;
  error: E;
}

// Factory functions
export const Ok = <T>(data: T): Success<T> => ({ success: true, data });
export const Err = <E>(error: E): Failure<E> => ({ success: false, error });

// Utility functions
export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> => result.success;
export const isFailure = <T, E>(result: Result<T, E>): result is Failure<E> => !result.success;

// Chain operations
export const map = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> => {
  if (isSuccess(result)) {
    return Ok(fn(result.data));
  }
  return result;
};

export const flatMap = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> => {
  if (isSuccess(result)) {
    return fn(result.data);
  }
  return result;
};

// Error types for the disassembler
export enum DisassemblerErrorType {
  ROM_NOT_FOUND = 'ROM_NOT_FOUND',
  INVALID_ROM_FORMAT = 'INVALID_ROM_FORMAT',
  INVALID_ADDRESS_RANGE = 'INVALID_ADDRESS_RANGE',
  DECODER_ERROR = 'DECODER_ERROR',
  SYMBOL_LOAD_ERROR = 'SYMBOL_LOAD_ERROR',
  OUTPUT_ERROR = 'OUTPUT_ERROR',
  ANALYSIS_ERROR = 'ANALYSIS_ERROR',
  BRR_DECODE_ERROR = 'BRR_DECODE_ERROR'
}

export class DisassemblerError extends Error {
  constructor(
    public type: DisassemblerErrorType,
    message: string,
    public context?: any
  ) {
    super(message);
    this.name = 'DisassemblerError';
  }
}
