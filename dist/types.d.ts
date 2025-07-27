export interface CycleInfo {
    base: number;
    m16?: number;
    x16?: number;
    pageBoundary?: number;
    memoryAccess?: number;
}
export interface Instruction {
    opcode: number;
    mnemonic: string;
    addressingMode: AddressingMode;
    bytes: number;
    cycles: number | CycleInfo;
}
export declare enum AddressingMode {
    Implied = "imp",
    Accumulator = "A",
    Immediate = "#",
    ZeroPage = "zp",
    ZeroPageX = "zp,X",
    ZeroPageY = "zp,Y",
    Absolute = "abs",
    AbsoluteX = "abs,X",
    AbsoluteY = "abs,Y",
    AbsoluteLong = "long",
    AbsoluteLongX = "long,X",
    Direct = "dp",
    DirectX = "dp,X",
    DirectY = "dp,Y",
    DirectIndirect = "(dp)",
    DirectIndirectX = "(dp,X)",
    DirectIndirectY = "(dp),Y",
    DirectIndirectLongY = "[dp],Y",
    AbsoluteIndirect = "(abs)",
    AbsoluteIndirectLong = "[abs]",
    AbsoluteIndexedIndirect = "(abs,X)",
    Relative = "rel",
    RelativeLong = "rell",
    StackRelative = "sr,S",
    StackRelativeIndirectIndexed = "(sr,S),Y",
    BlockMove = "xyc"
}
export interface DisassemblyLine {
    address: number;
    bytes: number[];
    instruction: Instruction;
    operand?: number;
    label?: string;
    comment?: string;
}
export interface ProcessorFlags {
    n: boolean;
    v: boolean;
    m: boolean;
    x: boolean;
    d: boolean;
    i: boolean;
    z: boolean;
    c: boolean;
    emulation: boolean;
}
export interface TimingContext {
    flags: ProcessorFlags;
    fastROM: boolean;
    address: number;
    operandAddress?: number;
}
export interface DisassemblerOptions {
    startAddress?: number;
    endAddress?: number;
    labels?: Map<number, string>;
    comments?: Map<number, string>;
    timingContext?: TimingContext;
    enableValidation?: boolean;
    enhanceComments?: boolean;
}
//# sourceMappingURL=types.d.ts.map