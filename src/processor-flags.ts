import { ProcessorFlags } from './types';

/**
 * Create default processor flags for power-on state
 */
export function createDefaultFlags(): ProcessorFlags {
  return {
    n: false,
    v: false,
    m: true,  // Start in 8-bit mode
    x: true,  // Start in 8-bit mode
    d: false,
    i: true,  // Interrupts disabled on reset
    z: false,
    c: false,
    emulation: true  // Start in emulation mode
  };
}

/**
 * Convert processor flags to P register byte value
 */
export function flagsToByte(flags: ProcessorFlags): number {
  let p = 0;
  if (flags.n) p |= 0x80; // Bit 7
  if (flags.v) p |= 0x40; // Bit 6
  if (flags.m) p |= 0x20; // Bit 5
  if (flags.x) p |= 0x10; // Bit 4
  if (flags.d) p |= 0x08; // Bit 3
  if (flags.i) p |= 0x04; // Bit 2
  if (flags.z) p |= 0x02; // Bit 1
  if (flags.c) p |= 0x01; // Bit 0
  return p;
}

/**
 * Convert P register byte value to processor flags
 */
export function byteToFlags(p: number, existingFlags?: ProcessorFlags): ProcessorFlags {
  return {
    n: (p & 0x80) !== 0,
    v: (p & 0x40) !== 0,
    m: (p & 0x20) !== 0,
    x: (p & 0x10) !== 0,
    d: (p & 0x08) !== 0,
    i: (p & 0x04) !== 0,
    z: (p & 0x02) !== 0,
    c: (p & 0x01) !== 0,
    emulation: existingFlags?.emulation ?? true
  };
}

/**
 * Apply REP instruction - reset (clear) specified flag bits
 */
export function applyREP(flags: ProcessorFlags, operand: number): ProcessorFlags {
  const newFlags = { ...flags };
  
  if (operand & 0x80) newFlags.n = false; // Clear N flag
  if (operand & 0x40) newFlags.v = false; // Clear V flag
  if (operand & 0x20) newFlags.m = false; // Clear M flag (16-bit accumulator)
  if (operand & 0x10) newFlags.x = false; // Clear X flag (16-bit index)
  if (operand & 0x08) newFlags.d = false; // Clear D flag
  if (operand & 0x04) newFlags.i = false; // Clear I flag
  if (operand & 0x02) newFlags.z = false; // Clear Z flag
  if (operand & 0x01) newFlags.c = false; // Clear C flag
  
  return newFlags;
}

/**
 * Apply SEP instruction - set specified flag bits
 */
export function applySEP(flags: ProcessorFlags, operand: number): ProcessorFlags {
  const newFlags = { ...flags };
  
  if (operand & 0x80) newFlags.n = true; // Set N flag
  if (operand & 0x40) newFlags.v = true; // Set V flag
  if (operand & 0x20) newFlags.m = true; // Set M flag (8-bit accumulator)
  if (operand & 0x10) newFlags.x = true; // Set X flag (8-bit index)
  if (operand & 0x08) newFlags.d = true; // Set D flag
  if (operand & 0x04) newFlags.i = true; // Set I flag
  if (operand & 0x02) newFlags.z = true; // Set Z flag
  if (operand & 0x01) newFlags.c = true; // Set C flag
  
  return newFlags;
}

/**
 * Get a human-readable description of flag changes
 */
export function describeFlagChanges(oldFlags: ProcessorFlags, newFlags: ProcessorFlags): string[] {
  const changes: string[] = [];
  
  if (oldFlags.n !== newFlags.n) {
    changes.push(`N: ${newFlags.n ? 'set' : 'clear'}`);
  }
  if (oldFlags.v !== newFlags.v) {
    changes.push(`V: ${newFlags.v ? 'set' : 'clear'}`);
  }
  if (oldFlags.m !== newFlags.m) {
    changes.push(`M: ${newFlags.m ? '8-bit' : '16-bit'} accumulator`);
  }
  if (oldFlags.x !== newFlags.x) {
    changes.push(`X: ${newFlags.x ? '8-bit' : '16-bit'} index`);
  }
  if (oldFlags.d !== newFlags.d) {
    changes.push(`D: ${newFlags.d ? 'decimal' : 'binary'} mode`);
  }
  if (oldFlags.i !== newFlags.i) {
    changes.push(`I: interrupts ${newFlags.i ? 'disabled' : 'enabled'}`);
  }
  if (oldFlags.z !== newFlags.z) {
    changes.push(`Z: ${newFlags.z ? 'set' : 'clear'}`);
  }
  if (oldFlags.c !== newFlags.c) {
    changes.push(`C: ${newFlags.c ? 'set' : 'clear'}`);
  }
  
  return changes;
}

/**
 * Format flags for display (similar to debugger format)
 */
export function formatFlags(flags: ProcessorFlags): string {
  return [
    flags.n ? 'N' : 'n',
    flags.v ? 'V' : 'v',
    flags.m ? 'M' : 'm',
    flags.x ? 'X' : 'x',
    flags.d ? 'D' : 'd',
    flags.i ? 'I' : 'i',
    flags.z ? 'Z' : 'z',
    flags.c ? 'C' : 'c'
  ].join('');
}