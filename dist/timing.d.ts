import { Instruction, CycleInfo, TimingContext } from './types';
import { MemorySpeed } from './cartridge-types';
/**
 * Calculate the actual cycle count for an instruction based on processor state and memory timing
 */
export declare function calculateCycles(instruction: Instruction, context?: TimingContext): number;
/**
 * Determine if an address is in FastROM region
 */
export declare function isFastROM(address: number, cartridgeSpeed: MemorySpeed): boolean;
/**
 * Get memory access timing based on address and cartridge type
 */
export declare function getMemoryTiming(address: number, cartridgeSpeed: MemorySpeed): MemorySpeed;
/**
 * Update an instruction with dynamic cycle information
 */
export declare function createCycleInfo(base: number, options?: Partial<CycleInfo>): CycleInfo;
//# sourceMappingURL=timing.d.ts.map