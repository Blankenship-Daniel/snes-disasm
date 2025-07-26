/**
 * SNES Cartridge Types and Memory Mapping System
 * Based on research from SNES MCP servers and hardware documentation
 */
export declare enum CartridgeType {
    LoROM = "LoROM",
    HiROM = "HiROM",
    ExLoROM = "ExLoROM",// Extended LoROM (up to 32MB)
    ExHiROM = "ExHiROM",// Extended HiROM (up to 64MB)
    SA1 = "SA-1",// Super Accelerator 1
    SuperFX = "SuperFX",// Graphics Support Unit
    DSP1 = "DSP-1",// Digital Signal Processor 1
    DSP2 = "DSP-2",// Digital Signal Processor 2
    DSP3 = "DSP-3",// Digital Signal Processor 3
    DSP4 = "DSP-4",// Digital Signal Processor 4
    CX4 = "CX4",// Capcom CX4 math coprocessor
    ST010 = "ST010",// Seta ST010 graphics processor
    ST011 = "ST011",// Seta ST011 graphics processor
    SPC7110 = "SPC7110",// Data decompression chip
    SDD1 = "S-DD1",// Data decompression chip
    SRTC = "S-RTC",// Real-time clock
    OBC1 = "OBC-1",// Metal Combat support chip
    BSX = "BSX",// Satellaview cartridges
    MSU1 = "MSU-1",// Audio enhancement
    Unknown = "Unknown"
}
export declare enum MemorySpeed {
    SlowROM = "SlowROM",// 2.68 MHz (120ns)
    FastROM = "FastROM"
}
export interface MemoryRegion {
    start: number;
    end: number;
    type: 'ROM' | 'RAM' | 'SRAM' | 'IO' | 'OPEN_BUS';
    readable: boolean;
    writable: boolean;
    size: number;
    speed: MemorySpeed;
    description: string;
}
export interface CartridgeInfo {
    type: CartridgeType;
    mapMode: number;
    romSize: number;
    ramSize: number;
    hasBattery: boolean;
    hasRTC: boolean;
    speed: MemorySpeed;
    regions: MemoryRegion[];
    specialChip?: string;
}
/**
 * Detect cartridge type from ROM header information
 */
export declare function detectCartridgeType(mapMode: number, cartridgeType: number): CartridgeType;
/**
 * Get memory speed from map mode
 */
export declare function getMemorySpeed(mapMode: number): MemorySpeed;
/**
 * Check if cartridge has battery-backed SRAM
 */
export declare function hasBatteryBackup(cartridgeType: number): boolean;
/**
 * Get SRAM size from ROM header
 */
export declare function getSRAMSize(ramSize: number): number;
/**
 * Create memory region layout for cartridge type
 */
export declare function createMemoryLayout(cartridgeInfo: CartridgeInfo): MemoryRegion[];
//# sourceMappingURL=cartridge-types.d.ts.map