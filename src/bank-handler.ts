import { CartridgeType, CartridgeInfo } from './cartridge-types';

/**
 * Enhanced bank switching handler with support for all SNES mapping modes
 * Handles LoROM, HiROM, ExLoROM, ExHiROM, and special chip configurations
 */
export class BankHandler {
  private cartridgeInfo: CartridgeInfo;
  private mappingMode: 'LoROM' | 'HiROM' | 'ExLoROM' | 'ExHiROM';
  private bankMask: number = 0x7F;
  private addressMask: number = 0x7FFF;

  constructor(cartridgeInfo: CartridgeInfo) {
    this.cartridgeInfo = cartridgeInfo;
    this.mappingMode = this.detectMappingMode(cartridgeInfo);
    this.initializeMasks();
  }

  /**
   * Detect mapping mode from cartridge info
   */
  private detectMappingMode(cartridgeInfo: CartridgeInfo): 'LoROM' | 'HiROM' | 'ExLoROM' | 'ExHiROM' {
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
      // Default to LoROM for unknown types
      return 'LoROM';
    }
  }

  /**
   * Initialize bank and address masks based on mapping mode
   */
  private initializeMasks(): void {
    switch (this.mappingMode) {
    case 'LoROM':
    case 'ExLoROM':
      this.bankMask = 0x7F;     // Banks 00-7F accessible
      this.addressMask = 0x7FFF; // 32KB banks (ignore bit 15)
      break;
    case 'HiROM':
    case 'ExHiROM':
      this.bankMask = 0xFF;     // Banks 00-FF accessible
      this.addressMask = 0xFFFF; // 64KB banks (full address)
      break;
    }
  }

  /**
   * Convert logical address to ROM offset with enhanced bank switching
   */
  public addressToRomOffset(address: number): number {
    const bank = (address >> 16) & 0xFF;
    const offset = address & 0xFFFF;

    switch (this.mappingMode) {
    case 'LoROM':
      return this.calculateLoROMOffset(bank, offset);
    case 'HiROM':
      return this.calculateHiROMOffset(bank, offset);
    case 'ExLoROM':
      return this.calculateExLoROMOffset(bank, offset);
    case 'ExHiROM':
      return this.calculateExHiROMOffset(bank, offset);
    default:
      throw new Error(`Unsupported mapping mode: ${this.mappingMode}`);
    }
  }

  /**
   * Convert ROM offset to logical address
   */
  public romOffsetToAddress(romOffset: number): number {
    switch (this.mappingMode) {
    case 'LoROM':
      return this.calculateLoROMAddress(romOffset);
    case 'HiROM':
      return this.calculateHiROMAddress(romOffset);
    case 'ExLoROM':
      return this.calculateExLoROMAddress(romOffset);
    case 'ExHiROM':
      return this.calculateExHiROMAddress(romOffset);
    default:
      throw new Error(`Unsupported mapping mode: ${this.mappingMode}`);
    }
  }

  /**
   * LoROM mapping calculation (Mode 20)
   * Banks 00-7F: ROM at $8000-$FFFF (32KB per bank)
   * Banks 80-FF: FastROM mirror
   */
  private calculateLoROMOffset(bank: number, offset: number): number {
    // FastROM mirror banks (80-FF)
    if (bank >= 0x80) {
      bank = bank - 0x80;
    }

    // ROM is only accessible at $8000-$FFFF
    if (bank <= 0x7F && offset >= 0x8000) {
      return (bank * 0x8000) + (offset - 0x8000);
    }

    // Handle special system areas
    if (bank === 0x00 && offset < 0x8000) {
      // System area - not ROM
      throw new Error(`System area access: $${offset.toString(16).toUpperCase()}`);
    }

    throw new Error(`Invalid LoROM address: $${((bank << 16) | offset).toString(16).toUpperCase()}`);
  }

  /**
   * HiROM mapping calculation (Mode 21)
   * Banks C0-FF: Direct ROM mapping (64KB per bank)
   * Banks 40-7F: Direct ROM mapping (64KB per bank)
   */
  private calculateHiROMOffset(bank: number, offset: number): number {
    // Banks C0-FF: Direct ROM mapping
    if (bank >= 0xC0) {
      return ((bank - 0xC0) * 0x10000) + offset;
    }

    // Banks 40-7F: Direct ROM mapping
    if (bank >= 0x40 && bank <= 0x7F) {
      return ((bank - 0x40) * 0x10000) + offset;
    }

    // Banks 80-BF: Mirror of 00-3F at $8000-$FFFF
    if (bank >= 0x80 && bank <= 0xBF && offset >= 0x8000) {
      return ((bank - 0x80) * 0x8000) + (offset - 0x8000);
    }

    // Banks 00-3F: ROM at $8000-$FFFF
    if (bank <= 0x3F && offset >= 0x8000) {
      return (bank * 0x8000) + (offset - 0x8000);
    }

    // Bank 00: System area
    if (bank === 0x00 && offset < 0x8000) {
      throw new Error(`System area access: $${offset.toString(16).toUpperCase()}`);
    }

    throw new Error(`Invalid HiROM address: $${((bank << 16) | offset).toString(16).toUpperCase()}`);
  }

  /**
   * ExLoROM mapping calculation (Mode 25)
   * Extended LoROM for ROMs > 2MB
   */
  private calculateExLoROMOffset(bank: number, offset: number): number {
    // For ExLoROM, we need to handle the extended addressing
    // This is similar to LoROM but with additional bank mapping

    // Handle FastROM mirror
    if (bank >= 0x80) {
      bank = bank - 0x80;
    }

    // Standard LoROM mapping for banks 00-7F
    if (bank <= 0x7F && offset >= 0x8000) {
      let romOffset = (bank * 0x8000) + (offset - 0x8000);

      // Apply bank wrapping for extended ROM sizes
      if (this.cartridgeInfo.romSize > 0x200000) { // > 2MB
        const bankCount = Math.floor(this.cartridgeInfo.romSize / 0x8000);
        romOffset = romOffset % (bankCount * 0x8000);
      }

      return romOffset;
    }

    throw new Error(`Invalid ExLoROM address: $${((bank << 16) | offset).toString(16).toUpperCase()}`);
  }

  /**
   * ExHiROM mapping calculation (Mode 25)
   * Extended HiROM for ROMs > 4MB
   */
  private calculateExHiROMOffset(bank: number, offset: number): number {
    // ExHiROM extends the standard HiROM mapping
    // Additional banks are mapped in a specific pattern

    // Standard HiROM banks
    if (bank >= 0xC0) {
      return ((bank - 0xC0) * 0x10000) + offset;
    }

    if (bank >= 0x40 && bank <= 0x7F) {
      return ((bank - 0x40) * 0x10000) + offset;
    }

    // Extended banks for ROMs > 4MB
    if (this.cartridgeInfo.romSize > 0x400000) { // > 4MB
      // Handle extended bank mapping
      if (bank >= 0x80 && bank <= 0xBF && offset >= 0x8000) {
        return ((bank - 0x80 + 0x40) * 0x8000) + (offset - 0x8000);
      }
    }

    // Standard HiROM mirrors and system areas
    if (bank >= 0x80 && bank <= 0xBF && offset >= 0x8000) {
      return ((bank - 0x80) * 0x8000) + (offset - 0x8000);
    }

    if (bank <= 0x3F && offset >= 0x8000) {
      return (bank * 0x8000) + (offset - 0x8000);
    }

    throw new Error(`Invalid ExHiROM address: $${((bank << 16) | offset).toString(16).toUpperCase()}`);
  }

  /**
   * Calculate LoROM address from ROM offset
   */
  private calculateLoROMAddress(romOffset: number): number {
    const bank = Math.floor(romOffset / 0x8000);
    const offset = (romOffset % 0x8000) + 0x8000;
    return (bank << 16) | offset;
  }

  /**
   * Calculate HiROM address from ROM offset
   */
  private calculateHiROMAddress(romOffset: number): number {
    // Prefer C0-FF banks for direct mapping
    const bank = Math.floor(romOffset / 0x10000) + 0xC0;
    const offset = romOffset % 0x10000;
    return (bank << 16) | offset;
  }

  /**
   * Calculate ExLoROM address from ROM offset
   */
  private calculateExLoROMAddress(romOffset: number): number {
    // Similar to LoROM but with extended bank handling
    const bank = Math.floor(romOffset / 0x8000);
    const offset = (romOffset % 0x8000) + 0x8000;
    return (bank << 16) | offset;
  }

  /**
   * Calculate ExHiROM address from ROM offset
   */
  private calculateExHiROMAddress(romOffset: number): number {
    // Similar to HiROM but with extended bank handling
    const bank = Math.floor(romOffset / 0x10000) + 0xC0;
    const offset = romOffset % 0x10000;
    return (bank << 16) | offset;
  }

  /**
   * Get valid address ranges for the current mapping mode
   */
  public getValidAddressRanges(): Array<{ start: number; end: number; type: string }> {
    const ranges: Array<{ start: number; end: number; type: string }> = [];

    switch (this.mappingMode) {
    case 'LoROM':
    case 'ExLoROM':
      // System areas
      ranges.push({ start: 0x000000, end: 0x007FFF, type: 'SYSTEM' });
      // ROM areas
      for (let bank = 0; bank <= 0x7F; bank++) {
        ranges.push({
          start: (bank << 16) | 0x8000,
          end: (bank << 16) | 0xFFFF,
          type: 'ROM'
        });
      }
      // FastROM mirrors
      for (let bank = 0x80; bank <= 0xFF; bank++) {
        ranges.push({
          start: (bank << 16) | 0x8000,
          end: (bank << 16) | 0xFFFF,
          type: 'ROM_MIRROR'
        });
      }
      break;

    case 'HiROM':
    case 'ExHiROM':
      // System areas
      ranges.push({ start: 0x000000, end: 0x007FFF, type: 'SYSTEM' });
      // ROM areas in banks 00-3F at $8000-$FFFF
      for (let bank = 0x00; bank <= 0x3F; bank++) {
        ranges.push({
          start: (bank << 16) | 0x8000,
          end: (bank << 16) | 0xFFFF,
          type: 'ROM'
        });
      }
      // Direct ROM mapping in banks 40-7F
      for (let bank = 0x40; bank <= 0x7F; bank++) {
        ranges.push({
          start: (bank << 16) | 0x0000,
          end: (bank << 16) | 0xFFFF,
          type: 'ROM'
        });
      }
      // ROM mirrors in banks 80-BF at $8000-$FFFF
      for (let bank = 0x80; bank <= 0xBF; bank++) {
        ranges.push({
          start: (bank << 16) | 0x8000,
          end: (bank << 16) | 0xFFFF,
          type: 'ROM_MIRROR'
        });
      }
      // Direct ROM mapping in banks C0-FF
      for (let bank = 0xC0; bank <= 0xFF; bank++) {
        ranges.push({
          start: (bank << 16) | 0x0000,
          end: (bank << 16) | 0xFFFF,
          type: 'ROM'
        });
      }
      break;
    }

    return ranges;
  }

  /**
   * Check if an address is valid for the current mapping mode
   */
  public isValidAddress(address: number): boolean {
    const ranges = this.getValidAddressRanges();
    return ranges.some(range =>
      range.type === 'ROM' && address >= range.start && address <= range.end
    );
  }

  /**
   * Get the mapping mode
   */
  public getMappingMode(): string {
    return this.mappingMode;
  }

  /**
   * Get bank size for the current mapping mode
   */
  public getBankSize(): number {
    switch (this.mappingMode) {
    case 'LoROM':
    case 'ExLoROM':
      return 0x8000; // 32KB
    case 'HiROM':
    case 'ExHiROM':
      return 0x10000; // 64KB
    default:
      return 0x8000;
    }
  }

  /**
   * Handle special chip bank switching
   * This method can be extended to handle SA-1, SuperFX, etc.
   */
  public handleSpecialChipBanking(address: number, chipType?: string): number | null {
    if (!chipType) {
      chipType = this.cartridgeInfo.specialChip;
    }

    switch (chipType) {
    case 'SA-1 Super Accelerator':
      return this.handleSA1Banking(address);
    case 'SuperFX Graphics Support Unit':
      return this.handleSuperFXBanking(address);
      // Add more special chip handlers as needed
    default:
      return null; // Use standard banking
    }
  }

  /**
   * Handle SA-1 specific banking
   */
  private handleSA1Banking(address: number): number {
    // SA-1 has complex banking with multiple memory maps
    // This is a simplified implementation
    const bank = (address >> 16) & 0xFF;
    const offset = address & 0xFFFF;

    // SA-1 BW-RAM mapping
    if (bank >= 0x00 && bank <= 0x3F && offset >= 0x6000 && offset <= 0x7FFF) {
      // BW-RAM area - not ROM
      throw new Error(`SA-1 BW-RAM access: $${address.toString(16).toUpperCase()}`);
    }

    // Use standard banking for ROM areas
    return this.addressToRomOffset(address);
  }

  /**
   * Handle SuperFX specific banking
   */
  private handleSuperFXBanking(address: number): number {
    // SuperFX has its own memory mapping
    // This is a simplified implementation
    const bank = (address >> 16) & 0xFF;
    const offset = address & 0xFFFF;

    // SuperFX has special RAM areas that aren't ROM
    if (bank >= 0x70 && bank <= 0x71) {
      // SuperFX RAM - not ROM
      throw new Error(`SuperFX RAM access: $${address.toString(16).toUpperCase()}`);
    }

    // Use standard banking for ROM areas
    return this.addressToRomOffset(address);
  }

  /**
   * Get bank information for an address
   */
  public getBankInfo(address: number): { bank: number; offset: number; type: string; physicalAddress?: number } {
    const bank = (address >> 16) & 0xFF;
    const offset = address & 0xFFFF;

    const ranges = this.getValidAddressRanges();
    const range = ranges.find(r => address >= r.start && address <= r.end);

    let physicalAddress: number | undefined;
    try {
      physicalAddress = this.addressToRomOffset(address);
    } catch (error) {
      // Address is not mappable to ROM
      physicalAddress = undefined;
    }

    return {
      bank,
      offset,
      type: range?.type || 'INVALID',
      physicalAddress
    };
  }

  /**
   * Get statistics about the current mapping
   */
  public getMappingStats(): {
    mode: string;
    bankSize: number;
    romSize: number;
    totalBanks: number;
    validRanges: number;
    } {
    const ranges = this.getValidAddressRanges();
    const romRanges = ranges.filter(r => r.type === 'ROM');

    return {
      mode: this.mappingMode,
      bankSize: this.getBankSize(),
      romSize: this.cartridgeInfo.romSize,
      totalBanks: Math.ceil(this.cartridgeInfo.romSize / this.getBankSize()),
      validRanges: romRanges.length
    };
  }
}
