/**
 * SPC File Export for SNES Disassembler
 * Implements SPC700 state export for audio playback as per SPC File Format v0.30
 *
 * Based on SPC File Format Specification:
 * - 27-byte header with SPC700 register states
 * - 64KB SPC700 RAM state
 * - 128 bytes DSP register states
 * - ID666 metadata tags support
 * - Timer and I/O port states
 */

export interface SPC700State {
  // SPC700 CPU Registers
  pc: number;    // Program Counter (16-bit)
  a: number;     // Accumulator (8-bit)
  x: number;     // X Register (8-bit)
  y: number;     // Y Register (8-bit)
  psw: number;   // Processor Status Word (8-bit)
  sp: number;    // Stack Pointer (8-bit)

  // 64KB Audio RAM
  ram: Uint8Array; // 0x0000 - 0xFFFF

  // Timer states
  timer0: { value: number; target: number; enabled: boolean };
  timer1: { value: number; target: number; enabled: boolean };
  timer2: { value: number; target: number; enabled: boolean };

  // I/O Port states (CPU-APU communication)
  ports: {
    cpuToApu: Uint8Array; // 4 bytes: $2140-$2143 from CPU perspective
    apuToCpu: Uint8Array; // 4 bytes: $00F4-$00F7 from APU perspective
  };
}

export interface DSPState {
  // 128 DSP registers ($00-$7F)
  registers: Uint8Array;

  // Voice-specific states (8 voices)
  voices: Array<{
    volumeLeft: number;
    volumeRight: number;
    pitch: number;
    sourceNumber: number;
    adsr1: number;
    adsr2: number;
    gain: number;
    envx: number;
    outx: number;
  }>;

  // Global DSP settings
  mainVolumeLeft: number;
  mainVolumeRight: number;
  echoVolumeLeft: number;
  echoVolumeRight: number;
  keyOn: number;
  keyOff: number;
  flg: number;        // DSP flags
  endx: number;       // Voice end flags
  efb: number;        // Echo feedback
  pmon: number;       // Pitch modulation
  non: number;        // Noise enable
  eon: number;        // Echo enable
  dir: number;        // Sample directory page
  esa: number;        // Echo start address
  edl: number;        // Echo delay
}

export interface ID666Metadata {
  // Basic metadata (ID666 format)
  songTitle?: string;      // 32 chars max
  gameTitle?: string;      // 32 chars max
  dumperName?: string;     // 16 chars max
  comments?: string;       // 32 chars max
  dumpDate?: string;       // MM/DD/YYYY or YYYYMMDD
  playTime?: number;       // Seconds before fade
  fadeLength?: number;     // Fade length in milliseconds
  artist?: string;         // 32 chars max
  defaultChannelDisables?: number; // Bitmask
  emulator?: number;       // 0=unknown, 1=ZSNES, 2=Snes9x

  // Extended ID666 (xid6) fields
  publisher?: string;
  year?: number;
  genre?: string;
  originalSoundtrack?: string;
  introduction?: number;   // Introduction length
  loop?: number;          // Loop length
  ending?: number;        // Ending length
  mixing?: number;        // Mixing level
  preamp?: number;        // Preamp level
}

export interface SPCExportOptions {
  includeID666?: boolean;      // Include metadata tags (default: true)
  binaryFormat?: boolean;      // Use binary ID666 format (default: false)
  includeExtended?: boolean;   // Include extended ID666 data (default: false)
  filename?: string;           // Output filename
  validate?: boolean;          // Validate exported data (default: true)
}

export class SPCExporter {
  private static readonly SPC_HEADER = 'SNES-SPC700 Sound File Data'; // Exactly 27 bytes
  private static readonly SPC_SIGNATURE = [0x1A, 26, 26]; // Version markers: 0x1A followed by two 26 values
  private static readonly RAM_SIZE = 0x10000;     // 64KB
  private static readonly DSP_REG_SIZE = 0x80;    // 128 bytes
  private static readonly EXTRA_RAM_SIZE = 0x40;  // 64 bytes

  /**
   * Export SPC700 and DSP state to SPC file format
   */
  public static exportSPC(
    spcState: SPC700State,
    dspState: DSPState,
    metadata?: ID666Metadata,
    options: SPCExportOptions = {}
  ): Uint8Array {
    const {
      includeID666 = true,
      binaryFormat = false,
      includeExtended = false,
      validate = true
    } = options;

    // Calculate total file size
    const headerSize = 0x100;    // 256 bytes (header + ID666)
    const ramSize = this.RAM_SIZE;
    const dspSize = this.DSP_REG_SIZE;
    const unusedSize = 0x40;     // 64 bytes unused
    const extraRamSize = this.EXTRA_RAM_SIZE;

    let totalSize = headerSize + ramSize + dspSize + unusedSize + extraRamSize;

    // Add extended ID666 size if needed
    let extendedData: Uint8Array | null = null;
    if (includeExtended && metadata) {
      extendedData = this.createExtendedID666(metadata);
      totalSize += extendedData.length;
    }

    const buffer = new Uint8Array(totalSize);
    let offset = 0;

    // Write file header
    offset = this.writeHeader(buffer, offset, spcState, includeID666, binaryFormat);

    // Write ID666 metadata
    if (includeID666 && metadata) {
      offset = this.writeID666(buffer, offset, metadata, binaryFormat);
    } else {
      // Fill with zeros if no metadata
      buffer.fill(0, offset, 0x100);
      offset = 0x100;
    }

    // Write 64KB RAM
    buffer.set(spcState.ram, offset);
    offset += ramSize;

    // Write DSP registers
    buffer.set(dspState.registers, offset);
    offset += dspSize;

    // Write unused section (zeros)
    buffer.fill(0, offset, offset + unusedSize);
    offset += unusedSize;

    // Write extra RAM (IPL ROM region when read-only)
    // For most cases, this should be zeros unless specific IPL ROM data exists
    buffer.fill(0, offset, offset + extraRamSize);
    offset += extraRamSize;

    // Write extended ID666 data if present
    if (extendedData) {
      buffer.set(extendedData, offset);
      offset += extendedData.length;
    }

    // Validate the exported data
    if (validate) {
      this.validateSPCFile(buffer);
    }

    return buffer;
  }

  /**
   * Write SPC file header including SPC700 register states
   */
  private static writeHeader(
    buffer: Uint8Array,
    offset: number,
    spcState: SPC700State,
    includeID666: boolean,
    binaryFormat: boolean
  ): number {
    // Write SPC header string (exactly 27 bytes)
    const headerBytes = new TextEncoder().encode(this.SPC_HEADER);
    buffer.set(headerBytes, offset);
    offset = 27; // Force to be exactly at position 27

    // Write signature bytes at position 27 (0x1A, 26, 26)
    buffer[offset++] = 0x1A; // Version marker
    buffer[offset++] = 0x1A;   // Signature byte 1
    buffer[offset++] = 0x1A;   // Signature byte 2

    // Write ID666 flag
    buffer[offset++] = includeID666 ? (binaryFormat ? 27 : 26) : 27;

    // Write version minor (30 for v0.30)
    buffer[offset++] = 30;

    // Write SPC700 register states
    // PC (16-bit little endian)
    buffer[offset++] = spcState.pc & 0xFF;
    buffer[offset++] = (spcState.pc >> 8) & 0xFF;

    // A, X, Y registers (8-bit each)
    buffer[offset++] = spcState.a & 0xFF;
    buffer[offset++] = spcState.x & 0xFF;
    buffer[offset++] = spcState.y & 0xFF;

    // PSW (Processor Status Word)
    buffer[offset++] = spcState.psw & 0xFF;

    // SP (Stack Pointer - lower byte only)
    buffer[offset++] = spcState.sp & 0xFF;

    // Reserved bytes (2 bytes)
    buffer[offset++] = 0;
    buffer[offset++] = 0;

    return offset;
  }

  /**
   * Write ID666 metadata tags
   */
  private static writeID666(
    buffer: Uint8Array,
    offset: number,
    metadata: ID666Metadata,
    binaryFormat: boolean
  ): number {
    const startOffset = offset;

    // Song title (32 bytes)
    this.writeString(buffer, offset, metadata.songTitle || '', 32);
    offset += 32;

    // Game title (32 bytes)
    this.writeString(buffer, offset, metadata.gameTitle || '', 32);
    offset += 32;

    // Dumper name (16 bytes)
    this.writeString(buffer, offset, metadata.dumperName || '', 16);
    offset += 16;

    // Comments (32 bytes)
    this.writeString(buffer, offset, metadata.comments || '', 32);
    offset += 32;

    // Date format depends on binary vs text format
    if (binaryFormat) {
      // Binary format: YYYYMMDD (4 bytes)
      if (metadata.dumpDate) {
        const date = this.parseDateToBinary(metadata.dumpDate);
        buffer[offset++] = date & 0xFF;
        buffer[offset++] = (date >> 8) & 0xFF;
        buffer[offset++] = (date >> 16) & 0xFF;
        buffer[offset++] = (date >> 24) & 0xFF;
      } else {
        offset += 4; // Skip if no date
      }
      offset += 7; // Unused bytes in binary format
    } else {
      // Text format: MM/DD/YYYY (11 bytes)
      this.writeString(buffer, offset, metadata.dumpDate || '', 11);
      offset += 11;
    }

    // Play time (3 bytes for seconds)
    const playTime = metadata.playTime || 0;
    this.writeString(buffer, offset, playTime.toString(), 3);
    offset += 3;

    // Fade length (4-5 bytes for milliseconds)
    const fadeLength = metadata.fadeLength || 0;
    if (binaryFormat) {
      // Binary: 4 bytes
      buffer[offset++] = fadeLength & 0xFF;
      buffer[offset++] = (fadeLength >> 8) & 0xFF;
      buffer[offset++] = (fadeLength >> 16) & 0xFF;
      buffer[offset++] = (fadeLength >> 24) & 0xFF;
    } else {
      // Text: 5 bytes
      this.writeString(buffer, offset, fadeLength.toString(), 5);
      offset += 5;
    }

    // Artist (32 bytes)
    this.writeString(buffer, offset, metadata.artist || '', 32);
    offset += 32;

    // Default channel disables (1 byte)
    buffer[offset++] = metadata.defaultChannelDisables || 0;

    // Emulator used (1 byte)
    buffer[offset++] = metadata.emulator || 0;

    // Reserved bytes (fill remaining space to reach 0x100)
    const remainingBytes = 0x100 - (offset - startOffset + 0x2E);
    buffer.fill(0, offset, offset + remainingBytes);

    return 0x100;
  }

  /**
   * Create extended ID666 (xid6) chunk
   */
  private static createExtendedID666(metadata: ID666Metadata): Uint8Array {
    const chunks: Uint8Array[] = [];
    let totalSize = 8; // Header size

    // Add extended fields if present
    if (metadata.publisher) {
      const chunk = this.createXID6Chunk(0x10, 1, metadata.publisher);
      chunks.push(chunk);
      totalSize += chunk.length;
    }

    if (metadata.year) {
      const chunk = this.createXID6Chunk(0x11, 0, metadata.year);
      chunks.push(chunk);
      totalSize += chunk.length;
    }

    if (metadata.genre) {
      const chunk = this.createXID6Chunk(0x12, 1, metadata.genre);
      chunks.push(chunk);
      totalSize += chunk.length;
    }

    // Create the complete extended data
    const buffer = new Uint8Array(totalSize);
    let offset = 0;

    // Write chunk header
    buffer.set(new TextEncoder().encode('xid6'), offset);
    offset += 4;

    // Write chunk size (excluding header)
    const dataSize = totalSize - 8;
    buffer[offset++] = dataSize & 0xFF;
    buffer[offset++] = (dataSize >> 8) & 0xFF;
    buffer[offset++] = (dataSize >> 16) & 0xFF;
    buffer[offset++] = (dataSize >> 24) & 0xFF;

    // Write sub-chunks
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    return buffer;
  }

  /**
   * Create individual xid6 sub-chunk
   */
  private static createXID6Chunk(id: number, type: number, data: string | number): Uint8Array {
    let dataBytes: Uint8Array;
    let length = 0;

    if (type === 0) {
      // Data stored in header (length field)
      dataBytes = new Uint8Array(0);
      length = typeof data === 'number' ? data : 0;
    } else {
      // Data stored as string
      const str = typeof data === 'string' ? data : data.toString();
      dataBytes = new TextEncoder().encode(str + '\0');
      length = dataBytes.length;

      // Pad to 32-bit boundary
      const padding = (4 - (length % 4)) % 4;
      if (padding > 0) {
        const paddedBytes = new Uint8Array(length + padding);
        paddedBytes.set(dataBytes);
        dataBytes = paddedBytes;
      }
    }

    const chunk = new Uint8Array(4 + dataBytes.length);
    chunk[0] = id;
    chunk[1] = type;
    chunk[2] = length & 0xFF;
    chunk[3] = (length >> 8) & 0xFF;
    chunk.set(dataBytes, 4);

    return chunk;
  }

  /**
   * Write string to buffer with null padding
   */
  private static writeString(buffer: Uint8Array, offset: number, str: string, maxLength: number): void {
    const bytes = new TextEncoder().encode(str.substring(0, maxLength));
    buffer.set(bytes, offset);
    // Null-terminate and pad
    for (let i = bytes.length; i < maxLength; i++) {
      buffer[offset + i] = 0;
    }
  }

  /**
   * Parse date string to binary format
   */
  private static parseDateToBinary(dateStr: string): number {
    // Try to parse MM/DD/YYYY format
    const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const month = parseInt(match[1], 10);
      const day = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      return (year * 10000) + (month * 100) + day;
    }

    // Try YYYYMMDD format
    const numDate = parseInt(dateStr.replace(/\D/g, ''), 10);
    return isNaN(numDate) ? 0 : numDate;
  }

  /**
   * Validate exported SPC file
   */
  private static validateSPCFile(buffer: Uint8Array): void {
    // Check minimum file size
    if (buffer.length < 0x10200) {
      throw new Error('SPC file too small');
    }

    // Validate header (exactly 27 bytes)
    const headerStr = new TextDecoder().decode(buffer.slice(0, 27));
    if (!headerStr.startsWith('SNES-SPC700 Sound File Data')) {
      throw new Error('Invalid SPC header');
    }

    // Validate signature bytes at positions 27, 28, 29
    if (buffer[27] !== 0x1A) {
      throw new Error('Invalid SPC version marker');
    }
    if (buffer[28] !== 0x1A || buffer[29] !== 0x1A) {
      throw new Error('Invalid SPC signature bytes');
    }

    // Validate ID666 flag
    const id666Flag = buffer[30];
    if (id666Flag !== 26 && id666Flag !== 27) {
      throw new Error('Invalid ID666 flag');
    }

    // Basic validation passed
    console.log('SPC file validation passed');
  }

  /**
   * Create default SPC700 state for testing
   */
  public static createDefaultSPC700State(): SPC700State {
    return {
      pc: 0x0200,          // Typical start address
      a: 0,
      x: 0,
      y: 0,
      psw: 0x02,           // Typical initial PSW
      sp: 0xFF,            // Full stack
      ram: new Uint8Array(0x10000), // 64KB RAM
      timer0: { value: 0, target: 0, enabled: false },
      timer1: { value: 0, target: 0, enabled: false },
      timer2: { value: 0, target: 0, enabled: false },
      ports: {
        cpuToApu: new Uint8Array(4),
        apuToCpu: new Uint8Array(4)
      }
    };
  }

  /**
   * Create default DSP state for testing
   */
  public static createDefaultDSPState(): DSPState {
    const dspState: DSPState = {
      registers: new Uint8Array(128),
      voices: [],
      mainVolumeLeft: 127,
      mainVolumeRight: 127,
      echoVolumeLeft: 0,
      echoVolumeRight: 0,
      keyOn: 0,
      keyOff: 0,
      flg: 0,
      endx: 0,
      efb: 0,
      pmon: 0,
      non: 0,
      eon: 0,
      dir: 0,
      esa: 0,
      edl: 0
    };

    // Initialize 8 voices
    for (let i = 0; i < 8; i++) {
      dspState.voices.push({
        volumeLeft: 0,
        volumeRight: 0,
        pitch: 0x1000,      // Default pitch
        sourceNumber: 0,
        adsr1: 0,
        adsr2: 0,
        gain: 0,
        envx: 0,
        outx: 0
      });
    }

    return dspState;
  }
}

// Export types for use in other modules
