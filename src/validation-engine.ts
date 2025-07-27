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

  /**
   * Validate a complete disassembly against SNES reference data
   */
  validateDisassembly(lines: DisassemblyLine[]): ValidationResult {
    this.reset();

    console.log('🔍 Starting SNES reference validation...');

    // Validate each instruction
    for (const line of lines) {
      this.validateDisassemblyLine(line);
    }

    // Generate summary
    const summary = this.generateSummary(lines);

    console.log(`✅ Validation complete: ${summary.accuracyScore.toFixed(1)}% accuracy`);

    return {
      isValid: summary.accuracyScore >= 90.0,
      accuracy: summary.accuracyScore,
      discrepancies: this.validationResults,
      enhancements: this.enhancements,
      summary
    };
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
      this.validationResults.push({
        type: 'instruction',
        severity: 'error',
        message: validation.discrepancies.join(', '),
        address: line.address,
        actual: { opcode, mnemonic, bytes: line.bytes?.length }
      });
      return;
    }

    const reference = validation.reference!;

    // Check addressing mode consistency
    if (addressingMode && reference.addressingMode !== addressingMode) {
      this.validationResults.push({
        type: 'addressing',
        severity: 'warning',
        message: `Addressing mode mismatch: expected ${reference.addressingMode}, got ${addressingMode}`,
        address: line.address,
        expected: reference.addressingMode,
        actual: addressingMode,
        reference
      });
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
      this.validationResults.push({
        type: 'register',
        severity: 'error',
        message: validation.warnings.join(', '),
        address,
        actual: { register: registerAddr, operation }
      });
      return;
    }

    // Add warnings for access violations
    if (validation.warnings.length > 0) {
      this.validationResults.push({
        type: 'register',
        severity: 'warning',
        message: validation.warnings.join(', '),
        address,
        reference: validation.reference
      });
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
    const validatedInstructions = totalInstructions - this.validationResults.filter(r => r.type === 'instruction' && r.severity === 'error').length;

    const totalRegisters = this.registerStats.size;
    const validatedRegisters = totalRegisters - this.validationResults.filter(r => r.type === 'register' && r.severity === 'error').length;

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