"use strict";
/**
 * Advanced Analysis Engine for SNES Disassembler
 * Based on research from SNES MCP servers, modern binary analysis tools, and ML approaches
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisEngine = void 0;
const types_1 = require("./types");
const snes_reference_tables_1 = require("./snes-reference-tables");
class AnalysisEngine {
    constructor() {
        // Variable usage tracking storage
        this.variableUsage = new Map();
        // Symbol dependency tracking storage
        this.symbolDependencies = new Map();
        this.cfg = {
            blocks: new Map(),
            entryPoints: new Set(),
            functions: new Map()
        };
        this.symbols = new Map();
        this.crossReferences = new Map();
        this.dataStructures = new Map();
        this.hardwareRegisters = this.initializeHardwareRegisters();
        this.jumpTables = new Map();
        this.pointerTables = new Map();
        this.spriteData = new Map();
        this.registerUsage = new Map();
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
        // Phase 8: Advanced control flow analysis
        this.performRecursiveDescentAnalysis(lines);
        // Phase 9: String and audio data detection
        this.detectStringData(lines);
        this.detectAudioData(lines);
        // Phase 10: Data flow and symbol analysis
        this.performDataFlowAnalysis(lines);
        this.performSymbolDependencyAnalysis();
        // Phase 11: Macro and inline function detection
        this.detectMacrosAndInlineFunctions(lines);
        // Phase 12: Game-specific pattern recognition
        this.detectGameSpecificPatterns(lines, cartridgeInfo);
        // Phase 13: Code quality metrics calculation
        this.calculateCodeQualityMetrics(lines);
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
     * Based on research from SNES MCP servers and binary analysis tools
     */
    analyzeDataStructures(lines) {
        // Detect pointer tables
        this.detectPointerTables(lines);
        // Detect jump tables  
        this.detectJumpTables(lines);
        // Detect graphics data patterns
        this.detectGraphicsData(lines);
        // Detect sprite data structures (based on Zelda3 research)
        this.detectSpriteData(lines);
        // Detect tile data patterns
        this.detectTileData(lines);
        // Detect music/audio data
        this.detectMusicData(lines);
        // Detect text/string data
        this.detectStringData(lines);
        // Detect level/map data structures
        this.detectLevelData(lines);
        // Detect palette data
        this.detectPaletteData(lines);
        // Analyze hardware register usage patterns
        this.analyzeHardwareRegisterUsage(lines);
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
        // Generate hardware register symbols using reference data
        for (const line of lines) {
            if (line.operand !== undefined && this.hardwareRegisters.has(line.operand)) {
                if (!this.symbols.has(line.operand)) {
                    // Get enhanced register information from reference tables
                    const registerInfo = (0, snes_reference_tables_1.getRegisterInfo)(line.operand);
                    const registerName = registerInfo.name || this.hardwareRegisters.get(line.operand);
                    const symbol = {
                        address: line.operand,
                        name: registerName,
                        type: 'CONSTANT',
                        references: this.crossReferences.get(line.operand) || [],
                        confidence: 1.0,
                        description: registerInfo.description
                    };
                    this.symbols.set(line.operand, symbol);
                }
            }
        }
        // Generate instruction-based symbols using reference data
        for (const line of lines) {
            if (line.instruction && line.instruction.opcode) {
                const reference = snes_reference_tables_1.INSTRUCTION_REFERENCE[line.instruction.opcode];
                if (reference && line.operand !== undefined) {
                    // Enhanced symbol generation based on instruction context
                    this.enhanceSymbolWithInstructionContext(line, reference);
                }
            }
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
                        description: `Pointer table at $${tableAddr.toString(16).toUpperCase()}`,
                        confidence: 0.7
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
                        description: `Jump table at $${tableAddr.toString(16).toUpperCase()}`,
                        confidence: 0.7
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
                                description: `Graphics data at $${dataAddr.toString(16).toUpperCase()}`,
                                confidence: 0.6
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
                                description: `Music/Audio data at $${dataAddr.toString(16).toUpperCase()}`,
                                confidence: 0.5
                            };
                            this.dataStructures.set(dataAddr, dataStruct);
                        }
                        break;
                    }
                }
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
        // Load from authoritative SNES reference tables
        for (const [address, registerInfo] of Object.entries(snes_reference_tables_1.REGISTER_REFERENCE)) {
            const addr = parseInt(address);
            registers.set(addr, registerInfo.name);
        }
        // PPU Registers (keeping existing for backwards compatibility)
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
    /**
     * Detect sprite data structures based on Zelda3 research patterns
     */
    detectSpriteData(lines) {
        // Look for sprite data patterns based on Zelda3 sprite structure research
        for (let i = 0; i < lines.length - 10; i++) {
            const line = lines[i];
            // Pattern 1: Sprite position tables (x_lo, x_hi, y_lo, y_hi arrays)
            if (this.isSpritePositionTable(lines, i)) {
                const spriteInfo = {
                    address: line.address,
                    hitboxes: this.extractSpriteHitboxes(lines, i),
                    animationFrames: this.countAnimationFrames(lines, i),
                    tileReferences: this.extractTileReferences(lines, i)
                };
                this.spriteData.set(line.address, spriteInfo);
                this.dataStructures.set(line.address, {
                    address: line.address,
                    type: 'SPRITE_DATA',
                    size: spriteInfo.hitboxes.length * 8, // Estimated size
                    entries: spriteInfo.hitboxes.length,
                    description: `Sprite data with ${spriteInfo.animationFrames} animation frames`,
                    confidence: 0.8,
                    format: 'SNES sprite structure'
                });
            }
        }
    }
    /**
     * Detect tile data patterns
     */
    detectTileData(lines) {
        for (let i = 0; i < lines.length - 5; i++) {
            const line = lines[i];
            // Look for tile data patterns (CHR data)
            if (this.isTileData(lines, i)) {
                const tileCount = this.estimateTileCount(lines, i);
                this.dataStructures.set(line.address, {
                    address: line.address,
                    type: 'TILE_DATA',
                    size: tileCount * 32, // 4bpp tiles are 32 bytes each
                    entries: tileCount,
                    description: `Tile graphics data (${tileCount} tiles)`,
                    confidence: 0.7,
                    format: '4bpp CHR data'
                });
            }
        }
    }
    /**
     * Detect level/map data structures
     */
    detectLevelData(lines) {
        for (let i = 0; i < lines.length - 8; i++) {
            const line = lines[i];
            // Look for level data patterns (compressed or uncompressed)
            if (this.isLevelData(lines, i)) {
                const mapSize = this.estimateMapSize(lines, i);
                this.dataStructures.set(line.address, {
                    address: line.address,
                    type: 'LEVEL_DATA',
                    size: mapSize,
                    entries: 1,
                    description: 'Level/map layout data',
                    confidence: 0.6,
                    format: 'Tilemap data'
                });
            }
        }
    }
    /**
     * Detect palette data
     */
    detectPaletteData(lines) {
        for (let i = 0; i < lines.length - 4; i++) {
            const line = lines[i];
            // Look for palette data patterns (16 colors * 2 bytes each)
            if (this.isPaletteData(lines, i)) {
                const colorCount = this.estimateColorCount(lines, i);
                this.dataStructures.set(line.address, {
                    address: line.address,
                    type: 'PALETTE_DATA',
                    size: colorCount * 2, // 16-bit colors
                    entries: colorCount,
                    description: `Color palette data (${colorCount} colors)`,
                    confidence: 0.8,
                    format: '15-bit BGR color data'
                });
            }
        }
    }
    /**
     * Analyze hardware register usage patterns
     */
    analyzeHardwareRegisterUsage(lines) {
        this.registerUsage.clear();
        for (const line of lines) {
            if (line.operand !== undefined) {
                const registerName = this.hardwareRegisters.get(line.operand);
                if (registerName) {
                    let usage = this.registerUsage.get(line.operand);
                    if (!usage) {
                        usage = {
                            register: registerName,
                            address: line.operand,
                            reads: 0,
                            writes: 0,
                            accessPoints: [],
                            description: this.getRegisterDescription(line.operand)
                        };
                        this.registerUsage.set(line.operand, usage);
                    }
                    // Determine if this is a read or write operation
                    const isWrite = this.isWriteOperation(line.instruction.mnemonic);
                    if (isWrite) {
                        usage.writes++;
                    }
                    else {
                        usage.reads++;
                    }
                    usage.accessPoints.push(line.address);
                }
            }
        }
        // Log significant register usage for debugging
        for (const [address, usage] of this.registerUsage) {
            if (usage.reads + usage.writes > 0) {
                console.log(`Register ${usage.register} ($${address.toString(16).toUpperCase()}): ${usage.reads} reads, ${usage.writes} writes`);
            }
        }
    }
    // Helper methods for data structure detection
    isSpritePositionTable(lines, startIndex) {
        // Look for patterns like sprite_x_lo, sprite_x_hi arrays
        const pattern = lines.slice(startIndex, startIndex + 4);
        return pattern.some(line => line.bytes && line.bytes.length >= 4);
    }
    extractSpriteHitboxes(lines, startIndex) {
        // Extract hitbox data from sprite structure
        const hitboxes = [];
        for (let i = 0; i < 8 && startIndex + i < lines.length; i++) {
            const line = lines[startIndex + i];
            if (line.bytes && line.bytes.length >= 4) {
                hitboxes.push({
                    x: line.bytes[0],
                    y: line.bytes[1],
                    width: line.bytes[2],
                    height: line.bytes[3]
                });
            }
        }
        return hitboxes;
    }
    countAnimationFrames(lines, startIndex) {
        // Estimate animation frames based on data patterns
        return Math.min(8, Math.floor((lines.length - startIndex) / 4));
    }
    extractTileReferences(lines, startIndex) {
        // Extract tile reference numbers
        const tiles = [];
        for (let i = 0; i < 16 && startIndex + i < lines.length; i++) {
            const line = lines[startIndex + i];
            if (line.bytes) {
                tiles.push(...line.bytes);
            }
        }
        return tiles;
    }
    isTileData(lines, startIndex) {
        // Look for 4bpp tile data patterns (32 bytes per tile)
        const line = lines[startIndex];
        return line.bytes && line.bytes.length >= 32;
    }
    estimateTileCount(lines, startIndex) {
        let tileCount = 0;
        for (let i = startIndex; i < lines.length && i < startIndex + 64; i++) {
            const line = lines[i];
            if (line.bytes && line.bytes.length >= 32) {
                tileCount++;
            }
        }
        return tileCount;
    }
    isLevelData(lines, startIndex) {
        // Look for level data patterns (tilemap entries)
        const pattern = lines.slice(startIndex, startIndex + 8);
        return pattern.every(line => line.bytes && line.bytes.length <= 2);
    }
    estimateMapSize(lines, startIndex) {
        let size = 0;
        for (let i = startIndex; i < lines.length && i < startIndex + 256; i++) {
            const line = lines[i];
            if (line.bytes) {
                size += line.bytes.length;
            }
        }
        return size;
    }
    isPaletteData(lines, startIndex) {
        // Look for 16-bit color data patterns
        const line = lines[startIndex];
        return line.bytes && line.bytes.length % 2 === 0 && line.bytes.length >= 32;
    }
    estimateColorCount(lines, startIndex) {
        const line = lines[startIndex];
        if (line.bytes) {
            return Math.min(256, line.bytes.length / 2);
        }
        return 16; // Default palette size
    }
    getRegisterDescription(address) {
        const descriptions = {
            0x2100: 'Screen Display Register',
            0x2101: 'Object Size and Character Address',
            0x2105: 'BG Mode and Character Size',
            0x2121: 'CGRAM Address Register',
            0x2122: 'CGRAM Data Write Register',
            0x4200: 'Interrupt Enable Register',
            0x420B: 'DMA Enable Register',
            0x420C: 'HDMA Enable Register'
        };
        return descriptions[address] || 'Hardware Register';
    }
    isWriteOperation(mnemonic) {
        const writeOps = ['STA', 'STX', 'STY', 'STZ'];
        return writeOps.includes(mnemonic);
    }
    extractPointers(lines, startIndex, tableAddr) {
        // Extract pointer values from pointer table
        const pointers = [];
        for (let i = startIndex; i < lines.length && i < startIndex + 16; i++) {
            const line = lines[i];
            if (line.bytes && line.bytes.length >= 2) {
                // Assume little-endian 16-bit pointers
                const pointer = line.bytes[0] | (line.bytes[1] << 8);
                pointers.push(pointer);
            }
        }
        return pointers;
    }
    resolvePointerTargets(pointers) {
        // Convert pointers to actual target addresses
        return pointers.filter(p => p > 0x8000 && p < 0x10000); // Valid ROM addresses
    }
    // Enhanced public getter methods for analysis results
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
    getJumpTables() {
        return this.jumpTables;
    }
    getPointerTables() {
        return this.pointerTables;
    }
    getSpriteData() {
        return this.spriteData;
    }
    getHardwareRegisterUsage() {
        return this.registerUsage;
    }
    /**
     * Get comprehensive analysis summary
     */
    getAnalysisSummary() {
        return {
            functions: this.cfg.functions.size,
            basicBlocks: this.cfg.blocks.size,
            dataStructures: this.dataStructures.size,
            crossReferences: this.crossReferences.size,
            jumpTables: this.jumpTables.size,
            spriteStructures: this.spriteData.size,
            registerUsage: this.registerUsage.size
        };
    }
    // ====================================================================
    // ENHANCED DISASSEMBLY FEATURES - Phase 3 Implementation
    // ====================================================================
    /**
     * Enhanced disassembly features - Apply intelligent analysis to improve output
     */
    getEnhancedDisassembly(lines) {
        // Add inline data detection, better labels, and smart comments
        const enhanced = [...lines];
        // Apply all enhancement features
        this.detectInlineData(enhanced);
        this.generateBranchTargetLabels(enhanced);
        this.addIntelligentComments(enhanced);
        this.detectCompilerPatterns(enhanced);
        this.analyzeInterruptVectors(enhanced);
        this.documentHardwareRegisterUsageInCode(enhanced);
        return enhanced;
    }
    detectInlineData(lines) {
        // Detect data embedded within code segments
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Look for patterns indicating inline data
            if (this.isInlineDataPattern(line, lines, i)) {
                // Mark as inline data and add appropriate comment
                line.comment = line.comment
                    ? `${line.comment} ; INLINE DATA: ${this.identifyDataType(line)}`
                    : `; INLINE DATA: ${this.identifyDataType(line)}`;
            }
        }
    }
    isInlineDataPattern(line, lines, index) {
        // Check if this looks like data rather than executable code
        const opcode = line.instruction.opcode;
        // Invalid opcodes (often used for data)
        if (opcode === 0x42 || opcode === 0x44 || opcode === 0x54 || opcode === 0x64 ||
            opcode === 0xD4 || opcode === 0xF4) {
            return true;
        }
        // Suspicious patterns: repeated bytes that look like data
        if (index > 0 && index < lines.length - 1) {
            const prev = lines[index - 1];
            const next = lines[index + 1];
            // Pattern: same opcode repeated (likely data table)
            if (prev.instruction.opcode === opcode && next.instruction.opcode === opcode) {
                return true;
            }
        }
        // BRK instructions in the middle of code (often padding or data)
        if (line.instruction.mnemonic === 'BRK' && index > 0 && index < lines.length - 1) {
            return true;
        }
        return false;
    }
    identifyDataType(line) {
        const opcode = line.instruction.opcode;
        // Analyze the byte pattern to guess data type
        if (opcode === 0x00)
            return "NULL/PADDING";
        if (opcode === 0xFF)
            return "FILL BYTE";
        if ((opcode & 0xF0) === 0x20 || (opcode & 0xF0) === 0x30)
            return "ASCII TEXT";
        if (opcode < 0x20)
            return "CONTROL DATA";
        if ((opcode & 0x0F) === (opcode >> 4))
            return "PATTERN DATA";
        return "BINARY DATA";
    }
    generateBranchTargetLabels(lines) {
        const targets = new Map();
        // First pass: identify all branch/jump targets
        for (const line of lines) {
            if (this.isBranchInstruction(line)) {
                const target = this.calculateBranchTarget(line);
                if (target !== null) {
                    if (!targets.has(target)) {
                        targets.set(target, this.generateLabelName(line, target));
                    }
                }
            }
        }
        // Second pass: apply labels to target lines
        for (const line of lines) {
            const label = targets.get(line.address);
            if (label) {
                line.label = label;
            }
        }
    }
    isBranchInstruction(line) {
        const branchOpcodes = [
            'BCC', 'BCS', 'BEQ', 'BMI', 'BNE', 'BPL', 'BVC', 'BVS', // Conditional branches
            'BRA', 'BRL', 'JMP', 'JSR', 'JSL' // Unconditional jumps
        ];
        return branchOpcodes.includes(line.instruction.mnemonic);
    }
    calculateBranchTarget(line) {
        const mnemonic = line.instruction.mnemonic;
        const operand = line.operand;
        if (operand === undefined)
            return null;
        // Relative branches
        if (mnemonic === 'BRA' || mnemonic.startsWith('B')) {
            // For relative branches, operand is signed offset
            const offset = operand > 127 ? operand - 256 : operand;
            return line.address + line.instruction.bytes + offset;
        }
        // Absolute jumps
        if (mnemonic === 'JMP' || mnemonic === 'JSR' || mnemonic === 'JSL') {
            return operand;
        }
        return null;
    }
    generateLabelName(line, target) {
        const mnemonic = line.instruction.mnemonic;
        if (mnemonic === 'JSR' || mnemonic === 'JSL') {
            return `sub_${target.toString(16).toUpperCase()}`;
        }
        else if (mnemonic === 'JMP') {
            return `loc_${target.toString(16).toUpperCase()}`;
        }
        else {
            return `branch_${target.toString(16).toUpperCase()}`;
        }
    }
    addIntelligentComments(lines) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const comment = this.generateIntelligentComment(line, lines, i);
            if (comment) {
                line.comment = line.comment ? `${line.comment} ; ${comment}` : `; ${comment}`;
            }
        }
    }
    generateIntelligentComment(line, lines, index) {
        const mnemonic = line.instruction.mnemonic;
        const operand = line.operand;
        // REP/SEP flag operations
        if (mnemonic === 'REP' && operand !== undefined) {
            return this.describeFlagOperation(operand, false);
        }
        if (mnemonic === 'SEP' && operand !== undefined) {
            return this.describeFlagOperation(operand, true);
        }
        // Hardware register access
        if (operand !== undefined && this.isHardwareRegister(operand)) {
            return this.describeHardwareRegister(operand, mnemonic);
        }
        // DMA operations
        if (this.isDMAOperation(line, lines, index)) {
            return "DMA transfer setup";
        }
        // Graphics operations
        if (this.isGraphicsOperation(line)) {
            return this.describeGraphicsOperation(line);
        }
        // Audio operations
        if (this.isAudioOperation(line)) {
            return "Audio/SPC communication";
        }
        return null;
    }
    describeFlagOperation(value, isSet) {
        const flags = [];
        if (value & 0x80)
            flags.push("N");
        if (value & 0x40)
            flags.push("V");
        if (value & 0x20)
            flags.push("M");
        if (value & 0x10)
            flags.push("X");
        if (value & 0x08)
            flags.push("D");
        if (value & 0x04)
            flags.push("I");
        if (value & 0x02)
            flags.push("Z");
        if (value & 0x01)
            flags.push("C");
        const action = isSet ? "Set" : "Clear";
        return `${action} flags: ${flags.join(", ")}`;
    }
    isHardwareRegister(address) {
        return (address >= 0x2100 && address <= 0x21FF) || // PPU registers
            (address >= 0x4200 && address <= 0x44FF) || // CPU/DMA registers
            (address >= 0x3000 && address <= 0x3FFF); // DSP registers
    }
    describeHardwareRegister(address, operation) {
        const registerMap = {
            0x2100: "INIDISP - Screen display",
            0x2101: "OBSEL - Object size and pattern",
            0x2102: "OAMADDL - OAM address low",
            0x2103: "OAMADDH - OAM address high",
            0x2104: "OAMDATA - OAM data",
            0x2105: "BGMODE - BG mode and character size",
            0x2106: "MOSAIC - Mosaic size and enable",
            0x2107: "BG1SC - BG1 screen base and size",
            0x2108: "BG2SC - BG2 screen base and size",
            0x2109: "BG3SC - BG3 screen base and size",
            0x210A: "BG4SC - BG4 screen base and size",
            0x210B: "BG12NBA - BG1&2 character base",
            0x210C: "BG34NBA - BG3&4 character base",
            0x210D: "BG1HOFS - BG1 horizontal scroll",
            0x210E: "BG1VOFS - BG1 vertical scroll",
            0x2118: "VMDATAL - VRAM data low",
            0x2119: "VMDATAH - VRAM data high",
            0x2122: "CGDATA - Color palette data",
            0x4200: "NMITIMEN - NMI/IRQ enable",
            0x4201: "WRIO - I/O port",
            0x4202: "WRMPYA - Multiplicand A",
            0x4203: "WRMPYB - Multiplicand B",
            0x4204: "WRDIVL - Dividend low",
            0x4205: "WRDIVH - Dividend high",
            0x4206: "WRDIVB - Divisor",
            0x4207: "HTIMEL - H-timer low",
            0x4208: "HTIMEH - H-timer high",
            0x4209: "VTIMEL - V-timer low",
            0x420A: "VTIMEH - V-timer high",
            0x420B: "MDMAEN - DMA enable",
            0x420C: "HDMAEN - HDMA enable"
        };
        const regName = registerMap[address];
        if (regName) {
            const action = operation === 'STA' ? "Write to" : "Read from";
            return `${action} ${regName}`;
        }
        return `${operation} hardware register $${address.toString(16).toUpperCase()}`;
    }
    isDMAOperation(line, _lines, _index) {
        const operand = line.operand;
        if (!operand)
            return false;
        // DMA control registers
        if (operand >= 0x4300 && operand <= 0x437F)
            return true;
        if (operand === 0x420B || operand === 0x420C)
            return true; // MDMAEN, HDMAEN
        return false;
    }
    isGraphicsOperation(line) {
        const operand = line.operand;
        if (!operand)
            return false;
        // PPU graphics registers
        return (operand >= 0x2100 && operand <= 0x2133);
    }
    describeGraphicsOperation(line) {
        const operand = line.operand;
        if (operand >= 0x2118 && operand <= 0x2119)
            return "VRAM upload";
        if (operand === 0x2122)
            return "Palette upload";
        if (operand === 0x2104)
            return "Sprite data upload";
        if (operand >= 0x210D && operand <= 0x2114)
            return "Background scroll";
        if (operand >= 0x2107 && operand <= 0x210A)
            return "Background tilemap";
        return "Graphics setup";
    }
    isAudioOperation(line) {
        const operand = line.operand;
        if (!operand)
            return false;
        // SPC communication ports
        return (operand >= 0x2140 && operand <= 0x2143);
    }
    detectCompilerPatterns(lines) {
        // Detect common compiler-generated patterns
        for (let i = 0; i < lines.length - 2; i++) {
            // Function prologue pattern
            if (this.isFunctionPrologue(lines.slice(i, i + 3))) {
                lines[i].comment = lines[i].comment
                    ? `${lines[i].comment} ; Function prologue`
                    : `; Function prologue`;
            }
            // Function epilogue pattern
            if (this.isFunctionEpilogue(lines.slice(i, i + 2))) {
                lines[i].comment = lines[i].comment
                    ? `${lines[i].comment} ; Function epilogue`
                    : `; Function epilogue`;
            }
            // Stack frame setup
            if (this.isStackFrameSetup(lines.slice(i, i + 3))) {
                lines[i].comment = lines[i].comment
                    ? `${lines[i].comment} ; Stack frame setup`
                    : `; Stack frame setup`;
            }
        }
    }
    isFunctionPrologue(sequence) {
        if (sequence.length < 3)
            return false;
        // Pattern: PHB / PHK / PLB (common function entry)
        return sequence[0].instruction.mnemonic === 'PHB' &&
            sequence[1].instruction.mnemonic === 'PHK' &&
            sequence[2].instruction.mnemonic === 'PLB';
    }
    isFunctionEpilogue(sequence) {
        if (sequence.length < 2)
            return false;
        // Pattern: PLB / RTS or RTL
        return sequence[0].instruction.mnemonic === 'PLB' &&
            (sequence[1].instruction.mnemonic === 'RTS' ||
                sequence[1].instruction.mnemonic === 'RTL');
    }
    isStackFrameSetup(sequence) {
        if (sequence.length < 3)
            return false;
        // Pattern: TCS / TSC / manipulation
        return sequence[0].instruction.mnemonic === 'TCS' ||
            sequence[1].instruction.mnemonic === 'TSC' ||
            (sequence[0].instruction.mnemonic === 'REP' &&
                sequence[0].operand === 0x30); // REP #$30 (16-bit mode)
    }
    analyzeInterruptVectors(lines) {
        // Look for interrupt handler patterns
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // RTI instruction indicates interrupt handler
            if (line.instruction.mnemonic === 'RTI') {
                line.comment = line.comment
                    ? `${line.comment} ; Interrupt return`
                    : `; Interrupt return`;
                // Mark the function containing this as interrupt handler
                this.markAsInterruptHandler(line.address, lines);
            }
            // CLI/SEI patterns
            if (line.instruction.mnemonic === 'CLI') {
                line.comment = line.comment
                    ? `${line.comment} ; Enable interrupts`
                    : `; Enable interrupts`;
            }
            if (line.instruction.mnemonic === 'SEI') {
                line.comment = line.comment
                    ? `${line.comment} ; Disable interrupts`
                    : `; Disable interrupts`;
            }
        }
    }
    markAsInterruptHandler(address, _lines) {
        // Find the function containing this address and mark it as interrupt handler
        for (const [funcAddr, func] of this.cfg.functions) {
            if (funcAddr <= address && (!func.endAddress || address <= func.endAddress)) {
                func.isInterrupt = true;
                break;
            }
        }
    }
    documentHardwareRegisterUsageInCode(lines) {
        // Track and document hardware register usage patterns
        const registerUsage = new Map();
        for (const line of lines) {
            const operand = line.operand;
            if (operand && this.isHardwareRegister(operand)) {
                if (!registerUsage.has(operand)) {
                    registerUsage.set(operand, { reads: 0, writes: 0, operations: [] });
                }
                const usage = registerUsage.get(operand);
                const operation = line.instruction.mnemonic;
                if (operation === 'LDA' || operation === 'LDX' || operation === 'LDY') {
                    usage.reads++;
                }
                else if (operation === 'STA' || operation === 'STX' || operation === 'STY') {
                    usage.writes++;
                }
                usage.operations.push(operation);
            }
        }
        // Store register usage for later retrieval
        for (const [register, usage] of registerUsage) {
            const existing = this.registerUsage.get(register);
            if (existing) {
                existing.reads += usage.reads;
                existing.writes += usage.writes;
            }
            else {
                this.registerUsage.set(register, {
                    register: this.getRegisterName(register),
                    address: register,
                    description: this.getRegisterDescription(register),
                    reads: usage.reads,
                    writes: usage.writes,
                    accessPoints: []
                });
            }
        }
    }
    getRegisterName(address) {
        const names = {
            0x2100: "INIDISP", 0x2101: "OBSEL", 0x2102: "OAMADDL", 0x2103: "OAMADDH",
            0x2104: "OAMDATA", 0x2105: "BGMODE", 0x2106: "MOSAIC", 0x2107: "BG1SC",
            0x2108: "BG2SC", 0x2109: "BG3SC", 0x210A: "BG4SC", 0x210B: "BG12NBA",
            0x210C: "BG34NBA", 0x210D: "BG1HOFS", 0x210E: "BG1VOFS", 0x2118: "VMDATAL",
            0x2119: "VMDATAH", 0x2122: "CGDATA", 0x4200: "NMITIMEN", 0x4201: "WRIO",
            0x4202: "WRMPYA", 0x4203: "WRMPYB", 0x420B: "MDMAEN", 0x420C: "HDMAEN"
        };
        return names[address] || `REG_${address.toString(16).toUpperCase()}`;
    }
    // ====================================================================
    // ADVANCED CONTROL FLOW ANALYSIS - Remaining Phase 3 Features
    // ====================================================================
    /**
     * Recursive descent analysis for complex control flow patterns
     */
    performRecursiveDescentAnalysis(lines) {
        // Build a comprehensive control flow graph using recursive descent
        for (const [funcAddr, func] of this.cfg.functions) {
            this.analyzeComplexControlFlow(lines, funcAddr, func);
        }
    }
    analyzeComplexControlFlow(lines, funcAddr, func) {
        const visited = new Set();
        const workQueue = [funcAddr];
        while (workQueue.length > 0) {
            const currentAddr = workQueue.pop();
            if (visited.has(currentAddr))
                continue;
            visited.add(currentAddr);
            const line = lines.find(l => l.address === currentAddr);
            if (!line)
                continue;
            // Analyze instruction for control flow implications
            const flowTargets = this.getControlFlowTargets(line, lines);
            // Add discovered targets to analysis queue
            for (const target of flowTargets) {
                if (!visited.has(target) && this.isWithinFunction(target, func)) {
                    workQueue.push(target);
                }
            }
            // Detect complex patterns
            this.detectComplexControlPattern(line, lines, func);
        }
    }
    getControlFlowTargets(line, lines) {
        const targets = [];
        const mnemonic = line.instruction.mnemonic;
        // Direct branches and jumps
        if (this.isBranchInstruction(line)) {
            const target = this.calculateBranchTarget(line);
            if (target !== null) {
                targets.push(target);
            }
        }
        // Indirect jumps - resolve targets from context
        if (mnemonic === 'JMP' &&
            (line.instruction.addressingMode === types_1.AddressingMode.AbsoluteIndirect ||
                line.instruction.addressingMode === types_1.AddressingMode.AbsoluteIndexedIndirect)) {
            const indirectTargets = this.resolveIndirectJumpTargets(line, lines);
            targets.push(...indirectTargets);
        }
        // Fall-through for non-terminal instructions
        if (!this.isTerminalInstruction(line)) {
            targets.push(line.address + line.instruction.bytes);
        }
        return targets;
    }
    resolveIndirectJumpTargets(line, lines) {
        const targets = [];
        if (!line.operand)
            return targets;
        // Look for jump table patterns in the vicinity
        const jumpTable = this.jumpTables.get(line.operand);
        if (jumpTable) {
            targets.push(...jumpTable.targets);
            return targets;
        }
        // Try to resolve from nearby LDA operations
        const lineIndex = lines.findIndex(l => l.address === line.address);
        for (let i = Math.max(0, lineIndex - 10); i < Math.min(lines.length, lineIndex + 10); i++) {
            const nearbyLine = lines[i];
            if (nearbyLine.instruction.mnemonic === 'LDA' && nearbyLine.operand === line.operand) {
                // Found potential jump target loading
                const target = this.extractJumpTarget(nearbyLine, lines);
                if (target !== null) {
                    targets.push(target);
                }
            }
        }
        return targets;
    }
    extractJumpTarget(line, lines) {
        // Look for immediate loads that might be jump targets
        if (line.instruction.addressingMode === types_1.AddressingMode.Immediate && line.operand) {
            // Check if this looks like a valid code address
            if (line.operand >= 0x8000 && line.operand <= 0xFFFF) {
                return line.operand;
            }
        }
        return null;
    }
    isWithinFunction(address, func) {
        return address >= func.startAddress &&
            (!func.endAddress || address <= func.endAddress);
    }
    isTerminalInstruction(line) {
        const terminal = ['RTS', 'RTL', 'RTI', 'JMP', 'JML', 'BRA', 'BRL'];
        return terminal.includes(line.instruction.mnemonic);
    }
    detectComplexControlPattern(line, lines, func) {
        // Detect switch statements (computed jumps)
        if (this.isSwitchStatement(line, lines)) {
            this.recordSwitchStatement(line, func);
        }
        // Detect loop constructs
        if (this.isLoopConstruct(line, lines)) {
            this.recordLoopConstruct(line, func);
        }
        // Detect function calls
        if (this.isFunctionCall(line)) {
            this.recordFunctionCall(line, func);
        }
    }
    isSwitchStatement(line, lines) {
        // Pattern: CMP followed by BCC/BCS and then indexed jump
        const lineIndex = lines.findIndex(l => l.address === line.address);
        if (lineIndex < 0 || lineIndex + 3 >= lines.length)
            return false;
        const next1 = lines[lineIndex + 1];
        const next2 = lines[lineIndex + 2];
        const next3 = lines[lineIndex + 3];
        return line.instruction.mnemonic === 'CMP' &&
            (next1.instruction.mnemonic === 'BCC' || next1.instruction.mnemonic === 'BCS') &&
            next2.instruction.mnemonic === 'ASL' &&
            next3.instruction.mnemonic === 'JMP' &&
            next3.instruction.addressingMode === types_1.AddressingMode.AbsoluteIndexedIndirect;
    }
    isLoopConstruct(line, lines) {
        // Detect backward branches (potential loops)
        if (this.isBranchInstruction(line)) {
            const target = this.calculateBranchTarget(line);
            return target !== null && target < line.address;
        }
        // Detect DEX/DEY followed by BNE (count-down loops)
        const lineIndex = lines.findIndex(l => l.address === line.address);
        if (lineIndex >= 0 && lineIndex + 1 < lines.length) {
            const next = lines[lineIndex + 1];
            return (line.instruction.mnemonic === 'DEX' || line.instruction.mnemonic === 'DEY') &&
                next.instruction.mnemonic === 'BNE';
        }
        return false;
    }
    isFunctionCall(line) {
        return line.instruction.mnemonic === 'JSR' || line.instruction.mnemonic === 'JSL';
    }
    recordSwitchStatement(line, func) {
        // Record switch statement in function metadata
        if (!func.switchStatements) {
            func.switchStatements = [];
        }
        func.switchStatements.push({
            address: line.address,
            type: 'SWITCH',
            description: 'Computed jump switch statement'
        });
    }
    recordLoopConstruct(line, func) {
        // Record loop construct in function metadata
        if (!func.loops) {
            func.loops = [];
        }
        func.loops.push({
            address: line.address,
            type: this.getLoopType(line),
            description: 'Loop construct detected'
        });
    }
    getLoopType(line) {
        if (line.instruction.mnemonic === 'DEX' || line.instruction.mnemonic === 'DEY') {
            return 'COUNT_DOWN';
        }
        if (this.isBranchInstruction(line)) {
            return 'CONDITIONAL';
        }
        return 'UNKNOWN';
    }
    recordFunctionCall(line, func) {
        if (line.operand) {
            func.callees.add(line.operand);
            // Update the called function's callers
            let calledFunc = this.cfg.functions.get(line.operand);
            if (!calledFunc) {
                // Create function entry if it doesn't exist
                calledFunc = {
                    startAddress: line.operand,
                    callers: new Set([func.startAddress]),
                    callees: new Set(),
                    basicBlocks: new Set(),
                    isInterrupt: false,
                    confidence: 0.6
                };
                this.cfg.functions.set(line.operand, calledFunc);
            }
            else {
                calledFunc.callers.add(func.startAddress);
            }
        }
    }
    /**
     * Generate function call graph
     */
    generateFunctionCallGraph() {
        const callGraph = new Map();
        for (const [funcAddr, func] of this.cfg.functions) {
            callGraph.set(funcAddr, {
                callers: Array.from(func.callers),
                callees: Array.from(func.callees)
            });
        }
        return callGraph;
    }
    /**
     * String and text detection based on Zelda3 patterns
     */
    detectStringData(lines) {
        for (let i = 0; i < lines.length - 4; i++) {
            const sequence = lines.slice(i, i + 5);
            // Look for text rendering patterns from Zelda3 research
            if (this.isTextRenderingPattern(sequence)) {
                const textAddr = this.extractTextAddress(sequence);
                if (textAddr !== null) {
                    this.dataStructures.set(textAddr, {
                        address: textAddr,
                        type: 'STRING_TABLE',
                        size: this.estimateStringLength(lines, textAddr),
                        entries: 1,
                        description: 'Text string data',
                        confidence: 0.7,
                        format: 'SNES text encoding'
                    });
                }
            }
        }
    }
    isTextRenderingPattern(sequence) {
        // Pattern from Zelda3: Main_ShowTextMessage, RenderText calls
        // Look for LDA immediate followed by JSR to text functions
        return sequence.length >= 2 &&
            sequence[0].instruction.mnemonic === 'LDA' &&
            sequence[0].instruction.addressingMode === types_1.AddressingMode.Immediate &&
            sequence[1].instruction.mnemonic === 'JSR';
    }
    extractTextAddress(sequence) {
        const ldaLine = sequence[0];
        return ldaLine.operand || null;
    }
    estimateStringLength(lines, startAddr) {
        // Estimate based on common SNES text termination patterns
        let length = 0;
        for (const line of lines) {
            if (line.address >= startAddr) {
                if (line.bytes) {
                    for (const byte of line.bytes) {
                        length++;
                        // Common text terminators in SNES games
                        if (byte === 0x00 || byte === 0xFF) {
                            return length;
                        }
                    }
                }
                if (length > 256)
                    break; // Reasonable text length limit
            }
        }
        return Math.min(length, 256);
    }
    /**
     * Audio/music data recognition based on APU communication patterns
     */
    detectAudioData(lines) {
        for (let i = 0; i < lines.length - 3; i++) {
            const sequence = lines.slice(i, i + 4);
            // Look for APU communication patterns (0x2140-0x2143)
            if (this.isAPUCommunicationPattern(sequence)) {
                const audioAddr = this.extractAudioDataAddress(sequence);
                if (audioAddr !== null) {
                    this.dataStructures.set(audioAddr, {
                        address: audioAddr,
                        type: 'MUSIC_DATA',
                        size: this.estimateAudioDataSize(lines, audioAddr),
                        entries: 1,
                        description: 'Audio/music data for APU',
                        confidence: 0.8,
                        format: 'SPC700 audio data'
                    });
                }
            }
        }
    }
    isAPUCommunicationPattern(sequence) {
        // Pattern: Loading data and writing to APU I/O ports (0x2140-0x2143)
        for (const line of sequence) {
            if (line.instruction.mnemonic === 'STA' && line.operand &&
                line.operand >= 0x2140 && line.operand <= 0x2143) {
                return true;
            }
        }
        return false;
    }
    extractAudioDataAddress(sequence) {
        // Look for LDA operations that load audio data
        for (const line of sequence) {
            if (line.instruction.mnemonic === 'LDA' &&
                line.instruction.addressingMode === types_1.AddressingMode.AbsoluteX &&
                line.operand && line.operand >= 0x8000) {
                return line.operand;
            }
        }
        return null;
    }
    estimateAudioDataSize(lines, startAddr) {
        // Audio data is typically larger than text data
        let size = 0;
        for (const line of lines) {
            if (line.address >= startAddr) {
                if (line.bytes) {
                    size += line.bytes.length;
                }
                if (size > 2048)
                    break; // Reasonable audio data limit
            }
        }
        return Math.min(size, 2048);
    }
    /**
     * Variable usage tracking and data flow analysis
     */
    performDataFlowAnalysis(lines) {
        const variableUsage = new Map();
        for (const line of lines) {
            const address = line.operand;
            if (address && this.isDataAccess(line)) {
                if (!variableUsage.has(address)) {
                    variableUsage.set(address, {
                        reads: [],
                        writes: [],
                        type: this.inferDataType(line, lines)
                    });
                }
                const usage = variableUsage.get(address);
                if (this.isReadOperation(line)) {
                    usage.reads.push(line.address);
                }
                else if (this.isWriteOperation(line.instruction.mnemonic)) {
                    usage.writes.push(line.address);
                }
            }
        }
        // Store variable usage data
        this.variableUsage = variableUsage;
    }
    isDataAccess(line) {
        const mnemonic = line.instruction.mnemonic;
        const dataOps = ['LDA', 'LDX', 'LDY', 'STA', 'STX', 'STY', 'STZ'];
        return dataOps.includes(mnemonic) &&
            line.operand !== undefined &&
            line.operand >= 0x0000 && line.operand <= 0x1FFF; // RAM addresses
    }
    isReadOperation(line) {
        const readOps = ['LDA', 'LDX', 'LDY', 'CMP', 'CPX', 'CPY', 'BIT'];
        return readOps.includes(line.instruction.mnemonic);
    }
    inferDataType(line, lines) {
        // Infer data type based on usage patterns
        const mnemonic = line.instruction.mnemonic;
        if (mnemonic.includes('X') || mnemonic.includes('Y')) {
            return 'INDEX';
        }
        if (line.instruction.addressingMode === types_1.AddressingMode.Immediate) {
            return 'CONSTANT';
        }
        if (line.operand && line.operand < 0x100) {
            return 'ZERO_PAGE';
        }
        return 'VARIABLE';
    }
    /**
     * Get variable usage tracking results
     */
    getVariableUsage() {
        return this.variableUsage;
    }
    /**
     * Symbol dependency analysis
     */
    performSymbolDependencyAnalysis() {
        const dependencies = new Map();
        for (const [address, symbol] of this.symbols) {
            const deps = new Set();
            // Analyze symbol references to find dependencies
            for (const ref of symbol.references) {
                if (ref.type === 'READ' || ref.type === 'CALL') {
                    // This symbol depends on the referenced address
                    deps.add(ref.address);
                }
            }
            dependencies.set(address, deps);
        }
        this.symbolDependencies = dependencies;
    }
    /**
     * Get symbol dependency analysis results
     */
    getSymbolDependencies() {
        return this.symbolDependencies;
    }
    /**
     * Extract audio data suitable for SPC export
     */
    extractAudioData(lines) {
        const audioData = {
            ram: new Uint8Array(65536), // SPC700 RAM size
            dspRegisters: new Array(128).fill(0), // DSP registers
            timers: {}, // Timer states
            ioPorts: {} // I/O ports states
        };
        // Analyze lines for audio data
        this.detectAudioData(lines);
        // Extract relevant data from detected patterns
        lines.forEach(line => {
            // Check if this line represents music data
            const musicDataStruct = this.dataStructures.get(line.address);
            if (musicDataStruct && musicDataStruct.type === 'MUSIC_DATA') {
                // Extract RAM, DSP, Timer, I/O port states based on line details
                if (line.bytes) {
                    const targetAddr = line.address & 0xFFFF; // Ensure within SPC700 RAM range
                    if (targetAddr < audioData.ram.length) {
                        audioData.ram.set(line.bytes, targetAddr);
                    }
                }
            }
        });
        return audioData;
    }
    // ====================================================================
    // MACRO AND INLINE FUNCTION DETECTION
    // ====================================================================
    /**
     * Detect macro patterns and inline functions in the code
     */
    detectMacrosAndInlineFunctions(lines) {
        // Common SNES macro patterns
        const macroPatterns = [
            // 16-bit load macro pattern
            {
                name: 'LOAD16',
                pattern: ['REP #$20', 'LDA'],
                description: 'Switch to 16-bit A and load'
            },
            // 8-bit store macro pattern
            {
                name: 'STORE8',
                pattern: ['SEP #$20', 'STA'],
                description: 'Switch to 8-bit A and store'
            },
            // DMA setup macro
            {
                name: 'DMA_SETUP',
                pattern: ['LDA #', 'STA $4300', 'LDA #', 'STA $4301'],
                description: 'DMA channel setup macro'
            },
            // VRAM address setup
            {
                name: 'VRAM_ADDR',
                pattern: ['LDA #', 'STA $2116', 'LDA #', 'STA $2117'],
                description: 'Set VRAM address macro'
            },
            // Wait for vblank macro
            {
                name: 'WAIT_VBLANK',
                pattern: ['LDA $4212', 'AND #$80', 'BEQ'],
                description: 'Wait for vertical blank'
            }
        ];
        // Detect macro usage
        for (let i = 0; i < lines.length; i++) {
            for (const macro of macroPatterns) {
                if (this.matchesMacroPattern(lines, i, macro.pattern)) {
                    // Mark as macro usage
                    lines[i].comment = lines[i].comment
                        ? `${lines[i].comment} ; ${macro.name}: ${macro.description}`
                        : `; ${macro.name}: ${macro.description}`;
                    // Mark subsequent lines as part of macro
                    for (let j = 1; j < macro.pattern.length && i + j < lines.length; j++) {
                        lines[i + j].comment = lines[i + j].comment
                            ? `${lines[i + j].comment} ; └─ ${macro.name} continuation`
                            : `; └─ ${macro.name} continuation`;
                    }
                }
            }
        }
        // Detect inline function patterns
        this.detectInlineFunctions(lines);
    }
    matchesMacroPattern(lines, startIndex, pattern) {
        if (startIndex + pattern.length > lines.length)
            return false;
        for (let i = 0; i < pattern.length; i++) {
            const line = lines[startIndex + i];
            const patternPart = pattern[i];
            if (patternPart.includes('#')) {
                // Check mnemonic and immediate addressing
                const [mnemonic] = patternPart.split(' ');
                if (line.instruction.mnemonic !== mnemonic)
                    return false;
                if (!patternPart.includes('#$') && line.instruction.addressingMode !== types_1.AddressingMode.Immediate)
                    return false;
            }
            else if (patternPart.includes('$')) {
                // Check for specific address
                const [mnemonic, addr] = patternPart.split(' ');
                if (line.instruction.mnemonic !== mnemonic)
                    return false;
                if (addr && line.operand !== parseInt(addr.replace('$', ''), 16))
                    return false;
            }
            else {
                // Just check mnemonic
                if (line.instruction.mnemonic !== patternPart)
                    return false;
            }
        }
        return true;
    }
    detectInlineFunctions(lines) {
        // Detect common inline function patterns
        const inlinePatterns = [
            // Multiplication by constant power of 2
            {
                detect: (lines, i) => {
                    if (i + 2 >= lines.length)
                        return false;
                    return lines[i].instruction.mnemonic === 'ASL' &&
                        lines[i + 1].instruction.mnemonic === 'ASL' &&
                        lines[i + 1].operand === lines[i].operand;
                },
                mark: (lines, i) => {
                    lines[i].comment = `; Inline multiply by 4`;
                    lines[i + 1].comment = `; └─ continuation`;
                }
            },
            // 16-bit comparison
            {
                detect: (lines, i) => {
                    if (i + 3 >= lines.length)
                        return false;
                    return lines[i].instruction.mnemonic === 'LDA' &&
                        lines[i + 1].instruction.mnemonic === 'CMP' &&
                        lines[i + 2].instruction.mnemonic === 'BNE' &&
                        lines[i + 3].instruction.mnemonic === 'LDA';
                },
                mark: (lines, i) => {
                    lines[i].comment = `; Inline 16-bit compare`;
                    lines[i + 1].comment = `; └─ low byte compare`;
                    lines[i + 2].comment = `; └─ branch if not equal`;
                    lines[i + 3].comment = `; └─ high byte compare`;
                }
            }
        ];
        for (let i = 0; i < lines.length; i++) {
            for (const pattern of inlinePatterns) {
                if (pattern.detect(lines, i)) {
                    pattern.mark(lines, i);
                }
            }
        }
    }
    // ====================================================================
    // GAME-SPECIFIC PATTERN RECOGNITION
    // ====================================================================
    /**
     * Detect game-specific patterns based on common SNES game engines
     */
    detectGameSpecificPatterns(lines, cartInfo) {
        // Try to identify game engine based on patterns
        const engineSignatures = [
            {
                name: 'Nintendo First-Party Engine',
                patterns: ['$2140', '$2141', '$2142', '$2143'], // APU communication pattern
                confidence: 0
            },
            {
                name: 'Capcom Engine',
                patterns: ['$7E0000', '$7E0002', '$7E0004'], // Specific RAM usage
                confidence: 0
            },
            {
                name: 'Square RPG Engine',
                patterns: ['$7E1000', 'JSL $C0', 'RTL'], // Common Square patterns
                confidence: 0
            },
            {
                name: 'Konami Engine',
                patterns: ['LDA $4218', 'AND #$', 'BEQ'], // Controller reading pattern
                confidence: 0
            }
        ];
        // Analyze patterns
        for (const line of lines) {
            for (const engine of engineSignatures) {
                for (const pattern of engine.patterns) {
                    if (this.lineMatchesPattern(line, pattern)) {
                        engine.confidence += 0.1;
                    }
                }
            }
        }
        // Find most likely engine
        const likelyEngine = engineSignatures.reduce((best, current) => current.confidence > best.confidence ? current : best);
        if (likelyEngine.confidence > 0.3) {
            // Apply engine-specific pattern recognition
            this.applyEngineSpecificPatterns(lines, likelyEngine.name);
        }
        // Detect common game structures
        this.detectGameStructures(lines, cartInfo);
    }
    lineMatchesPattern(line, pattern) {
        if (pattern.startsWith('$')) {
            // Address pattern
            const addr = parseInt(pattern.replace('$', ''), 16);
            return line.operand === addr;
        }
        else if (pattern.startsWith('JSL ')) {
            // JSL pattern
            return line.instruction.mnemonic === 'JSL' &&
                line.operand !== undefined &&
                line.operand.toString(16).toUpperCase().startsWith(pattern.substring(5));
        }
        else {
            // Mnemonic pattern
            return line.instruction.mnemonic === pattern;
        }
    }
    applyEngineSpecificPatterns(lines, engineName) {
        switch (engineName) {
            case 'Nintendo First-Party Engine':
                this.detectNintendoPatterns(lines);
                break;
            case 'Square RPG Engine':
                this.detectSquareRPGPatterns(lines);
                break;
            case 'Capcom Engine':
                this.detectCapcomPatterns(lines);
                break;
            case 'Konami Engine':
                this.detectKonamiPatterns(lines);
                break;
        }
    }
    detectNintendoPatterns(lines) {
        // Nintendo-specific patterns (Mario, Zelda, etc.)
        for (const line of lines) {
            // Sprite OAM update pattern
            if (line.operand !== undefined && line.operand === 0x0400 && line.instruction.mnemonic === 'STX') {
                line.comment = `; Nintendo OAM DMA trigger`;
            }
            // Mode 7 setup
            if (line.operand !== undefined && line.operand >= 0x211B && line.operand <= 0x2120) {
                line.comment = `; Mode 7 matrix setup`;
            }
        }
    }
    detectSquareRPGPatterns(lines) {
        // Square RPG patterns (Final Fantasy, Chrono Trigger, etc.)
        for (const line of lines) {
            // Menu system patterns
            if (line.operand !== undefined && line.operand >= 0x7E1000 && line.operand <= 0x7E1FFF) {
                line.comment = `; Menu/UI data area`;
            }
            // Battle system patterns
            if (line.instruction.mnemonic === 'JSL' && line.operand && (line.operand & 0xFF0000) === 0xC00000) {
                line.comment = `; Battle system routine`;
            }
        }
    }
    detectCapcomPatterns(lines) {
        // Capcom patterns (Mega Man X, Street Fighter, etc.)
        for (const line of lines) {
            // Capcom's specific DMA usage
            if (line.operand !== undefined && line.operand === 0x4305 && line.instruction.mnemonic === 'STA') {
                line.comment = `; Capcom DMA size setup`;
            }
        }
    }
    detectKonamiPatterns(lines) {
        // Konami patterns (Contra, Castlevania, etc.)
        for (const line of lines) {
            // Konami code detection patterns
            if (line.operand === 0x4218 && line.instruction.mnemonic === 'LDA') {
                line.comment = `; Read controller 1 data`;
            }
        }
    }
    detectGameStructures(lines, _cartInfo) {
        // Detect common game loop structures
        for (let i = 0; i < lines.length - 10; i++) {
            // Main game loop pattern
            if (lines[i].instruction.mnemonic === 'JSR' &&
                lines[i + 1].instruction.mnemonic === 'JSR' &&
                lines[i + 2].instruction.mnemonic === 'JSR' &&
                lines[i + 3].instruction.mnemonic === 'JMP') {
                lines[i].comment = `; Game loop: Update`;
                lines[i + 1].comment = `; Game loop: Draw`;
                lines[i + 2].comment = `; Game loop: VSync`;
                lines[i + 3].comment = `; Game loop: Repeat`;
            }
            // NMI handler pattern
            if (lines[i].instruction.mnemonic === 'REP' && lines[i].operand === 0x30 &&
                lines[i + 1].instruction.mnemonic === 'PHA') {
                lines[i].comment = `; NMI handler: Save processor state`;
            }
        }
    }
    // ====================================================================
    // CODE QUALITY METRICS AND REPORTING
    // ====================================================================
    /**
     * Calculate and store code quality metrics
     */
    calculateCodeQualityMetrics(lines) {
        const metrics = {
            totalInstructions: lines.length,
            codeBytes: 0,
            dataBytes: 0,
            functionCount: this.cfg.functions.size,
            averageFunctionSize: 0,
            cyclomaticComplexity: new Map(),
            unreachableCode: 0,
            commentedLines: 0,
            labeledLines: 0,
            hardwareRegisterAccesses: 0,
            subroutineCalls: 0,
            indirectJumps: 0,
            selfModifyingCodeSuspects: 0,
            interruptHandlers: 0,
            possibleBugs: []
        };
        // Calculate metrics
        for (const line of lines) {
            // Count code bytes
            if (Array.isArray(line.instruction.bytes)) {
                metrics.codeBytes += line.instruction.bytes.length;
            }
            else {
                metrics.codeBytes += 1; // Assume 1 byte if not an array
            }
            // Count comments and labels
            if (line.comment)
                metrics.commentedLines++;
            if (line.label)
                metrics.labeledLines++;
            // Count hardware register accesses
            if (line.operand && this.isHardwareRegister(line.operand)) {
                metrics.hardwareRegisterAccesses++;
            }
            // Count subroutine calls
            if (line.instruction.mnemonic === 'JSR' || line.instruction.mnemonic === 'JSL') {
                metrics.subroutineCalls++;
            }
            // Count indirect jumps
            if (line.instruction.mnemonic === 'JMP' &&
                (line.instruction.addressingMode === types_1.AddressingMode.AbsoluteIndirect ||
                    line.instruction.addressingMode === types_1.AddressingMode.AbsoluteIndexedIndirect)) {
                metrics.indirectJumps++;
            }
            // Detect self-modifying code suspects
            if (line.instruction.mnemonic === 'STA' && line.operand &&
                line.operand >= 0x8000 && line.operand <= 0xFFFF) {
                metrics.selfModifyingCodeSuspects++;
                metrics.possibleBugs.push({
                    address: line.address,
                    type: 'SELF_MODIFYING_CODE',
                    description: 'Writing to ROM area - possible self-modifying code',
                    severity: 'HIGH'
                });
            }
        }
        // Calculate average function size
        let totalFunctionSize = 0;
        for (const func of this.cfg.functions.values()) {
            if (func.endAddress) {
                totalFunctionSize += func.endAddress - func.startAddress;
            }
            if (func.isInterrupt) {
                metrics.interruptHandlers++;
            }
        }
        metrics.averageFunctionSize = metrics.functionCount > 0
            ? Math.round(totalFunctionSize / metrics.functionCount)
            : 0;
        // Calculate cyclomatic complexity for each function
        for (const [addr, func] of this.cfg.functions) {
            const complexity = this.calculateCyclomaticComplexity(func, lines);
            metrics.cyclomaticComplexity.set(addr, complexity);
        }
        // Detect potential bugs
        this.detectPotentialBugs(lines, metrics);
        // Store metrics
        this.codeMetrics = metrics;
    }
    calculateCyclomaticComplexity(func, lines) {
        let complexity = 1; // Base complexity
        // Count decision points within function
        for (const line of lines) {
            if (line.address >= func.startAddress &&
                (!func.endAddress || line.address <= func.endAddress)) {
                const mnemonic = line.instruction.mnemonic;
                // Conditional branches increase complexity
                if (mnemonic === 'BEQ' || mnemonic === 'BNE' || mnemonic === 'BCS' ||
                    mnemonic === 'BCC' || mnemonic === 'BMI' || mnemonic === 'BPL' ||
                    mnemonic === 'BVS' || mnemonic === 'BVC') {
                    complexity++;
                }
            }
        }
        return complexity;
    }
    detectPotentialBugs(lines, metrics) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Stack imbalance detection
            if (line.instruction.mnemonic === 'PLA' && i > 0 &&
                lines[i - 1].instruction.mnemonic !== 'PHA') {
                metrics.possibleBugs.push({
                    address: line.address,
                    type: 'STACK_IMBALANCE',
                    description: 'PLA without preceding PHA - possible stack imbalance',
                    severity: 'MEDIUM'
                });
            }
            // Uninitialized memory access
            if ((line.instruction.mnemonic === 'LDA' || line.instruction.mnemonic === 'LDX' ||
                line.instruction.mnemonic === 'LDY') && line.operand &&
                line.operand >= 0x0200 && line.operand <= 0x1FFF) {
                // Check if this memory was written to before
                let initialized = false;
                for (let j = 0; j < i; j++) {
                    if ((lines[j].instruction.mnemonic === 'STA' ||
                        lines[j].instruction.mnemonic === 'STX' ||
                        lines[j].instruction.mnemonic === 'STY') &&
                        lines[j].operand === line.operand) {
                        initialized = true;
                        break;
                    }
                }
                if (!initialized) {
                    metrics.possibleBugs.push({
                        address: line.address,
                        type: 'UNINITIALIZED_READ',
                        description: `Reading potentially uninitialized memory at $${line.operand.toString(16)}`,
                        severity: 'LOW'
                    });
                }
            }
            // Infinite loop detection
            if (line.instruction.mnemonic === 'JMP' && line.operand === line.address) {
                metrics.possibleBugs.push({
                    address: line.address,
                    type: 'INFINITE_LOOP',
                    description: 'JMP to self - infinite loop',
                    severity: 'HIGH'
                });
            }
        }
    }
    /**
     * Get code quality metrics
     */
    getCodeQualityMetrics() {
        return this.codeMetrics;
    }
    /**
     * Generate code quality report
     */
    generateQualityReport() {
        if (!this.codeMetrics)
            return 'No metrics available';
        const m = this.codeMetrics;
        let report = '# Code Quality Report\n\n';
        report += '## Overview\n';
        report += `- Total Instructions: ${m.totalInstructions}\n`;
        report += `- Code Size: ${m.codeBytes} bytes\n`;
        report += `- Functions: ${m.functionCount}\n`;
        report += `- Average Function Size: ${m.averageFunctionSize} bytes\n`;
        report += `- Commented Lines: ${m.commentedLines} (${Math.round(m.commentedLines / m.totalInstructions * 100)}%)\n`;
        report += `- Labeled Lines: ${m.labeledLines}\n\n`;
        report += '## Complexity Analysis\n';
        report += `- Subroutine Calls: ${m.subroutineCalls}\n`;
        report += `- Indirect Jumps: ${m.indirectJumps}\n`;
        report += `- Hardware Register Accesses: ${m.hardwareRegisterAccesses}\n`;
        report += `- Interrupt Handlers: ${m.interruptHandlers}\n`;
        report += `- Self-Modifying Code Suspects: ${m.selfModifyingCodeSuspects}\n\n`;
        report += '## Function Complexity\n';
        const complexFunctions = Array.from(m.cyclomaticComplexity.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        for (const [addr, complexity] of complexFunctions) {
            const func = this.cfg.functions.get(addr);
            const name = func?.name || `sub_${addr.toString(16)}`;
            report += `- ${name}: Complexity ${complexity}\n`;
        }
        if (m.possibleBugs.length > 0) {
            report += '\n## Potential Issues\n';
            for (const bug of m.possibleBugs) {
                report += `- [${bug.severity}] At $${bug.address.toString(16)}: ${bug.description}\n`;
            }
        }
        return report;
    }
    /**
     * Enhance symbol generation with instruction context from reference data
     */
    enhanceSymbolWithInstructionContext(line, reference) {
        if (!line.operand)
            return;
        const { operand } = line;
        const { mnemonic, addressingMode } = reference;
        // Skip if symbol already exists
        if (this.symbols.has(operand))
            return;
        // Generate context-aware symbol names
        let symbolName = '';
        let symbolType = 'DATA';
        let confidence = 0.6;
        // Determine symbol characteristics based on instruction and addressing mode
        if (mnemonic === 'JSR' || mnemonic === 'JSL') {
            symbolName = `sub_${operand.toString(16).toUpperCase()}`;
            symbolType = 'FUNCTION';
            confidence = 0.9;
        }
        else if (mnemonic === 'JMP' || mnemonic === 'JML') {
            if (addressingMode.includes('Absolute') && !addressingMode.includes('Indirect')) {
                symbolName = `loc_${operand.toString(16).toUpperCase()}`;
                symbolType = 'CODE';
                confidence = 0.8;
            }
        }
        else if (mnemonic.startsWith('B') && mnemonic !== 'BIT') { // Branch instructions
            symbolName = `loc_${operand.toString(16).toUpperCase()}`;
            symbolType = 'CODE';
            confidence = 0.7;
        }
        else if (mnemonic.startsWith('LDA') || mnemonic.startsWith('STA')) {
            // Data access patterns
            if (operand >= 0x7E0000 && operand <= 0x7FFFFF) {
                symbolName = `ram_${operand.toString(16).toUpperCase()}`;
                symbolType = 'VARIABLE';
                confidence = 0.6;
            }
            else if (operand >= 0x2100 && operand <= 0x21FF) {
                // PPU registers - already handled by hardware register logic
                return;
            }
            else {
                symbolName = `data_${operand.toString(16).toUpperCase()}`;
                symbolType = 'DATA';
                confidence = 0.5;
            }
        }
        // Create enhanced symbol if we generated a meaningful name
        if (symbolName) {
            const symbol = {
                address: operand,
                name: symbolName,
                type: symbolType,
                references: this.crossReferences.get(operand) || [],
                confidence,
                description: `Generated from ${mnemonic} instruction context`
            };
            this.symbols.set(operand, symbol);
        }
    }
}
exports.AnalysisEngine = AnalysisEngine;
//# sourceMappingURL=analysis-engine.js.map