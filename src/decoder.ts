import { Instruction, AddressingMode, DisassemblyLine, ProcessorFlags } from './types';
import { INSTRUCTION_SET } from './instructions';
import { createDefaultFlags, applyREP, applySEP } from './processor-flags';

export class InstructionDecoder {
  private flags: ProcessorFlags = createDefaultFlags();

  // Legacy compatibility
  private get mFlag(): boolean {
    return this.flags.m;
  }
  private get xFlag(): boolean {
    return this.flags.x;
  }

  setFlags(m: boolean, x: boolean): void {
    this.flags.m = m;
    this.flags.x = x;
  }

  getFlags(): ProcessorFlags {
    return { ...this.flags };
  }

  setProcessorFlags(flags: ProcessorFlags): void {
    this.flags = { ...flags };
  }

  decode(data: Buffer, offset: number, address: number): DisassemblyLine | null {
    if (offset >= data.length) {
      return null;
    }

    const opcode = data[offset];
    const instruction = INSTRUCTION_SET.get(opcode);

    if (!instruction) {
      // Unknown instruction - treat as data byte
      return {
        address,
        bytes: [opcode],
        instruction: {
          opcode,
          mnemonic: 'DB',
          addressingMode: AddressingMode.Immediate,
          bytes: 1,
          cycles: 0
        },
        operand: opcode
      };
    }

    // Adjust instruction byte count based on processor flags
    let actualBytes = instruction.bytes;
    const bytes: number[] = [opcode];
    let operand: number | undefined;

    // Handle variable-length instructions based on M and X flags
    if (instruction.addressingMode === AddressingMode.Immediate) {
      // Accumulator/memory operations depend on M flag
      if (instruction.mnemonic === 'LDA' || instruction.mnemonic === 'ADC' ||
          instruction.mnemonic === 'SBC' || instruction.mnemonic === 'CMP' ||
          instruction.mnemonic === 'AND' || instruction.mnemonic === 'ORA' ||
          instruction.mnemonic === 'EOR' || instruction.mnemonic === 'BIT') {
        actualBytes = this.mFlag ? 2 : 3; // 8-bit vs 16-bit accumulator
      }
      // Index operations depend on X flag
      else if (instruction.mnemonic === 'LDX' || instruction.mnemonic === 'LDY' ||
               instruction.mnemonic === 'CPX' || instruction.mnemonic === 'CPY') {
        actualBytes = this.xFlag ? 2 : 3; // 8-bit vs 16-bit index
      }
    }

    // Read operand bytes
    for (let i = 1; i < actualBytes && (offset + i) < data.length; i++) {
      bytes.push(data[offset + i]);
    }

    // Calculate operand value
    if (actualBytes > 1) {
      switch (actualBytes) {
      case 2:
        operand = bytes[1];
        break;
      case 3:
        if (instruction.addressingMode === AddressingMode.RelativeLong) {
          // 16-bit signed relative
          operand = bytes[1] | (bytes[2] << 8);
          if (operand & 0x8000) {
            operand = operand - 0x10000; // Convert to signed
          }
        } else {
          operand = bytes[1] | (bytes[2] << 8);
        }
        break;
      case 4:
        operand = bytes[1] | (bytes[2] << 8) | (bytes[3] << 16);
        break;
      }
    }

    // Handle relative addressing - calculate target address
    if (instruction.addressingMode === AddressingMode.Relative) {
      const displacement = operand! > 127 ? operand! - 256 : operand!;
      operand = (address + actualBytes + displacement) & 0xFFFF;
    } else if (instruction.addressingMode === AddressingMode.RelativeLong) {
      operand = (address + actualBytes + operand!) & 0xFFFFFF;
    }

    // Update processor flags for REP/SEP instructions
    if (instruction.mnemonic === 'REP' && operand !== undefined) {
      this.flags = applyREP(this.flags, operand);
    } else if (instruction.mnemonic === 'SEP' && operand !== undefined) {
      this.flags = applySEP(this.flags, operand);
    }

    return {
      address,
      bytes,
      instruction: {
        ...instruction,
        bytes: actualBytes
      },
      operand
    };
  }

  formatOperand(line: DisassemblyLine): string {
    const { instruction, operand } = line;

    if (operand === undefined) {
      return '';
    }

    switch (instruction.addressingMode) {
    case AddressingMode.Implied:
      return '';

    case AddressingMode.Accumulator:
      return 'A';

    case AddressingMode.Immediate:
      if (instruction.bytes === 2) {
        return `#$${operand.toString(16).toUpperCase().padStart(2, '0')}`;
      } else {
        return `#$${operand.toString(16).toUpperCase().padStart(4, '0')}`;
      }

    case AddressingMode.ZeroPage:
    case AddressingMode.Direct:
      return `$${operand.toString(16).toUpperCase().padStart(2, '0')}`;

    case AddressingMode.ZeroPageX:
    case AddressingMode.DirectX:
      return `$${operand.toString(16).toUpperCase().padStart(2, '0')},X`;

    case AddressingMode.ZeroPageY:
    case AddressingMode.DirectY:
      return `$${operand.toString(16).toUpperCase().padStart(2, '0')},Y`;

    case AddressingMode.Absolute:
      return `$${operand.toString(16).toUpperCase().padStart(4, '0')}`;

    case AddressingMode.AbsoluteX:
      return `$${operand.toString(16).toUpperCase().padStart(4, '0')},X`;

    case AddressingMode.AbsoluteY:
      return `$${operand.toString(16).toUpperCase().padStart(4, '0')},Y`;

    case AddressingMode.AbsoluteLong:
      return `$${operand.toString(16).toUpperCase().padStart(6, '0')}`;

    case AddressingMode.AbsoluteLongX:
      return `$${operand.toString(16).toUpperCase().padStart(6, '0')},X`;

    case AddressingMode.DirectIndirect:
      return `($${operand.toString(16).toUpperCase().padStart(2, '0')})`;

    case AddressingMode.DirectIndirectX:
      return `($${operand.toString(16).toUpperCase().padStart(2, '0')},X)`;

    case AddressingMode.DirectIndirectY:
      return `($${operand.toString(16).toUpperCase().padStart(2, '0')}),Y`;

    case AddressingMode.DirectIndirectLongY:
      return `[$${operand.toString(16).toUpperCase().padStart(2, '0')}],Y`;

    case AddressingMode.AbsoluteIndirect:
      return `($${operand.toString(16).toUpperCase().padStart(4, '0')})`;

    case AddressingMode.AbsoluteIndirectLong:
      return `[$${operand.toString(16).toUpperCase().padStart(4, '0')}]`;

    case AddressingMode.AbsoluteIndexedIndirect:
      return `($${operand.toString(16).toUpperCase().padStart(4, '0')},X)`;

    case AddressingMode.Relative:
      return `$${operand.toString(16).toUpperCase().padStart(4, '0')}`;

    case AddressingMode.RelativeLong:
      return `$${operand.toString(16).toUpperCase().padStart(6, '0')}`;

    case AddressingMode.StackRelative:
      return `$${operand.toString(16).toUpperCase().padStart(2, '0')},S`;

    case AddressingMode.StackRelativeIndirectIndexed:
      return `($${operand.toString(16).toUpperCase().padStart(2, '0')},S),Y`;

    case AddressingMode.BlockMove:
      const srcBank = (operand >> 8) & 0xFF;
      const destBank = operand & 0xFF;
      return `$${srcBank.toString(16).toUpperCase().padStart(2, '0')},$${destBank.toString(16).toUpperCase().padStart(2, '0')}`;

    default:
      return `$${operand.toString(16).toUpperCase()}`;
    }
  }
}