import { ProcessorFlags } from './types';
/**
 * Create default processor flags for power-on state
 */
export declare function createDefaultFlags(): ProcessorFlags;
/**
 * Convert processor flags to P register byte value
 */
export declare function flagsToByte(flags: ProcessorFlags): number;
/**
 * Convert P register byte value to processor flags
 */
export declare function byteToFlags(p: number, existingFlags?: ProcessorFlags): ProcessorFlags;
/**
 * Apply REP instruction - reset (clear) specified flag bits
 */
export declare function applyREP(flags: ProcessorFlags, operand: number): ProcessorFlags;
/**
 * Apply SEP instruction - set specified flag bits
 */
export declare function applySEP(flags: ProcessorFlags, operand: number): ProcessorFlags;
/**
 * Get a human-readable description of flag changes
 */
export declare function describeFlagChanges(oldFlags: ProcessorFlags, newFlags: ProcessorFlags): string[];
/**
 * Format flags for display (similar to debugger format)
 */
export declare function formatFlags(flags: ProcessorFlags): string;
//# sourceMappingURL=processor-flags.d.ts.map