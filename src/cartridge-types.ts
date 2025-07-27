/**
 * SNES Cartridge Types and Memory Mapping System
 * Based on research from SNES MCP servers and hardware documentation
 */

export enum CartridgeType {
  // Basic mapping modes
  LoROM = 'LoROM',
  HiROM = 'HiROM',
  
  // Extended mapping modes
  ExLoROM = 'ExLoROM',        // Extended LoROM (up to 32MB)
  ExHiROM = 'ExHiROM',        // Extended HiROM (up to 64MB)
  
  // Special chip cartridges
  SA1 = 'SA-1',               // Super Accelerator 1
  SuperFX = 'SuperFX',        // Graphics Support Unit
  DSP1 = 'DSP-1',             // Digital Signal Processor 1
  DSP2 = 'DSP-2',             // Digital Signal Processor 2
  DSP3 = 'DSP-3',             // Digital Signal Processor 3
  DSP4 = 'DSP-4',             // Digital Signal Processor 4
  CX4 = 'CX4',                // Capcom CX4 math coprocessor
  ST010 = 'ST010',            // Seta ST010 graphics processor
  ST011 = 'ST011',            // Seta ST011 graphics processor
  SPC7110 = 'SPC7110',        // Data decompression chip
  SDD1 = 'S-DD1',             // Data decompression chip
  SRTC = 'S-RTC',             // Real-time clock
  OBC1 = 'OBC-1',             // Metal Combat support chip
  
  // Special formats
  BSX = 'BSX',                // Satellaview cartridges
  MSU1 = 'MSU-1',             // Audio enhancement
  
  // Unknown/custom
  Unknown = 'Unknown'
}

export enum MemorySpeed {
  SlowROM = 'SlowROM',        // 2.68 MHz (120ns)
  FastROM = 'FastROM'         // 3.58 MHz (200ns)
}

export interface MemoryRegion {
  start: number;              // Start address (24-bit)
  end: number;                // End address (24-bit)
  type: 'ROM' | 'RAM' | 'SRAM' | 'IO' | 'OPEN_BUS';
  readable: boolean;
  writable: boolean;
  size: number;               // Size in bytes
  speed: MemorySpeed;
  description: string;
}

export interface CartridgeInfo {
  type: CartridgeType;
  mapMode: number;            // From ROM header byte $FFD5
  romSize: number;            // Size in KB
  ramSize: number;            // SRAM size in KB
  hasBattery: boolean;        // Battery-backed SRAM
  hasRTC: boolean;            // Real-time clock
  speed: MemorySpeed;
  regions: MemoryRegion[];    // Memory layout
  specialChip?: string;       // Special chip identifier
}

/**
 * Detect cartridge type from ROM header information
 */
export function detectCartridgeType(mapMode: number, cartridgeType: number): CartridgeType {
  // Map mode byte format: xSSSpppp
  // x = unused, SSS = speed (0=SlowROM, 1=FastROM), pppp = map mode
  const mapType = mapMode & 0x0F;
  const romSpeed = (mapMode & 0x30) >> 4;
  
  // Check for special chips first (based on cartridge type byte)
  switch (cartridgeType) {
    case 0x03: return CartridgeType.DSP1;
    case 0x05: return CartridgeType.DSP2;
    case 0x06: return CartridgeType.DSP3;
    case 0x0A: return CartridgeType.DSP4;
    case 0x13: case 0x14: case 0x15: case 0x1A: return CartridgeType.SuperFX;
    case 0x34: case 0x35: return CartridgeType.SA1;
    case 0x43: case 0x45: return CartridgeType.SDD1;
    case 0x55: return CartridgeType.SRTC;
    case 0xE3: return CartridgeType.BSX;        // BSX satellaview
    case 0xE5: return CartridgeType.BSX;        // BSX satellaview with memory pack
    case 0xF3: return CartridgeType.CX4;
    case 0xF5: return CartridgeType.ST010;
    case 0xF6: return CartridgeType.ST011;
    case 0xF9: return CartridgeType.SPC7110;
    case 0xFE: return CartridgeType.MSU1;       // MSU-1 audio enhancement
  }
  
  // Standard mapping modes
  switch (mapType) {
    case 0x0: return CartridgeType.LoROM;
    case 0x1: return CartridgeType.HiROM;
    case 0x2: return CartridgeType.LoROM;      // LoROM + S-DD1
    case 0x3: return CartridgeType.LoROM;      // LoROM + SA-1
    case 0x4: return CartridgeType.ExLoROM;    // Extended LoROM
    case 0x5: return CartridgeType.ExHiROM;    // Extended HiROM
    case 0xA: return CartridgeType.HiROM;      // HiROM + FastROM
    default: return CartridgeType.Unknown;
  }
}

/**
 * Get memory speed from map mode
 */
export function getMemorySpeed(mapMode: number): MemorySpeed {
  const speed = (mapMode & 0x30) >> 4;
  return speed === 1 ? MemorySpeed.FastROM : MemorySpeed.SlowROM;
}

/**
 * Check if cartridge has battery-backed SRAM
 */
export function hasBatteryBackup(cartridgeType: number): boolean {
  // Cartridge type values that indicate battery backup
  const batteryTypes = [0x02, 0x05, 0x06, 0x09, 0x0A, 0x13, 0x14, 0x15, 0x1A, 0x35, 0x45, 0x55];
  return batteryTypes.includes(cartridgeType);
}

/**
 * Get SRAM size from ROM header
 */
export function getSRAMSize(ramSize: number): number {
  if (ramSize === 0) return 0;
  return 1024 << ramSize; // 2^ramSize KB
}

/**
 * Create memory region layout for cartridge type
 */
export function createMemoryLayout(cartridgeInfo: CartridgeInfo): MemoryRegion[] {
  const regions: MemoryRegion[] = [];
  
  switch (cartridgeInfo.type) {
    case CartridgeType.LoROM:
      regions.push(...createLoROMLayout(cartridgeInfo));
      break;
    case CartridgeType.HiROM:
      regions.push(...createHiROMLayout(cartridgeInfo));
      break;
    case CartridgeType.ExLoROM:
      regions.push(...createExLoROMLayout(cartridgeInfo));
      break;
    case CartridgeType.ExHiROM:
      regions.push(...createExHiROMLayout(cartridgeInfo));
      break;
    case CartridgeType.SA1:
      regions.push(...createSA1Layout(cartridgeInfo));
      break;
    case CartridgeType.SuperFX:
      regions.push(...createSuperFXLayout(cartridgeInfo));
      break;
    case CartridgeType.BSX:
      regions.push(...createBSXLayout(cartridgeInfo));
      break;
    case CartridgeType.MSU1:
      regions.push(...createMSU1Layout(cartridgeInfo));
      break;
    default:
      // Default to LoROM layout for unknown types
      regions.push(...createLoROMLayout(cartridgeInfo));
      break;
  }
  
  return regions;
}

function createLoROMLayout(info: CartridgeInfo): MemoryRegion[] {
  const regions: MemoryRegion[] = [];
  
  // Banks 00-7F: ROM at $8000-$FFFF (32KB per bank)
  for (let bank = 0x00; bank <= 0x7F; bank++) {
    regions.push({
      start: (bank << 16) | 0x8000,
      end: (bank << 16) | 0xFFFF,
      type: 'ROM',
      readable: true,
      writable: false,
      size: 0x8000,
      speed: info.speed,
      description: `Bank ${bank.toString(16).toUpperCase()} ROM`
    });
  }
  
  // Banks 80-FF: Mirror of banks 00-7F
  for (let bank = 0x80; bank <= 0xFF; bank++) {
    regions.push({
      start: (bank << 16) | 0x8000,
      end: (bank << 16) | 0xFFFF,
      type: 'ROM',
      readable: true,
      writable: false,
      size: 0x8000,
      speed: MemorySpeed.FastROM, // FastROM region
      description: `Bank ${bank.toString(16).toUpperCase()} ROM (FastROM mirror)`
    });
  }
  
  // SRAM if present
  if (info.ramSize > 0) {
    regions.push({
      start: 0x700000,
      end: 0x7FFFFF,
      type: 'SRAM',
      readable: true,
      writable: true,
      size: info.ramSize * 1024,
      speed: MemorySpeed.SlowROM,
      description: 'SRAM'
    });
  }
  
  return regions;
}

function createHiROMLayout(info: CartridgeInfo): MemoryRegion[] {
  const regions: MemoryRegion[] = [];
  
  // Banks 00-3F: ROM at $8000-$FFFF (32KB per bank)
  for (let bank = 0x00; bank <= 0x3F; bank++) {
    regions.push({
      start: (bank << 16) | 0x8000,
      end: (bank << 16) | 0xFFFF,
      type: 'ROM',
      readable: true,
      writable: false,
      size: 0x8000,
      speed: info.speed,
      description: `Bank ${bank.toString(16).toUpperCase()} ROM`
    });
  }
  
  // Banks 40-7F: ROM (64KB per bank)
  for (let bank = 0x40; bank <= 0x7F; bank++) {
    regions.push({
      start: (bank << 16),
      end: (bank << 16) | 0xFFFF,
      type: 'ROM',
      readable: true,
      writable: false,
      size: 0x10000,
      speed: info.speed,
      description: `Bank ${bank.toString(16).toUpperCase()} ROM`
    });
  }
  
  // Banks 80-BF: Mirror of banks 00-3F
  for (let bank = 0x80; bank <= 0xBF; bank++) {
    regions.push({
      start: (bank << 16) | 0x8000,
      end: (bank << 16) | 0xFFFF,
      type: 'ROM',
      readable: true,
      writable: false,
      size: 0x8000,
      speed: MemorySpeed.FastROM,
      description: `Bank ${bank.toString(16).toUpperCase()} ROM (FastROM mirror)`
    });
  }
  
  // Banks C0-FF: Mirror of banks 40-7F
  for (let bank = 0xC0; bank <= 0xFF; bank++) {
    regions.push({
      start: (bank << 16),
      end: (bank << 16) | 0xFFFF,
      type: 'ROM',
      readable: true,
      writable: false,
      size: 0x10000,
      speed: MemorySpeed.FastROM,
      description: `Bank ${bank.toString(16).toUpperCase()} ROM (FastROM mirror)`
    });
  }
  
  // SRAM if present (banks 20-3F at $6000-$7FFF)
  if (info.ramSize > 0) {
    for (let bank = 0x20; bank <= 0x3F; bank++) {
      regions.push({
        start: (bank << 16) | 0x6000,
        end: (bank << 16) | 0x7FFF,
        type: 'SRAM',
        readable: true,
        writable: true,
        size: 0x2000,
        speed: MemorySpeed.SlowROM,
        description: `Bank ${bank.toString(16).toUpperCase()} SRAM`
      });
    }
  }
  
  return regions;
}

function createExLoROMLayout(info: CartridgeInfo): MemoryRegion[] {
  // Extended LoROM - supports up to 32MB
  // Similar to LoROM but with additional bank mappings
  return createLoROMLayout(info); // Simplified for now
}

function createExHiROMLayout(info: CartridgeInfo): MemoryRegion[] {
  // Extended HiROM - supports up to 64MB  
  // Similar to HiROM but with additional bank mappings
  return createHiROMLayout(info); // Simplified for now
}

function createSA1Layout(info: CartridgeInfo): MemoryRegion[] {
  const regions: MemoryRegion[] = [];
  
  // SA-1 has complex memory mapping with BW-RAM and I-RAM
  // Based on SA-1 documentation from SNES MCP server
  
  // I-RAM (Internal RAM) - 2KB
  regions.push({
    start: 0x003000,
    end: 0x0037FF,
    type: 'RAM',
    readable: true,
    writable: true,
    size: 0x800,
    speed: MemorySpeed.FastROM,
    description: 'SA-1 I-RAM'
  });
  
  // BW-RAM (Backup Work RAM)
  regions.push({
    start: 0x006000,
    end: 0x007FFF,
    type: 'RAM',
    readable: true,
    writable: true,
    size: 0x2000,
    speed: MemorySpeed.SlowROM,
    description: 'SA-1 BW-RAM'
  });
  
  // ROM mapping (similar to LoROM)
  regions.push(...createLoROMLayout(info));
  
  return regions;
}

function createSuperFXLayout(info: CartridgeInfo): MemoryRegion[] {
  const regions: MemoryRegion[] = [];
  
  // SuperFX GSU memory layout
  // Based on SuperFX documentation from SNES MCP server
  
  // GSU RAM/Cache
  regions.push({
    start: 0x706000,
    end: 0x707FFF,
    type: 'RAM',
    readable: true,
    writable: true,
    size: 0x2000,
    speed: MemorySpeed.FastROM,
    description: 'SuperFX GSU RAM'
  });
  
  // ROM mapping (similar to LoROM)
  regions.push(...createLoROMLayout(info));
  
  return regions;
}

function createBSXLayout(info: CartridgeInfo): MemoryRegion[] {
  const regions: MemoryRegion[] = [];
  
  // BSX Satellaview memory layout
  // Based on BSX documentation and SNES MCP server research
  
  // BSX Memory Pack area
  regions.push({
    start: 0x005000,
    end: 0x005FFF,
    type: 'RAM',
    readable: true,
    writable: true,
    size: 0x1000,
    speed: MemorySpeed.SlowROM,
    description: 'BSX Memory Pack'
  });
  
  // BSX registers
  regions.push({
    start: 0x002188,
    end: 0x00218F,
    type: 'IO',
    readable: true,
    writable: true,
    size: 0x8,
    speed: MemorySpeed.SlowROM,
    description: 'BSX Registers'
  });
  
  // ROM mapping (uses LoROM-style)
  regions.push(...createLoROMLayout(info));
  
  return regions;
}

function createMSU1Layout(info: CartridgeInfo): MemoryRegion[] {
  const regions: MemoryRegion[] = [];
  
  // MSU-1 audio enhancement layout
  // Based on MSU-1 specification
  
  // MSU-1 registers
  regions.push({
    start: 0x002000,
    end: 0x002007,
    type: 'IO',
    readable: true,
    writable: true,
    size: 0x8,
    speed: MemorySpeed.SlowROM,
    description: 'MSU-1 Audio Registers'
  });
  
  // Standard ROM mapping (typically LoROM)
  regions.push(...createLoROMLayout(info));
  
  return regions;
}