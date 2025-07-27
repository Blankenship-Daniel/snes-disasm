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
    switchStatements?: Array<{
        address: number;
        type: string;
        description: string;
    }>;
    loops?: Array<{
        address: number;
        type: string;
        description: string;
    }>;
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
    description?: string;
}
export interface DataStructure {
    address: number;
    type: 'POINTER_TABLE' | 'JUMP_TABLE' | 'STRING_TABLE' | 'GRAPHICS_DATA' | 'MUSIC_DATA' | 'MAP_DATA' | 'SPRITE_DATA' | 'TILE_DATA' | 'LEVEL_DATA' | 'PALETTE_DATA';
    size: number;
    entries: number;
    description: string;
    confidence: number;
    format?: string;
}
export interface JumpTable {
    address: number;
    entries: number[];
    targets: number[];
    type: 'ABSOLUTE' | 'RELATIVE' | 'INDIRECT';
}
export interface PointerTable {
    address: number;
    pointers: number[];
    targets: number[];
    format: 'WORD' | 'LONG';
}
export interface SpriteDataInfo {
    address: number;
    hitboxes: {
        x: number;
        y: number;
        width: number;
        height: number;
    }[];
    animationFrames: number;
    tileReferences: number[];
}
export interface HardwareRegisterUsage {
    register: string;
    address: number;
    reads: number;
    writes: number;
    accessPoints: number[];
    description: string;
}
export declare class AnalysisEngine {
    private cfg;
    private symbols;
    private crossReferences;
    private dataStructures;
    private hardwareRegisters;
    private jumpTables;
    private pointerTables;
    private spriteData;
    private registerUsage;
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
     * Based on research from SNES MCP servers and binary analysis tools
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
    private estimateTableSize;
    private getCrossReferenceType;
    private generateFunctionName;
    private generateDataName;
    private formatOperand;
    /**
     * Initialize hardware register mappings from SNES MCP server documentation
     */
    private initializeHardwareRegisters;
    /**
     * Detect sprite data structures based on Zelda3 research patterns
     */
    private detectSpriteData;
    /**
     * Detect tile data patterns
     */
    private detectTileData;
    /**
     * Detect level/map data structures
     */
    private detectLevelData;
    /**
     * Detect palette data
     */
    private detectPaletteData;
    /**
     * Analyze hardware register usage patterns
     */
    private analyzeHardwareRegisterUsage;
    private isSpritePositionTable;
    private extractSpriteHitboxes;
    private countAnimationFrames;
    private extractTileReferences;
    private isTileData;
    private estimateTileCount;
    private isLevelData;
    private estimateMapSize;
    private isPaletteData;
    private estimateColorCount;
    private getRegisterDescription;
    private isWriteOperation;
    private extractPointers;
    private resolvePointerTargets;
    getControlFlowGraph(): ControlFlowGraph;
    getSymbols(): Map<number, SymbolInfo>;
    getCrossReferences(): Map<number, CrossReference[]>;
    getDataStructures(): Map<number, DataStructure>;
    getFunctions(): Map<number, FunctionInfo>;
    getJumpTables(): Map<number, JumpTable>;
    getPointerTables(): Map<number, PointerTable>;
    getSpriteData(): Map<number, SpriteDataInfo>;
    getHardwareRegisterUsage(): Map<number, HardwareRegisterUsage>;
    /**
     * Get comprehensive analysis summary
     */
    getAnalysisSummary(): {
        functions: number;
        basicBlocks: number;
        dataStructures: number;
        crossReferences: number;
        jumpTables: number;
        spriteStructures: number;
        registerUsage: number;
    };
    /**
     * Enhanced disassembly features - Apply intelligent analysis to improve output
     */
    getEnhancedDisassembly(lines: DisassemblyLine[]): DisassemblyLine[];
    private detectInlineData;
    private isInlineDataPattern;
    private identifyDataType;
    private generateBranchTargetLabels;
    private isBranchInstruction;
    private calculateBranchTarget;
    private generateLabelName;
    private addIntelligentComments;
    private generateIntelligentComment;
    private describeFlagOperation;
    private isHardwareRegister;
    private describeHardwareRegister;
    private isDMAOperation;
    private isGraphicsOperation;
    private describeGraphicsOperation;
    private isAudioOperation;
    private detectCompilerPatterns;
    private isFunctionPrologue;
    private isFunctionEpilogue;
    private isStackFrameSetup;
    private analyzeInterruptVectors;
    private markAsInterruptHandler;
    private documentHardwareRegisterUsageInCode;
    private getRegisterName;
    /**
     * Recursive descent analysis for complex control flow patterns
     */
    private performRecursiveDescentAnalysis;
    private analyzeComplexControlFlow;
    private getControlFlowTargets;
    private resolveIndirectJumpTargets;
    private extractJumpTarget;
    private isWithinFunction;
    private isTerminalInstruction;
    private detectComplexControlPattern;
    private isSwitchStatement;
    private isLoopConstruct;
    private isFunctionCall;
    private recordSwitchStatement;
    private recordLoopConstruct;
    private getLoopType;
    private recordFunctionCall;
    /**
     * Generate function call graph
     */
    generateFunctionCallGraph(): Map<number, {
        callers: number[];
        callees: number[];
    }>;
    /**
     * String and text detection based on Zelda3 patterns
     */
    private detectStringData;
    private isTextRenderingPattern;
    private extractTextAddress;
    private estimateStringLength;
    /**
     * Audio/music data recognition based on APU communication patterns
     */
    private detectAudioData;
    private isAPUCommunicationPattern;
    private extractAudioDataAddress;
    private estimateAudioDataSize;
    /**
     * Variable usage tracking and data flow analysis
     */
    private performDataFlowAnalysis;
    private isDataAccess;
    private isReadOperation;
    private inferDataType;
    private variableUsage;
    /**
     * Get variable usage tracking results
     */
    getVariableUsage(): Map<number, {
        reads: number[];
        writes: number[];
        type: string;
    }>;
    /**
     * Symbol dependency analysis
     */
    private performSymbolDependencyAnalysis;
    private symbolDependencies;
    /**
     * Get symbol dependency analysis results
     */
    getSymbolDependencies(): Map<number, Set<number>>;
    /**
     * Detect macro patterns and inline functions in the code
     */
    private detectMacrosAndInlineFunctions;
    private matchesMacroPattern;
    private detectInlineFunctions;
    /**
     * Detect game-specific patterns based on common SNES game engines
     */
    private detectGameSpecificPatterns;
    private lineMatchesPattern;
    private applyEngineSpecificPatterns;
    private detectNintendoPatterns;
    private detectSquareRPGPatterns;
    private detectCapcomPatterns;
    private detectKonamiPatterns;
    private detectGameStructures;
    /**
     * Calculate and store code quality metrics
     */
    private calculateCodeQualityMetrics;
    private calculateCyclomaticComplexity;
    private detectPotentialBugs;
    private codeMetrics?;
    /**
     * Get code quality metrics
     */
    getCodeQualityMetrics(): CodeQualityMetrics | undefined;
    /**
     * Generate code quality report
     */
    generateQualityReport(): string;
    /**
     * Enhance symbol generation with instruction context from reference data
     */
    private enhanceSymbolWithInstructionContext;
}
export interface CodeQualityMetrics {
    totalInstructions: number;
    codeBytes: number;
    dataBytes: number;
    functionCount: number;
    averageFunctionSize: number;
    cyclomaticComplexity: Map<number, number>;
    unreachableCode: number;
    commentedLines: number;
    labeledLines: number;
    hardwareRegisterAccesses: number;
    subroutineCalls: number;
    indirectJumps: number;
    selfModifyingCodeSuspects: number;
    interruptHandlers: number;
    possibleBugs: Array<{
        address: number;
        type: string;
        description: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
}
//# sourceMappingURL=analysis-engine.d.ts.map