export interface CycleInfo {
  base: number;
  m16?: number; // Additional cycles when M flag = 0 (16-bit accumulator)
  x16?: number; // Additional cycles when X flag = 0 (16-bit index)
  pageBoundary?: number; // Additional cycles when crossing page boundary
  memoryAccess?: number; // Additional cycles for memory access timing
}

export interface Instruction {
  opcode: number;
  mnemonic: string;
  addressingMode: AddressingMode;
  bytes: number;
  cycles: number | CycleInfo;
}

export enum AddressingMode {
  Implied = 'imp',
  Accumulator = 'A',
  Immediate = '#',
  ZeroPage = 'zp',
  ZeroPageX = 'zp,X',
  ZeroPageY = 'zp,Y',
  Absolute = 'abs',
  AbsoluteX = 'abs,X',
  AbsoluteY = 'abs,Y',
  AbsoluteLong = 'long',
  AbsoluteLongX = 'long,X',
  Direct = 'dp',
  DirectX = 'dp,X',
  DirectY = 'dp,Y',
  DirectIndirect = '(dp)',
  DirectIndirectX = '(dp,X)',
  DirectIndirectY = '(dp),Y',
  DirectIndirectLongY = '[dp],Y',
  AbsoluteIndirect = '(abs)',
  AbsoluteIndirectLong = '[abs]',
  AbsoluteIndexedIndirect = '(abs,X)',
  Relative = 'rel',
  RelativeLong = 'rell',
  StackRelative = 'sr,S',
  StackRelativeIndirectIndexed = '(sr,S),Y',
  BlockMove = 'xyc'
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
  n: boolean; // Negative flag (bit 7)
  v: boolean; // Overflow flag (bit 6)
  m: boolean; // Memory/Accumulator size flag (bit 5) (0 = 16-bit, 1 = 8-bit)
  x: boolean; // Index register size flag (bit 4) (0 = 16-bit, 1 = 8-bit)
  d: boolean; // Decimal mode flag (bit 3)
  i: boolean; // Interrupt disable flag (bit 2)
  z: boolean; // Zero flag (bit 1)
  c: boolean; // Carry flag (bit 0)
  emulation: boolean; // Emulation mode flag (separate from P register)
}

export interface TimingContext {
  flags: ProcessorFlags;
  fastROM: boolean; // FastROM vs SlowROM timing
  address: number; // Current instruction address
  operandAddress?: number; // Operand address for page boundary checks
}

export interface DisassemblerOptions {
  startAddress?: number;
  endAddress?: number;
  labels?: Map<number, string>;
  comments?: Map<number, string>;
  timingContext?: TimingContext;
}