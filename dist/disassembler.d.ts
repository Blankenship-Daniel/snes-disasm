import { DisassemblyLine, DisassemblerOptions } from './types';
import { SNESRom } from './rom-parser';
import { OutputOptions } from './output-formats-extended';
import { SymbolManager } from './symbol-manager';
import { type ValidationResult } from './validation-engine';
export declare class SNESDisassembler {
    private decoder;
    private rom;
    private labels;
    private comments;
    private analysisEngine;
    private symbolManager;
    private validationEngine;
    private enableValidation;
    private enhanceComments;
    private logger;
    constructor(romPath: string, options?: DisassemblerOptions);
    getRomInfo(): SNESRom;
    disassemble(startAddress?: number, endAddress?: number): DisassemblyLine[];
    disassembleFunction(startAddress: number, maxInstructions?: number): DisassemblyLine[];
    formatOutput(lines: DisassemblyLine[]): string;
    formatOutputWithAnalysis(lines: DisassemblyLine[]): string;
    private formatOperandWithSymbols;
    addLabel(address: number, label: string): void;
    addComment(address: number, comment: string): void;
    /**
     * Export analyzed SPC state to an SPC file
     */
    exportSPC(outputPath: string): Uint8Array;
    analyze(): {
        functions: number[];
        data: number[];
    };
    getAnalysisResults(): {
        controlFlowGraph: import("./analysis-engine").ControlFlowGraph;
        symbols: Map<number, import("./analysis-engine").SymbolInfo>;
        crossReferences: Map<number, import("./analysis-engine").CrossReference[]>;
        dataStructures: Map<number, import("./analysis-engine").DataStructure>;
        functions: Map<number, import("./analysis-engine").FunctionInfo>;
    };
    private analyzeFunction;
    /**
     * Generate output in specified format using Phase 4 formatters
     */
    formatOutputAs(lines: DisassemblyLine[], format: string, options?: OutputOptions): string;
    /**
     * Export disassembly to file with automatic format detection
     */
    exportToFile(filePath: string, format?: string, options?: OutputOptions): void;
    /**
     * Get symbol manager for advanced symbol operations
     */
    getSymbolManager(): SymbolManager;
    /**
     * Import symbols from external file
     */
    importSymbols(filePath: string, format?: 'sym' | 'mlb' | 'json' | 'csv'): void;
    /**
     * Export symbols to external file
     */
    exportSymbols(filePath: string, format?: 'sym' | 'mlb' | 'json' | 'csv'): void;
    /**
     * Generate comprehensive documentation in multiple formats
     */
    generateDocumentation(outputDir: string): void;
    /**
     * Get supported output formats
     */
    static getSupportedFormats(): string[];
    /**
     * Convert analysis engine symbols to output formatter format
     */
    private convertAnalysisSymbolsToOutputFormat;
    /**
     * Convert analysis engine symbol types to output format
     */
    private convertSymbolType;
    /**
     * Generate cross-references from disassembly lines
     */
    private generateCrossReferences;
    /**
     * Determine reference type from instruction mnemonic
     */
    private determineReferenceType;
    /**
     * Sync current labels with symbol manager
     */
    private syncLabelsToSymbolManager;
    /**
     * Validate disassembly using SNES reference tables
     */
    private validateDisassembly;
    /**
     * Enhance a disassembly line with reference data
     */
    private enhanceLineWithReferenceData;
    /**
     * Check if an address is a SNES hardware register
     */
    private isRegisterAddress;
    /**
     * Determine operation type from instruction mnemonic
     */
    private getOperationType;
    /**
     * Get validation results for the last disassembly
     */
    getValidationResults(): ValidationResult | null;
    /**
     * Generate a validation report for the current disassembly
     */
    generateValidationReport(): string;
    /**
     * Enable or disable reference-based validation
     */
    setValidationEnabled(enabled: boolean): void;
    /**
     * Enable or disable comment enhancement
     */
    setCommentEnhancementEnabled(enabled: boolean): void;
    /**
     * Get reference data for a specific instruction opcode
     */
    getInstructionReference(opcode: number): import("./snes-reference-tables").InstructionReference;
    /**
     * Validate a specific instruction against reference data
     */
    validateInstructionOpcode(opcode: number, expectedMnemonic?: string, expectedBytes?: number): {
        isValid: boolean;
        reference?: import("./snes-reference-tables").InstructionReference;
        discrepancies: string[];
    };
    /**
     * Validate a register access
     */
    validateRegisterAccess(address: number, operation: 'read' | 'write'): {
        isValid: boolean;
        reference?: import("./snes-reference-tables").RegisterReference;
        warnings: string[];
    };
}
//# sourceMappingURL=disassembler.d.ts.map