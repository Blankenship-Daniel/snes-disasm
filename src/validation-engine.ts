/**
 * SNES Disassembler Validation Engine
 *
 * Provides real-time validation and enhancement of disassembly output
 * using authoritative SNES reference data from snes-mcp-server
 */

import {
  INSTRUCTION_REFERENCE,
  REGISTER_REFERENCE,
  validateInstruction,
  validateRegister,
  getRegisterInfo,
  generateInstructionComment,
  generateRegisterComment,
  type InstructionReference,
  type RegisterReference
} from './snes-reference-tables';

import { DisassemblyLine } from './types';
import { createLogger, Logger } from './utils/logger';

// =====================================================================
// VALIDATION RESULTS
// =====================================================================

export interface ValidationResult {
  isValid: boolean;
  accuracy: number; // 0.0 to 1.0
  discrepancies: ValidationDiscrepancy[];
  enhancements: ValidationEnhancement[];
  summary: ValidationSummary;
}

export interface ValidationDiscrepancy {
  type: 'instruction' | 'register' | 'addressing' | 'timing';
  severity: 'error' | 'warning' | 'info';
  message: string;
  address: number;
  expected?: any;
  actual?: any;
  reference?: InstructionReference | RegisterReference;
}

export interface ValidationEnhancement {
  type: 'comment' | 'label' | 'context' | 'reference';
  address: number;
  content: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ValidationSummary {
  totalInstructions: number;
  validatedInstructions: number;
  totalRegisters: number;
  validatedRegisters: number;
  accuracyScore: number;
  recommendedImprovements: string[];
}

// =====================================================================
// VALIDATION ENGINE
// =====================================================================

export class SNESValidationEngine {
  private instructionStats = new Map<number, number>();
  private registerStats = new Map<number, { reads: number; writes: number }>();
  private validationResults: ValidationDiscrepancy[] = [];
  private enhancements: ValidationEnhancement[] = [];
  private logger: Logger;
  private validationCache = new Map<string, ValidationResult>();
  private logLevel: 'minimal' | 'normal' | 'verbose';
  private errorFrequency = new Map<string, number>();
  
  constructor(logLevel: 'minimal' | 'normal' | 'verbose' = 'normal') {
    this.logger = createLogger('SNESValidationEngine');
    this.logLevel = logLevel;
  }

  /**
   * Generate cache key for validation request
   */
  private generateValidationCacheKey(lines: DisassemblyLine[]): string {
    // Create a hash based on instruction content for caching
    const content = lines.map(line => `${line.address}:${line.instruction.opcode}:${line.operand || ''}`).join('|');
    return require('crypto').createHash('md5').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Generate error key based on type and specific details for frequency tracking
   */
  private generateErrorKey(discrepancy: ValidationDiscrepancy): string {
    const { type, severity, message } = discrepancy;
    
    // Create a normalized key for similar errors
    let normalizedMessage = message;
    
    // Normalize common patterns to group similar errors
    if (type === 'instruction') {
      // Group instruction errors by the general error type rather than specific opcodes
      normalizedMessage = message
        .replace(/\$[0-9A-Fa-f]+/g, '$XX') // Replace hex addresses with placeholder
        .replace(/\b\d+\b/g, 'N'); // Replace numbers with placeholder
    } else if (type === 'register') {
      // Group register errors by register type and operation
      normalizedMessage = message
        .replace(/\$[0-9A-Fa-f]+/g, '$XXXX') // Replace hex addresses with placeholder
        .replace(/\bat address \$[0-9A-Fa-f]+/g, 'at address $XXXX');
    } else if (type === 'addressing') {
      // Group addressing mode errors by the specific mode mismatch pattern
      normalizedMessage = message; // Keep addressing mode errors as-is for now
    }
    
    return `${type}:${severity}:${normalizedMessage}`;
  }

  /**
   * Validate a complete disassembly against SNES reference data
   */
  validateDisassembly(lines: DisassemblyLine[]): ValidationResult {
    // Check cache first for this exact validation request
    const cacheKey = this.generateValidationCacheKey(lines);
    const cachedResult = this.validationCache.get(cacheKey);
    
    if (cachedResult) {
      if (this.logLevel === 'verbose') {
        this.logger.debug('Using cached validation result', { 
          lines: lines.length, 
          cacheKey: cacheKey.substring(0, 8) + '...' 
        });
      }
      return cachedResult;
    }
    
    this.reset();

    if (this.logLevel !== 'minimal') {
      this.logger.info('🔍 Starting SNES reference validation...', { lines: lines.length });
    }

    // Validate each instruction
    for (const line of lines) {
      this.validateDisassemblyLine(line);
    }

    // Generate summary
    const summary = this.generateSummary(lines);
    
    // Log based on verbosity level
    if (this.logLevel === 'verbose') {
      this.logValidationSummary();
    } else if (this.logLevel === 'normal') {
      this.logNormalSummary();
    }
    // For minimal, only log final summary

    if (this.logLevel !== 'minimal') {
      this.logger.info(`✅ Validation complete: ${summary.accuracyScore.toFixed(1)}% accuracy`);
    } else {
      // Minimal: Only log final summary with error counts
      this.logMinimalSummary(summary);
    }

    const result: ValidationResult = {
      isValid: summary.accuracyScore >= 90.0,
      accuracy: summary.accuracyScore,
      discrepancies: this.validationResults,
      enhancements: this.enhancements,
      summary
    };
    
    // Cache the result for future use
    this.validationCache.set(cacheKey, result);
    
    // Limit cache size to prevent memory issues
    if (this.validationCache.size > 50) {
      const firstKey = this.validationCache.keys().next().value;
      if (firstKey) {
        this.validationCache.delete(firstKey);
      }
    }
    
    return result;
  }

  /**
   * Validate a single disassembly line
   */
  private validateDisassemblyLine(line: DisassemblyLine): void {
    if (!line.instruction) return;

    const { opcode, mnemonic, addressingMode } = line.instruction;
    const { operand } = line;

    // Track instruction usage
    this.instructionStats.set(opcode, (this.instructionStats.get(opcode) || 0) + 1);

    // Validate instruction against reference
    const validation = validateInstruction(opcode, mnemonic, line.bytes?.length);

    if (!validation.isValid) {
      // Add debug logging for instruction validation failures
      if (this.logLevel === 'verbose') {
        this.logger.debug('Instruction validation failed', {
          address: `$${line.address.toString(16).toUpperCase().padStart(6, '0')}`,
          opcode: `$${opcode.toString(16).toUpperCase().padStart(2, '0')}`,
          actualMnemonic: mnemonic,
          expectedMnemonic: validation.reference?.mnemonic || 'UNKNOWN',
          actualByteLength: line.bytes?.length || 0,
          expectedByteLength: validation.reference?.bytes || 0,
          discrepancies: validation.discrepancies
        });
      }
      
      // Log individual failures only in verbose mode
      if (this.logLevel === 'verbose') {
        this.logger.warn(`Invalid instruction at $${line.address.toString(16).toUpperCase().padStart(6, '0')}: ${validation.discrepancies.join(', ')}`);
      }
      
      const discrepancy = {
        type: 'instruction' as const,
        severity: 'error' as const,
        message: validation.discrepancies.join(', '),
        address: line.address,
        actual: { opcode, mnemonic, bytes: line.bytes?.length }
      };
      
      this.validationResults.push(discrepancy);
      
      // Track error frequency
      const errorKey = this.generateErrorKey(discrepancy);
      this.errorFrequency.set(errorKey, (this.errorFrequency.get(errorKey) || 0) + 1);
      return;
    }

    const reference = validation.reference!;

    // Check addressing mode consistency
    if (addressingMode && reference.addressingMode !== addressingMode) {
      // Add debug logging for addressing mode mismatches
      this.logger.debug('Addressing mode mismatch detected', {
        address: `$${line.address.toString(16).toUpperCase().padStart(6, '0')}`,
        opcode: `$${opcode.toString(16).toUpperCase().padStart(2, '0')}`,
        mnemonic: mnemonic,
        expectedMode: reference.addressingMode,
        actualMode: addressingMode
      });
      
      this.logger.warn(`Addressing mode mismatch at $${line.address.toString(16).toUpperCase().padStart(6, '0')}: expected ${reference.addressingMode}, got ${addressingMode}`);
      
      const discrepancy = {
        type: 'addressing' as const,
        severity: 'warning' as const,
        message: `Addressing mode mismatch: expected ${reference.addressingMode}, got ${addressingMode}`,
        address: line.address,
        expected: reference.addressingMode,
        actual: addressingMode,
        reference
      };
      
      this.validationResults.push(discrepancy);
      
      // Track error frequency
      const errorKey = this.generateErrorKey(discrepancy);
      this.errorFrequency.set(errorKey, (this.errorFrequency.get(errorKey) || 0) + 1);
    }

    // Generate enhanced instruction comment
    const instructionComment = generateInstructionComment(opcode, operand);
    if (instructionComment) {
      this.enhancements.push({
        type: 'comment',
        address: line.address,
        content: instructionComment,
        priority: 'medium'
      });
    }

    // Validate register access if this is a register operation
    if (operand !== undefined && this.isRegisterAddress(operand)) {
      this.validateRegisterAccess(line.address, operand, mnemonic);
    }
  }

  /**
   * Validate register access against SNES hardware specifications
   */
  private validateRegisterAccess(address: number, registerAddr: number, mnemonic: string): void {
    const operation = this.getOperationType(mnemonic);
    if (!operation) return;

    // Track register usage
    const stats = this.registerStats.get(registerAddr) || { reads: 0, writes: 0 };
    if (operation === 'read') {
      stats.reads++;
    } else {
      stats.writes++;
    }
    this.registerStats.set(registerAddr, stats);

    // Validate against reference
    const validation = validateRegister(registerAddr, operation);

    if (!validation.isValid) {
      // Add debug logging for register validation failures
      this.logger.debug('Register validation failed', {
        address: `$${address.toString(16).toUpperCase().padStart(6, '0')}`,
        registerAddress: `$${registerAddr.toString(16).toUpperCase().padStart(4, '0')}`,
        operationType: operation,
        mnemonic: mnemonic,
        violations: validation.warnings,
        reference: validation.reference
      });
      
      this.logger.warn(`Invalid register access at $${address.toString(16).toUpperCase().padStart(6, '0')}: ${operation} operation on register $${registerAddr.toString(16).toUpperCase().padStart(4, '0')} - ${validation.warnings.join(', ')}`);
      
      const discrepancy = {
        type: 'register' as const,
        severity: 'error' as const,
        message: validation.warnings.join(', '),
        address,
        actual: { register: registerAddr, operation }
      };
      
      this.validationResults.push(discrepancy);
      
      // Track error frequency
      const errorKey = this.generateErrorKey(discrepancy);
      this.errorFrequency.set(errorKey, (this.errorFrequency.get(errorKey) || 0) + 1);
      return;
    }

    // Add warnings for access violations
    if (validation.warnings.length > 0) {
      // Add debug logging for register access warnings
      this.logger.debug('Register access warning', {
        address: `$${address.toString(16).toUpperCase().padStart(6, '0')}`,
        registerAddress: `$${registerAddr.toString(16).toUpperCase().padStart(4, '0')}`,
        operationType: operation,
        mnemonic: mnemonic,
        warnings: validation.warnings,
        reference: validation.reference
      });
      
      this.logger.warn(`Register access warning at $${address.toString(16).toUpperCase().padStart(6, '0')}: ${operation} operation on register $${registerAddr.toString(16).toUpperCase().padStart(4, '0')} - ${validation.warnings.join(', ')}`);
      
      const discrepancy = {
        type: 'register' as const,
        severity: 'warning' as const,
        message: validation.warnings.join(', '),
        address,
        reference: validation.reference
      };
      
      this.validationResults.push(discrepancy);
      
      // Track error frequency
      const errorKey = this.generateErrorKey(discrepancy);
      this.errorFrequency.set(errorKey, (this.errorFrequency.get(errorKey) || 0) + 1);
    }

    // Generate enhanced register comment
    const registerComment = generateRegisterComment(registerAddr, operation);
    if (registerComment) {
      this.enhancements.push({
        type: 'comment',
        address,
        content: registerComment,
        priority: 'high'
      });
    }

    // Add contextual information for important registers
    const registerInfo = getRegisterInfo(registerAddr);
    if (registerInfo.name && this.isImportantRegister(registerAddr)) {
      this.enhancements.push({
        type: 'context',
        address,
        content: `${registerInfo.name}: ${registerInfo.description}`,
        priority: 'high'
      });
    }
  }

  /**
   * Generate comprehensive validation summary
   */
  private generateSummary(lines: DisassemblyLine[]): ValidationSummary {
    const totalInstructions = lines.filter(line => line.instruction).length;
    const instructionErrors = this.validationResults.filter(r => r.type === 'instruction').length;
    const registerErrors = this.validationResults.filter(r => r.type === 'register').length;
    const addressingErrors = this.validationResults.filter(r => r.type === 'addressing').length;

    const validatedInstructions = totalInstructions - instructionErrors;
    const totalRegisters = this.registerStats.size;
    const validatedRegisters = totalRegisters - registerErrors;

    const accuracyScore = totalInstructions > 0 ? (validatedInstructions / totalInstructions) * 100 : 0;
    const recommendedImprovements = this.generateRecommendations();

    return {
      totalInstructions,
      validatedInstructions,
      totalRegisters,
      validatedRegisters,
      accuracyScore,
      recommendedImprovements
    };
  }

  /**
   * Log detailed validation summary (verbose mode)
   */
  private logValidationSummary(): void {
    const errorCategories = {
      instruction: this.validationResults.filter(r => r.type === 'instruction').length,
      register: this.validationResults.filter(r => r.type === 'register').length,
      addressing: this.validationResults.filter(r => r.type === 'addressing').length
    };
    
    this.logger.info('Validation Error Summary:', errorCategories);

    // Use the new getMostCommonErrors method for better insights
    const topCommonErrors = this.getMostCommonErrors(5);
    if (topCommonErrors.length > 0) {
      this.logger.info('Top 5 Common Error Patterns:', topCommonErrors.map(([key, count]) => {
        // Extract readable information from the error key
        const [type, severity, message] = key.split(':', 3);
        return {
          type,
          severity,
          pattern: message,
          count
        };
      }));
    }

    const addressIssues = this.validationResults
      .map(r => r.address)
      .reduce((acc, address) => {
        acc[address] = (acc[address] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

    const topAddressIssues = Object.entries(addressIssues)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    this.logger.info('Top Addresses with Issues:', topAddressIssues);
    
    // Log all individual validation failures in verbose mode
    if (this.validationResults.length > 0) {
      this.logger.info('Individual Validation Failures:');
      for (const result of this.validationResults) {
        const addressStr = `$${result.address.toString(16).toUpperCase().padStart(6, '0')}`;
        this.logger.info(`  ${addressStr}: [${result.severity.toUpperCase()}] ${result.type} - ${result.message}`);
      }
    }
  }
  
  /**
   * Log normal validation summary (normal mode)
   */
  private logNormalSummary(): void {
    const errorCategories = {
      instruction: this.validationResults.filter(r => r.type === 'instruction').length,
      register: this.validationResults.filter(r => r.type === 'register').length,
      addressing: this.validationResults.filter(r => r.type === 'addressing').length
    };
    
    this.logger.info('Validation Error Summary:', errorCategories);

    if (this.validationResults.length > 0) {
      const commonErrors = this.validationResults
        .map(r => r.message)
        .reduce((acc, message) => {
          acc[message] = (acc[message] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const topCommonErrors = Object.entries(commonErrors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3); // Show fewer errors than verbose mode

      this.logger.info('Top 3 Common Errors:', topCommonErrors);
    }
  }
  
  /**
   * Log minimal validation summary (minimal mode)
   */
  private logMinimalSummary(summary: ValidationSummary): void {
    const totalErrors = this.validationResults.filter(r => r.severity === 'error').length;
    const totalWarnings = this.validationResults.filter(r => r.severity === 'warning').length;
    
    this.logger.info(`Validation: ${summary.accuracyScore.toFixed(1)}% accuracy, ${totalErrors} errors, ${totalWarnings} warnings`);
  }

  /**
   * Generate specific recommendations for improvement
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Check for common issues
    const instructionErrors = this.validationResults.filter(r => r.type === 'instruction' && r.severity === 'error');
    if (instructionErrors.length > 0) {
      recommendations.push(`Fix ${instructionErrors.length} instruction decoding errors`);
    }

    const registerWarnings = this.validationResults.filter(r => r.type === 'register' && r.severity === 'warning');
    if (registerWarnings.length > 0) {
      recommendations.push(`Review ${registerWarnings.length} register access violations`);
    }

    // Check for missing common instructions
    const commonOpcodes = [0x78, 0x9C, 0x20, 0xA9, 0x8D]; // SEI, STZ, JSR, LDA, STA
    const missingCommon = commonOpcodes.filter(opcode => !this.instructionStats.has(opcode));
    if (missingCommon.length > 0) {
      recommendations.push('Add support for common missing opcodes: ' +
        missingCommon.map(op => `$${op.toString(16).toUpperCase()}`).join(', '));
    }

    // Check for register coverage
    const importantRegisters = [0x2100, 0x4200, 0x2140]; // INIDISP, NMITIMEN, APUIO0
    const missingRegisters = importantRegisters.filter(addr => !this.registerStats.has(addr));
    if (missingRegisters.length > 0) {
      recommendations.push('Improve detection of important registers: ' +
        missingRegisters.map(addr => `$${addr.toString(16).toUpperCase()}`).join(', '));
    }

    return recommendations;
  }

  /**
   * Enhance disassembly output with reference data
   */
  enhanceDisassemblyOutput(lines: DisassemblyLine[]): DisassemblyLine[] {
    const validationResult = this.validateDisassembly(lines);

    return lines.map(line => {
      if (!line.instruction) return line;

      // Find relevant enhancements for this line
      const lineEnhancements = validationResult.enhancements.filter(e => e.address === line.address);

      if (lineEnhancements.length === 0) return line;

      // Add enhanced comments
      const comments = lineEnhancements
        .filter(e => e.type === 'comment')
        .map(e => e.content);

      const context = lineEnhancements
        .filter(e => e.type === 'context')
        .map(e => e.content);

      return {
        ...line,
        comment: comments.length > 0 ? comments.join(' | ') : line.comment
      };
    });
  }

  /**
   * Generate detailed validation report
   */
  generateValidationReport(result: ValidationResult): string {
    let report = '# SNES Disassembly Validation Report\\n\\n';

    report += '## Summary\\n';
    report += `- **Overall Accuracy**: ${result.accuracy.toFixed(1)}%\\n`;
    report += `- **Instructions Validated**: ${result.summary.validatedInstructions}/${result.summary.totalInstructions}\\n`;
    report += `- **Registers Validated**: ${result.summary.validatedRegisters}/${result.summary.totalRegisters}\\n`;
    report += `- **Status**: ${result.isValid ? '✅ PASS' : '❌ FAIL'}\\n\\n`;

    if (result.discrepancies.length > 0) {
      report += '## Issues Found\\n\\n';

      const errors = result.discrepancies.filter(d => d.severity === 'error');
      const warnings = result.discrepancies.filter(d => d.severity === 'warning');

      if (errors.length > 0) {
        report += `### Errors (${errors.length})\\n`;
        errors.forEach(error => {
          report += `- **$${error.address.toString(16).toUpperCase()}**: ${error.message}\\n`;
        });
        report += '\\n';
      }

      if (warnings.length > 0) {
        report += `### Warnings (${warnings.length})\\n`;
        warnings.forEach(warning => {
          report += `- **$${warning.address.toString(16).toUpperCase()}**: ${warning.message}\\n`;
        });
        report += '\\n';
      }
    }

    if (result.summary.recommendedImprovements.length > 0) {
      report += '## Recommended Improvements\\n\\n';
      result.summary.recommendedImprovements.forEach(improvement => {
        report += `- ${improvement}\\n`;
      });
      report += '\\n';
    }

    report += '## Reference Statistics\\n\\n';
    report += `- **Instruction Coverage**: ${this.instructionStats.size} unique opcodes\\n`;
    report += `- **Register Coverage**: ${this.registerStats.size} unique registers\\n`;
    report += `- **Validation Rules Applied**: ${Object.keys(INSTRUCTION_REFERENCE).length} instruction rules, ${Object.keys(REGISTER_REFERENCE).length} register rules\\n`;

    return report;
  }

  // =====================================================================
  // UTILITY METHODS
  // =====================================================================

  private reset(): void {
    this.instructionStats.clear();
    this.registerStats.clear();
    this.validationResults = [];
    this.enhancements = [];
    this.errorFrequency.clear();
  }
  
  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.validationCache.clear();
    this.logger.debug('Validation cache cleared');
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.validationCache.size,
      maxSize: 50
    };
  }

  /**
   * Get most common errors
   */
  getMostCommonErrors(limit: number): [string, number][] {
    return Array.from(this.errorFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }

  private isRegisterAddress(address: number): boolean {
    // SNES hardware registers are in specific ranges
    return (address >= 0x2100 && address <= 0x21FF) || // PPU registers
           (address >= 0x4200 && address <= 0x43FF) || // CPU registers
           (address >= 0x2140 && address <= 0x2143);   // APU I/O ports
  }

  private getOperationType(mnemonic: string): 'read' | 'write' | null {
    const writeInstructions = ['STA', 'STX', 'STY', 'STZ'];
    const readInstructions = ['LDA', 'LDX', 'LDY', 'ADC', 'SBC', 'CMP', 'CPX', 'CPY', 'AND', 'ORA', 'EOR', 'BIT', 'TSB', 'TRB'];
    const readModifyWriteInstructions = ['INC', 'DEC', 'ASL', 'LSR', 'ROL', 'ROR'];

    if (writeInstructions.includes(mnemonic)) return 'write';
    if (readInstructions.includes(mnemonic)) return 'read';
    if (readModifyWriteInstructions.includes(mnemonic)) return 'write'; // These do both, count as write
    return null;
  }

  private isImportantRegister(address: number): boolean {
    const importantRegisters = [
      0x2100, // INIDISP
      0x4200, // NMITIMEN
      0x2140, 0x2141, 0x2142, 0x2143, // APU I/O
      0x420B, 0x420C, // DMA enable
      0x2105, // BGMODE
      0x212C, 0x212D // Screen enable
    ];
    return importantRegisters.includes(address);
  }
}

// =====================================================================
// EXPORT VALIDATION UTILITIES
// =====================================================================

/**
 * Quick validation of an instruction opcode
 */
export function quickValidateOpcode(opcode: number): boolean {
  return opcode in INSTRUCTION_REFERENCE;
}

/**
 * Quick validation of a register address
 */
export function quickValidateRegister(address: number): boolean {
  return address in REGISTER_REFERENCE;
}

/**
 * Get reference data for an instruction
 */
export function getInstructionReference(opcode: number): InstructionReference | undefined {
  return INSTRUCTION_REFERENCE[opcode];
}

/**
 * Get reference data for a register
 */
export function getRegisterReference(address: number): RegisterReference | undefined {
  return REGISTER_REFERENCE[address];
}

/**
 * Standalone validation function for integration testing
 */
export function validateSNESDisassembly(lines: DisassemblyLine[]): ValidationResult {
  const engine = new SNESValidationEngine();
  return engine.validateDisassembly(lines);
}