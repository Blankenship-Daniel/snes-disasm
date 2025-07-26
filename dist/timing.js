"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCycles = calculateCycles;
exports.isFastROM = isFastROM;
exports.getMemoryTiming = getMemoryTiming;
exports.createCycleInfo = createCycleInfo;
const types_1 = require("./types");
const cartridge_types_1 = require("./cartridge-types");
/**
 * Calculate the actual cycle count for an instruction based on processor state and memory timing
 */
function calculateCycles(instruction, context) {
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
function crossesPageBoundary(instructionAddress, operandAddress, mode) {
    switch (mode) {
        case types_1.AddressingMode.AbsoluteX:
        case types_1.AddressingMode.AbsoluteY:
        case types_1.AddressingMode.DirectIndirectY:
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
function getIndexOffset(mode) {
    // This would need to be calculated based on actual register values
    // For now, return 1 as a conservative estimate
    return 1;
}
/**
 * Determine if an address is in FastROM region
 */
function isFastROM(address, cartridgeSpeed) {
    // If cartridge doesn't support FastROM, return false
    if (cartridgeSpeed === cartridge_types_1.MemorySpeed.SlowROM) {
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
function getMemoryTiming(address, cartridgeSpeed) {
    if (isFastROM(address, cartridgeSpeed)) {
        return cartridge_types_1.MemorySpeed.FastROM;
    }
    return cartridge_types_1.MemorySpeed.SlowROM;
}
/**
 * Update an instruction with dynamic cycle information
 */
function createCycleInfo(base, options = {}) {
    return {
        base,
        ...options
    };
}
//# sourceMappingURL=timing.js.map