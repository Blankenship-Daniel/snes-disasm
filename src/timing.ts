import { Instruction, CycleInfo, TimingContext, AddressingMode } from './types';
import { MemorySpeed } from './cartridge-types';

/**
 * Calculate the actual cycle count for an instruction based on processor state and memory timing
 */
export function calculateCycles(instruction: Instruction, context?: TimingContext): number {
  const cycles = instruction.cycles;
  
  // If it's a simple number, return it as-is (legacy support)
  if (typeof cycles === 'number') {
    return cycles;
  }
  
  // If no timing context provided, return base cycles
  if (!context) {
    return cycles.base;
  }
  
  let totalCycles = cycles.base;
  
  // Add cycles for 16-bit accumulator operations (M flag = 0)
  if (cycles.m16 && !context.flags.m) {
    totalCycles += cycles.m16;
  }
  
  // Add cycles for 16-bit index operations (X flag = 0)
  if (cycles.x16 && !context.flags.x) {
    totalCycles += cycles.x16;
  }
  
  // Add cycles for page boundary crossing
  if (cycles.pageBoundary && context.operandAddress) {
    if (crossesPageBoundary(context.address, context.operandAddress, instruction.addressingMode)) {
      totalCycles += cycles.pageBoundary;
    }
  }
  
  // Add cycles for memory access timing (FastROM vs SlowROM)
  if (cycles.memoryAccess) {
    if (!context.fastROM) {
      totalCycles += cycles.memoryAccess;
    }
  }
  
  return totalCycles;
}

/**
 * Check if an instruction crosses a page boundary
 */
function crossesPageBoundary(instructionAddress: number, operandAddress: number, mode: AddressingMode): boolean {
  switch (mode) {
    case AddressingMode.AbsoluteX:
    case AddressingMode.AbsoluteY:
    case AddressingMode.DirectIndirectY:
      // These modes can cross page boundaries
      const page1 = (operandAddress & 0xFF00);
      const page2 = ((operandAddress + getIndexOffset(mode)) & 0xFF00);
      return page1 !== page2;
    
    default:
      return false;
  }
}

/**
 * Get the index offset for addressing modes that use index registers
 */
function getIndexOffset(mode: AddressingMode): number {
  // This would need to be calculated based on actual register values
  // For now, return 1 as a conservative estimate
  return 1;
}

/**
 * Determine if an address is in FastROM region
 */
export function isFastROM(address: number, cartridgeSpeed: MemorySpeed): boolean {
  // If cartridge doesn't support FastROM, return false
  if (cartridgeSpeed === MemorySpeed.SlowROM) {
    return false;
  }
  
  // FastROM regions (when supported):
  // LoROM: Banks $80-$FF at $8000-$FFFF
  // HiROM: Banks $80-$FF (all addresses)
  const bank = (address >> 16) & 0xFF;
  const offset = address & 0xFFFF;
  
  // FastROM mirror regions
  if (bank >= 0x80) {
    return true; // FastROM mirror banks
  }
  
  return false; // SlowROM regions
}

/**
 * Get memory access timing based on address and cartridge type
 */
export function getMemoryTiming(address: number, cartridgeSpeed: MemorySpeed): MemorySpeed {
  if (isFastROM(address, cartridgeSpeed)) {
    return MemorySpeed.FastROM;
  }
  return MemorySpeed.SlowROM;
}

/**
 * Update an instruction with dynamic cycle information
 */
export function createCycleInfo(base: number, options: Partial<CycleInfo> = {}): CycleInfo {
  return {
    base,
    ...options
  };
}