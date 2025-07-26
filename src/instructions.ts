import { Instruction, AddressingMode } from './types';
import { createCycleInfo } from './timing';

export const INSTRUCTION_SET: Map<number, Instruction> = new Map([
  // ADC - Add with Carry
  [0x69, { opcode: 0x69, mnemonic: 'ADC', addressingMode: AddressingMode.Immediate, bytes: 2, cycles: createCycleInfo(2, { m16: 1 }) }],
  [0x65, { opcode: 0x65, mnemonic: 'ADC', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 3 }],
  [0x75, { opcode: 0x75, mnemonic: 'ADC', addressingMode: AddressingMode.ZeroPageX, bytes: 2, cycles: 4 }],
  [0x6D, { opcode: 0x6D, mnemonic: 'ADC', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 4 }],
  [0x7D, { opcode: 0x7D, mnemonic: 'ADC', addressingMode: AddressingMode.AbsoluteX, bytes: 3, cycles: createCycleInfo(4, { m16: 1, pageBoundary: 1 }) }],
  [0x79, { opcode: 0x79, mnemonic: 'ADC', addressingMode: AddressingMode.AbsoluteY, bytes: 3, cycles: createCycleInfo(4, { m16: 1, pageBoundary: 1 }) }],
  [0x6F, { opcode: 0x6F, mnemonic: 'ADC', addressingMode: AddressingMode.AbsoluteLong, bytes: 4, cycles: 5 }],
  [0x7F, { opcode: 0x7F, mnemonic: 'ADC', addressingMode: AddressingMode.AbsoluteLongX, bytes: 4, cycles: 5 }],
  [0x61, { opcode: 0x61, mnemonic: 'ADC', addressingMode: AddressingMode.DirectIndirectX, bytes: 2, cycles: 6 }],
  [0x71, { opcode: 0x71, mnemonic: 'ADC', addressingMode: AddressingMode.DirectIndirectY, bytes: 2, cycles: 5 }],
  [0x67, { opcode: 0x67, mnemonic: 'ADC', addressingMode: AddressingMode.DirectIndirectLongY, bytes: 2, cycles: 6 }],
  [0x72, { opcode: 0x72, mnemonic: 'ADC', addressingMode: AddressingMode.DirectIndirect, bytes: 2, cycles: 5 }],
  [0x63, { opcode: 0x63, mnemonic: 'ADC', addressingMode: AddressingMode.StackRelative, bytes: 2, cycles: 4 }],
  [0x73, { opcode: 0x73, mnemonic: 'ADC', addressingMode: AddressingMode.StackRelativeIndirectIndexed, bytes: 2, cycles: 7 }],

  // AND - Logical AND
  [0x29, { opcode: 0x29, mnemonic: 'AND', addressingMode: AddressingMode.Immediate, bytes: 2, cycles: 2 }],
  [0x25, { opcode: 0x25, mnemonic: 'AND', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 3 }],
  [0x35, { opcode: 0x35, mnemonic: 'AND', addressingMode: AddressingMode.ZeroPageX, bytes: 2, cycles: 4 }],
  [0x2D, { opcode: 0x2D, mnemonic: 'AND', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 4 }],
  [0x3D, { opcode: 0x3D, mnemonic: 'AND', addressingMode: AddressingMode.AbsoluteX, bytes: 3, cycles: 4 }],
  [0x39, { opcode: 0x39, mnemonic: 'AND', addressingMode: AddressingMode.AbsoluteY, bytes: 3, cycles: 4 }],
  [0x2F, { opcode: 0x2F, mnemonic: 'AND', addressingMode: AddressingMode.AbsoluteLong, bytes: 4, cycles: 5 }],
  [0x3F, { opcode: 0x3F, mnemonic: 'AND', addressingMode: AddressingMode.AbsoluteLongX, bytes: 4, cycles: 5 }],
  [0x21, { opcode: 0x21, mnemonic: 'AND', addressingMode: AddressingMode.DirectIndirectX, bytes: 2, cycles: 6 }],
  [0x31, { opcode: 0x31, mnemonic: 'AND', addressingMode: AddressingMode.DirectIndirectY, bytes: 2, cycles: 5 }],
  [0x27, { opcode: 0x27, mnemonic: 'AND', addressingMode: AddressingMode.DirectIndirectLongY, bytes: 2, cycles: 6 }],
  [0x32, { opcode: 0x32, mnemonic: 'AND', addressingMode: AddressingMode.DirectIndirect, bytes: 2, cycles: 5 }],
  [0x23, { opcode: 0x23, mnemonic: 'AND', addressingMode: AddressingMode.StackRelative, bytes: 2, cycles: 4 }],
  [0x33, { opcode: 0x33, mnemonic: 'AND', addressingMode: AddressingMode.StackRelativeIndirectIndexed, bytes: 2, cycles: 7 }],

  // ASL - Arithmetic Shift Left
  [0x0A, { opcode: 0x0A, mnemonic: 'ASL', addressingMode: AddressingMode.Accumulator, bytes: 1, cycles: 2 }],
  [0x06, { opcode: 0x06, mnemonic: 'ASL', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 5 }],
  [0x16, { opcode: 0x16, mnemonic: 'ASL', addressingMode: AddressingMode.ZeroPageX, bytes: 2, cycles: 6 }],
  [0x0E, { opcode: 0x0E, mnemonic: 'ASL', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 6 }],
  [0x1E, { opcode: 0x1E, mnemonic: 'ASL', addressingMode: AddressingMode.AbsoluteX, bytes: 3, cycles: 7 }],

  // BCC - Branch if Carry Clear
  [0x90, { opcode: 0x90, mnemonic: 'BCC', addressingMode: AddressingMode.Relative, bytes: 2, cycles: 2 }],

  // BCS - Branch if Carry Set
  [0xB0, { opcode: 0xB0, mnemonic: 'BCS', addressingMode: AddressingMode.Relative, bytes: 2, cycles: 2 }],

  // BEQ - Branch if Equal
  [0xF0, { opcode: 0xF0, mnemonic: 'BEQ', addressingMode: AddressingMode.Relative, bytes: 2, cycles: 2 }],

  // BIT - Test Bits
  [0x24, { opcode: 0x24, mnemonic: 'BIT', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 3 }],
  [0x2C, { opcode: 0x2C, mnemonic: 'BIT', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 4 }],
  [0x34, { opcode: 0x34, mnemonic: 'BIT', addressingMode: AddressingMode.ZeroPageX, bytes: 2, cycles: 4 }],
  [0x3C, { opcode: 0x3C, mnemonic: 'BIT', addressingMode: AddressingMode.AbsoluteX, bytes: 3, cycles: 4 }],
  [0x89, { opcode: 0x89, mnemonic: 'BIT', addressingMode: AddressingMode.Immediate, bytes: 2, cycles: 2 }],

  // BMI - Branch if Minus
  [0x30, { opcode: 0x30, mnemonic: 'BMI', addressingMode: AddressingMode.Relative, bytes: 2, cycles: 2 }],

  // BNE - Branch if Not Equal
  [0xD0, { opcode: 0xD0, mnemonic: 'BNE', addressingMode: AddressingMode.Relative, bytes: 2, cycles: 2 }],

  // BPL - Branch if Plus
  [0x10, { opcode: 0x10, mnemonic: 'BPL', addressingMode: AddressingMode.Relative, bytes: 2, cycles: 2 }],

  // BRA - Branch Always
  [0x80, { opcode: 0x80, mnemonic: 'BRA', addressingMode: AddressingMode.Relative, bytes: 2, cycles: 3 }],

  // BRK - Force Interrupt
  [0x00, { opcode: 0x00, mnemonic: 'BRK', addressingMode: AddressingMode.Implied, bytes: 2, cycles: 7 }],

  // BRL - Branch Long
  [0x82, { opcode: 0x82, mnemonic: 'BRL', addressingMode: AddressingMode.RelativeLong, bytes: 3, cycles: 4 }],

  // COP - Coprocessor Enable
  [0x02, { opcode: 0x02, mnemonic: 'COP', addressingMode: AddressingMode.Implied, bytes: 2, cycles: 7 }],

  // BVC - Branch if Overflow Clear
  [0x50, { opcode: 0x50, mnemonic: 'BVC', addressingMode: AddressingMode.Relative, bytes: 2, cycles: 2 }],

  // BVS - Branch if Overflow Set
  [0x70, { opcode: 0x70, mnemonic: 'BVS', addressingMode: AddressingMode.Relative, bytes: 2, cycles: 2 }],

  // CLC - Clear Carry Flag
  [0x18, { opcode: 0x18, mnemonic: 'CLC', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // CLD - Clear Decimal Flag
  [0xD8, { opcode: 0xD8, mnemonic: 'CLD', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // CLI - Clear Interrupt Flag
  [0x58, { opcode: 0x58, mnemonic: 'CLI', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // CLV - Clear Overflow Flag
  [0xB8, { opcode: 0xB8, mnemonic: 'CLV', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // CMP - Compare Accumulator
  [0xC9, { opcode: 0xC9, mnemonic: 'CMP', addressingMode: AddressingMode.Immediate, bytes: 2, cycles: 2 }],
  [0xC5, { opcode: 0xC5, mnemonic: 'CMP', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 3 }],
  [0xD5, { opcode: 0xD5, mnemonic: 'CMP', addressingMode: AddressingMode.ZeroPageX, bytes: 2, cycles: 4 }],
  [0xCD, { opcode: 0xCD, mnemonic: 'CMP', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 4 }],
  [0xDD, { opcode: 0xDD, mnemonic: 'CMP', addressingMode: AddressingMode.AbsoluteX, bytes: 3, cycles: 4 }],
  [0xD9, { opcode: 0xD9, mnemonic: 'CMP', addressingMode: AddressingMode.AbsoluteY, bytes: 3, cycles: 4 }],
  [0xCF, { opcode: 0xCF, mnemonic: 'CMP', addressingMode: AddressingMode.AbsoluteLong, bytes: 4, cycles: 5 }],
  [0xDF, { opcode: 0xDF, mnemonic: 'CMP', addressingMode: AddressingMode.AbsoluteLongX, bytes: 4, cycles: 5 }],
  [0xC1, { opcode: 0xC1, mnemonic: 'CMP', addressingMode: AddressingMode.DirectIndirectX, bytes: 2, cycles: 6 }],
  [0xD1, { opcode: 0xD1, mnemonic: 'CMP', addressingMode: AddressingMode.DirectIndirectY, bytes: 2, cycles: 5 }],
  [0xC7, { opcode: 0xC7, mnemonic: 'CMP', addressingMode: AddressingMode.DirectIndirectLongY, bytes: 2, cycles: 6 }],
  [0xD2, { opcode: 0xD2, mnemonic: 'CMP', addressingMode: AddressingMode.DirectIndirect, bytes: 2, cycles: 5 }],
  [0xC3, { opcode: 0xC3, mnemonic: 'CMP', addressingMode: AddressingMode.StackRelative, bytes: 2, cycles: 4 }],
  [0xD3, { opcode: 0xD3, mnemonic: 'CMP', addressingMode: AddressingMode.StackRelativeIndirectIndexed, bytes: 2, cycles: 7 }],

  // CPX - Compare X Register
  [0xE0, { opcode: 0xE0, mnemonic: 'CPX', addressingMode: AddressingMode.Immediate, bytes: 2, cycles: 2 }],
  [0xE4, { opcode: 0xE4, mnemonic: 'CPX', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 3 }],
  [0xEC, { opcode: 0xEC, mnemonic: 'CPX', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 4 }],

  // CPY - Compare Y Register
  [0xC0, { opcode: 0xC0, mnemonic: 'CPY', addressingMode: AddressingMode.Immediate, bytes: 2, cycles: 2 }],
  [0xC4, { opcode: 0xC4, mnemonic: 'CPY', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 3 }],
  [0xCC, { opcode: 0xCC, mnemonic: 'CPY', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 4 }],

  // DEC - Decrement Memory
  [0x3A, { opcode: 0x3A, mnemonic: 'DEC', addressingMode: AddressingMode.Accumulator, bytes: 1, cycles: 2 }],
  [0xC6, { opcode: 0xC6, mnemonic: 'DEC', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 5 }],
  [0xD6, { opcode: 0xD6, mnemonic: 'DEC', addressingMode: AddressingMode.ZeroPageX, bytes: 2, cycles: 6 }],
  [0xCE, { opcode: 0xCE, mnemonic: 'DEC', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 6 }],
  [0xDE, { opcode: 0xDE, mnemonic: 'DEC', addressingMode: AddressingMode.AbsoluteX, bytes: 3, cycles: 7 }],

  // DEX - Decrement X Register
  [0xCA, { opcode: 0xCA, mnemonic: 'DEX', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // DEY - Decrement Y Register
  [0x88, { opcode: 0x88, mnemonic: 'DEY', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // EOR - Exclusive OR
  [0x49, { opcode: 0x49, mnemonic: 'EOR', addressingMode: AddressingMode.Immediate, bytes: 2, cycles: 2 }],
  [0x45, { opcode: 0x45, mnemonic: 'EOR', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 3 }],
  [0x55, { opcode: 0x55, mnemonic: 'EOR', addressingMode: AddressingMode.ZeroPageX, bytes: 2, cycles: 4 }],
  [0x4D, { opcode: 0x4D, mnemonic: 'EOR', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 4 }],
  [0x5D, { opcode: 0x5D, mnemonic: 'EOR', addressingMode: AddressingMode.AbsoluteX, bytes: 3, cycles: 4 }],
  [0x59, { opcode: 0x59, mnemonic: 'EOR', addressingMode: AddressingMode.AbsoluteY, bytes: 3, cycles: 4 }],
  [0x4F, { opcode: 0x4F, mnemonic: 'EOR', addressingMode: AddressingMode.AbsoluteLong, bytes: 4, cycles: 5 }],
  [0x5F, { opcode: 0x5F, mnemonic: 'EOR', addressingMode: AddressingMode.AbsoluteLongX, bytes: 4, cycles: 5 }],
  [0x41, { opcode: 0x41, mnemonic: 'EOR', addressingMode: AddressingMode.DirectIndirectX, bytes: 2, cycles: 6 }],
  [0x51, { opcode: 0x51, mnemonic: 'EOR', addressingMode: AddressingMode.DirectIndirectY, bytes: 2, cycles: 5 }],
  [0x47, { opcode: 0x47, mnemonic: 'EOR', addressingMode: AddressingMode.DirectIndirectLongY, bytes: 2, cycles: 6 }],
  [0x52, { opcode: 0x52, mnemonic: 'EOR', addressingMode: AddressingMode.DirectIndirect, bytes: 2, cycles: 5 }],
  [0x43, { opcode: 0x43, mnemonic: 'EOR', addressingMode: AddressingMode.StackRelative, bytes: 2, cycles: 4 }],
  [0x53, { opcode: 0x53, mnemonic: 'EOR', addressingMode: AddressingMode.StackRelativeIndirectIndexed, bytes: 2, cycles: 7 }],

  // INC - Increment Memory
  [0x1A, { opcode: 0x1A, mnemonic: 'INC', addressingMode: AddressingMode.Accumulator, bytes: 1, cycles: 2 }],
  [0xE6, { opcode: 0xE6, mnemonic: 'INC', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 5 }],
  [0xF6, { opcode: 0xF6, mnemonic: 'INC', addressingMode: AddressingMode.ZeroPageX, bytes: 2, cycles: 6 }],
  [0xEE, { opcode: 0xEE, mnemonic: 'INC', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 6 }],
  [0xFE, { opcode: 0xFE, mnemonic: 'INC', addressingMode: AddressingMode.AbsoluteX, bytes: 3, cycles: 7 }],

  // INX - Increment X Register
  [0xE8, { opcode: 0xE8, mnemonic: 'INX', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // INY - Increment Y Register
  [0xC8, { opcode: 0xC8, mnemonic: 'INY', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // JMP - Jump
  [0x4C, { opcode: 0x4C, mnemonic: 'JMP', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 3 }],
  [0x6C, { opcode: 0x6C, mnemonic: 'JMP', addressingMode: AddressingMode.AbsoluteIndirect, bytes: 3, cycles: 5 }],
  [0x7C, { opcode: 0x7C, mnemonic: 'JMP', addressingMode: AddressingMode.AbsoluteIndexedIndirect, bytes: 3, cycles: 6 }],
  [0x5C, { opcode: 0x5C, mnemonic: 'JMP', addressingMode: AddressingMode.AbsoluteLong, bytes: 4, cycles: 4 }],
  [0xDC, { opcode: 0xDC, mnemonic: 'JMP', addressingMode: AddressingMode.AbsoluteIndirectLong, bytes: 3, cycles: 6 }],

  // JSR - Jump to Subroutine
  [0x20, { opcode: 0x20, mnemonic: 'JSR', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 6 }],
  [0x22, { opcode: 0x22, mnemonic: 'JSR', addressingMode: AddressingMode.AbsoluteLong, bytes: 4, cycles: 8 }],
  [0xFC, { opcode: 0xFC, mnemonic: 'JSR', addressingMode: AddressingMode.AbsoluteIndexedIndirect, bytes: 3, cycles: 8 }],

  // LDA - Load Accumulator
  [0xA9, { opcode: 0xA9, mnemonic: 'LDA', addressingMode: AddressingMode.Immediate, bytes: 2, cycles: createCycleInfo(2, { m16: 1 }) }],
  [0xA5, { opcode: 0xA5, mnemonic: 'LDA', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 3 }],
  [0xB5, { opcode: 0xB5, mnemonic: 'LDA', addressingMode: AddressingMode.ZeroPageX, bytes: 2, cycles: 4 }],
  [0xAD, { opcode: 0xAD, mnemonic: 'LDA', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 4 }],
  [0xBD, { opcode: 0xBD, mnemonic: 'LDA', addressingMode: AddressingMode.AbsoluteX, bytes: 3, cycles: createCycleInfo(4, { m16: 1, pageBoundary: 1 }) }],
  [0xB9, { opcode: 0xB9, mnemonic: 'LDA', addressingMode: AddressingMode.AbsoluteY, bytes: 3, cycles: createCycleInfo(4, { m16: 1, pageBoundary: 1 }) }],
  [0xAF, { opcode: 0xAF, mnemonic: 'LDA', addressingMode: AddressingMode.AbsoluteLong, bytes: 4, cycles: 5 }],
  [0xBF, { opcode: 0xBF, mnemonic: 'LDA', addressingMode: AddressingMode.AbsoluteLongX, bytes: 4, cycles: 5 }],
  [0xA1, { opcode: 0xA1, mnemonic: 'LDA', addressingMode: AddressingMode.DirectIndirectX, bytes: 2, cycles: 6 }],
  [0xB1, { opcode: 0xB1, mnemonic: 'LDA', addressingMode: AddressingMode.DirectIndirectY, bytes: 2, cycles: 5 }],
  [0xA3, { opcode: 0xA3, mnemonic: 'LDA', addressingMode: AddressingMode.StackRelative, bytes: 2, cycles: 4 }],
  [0xB3, { opcode: 0xB3, mnemonic: 'LDA', addressingMode: AddressingMode.StackRelativeIndirectIndexed, bytes: 2, cycles: 7 }],

  // LDX - Load X Register
  [0xA2, { opcode: 0xA2, mnemonic: 'LDX', addressingMode: AddressingMode.Immediate, bytes: 2, cycles: createCycleInfo(2, { x16: 1 }) }],
  [0xA6, { opcode: 0xA6, mnemonic: 'LDX', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 3 }],
  [0xB6, { opcode: 0xB6, mnemonic: 'LDX', addressingMode: AddressingMode.ZeroPageY, bytes: 2, cycles: 4 }],
  [0xAE, { opcode: 0xAE, mnemonic: 'LDX', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 4 }],
  [0xBE, { opcode: 0xBE, mnemonic: 'LDX', addressingMode: AddressingMode.AbsoluteY, bytes: 3, cycles: 4 }],

  // LDY - Load Y Register
  [0xA0, { opcode: 0xA0, mnemonic: 'LDY', addressingMode: AddressingMode.Immediate, bytes: 2, cycles: createCycleInfo(2, { x16: 1 }) }],
  [0xA4, { opcode: 0xA4, mnemonic: 'LDY', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 3 }],
  [0xB4, { opcode: 0xB4, mnemonic: 'LDY', addressingMode: AddressingMode.ZeroPageX, bytes: 2, cycles: 4 }],
  [0xAC, { opcode: 0xAC, mnemonic: 'LDY', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 4 }],
  [0xBC, { opcode: 0xBC, mnemonic: 'LDY', addressingMode: AddressingMode.AbsoluteX, bytes: 3, cycles: 4 }],

  // LSR - Logical Shift Right
  [0x4A, { opcode: 0x4A, mnemonic: 'LSR', addressingMode: AddressingMode.Accumulator, bytes: 1, cycles: 2 }],
  [0x46, { opcode: 0x46, mnemonic: 'LSR', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 5 }],
  [0x56, { opcode: 0x56, mnemonic: 'LSR', addressingMode: AddressingMode.ZeroPageX, bytes: 2, cycles: 6 }],
  [0x4E, { opcode: 0x4E, mnemonic: 'LSR', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 6 }],
  [0x5E, { opcode: 0x5E, mnemonic: 'LSR', addressingMode: AddressingMode.AbsoluteX, bytes: 3, cycles: 7 }],

  // MVN - Block Move Negative
  [0x54, { opcode: 0x54, mnemonic: 'MVN', addressingMode: AddressingMode.BlockMove, bytes: 3, cycles: 7 }],

  // MVP - Block Move Positive
  [0x44, { opcode: 0x44, mnemonic: 'MVP', addressingMode: AddressingMode.BlockMove, bytes: 3, cycles: 7 }],

  // NOP - No Operation
  [0xEA, { opcode: 0xEA, mnemonic: 'NOP', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // ORA - Logical OR
  [0x09, { opcode: 0x09, mnemonic: 'ORA', addressingMode: AddressingMode.Immediate, bytes: 2, cycles: 2 }],
  [0x05, { opcode: 0x05, mnemonic: 'ORA', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 3 }],
  [0x15, { opcode: 0x15, mnemonic: 'ORA', addressingMode: AddressingMode.ZeroPageX, bytes: 2, cycles: 4 }],
  [0x0D, { opcode: 0x0D, mnemonic: 'ORA', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 4 }],
  [0x1D, { opcode: 0x1D, mnemonic: 'ORA', addressingMode: AddressingMode.AbsoluteX, bytes: 3, cycles: 4 }],
  [0x19, { opcode: 0x19, mnemonic: 'ORA', addressingMode: AddressingMode.AbsoluteY, bytes: 3, cycles: 4 }],
  [0x0F, { opcode: 0x0F, mnemonic: 'ORA', addressingMode: AddressingMode.AbsoluteLong, bytes: 4, cycles: 5 }],
  [0x1F, { opcode: 0x1F, mnemonic: 'ORA', addressingMode: AddressingMode.AbsoluteLongX, bytes: 4, cycles: 5 }],
  [0x01, { opcode: 0x01, mnemonic: 'ORA', addressingMode: AddressingMode.DirectIndirectX, bytes: 2, cycles: 6 }],
  [0x11, { opcode: 0x11, mnemonic: 'ORA', addressingMode: AddressingMode.DirectIndirectY, bytes: 2, cycles: 5 }],
  [0x07, { opcode: 0x07, mnemonic: 'ORA', addressingMode: AddressingMode.DirectIndirectLongY, bytes: 2, cycles: 6 }],
  [0x12, { opcode: 0x12, mnemonic: 'ORA', addressingMode: AddressingMode.DirectIndirect, bytes: 2, cycles: 5 }],
  [0x03, { opcode: 0x03, mnemonic: 'ORA', addressingMode: AddressingMode.StackRelative, bytes: 2, cycles: 4 }],
  [0x13, { opcode: 0x13, mnemonic: 'ORA', addressingMode: AddressingMode.StackRelativeIndirectIndexed, bytes: 2, cycles: 7 }],

  // PEA - Push Effective Absolute Address
  [0xF4, { opcode: 0xF4, mnemonic: 'PEA', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 5 }],

  // PEI - Push Effective Indirect Address
  [0xD4, { opcode: 0xD4, mnemonic: 'PEI', addressingMode: AddressingMode.DirectIndirect, bytes: 2, cycles: 6 }],

  // PER - Push Effective PC Relative Indirect Address
  [0x62, { opcode: 0x62, mnemonic: 'PER', addressingMode: AddressingMode.RelativeLong, bytes: 3, cycles: 6 }],

  // PHA - Push Accumulator
  [0x48, { opcode: 0x48, mnemonic: 'PHA', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 3 }],

  // PHB - Push Data Bank Register
  [0x8B, { opcode: 0x8B, mnemonic: 'PHB', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 3 }],

  // PHD - Push Direct Page Register
  [0x0B, { opcode: 0x0B, mnemonic: 'PHD', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 4 }],

  // PHK - Push Program Bank Register
  [0x4B, { opcode: 0x4B, mnemonic: 'PHK', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 3 }],

  // PHP - Push Processor Status
  [0x08, { opcode: 0x08, mnemonic: 'PHP', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 3 }],

  // PHX - Push X Register
  [0xDA, { opcode: 0xDA, mnemonic: 'PHX', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 3 }],

  // PHY - Push Y Register
  [0x5A, { opcode: 0x5A, mnemonic: 'PHY', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 3 }],

  // PLA - Pull Accumulator
  [0x68, { opcode: 0x68, mnemonic: 'PLA', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 4 }],

  // PLB - Pull Data Bank Register
  [0xAB, { opcode: 0xAB, mnemonic: 'PLB', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 4 }],

  // PLD - Pull Direct Page Register
  [0x2B, { opcode: 0x2B, mnemonic: 'PLD', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 5 }],

  // PLP - Pull Processor Status
  [0x28, { opcode: 0x28, mnemonic: 'PLP', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 4 }],

  // PLX - Pull X Register
  [0xFA, { opcode: 0xFA, mnemonic: 'PLX', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 4 }],

  // PLY - Pull Y Register
  [0x7A, { opcode: 0x7A, mnemonic: 'PLY', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 4 }],

  // REP - Reset Processor Status Bits
  [0xC2, { opcode: 0xC2, mnemonic: 'REP', addressingMode: AddressingMode.Immediate, bytes: 2, cycles: 3 }],

  // ROL - Rotate Left
  [0x2A, { opcode: 0x2A, mnemonic: 'ROL', addressingMode: AddressingMode.Accumulator, bytes: 1, cycles: 2 }],
  [0x26, { opcode: 0x26, mnemonic: 'ROL', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 5 }],
  [0x36, { opcode: 0x36, mnemonic: 'ROL', addressingMode: AddressingMode.ZeroPageX, bytes: 2, cycles: 6 }],
  [0x2E, { opcode: 0x2E, mnemonic: 'ROL', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 6 }],
  [0x3E, { opcode: 0x3E, mnemonic: 'ROL', addressingMode: AddressingMode.AbsoluteX, bytes: 3, cycles: 7 }],

  // ROR - Rotate Right
  [0x6A, { opcode: 0x6A, mnemonic: 'ROR', addressingMode: AddressingMode.Accumulator, bytes: 1, cycles: 2 }],
  [0x66, { opcode: 0x66, mnemonic: 'ROR', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 5 }],
  [0x76, { opcode: 0x76, mnemonic: 'ROR', addressingMode: AddressingMode.ZeroPageX, bytes: 2, cycles: 6 }],
  [0x6E, { opcode: 0x6E, mnemonic: 'ROR', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 6 }],
  [0x7E, { opcode: 0x7E, mnemonic: 'ROR', addressingMode: AddressingMode.AbsoluteX, bytes: 3, cycles: 7 }],

  // RTI - Return from Interrupt
  [0x40, { opcode: 0x40, mnemonic: 'RTI', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 6 }],

  // RTL - Return from Subroutine Long
  [0x6B, { opcode: 0x6B, mnemonic: 'RTL', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 6 }],

  // RTS - Return from Subroutine
  [0x60, { opcode: 0x60, mnemonic: 'RTS', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 6 }],

  // SBC - Subtract with Carry
  [0xE9, { opcode: 0xE9, mnemonic: 'SBC', addressingMode: AddressingMode.Immediate, bytes: 2, cycles: 2 }],
  [0xE5, { opcode: 0xE5, mnemonic: 'SBC', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 3 }],
  [0xF5, { opcode: 0xF5, mnemonic: 'SBC', addressingMode: AddressingMode.ZeroPageX, bytes: 2, cycles: 4 }],
  [0xED, { opcode: 0xED, mnemonic: 'SBC', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 4 }],
  [0xFD, { opcode: 0xFD, mnemonic: 'SBC', addressingMode: AddressingMode.AbsoluteX, bytes: 3, cycles: 4 }],
  [0xF9, { opcode: 0xF9, mnemonic: 'SBC', addressingMode: AddressingMode.AbsoluteY, bytes: 3, cycles: 4 }],
  [0xEF, { opcode: 0xEF, mnemonic: 'SBC', addressingMode: AddressingMode.AbsoluteLong, bytes: 4, cycles: 5 }],
  [0xFF, { opcode: 0xFF, mnemonic: 'SBC', addressingMode: AddressingMode.AbsoluteLongX, bytes: 4, cycles: 5 }],
  [0xE1, { opcode: 0xE1, mnemonic: 'SBC', addressingMode: AddressingMode.DirectIndirectX, bytes: 2, cycles: 6 }],
  [0xF1, { opcode: 0xF1, mnemonic: 'SBC', addressingMode: AddressingMode.DirectIndirectY, bytes: 2, cycles: 5 }],
  [0xE7, { opcode: 0xE7, mnemonic: 'SBC', addressingMode: AddressingMode.DirectIndirectLongY, bytes: 2, cycles: 6 }],
  [0xF2, { opcode: 0xF2, mnemonic: 'SBC', addressingMode: AddressingMode.DirectIndirect, bytes: 2, cycles: 5 }],
  [0xE3, { opcode: 0xE3, mnemonic: 'SBC', addressingMode: AddressingMode.StackRelative, bytes: 2, cycles: 4 }],
  [0xF3, { opcode: 0xF3, mnemonic: 'SBC', addressingMode: AddressingMode.StackRelativeIndirectIndexed, bytes: 2, cycles: 7 }],

  // SEC - Set Carry Flag
  [0x38, { opcode: 0x38, mnemonic: 'SEC', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // SED - Set Decimal Flag
  [0xF8, { opcode: 0xF8, mnemonic: 'SED', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // SEI - Set Interrupt Flag
  [0x78, { opcode: 0x78, mnemonic: 'SEI', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // SEP - Set Processor Status Bits
  [0xE2, { opcode: 0xE2, mnemonic: 'SEP', addressingMode: AddressingMode.Immediate, bytes: 2, cycles: 3 }],

  // STA - Store Accumulator
  [0x85, { opcode: 0x85, mnemonic: 'STA', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 3 }],
  [0x95, { opcode: 0x95, mnemonic: 'STA', addressingMode: AddressingMode.ZeroPageX, bytes: 2, cycles: 4 }],
  [0x8D, { opcode: 0x8D, mnemonic: 'STA', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 4 }],
  [0x9D, { opcode: 0x9D, mnemonic: 'STA', addressingMode: AddressingMode.AbsoluteX, bytes: 3, cycles: 5 }],
  [0x99, { opcode: 0x99, mnemonic: 'STA', addressingMode: AddressingMode.AbsoluteY, bytes: 3, cycles: 5 }],
  [0x8F, { opcode: 0x8F, mnemonic: 'STA', addressingMode: AddressingMode.AbsoluteLong, bytes: 4, cycles: 5 }],
  [0x9F, { opcode: 0x9F, mnemonic: 'STA', addressingMode: AddressingMode.AbsoluteLongX, bytes: 4, cycles: 5 }],
  [0x81, { opcode: 0x81, mnemonic: 'STA', addressingMode: AddressingMode.DirectIndirectX, bytes: 2, cycles: 6 }],
  [0x91, { opcode: 0x91, mnemonic: 'STA', addressingMode: AddressingMode.DirectIndirectY, bytes: 2, cycles: 6 }],
  [0x83, { opcode: 0x83, mnemonic: 'STA', addressingMode: AddressingMode.StackRelative, bytes: 2, cycles: 4 }],
  [0x93, { opcode: 0x93, mnemonic: 'STA', addressingMode: AddressingMode.StackRelativeIndirectIndexed, bytes: 2, cycles: 7 }],

  // STP - Stop Processor
  [0xDB, { opcode: 0xDB, mnemonic: 'STP', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 3 }],

  // STX - Store X Register
  [0x86, { opcode: 0x86, mnemonic: 'STX', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 3 }],
  [0x96, { opcode: 0x96, mnemonic: 'STX', addressingMode: AddressingMode.ZeroPageY, bytes: 2, cycles: 4 }],
  [0x8E, { opcode: 0x8E, mnemonic: 'STX', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 4 }],

  // STY - Store Y Register
  [0x84, { opcode: 0x84, mnemonic: 'STY', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 3 }],
  [0x94, { opcode: 0x94, mnemonic: 'STY', addressingMode: AddressingMode.ZeroPageX, bytes: 2, cycles: 4 }],
  [0x8C, { opcode: 0x8C, mnemonic: 'STY', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 4 }],

  // STZ - Store Zero
  [0x64, { opcode: 0x64, mnemonic: 'STZ', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 3 }],
  [0x74, { opcode: 0x74, mnemonic: 'STZ', addressingMode: AddressingMode.ZeroPageX, bytes: 2, cycles: 4 }],
  [0x9C, { opcode: 0x9C, mnemonic: 'STZ', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 4 }],
  [0x9E, { opcode: 0x9E, mnemonic: 'STZ', addressingMode: AddressingMode.AbsoluteX, bytes: 3, cycles: 5 }],

  // TAX - Transfer Accumulator to X
  [0xAA, { opcode: 0xAA, mnemonic: 'TAX', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // TAY - Transfer Accumulator to Y
  [0xA8, { opcode: 0xA8, mnemonic: 'TAY', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // TCD - Transfer Accumulator to Direct Page
  [0x5B, { opcode: 0x5B, mnemonic: 'TCD', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // TCS - Transfer Accumulator to Stack Pointer
  [0x1B, { opcode: 0x1B, mnemonic: 'TCS', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // TDC - Transfer Direct Page to Accumulator
  [0x7B, { opcode: 0x7B, mnemonic: 'TDC', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // TRB - Test and Reset Bits
  [0x14, { opcode: 0x14, mnemonic: 'TRB', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 5 }],
  [0x1C, { opcode: 0x1C, mnemonic: 'TRB', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 6 }],

  // TSB - Test and Set Bits
  [0x04, { opcode: 0x04, mnemonic: 'TSB', addressingMode: AddressingMode.ZeroPage, bytes: 2, cycles: 5 }],
  [0x0C, { opcode: 0x0C, mnemonic: 'TSB', addressingMode: AddressingMode.Absolute, bytes: 3, cycles: 6 }],

  // TSC - Transfer Stack Pointer to Accumulator
  [0x3B, { opcode: 0x3B, mnemonic: 'TSC', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // TSX - Transfer Stack Pointer to X
  [0xBA, { opcode: 0xBA, mnemonic: 'TSX', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // TXA - Transfer X to Accumulator
  [0x8A, { opcode: 0x8A, mnemonic: 'TXA', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // TXS - Transfer X to Stack Pointer
  [0x9A, { opcode: 0x9A, mnemonic: 'TXS', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // TXY - Transfer X to Y
  [0x9B, { opcode: 0x9B, mnemonic: 'TXY', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // TYA - Transfer Y to Accumulator
  [0x98, { opcode: 0x98, mnemonic: 'TYA', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // TYX - Transfer Y to X
  [0xBB, { opcode: 0xBB, mnemonic: 'TYX', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],

  // WAI - Wait for Interrupt
  [0xCB, { opcode: 0xCB, mnemonic: 'WAI', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 3 }],

  // WDM - Reserved for Future Expansion
  [0x42, { opcode: 0x42, mnemonic: 'WDM', addressingMode: AddressingMode.Immediate, bytes: 2, cycles: 2 }],

  // XBA - Exchange B and A
  [0xEB, { opcode: 0xEB, mnemonic: 'XBA', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 3 }],

  // XCE - Exchange Carry and Emulation
  [0xFB, { opcode: 0xFB, mnemonic: 'XCE', addressingMode: AddressingMode.Implied, bytes: 1, cycles: 2 }],
]);