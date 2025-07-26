import { DisassemblyLine, ProcessorFlags } from './types';
export declare class InstructionDecoder {
    private flags;
    private get mFlag();
    private get xFlag();
    setFlags(m: boolean, x: boolean): void;
    getFlags(): ProcessorFlags;
    setProcessorFlags(flags: ProcessorFlags): void;
    decode(data: Buffer, offset: number, address: number): DisassemblyLine | null;
    formatOperand(line: DisassemblyLine): string;
}
//# sourceMappingURL=decoder.d.ts.map