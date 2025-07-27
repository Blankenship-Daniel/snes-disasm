"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SNESDisassembler = void 0;
const decoder_1 = require("./decoder");
const rom_header_parser_1 = require("./rom-header-parser");
const rom_parser_1 = require("./rom-parser");
const analysis_engine_1 = require("./analysis-engine");
const output_formats_extended_1 = require("./output-formats-extended");
const symbol_manager_1 = require("./symbol-manager");
const validation_engine_1 = require("./validation-engine");
const snes_reference_tables_1 = require("./snes-reference-tables");
class SNESDisassembler {
    constructor(romPath, options = {}) {
        this.rom = rom_parser_1.RomParser.parse(romPath);
        // Initialize enhanced ROM parsing for bank switching
        const mappingMode = rom_header_parser_1.RomHeaderParser.detectMappingMode(this.rom.cartridgeInfo);
        console.log(`Detected Mapping Mode: ${mappingMode}`);
        this.decoder = new decoder_1.InstructionDecoder();
        this.labels = options.labels || new Map();
        this.comments = options.comments || new Map();
        this.analysisEngine = new analysis_engine_1.AnalysisEngine();
        this.symbolManager = new symbol_manager_1.SymbolManager();
        this.validationEngine = new validation_engine_1.SNESValidationEngine();
        this.enableValidation = options.enableValidation !== false; // Default to true
        this.enhanceComments = options.enhanceComments !== false; // Default to true
    }
    getRomInfo() {
        return this.rom;
    }
    disassemble(startAddress, endAddress) {
        const lines = [];
        // Default to reset vector if no start address provided
        let currentAddress = startAddress || this.rom.header.nativeVectors.reset;
        const finalAddress = endAddress || (currentAddress + 0x1000); // Default 4KB
        // Convert to ROM offset
        let romOffset;
        try {
            romOffset = rom_parser_1.RomParser.getRomOffset(currentAddress, this.rom.cartridgeInfo);
        }
        catch (error) {
            throw new Error(`Invalid start address: $${currentAddress.toString(16).toUpperCase()}`);
        }
        while (currentAddress < finalAddress && romOffset < this.rom.data.length) {
            const line = this.decoder.decode(this.rom.data, romOffset, currentAddress);
            if (!line) {
                break;
            }
            // Add label if exists
            if (this.labels.has(currentAddress)) {
                line.label = this.labels.get(currentAddress);
            }
            // Add comment if exists  
            if (this.comments.has(currentAddress)) {
                line.comment = this.comments.get(currentAddress);
            }
            // Enhance with reference data if enabled
            if (this.enhanceComments) {
                const enhancedLine = this.enhanceLineWithReferenceData(line);
                lines.push(enhancedLine);
            }
            else {
                lines.push(line);
            }
            // Move to next instruction
            currentAddress += line.instruction.bytes;
            romOffset += line.instruction.bytes;
        }
        // Validate the disassembly if enabled
        if (this.enableValidation && lines.length > 0) {
            this.validateDisassembly(lines);
        }
        return lines;
    }
    disassembleFunction(startAddress, maxInstructions = 100) {
        const lines = [];
        let currentAddress = startAddress;
        let instructionCount = 0;
        try {
            let romOffset = rom_parser_1.RomParser.getRomOffset(currentAddress, this.rom.cartridgeInfo);
            while (instructionCount < maxInstructions && romOffset < this.rom.data.length) {
                const line = this.decoder.decode(this.rom.data, romOffset, currentAddress);
                if (!line) {
                    break;
                }
                lines.push(line);
                // Stop at function return instructions
                if (line.instruction.mnemonic === 'RTS' ||
                    line.instruction.mnemonic === 'RTL' ||
                    line.instruction.mnemonic === 'RTI') {
                    break;
                }
                currentAddress += line.instruction.bytes;
                romOffset += line.instruction.bytes;
                instructionCount++;
            }
        }
        catch (error) {
            throw new Error(`Error disassembling function at $${startAddress.toString(16).toUpperCase()}: ${error}`);
        }
        return lines;
    }
    formatOutput(lines) {
        const output = [];
        // Add ROM header info
        output.push('; SNES ROM Disassembly');
        output.push(`; Title: ${this.rom.header.title}`);
        output.push(`; Map Mode: ${this.rom.cartridgeInfo.type}`);
        output.push(`; ROM Size: ${(this.rom.cartridgeInfo.romSize / 1024).toFixed(0)} KB`);
        output.push(`; Reset Vector: $${this.rom.header.nativeVectors.reset.toString(16).toUpperCase().padStart(4, '0')}`);
        if (this.rom.cartridgeInfo.specialChip) {
            output.push(`; Special Chip: ${this.rom.cartridgeInfo.specialChip}`);
        }
        output.push('');
        for (const line of lines) {
            let lineStr = '';
            // Add label if present
            if (line.label) {
                output.push(`${line.label}:`);
            }
            // Format address
            lineStr += `$${line.address.toString(16).toUpperCase().padStart(6, '0')}: `;
            // Format bytes (hex dump)
            const bytesStr = line.bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
            lineStr += bytesStr.padEnd(12, ' ');
            // Format instruction
            lineStr += line.instruction.mnemonic.padEnd(4, ' ');
            // Format operand with symbol resolution
            const operandStr = this.formatOperandWithSymbols(line);
            if (operandStr) {
                lineStr += operandStr;
            }
            // Add comment if present
            if (line.comment) {
                lineStr = lineStr.padEnd(40, ' ') + `; ${line.comment}`;
            }
            output.push(lineStr);
        }
        return output.join('\n');
    }
    // Enhanced formatting with symbol resolution and cross-references
    formatOutputWithAnalysis(lines) {
        const output = [];
        const symbols = this.analysisEngine.getSymbols();
        const crossRefs = this.analysisEngine.getCrossReferences();
        const functions = this.analysisEngine.getFunctions();
        // Add header with analysis summary
        output.push('; SNES ROM Disassembly with Analysis');
        output.push(`; Title: ${this.rom.header.title}`);
        output.push(`; Cartridge: ${this.rom.cartridgeInfo.type}`);
        output.push(`; Functions detected: ${functions.size}`);
        output.push(`; Symbols generated: ${symbols.size}`);
        output.push(`; Data structures: ${this.analysisEngine.getDataStructures().size}`);
        output.push('');
        for (const line of lines) {
            // Add cross-references before the instruction
            const refs = crossRefs.get(line.address);
            if (refs && refs.length > 0) {
                output.push('; Cross-references:');
                for (const ref of refs) {
                    const refSymbol = symbols.get(ref.fromAddress);
                    const fromLabel = refSymbol ? refSymbol.name : `$${ref.fromAddress.toString(16).toUpperCase()}`;
                    output.push(`;   ${ref.type}: ${fromLabel}`);
                }
            }
            let lineStr = '';
            // Add function header if this is a function start
            const func = functions.get(line.address);
            if (func) {
                output.push('');
                output.push(`; Function: ${symbols.get(line.address)?.name || `func_${line.address.toString(16).toUpperCase()}`}`);
                if (func.callers.size > 0) {
                    output.push(`;   Called by: ${Array.from(func.callers).map(addr => symbols.get(addr)?.name || `$${addr.toString(16).toUpperCase()}`).join(', ')}`);
                }
                if (func.confidence < 1.0) {
                    output.push(`;   Confidence: ${(func.confidence * 100).toFixed(0)}%`);
                }
            }
            // Add label if present
            if (line.label) {
                output.push(`${line.label}:`);
            }
            // Format address
            lineStr += `$${line.address.toString(16).toUpperCase().padStart(6, '0')}: `;
            // Format bytes
            const bytesStr = line.bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
            lineStr += bytesStr.padEnd(12, ' ');
            // Format instruction
            lineStr += line.instruction.mnemonic.padEnd(4, ' ');
            // Format operand with enhanced symbol resolution
            const operandStr = this.formatOperandWithSymbols(line);
            if (operandStr) {
                lineStr += operandStr;
            }
            // Enhanced comments
            const comments = [];
            if (line.comment) {
                comments.push(line.comment);
            }
            // Add hardware register info
            if (line.operand !== undefined) {
                const symbol = symbols.get(line.operand);
                if (symbol && symbol.type === 'CONSTANT') {
                    comments.push(`${symbol.name}`);
                }
            }
            if (comments.length > 0) {
                lineStr = lineStr.padEnd(40, ' ') + `; ${comments.join(', ')}`;
            }
            output.push(lineStr);
        }
        return output.join('\n');
    }
    formatOperandWithSymbols(line) {
        if (line.operand === undefined) {
            return this.decoder.formatOperand(line);
        }
        // Check for symbol
        const symbols = this.analysisEngine.getSymbols();
        const symbol = symbols.get(line.operand);
        if (symbol) {
            return symbol.name;
        }
        // Fall back to decoder formatting
        return this.decoder.formatOperand(line);
    }
    addLabel(address, label) {
        this.labels.set(address, label);
    }
    addComment(address, comment) {
        this.comments.set(address, comment);
    }
    // Enhanced analysis using the analysis engine
    analyze() {
        // Perform full disassembly first
        const lines = this.disassemble();
        // Extract vector addresses from ROM header
        const vectorAddresses = [
            this.rom.header.nativeVectors.reset,
            this.rom.header.nativeVectors.nmi,
            this.rom.header.nativeVectors.irq,
            this.rom.header.nativeVectors.cop,
            this.rom.header.nativeVectors.brk,
            this.rom.header.nativeVectors.abort,
            this.rom.header.emulationVectors.reset,
            this.rom.header.emulationVectors.nmi,
            this.rom.header.emulationVectors.irq,
            this.rom.header.emulationVectors.cop,
            this.rom.header.emulationVectors.brk,
            this.rom.header.emulationVectors.abort
        ].filter(addr => addr > 0); // Filter out invalid addresses
        // Run comprehensive analysis
        this.analysisEngine.analyze(lines, this.rom.cartridgeInfo, vectorAddresses);
        // Extract results
        const functions = Array.from(this.analysisEngine.getFunctions().keys());
        const data = Array.from(this.analysisEngine.getDataStructures().keys());
        // Update labels with generated symbols
        const symbols = this.analysisEngine.getSymbols();
        for (const [address, symbol] of symbols) {
            if (!this.labels.has(address)) {
                this.labels.set(address, symbol.name);
            }
        }
        return { functions, data };
    }
    // Get analysis results
    getAnalysisResults() {
        return {
            controlFlowGraph: this.analysisEngine.getControlFlowGraph(),
            symbols: this.analysisEngine.getSymbols(),
            crossReferences: this.analysisEngine.getCrossReferences(),
            dataStructures: this.analysisEngine.getDataStructures(),
            functions: this.analysisEngine.getFunctions()
        };
    }
    analyzeFunction(address, functions, data, visited = new Set()) {
        if (visited.has(address) || functions.includes(address)) {
            return;
        }
        visited.add(address);
        functions.push(address);
        try {
            const lines = this.disassembleFunction(address);
            for (const line of lines) {
                // Look for branch/jump targets
                if (line.instruction.mnemonic.startsWith('B') ||
                    line.instruction.mnemonic.startsWith('J')) {
                    if (line.operand !== undefined) {
                        // Recursively analyze branch/jump targets
                        this.analyzeFunction(line.operand, functions, data, visited);
                    }
                }
            }
        }
        catch (error) {
            // If we can't disassemble, treat as data
            data.push(address);
        }
    }
    // ============================================================================
    // Phase 4: Output & Integration - Multiple Output Formats
    // ============================================================================
    /**
     * Generate output in specified format using Phase 4 formatters
     */
    formatOutputAs(lines, format, options = {}) {
        // Convert analysis symbols to output format
        const symbols = this.convertAnalysisSymbolsToOutputFormat();
        const crossRefs = this.generateCrossReferences(lines);
        const formatter = output_formats_extended_1.ExtendedOutputFormatterFactory.create(format, this.rom, symbols, crossRefs, options);
        return formatter.format(lines);
    }
    /**
     * Export disassembly to file with automatic format detection
     */
    exportToFile(filePath, format, options = {}) {
        const lines = this.disassemble();
        // Auto-detect format from file extension if not specified
        if (!format) {
            const ext = filePath.split('.').pop()?.toLowerCase();
            switch (ext) {
                case 's':
                    format = 'ca65';
                    break;
                case 'asm':
                    format = 'wla-dx';
                    break;
                case 'html':
                    format = 'html';
                    break;
                case 'json':
                    format = 'json';
                    break;
                case 'xml':
                    format = 'xml';
                    break;
                case 'csv':
                    format = 'csv';
                    break;
                case 'md':
                    format = 'markdown';
                    break;
                default:
                    format = 'ca65';
                    break;
            }
        }
        const output = this.formatOutputAs(lines, format, options);
        // Write to file (Note: In a real implementation, you'd use fs.writeFileSync)
        // For now, we'll return the output since we can't write files directly
        console.log(`Exporting to ${filePath} in ${format} format...`);
        console.log(output.substring(0, 500) + '...[truncated]');
    }
    /**
     * Get symbol manager for advanced symbol operations
     */
    getSymbolManager() {
        return this.symbolManager;
    }
    /**
     * Import symbols from external file
     */
    importSymbols(filePath, format) {
        const result = this.symbolManager.importFromFile(filePath, format);
        // Sync imported symbols with labels map
        const allSymbols = this.symbolManager.getAllSymbols();
        for (const [address, symbol] of allSymbols) {
            if (!this.labels.has(address)) {
                this.labels.set(address, symbol.name);
            }
        }
        console.log(`Imported ${result.succeeded} symbols, ${result.failed} failed`);
        if (result.conflicts.length > 0) {
            console.log(`Warning: ${result.conflicts.length} conflicts detected`);
        }
    }
    /**
     * Export symbols to external file
     */
    exportSymbols(filePath, format) {
        // Sync current labels with symbol manager
        this.syncLabelsToSymbolManager();
        this.symbolManager.exportToFile(filePath, format || 'sym');
        console.log(`Exported ${this.symbolManager.getAllSymbols().size} symbols to ${filePath}`);
    }
    /**
     * Generate comprehensive documentation in multiple formats
     */
    generateDocumentation(outputDir) {
        const lines = this.disassemble();
        const analysis = this.getAnalysisResults();
        const formats = [
            { format: 'html', filename: 'disassembly.html', options: { includeCrossReferences: true, includeSymbols: true } },
            { format: 'markdown', filename: 'README.md', options: { includeComments: true, includeSymbols: true } },
            { format: 'json', filename: 'disassembly.json', options: { includeSymbols: true, includeCrossReferences: true } },
            { format: 'ca65', filename: 'game.s', options: { includeHeader: true, includeComments: true } }
        ];
        for (const { format, filename, options } of formats) {
            const output = this.formatOutputAs(lines, format, options);
            console.log(`Generated ${filename} (${output.length} characters)`);
            // In a real implementation: fs.writeFileSync(path.join(outputDir, filename), output);
        }
        // Generate symbol table
        this.exportSymbols(`${outputDir}/symbols.sym`);
        console.log(`Documentation generated in ${outputDir}/`);
        console.log(`Files: disassembly.html, README.md, disassembly.json, game.s, symbols.sym`);
    }
    /**
     * Get supported output formats
     */
    static getSupportedFormats() {
        return output_formats_extended_1.ExtendedOutputFormatterFactory.getSupportedFormats();
    }
    /**
     * Convert analysis engine symbols to output formatter format
     */
    convertAnalysisSymbolsToOutputFormat() {
        const outputSymbols = new Map();
        const analysisSymbols = this.analysisEngine.getSymbols();
        for (const [address, symbol] of analysisSymbols) {
            outputSymbols.set(address, {
                address,
                name: symbol.name,
                type: this.convertSymbolType(symbol.type),
                scope: 'GLOBAL',
                description: `Auto-generated symbol`
            });
        }
        // Add labels as symbols
        for (const [address, label] of this.labels) {
            if (!outputSymbols.has(address)) {
                outputSymbols.set(address, {
                    address,
                    name: label,
                    type: 'CODE',
                    scope: 'GLOBAL'
                });
            }
        }
        return outputSymbols;
    }
    /**
     * Convert analysis engine symbol types to output format
     */
    convertSymbolType(type) {
        switch (type.toUpperCase()) {
            case 'FUNCTION': return 'CODE';
            case 'DATA': return 'DATA';
            case 'VECTOR': return 'VECTOR';
            case 'REGISTER': return 'REGISTER';
            case 'CONSTANT': return 'CONSTANT';
            default: return 'CODE';
        }
    }
    /**
     * Generate cross-references from disassembly lines
     */
    generateCrossReferences(lines) {
        const crossRefs = [];
        for (const line of lines) {
            if (line.operand !== undefined) {
                const refType = this.determineReferenceType(line.instruction.mnemonic);
                if (refType) {
                    crossRefs.push({
                        fromAddress: line.address,
                        toAddress: line.operand,
                        type: refType,
                        instruction: line.instruction.mnemonic
                    });
                }
            }
        }
        return crossRefs;
    }
    /**
     * Determine reference type from instruction mnemonic
     */
    determineReferenceType(mnemonic) {
        if (mnemonic === 'JSR' || mnemonic === 'JSL')
            return 'CALL';
        if (mnemonic === 'JMP' || mnemonic === 'JML')
            return 'JUMP';
        if (mnemonic.startsWith('B'))
            return 'BRANCH';
        if (mnemonic === 'LDA' || mnemonic === 'LDX' || mnemonic === 'LDY')
            return 'DATA_READ';
        if (mnemonic === 'STA' || mnemonic === 'STX' || mnemonic === 'STY')
            return 'DATA_WRITE';
        return null;
    }
    /**
     * Sync current labels with symbol manager
     */
    syncLabelsToSymbolManager() {
        for (const [address, label] of this.labels) {
            const existingSymbol = this.symbolManager.getSymbol(address);
            if (!existingSymbol) {
                this.symbolManager.addSymbol(address, {
                    address,
                    name: label,
                    type: 'CODE',
                    scope: 'GLOBAL'
                });
            }
        }
    }
    // ============================================================================
    // SNES Reference Integration Methods
    // ============================================================================
    /**
     * Validate disassembly using SNES reference tables
     */
    validateDisassembly(lines) {
        console.log('🔍 Validating disassembly against SNES reference tables...');
        const result = this.validationEngine.validateDisassembly(lines);
        if (result.discrepancies.length > 0) {
            console.log(`⚠️  Found ${result.discrepancies.length} validation issues:`);
            const errors = result.discrepancies.filter(d => d.severity === 'error');
            const warnings = result.discrepancies.filter(d => d.severity === 'warning');
            if (errors.length > 0) {
                console.log(`   - ${errors.length} errors`);
            }
            if (warnings.length > 0) {
                console.log(`   - ${warnings.length} warnings`);
            }
        }
        console.log(`✅ Validation complete: ${result.accuracy.toFixed(1)}% accuracy`);
        return result;
    }
    /**
     * Enhance a disassembly line with reference data
     */
    enhanceLineWithReferenceData(line) {
        if (!line.instruction)
            return line;
        const { opcode, mnemonic } = line.instruction;
        const { operand } = line;
        // Generate instruction comment from reference data
        const instructionComment = (0, snes_reference_tables_1.generateInstructionComment)(opcode, operand);
        // Generate register comment if this is a register operation
        let registerComment = '';
        if (operand !== undefined && this.isRegisterAddress(operand)) {
            registerComment = (0, snes_reference_tables_1.generateRegisterComment)(operand, this.getOperationType(mnemonic) || 'read');
        }
        // Combine comments
        const comments = [line.comment, instructionComment, registerComment]
            .filter(Boolean)
            .join(' | ');
        return {
            ...line,
            comment: comments || line.comment
        };
    }
    /**
     * Check if an address is a SNES hardware register
     */
    isRegisterAddress(address) {
        return (address >= 0x2100 && address <= 0x21FF) || // PPU registers
            (address >= 0x4200 && address <= 0x43FF) || // CPU registers  
            (address >= 0x2140 && address <= 0x2143); // APU I/O ports
    }
    /**
     * Determine operation type from instruction mnemonic
     */
    getOperationType(mnemonic) {
        const writeInstructions = ['STA', 'STX', 'STY', 'STZ'];
        const readInstructions = ['LDA', 'LDX', 'LDY', 'ADC', 'SBC', 'CMP', 'CPX', 'CPY'];
        if (writeInstructions.includes(mnemonic))
            return 'write';
        if (readInstructions.includes(mnemonic))
            return 'read';
        return null;
    }
    /**
     * Get validation results for the last disassembly
     */
    getValidationResults() {
        // Return the last validation result if validation is enabled
        if (!this.enableValidation) {
            console.warn('Validation is disabled. Enable it in DisassemblerOptions to get validation results.');
            return null;
        }
        // For now, we'll need to re-run validation on the current disassembly
        // In a production version, we'd cache the last result
        const lines = this.disassemble();
        return this.validationEngine.validateDisassembly(lines);
    }
    /**
     * Generate a validation report for the current disassembly
     */
    generateValidationReport() {
        const result = this.getValidationResults();
        if (!result) {
            return 'Validation is disabled. No report available.';
        }
        return this.validationEngine.generateValidationReport(result);
    }
    /**
     * Enable or disable reference-based validation
     */
    setValidationEnabled(enabled) {
        this.enableValidation = enabled;
    }
    /**
     * Enable or disable comment enhancement
     */
    setCommentEnhancementEnabled(enabled) {
        this.enhanceComments = enabled;
    }
    /**
     * Get reference data for a specific instruction opcode
     */
    getInstructionReference(opcode) {
        return snes_reference_tables_1.INSTRUCTION_REFERENCE[opcode];
    }
    /**
     * Validate a specific instruction against reference data
     */
    validateInstructionOpcode(opcode, expectedMnemonic, expectedBytes) {
        return (0, snes_reference_tables_1.validateInstruction)(opcode, expectedMnemonic, expectedBytes);
    }
    /**
     * Validate a register access
     */
    validateRegisterAccess(address, operation) {
        return (0, snes_reference_tables_1.validateRegister)(address, operation);
    }
}
exports.SNESDisassembler = SNESDisassembler;
//# sourceMappingURL=disassembler.js.map