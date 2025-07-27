import { CartridgeType, CartridgeInfo, detectCartridgeType, getMemorySpeed, hasBatteryBackup } from './cartridge-types';

/**
 * Parses extended ROM header information to determine ROM mapping settings
 * Works with standard SNES ROMs following the copier header format
 */
export class RomHeaderParser {
  /**
   * Detect enhanced ROM mapping settings based on common modes (LoROM/HiROM)
   */
  public static detectMappingMode(cartridgeInfo: CartridgeInfo): 'LoROM' | 'HiROM' | 'ExLoROM' | 'ExHiROM' {
    switch (cartridgeInfo.type) {
      case CartridgeType.HiROM:
        return 'HiROM';
      case CartridgeType.ExHiROM:
        return 'ExHiROM';
      case CartridgeType.LoROM:
        return 'LoROM';
      case CartridgeType.ExLoROM:
        return 'ExLoROM';
      default:
        return 'LoROM'; // Fallback to LoROM
    }
  }

  /**
   * Parses the ROM header to identify detailed memory mapping and special chip settings
   */
  public static parseROMHeader(data: Buffer, offset: number): CartridgeInfo {
    const mapMode = data[offset + 0x15];
    const cartridgeType = data[offset + 0x16];
    const romSpeedByte = data[offset + 0x17];
    
    const detectedType = detectCartridgeType(mapMode, cartridgeType);
    const memorySpeed = getMemorySpeed(mapMode);

    const cartridgeInfo: CartridgeInfo = {
      type: detectedType,
      mapMode: mapMode,
      romSize: this.calculateROMSize(data[offset + 0x17]),
      ramSize: this.calculateRAMSize(data[offset + 0x18]),
      hasBattery: hasBatteryBackup(cartridgeType),
      hasRTC: detectedType === CartridgeType.SRTC,
      speed: memorySpeed, 
      regions: [], // To be filled with actual memory regions
      specialChip: this.detectSpecialChip(cartridgeType)
    };

    // Custom logic to determine ROM and RAM sizes, speed, regions
    // Example only, replace with actual implementation matching header data
    return cartridgeInfo;
  }

  private static calculateROMSize(romSizeByte: number): number {
    return Math.pow(2, romSizeByte + 10); // 2^(X+10) bytes
  }

  private static calculateRAMSize(ramSizeByte: number): number {
    return Math.pow(2, ramSizeByte + 10); // 2^(X+10) bytes
  }

  private static detectSpecialChip(cartridgeType: number): string | undefined {
    switch (cartridgeType) {
      case 0x13: case 0x14: case 0x15: case 0x1A:
        return 'SuperFX Graphics Support Unit';
      case 0x34: case 0x35:
        return 'SA-1 Super Accelerator';
      case 0x03:
        return 'DSP-1 Digital Signal Processor';
      case 0x05:
        return 'DSP-2 Digital Signal Processor';
      case 0x06:
        return 'DSP-3 Digital Signal Processor';
      case 0x0A:
        return 'DSP-4 Digital Signal Processor';
      case 0x43: case 0x45:
        return 'S-DD1 Data Decompression';
      case 0x55:
        return 'S-RTC Real-Time Clock';
      case 0xF3:
        return 'CX4 Math Coprocessor';
      case 0xF5:
        return 'ST010 Graphics Processor';
      case 0xF6:
        return 'ST011 Graphics Processor';
      case 0xF9:
        return 'SPC7110 Data Decompression';
      case 0xFE:
        return 'MSU-1 Audio Enhancement';
      default:
        return undefined;
    }
  }
}
