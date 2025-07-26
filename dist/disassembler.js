"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SNESDisassembler = void 0;
const decoder_1 = require("./decoder");
const rom_parser_1 = require("./rom-parser");
const analysis_engine_1 = require("./analysis-engine");
class SNESDisassembler {
    constructor(romPath, options = {}) {
        this.rom = rom_parser_1.RomParser.parse(romPath);
        this.decoder = new decoder_1.InstructionDecoder();
        this.labels = options.labels || new Map();
        this.comments = options.comments || new Map();
        this.analysisEngine = new analysis_engine_1.AnalysisEngine();
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
            lines.push(line);
            // Move to next instruction
            currentAddress += line.instruction.bytes;
            romOffset += line.instruction.bytes;
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
}
exports.SNESDisassembler = SNESDisassembler;
//# sourceMappingURL=disassembler.js.map