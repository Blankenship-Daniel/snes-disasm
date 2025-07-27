import { ProcessorFlags } from './types';
/**
 * Create default processor flags for power-on state
 */
export declare function createDefaultFlags(): ProcessorFlags;
/**
 * Apply REP instruction - reset (clear) specified flag bits
 */
export declare function applyREP(flags: ProcessorFlags, operand: number): ProcessorFlags;
/**
 * Apply SEP instruction - set specified flag bits
 */
export declare function applySEP(flags: ProcessorFlags, operand: number): ProcessorFlags;
//# sourceMappingURL=processor-flags.d.ts.map