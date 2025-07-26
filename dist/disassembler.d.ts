import { DisassemblyLine, DisassemblerOptions } from './types';
import { SNESRom } from './rom-parser';
export declare class SNESDisassembler {
    private decoder;
    private rom;
    private labels;
    private comments;
    private analysisEngine;
    constructor(romPath: string, options?: DisassemblerOptions);
    getRomInfo(): SNESRom;
    disassemble(startAddress?: number, endAddress?: number): DisassemblyLine[];
    disassembleFunction(startAddress: number, maxInstructions?: number): DisassemblyLine[];
    formatOutput(lines: DisassemblyLine[]): string;
    formatOutputWithAnalysis(lines: DisassemblyLine[]): string;
    private formatOperandWithSymbols;
    addLabel(address: number, label: string): void;
    addComment(address: number, comment: string): void;
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
}
//# sourceMappingURL=disassembler.d.ts.map