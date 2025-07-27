/**
 * SNES Reference Tables - Authoritative lookup data from snes-mcp-server
 * 
 * This module provides comprehensive validation and reference data for:
 * - 65816 instruction set with opcodes, cycles, and flags
 * - SNES hardware registers with bit layouts and usage
 * - Memory mapping and addressing modes
 * 
 * Generated from snes-mcp-server for maximum accuracy
 */

// =====================================================================
// 65816 INSTRUCTION SET REFERENCE
// =====================================================================

export interface InstructionReference {
  mnemonic: string;
  opcode: number;
  addressingMode: string;
  bytes: number;
  cycles: number;
  flagsAffected?: string[];
  description: string;
  examples?: string[];
  notes?: string[];
}

export const INSTRUCTION_REFERENCE: Record<number, InstructionReference> = {
  // ===== LOAD/STORE INSTRUCTIONS =====
  
  // LDA - Load Accumulator
  0xA9: {
    mnemonic: 'LDA',
    opcode: 0xA9,
    addressingMode: 'Immediate',
    bytes: 2,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'Load Accumulator with Memory',
    examples: ['LDA #$12     ; Load A with value $12', 'LDA #$1234   ; Load A with 16-bit value $1234 (if A is 16-bit)']
  },
  
  0xA5: {
    mnemonic: 'LDA',
    opcode: 0xA5,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 3,
    flagsAffected: ['N', 'Z'],
    description: 'Load Accumulator with Memory',
    examples: ['LDA $10      ; Load A from direct page address $10', 'LDA $10,X    ; Load A from direct page address $10 + X']
  },
  
  0xAD: {
    mnemonic: 'LDA',
    opcode: 0xAD,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 4,
    flagsAffected: ['N', 'Z'],
    description: 'Load Accumulator with Memory'
  },
  
  0xBD: {
    mnemonic: 'LDA',
    opcode: 0xBD,
    addressingMode: 'Absolute,X',
    bytes: 3,
    cycles: 4, // +p for page boundary
    flagsAffected: ['N', 'Z'],
    description: 'Load Accumulator with Memory'
  },
  
  0xB9: {
    mnemonic: 'LDA',
    opcode: 0xB9,
    addressingMode: 'Absolute,Y',
    bytes: 3,
    cycles: 4, // +p for page boundary
    flagsAffected: ['N', 'Z'],
    description: 'Load Accumulator with Memory'
  },
  
  0xA1: {
    mnemonic: 'LDA',
    opcode: 0xA1,
    addressingMode: '(Direct Page,X)',
    bytes: 2,
    cycles: 6,
    flagsAffected: ['N', 'Z'],
    description: 'Load Accumulator with Memory'
  },
  
  0xB1: {
    mnemonic: 'LDA',
    opcode: 0xB1,
    addressingMode: '(Direct Page),Y',
    bytes: 2,
    cycles: 5, // +p for page boundary
    flagsAffected: ['N', 'Z'],
    description: 'Load Accumulator with Memory'
  },
  
  0xA3: {
    mnemonic: 'LDA',
    opcode: 0xA3,
    addressingMode: 'Stack Relative',
    bytes: 2,
    cycles: 4,
    flagsAffected: ['N', 'Z'],
    description: 'Load Accumulator Stack Relative'
  },
  
  0xB3: {
    mnemonic: 'LDA',
    opcode: 0xB3,
    addressingMode: '(Stack Relative),Y',
    bytes: 2,
    cycles: 7,
    flagsAffected: ['N', 'Z'],
    description: 'Load Accumulator SR Indirect Indexed'
  },
  
  0xAF: {
    mnemonic: 'LDA',
    opcode: 0xAF,
    addressingMode: 'Absolute Long',
    bytes: 4,
    cycles: 5,
    flagsAffected: ['N', 'Z'],
    description: 'Load Accumulator Long'
  },
  
  0xBF: {
    mnemonic: 'LDA',
    opcode: 0xBF,
    addressingMode: 'Absolute Long,X',
    bytes: 4,
    cycles: 5,
    flagsAffected: ['N', 'Z'],
    description: 'Load Accumulator Long Indexed'
  },
  
  0xA7: {
    mnemonic: 'LDA',
    opcode: 0xA7,
    addressingMode: '[Direct Page]',
    bytes: 2,
    cycles: 6,
    flagsAffected: ['N', 'Z'],
    description: 'Load Accumulator Direct Page Indirect Long'
  },
  
  0xB7: {
    mnemonic: 'LDA',
    opcode: 0xB7,
    addressingMode: '[Direct Page],Y',
    bytes: 2,
    cycles: 6,
    flagsAffected: ['N', 'Z'],
    description: 'Load Accumulator DP Indirect Long Indexed'
  },
  
  // LDX - Load Index X
  0xA2: {
    mnemonic: 'LDX',
    opcode: 0xA2,
    addressingMode: 'Immediate',
    bytes: 2,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'Load Index X with Memory'
  },
  
  0xA6: {
    mnemonic: 'LDX',
    opcode: 0xA6,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 3,
    flagsAffected: ['N', 'Z'],
    description: 'Load Index X with Memory'
  },
  
  0xB6: {
    mnemonic: 'LDX',
    opcode: 0xB6,
    addressingMode: 'Direct Page,Y',
    bytes: 2,
    cycles: 4,
    flagsAffected: ['N', 'Z'],
    description: 'Load Index X with Memory'
  },
  
  0xAE: {
    mnemonic: 'LDX',
    opcode: 0xAE,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 4,
    flagsAffected: ['N', 'Z'],
    description: 'Load Index X with Memory'
  },
  
  0xBE: {
    mnemonic: 'LDX',
    opcode: 0xBE,
    addressingMode: 'Absolute,Y',
    bytes: 3,
    cycles: 4, // +p for page boundary
    flagsAffected: ['N', 'Z'],
    description: 'Load Index X with Memory'
  },
  
  // LDY - Load Index Y
  0xA0: {
    mnemonic: 'LDY',
    opcode: 0xA0,
    addressingMode: 'Immediate',
    bytes: 2,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'Load Index Y with Memory'
  },
  
  0xA4: {
    mnemonic: 'LDY',
    opcode: 0xA4,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 3,
    flagsAffected: ['N', 'Z'],
    description: 'Load Index Y with Memory'
  },
  
  0xB4: {
    mnemonic: 'LDY',
    opcode: 0xB4,
    addressingMode: 'Direct Page,X',
    bytes: 2,
    cycles: 4,
    flagsAffected: ['N', 'Z'],
    description: 'Load Index Y with Memory'
  },
  
  0xAC: {
    mnemonic: 'LDY',
    opcode: 0xAC,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 4,
    flagsAffected: ['N', 'Z'],
    description: 'Load Index Y with Memory'
  },
  
  0xBC: {
    mnemonic: 'LDY',
    opcode: 0xBC,
    addressingMode: 'Absolute,X',
    bytes: 3,
    cycles: 4, // +p for page boundary
    flagsAffected: ['N', 'Z'],
    description: 'Load Index Y with Memory'
  },
  
  // STA - Store Accumulator
  0x85: {
    mnemonic: 'STA',
    opcode: 0x85,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 3,
    description: 'Store Accumulator in Memory'
  },
  
  0x8D: {
    mnemonic: 'STA',
    opcode: 0x8D,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 4,
    description: 'Store Accumulator in Memory',
    examples: ['STA $2000    ; Store A at address $2000', 'STA $2000,X  ; Store A at address $2000 + X']
  },
  
  0x9D: {
    mnemonic: 'STA',
    opcode: 0x9D,
    addressingMode: 'Absolute,X',
    bytes: 3,
    cycles: 5,
    description: 'Store Accumulator in Memory'
  },
  
  0x99: {
    mnemonic: 'STA',
    opcode: 0x99,
    addressingMode: 'Absolute,Y',
    bytes: 3,
    cycles: 5,
    description: 'Store Accumulator in Memory'
  },
  
  0x81: {
    mnemonic: 'STA',
    opcode: 0x81,
    addressingMode: '(Direct Page,X)',
    bytes: 2,
    cycles: 6,
    description: 'Store Accumulator in Memory'
  },
  
  0x91: {
    mnemonic: 'STA',
    opcode: 0x91,
    addressingMode: '(Direct Page),Y',
    bytes: 2,
    cycles: 6,
    description: 'Store Accumulator in Memory'
  },
  
  0x83: {
    mnemonic: 'STA',
    opcode: 0x83,
    addressingMode: 'Stack Relative',
    bytes: 2,
    cycles: 4,
    description: 'Store Accumulator Stack Relative'
  },
  
  0x93: {
    mnemonic: 'STA',
    opcode: 0x93,
    addressingMode: '(Stack Relative),Y',
    bytes: 2,
    cycles: 7,
    description: 'Store Accumulator SR Indirect Indexed'
  },
  
  0x8F: {
    mnemonic: 'STA',
    opcode: 0x8F,
    addressingMode: 'Absolute Long',
    bytes: 4,
    cycles: 5,
    description: 'Store Accumulator Long'
  },
  
  0x9F: {
    mnemonic: 'STA',
    opcode: 0x9F,
    addressingMode: 'Absolute Long,X',
    bytes: 4,
    cycles: 5,
    description: 'Store Accumulator Long Indexed'
  },
  
  0x87: {
    mnemonic: 'STA',
    opcode: 0x87,
    addressingMode: '[Direct Page]',
    bytes: 2,
    cycles: 6,
    description: 'Store Accumulator Direct Page Indirect Long'
  },
  
  0x97: {
    mnemonic: 'STA',
    opcode: 0x97,
    addressingMode: '[Direct Page],Y',
    bytes: 2,
    cycles: 6,
    description: 'Store Accumulator DP Indirect Long Indexed'
  },
  
  // STX - Store Index X
  0x86: {
    mnemonic: 'STX',
    opcode: 0x86,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 3,
    description: 'Store Index X in Memory'
  },
  
  0x96: {
    mnemonic: 'STX',
    opcode: 0x96,
    addressingMode: 'Direct Page,Y',
    bytes: 2,
    cycles: 4,
    description: 'Store Index X in Memory'
  },
  
  0x8E: {
    mnemonic: 'STX',
    opcode: 0x8E,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 4,
    description: 'Store Index X in Memory'
  },
  
  // STY - Store Index Y
  0x84: {
    mnemonic: 'STY',
    opcode: 0x84,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 3,
    description: 'Store Index Y in Memory'
  },
  
  0x94: {
    mnemonic: 'STY',
    opcode: 0x94,
    addressingMode: 'Direct Page,X',
    bytes: 2,
    cycles: 4,
    description: 'Store Index Y in Memory'
  },
  
  0x8C: {
    mnemonic: 'STY',
    opcode: 0x8C,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 4,
    description: 'Store Index Y in Memory'
  },
  
  // STZ - Store Zero
  0x64: {
    mnemonic: 'STZ',
    opcode: 0x64,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 3,
    description: 'Store Zero in Memory'
  },
  
  0x74: {
    mnemonic: 'STZ',
    opcode: 0x74,
    addressingMode: 'Direct Page,X',
    bytes: 2,
    cycles: 4,
    description: 'Store Zero in Memory'
  },
  
  0x9C: {
    mnemonic: 'STZ',
    opcode: 0x9C,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 4,
    description: 'Store Zero in Memory'
  },
  
  0x9E: {
    mnemonic: 'STZ',
    opcode: 0x9E,
    addressingMode: 'Absolute,X',
    bytes: 3,
    cycles: 5,
    description: 'Store Zero in Memory'
  },
  
  // ===== ARITHMETIC INSTRUCTIONS =====
  
  // ADC - Add with Carry
  0x69: {
    mnemonic: 'ADC',
    opcode: 0x69,
    addressingMode: 'Immediate',
    bytes: 2,
    cycles: 2,
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Add with Carry',
    examples: ['CLC          ; Clear carry before addition', 'ADC #$10     ; Add $10 to accumulator with carry'],
    notes: ['Always add with carry flag', 'Set carry flag before first addition with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  0x65: {
    mnemonic: 'ADC',
    opcode: 0x65,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 3,
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Add with Carry',
    notes: ['Always add with carry flag', 'Set carry flag before first addition with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  0x75: {
    mnemonic: 'ADC',
    opcode: 0x75,
    addressingMode: 'Direct Page,X',
    bytes: 2,
    cycles: 4,
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Add with Carry',
    notes: ['Always add with carry flag', 'Set carry flag before first addition with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  0x6D: {
    mnemonic: 'ADC',
    opcode: 0x6D,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 4,
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Add with Carry',
    notes: ['Always add with carry flag', 'Set carry flag before first addition with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  0x7D: {
    mnemonic: 'ADC',
    opcode: 0x7D,
    addressingMode: 'Absolute,X',
    bytes: 3,
    cycles: 4, // +p for page boundary
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Add with Carry',
    notes: ['Always add with carry flag', 'Set carry flag before first addition with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  0x79: {
    mnemonic: 'ADC',
    opcode: 0x79,
    addressingMode: 'Absolute,Y',
    bytes: 3,
    cycles: 4, // +p for page boundary
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Add with Carry',
    notes: ['Always add with carry flag', 'Set carry flag before first addition with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  0x6F: {
    mnemonic: 'ADC',
    opcode: 0x6F,
    addressingMode: 'Absolute Long',
    bytes: 4,
    cycles: 5,
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Add with Carry Long',
    notes: ['Always add with carry flag', 'Set carry flag before first addition with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  0x61: {
    mnemonic: 'ADC',
    opcode: 0x61,
    addressingMode: '(Direct Page,X)',
    bytes: 2,
    cycles: 6,
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Add with Carry',
    notes: ['Always add with carry flag', 'Set carry flag before first addition with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  0x71: {
    mnemonic: 'ADC',
    opcode: 0x71,
    addressingMode: '(Direct Page),Y',
    bytes: 2,
    cycles: 5, // +p for page boundary
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Add with Carry',
    notes: ['Always add with carry flag', 'Set carry flag before first addition with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  0x63: {
    mnemonic: 'ADC',
    opcode: 0x63,
    addressingMode: 'Stack Relative',
    bytes: 2,
    cycles: 4,
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Add with Carry Stack Relative',
    notes: ['Always add with carry flag', 'Set carry flag before first addition with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  0x73: {
    mnemonic: 'ADC',
    opcode: 0x73,
    addressingMode: '(Stack Relative),Y',
    bytes: 2,
    cycles: 7,
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Add with Carry SR Indirect Indexed',
    notes: ['Always add with carry flag', 'Set carry flag before first addition with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  // SBC - Subtract with Carry
  0xE9: {
    mnemonic: 'SBC',
    opcode: 0xE9,
    addressingMode: 'Immediate',
    bytes: 2,
    cycles: 2,
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Subtract with Carry',
    notes: ['Always subtract with carry flag', 'Set carry flag before first subtraction with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  0xE5: {
    mnemonic: 'SBC',
    opcode: 0xE5,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 3,
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Subtract with Carry',
    notes: ['Always subtract with carry flag', 'Set carry flag before first subtraction with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  0xF5: {
    mnemonic: 'SBC',
    opcode: 0xF5,
    addressingMode: 'Direct Page,X',
    bytes: 2,
    cycles: 4,
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Subtract with Carry',
    notes: ['Always subtract with carry flag', 'Set carry flag before first subtraction with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  0xED: {
    mnemonic: 'SBC',
    opcode: 0xED,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 4,
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Subtract with Carry',
    notes: ['Always subtract with carry flag', 'Set carry flag before first subtraction with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  0xFD: {
    mnemonic: 'SBC',
    opcode: 0xFD,
    addressingMode: 'Absolute,X',
    bytes: 3,
    cycles: 4, // +p for page boundary
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Subtract with Carry',
    notes: ['Always subtract with carry flag', 'Set carry flag before first subtraction with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  0xF9: {
    mnemonic: 'SBC',
    opcode: 0xF9,
    addressingMode: 'Absolute,Y',
    bytes: 3,
    cycles: 4, // +p for page boundary
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Subtract with Carry',
    notes: ['Always subtract with carry flag', 'Set carry flag before first subtraction with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  0xEF: {
    mnemonic: 'SBC',
    opcode: 0xEF,
    addressingMode: 'Absolute Long',
    bytes: 4,
    cycles: 5,
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Subtract with Carry Long',
    notes: ['Always subtract with carry flag', 'Set carry flag before first subtraction with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  0xE1: {
    mnemonic: 'SBC',
    opcode: 0xE1,
    addressingMode: '(Direct Page,X)',
    bytes: 2,
    cycles: 6,
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Subtract with Carry',
    notes: ['Always subtract with carry flag', 'Set carry flag before first subtraction with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  0xF1: {
    mnemonic: 'SBC',
    opcode: 0xF1,
    addressingMode: '(Direct Page),Y',
    bytes: 2,
    cycles: 5, // +p for page boundary
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Subtract with Carry',
    notes: ['Always subtract with carry flag', 'Set carry flag before first subtraction with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  0xE3: {
    mnemonic: 'SBC',
    opcode: 0xE3,
    addressingMode: 'Stack Relative',
    bytes: 2,
    cycles: 4,
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Subtract with Carry Stack Relative',
    notes: ['Always subtract with carry flag', 'Set carry flag before first subtraction with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  0xF3: {
    mnemonic: 'SBC',
    opcode: 0xF3,
    addressingMode: '(Stack Relative),Y',
    bytes: 2,
    cycles: 7,
    flagsAffected: ['N', 'V', 'Z', 'C'],
    description: 'Subtract with Carry SR Indirect Indexed',
    notes: ['Always subtract with carry flag', 'Set carry flag before first subtraction with SEC', 'Result affected by decimal mode (D flag)']
  },
  
  // INC - Increment
  0x1A: {
    mnemonic: 'INC',
    opcode: 0x1A,
    addressingMode: 'Accumulator',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'Increment Accumulator'
  },
  
  0xE6: {
    mnemonic: 'INC',
    opcode: 0xE6,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 5,
    flagsAffected: ['N', 'Z'],
    description: 'Increment Memory'
  },
  
  0xF6: {
    mnemonic: 'INC',
    opcode: 0xF6,
    addressingMode: 'Direct Page,X',
    bytes: 2,
    cycles: 6,
    flagsAffected: ['N', 'Z'],
    description: 'Increment Memory'
  },
  
  0xEE: {
    mnemonic: 'INC',
    opcode: 0xEE,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 6,
    flagsAffected: ['N', 'Z'],
    description: 'Increment Memory'
  },
  
  0xFE: {
    mnemonic: 'INC',
    opcode: 0xFE,
    addressingMode: 'Absolute,X',
    bytes: 3,
    cycles: 7,
    flagsAffected: ['N', 'Z'],
    description: 'Increment Memory'
  },
  
  // DEC - Decrement
  0x3A: {
    mnemonic: 'DEC',
    opcode: 0x3A,
    addressingMode: 'Accumulator',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'Decrement Accumulator'
  },
  
  0xC6: {
    mnemonic: 'DEC',
    opcode: 0xC6,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 5,
    flagsAffected: ['N', 'Z'],
    description: 'Decrement Memory'
  },
  
  0xD6: {
    mnemonic: 'DEC',
    opcode: 0xD6,
    addressingMode: 'Direct Page,X',
    bytes: 2,
    cycles: 6,
    flagsAffected: ['N', 'Z'],
    description: 'Decrement Memory'
  },
  
  0xCE: {
    mnemonic: 'DEC',
    opcode: 0xCE,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 6,
    flagsAffected: ['N', 'Z'],
    description: 'Decrement Memory'
  },
  
  0xDE: {
    mnemonic: 'DEC',
    opcode: 0xDE,
    addressingMode: 'Absolute,X',
    bytes: 3,
    cycles: 7,
    flagsAffected: ['N', 'Z'],
    description: 'Decrement Memory'
  },
  
  // INX/INY/DEX/DEY - Index Register Operations
  0xE8: {
    mnemonic: 'INX',
    opcode: 0xE8,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'Increment Index X'
  },
  
  0xC8: {
    mnemonic: 'INY',
    opcode: 0xC8,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'Increment Index Y'
  },
  
  0xCA: {
    mnemonic: 'DEX',
    opcode: 0xCA,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'Decrement Index X'
  },
  
  0x88: {
    mnemonic: 'DEY',
    opcode: 0x88,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'Decrement Index Y'
  },
  
  // ===== BRANCH INSTRUCTIONS =====
  
  0x90: {
    mnemonic: 'BCC',
    opcode: 0x90,
    addressingMode: 'Relative',
    bytes: 2,
    cycles: 2, // +t+p for branch taken + page boundary
    description: 'Branch if Carry Clear'
  },
  
  0xB0: {
    mnemonic: 'BCS',
    opcode: 0xB0,
    addressingMode: 'Relative',
    bytes: 2,
    cycles: 2,
    description: 'Branch if Carry Set'
  },
  
  0xF0: {
    mnemonic: 'BEQ',
    opcode: 0xF0,
    addressingMode: 'Relative',
    bytes: 2,
    cycles: 2,
    description: 'Branch if Equal (Zero Set)'
  },
  
  0xD0: {
    mnemonic: 'BNE',
    opcode: 0xD0,
    addressingMode: 'Relative',
    bytes: 2,
    cycles: 2,
    description: 'Branch if Not Equal (Zero Clear)'
  },
  
  0x30: {
    mnemonic: 'BMI',
    opcode: 0x30,
    addressingMode: 'Relative',
    bytes: 2,
    cycles: 2,
    description: 'Branch if Minus (Negative Set)'
  },
  
  0x10: {
    mnemonic: 'BPL',
    opcode: 0x10,
    addressingMode: 'Relative',
    bytes: 2,
    cycles: 2,
    description: 'Branch if Plus (Negative Clear)'
  },
  
  0x50: {
    mnemonic: 'BVC',
    opcode: 0x50,
    addressingMode: 'Relative',
    bytes: 2,
    cycles: 2,
    description: 'Branch if Overflow Clear'
  },
  
  0x70: {
    mnemonic: 'BVS',
    opcode: 0x70,
    addressingMode: 'Relative',
    bytes: 2,
    cycles: 2,
    description: 'Branch if Overflow Set'
  },
  
  0x80: {
    mnemonic: 'BRA',
    opcode: 0x80,
    addressingMode: 'Relative',
    bytes: 2,
    cycles: 3,
    description: 'Branch Always',
    notes: ['Always branches (unconditional)', '8-bit signed displacement (-128 to +127)', '3 cycles if branch taken']
  },
  
  0x82: {
    mnemonic: 'BRL',
    opcode: 0x82,
    addressingMode: 'Relative Long',
    bytes: 3,
    cycles: 4,
    description: 'Branch Always Long',
    notes: ['Always branches (unconditional)', '16-bit signed displacement (-32768 to +32767)', 'Always takes 4 cycles']
  },
  
  // ===== JUMP AND SUBROUTINE INSTRUCTIONS =====
  
  0x4C: {
    mnemonic: 'JMP',
    opcode: 0x4C,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 3,
    description: 'Jump',
    examples: ['JMP $8000    ; Jump to address $8000', 'JMP ($1234)  ; Jump to address stored at $1234']
  },
  
  0x6C: {
    mnemonic: 'JMP',
    opcode: 0x6C,
    addressingMode: '(Absolute)',
    bytes: 3,
    cycles: 5,
    description: 'Jump Indirect'
  },
  
  0x7C: {
    mnemonic: 'JMP',
    opcode: 0x7C,
    addressingMode: '(Absolute,X)',
    bytes: 3,
    cycles: 6,
    description: 'Jump Indexed Indirect'
  },
  
  0x5C: {
    mnemonic: 'JML',
    opcode: 0x5C,
    addressingMode: 'Absolute Long',
    bytes: 4,
    cycles: 4,
    description: 'Jump Long'
  },
  
  0xDC: {
    mnemonic: 'JML',
    opcode: 0xDC,
    addressingMode: '[Absolute]',
    bytes: 3,
    cycles: 6,
    description: 'Jump Long Indirect'
  },
  
  0x20: {
    mnemonic: 'JSR',
    opcode: 0x20,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 6,
    description: 'Jump to Subroutine',
    examples: ['JSR $9000    ; Jump to subroutine at $9000', 'RTS          ; Return from subroutine']
  },
  
  0xFC: {
    mnemonic: 'JSR',
    opcode: 0xFC,
    addressingMode: '(Absolute,X)',
    bytes: 3,
    cycles: 8,
    description: 'Jump to Subroutine Indexed Indirect'
  },
  
  0x22: {
    mnemonic: 'JSL',
    opcode: 0x22,
    addressingMode: 'Absolute Long',
    bytes: 4,
    cycles: 8,
    description: 'Jump to Subroutine Long'
  },
  
  0x60: {
    mnemonic: 'RTS',
    opcode: 0x60,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 6,
    description: 'Return from Subroutine'
  },
  
  0x6B: {
    mnemonic: 'RTL',
    opcode: 0x6B,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 6,
    description: 'Return from Subroutine Long'
  },
  
  0x40: {
    mnemonic: 'RTI',
    opcode: 0x40,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 6,
    flagsAffected: ['All'],
    description: 'Return from Interrupt'
  },
  
  // ===== STACK OPERATIONS =====
  
  0x48: {
    mnemonic: 'PHA',
    opcode: 0x48,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 3,
    description: 'Push Accumulator'
  },
  
  0x08: {
    mnemonic: 'PHP',
    opcode: 0x08,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 3,
    description: 'Push Processor Status'
  },
  
  0xDA: {
    mnemonic: 'PHX',
    opcode: 0xDA,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 3,
    description: 'Push Index X'
  },
  
  0x5A: {
    mnemonic: 'PHY',
    opcode: 0x5A,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 3,
    description: 'Push Index Y'
  },
  
  0x8B: {
    mnemonic: 'PHB',
    opcode: 0x8B,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 3,
    description: 'Push Data Bank Register'
  },
  
  0x0B: {
    mnemonic: 'PHD',
    opcode: 0x0B,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 4,
    description: 'Push Direct Page Register'
  },
  
  0x4B: {
    mnemonic: 'PHK',
    opcode: 0x4B,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 3,
    description: 'Push Program Bank Register'
  },
  
  0x68: {
    mnemonic: 'PLA',
    opcode: 0x68,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 4,
    flagsAffected: ['N', 'Z'],
    description: 'Pull Accumulator'
  },
  
  0x28: {
    mnemonic: 'PLP',
    opcode: 0x28,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 4,
    flagsAffected: ['All'],
    description: 'Pull Processor Status'
  },
  
  0xFA: {
    mnemonic: 'PLX',
    opcode: 0xFA,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 4,
    flagsAffected: ['N', 'Z'],
    description: 'Pull Index X'
  },
  
  0x7A: {
    mnemonic: 'PLY',
    opcode: 0x7A,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 4,
    flagsAffected: ['N', 'Z'],
    description: 'Pull Index Y'
  },
  
  0xAB: {
    mnemonic: 'PLB',
    opcode: 0xAB,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 4,
    flagsAffected: ['N', 'Z'],
    description: 'Pull Data Bank Register'
  },
  
  0x2B: {
    mnemonic: 'PLD',
    opcode: 0x2B,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 5,
    flagsAffected: ['N', 'Z'],
    description: 'Pull Direct Page Register'
  },
  
  // ===== TRANSFER INSTRUCTIONS =====
  
  0xAA: {
    mnemonic: 'TAX',
    opcode: 0xAA,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'Transfer Accumulator to Index X'
  },
  
  0xA8: {
    mnemonic: 'TAY',
    opcode: 0xA8,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'Transfer Accumulator to Index Y'
  },
  
  0x8A: {
    mnemonic: 'TXA',
    opcode: 0x8A,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'Transfer Index X to Accumulator'
  },
  
  0x98: {
    mnemonic: 'TYA',
    opcode: 0x98,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'Transfer Index Y to Accumulator'
  },
  
  0x9A: {
    mnemonic: 'TXS',
    opcode: 0x9A,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    description: 'Transfer Index X to Stack Pointer'
  },
  
  0xBA: {
    mnemonic: 'TSX',
    opcode: 0xBA,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'Transfer Stack Pointer to Index X'
  },
  
  0x9B: {
    mnemonic: 'TXY',
    opcode: 0x9B,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'Transfer Index X to Index Y'
  },
  
  0xBB: {
    mnemonic: 'TYX',
    opcode: 0xBB,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'Transfer Index Y to Index X'
  },
  
  0x5B: {
    mnemonic: 'TCD',
    opcode: 0x5B,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'Transfer 16-bit Accumulator to Direct Page Register'
  },
  
  0x7B: {
    mnemonic: 'TDC',
    opcode: 0x7B,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'Transfer Direct Page Register to 16-bit Accumulator'
  },
  
  0x1B: {
    mnemonic: 'TCS',
    opcode: 0x1B,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    description: 'Transfer 16-bit Accumulator to Stack Pointer'
  },
  
  0x3B: {
    mnemonic: 'TSC',
    opcode: 0x3B,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'Transfer Stack Pointer to 16-bit Accumulator'
  },
  
  // ===== FLAG CONTROL INSTRUCTIONS =====
  
  0x18: {
    mnemonic: 'CLC',
    opcode: 0x18,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['C'],
    description: 'Clear Carry Flag'
  },
  
  0x38: {
    mnemonic: 'SEC',
    opcode: 0x38,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['C'],
    description: 'Set Carry Flag'
  },
  
  0x58: {
    mnemonic: 'CLI',
    opcode: 0x58,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['I'],
    description: 'Clear Interrupt Disable Flag'
  },
  
  0x78: {
    mnemonic: 'SEI',
    opcode: 0x78,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['I'],
    description: 'Set Interrupt Disable Flag'
  },
  
  0xD8: {
    mnemonic: 'CLD',
    opcode: 0xD8,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['D'],
    description: 'Clear Decimal Mode Flag'
  },
  
  0xF8: {
    mnemonic: 'SED',
    opcode: 0xF8,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['D'],
    description: 'Set Decimal Mode Flag'
  },
  
  0xB8: {
    mnemonic: 'CLV',
    opcode: 0xB8,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['V'],
    description: 'Clear Overflow Flag'
  },
  
  // ===== PROCESSOR CONTROL INSTRUCTIONS =====
  
  0xC2: {
    mnemonic: 'REP',
    opcode: 0xC2,
    addressingMode: 'Immediate',
    bytes: 2,
    cycles: 3,
    flagsAffected: ['All'],
    description: 'Reset Processor Status Bits',
    notes: ['Reset processor status bits', 'REP #$30 sets A, X, Y to 16-bit mode', 'REP #$20 sets A to 16-bit mode']
  },
  
  0xE2: {
    mnemonic: 'SEP',
    opcode: 0xE2,
    addressingMode: 'Immediate',
    bytes: 2,
    cycles: 3,
    flagsAffected: ['All'],
    description: 'Set Processor Status Bits',
    notes: ['Set processor status bits', 'SEP #$30 sets A, X, Y to 8-bit mode', 'SEP #$20 sets A to 8-bit mode']
  },
  
  0xFB: {
    mnemonic: 'XCE',
    opcode: 0xFB,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['E', 'C'],
    description: 'Exchange Carry and Emulation Flags'
  },
  
  // ===== LOGICAL OPERATIONS =====
  
  // ORA - OR Accumulator with Memory
  0x09: {
    mnemonic: 'ORA',
    opcode: 0x09,
    addressingMode: 'Immediate',
    bytes: 2,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'OR Accumulator with Memory'
  },
  
  0x05: {
    mnemonic: 'ORA',
    opcode: 0x05,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 3,
    flagsAffected: ['N', 'Z'],
    description: 'OR Accumulator with Memory'
  },
  
  0x15: {
    mnemonic: 'ORA',
    opcode: 0x15,
    addressingMode: 'Direct Page,X',
    bytes: 2,
    cycles: 4,
    flagsAffected: ['N', 'Z'],
    description: 'OR Accumulator with Memory'
  },
  
  0x0D: {
    mnemonic: 'ORA',
    opcode: 0x0D,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 4,
    flagsAffected: ['N', 'Z'],
    description: 'OR Accumulator with Memory'
  },
  
  0x1D: {
    mnemonic: 'ORA',
    opcode: 0x1D,
    addressingMode: 'Absolute,X',
    bytes: 3,
    cycles: 4, // +p for page boundary
    flagsAffected: ['N', 'Z'],
    description: 'OR Accumulator with Memory'
  },
  
  0x19: {
    mnemonic: 'ORA',
    opcode: 0x19,
    addressingMode: 'Absolute,Y',
    bytes: 3,
    cycles: 4, // +p for page boundary
    flagsAffected: ['N', 'Z'],
    description: 'OR Accumulator with Memory'
  },
  
  0x01: {
    mnemonic: 'ORA',
    opcode: 0x01,
    addressingMode: '(Direct Page,X)',
    bytes: 2,
    cycles: 6,
    flagsAffected: ['N', 'Z'],
    description: 'OR Accumulator with Memory'
  },
  
  0x11: {
    mnemonic: 'ORA',
    opcode: 0x11,
    addressingMode: '(Direct Page),Y',
    bytes: 2,
    cycles: 5, // +p for page boundary
    flagsAffected: ['N', 'Z'],
    description: 'OR Accumulator with Memory'
  },
  
  0x03: {
    mnemonic: 'ORA',
    opcode: 0x03,
    addressingMode: 'Stack Relative',
    bytes: 2,
    cycles: 4,
    flagsAffected: ['N', 'Z'],
    description: 'OR Accumulator with Stack Relative'
  },
  
  0x13: {
    mnemonic: 'ORA',
    opcode: 0x13,
    addressingMode: '(Stack Relative),Y',
    bytes: 2,
    cycles: 7,
    flagsAffected: ['N', 'Z'],
    description: 'OR Accumulator with SR Indirect Indexed'
  },
  
  // AND - AND Accumulator with Memory
  0x29: {
    mnemonic: 'AND',
    opcode: 0x29,
    addressingMode: 'Immediate',
    bytes: 2,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'AND Accumulator with Memory'
  },
  
  0x25: {
    mnemonic: 'AND',
    opcode: 0x25,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 3,
    flagsAffected: ['N', 'Z'],
    description: 'AND Accumulator with Memory'
  },
  
  0x35: {
    mnemonic: 'AND',
    opcode: 0x35,
    addressingMode: 'Direct Page,X',
    bytes: 2,
    cycles: 4,
    flagsAffected: ['N', 'Z'],
    description: 'AND Accumulator with Memory'
  },
  
  0x2D: {
    mnemonic: 'AND',
    opcode: 0x2D,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 4,
    flagsAffected: ['N', 'Z'],
    description: 'AND Accumulator with Memory'
  },
  
  0x3D: {
    mnemonic: 'AND',
    opcode: 0x3D,
    addressingMode: 'Absolute,X',
    bytes: 3,
    cycles: 4, // +p for page boundary
    flagsAffected: ['N', 'Z'],
    description: 'AND Accumulator with Memory'
  },
  
  0x39: {
    mnemonic: 'AND',
    opcode: 0x39,
    addressingMode: 'Absolute,Y',
    bytes: 3,
    cycles: 4, // +p for page boundary
    flagsAffected: ['N', 'Z'],
    description: 'AND Accumulator with Memory'
  },
  
  0x21: {
    mnemonic: 'AND',
    opcode: 0x21,
    addressingMode: '(Direct Page,X)',
    bytes: 2,
    cycles: 6,
    flagsAffected: ['N', 'Z'],
    description: 'AND Accumulator with Memory'
  },
  
  0x31: {
    mnemonic: 'AND',
    opcode: 0x31,
    addressingMode: '(Direct Page),Y',
    bytes: 2,
    cycles: 5, // +p for page boundary
    flagsAffected: ['N', 'Z'],
    description: 'AND Accumulator with Memory'
  },
  
  0x23: {
    mnemonic: 'AND',
    opcode: 0x23,
    addressingMode: 'Stack Relative',
    bytes: 2,
    cycles: 4,
    flagsAffected: ['N', 'Z'],
    description: 'AND Accumulator with Stack Relative'
  },
  
  0x33: {
    mnemonic: 'AND',
    opcode: 0x33,
    addressingMode: '(Stack Relative),Y',
    bytes: 2,
    cycles: 7,
    flagsAffected: ['N', 'Z'],
    description: 'AND Accumulator with SR Indirect Indexed'
  },
  
  // EOR - Exclusive OR Accumulator with Memory
  0x49: {
    mnemonic: 'EOR',
    opcode: 0x49,
    addressingMode: 'Immediate',
    bytes: 2,
    cycles: 2,
    flagsAffected: ['N', 'Z'],
    description: 'Exclusive OR Accumulator with Memory'
  },
  
  0x45: {
    mnemonic: 'EOR',
    opcode: 0x45,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 3,
    flagsAffected: ['N', 'Z'],
    description: 'Exclusive OR Accumulator with Memory'
  },
  
  0x55: {
    mnemonic: 'EOR',
    opcode: 0x55,
    addressingMode: 'Direct Page,X',
    bytes: 2,
    cycles: 4,
    flagsAffected: ['N', 'Z'],
    description: 'Exclusive OR Accumulator with Memory'
  },
  
  0x4D: {
    mnemonic: 'EOR',
    opcode: 0x4D,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 4,
    flagsAffected: ['N', 'Z'],
    description: 'Exclusive OR Accumulator with Memory'
  },
  
  0x5D: {
    mnemonic: 'EOR',
    opcode: 0x5D,
    addressingMode: 'Absolute,X',
    bytes: 3,
    cycles: 4, // +p for page boundary
    flagsAffected: ['N', 'Z'],
    description: 'Exclusive OR Accumulator with Memory'
  },
  
  0x59: {
    mnemonic: 'EOR',
    opcode: 0x59,
    addressingMode: 'Absolute,Y',
    bytes: 3,
    cycles: 4, // +p for page boundary
    flagsAffected: ['N', 'Z'],
    description: 'Exclusive OR Accumulator with Memory'
  },
  
  0x41: {
    mnemonic: 'EOR',
    opcode: 0x41,
    addressingMode: '(Direct Page,X)',
    bytes: 2,
    cycles: 6,
    flagsAffected: ['N', 'Z'],
    description: 'Exclusive OR Accumulator with Memory'
  },
  
  0x51: {
    mnemonic: 'EOR',
    opcode: 0x51,
    addressingMode: '(Direct Page),Y',
    bytes: 2,
    cycles: 5, // +p for page boundary
    flagsAffected: ['N', 'Z'],
    description: 'Exclusive OR Accumulator with Memory'
  },
  
  0x43: {
    mnemonic: 'EOR',
    opcode: 0x43,
    addressingMode: 'Stack Relative',
    bytes: 2,
    cycles: 4,
    flagsAffected: ['N', 'Z'],
    description: 'EOR Accumulator with Stack Relative'
  },
  
  0x53: {
    mnemonic: 'EOR',
    opcode: 0x53,
    addressingMode: '(Stack Relative),Y',
    bytes: 2,
    cycles: 7,
    flagsAffected: ['N', 'Z'],
    description: 'EOR Accumulator with SR Indirect Indexed'
  },
  
  // ===== SHIFT AND ROTATE INSTRUCTIONS =====
  
  0x0A: {
    mnemonic: 'ASL',
    opcode: 0x0A,
    addressingMode: 'Accumulator',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Arithmetic Shift Left'
  },
  
  0x06: {
    mnemonic: 'ASL',
    opcode: 0x06,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 5,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Arithmetic Shift Left'
  },
  
  0x16: {
    mnemonic: 'ASL',
    opcode: 0x16,
    addressingMode: 'Direct Page,X',
    bytes: 2,
    cycles: 6,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Arithmetic Shift Left'
  },
  
  0x0E: {
    mnemonic: 'ASL',
    opcode: 0x0E,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 6,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Arithmetic Shift Left'
  },
  
  0x1E: {
    mnemonic: 'ASL',
    opcode: 0x1E,
    addressingMode: 'Absolute,X',
    bytes: 3,
    cycles: 7,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Arithmetic Shift Left'
  },
  
  0x4A: {
    mnemonic: 'LSR',
    opcode: 0x4A,
    addressingMode: 'Accumulator',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Logical Shift Right'
  },
  
  0x46: {
    mnemonic: 'LSR',
    opcode: 0x46,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 5,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Logical Shift Right'
  },
  
  0x56: {
    mnemonic: 'LSR',
    opcode: 0x56,
    addressingMode: 'Direct Page,X',
    bytes: 2,
    cycles: 6,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Logical Shift Right'
  },
  
  0x4E: {
    mnemonic: 'LSR',
    opcode: 0x4E,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 6,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Logical Shift Right'
  },
  
  0x5E: {
    mnemonic: 'LSR',
    opcode: 0x5E,
    addressingMode: 'Absolute,X',
    bytes: 3,
    cycles: 7,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Logical Shift Right'
  },
  
  0x2A: {
    mnemonic: 'ROL',
    opcode: 0x2A,
    addressingMode: 'Accumulator',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Rotate Left'
  },
  
  0x26: {
    mnemonic: 'ROL',
    opcode: 0x26,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 5,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Rotate Left'
  },
  
  0x36: {
    mnemonic: 'ROL',
    opcode: 0x36,
    addressingMode: 'Direct Page,X',
    bytes: 2,
    cycles: 6,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Rotate Left'
  },
  
  0x2E: {
    mnemonic: 'ROL',
    opcode: 0x2E,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 6,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Rotate Left'
  },
  
  0x3E: {
    mnemonic: 'ROL',
    opcode: 0x3E,
    addressingMode: 'Absolute,X',
    bytes: 3,
    cycles: 7,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Rotate Left'
  },
  
  0x6A: {
    mnemonic: 'ROR',
    opcode: 0x6A,
    addressingMode: 'Accumulator',
    bytes: 1,
    cycles: 2,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Rotate Right'
  },
  
  0x66: {
    mnemonic: 'ROR',
    opcode: 0x66,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 5,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Rotate Right'
  },
  
  0x76: {
    mnemonic: 'ROR',
    opcode: 0x76,
    addressingMode: 'Direct Page,X',
    bytes: 2,
    cycles: 6,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Rotate Right'
  },
  
  0x6E: {
    mnemonic: 'ROR',
    opcode: 0x6E,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 6,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Rotate Right'
  },
  
  0x7E: {
    mnemonic: 'ROR',
    opcode: 0x7E,
    addressingMode: 'Absolute,X',
    bytes: 3,
    cycles: 7,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Rotate Right'
  },
  
  // ===== COMPARISON INSTRUCTIONS =====
  
  0xC9: {
    mnemonic: 'CMP',
    opcode: 0xC9,
    addressingMode: 'Immediate',
    bytes: 2,
    cycles: 2,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Compare Accumulator with Memory'
  },
  
  0xC5: {
    mnemonic: 'CMP',
    opcode: 0xC5,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 3,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Compare Accumulator with Memory'
  },
  
  0xD5: {
    mnemonic: 'CMP',
    opcode: 0xD5,
    addressingMode: 'Direct Page,X',
    bytes: 2,
    cycles: 4,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Compare Accumulator with Memory'
  },
  
  0xCD: {
    mnemonic: 'CMP',
    opcode: 0xCD,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 4,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Compare Accumulator with Memory'
  },
  
  0xDD: {
    mnemonic: 'CMP',
    opcode: 0xDD,
    addressingMode: 'Absolute,X',
    bytes: 3,
    cycles: 4, // +p for page boundary
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Compare Accumulator with Memory'
  },
  
  0xD9: {
    mnemonic: 'CMP',
    opcode: 0xD9,
    addressingMode: 'Absolute,Y',
    bytes: 3,
    cycles: 4, // +p for page boundary
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Compare Accumulator with Memory'
  },
  
  0xCF: {
    mnemonic: 'CMP',
    opcode: 0xCF,
    addressingMode: 'Absolute Long',
    bytes: 4,
    cycles: 5,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Compare Accumulator Long'
  },
  
  0xDF: {
    mnemonic: 'CMP',
    opcode: 0xDF,
    addressingMode: 'Absolute Long,X',
    bytes: 4,
    cycles: 5,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Compare Accumulator Long Indexed'
  },
  
  0xC1: {
    mnemonic: 'CMP',
    opcode: 0xC1,
    addressingMode: '(Direct Page,X)',
    bytes: 2,
    cycles: 6,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Compare Accumulator with Memory'
  },
  
  0xD1: {
    mnemonic: 'CMP',
    opcode: 0xD1,
    addressingMode: '(Direct Page),Y',
    bytes: 2,
    cycles: 5, // +p for page boundary
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Compare Accumulator with Memory'
  },
  
  0xC7: {
    mnemonic: 'CMP',
    opcode: 0xC7,
    addressingMode: '[Direct Page]',
    bytes: 2,
    cycles: 6,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Compare Accumulator DP Indirect Long'
  },
  
  0xD7: {
    mnemonic: 'CMP',
    opcode: 0xD7,
    addressingMode: '[Direct Page],Y',
    bytes: 2,
    cycles: 6,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Compare Accumulator DP Indirect Long Indexed'
  },
  
  0xC3: {
    mnemonic: 'CMP',
    opcode: 0xC3,
    addressingMode: 'Stack Relative',
    bytes: 2,
    cycles: 4,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Compare Accumulator Stack Relative'
  },
  
  0xD3: {
    mnemonic: 'CMP',
    opcode: 0xD3,
    addressingMode: '(Stack Relative),Y',
    bytes: 2,
    cycles: 7,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Compare Accumulator SR Indirect Indexed'
  },
  
  0xE0: {
    mnemonic: 'CPX',
    opcode: 0xE0,
    addressingMode: 'Immediate',
    bytes: 2,
    cycles: 2,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Compare Index X with Memory'
  },
  
  0xE4: {
    mnemonic: 'CPX',
    opcode: 0xE4,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 3,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Compare Index X with Memory'
  },
  
  0xEC: {
    mnemonic: 'CPX',
    opcode: 0xEC,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 4,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Compare Index X with Memory'
  },
  
  0xC0: {
    mnemonic: 'CPY',
    opcode: 0xC0,
    addressingMode: 'Immediate',
    bytes: 2,
    cycles: 2,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Compare Index Y with Memory'
  },
  
  0xC4: {
    mnemonic: 'CPY',
    opcode: 0xC4,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 3,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Compare Index Y with Memory'
  },
  
  0xCC: {
    mnemonic: 'CPY',
    opcode: 0xCC,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 4,
    flagsAffected: ['N', 'Z', 'C'],
    description: 'Compare Index Y with Memory'
  },
  
  // ===== BIT TEST INSTRUCTIONS =====
  
  0x89: {
    mnemonic: 'BIT',
    opcode: 0x89,
    addressingMode: 'Immediate',
    bytes: 2,
    cycles: 2,
    flagsAffected: ['Z'],
    description: 'Test Bits (Immediate mode only affects Z)'
  },
  
  0x24: {
    mnemonic: 'BIT',
    opcode: 0x24,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 3,
    flagsAffected: ['N', 'V', 'Z'],
    description: 'Test Bits'
  },
  
  0x34: {
    mnemonic: 'BIT',
    opcode: 0x34,
    addressingMode: 'Direct Page,X',
    bytes: 2,
    cycles: 4,
    flagsAffected: ['N', 'V', 'Z'],
    description: 'Test Bits'
  },
  
  0x2C: {
    mnemonic: 'BIT',
    opcode: 0x2C,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 4,
    flagsAffected: ['N', 'V', 'Z'],
    description: 'Test Bits'
  },
  
  0x3C: {
    mnemonic: 'BIT',
    opcode: 0x3C,
    addressingMode: 'Absolute,X',
    bytes: 3,
    cycles: 4, // +p for page boundary
    flagsAffected: ['N', 'V', 'Z'],
    description: 'Test Bits'
  },
  
  0x14: {
    mnemonic: 'TRB',
    opcode: 0x14,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 5,
    flagsAffected: ['Z'],
    description: 'Test and Reset Bits'
  },
  
  0x1C: {
    mnemonic: 'TRB',
    opcode: 0x1C,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 6,
    flagsAffected: ['Z'],
    description: 'Test and Reset Bits'
  },
  
  0x04: {
    mnemonic: 'TSB',
    opcode: 0x04,
    addressingMode: 'Direct Page',
    bytes: 2,
    cycles: 5,
    flagsAffected: ['Z'],
    description: 'Test and Set Bits'
  },
  
  0x0C: {
    mnemonic: 'TSB',
    opcode: 0x0C,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 6,
    flagsAffected: ['Z'],
    description: 'Test and Set Bits'
  },
  
  // ===== SYSTEM CONTROL INSTRUCTIONS =====
  
  0xEA: {
    mnemonic: 'NOP',
    opcode: 0xEA,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 2,
    description: 'No Operation'
  },
  
  0xDB: {
    mnemonic: 'STP',
    opcode: 0xDB,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 3,
    description: 'Stop the Processor'
  },
  
  0xCB: {
    mnemonic: 'WAI',
    opcode: 0xCB,
    addressingMode: 'Implied',
    bytes: 1,
    cycles: 3,
    description: 'Wait for Interrupt'
  },
  
  0x00: {
    mnemonic: 'BRK',
    opcode: 0x00,
    addressingMode: 'Implied',
    bytes: 2,
    cycles: 7,
    flagsAffected: ['B', 'I'],
    description: 'Software Break'
  },
  
  0x02: {
    mnemonic: 'COP',
    opcode: 0x02,
    addressingMode: 'Implied',
    bytes: 2,
    cycles: 7,
    flagsAffected: ['I'],
    description: 'Coprocessor Enable'
  },
  
  0x42: {
    mnemonic: 'WDM',
    opcode: 0x42,
    addressingMode: 'Implied',
    bytes: 2,
    cycles: 2,
    description: 'Reserved for Future Expansion'
  },
  
  // ===== BLOCK MOVE INSTRUCTIONS =====
  
  0x44: {
    mnemonic: 'MVP',
    opcode: 0x44,
    addressingMode: 'Block Move',
    bytes: 3,
    cycles: 7,
    description: 'Block Move Previous'
  },
  
  0x54: {
    mnemonic: 'MVN',
    opcode: 0x54,
    addressingMode: 'Block Move',
    bytes: 3,
    cycles: 7,
    description: 'Block Move Next'
  },
  
  // ===== STACK ADDRESSING INSTRUCTIONS =====
  
  0xF4: {
    mnemonic: 'PEA',
    opcode: 0xF4,
    addressingMode: 'Absolute',
    bytes: 3,
    cycles: 5,
    description: 'Push Effective Absolute Address'
  },
  
  0xD4: {
    mnemonic: 'PEI',
    opcode: 0xD4,
    addressingMode: '(Direct Page)',
    bytes: 2,
    cycles: 6,
    description: 'Push Effective Indirect Address'
  },
  
  0x62: {
    mnemonic: 'PER',
    opcode: 0x62,
    addressingMode: 'Relative Long',
    bytes: 3,
    cycles: 6,
    description: 'Push Effective PC Relative Address'
  }
};

// =====================================================================
// SNES HARDWARE REGISTER REFERENCE
// =====================================================================

export interface RegisterReference {
  address: number;
  name: string;
  description: string;
  access: 'read' | 'write' | 'read/write';
  category: 'ppu' | 'cpu' | 'apu' | 'dma';
  bitLayout: Array<{
    bit: number | string;
    description: string;
    values?: Record<string, string>;
  }>;
  notes?: string[];
  examples?: string[];
}

export const REGISTER_REFERENCE: Record<number, RegisterReference> = {
  // ===== PPU REGISTERS =====
  
  0x2100: {
    address: 0x2100,
    name: 'INIDISP',
    description: 'Screen Display Register',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: 7, description: 'Forced blanking', values: { '0': 'normal', '1': 'blank' } },
      { bit: '6-4', description: 'Not used' },
      { bit: '3-0', description: 'Brightness', values: { '0': '0%', '15': '100%' } }
    ],
    notes: ['Written during V-Blank or forced blank'],
    examples: [
      'LDA #$80    ; Force blank',
      'STA $2100',
      'LDA #$0F    ; Full brightness',
      'STA $2100'
    ]
  },
  
  0x2101: {
    address: 0x2101,
    name: 'OBSEL',
    description: 'Object Size and Character Address',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-5', description: 'Object size', values: { '000': '8x8/16x16', '001': '8x8/32x32' } },
      { bit: '4-3', description: 'Name select (base address)' },
      { bit: '2-0', description: 'Name base address (addr>>14)' }
    ]
  },
  
  0x2102: {
    address: 0x2102,
    name: 'OAMADDL',
    description: 'OAM Address Register (Low)',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-0', description: 'OAM address low byte' }
    ]
  },
  
  0x2103: {
    address: 0x2103,
    name: 'OAMADDH',
    description: 'OAM Address Register (High)',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: 7, description: 'OAM priority rotation' },
      { bit: '6-1', description: 'Not used' },
      { bit: 0, description: 'OAM address bit 8' }
    ]
  },
  
  0x2104: {
    address: 0x2104,
    name: 'OAMDATA',
    description: 'OAM Data Write Register',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-0', description: 'OAM data byte' }
    ],
    notes: ['Write twice for word access']
  },
  
  0x2105: {
    address: 0x2105,
    name: 'BGMODE',
    description: 'BG Mode and Character Size',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: 7, description: 'BG4 tile size', values: { '0': '8x8', '1': '16x16' } },
      { bit: 6, description: 'BG3 tile size', values: { '0': '8x8', '1': '16x16' } },
      { bit: 5, description: 'BG2 tile size', values: { '0': '8x8', '1': '16x16' } },
      { bit: 4, description: 'BG1 tile size', values: { '0': '8x8', '1': '16x16' } },
      { bit: 3, description: 'BG3 priority (Mode 1 only)' },
      { bit: '2-0', description: 'BG mode (0-7)' }
    ],
    examples: [
      'LDA #$01    ; Mode 1: 2 BGs @ 16 colors, 1 BG @ 4 colors',
      'STA $2105',
      'LDA #$09    ; Mode 1 with BG3 priority',
      'STA $2105'
    ]
  },
  
  0x2106: {
    address: 0x2106,
    name: 'MOSAIC',
    description: 'Mosaic Filter Enable and Size',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-4', description: 'Mosaic size', values: { '0': '1x1', 'F': '16x16' } },
      { bit: 3, description: 'BG4 mosaic enable' },
      { bit: 2, description: 'BG3 mosaic enable' },
      { bit: 1, description: 'BG2 mosaic enable' },
      { bit: 0, description: 'BG1 mosaic enable' }
    ]
  },
  
  0x210D: {
    address: 0x210D,
    name: 'BG1HOFS',
    description: 'BG1 Horizontal Scroll Offset',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-0', description: 'Horizontal offset (write twice: low, high)' }
    ],
    notes: ['13-bit value, Mode 7: different format']
  },
  
  0x210E: {
    address: 0x210E,
    name: 'BG1VOFS',
    description: 'BG1 Vertical Scroll Offset',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-0', description: 'Vertical offset (write twice: low, high)' }
    ]
  },
  
  0x210F: {
    address: 0x210F,
    name: 'BG2HOFS',
    description: 'BG2 Horizontal Scroll Offset',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-0', description: 'Horizontal offset (write twice: low, high)' }
    ]
  },
  
  0x2110: {
    address: 0x2110,
    name: 'BG2VOFS',
    description: 'BG2 Vertical Scroll Offset',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-0', description: 'Vertical offset (write twice: low, high)' }
    ]
  },
  
  0x2111: {
    address: 0x2111,
    name: 'BG3HOFS',
    description: 'BG3 Horizontal Scroll Offset',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-0', description: 'Horizontal offset (write twice: low, high)' }
    ]
  },
  
  0x2112: {
    address: 0x2112,
    name: 'BG3VOFS',
    description: 'BG3 Vertical Scroll Offset',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-0', description: 'Vertical offset (write twice: low, high)' }
    ]
  },
  
  0x2115: {
    address: 0x2115,
    name: 'VMAIN',
    description: 'Video Port Control',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: 7, description: 'Increment on high byte', values: { '0': 'low', '1': 'high' } },
      { bit: 6, description: 'Not used' },
      { bit: '5-4', description: 'Address remapping' },
      { bit: '3-2', description: 'Address increment step' },
      { bit: '1-0', description: 'Increment amount', values: { '00': '1', '01': '32', '10': '128', '11': '128' } }
    ]
  },
  
  0x2116: {
    address: 0x2116,
    name: 'VMADDL',
    description: 'VRAM Address Register (Low)',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-0', description: 'VRAM address low byte' }
    ]
  },
  
  0x2117: {
    address: 0x2117,
    name: 'VMADDH',
    description: 'VRAM Address Register (High)',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-0', description: 'VRAM address high byte' }
    ]
  },
  
  0x211C: {
    address: 0x211C,
    name: 'M7B',
    description: 'Mode 7 Matrix Parameter B',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-0', description: 'Matrix B (write twice: low, high)' }
    ]
  },
  
  0x211D: {
    address: 0x211D,
    name: 'M7C',
    description: 'Mode 7 Matrix Parameter C',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-0', description: 'Matrix C (write twice: low, high)' }
    ]
  },
  
  0x211F: {
    address: 0x211F,
    name: 'M7X',
    description: 'Mode 7 Center X',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-0', description: 'Center X (write twice: low, high)' }
    ],
    notes: ['13-bit signed value']
  },
  
  0x2120: {
    address: 0x2120,
    name: 'M7Y',
    description: 'Mode 7 Center Y',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-0', description: 'Center Y (write twice: low, high)' }
    ]
  },
  
  0x2121: {
    address: 0x2121,
    name: 'CGADD',
    description: 'CGRAM Address Register',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-0', description: 'CGRAM word address' }
    ]
  },
  
  0x2123: {
    address: 0x2123,
    name: 'W12SEL',
    description: 'Window Mask Settings BG1/2',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-6', description: 'BG2 window 2', values: { '00': 'disable', '01': 'inside', '10': 'outside', '11': 'outside' } },
      { bit: '5-4', description: 'BG2 window 1' },
      { bit: '3-2', description: 'BG1 window 2' },
      { bit: '1-0', description: 'BG1 window 1' }
    ]
  },
  
  0x2124: {
    address: 0x2124,
    name: 'W34SEL',
    description: 'Window Mask Settings BG3/4',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-6', description: 'BG4 window 2' },
      { bit: '5-4', description: 'BG4 window 1' },
      { bit: '3-2', description: 'BG3 window 2' },
      { bit: '1-0', description: 'BG3 window 1' }
    ]
  },
  
  0x2125: {
    address: 0x2125,
    name: 'WOBJSEL',
    description: 'Window Mask Settings OBJ/Color',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-6', description: 'Color window 2' },
      { bit: '5-4', description: 'Color window 1' },
      { bit: '3-2', description: 'OBJ window 2' },
      { bit: '1-0', description: 'OBJ window 1' }
    ]
  },
  
  0x212C: {
    address: 0x212C,
    name: 'TM',
    description: 'Main Screen Designation',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-5', description: 'Not used' },
      { bit: 4, description: 'OBJ enable' },
      { bit: 3, description: 'BG4 enable' },
      { bit: 2, description: 'BG3 enable' },
      { bit: 1, description: 'BG2 enable' },
      { bit: 0, description: 'BG1 enable' }
    ]
  },
  
  0x212D: {
    address: 0x212D,
    name: 'TS',
    description: 'Sub Screen Designation',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-5', description: 'Not used' },
      { bit: 4, description: 'OBJ enable' },
      { bit: 3, description: 'BG4 enable' },
      { bit: 2, description: 'BG3 enable' },
      { bit: 1, description: 'BG2 enable' },
      { bit: 0, description: 'BG1 enable' }
    ]
  },
  
  0x212E: {
    address: 0x212E,
    name: 'TMW',
    description: 'Window Mask Main Screen',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-5', description: 'Not used' },
      { bit: 4, description: 'OBJ window enable' },
      { bit: 3, description: 'BG4 window enable' },
      { bit: 2, description: 'BG3 window enable' },
      { bit: 1, description: 'BG2 window enable' },
      { bit: 0, description: 'BG1 window enable' }
    ]
  },
  
  0x212F: {
    address: 0x212F,
    name: 'TSW',
    description: 'Window Mask Sub Screen',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-5', description: 'Not used' },
      { bit: 4, description: 'OBJ window enable' },
      { bit: 3, description: 'BG4 window enable' },
      { bit: 2, description: 'BG3 window enable' },
      { bit: 1, description: 'BG2 window enable' },
      { bit: 0, description: 'BG1 window enable' }
    ]
  },
  
  0x2130: {
    address: 0x2130,
    name: 'CGWSEL',
    description: 'Color Addition Select',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: '7-6', description: 'Main screen black level', values: { '00': 'never', '01': 'outside', '10': 'inside' } },
      { bit: '5-4', description: 'Color math enable', values: { '00': 'always', '01': 'outside', '10': 'inside', '11': 'never' } },
      { bit: '3-2', description: 'Not used' },
      { bit: 1, description: 'Add subscreen', values: { '0': 'fixed color', '1': 'subscreen' } },
      { bit: 0, description: 'Direct color mode for 256-color BG' }
    ]
  },
  
  0x2131: {
    address: 0x2131,
    name: 'CGADSUB',
    description: 'Color Math Control',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: 7, description: 'Add/subtract mode', values: { '0': 'add', '1': 'subtract' } },
      { bit: 6, description: 'Half color math' },
      { bit: 5, description: 'Enable color math on backdrop' },
      { bit: 4, description: 'Enable color math on OBJ' },
      { bit: 3, description: 'Enable color math on BG4' },
      { bit: 2, description: 'Enable color math on BG3' },
      { bit: 1, description: 'Enable color math on BG2' },
      { bit: 0, description: 'Enable color math on BG1' }
    ]
  },
  
  0x2132: {
    address: 0x2132,
    name: 'COLDATA',
    description: 'Fixed Color Data',
    access: 'write',
    category: 'ppu',
    bitLayout: [
      { bit: 7, description: 'Blue component' },
      { bit: 6, description: 'Green component' },
      { bit: 5, description: 'Red component' },
      { bit: '4-0', description: 'Color intensity' }
    ],
    notes: ['Write 3 times for R, G, B']
  },
  
  // ===== CPU REGISTERS =====
  
  0x4200: {
    address: 0x4200,
    name: 'NMITIMEN',
    description: 'Interrupt Enable Register',
    access: 'write',
    category: 'cpu',
    bitLayout: [
      { bit: 7, description: 'NMI Enable', values: { '0': 'disable', '1': 'enable' } },
      { bit: 6, description: 'Not used' },
      { bit: '5-4', description: 'IRQ Mode', values: { '00': 'disable', '01': 'IRQ', '10': 'reserved', '11': 'reserved' } },
      { bit: '3-1', description: 'Not used' },
      { bit: 0, description: 'Auto-Joypad Read', values: { '0': 'disable', '1': 'enable' } }
    ],
    notes: ['Enables V-Blank NMI and controller auto-read'],
    examples: [
      'LDA #$81    ; Enable NMI and auto-joypad',
      'STA $4200',
      'LDA #$00    ; Disable all interrupts',
      'STA $4200'
    ]
  },
  
  0x4207: {
    address: 0x4207,
    name: 'HTIMEL',
    description: 'H Timer Low Byte',
    access: 'write',
    category: 'cpu',
    bitLayout: [
      { bit: '7-0', description: 'H Timer low byte' }
    ]
  },
  
  0x4208: {
    address: 0x4208,
    name: 'HTIMEH',
    description: 'H Timer High Byte',
    access: 'write',
    category: 'cpu',
    bitLayout: [
      { bit: '7-0', description: 'H Timer high byte' }
    ]
  },
  
  0x4209: {
    address: 0x4209,
    name: 'VTIMEL',
    description: 'V Timer Low Byte',
    access: 'write',
    category: 'cpu',
    bitLayout: [
      { bit: '7-0', description: 'V Timer low byte' }
    ]
  },
  
  0x420A: {
    address: 0x420A,
    name: 'VTIMEH',
    description: 'V Timer High Byte',
    access: 'write',
    category: 'cpu',
    bitLayout: [
      { bit: '7-0', description: 'V Timer high byte' }
    ]
  },
  
  0x420B: {
    address: 0x420B,
    name: 'MDMAEN',
    description: 'General Purpose DMA Enable',
    access: 'write',
    category: 'dma',
    bitLayout: [
      { bit: '7-0', description: 'DMA channel enable (bit per channel)' }
    ]
  },
  
  0x420C: {
    address: 0x420C,
    name: 'HDMAEN',
    description: 'H-Blank DMA Enable',
    access: 'write',
    category: 'dma',
    bitLayout: [
      { bit: '7-0', description: 'HDMA channel enable (bit per channel)' }
    ]
  },
  
  // ===== APU REGISTERS =====
  
  0x2140: {
    address: 0x2140,
    name: 'APUIO0',
    description: 'APU I/O Port 0',
    access: 'read/write',
    category: 'apu',
    bitLayout: [
      { bit: '7-0', description: 'APU communication port 0' }
    ]
  },
  
  0x2141: {
    address: 0x2141,
    name: 'APUIO1',
    description: 'APU I/O Port 1',
    access: 'read/write',
    category: 'apu',
    bitLayout: [
      { bit: '7-0', description: 'APU communication port 1' }
    ]
  },
  
  0x2142: {
    address: 0x2142,
    name: 'APUIO2',
    description: 'APU I/O Port 2',
    access: 'read/write',
    category: 'apu',
    bitLayout: [
      { bit: '7-0', description: 'APU communication port 2' }
    ]
  },
  
  0x2143: {
    address: 0x2143,
    name: 'APUIO3',
    description: 'APU I/O Port 3',
    access: 'read/write',
    category: 'apu',
    bitLayout: [
      { bit: '7-0', description: 'APU communication port 3' }
    ]
  }
};

// =====================================================================
// UTILITY FUNCTIONS FOR VALIDATION
// =====================================================================

/**
 * Validate an instruction against the reference database
 */
export function validateInstruction(opcode: number, expectedMnemonic?: string, expectedBytes?: number): {
  isValid: boolean;
  reference?: InstructionReference;
  discrepancies: string[];
} {
  const reference = INSTRUCTION_REFERENCE[opcode];
  const discrepancies: string[] = [];
  
  if (!reference) {
    return {
      isValid: false,
      discrepancies: [`Unknown opcode: $${opcode.toString(16).toUpperCase().padStart(2, '0')}`]
    };
  }
  
  if (expectedMnemonic && reference.mnemonic !== expectedMnemonic) {
    discrepancies.push(`Mnemonic mismatch: expected ${expectedMnemonic}, got ${reference.mnemonic}`);
  }
  
  if (expectedBytes && reference.bytes !== expectedBytes) {
    discrepancies.push(`Byte count mismatch: expected ${expectedBytes}, got ${reference.bytes}`);
  }
  
  return {
    isValid: discrepancies.length === 0,
    reference,
    discrepancies
  };
}

/**
 * Validate a register access against the reference database
 */
export function validateRegister(address: number, operation: 'read' | 'write'): {
  isValid: boolean;
  reference?: RegisterReference;
  warnings: string[];
} {
  const reference = REGISTER_REFERENCE[address];
  const warnings: string[] = [];
  
  if (!reference) {
    return {
      isValid: false,
      warnings: [`Unknown register: $${address.toString(16).toUpperCase().padStart(4, '0')}`]
    };
  }
  
  // Check access permissions
  if (reference.access === 'read' && operation === 'write') {
    warnings.push(`${reference.name} ($${address.toString(16).toUpperCase().padStart(4, '0')}) is read-only`);
  } else if (reference.access === 'write' && operation === 'read') {
    warnings.push(`${reference.name} ($${address.toString(16).toUpperCase().padStart(4, '0')}) is write-only`);
  }
  
  return {
    isValid: true,
    reference,
    warnings
  };
}

/**
 * Get register name and description for a given address
 */
export function getRegisterInfo(address: number): {
  name?: string;
  description?: string;
  category?: string;
  bitDescription?: string;
} {
  const reference = REGISTER_REFERENCE[address];
  if (!reference) {
    return {};
  }
  
  const bitDescription = reference.bitLayout
    .map(bit => `Bit ${bit.bit}: ${bit.description}`)
    .join(', ');
  
  return {
    name: reference.name,
    description: reference.description,
    category: reference.category,
    bitDescription
  };
}

/**
 * Generate enhanced instruction comment with reference data
 */
export function generateInstructionComment(opcode: number, _operand?: number): string {
  const reference = INSTRUCTION_REFERENCE[opcode];
  if (!reference) {
    return '';
  }
  
  let comment = `${reference.mnemonic} - ${reference.description}`;
  
  if (reference.cycles) {
    comment += ` (${reference.cycles} cycles)`;
  }
  
  if (reference.flagsAffected && reference.flagsAffected.length > 0) {
    comment += ` [${reference.flagsAffected.join(',')}]`;
  }
  
  return comment;
}

/**
 * Generate enhanced register comment with reference data
 */
export function generateRegisterComment(address: number, operation: 'read' | 'write'): string {
  const reference = REGISTER_REFERENCE[address];
  if (!reference) {
    return '';
  }
  
  let comment = `${reference.name} - ${reference.description}`;
  
  if (reference.access !== 'read/write') {
    comment += ` (${reference.access}-only)`;
  }
  
  // Add bit layout summary for write operations
  if (operation === 'write' && reference.bitLayout.length > 0) {
    const importantBits = reference.bitLayout
      .filter(bit => typeof bit.bit === 'number' && bit.values)
      .slice(0, 2); // Show first 2 important bits
    
    if (importantBits.length > 0) {
      const bitDesc = importantBits
        .map(bit => `Bit ${bit.bit}: ${bit.description}`)
        .join(', ');
      comment += ` [${bitDesc}]`;
    }
  }
  
  return comment;
}