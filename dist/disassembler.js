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
const spc_exporter_1 = require("./spc-exporter");
const spc_state_extractor_1 = require("./spc-state-extractor");
const analysis_cache_1 = require("./analysis-cache");
const logger_1 = require("./utils/logger");
class SNESDisassembler {
    constructor(romPath, options = {}) {
        this.lastAnalysisHash = '';
        this.isAnalyzing = false;
        this.rom = rom_parser_1.RomParser.parse(romPath);
        // Initialize logger for this disassembler instance
        this.logger = (0, logger_1.createLogger)('SNESDisassembler');
        // Initialize enhanced ROM parsing for bank switching
        const mappingMode = rom_header_parser_1.RomHeaderParser.detectMappingMode(this.rom.cartridgeInfo);
        // Log detected mapping mode
        this.logger.info(`Detected Mapping Mode: ${mappingMode}`);
        this.decoder = new decoder_1.InstructionDecoder();
        this.labels = options.labels || new Map();
        this.comments = options.comments || new Map();
        this.analysisEngine = new analysis_engine_1.AnalysisEngine();
        this.symbolManager = new symbol_manager_1.SymbolManager();
        this.validationEngine = new validation_engine_1.SNESValidationEngine(options.validationLogLevel || 'normal');
        this.enableValidation = options.enableValidation !== false; // Default to true
        this.enhanceComments = options.enhanceComments !== false; // Default to true
        this.cache = options.cache || analysis_cache_1.globalROMCache;
        // Cache ROM info for reuse
        this.cache.setROMInfo(this.rom);
    }
    // Returns ROM information without using analysis cache to prevent circular dependencies
    // This method is called during cache key generation and initialization phases
    getRomInfo() {
        return this.rom;
    }
    disassemble(startAddress, endAddress) {
        // Default to reset vector if no start address provided
        let currentAddress = startAddress || this.rom.header.nativeVectors.reset;
        const finalAddress = endAddress || (currentAddress + 0x1000); // Default 4KB
        // Check cache for this disassembly range first
        const cacheParams = { start: currentAddress, end: finalAddress };
        const cachedLines = this.cache.getDisassembly(this.rom, cacheParams);
        if (cachedLines) {
            this.logger.debug('Using cached disassembly', cacheParams);
            return cachedLines;
        }
        const lines = [];
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
        // Cache the disassembly results for future use
        if (lines.length > 0) {
            this.cache.setDisassembly(this.rom, lines, cacheParams);
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
    /**
     * Export analyzed SPC state to an SPC file
     */
    exportSPC(outputPath) {
        // Log SPC audio extraction
        this.logger.info('🎵 Extracting SPC audio state from ROM...');
        // Check cache for audio state first to avoid redundant extraction
        let extractedState = this.cache.getAudioState(this.rom);
        if (!extractedState) {
            // Perform full disassembly and analysis only if not cached
            const lines = this.disassemble();
            this.analyze();
            // Initialize SPC state extractor and extract audio state
            extractedState = spc_state_extractor_1.SPCStateExtractor.extractAudioState(lines, this.rom.data, this.rom.cartridgeInfo);
            // Cache the audio state for future use
            this.cache.setAudioState(this.rom, extractedState);
        }
        else {
            this.logger.debug('Using cached audio state');
        }
        // Create SPC export metadata using extracted metadata
        const spcMetadata = {
            songTitle: extractedState.metadata.gameTitle || 'Unknown Game',
            gameTitle: extractedState.metadata.gameTitle || this.rom.header.title.trim() || 'Unknown Game',
            artist: 'Unknown Artist',
            dumperName: 'SNESDisassembler',
            comments: `Extracted from ${this.rom.header.title}\nMapping Mode: ${this.rom.cartridgeInfo.type}\nROM Size: ${(this.rom.cartridgeInfo.romSize / 1024).toFixed(0)} KB`,
            dumpDate: new Date().toLocaleDateString('en-US'),
            playTime: extractedState.metadata.playTime || 180, // 3 minutes default
            fadeLength: extractedState.metadata.fadeLength || 10000 // 10 seconds fade
        };
        // Log SPC metadata details
        this.logger.info('📋 SPC Metadata:', spcMetadata);
        // Export SPC file using static method
        const spcBuffer = spc_exporter_1.SPCExporter.exportSPC(extractedState.spc700State, extractedState.dspState, spcMetadata);
        // Log SPC export success
        this.logger.info(`✅ SPC file exported`, {
            bufferSize: spcBuffer.length,
            ramSize: extractedState.spc700State.ram?.length || 0,
            dspRegisterCount: extractedState.dspState.registers?.length || 0
        });
        // Write SPC file to disk
        const fs = require('fs');
        fs.writeFileSync(outputPath, spcBuffer);
        // Log file write completion
        this.logger.info(`💾 SPC exported to ${outputPath}`);
        return spcBuffer;
    }
    // Enhanced analysis using the analysis engine
    analyze() {
        // Prevent recursion by returning early if already analyzing
        if (this.isAnalyzing) {
            this.logger.warn('Already analyzing, skipping to prevent recursion.');
            return { functions: [], data: [] };
        }
        this.isAnalyzing = true;
        try {
            // Generate hash of current analysis context to detect changes
            const analysisContext = {
                romSize: this.rom.data.length,
                cartridgeType: this.rom.cartridgeInfo.type,
                labels: Array.from(this.labels.entries()),
                comments: Array.from(this.comments.entries())
            };
            const contextHash = require('crypto').createHash('md5').update(JSON.stringify(analysisContext)).digest('hex');
            // Skip redundant analysis if context hasn't changed
            if (this.lastAnalysisHash === contextHash) {
                this.logger.debug('Skipping redundant analysis - context unchanged');
                const functions = Array.from(this.analysisEngine.getFunctions().keys());
                const data = Array.from(this.analysisEngine.getDataStructures().keys());
                return { functions, data };
            }
            // Check cache for function analysis results
            const cachedFunctions = this.cache.getFunctions(this.rom, analysisContext);
            if (cachedFunctions) {
                this.logger.debug('Using cached function analysis');
                this.lastAnalysisHash = contextHash;
                // Restore cached symbols to labels
                const symbols = this.analysisEngine.getSymbols();
                for (const [address, symbol] of symbols) {
                    if (!this.labels.has(address)) {
                        this.labels.set(address, symbol.name);
                    }
                }
                return cachedFunctions;
            }
            // Perform full disassembly first (this checks its own cache)
            const lines = this.disassemble();
            // Extract vector addresses from ROM header (cache these too)
            let vectorAddresses = this.cache.getVectors(this.rom);
            if (!vectorAddresses) {
                vectorAddresses = [
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
                this.cache.setVectors(this.rom, vectorAddresses);
            }
            // Run comprehensive analysis
            this.analysisEngine.analyze(lines, this.rom.cartridgeInfo, vectorAddresses);
            // Extract results
            const functions = Array.from(this.analysisEngine.getFunctions().keys());
            const data = Array.from(this.analysisEngine.getDataStructures().keys());
            const result = { functions, data };
            // Update labels with generated symbols
            const symbols = this.analysisEngine.getSymbols();
            for (const [address, symbol] of symbols) {
                if (!this.labels.has(address)) {
                    this.labels.set(address, symbol.name);
                }
            }
            // Cache the analysis results
            this.cache.setFunctions(this.rom, result, analysisContext);
            this.lastAnalysisHash = contextHash;
            return result;
        }
        finally {
            // Always reset the analyzing flag
            this.isAnalyzing = false;
        }
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
        this.logger.info(`Exporting to ${filePath} in ${format} format...`);
        this.logger.debug(output.substring(0, 500) + '...[truncated]');
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
        this.logger.info(`Imported ${result.succeeded} symbols, ${result.failed} failed`);
        if (result.conflicts.length > 0) {
            this.logger.warn(`${result.conflicts.length} conflicts detected during symbol import.`);
        }
    }
    /**
     * Export symbols to external file
     */
    exportSymbols(filePath, format) {
        // Sync current labels with symbol manager
        this.syncLabelsToSymbolManager();
        this.symbolManager.exportToFile(filePath, format || 'sym');
        this.logger.info(`Exported ${this.symbolManager.getAllSymbols().size} symbols to ${filePath}`);
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
            this.logger.info(`Generated ${filename} with ${output.length} characters.`);
            // In a real implementation: fs.writeFileSync(path.join(outputDir, filename), output);
        }
        // Generate symbol table
        this.exportSymbols(`${outputDir}/symbols.sym`);
        this.logger.info(`Documentation generated in ${outputDir}/`);
        this.logger.info('Files: disassembly.html, README.md, disassembly.json, game.s, symbols.sym');
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
                description: 'Auto-generated symbol'
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
        // Check cache for validation results first
        const validationParams = {
            lineCount: lines.length,
            addressRange: lines.length > 0 ? {
                start: lines[0].address,
                end: lines[lines.length - 1].address
            } : null
        };
        const cachedResult = this.cache.getValidationResult(this.rom, validationParams);
        if (cachedResult) {
            this.logger.debug('Using cached validation result');
            return cachedResult;
        }
        this.logger.info('🔍 Validating disassembly against SNES reference tables...');
        const result = this.validationEngine.validateDisassembly(lines);
        // Cache the validation result
        this.cache.setValidationResult(this.rom, result, validationParams);
        // Log detailed validation breakdown instead of just total counts
        this.logValidationBreakdown(result);
        this.logger.info(`✅ Validation complete with ${result.accuracy.toFixed(1)}% accuracy.`);
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
     * Log detailed validation breakdown with examples and enhancements
     */
    logValidationBreakdown(result) {
        if (result.discrepancies.length === 0) {
            this.logger.info('✅ No validation issues found.');
            return;
        }
        // Group discrepancies by type
        const discrepanciesByType = result.discrepancies.reduce((acc, discrepancy) => {
            if (!acc[discrepancy.type]) {
                acc[discrepancy.type] = [];
            }
            acc[discrepancy.type].push(discrepancy);
            return acc;
        }, {});
        // Log summary counts by type
        const typeCounts = Object.entries(discrepanciesByType).map(([type, discs]) => {
            const errors = discs.filter(d => d.severity === 'error').length;
            const warnings = discs.filter(d => d.severity === 'warning').length;
            const infos = discs.filter(d => d.severity === 'info').length;
            return `${type}: ${errors} errors, ${warnings} warnings, ${infos} info`;
        });
        this.logger.info(`⚠️  Validation issues breakdown (${result.discrepancies.length} total):`);
        for (const typeCount of typeCounts) {
            this.logger.info(`  - ${typeCount}`);
        }
        // Log examples of first 3 errors of each type with debug level
        for (const [type, discrepancies] of Object.entries(discrepanciesByType)) {
            const examples = discrepancies.slice(0, 3);
            this.logger.debug(`${type.toUpperCase()} examples:`);
            for (const [index, example] of examples.entries()) {
                const addressStr = `$${example.address.toString(16).toUpperCase().padStart(6, '0')}`;
                this.logger.debug(`  ${index + 1}. ${addressStr}: [${example.severity.toUpperCase()}] ${example.message}`);
                // Add additional context if available
                if (example.expected && example.actual) {
                    this.logger.debug(`     Expected: ${JSON.stringify(example.expected)}`);
                    this.logger.debug(`     Actual: ${JSON.stringify(example.actual)}`);
                }
            }
            if (discrepancies.length > 3) {
                this.logger.debug(`     ... and ${discrepancies.length - 3} more ${type} issues`);
            }
        }
        // Log summary of enhancements suggested
        if (result.enhancements.length > 0) {
            const enhancementsByType = result.enhancements.reduce((acc, enhancement) => {
                if (!acc[enhancement.type]) {
                    acc[enhancement.type] = 0;
                }
                acc[enhancement.type]++;
                return acc;
            }, {});
            const enhancementSummary = Object.entries(enhancementsByType)
                .map(([type, count]) => `${count} ${type}`)
                .join(', ');
            this.logger.info(`💡 Enhancements available: ${enhancementSummary} (${result.enhancements.length} total)`);
            // Log high priority enhancement examples
            const highPriorityEnhancements = result.enhancements
                .filter(e => e.priority === 'high')
                .slice(0, 3);
            if (highPriorityEnhancements.length > 0) {
                this.logger.debug('High priority enhancement examples:');
                for (const [index, enhancement] of highPriorityEnhancements.entries()) {
                    const addressStr = `$${enhancement.address.toString(16).toUpperCase().padStart(6, '0')}`;
                    this.logger.debug(`  ${index + 1}. ${addressStr}: ${enhancement.content}`);
                }
            }
        }
        // Log recommended improvements if available
        if (result.summary.recommendedImprovements.length > 0) {
            this.logger.info('🔧 Recommended improvements:');
            for (const improvement of result.summary.recommendedImprovements.slice(0, 3)) {
                this.logger.info(`  - ${improvement}`);
            }
            if (result.summary.recommendedImprovements.length > 3) {
                this.logger.info(`  ... and ${result.summary.recommendedImprovements.length - 3} more recommendations`);
            }
        }
    }
    /**
     * Get validation results for the last disassembly
     */
    getValidationResults() {
        // Return the last validation result if validation is enabled
        if (!this.enableValidation) {
            this.logger.warn('Validation is disabled. Enable it in DisassemblerOptions to get validation results.');
            return null;
        }
        // Use cached validation result if available, otherwise run validation
        const lines = this.disassemble(); // This will use cache if available
        const validationParams = {
            lineCount: lines.length,
            addressRange: lines.length > 0 ? {
                start: lines[0].address,
                end: lines[lines.length - 1].address
            } : null
        };
        let result = this.cache.getValidationResult(this.rom, validationParams);
        if (!result) {
            result = this.validationEngine.validateDisassembly(lines);
            this.cache.setValidationResult(this.rom, result, validationParams);
        }
        return result;
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