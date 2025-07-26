"use strict";
/**
 * Advanced Analysis Engine for SNES Disassembler
 * Based on research from SNES MCP servers, modern binary analysis tools, and ML approaches
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisEngine = void 0;
const types_1 = require("./types");
class AnalysisEngine {
    constructor() {
        this.cfg = {
            blocks: new Map(),
            entryPoints: new Set(),
            functions: new Map()
        };
        this.symbols = new Map();
        this.crossReferences = new Map();
        this.dataStructures = new Map();
        this.hardwareRegisters = this.initializeHardwareRegisters();
    }
    /**
     * Perform comprehensive analysis on disassembled code
     */
    analyze(lines, cartridgeInfo, vectorAddresses) {
        // Phase 1: Basic block detection
        const blocks = this.detectBasicBlocks(lines);
        // Phase 2: Control flow analysis
        this.buildControlFlowGraph(blocks, lines);
        // Phase 3: Function boundary detection
        this.detectFunctions(lines, cartridgeInfo, vectorAddresses);
        // Phase 4: Data structure recognition
        this.analyzeDataStructures(lines);
        // Phase 5: Cross-reference building
        this.buildCrossReferences(lines);
        // Phase 6: Symbol generation
        this.generateSymbols(lines);
        // Phase 7: Hardware register analysis
        this.analyzeHardwareRegisterUsage(lines);
    }
    /**
     * Detect basic blocks using control flow analysis
     * Based on research from SMDA and other modern disassemblers
     */
    detectBasicBlocks(lines) {
        const blocks = [];
        const blockStarts = new Set();
        const blockEnds = new Set();
        // Find basic block boundaries
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const instruction = line.instruction;
            // Mark block start at function entry points
            if (i === 0 || this.isEntryPoint(line.address)) {
                blockStarts.add(line.address);
            }
            // Mark block end and next block start for control flow instructions
            if (this.isControlFlowInstruction(instruction.mnemonic)) {
                blockEnds.add(line.address);
                // Add target as block start for branches/jumps
                if (line.operand !== undefined && this.isBranchOrJump(instruction.mnemonic)) {
                    blockStarts.add(line.operand);
                    // For conditional branches, next instruction is also a block start
                    if (this.isConditionalBranch(instruction.mnemonic) && i + 1 < lines.length) {
                        blockStarts.add(lines[i + 1].address);
                    }
                }
            }
            // Mark block start for jump/call targets
            if (line.operand !== undefined && this.isJumpTarget(line.operand, lines)) {
                blockStarts.add(line.operand);
            }
        }
        // Create basic blocks
        const sortedStarts = Array.from(blockStarts).sort((a, b) => a - b);
        for (let i = 0; i < sortedStarts.length; i++) {
            const startAddr = sortedStarts[i];
            const endAddr = i + 1 < sortedStarts.length ? sortedStarts[i + 1] - 1 :
                lines[lines.length - 1].address;
            const blockInstructions = lines.filter(line => line.address >= startAddr && line.address <= endAddr);
            if (blockInstructions.length > 0) {
                const block = {
                    id: `block_${startAddr.toString(16)}`,
                    startAddress: startAddr,
                    endAddress: blockInstructions[blockInstructions.length - 1].address,
                    instructions: blockInstructions,
                    predecessors: new Set(),
                    successors: new Set(),
                    isFunction: this.isLikelyFunctionStart(blockInstructions[0], lines),
                    isFunctionEnd: this.isFunctionEnd(blockInstructions[blockInstructions.length - 1])
                };
                blocks.push(block);
            }
        }
        return blocks;
    }
    /**
     * Build control flow graph from basic blocks
     */
    buildControlFlowGraph(blocks, lines) {
        this.cfg.blocks.clear();
        // Add blocks to CFG
        for (const block of blocks) {
            this.cfg.blocks.set(block.id, block);
            if (block.isFunction) {
                this.cfg.entryPoints.add(block.id);
            }
        }
        // Build edges between blocks
        for (const block of blocks) {
            const lastInstruction = block.instructions[block.instructions.length - 1];
            if (this.isControlFlowInstruction(lastInstruction.instruction.mnemonic)) {
                this.addControlFlowEdges(block, lastInstruction, blocks);
            }
            else {
                // Sequential execution to next block
                this.addSequentialEdge(block, blocks);
            }
        }
    }
    /**
     * Detect function boundaries using multiple heuristics
     * Based on Zelda3 analysis patterns and modern techniques
     */
    detectFunctions(lines, cartridgeInfo, vectorAddresses) {
        const functions = new Map();
        // Heuristic 1: Reset/interrupt vectors
        this.detectVectorFunctions(cartridgeInfo, functions, vectorAddresses);
        // Heuristic 2: JSR targets
        this.detectJSRTargets(lines, functions);
        // Heuristic 3: Common function prologue patterns
        this.detectProloguePatterns(lines, functions);
        // Heuristic 4: Dead code analysis for function boundaries
        this.detectDeadCodeBoundaries(lines, functions);
        this.cfg.functions = functions;
    }
    /**
     * Analyze data structures and patterns
     * Based on research from binary analysis tools
     */
    analyzeDataStructures(lines) {
        // Detect pointer tables
        this.detectPointerTables(lines);
        // Detect jump tables  
        this.detectJumpTables(lines);
        // Detect graphics data patterns
        this.detectGraphicsData(lines);
        // Detect music/audio data
        this.detectMusicData(lines);
        // Detect text/string data
        this.detectStringData(lines);
    }
    /**
     * Build comprehensive cross-reference database
     */
    buildCrossReferences(lines) {
        this.crossReferences.clear();
        for (const line of lines) {
            if (line.operand !== undefined) {
                const refType = this.getCrossReferenceType(line.instruction.mnemonic, line.instruction.addressingMode);
                const xref = {
                    address: line.operand,
                    type: refType,
                    fromAddress: line.address,
                    instruction: `${line.instruction.mnemonic} ${this.formatOperand(line)}`
                };
                if (!this.crossReferences.has(line.operand)) {
                    this.crossReferences.set(line.operand, []);
                }
                this.crossReferences.get(line.operand).push(xref);
            }
        }
    }
    /**
     * Generate smart labels based on usage patterns
     */
    generateSymbols(lines) {
        this.symbols.clear();
        // Generate function labels
        for (const [address, func] of this.cfg.functions) {
            const symbol = {
                address,
                name: this.generateFunctionName(address, func),
                type: 'FUNCTION',
                references: this.crossReferences.get(address) || [],
                confidence: func.confidence
            };
            this.symbols.set(address, symbol);
        }
        // Generate data labels
        for (const [address, dataStruct] of this.dataStructures) {
            const symbol = {
                address,
                name: this.generateDataName(address, dataStruct),
                type: 'DATA',
                size: dataStruct.size,
                references: this.crossReferences.get(address) || [],
                confidence: 0.8
            };
            this.symbols.set(address, symbol);
        }
        // Generate hardware register symbols
        for (const line of lines) {
            if (line.operand !== undefined && this.hardwareRegisters.has(line.operand)) {
                if (!this.symbols.has(line.operand)) {
                    const symbol = {
                        address: line.operand,
                        name: this.hardwareRegisters.get(line.operand),
                        type: 'CONSTANT',
                        references: this.crossReferences.get(line.operand) || [],
                        confidence: 1.0
                    };
                    this.symbols.set(line.operand, symbol);
                }
            }
        }
    }
    /**
     * Analyze hardware register usage patterns
     * Based on SNES MCP server register documentation
     */
    analyzeHardwareRegisterUsage(lines) {
        const registerUsage = new Map();
        for (const line of lines) {
            if (line.operand !== undefined && this.hardwareRegisters.has(line.operand)) {
                const reg = line.operand;
                if (!registerUsage.has(reg)) {
                    registerUsage.set(reg, { reads: 0, writes: 0, firstUse: line.address });
                }
                const usage = registerUsage.get(reg);
                if (this.isReadOperation(line.instruction.mnemonic)) {
                    usage.reads++;
                }
                else if (this.isWriteOperation(line.instruction.mnemonic)) {
                    usage.writes++;
                }
            }
        }
        // Store register usage analysis for reporting
        for (const [reg, usage] of registerUsage) {
            const regName = this.hardwareRegisters.get(reg);
            console.log(`Register ${regName} ($${reg.toString(16).toUpperCase()}): ${usage.reads} reads, ${usage.writes} writes`);
        }
    }
    // Utility methods for instruction classification
    isControlFlowInstruction(mnemonic) {
        const controlFlowMnemonics = [
            'JMP', 'JSR', 'RTS', 'RTI', 'RTL',
            'BRA', 'BCC', 'BCS', 'BEQ', 'BNE', 'BMI', 'BPL', 'BVC', 'BVS',
            'BRL', 'BRK', 'COP', 'WAI', 'STP'
        ];
        return controlFlowMnemonics.includes(mnemonic);
    }
    isBranchOrJump(mnemonic) {
        return mnemonic.startsWith('B') || mnemonic.startsWith('J');
    }
    isConditionalBranch(mnemonic) {
        const conditionalBranches = ['BCC', 'BCS', 'BEQ', 'BNE', 'BMI', 'BPL', 'BVC', 'BVS'];
        return conditionalBranches.includes(mnemonic);
    }
    isFunctionEnd(line) {
        const returnInstructions = ['RTS', 'RTI', 'RTL'];
        return returnInstructions.includes(line.instruction.mnemonic);
    }
    isLikelyFunctionStart(line, allLines) {
        // Check if this address is a JSR target
        return allLines.some(l => l.instruction.mnemonic === 'JSR' && l.operand === line.address);
    }
    isEntryPoint(address) {
        // This would be populated from cartridge vector analysis
        return false; // Simplified for now
    }
    isJumpTarget(address, lines) {
        return lines.some(line => this.isBranchOrJump(line.instruction.mnemonic) && line.operand === address);
    }
    // Control flow graph edge creation
    addControlFlowEdges(block, lastInstruction, blocks) {
        const mnemonic = lastInstruction.instruction.mnemonic;
        const operand = lastInstruction.operand;
        // Handle unconditional jumps
        if (mnemonic === 'JMP' || mnemonic === 'BRA' || mnemonic === 'BRL') {
            if (operand !== undefined) {
                const targetBlock = this.findBlockByAddress(operand, blocks);
                if (targetBlock) {
                    block.successors.add(targetBlock.id);
                    targetBlock.predecessors.add(block.id);
                }
            }
        }
        // Handle conditional branches
        else if (this.isConditionalBranch(mnemonic)) {
            // Add edge to branch target
            if (operand !== undefined) {
                const targetBlock = this.findBlockByAddress(operand, blocks);
                if (targetBlock) {
                    block.successors.add(targetBlock.id);
                    targetBlock.predecessors.add(block.id);
                }
            }
            // Add edge to fall-through (next instruction)
            this.addSequentialEdge(block, blocks);
        }
        // Handle subroutine calls
        else if (mnemonic === 'JSR') {
            if (operand !== undefined) {
                const targetBlock = this.findBlockByAddress(operand, blocks);
                if (targetBlock) {
                    // Mark as function call relationship
                    targetBlock.isFunction = true;
                }
            }
            // JSR continues to next instruction after return
            this.addSequentialEdge(block, blocks);
        }
        // Return instructions have no successors
        else if (['RTS', 'RTI', 'RTL'].includes(mnemonic)) {
            // No successors for return instructions
        }
    }
    addSequentialEdge(block, blocks) {
        const nextAddress = block.endAddress + 1;
        const nextBlock = this.findBlockByAddress(nextAddress, blocks);
        if (nextBlock) {
            block.successors.add(nextBlock.id);
            nextBlock.predecessors.add(block.id);
        }
    }
    findBlockByAddress(address, blocks) {
        return blocks.find(block => address >= block.startAddress && address <= block.endAddress);
    }
    detectVectorFunctions(cartridgeInfo, functions, vectorAddresses) {
        if (!vectorAddresses)
            return;
        // Mark vector target addresses as high-confidence functions
        for (const vectorAddr of vectorAddresses) {
            if (vectorAddr > 0) { // Valid address
                const func = {
                    startAddress: vectorAddr,
                    callers: new Set(),
                    callees: new Set(),
                    basicBlocks: new Set(),
                    isInterrupt: true,
                    confidence: 1.0
                };
                functions.set(vectorAddr, func);
            }
        }
    }
    detectJSRTargets(lines, functions) {
        for (const line of lines) {
            if (line.instruction.mnemonic === 'JSR' && line.operand !== undefined) {
                const targetAddr = line.operand;
                if (!functions.has(targetAddr)) {
                    const func = {
                        startAddress: targetAddr,
                        callers: new Set(),
                        callees: new Set(),
                        basicBlocks: new Set(),
                        isInterrupt: false,
                        confidence: 0.9 // High confidence for JSR targets
                    };
                    functions.set(targetAddr, func);
                }
                // Update caller/callee relationships
                const func = functions.get(targetAddr);
                func.callers.add(line.address);
                // Find caller function to add callee relationship
                for (const [addr, callerFunc] of functions) {
                    if (line.address >= addr && (callerFunc.endAddress === undefined || line.address <= callerFunc.endAddress)) {
                        callerFunc.callees.add(targetAddr);
                        break;
                    }
                }
            }
        }
    }
    detectProloguePatterns(lines, functions) {
        // Common SNES function prologue patterns
        const prologuePatterns = [
            ['PHB', 'PHK', 'PLB'], // Bank switching prologue
            ['REP', 'SEP'], // Processor flag setup
            ['PHA', 'PHX', 'PHY'], // Register preservation
            ['PHP'], // Processor status preservation
        ];
        for (let i = 0; i < lines.length - 2; i++) {
            const sequence = [
                lines[i]?.instruction.mnemonic,
                lines[i + 1]?.instruction.mnemonic,
                lines[i + 2]?.instruction.mnemonic
            ];
            // Check for prologue patterns
            for (const pattern of prologuePatterns) {
                if (this.matchesPattern(sequence, pattern)) {
                    const addr = lines[i].address;
                    if (!functions.has(addr)) {
                        const func = {
                            startAddress: addr,
                            callers: new Set(),
                            callees: new Set(),
                            basicBlocks: new Set(),
                            isInterrupt: false,
                            confidence: 0.7 // Medium confidence for prologue patterns
                        };
                        functions.set(addr, func);
                    }
                }
            }
        }
    }
    matchesPattern(sequence, pattern) {
        if (sequence.length < pattern.length)
            return false;
        for (let i = 0; i < pattern.length; i++) {
            if (sequence[i] !== pattern[i])
                return false;
        }
        return true;
    }
    detectDeadCodeBoundaries(lines, functions) {
        for (let i = 0; i < lines.length - 1; i++) {
            const currentLine = lines[i];
            const nextLine = lines[i + 1];
            // Look for unconditional control flow followed by unreachable code
            if (['JMP', 'BRA', 'BRL', 'RTS', 'RTI', 'RTL'].includes(currentLine.instruction.mnemonic)) {
                // Check if next instruction is not a known target
                const nextAddr = nextLine.address;
                const isTarget = lines.some(line => line.operand === nextAddr && this.isBranchOrJump(line.instruction.mnemonic));
                // If next instruction is not a target, it might start a new function
                if (!isTarget && !functions.has(nextAddr)) {
                    const func = {
                        startAddress: nextAddr,
                        callers: new Set(),
                        callees: new Set(),
                        basicBlocks: new Set(),
                        isInterrupt: false,
                        confidence: 0.6 // Lower confidence for dead code boundary detection
                    };
                    functions.set(nextAddr, func);
                }
            }
        }
    }
    detectPointerTables(lines) {
        // Look for sequences of LDA/STA with pointer-like operands
        for (let i = 0; i < lines.length - 3; i++) {
            const sequence = lines.slice(i, i + 4);
            // Pattern: LDA table,X / STA pointer / LDA table+1,X / STA pointer+1
            if (this.isPointerTablePattern(sequence)) {
                const tableAddr = sequence[0].operand;
                if (tableAddr !== undefined) {
                    const dataStruct = {
                        address: tableAddr,
                        type: 'POINTER_TABLE',
                        size: this.estimateTableSize(lines, tableAddr, 'POINTER'),
                        entries: 0, // Will be calculated
                        description: `Pointer table at $${tableAddr.toString(16).toUpperCase()}`
                    };
                    dataStruct.entries = Math.floor(dataStruct.size / 2); // 2 bytes per pointer
                    this.dataStructures.set(tableAddr, dataStruct);
                }
            }
        }
    }
    isPointerTablePattern(sequence) {
        if (sequence.length < 4)
            return false;
        const [lda1, sta1, lda2, sta2] = sequence;
        return (lda1.instruction.mnemonic === 'LDA' &&
            sta1.instruction.mnemonic === 'STA' &&
            lda2.instruction.mnemonic === 'LDA' &&
            sta2.instruction.mnemonic === 'STA' &&
            lda1.instruction.addressingMode === types_1.AddressingMode.AbsoluteX &&
            lda2.instruction.addressingMode === types_1.AddressingMode.AbsoluteX &&
            lda1.operand !== undefined &&
            lda2.operand !== undefined &&
            (lda2.operand === lda1.operand + 1) // Sequential addresses
        );
    }
    detectJumpTables(lines) {
        // Look for indirect jumps preceded by table loading
        for (let i = 0; i < lines.length - 2; i++) {
            const line = lines[i];
            // Pattern: JMP (abs) or JMP (abs,X)
            if (line.instruction.mnemonic === 'JMP' &&
                (line.instruction.addressingMode === types_1.AddressingMode.AbsoluteIndirect ||
                    line.instruction.addressingMode === types_1.AddressingMode.AbsoluteIndexedIndirect)) {
                const tableAddr = line.operand;
                if (tableAddr !== undefined) {
                    const dataStruct = {
                        address: tableAddr,
                        type: 'JUMP_TABLE',
                        size: this.estimateTableSize(lines, tableAddr, 'JUMP'),
                        entries: 0,
                        description: `Jump table at $${tableAddr.toString(16).toUpperCase()}`
                    };
                    dataStruct.entries = Math.floor(dataStruct.size / 2); // 2 bytes per jump address
                    this.dataStructures.set(tableAddr, dataStruct);
                }
            }
        }
    }
    detectGraphicsData(lines) {
        // Look for patterns indicating graphics data access
        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            // Pattern: STA to PPU graphics registers
            if (line.instruction.mnemonic === 'STA' && line.operand !== undefined) {
                const graphicsRegisters = [
                    0x2118, // VMDATAL
                    0x2119, // VMDATAH 
                    0x2122, // CGDATA
                    0x2104 // OAMDATA
                ];
                if (graphicsRegisters.includes(line.operand)) {
                    // Look backwards for data source
                    for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
                        const prevLine = lines[j];
                        if (prevLine.instruction.mnemonic === 'LDA' &&
                            prevLine.instruction.addressingMode === types_1.AddressingMode.AbsoluteX &&
                            prevLine.operand !== undefined) {
                            const dataAddr = prevLine.operand;
                            const dataStruct = {
                                address: dataAddr,
                                type: 'GRAPHICS_DATA',
                                size: this.estimateTableSize(lines, dataAddr, 'GRAPHICS'),
                                entries: 0,
                                description: `Graphics data at $${dataAddr.toString(16).toUpperCase()}`
                            };
                            this.dataStructures.set(dataAddr, dataStruct);
                            break;
                        }
                    }
                }
            }
        }
    }
    detectMusicData(lines) {
        // Look for APU I/O register access patterns
        const apuRegisters = [0x2140, 0x2141, 0x2142, 0x2143];
        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            if (line.instruction.mnemonic === 'STA' &&
                line.operand !== undefined &&
                apuRegisters.includes(line.operand)) {
                // Look for data source
                for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
                    const prevLine = lines[j];
                    if (prevLine.instruction.mnemonic === 'LDA' &&
                        prevLine.operand !== undefined &&
                        !apuRegisters.includes(prevLine.operand)) {
                        const dataAddr = prevLine.operand;
                        if (!this.dataStructures.has(dataAddr)) {
                            const dataStruct = {
                                address: dataAddr,
                                type: 'MUSIC_DATA',
                                size: this.estimateTableSize(lines, dataAddr, 'MUSIC'),
                                entries: 0,
                                description: `Music/Audio data at $${dataAddr.toString(16).toUpperCase()}`
                            };
                            this.dataStructures.set(dataAddr, dataStruct);
                        }
                        break;
                    }
                }
            }
        }
    }
    detectStringData(lines) {
        // Look for consecutive byte values that could be text
        for (let i = 0; i < lines.length - 4; i++) {
            const sequence = lines.slice(i, i + 5);
            // Check if we have consecutive addresses with printable character values
            let isPotentialString = true;
            let stringStart = sequence[0].address;
            for (let j = 0; j < sequence.length - 1; j++) {
                const curr = sequence[j];
                const next = sequence[j + 1];
                // Check if addresses are consecutive
                if (next.address !== curr.address + curr.instruction.bytes) {
                    isPotentialString = false;
                    break;
                }
                // Check if operand values look like printable characters
                if (curr.operand !== undefined) {
                    const byte = curr.operand & 0xFF;
                    if (byte < 0x20 || byte > 0x7E) { // Not printable ASCII
                        if (byte !== 0x00) { // Allow null terminator
                            isPotentialString = false;
                            break;
                        }
                    }
                }
            }
            if (isPotentialString) {
                const dataStruct = {
                    address: stringStart,
                    type: 'STRING_TABLE',
                    size: sequence.length,
                    entries: 1,
                    description: `String data at $${stringStart.toString(16).toUpperCase()}`
                };
                this.dataStructures.set(stringStart, dataStruct);
            }
        }
    }
    estimateTableSize(lines, tableAddr, type) {
        // Conservative estimate based on usage patterns
        let usageCount = 0;
        let maxOffset = 0;
        for (const line of lines) {
            if (line.operand === tableAddr ||
                (line.operand !== undefined && Math.abs(line.operand - tableAddr) < 256)) {
                usageCount++;
                if (line.operand !== undefined && line.operand > tableAddr) {
                    maxOffset = Math.max(maxOffset, line.operand - tableAddr);
                }
            }
        }
        // Estimate size based on maximum offset seen + buffer
        return Math.max(16, Math.min(256, maxOffset + 16));
    }
    getCrossReferenceType(mnemonic, mode) {
        if (mnemonic === 'JSR')
            return 'CALL';
        if (this.isBranchOrJump(mnemonic))
            return 'JUMP';
        if (['LDA', 'LDX', 'LDY', 'CMP', 'CPX', 'CPY', 'BIT'].includes(mnemonic))
            return 'READ';
        if (['STA', 'STX', 'STY', 'STZ'].includes(mnemonic))
            return 'WRITE';
        return 'EXECUTE';
    }
    isReadOperation(mnemonic) {
        return ['LDA', 'LDX', 'LDY', 'CMP', 'CPX', 'CPY', 'BIT', 'AND', 'ORA', 'EOR', 'ADC', 'SBC'].includes(mnemonic);
    }
    isWriteOperation(mnemonic) {
        return ['STA', 'STX', 'STY', 'STZ'].includes(mnemonic);
    }
    generateFunctionName(address, func) {
        if (func.isInterrupt) {
            return `interrupt_${address.toString(16).toUpperCase()}`;
        }
        return `function_${address.toString(16).toUpperCase()}`;
    }
    generateDataName(address, dataStruct) {
        const typePrefix = dataStruct.type.toLowerCase().replace('_', '');
        return `${typePrefix}_${address.toString(16).toUpperCase()}`;
    }
    formatOperand(line) {
        if (line.operand === undefined)
            return '';
        // Check if operand is a known symbol
        const symbol = this.symbols.get(line.operand);
        if (symbol) {
            return symbol.name;
        }
        // Format as hex address
        const addr = line.operand;
        if (addr <= 0xFF) {
            return `$${addr.toString(16).toUpperCase().padStart(2, '0')}`;
        }
        else if (addr <= 0xFFFF) {
            return `$${addr.toString(16).toUpperCase().padStart(4, '0')}`;
        }
        else {
            return `$${addr.toString(16).toUpperCase().padStart(6, '0')}`;
        }
    }
    /**
     * Initialize hardware register mappings from SNES MCP server documentation
     */
    initializeHardwareRegisters() {
        const registers = new Map();
        // PPU Registers
        registers.set(0x2100, 'INIDISP'); // Screen Display Register
        registers.set(0x2101, 'OBSEL'); // Object Size and Character Address
        registers.set(0x2102, 'OAMADDL'); // OAM Address Register (Low)
        registers.set(0x2103, 'OAMADDH'); // OAM Address Register (High)
        registers.set(0x2104, 'OAMDATA'); // OAM Data Write Register
        registers.set(0x2105, 'BGMODE'); // BG Mode and Character Size
        registers.set(0x2106, 'MOSAIC'); // Mosaic Filter Enable and Size
        registers.set(0x2107, 'BG1SC'); // BG1 Tilemap Address and Size
        registers.set(0x2108, 'BG2SC'); // BG2 Tilemap Address and Size
        registers.set(0x2109, 'BG3SC'); // BG3 Tilemap Address and Size
        registers.set(0x210A, 'BG4SC'); // BG4 Tilemap Address and Size
        registers.set(0x210B, 'BG12NBA'); // BG1/2 Character Address
        registers.set(0x210C, 'BG34NBA'); // BG3/4 Character Address
        registers.set(0x210D, 'BG1HOFS'); // BG1 Horizontal Scroll Offset
        registers.set(0x210E, 'BG1VOFS'); // BG1 Vertical Scroll Offset
        registers.set(0x210F, 'BG2HOFS'); // BG2 Horizontal Scroll Offset
        registers.set(0x2110, 'BG2VOFS'); // BG2 Vertical Scroll Offset
        registers.set(0x2111, 'BG3HOFS'); // BG3 Horizontal Scroll Offset
        registers.set(0x2112, 'BG3VOFS'); // BG3 Vertical Scroll Offset
        registers.set(0x2113, 'BG4HOFS'); // BG4 Horizontal Scroll Offset
        registers.set(0x2114, 'BG4VOFS'); // BG4 Vertical Scroll Offset
        registers.set(0x2115, 'VMAIN'); // Video Port Control
        registers.set(0x2116, 'VMADDL'); // VRAM Address Register (Low)
        registers.set(0x2117, 'VMADDH'); // VRAM Address Register (High)
        registers.set(0x2118, 'VMDATAL'); // VRAM Data Write Register (Low)
        registers.set(0x2119, 'VMDATAH'); // VRAM Data Write Register (High)
        registers.set(0x211A, 'M7SEL'); // Mode 7 Settings
        registers.set(0x211B, 'M7A'); // Mode 7 Matrix Parameter A
        registers.set(0x211C, 'M7B'); // Mode 7 Matrix Parameter B
        registers.set(0x211D, 'M7C'); // Mode 7 Matrix Parameter C
        registers.set(0x211E, 'M7D'); // Mode 7 Matrix Parameter D
        registers.set(0x211F, 'M7X'); // Mode 7 Center X
        registers.set(0x2120, 'M7Y'); // Mode 7 Center Y
        registers.set(0x2121, 'CGADD'); // CGRAM Address Register
        registers.set(0x2122, 'CGDATA'); // CGRAM Data Write Register
        registers.set(0x2123, 'W12SEL'); // Window Mask Settings BG1/2
        registers.set(0x2124, 'W34SEL'); // Window Mask Settings BG3/4
        registers.set(0x2125, 'WOBJSEL'); // Window Mask Settings OBJ/Color
        registers.set(0x2126, 'WH0'); // Window Position 1 Left
        registers.set(0x2127, 'WH1'); // Window Position 1 Right
        registers.set(0x2128, 'WH2'); // Window Position 2 Left
        registers.set(0x2129, 'WH3'); // Window Position 2 Right
        registers.set(0x212A, 'WBGLOG'); // Window BG Logic Operation
        registers.set(0x212B, 'WOBJLOG'); // Window OBJ/Color Logic Operation
        registers.set(0x212C, 'TM'); // Main Screen Designation
        registers.set(0x212D, 'TS'); // Sub Screen Designation
        registers.set(0x212E, 'TMW'); // Window Mask Main Screen
        registers.set(0x212F, 'TSW'); // Window Mask Sub Screen
        registers.set(0x2130, 'CGWSEL'); // Color Addition Select
        registers.set(0x2131, 'CGADSUB'); // Color Math Control
        registers.set(0x2132, 'COLDATA'); // Fixed Color Data
        registers.set(0x2133, 'SETINI'); // Screen Mode/Video Select
        // APU Registers
        registers.set(0x2140, 'APUIO0'); // APU I/O Register 0
        registers.set(0x2141, 'APUIO1'); // APU I/O Register 1
        registers.set(0x2142, 'APUIO2'); // APU I/O Register 2
        registers.set(0x2143, 'APUIO3'); // APU I/O Register 3
        // CPU/System Registers
        registers.set(0x4200, 'NMITIMEN'); // Interrupt Enable and Joypad Request
        registers.set(0x4201, 'WRIO'); // Joypad Programmable I/O Port
        registers.set(0x4202, 'WRMPYA'); // Multiplicand Register A
        registers.set(0x4203, 'WRMPYB'); // Multiplicand Register B
        registers.set(0x4204, 'WRDIVL'); // Dividend Register (Low)
        registers.set(0x4205, 'WRDIVH'); // Dividend Register (High)
        registers.set(0x4206, 'WRDIVB'); // Divisor Register
        registers.set(0x4207, 'HTIMEL'); // Horizontal Timer Register (Low)
        registers.set(0x4208, 'HTIMEH'); // Horizontal Timer Register (High)
        registers.set(0x4209, 'VTIMEL'); // Vertical Timer Register (Low)
        registers.set(0x420A, 'VTIMEH'); // Vertical Timer Register (High)
        registers.set(0x420B, 'MDMAEN'); // DMA Enable Register
        registers.set(0x420C, 'HDMAEN'); // HDMA Enable Register
        return registers;
    }
    // Public getter methods for analysis results
    getControlFlowGraph() {
        return this.cfg;
    }
    getSymbols() {
        return this.symbols;
    }
    getCrossReferences() {
        return this.crossReferences;
    }
    getDataStructures() {
        return this.dataStructures;
    }
    getFunctions() {
        return this.cfg.functions;
    }
}
exports.AnalysisEngine = AnalysisEngine;
//# sourceMappingURL=analysis-engine.js.map