/**
 * Advanced Analysis Engine for SNES Disassembler
 * Based on research from SNES MCP servers, modern binary analysis tools, and ML approaches
 */
import { DisassemblyLine } from './types';
import { CartridgeInfo } from './cartridge-types';
export interface BasicBlock {
    id: string;
    startAddress: number;
    endAddress: number;
    instructions: DisassemblyLine[];
    predecessors: Set<string>;
    successors: Set<string>;
    isFunction: boolean;
    isFunctionEnd: boolean;
}
export interface ControlFlowGraph {
    blocks: Map<string, BasicBlock>;
    entryPoints: Set<string>;
    functions: Map<number, FunctionInfo>;
}
export interface FunctionInfo {
    startAddress: number;
    endAddress?: number;
    name?: string;
    callers: Set<number>;
    callees: Set<number>;
    basicBlocks: Set<string>;
    isInterrupt: boolean;
    confidence: number;
}
export interface CrossReference {
    address: number;
    type: 'READ' | 'WRITE' | 'EXECUTE' | 'JUMP' | 'CALL';
    fromAddress: number;
    instruction?: string;
}
export interface SymbolInfo {
    address: number;
    name: string;
    type: 'CODE' | 'DATA' | 'FUNCTION' | 'VARIABLE' | 'CONSTANT';
    size?: number;
    references: CrossReference[];
    confidence: number;
}
export interface DataStructure {
    address: number;
    type: 'POINTER_TABLE' | 'JUMP_TABLE' | 'STRING_TABLE' | 'GRAPHICS_DATA' | 'MUSIC_DATA' | 'MAP_DATA';
    size: number;
    entries: number;
    description: string;
}
export declare class AnalysisEngine {
    private cfg;
    private symbols;
    private crossReferences;
    private dataStructures;
    private hardwareRegisters;
    constructor();
    /**
     * Perform comprehensive analysis on disassembled code
     */
    analyze(lines: DisassemblyLine[], cartridgeInfo: CartridgeInfo, vectorAddresses?: number[]): void;
    /**
     * Detect basic blocks using control flow analysis
     * Based on research from SMDA and other modern disassemblers
     */
    private detectBasicBlocks;
    /**
     * Build control flow graph from basic blocks
     */
    private buildControlFlowGraph;
    /**
     * Detect function boundaries using multiple heuristics
     * Based on Zelda3 analysis patterns and modern techniques
     */
    private detectFunctions;
    /**
     * Analyze data structures and patterns
     * Based on research from binary analysis tools
     */
    private analyzeDataStructures;
    /**
     * Build comprehensive cross-reference database
     */
    private buildCrossReferences;
    /**
     * Generate smart labels based on usage patterns
     */
    private generateSymbols;
    /**
     * Analyze hardware register usage patterns
     * Based on SNES MCP server register documentation
     */
    private analyzeHardwareRegisterUsage;
    private isControlFlowInstruction;
    private isBranchOrJump;
    private isConditionalBranch;
    private isFunctionEnd;
    private isLikelyFunctionStart;
    private isEntryPoint;
    private isJumpTarget;
    private addControlFlowEdges;
    private addSequentialEdge;
    private findBlockByAddress;
    private detectVectorFunctions;
    private detectJSRTargets;
    private detectProloguePatterns;
    private matchesPattern;
    private detectDeadCodeBoundaries;
    private detectPointerTables;
    private isPointerTablePattern;
    private detectJumpTables;
    private detectGraphicsData;
    private detectMusicData;
    private detectStringData;
    private estimateTableSize;
    private getCrossReferenceType;
    private isReadOperation;
    private isWriteOperation;
    private generateFunctionName;
    private generateDataName;
    private formatOperand;
    /**
     * Initialize hardware register mappings from SNES MCP server documentation
     */
    private initializeHardwareRegisters;
    getControlFlowGraph(): ControlFlowGraph;
    getSymbols(): Map<number, SymbolInfo>;
    getCrossReferences(): Map<number, CrossReference[]>;
    getDataStructures(): Map<number, DataStructure>;
    getFunctions(): Map<number, FunctionInfo>;
}
//# sourceMappingURL=analysis-engine.d.ts.map