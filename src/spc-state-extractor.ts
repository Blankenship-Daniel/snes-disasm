/**
 * SPC State Extractor for SNES Disassembler
 * Analyzes SNES ROMs to extract SPC700 and DSP states for audio playback
 *
 * This module identifies:
 * - SPC700 upload routines in SNES code
 * - Audio data locations and formats
 * - DSP register configurations
 * - BRR sample data
 * - Music sequence data
 */

import { DisassemblyLine } from './types';
import { SPC700State, DSPState, ID666Metadata } from './spc-exporter';
import { CartridgeInfo } from './cartridge-types';

export interface AudioDataLocation {
  address: number;
  size: number;
  type: 'SPC_UPLOAD' | 'BRR_SAMPLES' | 'MUSIC_DATA' | 'DSP_DATA' | 'SPC_ENGINE';
  description: string;
  confidence: number; // 0-1 confidence score
}

export interface SPCUploadSequence {
  startAddress: number;
  endAddress: number;
  instructions: DisassemblyLine[];
  targetRamAddress: number;
  dataSize: number;
  uploadMethod: 'DIRECT' | 'DMA' | 'IPL_BOOT';
  confidence: number;
}

export interface BRRSample {
  address: number;
  size: number;
  loopPoint?: number;
  sampleRate?: number;
  name?: string;
  confidence: number;
}

export interface MusicSequence {
  address: number;
  size: number;
  trackCount: number;
  channelMask: number;
  instrument?: number;
  tempo?: number;
  confidence: number;
}

export interface ExtractedAudioState {
  spc700State: Partial<SPC700State>;
  dspState: Partial<DSPState>;
  audioData: AudioDataLocation[];
  spcUploads: SPCUploadSequence[];
  brrSamples: BRRSample[];
  musicSequences: MusicSequence[];
  metadata: Partial<ID666Metadata>;
}

export class SPCStateExtractor {
  private static readonly SPC_UPLOAD_PATTERNS = [
    // Common SPC upload patterns
    { pattern: [0xCD, 0x00, 0x21], mask: [0xFF, 0x00, 0xFF], description: 'CMP $2100 (waiting for SPC)' },
    { pattern: [0x8D, 0x40, 0x21], mask: [0xFF, 0xFF, 0xFF], description: 'STA $2140 (APU port 0)' },
    { pattern: [0x8D, 0x41, 0x21], mask: [0xFF, 0xFF, 0xFF], description: 'STA $2141 (APU port 1)' },
    { pattern: [0x8D, 0x42, 0x21], mask: [0xFF, 0xFF, 0xFF], description: 'STA $2142 (APU port 2)' },
    { pattern: [0x8D, 0x43, 0x21], mask: [0xFF, 0xFF, 0xFF], description: 'STA $2143 (APU port 3)' }
  ];

  private static readonly BRR_SIGNATURES = [
    // BRR sample signatures (9-byte BRR blocks)
    { pattern: [0x00, 0x00, 0x00, 0x00], offset: 0, description: 'BRR silent block' },
    { pattern: [0x01], offset: 0, mask: 0x0F, description: 'BRR block with loop flag' },
    { pattern: [0x03], offset: 0, mask: 0x0F, description: 'BRR block with end flag' }
  ];

  private static readonly DSP_REGISTER_MAP = {
    // Voice registers (8 voices * 16 bytes each)
    0x00: 'V0VOLL',  // Voice 0 Volume Left
    0x01: 'V0VOLR',  // Voice 0 Volume Right
    0x02: 'V0PITCHL', // Voice 0 Pitch Low
    0x03: 'V0PITCHH', // Voice 0 Pitch High
    0x04: 'V0SRCN',  // Voice 0 Source Number
    0x05: 'V0ADSR1', // Voice 0 ADSR1
    0x06: 'V0ADSR2', // Voice 0 ADSR2
    0x07: 'V0GAIN',  // Voice 0 GAIN
    0x08: 'V0ENVX',  // Voice 0 Current Envelope
    0x09: 'V0OUTX',  // Voice 0 Current Output
    // ... (repeat for voices 1-7)

    // Global registers
    0x0C: 'MVOLL',   // Main Volume Left
    0x1C: 'MVOLR',   // Main Volume Right
    0x2C: 'EVOLL',   // Echo Volume Left
    0x3C: 'EVOLR',   // Echo Volume Right
    0x4C: 'KON',     // Key On
    0x5C: 'KOFF',    // Key Off
    0x6C: 'FLG',     // Reset, Mute, Echo-Write flags and Noise Clock
    0x7C: 'ENDX',    // Voice End flags
    0x0D: 'EFB',     // Echo Feedback
    0x2D: 'PMON',    // Pitch Modulation
    0x3D: 'NON',     // Noise Enable
    0x4D: 'EON',     // Echo Enable
    0x5D: 'DIR',     // Sample Directory
    0x6D: 'ESA',     // Echo Start Address
    0x7D: 'EDL'     // Echo Delay
  };

  /**
   * Extract SPC700 and DSP states from ROM analysis
   */
  public static extractAudioState(
    lines: DisassemblyLine[],
    romData: Uint8Array,
    cartridgeInfo: CartridgeInfo
  ): ExtractedAudioState {
    const result: ExtractedAudioState = {
      spc700State: this.createBasicSPC700State(),
      dspState: this.createBasicDSPState(),
      audioData: [],
      spcUploads: [],
      brrSamples: [],
      musicSequences: [],
      metadata: this.extractBasicMetadata(cartridgeInfo)
    };

    // Phase 1: Identify SPC upload routines
    result.spcUploads = this.findSPCUploadSequences(lines, romData);

    // Phase 2: Extract audio data locations
    result.audioData = this.findAudioDataLocations(lines, romData);

    // Phase 3: Identify BRR samples
    result.brrSamples = this.findBRRSamples(romData);

    // Phase 4: Find music sequence data
    result.musicSequences = this.findMusicSequences(lines, romData);

    // Phase 5: Analyze SPC upload data to build states
    this.analyzeSPCUploads(result);

    // Phase 6: Extract DSP register configurations
    this.extractDSPConfigurations(result, lines);

    // Phase 7: Enhanced metadata extraction
    this.enhanceMetadata(result, cartridgeInfo);

    return result;
  }

  /**
   * Find SPC upload sequences in the disassembled code
   */
  private static findSPCUploadSequences(lines: DisassemblyLine[], romData: Uint8Array): SPCUploadSequence[] {
    const sequences: SPCUploadSequence[] = [];

    for (let i = 0; i < lines.length - 10; i++) {
      const line = lines[i];

      // Look for APU port writes which indicate SPC communication
      if (this.isAPUPortWrite(line)) {
        const sequence = this.analyzePotentialSPCUpload(lines, i, romData);
        if (sequence && sequence.confidence > 0.5) {
          sequences.push(sequence);
        }
      }
    }

    return sequences;
  }

  /**
   * Check if instruction writes to APU ports ($2140-$2143)
   */
  private static isAPUPortWrite(line: DisassemblyLine): boolean {
    if (line.instruction.mnemonic !== 'STA') return false;
    if (!line.operand) return false;

    const address = line.operand;
    return address >= 0x2140 && address <= 0x2143;
  }

  /**
   * Analyze potential SPC upload sequence starting at given line
   */
  private static analyzePotentialSPCUpload(
    lines: DisassemblyLine[],
    startIndex: number,
    romData: Uint8Array
  ): SPCUploadSequence | null {
    const uploadLines: DisassemblyLine[] = [];
    let confidence = 0;
    let dataSize = 0;
    let targetRamAddress = 0;
    let uploadMethod: 'DIRECT' | 'DMA' | 'IPL_BOOT' = 'DIRECT';

    // Analyze the next 20-50 instructions for upload patterns
    for (let i = startIndex; i < Math.min(startIndex + 50, lines.length); i++) {
      const line = lines[i];
      uploadLines.push(line);

      // Check for APU port communication patterns
      if (this.isAPUPortWrite(line) || this.isAPUPortRead(line)) {
        confidence += 0.1;
      }

      // Check for IPL boot sequence (common pattern)
      if (this.isIPLBootPattern(line)) {
        uploadMethod = 'IPL_BOOT';
        confidence += 0.3;
      }

      // Check for DMA setup
      if (this.isDMASetup(line)) {
        uploadMethod = 'DMA';
        confidence += 0.2;
      }

      // Check for loop patterns (data upload loops)
      if (this.isLoopInstruction(line.instruction.mnemonic)) {
        confidence += 0.1;
      }

      // Try to determine target RAM address and data size
      if (line.instruction.mnemonic === 'LDX' && line.operand && line.operand < 0x10000) {
        if (targetRamAddress === 0) targetRamAddress = line.operand;
      }

      if (line.instruction.mnemonic === 'LDY' && line.operand && line.operand < 0x8000) {
        if (dataSize === 0) dataSize = line.operand;
      }

      // Stop if we hit a return or jump to different section
      if (['RTS', 'RTL', 'JMP', 'JML'].includes(line.instruction.mnemonic)) {
        break;
      }
    }

    // Must have reasonable confidence to be considered valid
    if (confidence < 0.3) return null;

    return {
      startAddress: lines[startIndex].address,
      endAddress: uploadLines[uploadLines.length - 1].address,
      instructions: uploadLines,
      targetRamAddress,
      dataSize,
      uploadMethod,
      confidence: Math.min(confidence, 1.0)
    };
  }

  /**
   * Check if instruction reads from APU ports
   */
  private static isAPUPortRead(line: DisassemblyLine): boolean {
    if (!['LDA', 'CMP'].includes(line.instruction.mnemonic)) return false;
    if (!line.operand) return false;

    const address = line.operand;
    return address >= 0x2140 && address <= 0x2143;
  }

  /**
   * Check for IPL boot patterns
   */
  private static isIPLBootPattern(line: DisassemblyLine): boolean {
    // Common IPL boot: load $CC to $2141, $BB to $2140
    if (line.instruction.mnemonic === 'LDA' && line.operand === 0xCC) return true;
    if (line.instruction.mnemonic === 'LDA' && line.operand === 0xBB) return true;
    return false;
  }

  /**
   * Check for DMA setup instructions
   */
  private static isDMASetup(line: DisassemblyLine): boolean {
    if (line.instruction.mnemonic !== 'STA') return false;
    if (!line.operand) return false;

    const address = line.operand;
    // DMA channel registers $43xx
    return (address >= 0x4300 && address <= 0x437F) || address === 0x420B;
  }

  /**
   * Check if instruction is a loop instruction
   */
  private static isLoopInstruction(mnemonic: string): boolean {
    return ['BNE', 'BEQ', 'BCC', 'BCS', 'BMI', 'BPL', 'DEX', 'DEY', 'CPX', 'CPY'].includes(mnemonic);
  }

  /**
   * Find audio data locations in ROM
   */
  private static findAudioDataLocations(lines: DisassemblyLine[], romData: Uint8Array): AudioDataLocation[] {
    const locations: AudioDataLocation[] = [];

    // Search for potential audio data patterns
    for (let i = 0; i < romData.length - 1024; i++) {
      // Check for BRR sample directory (common at $1000 intervals)
      if (i % 0x1000 === 0) {
        const confidence = this.analyzeBRRDirectory(romData, i);
        if (confidence > 0.5) {
          locations.push({
            address: i,
            size: 1024, // Sample directories are typically small
            type: 'DSP_DATA',
            description: 'BRR Sample Directory',
            confidence
          });
        }
      }

      // Check for music sequence data
      if (this.looksLikeMusicData(romData, i)) {
        const size = this.estimateMusicDataSize(romData, i);
        locations.push({
          address: i,
          size,
          type: 'MUSIC_DATA',
          description: 'Music Sequence Data',
          confidence: 0.7
        });
      }
    }

    return locations;
  }

  /**
   * Analyze potential BRR directory
   */
  private static analyzeBRRDirectory(romData: Uint8Array, offset: number): number {
    let confidence = 0;

    // BRR directories contain 16-bit pointers to samples
    for (let i = 0; i < 64; i += 4) { // Check first 16 entries
      if (offset + i + 3 >= romData.length) break;

      const startAddr = romData[offset + i] | (romData[offset + i + 1] << 8);
      const loopAddr = romData[offset + i + 2] | (romData[offset + i + 3] << 8);

      // Valid BRR pointers should be reasonable
      if (startAddr >= 0x200 && startAddr < 0xFFFF &&
          loopAddr >= startAddr && loopAddr < 0xFFFF) {
        confidence += 0.1;
      }
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Check if data looks like music sequence data
   */
  private static looksLikeMusicData(romData: Uint8Array, offset: number): boolean {
    if (offset + 16 >= romData.length) return false;

    // Music data often starts with tempo/track information
    const firstByte = romData[offset];
    const secondByte = romData[offset + 1];

    // Common music data patterns
    if (firstByte >= 0x40 && firstByte <= 0x80) { // Tempo range
      if (secondByte < 0x08) { // Track count
        return true;
      }
    }

    return false;
  }

  /**
   * Estimate music data size
   */
  private static estimateMusicDataSize(romData: Uint8Array, offset: number): number {
    // Simple heuristic: look for end patterns or next data block
    for (let i = offset + 16; i < Math.min(offset + 4096, romData.length); i++) {
      // Look for common end patterns
      if (romData[i] === 0x00 && romData[i + 1] === 0x00) {
        return i - offset + 2;
      }
    }

    return 1024; // Default size
  }

  /**
   * Find BRR samples in ROM data
   */
  private static findBRRSamples(romData: Uint8Array): BRRSample[] {
    const samples: BRRSample[] = [];

    // BRR samples are 9-byte aligned blocks
    for (let i = 0; i < romData.length - 9; i += 9) {
      if (this.isBRRBlock(romData, i)) {
        const sample = this.analyzeBRRSample(romData, i);
        if (sample) {
          samples.push(sample);
        }
      }
    }

    return samples;
  }

  /**
   * Check if data at offset is a BRR block
   */
  private static isBRRBlock(romData: Uint8Array, offset: number): boolean {
    if (offset + 8 >= romData.length) return false;

    const headerByte = romData[offset];

    // BRR header byte format: RRRRLLLL
    // R = range (0-12), L = loop flags
    const range = (headerByte >> 4) & 0x0F;
    const filter = (headerByte >> 2) & 0x03;

    // Valid range is 0-15 (allow extended range as some games use it)
    if (range > 15) return false;

    // Check for reasonable filter values
    if (filter > 3) return false; // Retain filter validation

    return true;
  }

  /**
   * Analyze BRR sample starting at offset
   */
  private static analyzeBRRSample(romData: Uint8Array, offset: number): BRRSample | null {
    let size = 0;
    let loopPoint: number | undefined;
    let blockOffset = offset;

    // Read BRR blocks until end flag
    while (blockOffset + 8 < romData.length) {
      const headerByte = romData[blockOffset];
      const endFlag = (headerByte & 0x01) !== 0;
      const loopFlag = (headerByte & 0x02) !== 0;

      if (loopFlag && loopPoint === undefined) {
        loopPoint = size;
      }

      size += 9; // Each BRR block is 9 bytes
      blockOffset += 9;

      if (endFlag) break;

      // Safety check - don't read beyond reasonable sample size
      if (size > 8192) break;
    }

    if (size < 18) return null; // Must have at least 2 blocks

    return {
      address: offset,
      size,
      loopPoint,
      confidence: 0.8
    };
  }

  /**
   * Find music sequences in ROM
   */
  private static findMusicSequences(lines: DisassemblyLine[], romData: Uint8Array): MusicSequence[] {
    const sequences: MusicSequence[] = [];

    // Look for music data references in the code
    for (const line of lines) {
      if (line.instruction.mnemonic === 'LDA' && line.operand) {
        const addr = line.operand;
        if (addr >= 0x8000 && this.looksLikeMusicData(romData, addr - 0x8000)) {
          sequences.push({
            address: addr,
            size: this.estimateMusicDataSize(romData, addr - 0x8000),
            trackCount: romData[addr - 0x8000 + 1] || 1,
            channelMask: 0xFF, // Default to all channels
            confidence: 0.6
          });
        }
      }
    }

    return sequences;
  }

  /**
   * Analyze SPC uploads to build SPC700 state
   */
  private static analyzeSPCUploads(result: ExtractedAudioState): void {
    for (const upload of result.spcUploads) {
      if (upload.targetRamAddress && upload.dataSize) {
        // Update SPC700 RAM with uploaded data
        // This is a simplified approach - in reality, you'd need to trace
        // the actual data being uploaded
        result.spc700State.ram = result.spc700State.ram || new Uint8Array(0x10000);

        // Set typical initial state for uploaded SPC
        result.spc700State.pc = upload.targetRamAddress;
        result.spc700State.sp = 0xFF;
        result.spc700State.psw = 0x02;
      }
    }
  }

  /**
   * Extract DSP register configurations
   */
  private static extractDSPConfigurations(result: ExtractedAudioState, lines: DisassemblyLine[]): void {
    // Look for DSP register setup in the code
    for (const line of lines) {
      if (line.instruction.mnemonic === 'STA' && line.operand === 0x2140) {
        // This could be setting up DSP registers via APU
        // More sophisticated analysis would track the data flow
      }
    }

    // Set up basic DSP state with default values
    if (!result.dspState.registers) {
      result.dspState.registers = new Uint8Array(128);

      // Set some reasonable defaults
      result.dspState.mainVolumeLeft = 127;
      result.dspState.mainVolumeRight = 127;
      result.dspState.flg = 0x20; // Mute flag clear
    }
  }

  /**
   * Create basic SPC700 state
   */
  private static createBasicSPC700State(): Partial<SPC700State> {
    return {
      pc: 0x0200,
      a: 0,
      x: 0,
      y: 0,
      psw: 0x02,
      sp: 0xFF,
      ram: new Uint8Array(0x10000),
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
   * Create basic DSP state
   */
  private static createBasicDSPState(): Partial<DSPState> {
    return {
      registers: new Uint8Array(128),
      voices: Array.from({ length: 8 }, () => ({
        volumeLeft: 0,
        volumeRight: 0,
        pitch: 0x1000,
        sourceNumber: 0,
        adsr1: 0,
        adsr2: 0,
        gain: 0,
        envx: 0,
        outx: 0
      })),
      mainVolumeLeft: 127,
      mainVolumeRight: 127,
      echoVolumeLeft: 0,
      echoVolumeRight: 0,
      keyOn: 0,
      keyOff: 0,
      flg: 0x20,
      endx: 0,
      efb: 0,
      pmon: 0,
      non: 0,
      eon: 0,
      dir: 0,
      esa: 0,
      edl: 0
    };
  }

  /**
   * Extract basic metadata from cartridge info
   */
  private static extractBasicMetadata(cartridgeInfo: CartridgeInfo): Partial<ID666Metadata> {
    return {
      gameTitle: 'Unknown Game', // TODO: Extract title from ROM header when available
      dumperName: 'SNES Disassembler',
      dumpDate: new Date().toLocaleDateString('en-US'),
      emulator: 0, // Unknown
      playTime: 120, // Default 2 minutes
      fadeLength: 5000 // Default 5 second fade
    };
  }

  /**
   * Enhance metadata with additional information
   */
  private static enhanceMetadata(result: ExtractedAudioState, cartridgeInfo: CartridgeInfo): void {
    // Add information based on ROM analysis
    if (result.musicSequences.length > 0) {
      result.metadata.comments = `${result.musicSequences.length} music sequences found`;
    }

    if (result.brrSamples.length > 0) {
      const samplesComment = result.metadata.comments || '';
      result.metadata.comments = `${samplesComment} ${result.brrSamples.length} BRR samples`.trim();
    }

    // TODO: Add publisher info when available from ROM header analysis
  }
}

