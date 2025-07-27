/**
 * Input Validation Module
 *
 * Provides comprehensive validation for all user inputs
 * to prevent runtime errors and improve user experience.
 */

import { CLIOptions } from '../types/cli-types';
import { Result, Ok, Err, DisassemblerError, DisassemblerErrorType } from '../types/result-types';
import * as fs from 'fs';
import * as path from 'path';

export class InputValidator {

  /**
   * Validate ROM file path and accessibility
   */
  static async validateROMFile(romPath: string): Promise<Result<string, DisassemblerError>> {
    if (!romPath || typeof romPath !== 'string') {
      return Err(new DisassemblerError(
        DisassemblerErrorType.ROM_NOT_FOUND,
        'ROM file path is required'
      ));
    }

    try {
      await fs.promises.access(romPath, fs.constants.R_OK);
      const stats = await fs.promises.stat(romPath);

      if (!stats.isFile()) {
        return Err(new DisassemblerError(
          DisassemblerErrorType.INVALID_ROM_FORMAT,
          'ROM path must point to a file, not a directory'
        ));
      }

      const ext = path.extname(romPath).toLowerCase();
      const validExtensions = ['.smc', '.sfc', '.fig', '.bin'];

      if (!validExtensions.includes(ext)) {
        return Err(new DisassemblerError(
          DisassemblerErrorType.INVALID_ROM_FORMAT,
          `Invalid ROM file extension. Expected: ${validExtensions.join(', ')}, got: ${ext}`
        ));
      }

      // Check file size (SNES ROMs are typically 512KB to 8MB)
      const maxSize = 8 * 1024 * 1024; // 8MB
      const minSize = 32 * 1024; // 32KB

      if (stats.size > maxSize) {
        return Err(new DisassemblerError(
          DisassemblerErrorType.INVALID_ROM_FORMAT,
          `ROM file too large: ${stats.size} bytes (max: ${maxSize})`
        ));
      }

      if (stats.size < minSize) {
        return Err(new DisassemblerError(
          DisassemblerErrorType.INVALID_ROM_FORMAT,
          `ROM file too small: ${stats.size} bytes (min: ${minSize})`
        ));
      }

      return Ok(romPath);
    } catch (error) {
      return Err(new DisassemblerError(
        DisassemblerErrorType.ROM_NOT_FOUND,
        `Cannot access ROM file: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  /**
   * Validate address range
   */
  static validateAddressRange(start?: string, end?: string): Result<{start?: number, end?: number}, DisassemblerError> {
    const result: {start?: number, end?: number} = {};

    if (start) {
      const startAddr = this.parseHexAddress(start);
      if (startAddr === null) {
        return Err(new DisassemblerError(
          DisassemblerErrorType.INVALID_ADDRESS_RANGE,
          `Invalid start address format: ${start}. Expected hex format (e.g., '8000', '0x8000', '$8000')`
        ));
      }
      result.start = startAddr;
    }

    if (end) {
      const endAddr = this.parseHexAddress(end);
      if (endAddr === null) {
        return Err(new DisassemblerError(
          DisassemblerErrorType.INVALID_ADDRESS_RANGE,
          `Invalid end address format: ${end}. Expected hex format (e.g., 'FFFF', '0xFFFF', '$FFFF')`
        ));
      }
      result.end = endAddr;
    }

    // Validate range logic
    if (result.start && result.end && result.start >= result.end) {
      return Err(new DisassemblerError(
        DisassemblerErrorType.INVALID_ADDRESS_RANGE,
        `Start address (${result.start.toString(16)}) must be less than end address (${result.end.toString(16)})`
      ));
    }

    // Validate SNES address ranges
    if (result.start && (result.start < 0 || result.start > 0xFFFFFF)) {
      return Err(new DisassemblerError(
        DisassemblerErrorType.INVALID_ADDRESS_RANGE,
        `Start address out of range: $${result.start.toString(16)} (valid range: $000000-$FFFFFF)`
      ));
    }

    if (result.end && (result.end < 0 || result.end > 0xFFFFFF)) {
      return Err(new DisassemblerError(
        DisassemblerErrorType.INVALID_ADDRESS_RANGE,
        `End address out of range: $${result.end.toString(16)} (valid range: $000000-$FFFFFF)`
      ));
    }

    return Ok(result);
  }

  /**
   * Validate output directory
   */
  static async validateOutputDirectory(outputDir: string): Promise<Result<string, DisassemblerError>> {
    try {
      const resolvedPath = path.resolve(outputDir);

      // Check if directory exists
      try {
        const stats = await fs.promises.stat(resolvedPath);
        if (!stats.isDirectory()) {
          return Err(new DisassemblerError(
            DisassemblerErrorType.OUTPUT_ERROR,
            `Output path exists but is not a directory: ${resolvedPath}`
          ));
        }
      } catch (error) {
        // Directory doesn't exist, try to create it
        try {
          await fs.promises.mkdir(resolvedPath, { recursive: true });
        } catch (mkdirError) {
          return Err(new DisassemblerError(
            DisassemblerErrorType.OUTPUT_ERROR,
            `Cannot create output directory: ${mkdirError instanceof Error ? mkdirError.message : String(mkdirError)}`
          ));
        }
      }

      // Test write permissions
      try {
        await fs.promises.access(resolvedPath, fs.constants.W_OK);
      } catch (error) {
        return Err(new DisassemblerError(
          DisassemblerErrorType.OUTPUT_ERROR,
          `No write permission for output directory: ${resolvedPath}`
        ));
      }

      return Ok(resolvedPath);
    } catch (error) {
      return Err(new DisassemblerError(
        DisassemblerErrorType.OUTPUT_ERROR,
        `Invalid output directory: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  /**
   * Validate CLI options
   */
  static validateCLIOptions(options: CLIOptions): Result<CLIOptions, DisassemblerError[]> {
    const errors: DisassemblerError[] = [];

    // Validate output format
    if (options.format) {
      const validFormats = ['ca65', 'wla-dx', 'bass', 'html', 'json', 'xml', 'csv', 'markdown'];
      if (!validFormats.includes(options.format)) {
        errors.push(new DisassemblerError(
          DisassemblerErrorType.OUTPUT_ERROR,
          `Invalid output format: ${options.format}. Valid formats: ${validFormats.join(', ')}`
        ));
      }
    }

    // Validate asset types
    if (options.assetTypes) {
      const validAssetTypes = ['graphics', 'audio', 'text'];
      const requestedTypes = options.assetTypes.split(',').map(t => t.trim());
      const invalidTypes = requestedTypes.filter(t => !validAssetTypes.includes(t));

      if (invalidTypes.length > 0) {
        errors.push(new DisassemblerError(
          DisassemblerErrorType.OUTPUT_ERROR,
          `Invalid asset types: ${invalidTypes.join(', ')}. Valid types: ${validAssetTypes.join(', ')}`
        ));
      }
    }

    // Validate BRR sample rate
    if (options.brrSampleRate) {
      const sampleRate = parseInt(options.brrSampleRate);
      if (isNaN(sampleRate) || sampleRate < 1000 || sampleRate > 96000) {
        errors.push(new DisassemblerError(
          DisassemblerErrorType.BRR_DECODE_ERROR,
          `Invalid BRR sample rate: ${options.brrSampleRate}. Valid range: 1000-96000 Hz`
        ));
      }
    }

    // Validate BRR max samples
    if (options.brrMaxSamples) {
      const maxSamples = parseInt(options.brrMaxSamples);
      if (isNaN(maxSamples) || maxSamples < 1 || maxSamples > 10000000) {
        errors.push(new DisassemblerError(
          DisassemblerErrorType.BRR_DECODE_ERROR,
          `Invalid BRR max samples: ${options.brrMaxSamples}. Valid range: 1-10000000`
        ));
      }
    }

    if (errors.length > 0) {
      return Err(errors);
    }

    return Ok(options);
  }

  /**
   * Parse hex address from various formats
   */
  private static parseHexAddress(address: string): number | null {
    if (!address || typeof address !== 'string') {
      return null;
    }

    // Remove common prefixes
    let cleanAddress = address.trim().toLowerCase();
    if (cleanAddress.startsWith('0x')) {
      cleanAddress = cleanAddress.substring(2);
    } else if (cleanAddress.startsWith('$')) {
      cleanAddress = cleanAddress.substring(1);
    }

    // Validate hex characters
    if (!/^[0-9a-f]+$/.test(cleanAddress)) {
      return null;
    }

    const parsed = parseInt(cleanAddress, 16);
    return isNaN(parsed) ? null : parsed;
  }
}
