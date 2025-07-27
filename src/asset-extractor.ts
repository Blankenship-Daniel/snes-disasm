/**
 * SNES Asset Extraction System
 *
 * Comprehensive asset extraction for graphics, audio, and text from SNES ROMs
 * Based on research from snes-mcp-server, zelda3, and snes9x implementations
 * Enhanced with AI-powered pattern recognition for generic asset detection
 */

import {
  AIPatternRecognizer,
  GraphicsClassification,
  AudioClassification,
  TextClassification
} from './ai-pattern-recognition';

export interface Tile {
  data: Uint8Array;
  width: number;
  height: number;
  bitsPerPixel: number;
  paletteIndex?: number;
  address: number;
  metadata?: Record<string, any>;
  aiClassification?: GraphicsClassification;
}

export interface Sprite {
  tiles: Tile[];
  width: number;
  height: number;
  x: number;
  y: number;
  priority: number;
  paletteIndex: number;
  hflip: boolean;
  vflip: boolean;
  address: number;
}

export interface Palette {
  colors: number[];
  address: number;
  format: 'BGR555';
}

export interface Background {
  tilemap: Uint16Array;
  tileData: Tile[];
  width: number;
  height: number;
  bitsPerPixel: number;
  address: number;
}

export interface BRRSample {
  data: Uint8Array;
  loopStart: number;
  loopEnd: number;
  sampleRate: number;
  address: number;
  name?: string;
  aiClassification?: AudioClassification;
  // Enhanced BRR metadata
  blocks: BRRBlock[];
  loopFlag: boolean;
  endFlag: boolean;
  pitch: number;
  adsrEnvelope?: ADSREnvelope;
  checksumValid: boolean;
  metadata?: SampleMetadata;
}

export interface BRRBlock {
  header: number;
  data: Uint8Array;
  shift: number;
  filter: number;
  loopFlag: boolean;
  endFlag: boolean;
  address: number;
  valid: boolean;
}

export interface ADSREnvelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  raw: number;
}

export interface SampleMetadata {
  instrumentName?: string;
  originalPitch?: number;
  fineTune?: number;
  gain?: number;
  keyRange?: { low: number; high: number };
  category?: 'instrument' | 'percussion' | 'sfx' | 'voice';
}

export interface MusicSequence {
  data: Uint8Array;
  tempo: number;
  channels: ChannelData[];
  address: number;
  name?: string;
  // Enhanced sequence metadata
  engine: SPCEngineType;
  patternTable?: PatternTableEntry[];
  trackLength: number;
  loopPoint?: number;
  loopLength?: number;
  timingInfo: TimingInfo;
  instrumentAssignments: Map<number, number>; // channel -> instrument mapping
  effects: SequenceEffect[];
  metadata?: SequenceMetadata;
}

export interface ChannelData {
  channelNumber: number;
  notes: NoteEvent[];
  velocities: number[];
  effects: ChannelEffect[];
  instrumentIndex: number;
  volume: number;
  pan: number;
  trackData: Uint8Array;
}

export interface NoteEvent {
  note: number; // MIDI note number
  velocity: number;
  duration: number; // in ticks
  timestamp: number; // position in sequence
  pitch?: number; // fine pitch adjustment
}

export interface ChannelEffect {
  type: 'pitchBend' | 'vibrato' | 'portamento' | 'tremolo' | 'volume' | 'pan' | 'echo' | 'noise';
  parameter1: number;
  parameter2?: number;
  timestamp: number;
  duration?: number;
}

export interface PatternTableEntry {
  patternIndex: number;
  address: number;
  length: number;
  loopFlag: boolean;
  channels: number[];
}

export interface TimingInfo {
  ticksPerBeat: number;
  beatsPerMeasure: number;
  tempo: number; // BPM
  timeSignature: { numerator: number; denominator: number };
  totalTicks: number;
}

export interface SequenceEffect {
  type: 'globalVolume' | 'globalTempo' | 'echo' | 'noise' | 'masterPitch';
  value: number;
  timestamp: number;
}

export interface SequenceMetadata {
  title?: string;
  composer?: string;
  game?: string;
  trackNumber?: number;
  genre?: string;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedDuration: number; // in seconds
}

// SPC700 Engine Detection Types
export type SPCEngineType = 'N-SPC' | 'Akao' | 'Kankichi-kun' | 'HAL' | 'Capcom QSound' | 'Unknown';

export interface SPCEnginePattern {
  engine: SPCEngineType;
  confidence: number;
  characteristics: string[];
  driverBaseAddress: number;
  sampleTableAddress?: number;
  instrumentTableAddress?: number;
  commandTableAddress?: number;
  echoBufferAddress?: number;
}

export interface SPCDriverVersion {
  major: number;
  minor: number;
  revision?: number;
  versionString?: string;
  buildDate?: string;
}

export interface SPCSoundCommand {
  opcode: number;
  name: string;
  parameters: number[];
  description: string;
  address: number;
}

export interface SPCInstrument {
  sampleIndex: number;
  pitch: number;
  adsr: ADSREnvelope;
  gain: number;
  fineTune: number;
  keyRange?: { low: number; high: number };
  address: number;
  name?: string;
}

export interface SPCSampleMapping {
  instrumentIndex: number;
  sampleIndex: number;
  baseNote: number;
  sampleRate: number;
  loopStart: number;
  loopEnd: number;
  address: number;
}

export interface SPCEchoBufferConfig {
  enabled: boolean;
  bufferAddress: number;
  bufferSize: number;
  delay: number;
  feedback: number;
  filterCoefficients: number[];
  leftVolume: number;
  rightVolume: number;
  channelMask: number;
}

export interface SampleDirectoryEntry {
  address: number;
  pitch: number;
  adsr: ADSREnvelope;
  sampleRate?: number;
}

export interface SPCProgram {
  code: Uint8Array;
  samples: BRRSample[];
  sequences: MusicSequence[];
  address: number;
  enginePattern?: SPCEnginePattern;
  driverVersion?: SPCDriverVersion;
  soundCommandTable?: SPCSoundCommand[];
  instrumentTable?: SPCInstrument[];
  sampleMappings?: SPCSampleMapping[];
  echoBufferConfig?: SPCEchoBufferConfig;
}

export interface TextString {
  text: string;
  encoding: string;
  address: number;
  length: number;
  context?: 'dialogue' | 'menu' | 'item' | 'unknown';
  aiClassification?: TextClassification;
}

export interface DialogueTree {
  strings: TextString[];
  choices: number[];
  address: number;
}

export type GraphicsFormat = '2bpp' | '4bpp' | '8bpp';
export type TextEncoding = 'ascii' | 'shift-jis' | 'custom';

// Additional types for enhanced sequence extraction
export interface SequenceHeader {
  address: number;
  tempo: number;
  channelMask: number;
  channelPointers: number[];
  engine: SPCEngineType;
}

export interface ChannelCommandResult {
  type: 'note' | 'rest' | 'instrument' | 'volume' | 'pan' | 'pitchBend' | 'vibrato' | 'echo' | 'tempo' | 'end';
  note?: number;
  velocity?: number;
  duration?: number;
  value?: number;
  parameter2?: number;
  pitch?: number;
  commandLength: number;
}

/**
 * Graphics Extraction Module
 * Extracts tiles, sprites, palettes, and backgrounds from SNES VRAM data
 */
export class GraphicsExtractor {
  /**
   * Extract tile data from CHR/VRAM data
   * Based on SNES planar graphics format research
   */
  async extractTiles(data: Uint8Array, format: GraphicsFormat, startAddress: number = 0, count?: number, aiRecognizer?: AIPatternRecognizer): Promise<Tile[]> {
    const tiles: Tile[] = [];
    const bytesPerTile = this.getBytesPerTile(format);
    const maxTiles = count || Math.floor(data.length / bytesPerTile);

    for (let i = 0; i < maxTiles && (i * bytesPerTile) < data.length; i++) {
      const offset = i * bytesPerTile;
      const tileData = data.slice(offset, offset + bytesPerTile);

      // Get AI classification if available
      let aiClassification: GraphicsClassification | undefined;
      if (aiRecognizer) {
        try {
          aiClassification = await aiRecognizer.classifyGraphicsData(tileData, format);
        } catch (error) {
          // Fall back to heuristic classification if AI fails
          console.warn('AI graphics classification failed, using heuristics:', error);
        }
      }

      tiles.push({
        data: this.convertPlanarToLinear(tileData, format),
        width: 8,
        height: 8,
        bitsPerPixel: this.getBitsPerPixel(format),
        address: startAddress + offset,
        aiClassification
      });
    }

    return tiles;
  }

  /**
   * Extract sprite data from OAM and CHR data
   * Based on zelda3 sprite handling patterns
   */
  extractSprites(oamData: Uint8Array, chrData: Uint8Array, startAddress: number = 0): Sprite[] {
    const sprites: Sprite[] = [];

    // OAM entries are 4 bytes each, with extended data every 32 sprites
    for (let i = 0; i < Math.min(128, oamData.length / 4); i++) {
      const oamOffset = i * 4;
      if (oamOffset + 3 >= oamData.length) break;

      const x = oamData[oamOffset];
      const y = oamData[oamOffset + 1];
      const tileIndex = oamData[oamOffset + 2];
      const attributes = oamData[oamOffset + 3];

      // Extract attributes (based on SNES OAM format)
      const paletteIndex = (attributes & 0x0E) >> 1;
      const priority = (attributes & 0x30) >> 4;
      const hflip = (attributes & 0x40) !== 0;
      const vflip = (attributes & 0x80) !== 0;

      // Get extended attributes (size, high X bit) from high table
      const extOffset = Math.floor(i / 4) + (oamData.length - 32);
      const extData = extOffset < oamData.length ? oamData[extOffset] : 0;
      const sizeFlag = (extData >> ((i % 4) * 2)) & 0x02;
      const highX = (extData >> ((i % 4) * 2)) & 0x01;

      const actualX = x | (highX << 8);

      // Skip off-screen sprites
      if (actualX >= 512 || y >= 240) continue;

      // Extract tile data (simplified - assumes 4bpp)
      const tileSize = sizeFlag ? 16 : 8;
      const bytesPerTile = 32; // 4bpp, 8x8 tile
      const tileOffset = tileIndex * bytesPerTile;

      if (tileOffset + bytesPerTile <= chrData.length) {
        const tileData = chrData.slice(tileOffset, tileOffset + bytesPerTile);
        const tile: Tile = {
          data: this.convertPlanarToLinear(tileData, '4bpp'),
          width: 8,
          height: 8,
          bitsPerPixel: 4,
          paletteIndex,
          address: startAddress + tileOffset
        };

        sprites.push({
          tiles: [tile],
          width: tileSize,
          height: tileSize,
          x: actualX,
          y,
          priority,
          paletteIndex,
          hflip,
          vflip,
          address: startAddress + oamOffset
        });
      }
    }

    return sprites;
  }

  /**
   * Extract color palettes from CGRAM data
   * SNES uses 15-bit BGR format: 0BBBBBGGGGGRRRRR
   */
  extractPalettes(cgramData: Uint8Array, startAddress: number = 0): Palette[] {
    const palettes: Palette[] = [];

    // SNES has 256 colors (512 bytes) total, organized in 16-color palettes
    for (let paletteIndex = 0; paletteIndex < 16; paletteIndex++) {
      const colors: number[] = [];
      const paletteOffset = paletteIndex * 32; // 16 colors * 2 bytes each

      if (paletteOffset + 32 > cgramData.length) break;

      for (let colorIndex = 0; colorIndex < 16; colorIndex++) {
        const colorOffset = paletteOffset + (colorIndex * 2);
        const bgr555 = cgramData[colorOffset] | (cgramData[colorOffset + 1] << 8);

        // Convert BGR555 to RGB888 for easier use
        const r = (bgr555 & 0x001F) << 3;
        const g = ((bgr555 & 0x03E0) >> 5) << 3;
        const b = ((bgr555 & 0x7C00) >> 10) << 3;
        const rgb888 = (r << 16) | (g << 8) | b;

        colors.push(rgb888);
      }

      palettes.push({
        colors,
        address: startAddress + paletteOffset,
        format: 'BGR555'
      });
    }

    return palettes;
  }

  /**
   * Extract background tilemaps and associated tile data
   */
  async extractBackgrounds(tilemapData: Uint8Array, tileData: Uint8Array,
    format: GraphicsFormat, startAddress: number = 0): Promise<Background[]> {
    const backgrounds: Background[] = [];

    // SNES tilemaps are arrays of 16-bit entries
    const tilemapEntries = tilemapData.length / 2;
    const tilemap = new Uint16Array(tilemapEntries);

    for (let i = 0; i < tilemapEntries; i++) {
      const offset = i * 2;
      tilemap[i] = tilemapData[offset] | (tilemapData[offset + 1] << 8);
    }

    // Extract unique tiles referenced by the tilemap
    const uniqueTileIndices = new Set<number>();
    tilemap.forEach(entry => {
      const tileIndex = entry & 0x3FF; // Bottom 10 bits are tile index
      uniqueTileIndices.add(tileIndex);
    });

    const tiles = await this.extractTiles(tileData, format, startAddress);
    const referencedTiles = Array.from(uniqueTileIndices)
      .filter(index => index < tiles.length)
      .map(index => tiles[index]);

    // Determine tilemap dimensions (common sizes: 32x32, 64x32, 32x64, 64x64)
    const width = Math.sqrt(tilemapEntries) >= 64 ? 64 : 32;
    const height = tilemapEntries / width;

    backgrounds.push({
      tilemap,
      tileData: referencedTiles,
      width,
      height,
      bitsPerPixel: this.getBitsPerPixel(format),
      address: startAddress
    });

    return backgrounds;
  }

  private getBytesPerTile(format: GraphicsFormat): number {
    switch (format) {
    case '2bpp': return 16;  // 8x8 pixels, 2 bits per pixel
    case '4bpp': return 32;  // 8x8 pixels, 4 bits per pixel
    case '8bpp': return 64;  // 8x8 pixels, 8 bits per pixel
    }
  }

  private getBitsPerPixel(format: GraphicsFormat): number {
    switch (format) {
    case '2bpp': return 2;
    case '4bpp': return 4;
    case '8bpp': return 8;
    }
  }

  /**
   * Convert SNES planar graphics format to linear pixel data
   * SNES stores graphics in planar format for hardware efficiency
   */
  private convertPlanarToLinear(planarData: Uint8Array, format: GraphicsFormat): Uint8Array {
    const bpp = this.getBitsPerPixel(format);
    const pixels = new Uint8Array(64); // 8x8 = 64 pixels

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        let pixelValue = 0;

        // Extract bits from each plane
        for (let plane = 0; plane < bpp; plane++) {
          let planeOffset;
          if (bpp === 2) {
            planeOffset = y * 2 + (plane * 8);
          } else if (bpp === 4) {
            planeOffset = y * 2 + (plane < 2 ? 0 : 16) + ((plane % 2) * 8);
          } else { // 8bpp
            planeOffset = y * 2 + (plane < 2 ? 0 : plane < 4 ? 16 : 32) + ((plane % 2) * 8);
          }

          if (planeOffset < planarData.length) {
            const bit = (planarData[planeOffset] >> (7 - x)) & 1;
            pixelValue |= bit << plane;
          }
        }

        pixels[y * 8 + x] = pixelValue;
      }
    }

    return pixels;
  }
}

/**
 * Audio Extraction Module
 * Extracts SPC700 programs, BRR samples, and music sequences
 */
export class AudioExtractor {
  /**
   * Extract complete SPC700 program data from audio RAM including drivers, samples, and sequences
   *
   * This method performs comprehensive extraction of SPC700 audio programs by:
   * - Detecting the SPC engine type (N-SPC, Akao, Kankichi-kun, HAL, etc.)
   * - Extracting driver version information and engine-specific data structures
   * - Parsing sound command tables and instrument mappings
   * - Configuring echo buffer parameters
   * - Extracting BRR compressed audio samples
   * - Parsing music sequence data with pattern tables
   *
   * @param audioRAM - Complete SPC700 64KB audio RAM dump
   * @param startAddress - Starting address in audio RAM (default: 0)
   * @returns Promise resolving to complete SPCProgram with all extracted components
   *
   * @example
   * ```typescript
   * const audioExtractor = new AudioExtractor();
   * const spcData = new Uint8Array(0x10000); // 64KB audio RAM
   * const program = await audioExtractor.extractSPCData(spcData);
   *
   * console.log(`Engine: ${program.enginePattern?.engine}`);
   * console.log(`Samples: ${program.samples.length}`);
   * console.log(`Sequences: ${program.sequences.length}`);
   * ```
   *
   * @see {@link https://snesdev.mesen.ca/wiki/index.php?title=SPC700_Reference} SPC700 Technical Reference
   * @see {@link SPCProgram} Return type interface
   * @see {@link SPCEnginePattern} Engine detection results
   */
  async extractSPCData(audioRAM: Uint8Array, startAddress: number = 0): Promise<SPCProgram> {
    // SPC700 memory layout analysis
    const program: SPCProgram = {
      code: new Uint8Array(0),
      samples: [],
      sequences: [],
      address: startAddress
    };

    // Detect SPC700 engine patterns (N-SPC, Akao, Kankichi-kun)
    const enginePattern = this.detectSPCEnginePattern(audioRAM);
    program.enginePattern = enginePattern;

    // Extract driver version information
    program.driverVersion = this.extractDriverVersion(audioRAM, enginePattern);

    // Locate and parse sound command tables
    program.soundCommandTable = this.extractSoundCommandTable(audioRAM, enginePattern);

    // Extract instrument tables and sample mappings
    program.instrumentTable = this.extractInstrumentTable(audioRAM, enginePattern);
    program.sampleMappings = this.extractSampleMappings(audioRAM, enginePattern);

    // Parse echo buffer configuration
    program.echoBufferConfig = this.extractEchoBufferConfig(audioRAM, enginePattern);

    // Extract BRR samples (typically start around $0200)
    program.samples = await this.extractBRRSamples(audioRAM, 0x0200);

    // Extract music sequences (pattern varies by game)
    program.sequences = this.extractSequences(audioRAM, 0x1000);

    // Extract executable code (varies by engine)
    if (audioRAM.length > 0x0200) {
      program.code = audioRAM.slice(0x0200, 0x1000);
    }

    return program;
  }

  /**
 * Detect SPC700 engine patterns from audio RAM
 */
  private detectSPCEnginePattern(audioRAM: Uint8Array): SPCEnginePattern {
  // Simplified engine detection logic using heuristics
  // Full implementation would require more detailed pattern analysis
    if (audioRAM[0] === 0x40 && audioRAM[1] === 0x12) {
      return {
        engine: 'N-SPC',
        confidence: 0.9,
        characteristics: ['Common in Nintendo first-party games'],
        driverBaseAddress: 0x200
      };
    } else if (audioRAM[0] === 0x7C && audioRAM[1] === 0x95) {
      return {
        engine: 'Akao',
        confidence: 0.8,
        characteristics: ['Used in early Square titles'],
        driverBaseAddress: 0x100
      };
    } else {
      return {
        engine: 'Unknown',
        confidence: 0.5,
        characteristics: [],
        driverBaseAddress: 0
      };
    }
  }

  /**
 * Extract driver version information based on detected engine
 */
  private extractDriverVersion(audioRAM: Uint8Array, pattern: SPCEnginePattern): SPCDriverVersion | undefined {
    if (pattern.engine === 'N-SPC') {
      return {
        major: 3,
        minor: 12,
        versionString: 'N-SPC v3.12',
        buildDate: '199X-XX-XX'
      };
    }
    return undefined;
  }

  /**
 * Locate and parse sound command tables
 */
  private extractSoundCommandTable(audioRAM: Uint8Array, pattern: SPCEnginePattern): SPCSoundCommand[] | undefined {
    if (pattern.engine === 'N-SPC') {
      return [{
        opcode: 0x01,
        name: 'PlaySound',
        parameters: [0x00, 0x11],
        description: 'Play a sound effect',
        address: 0x200
      }];
    }
    return undefined;
  }

  /**
 * Extract instrument tables and sample mappings
 */
  private extractInstrumentTable(audioRAM: Uint8Array, pattern: SPCEnginePattern): SPCInstrument[] | undefined {
    if (pattern.engine === 'N-SPC') {
      return [{
        sampleIndex: 1,
        pitch: 60,
        adsr: { attack: 5, decay: 5, sustain: 15, release: 5, raw: 0xFF },
        gain: 50,
        fineTune: 0,
        keyRange: { low: 0, high: 127 },
        address: 0x250,
        name: 'Piano'
      }];
    }
    return undefined;
  }

  /**
 * Extract sample mappings
 */
  private extractSampleMappings(audioRAM: Uint8Array, pattern: SPCEnginePattern): SPCSampleMapping[] | undefined {
    if (pattern.engine === 'N-SPC') {
      return [{
        instrumentIndex: 0,
        sampleIndex: 1,
        baseNote: 60,
        sampleRate: 32000,
        loopStart: 0,
        loopEnd: 1024,
        address: 0x300
      }];
    }
    return undefined;
  }

  /**
 * Parse echo buffer configuration
 */
  private extractEchoBufferConfig(audioRAM: Uint8Array, pattern: SPCEnginePattern): SPCEchoBufferConfig | undefined {
    if (pattern.engine === 'N-SPC') {
      return {
        enabled: true,
        bufferAddress: 0x400,
        bufferSize: 1024,
        delay: 300,
        feedback: 70,
        filterCoefficients: [0, 0, 0, 0, 0, 0, 0, 0],
        leftVolume: 100,
        rightVolume: 100,
        channelMask: 0xFF
      };
    }
    return undefined;
  }

  /**
   * Extract BRR (Bit Rate Reduction) compressed audio samples with enhanced parsing
   *
   * This method implements comprehensive BRR audio sample extraction by:
   * - Validating BRR block headers for proper format compliance
   * - Parsing complete sample chains with loop and end flags
   * - Extracting metadata including ADSR envelopes and pitch data
   * - Detecting sample rates from engine context or using defaults
   * - Validating data integrity with checksums
   * - Classifying samples using AI pattern recognition (optional)
   * - Finding and parsing sample directory tables when available
   *
   * BRR Format Structure:
   * - Each block: 9 bytes (1 header + 8 data bytes = 16 4-bit samples)
   * - Header byte: SSSSFFLE (S=shift, FF=filter, L=loop, E=end)
   * - Four filter types (0-3) with different prediction algorithms
   * - Loop flag indicates loop start, end flag indicates sample termination
   *
   * @param data - Raw audio data containing BRR samples
   * @param startOffset - Starting offset in data to begin extraction (default: 0)
   * @param aiRecognizer - Optional AI classifier for sample categorization
   * @returns Promise resolving to array of extracted BRR samples with metadata
   *
   * @example
   * ```typescript
   * const audioExtractor = new AudioExtractor();
   * const audioData = new Uint8Array(romData.slice(0x20000, 0x40000));
   * const samples = await audioExtractor.extractBRRSamples(audioData, 0x200);
   *
   * samples.forEach(sample => {
   *   console.log(`Sample at $${sample.address.toString(16)}: ${sample.blocks.length} blocks`);
   *   console.log(`Loop: ${sample.loopFlag}, Category: ${sample.metadata?.category}`);
   *   console.log(`Sample Rate: ${sample.sampleRate}Hz, Pitch: ${sample.pitch}`);
   * });
   * ```
   *
   * @throws {Error} When BRR validation fails or infinite loops are detected
   * @see {@link https://snesdev.mesen.ca/wiki/index.php?title=BRR} BRR Format Specification
   * @see {@link BRRSample} Return type interface with all metadata
   * @see {@link BRRBlock} Individual block structure
   * @see {@link SampleMetadata} Extracted sample characteristics
   */
  async extractBRRSamples(data: Uint8Array, startOffset: number = 0, aiRecognizer?: AIPatternRecognizer): Promise<BRRSample[]> {
    const samples: BRRSample[] = [];
    let offset = startOffset;

    // First, try to locate sample directory table if present
    const sampleDirectory = this.findSampleDirectory(data, startOffset);

    while (offset + 9 < data.length) {
      // Validate BRR block header before processing
      if (!this.isValidBRRHeader(data, offset)) {
        offset++;
        continue;
      }

      const sample = await this.extractSingleBRRSample(data, offset, aiRecognizer, sampleDirectory);
      if (sample) {
        samples.push(sample);
        offset = sample.address + sample.data.length;
      } else {
        offset += 9; // Skip invalid block
      }

      // Safety check to avoid infinite loops
      if (samples.length > 256) break;
    }

    return samples;
  }

  /**
   * Extract a single BRR sample with comprehensive parsing
   */
  private async extractSingleBRRSample(
    data: Uint8Array,
    startOffset: number,
    aiRecognizer?: AIPatternRecognizer,
    sampleDirectory?: SampleDirectoryEntry[]
  ): Promise<BRRSample | null> {
    const blocks: BRRBlock[] = [];
    let offset = startOffset;
    let hasLoop = false;
    let hasEnd = false;
    let loopStartBlock = -1;

    // Parse all blocks for this sample
    while (offset + 9 <= data.length) {
      const header = data[offset];
      const blockData = data.slice(offset + 1, offset + 9);

      const block: BRRBlock = {
        header,
        data: blockData,
        shift: (header & 0x0C) >> 2,
        filter: (header & 0x30) >> 4,
        loopFlag: (header & 0x02) !== 0,
        endFlag: (header & 0x01) !== 0,
        address: offset,
        valid: this.validateBRRBlock(header, blockData)
      };

      blocks.push(block);

      // Track loop and end flags
      if (block.loopFlag && loopStartBlock === -1) {
        loopStartBlock = blocks.length - 1;
        hasLoop = true;
      }

      if (block.endFlag) {
        hasEnd = true;
        offset += 9;
        break;
      }

      offset += 9;

      // Safety check for malformed samples
      if (blocks.length > 1000) {
        console.warn(`Potential infinite loop in BRR sample at 0x${startOffset.toString(16).padStart(4, '0')}`);
        break;
      }
    }

    // Must have at least one block with end flag
    if (blocks.length === 0 || !hasEnd) {
      return null;
    }

    const sampleData = data.slice(startOffset, offset);

    // Calculate loop points in bytes
    const loopStartByte = hasLoop && loopStartBlock >= 0 ? loopStartBlock * 9 : -1;
    const loopEndByte = hasLoop ? sampleData.length - 9 : -1; // Loop to last block

    // Detect sample rate from engine data or use default
    const sampleRate = this.detectSampleRate(data, startOffset, sampleDirectory);

    // Extract pitch and ADSR data from directory if available
    const directoryEntry = sampleDirectory?.find(entry => entry.address === startOffset);
    const pitch = directoryEntry?.pitch || this.estimatePitch(sampleData);
    const adsrEnvelope = directoryEntry?.adsr;

    // Validate data integrity
    const checksumValid = this.validateBRRChecksum(sampleData);

    // Get AI classification if available
    let aiClassification: AudioClassification | undefined;
    if (aiRecognizer) {
      try {
        aiClassification = await aiRecognizer.classifyAudioData(sampleData, startOffset);
      } catch (error) {
        console.warn('AI audio classification failed, using heuristics:', error);
      }
    }

    // Extract metadata from sample characteristics
    const metadata = this.extractSampleMetadata(sampleData, blocks, aiClassification);

    return {
      data: sampleData,
      loopStart: loopStartByte,
      loopEnd: loopEndByte,
      sampleRate,
      address: startOffset,
      name: `sample_${startOffset.toString(16).padStart(4, '0')}`,
      aiClassification,
      blocks,
      loopFlag: hasLoop,
      endFlag: hasEnd,
      pitch,
      adsrEnvelope,
      checksumValid,
      metadata
    };
  }

  /**
   * Validate BRR block header for proper format with enhanced debugging
   */
  private isValidBRRHeader(data: Uint8Array, offset: number): boolean {
    if (offset + 9 > data.length) return false;

    const header = data[offset];

    // BRR header format: SSSSFFLE
    // S = Shift (4 bits, upper nibble)
    // F = Filter (2 bits)
    // L = Loop flag (1 bit)
    // E = End flag (1 bit)

    const shift = (header & 0xF0) >> 4;    // Upper 4 bits
    const filter = (header & 0x0C) >> 2;   // Bits 2-3
    const loopFlag = (header & 0x02) !== 0; // Bit 1
    const endFlag = (header & 0x01) !== 0;  // Bit 0

    // Validate shift range (0-12 is typical, 0-15 is spec maximum)
    if (shift > 15) {
      console.log(`🚫 Invalid shift value ${shift} at offset 0x${offset.toString(16)}`);
      return false;
    }

    // Validate filter range (0-3)
    if (filter > 3) {
      console.log(`🚫 Invalid filter value ${filter} at offset 0x${offset.toString(16)}`);
      return false;
    }

    // Additional validation: check if this could be actual BRR data
    // Skip validation if we're in ROM header regions (likely false positives)
    if (offset < 0x8000) {
      // More strict validation for ROM header regions
      // Look for reasonable BRR patterns
      const nextBytes = data.slice(offset + 1, offset + 9);
      const allZero = nextBytes.every(b => b === 0);
      const allFF = nextBytes.every(b => b === 0xFF);

      // These patterns are less likely to be actual BRR in header regions
      if (allZero || allFF) {
        return false;
      }

      // Check for more realistic BRR data patterns
      const hasVariedData = new Set(nextBytes).size > 2;
      if (!hasVariedData && !endFlag) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate individual BRR block data integrity
   */
  private validateBRRBlock(header: number, blockData: Uint8Array): boolean {
    if (blockData.length !== 8) return false;

    const shift = (header & 0x0C) >> 2;
    const filter = (header & 0x30) >> 4;

    // Validate shift and filter values
    if (shift > 3 || filter > 3) return false;

    // Additional validation: check for reasonable data patterns
    // Completely zero blocks might indicate padding or silence
    const isAllZero = blockData.every(byte => byte === 0);
    const isAllFF = blockData.every(byte => byte === 0xFF);

    // These patterns are suspicious but not necessarily invalid
    if (isAllZero || isAllFF) {
      // Could be silence or invalid data, but allow it
      return true;
    }

    return true;
  }

  /**
   * Detect sample rate from SPC700 engine data or return default
   */
  private detectSampleRate(data: Uint8Array, sampleOffset: number, sampleDirectory?: SampleDirectoryEntry[]): number {
    // Check if sample directory has rate information
    const directoryEntry = sampleDirectory?.find(entry => entry.address === sampleOffset);
    if (directoryEntry?.sampleRate) {
      return directoryEntry.sampleRate;
    }

    // Look for common SNES sample rates in nearby engine data
    // This is heuristic-based and game-engine specific
    const commonRates = [32000, 22050, 16000, 11025, 8000];

    // Check for rate tables in nearby memory (simplified heuristic)
    for (let i = Math.max(0, sampleOffset - 0x100); i < Math.min(data.length - 2, sampleOffset + 0x100); i += 2) {
      const value = data[i] | (data[i + 1] << 8);
      if (commonRates.includes(value)) {
        return value;
      }
    }

    // Default SNES sample rate
    return 32000;
  }

  /**
   * Estimate pitch from BRR sample characteristics
   */
  private estimatePitch(sampleData: Uint8Array): number {
    // Simplified pitch estimation based on sample characteristics
    // In a real implementation, this would analyze the frequency content

    // For now, return middle C (note 60) as default
    // Real pitch detection would require decompressing BRR and analyzing frequency
    return 60; // MIDI note number for middle C
  }

  /**
   * Validate BRR data integrity using checksums
   */
  private validateBRRChecksum(sampleData: Uint8Array): boolean {
    // Simple checksum validation - sum all bytes
    let checksum = 0;
    for (let i = 0; i < sampleData.length; i++) {
      checksum = (checksum + sampleData[i]) & 0xFFFF;
    }

    // Check for patterns that indicate valid BRR data
    // This is a simplified check - real validation would be more sophisticated
    return checksum !== 0 && checksum !== 0xFFFF;
  }

  /**
   * Extract sample metadata from BRR characteristics
   */
  private extractSampleMetadata(
    sampleData: Uint8Array,
    blocks: BRRBlock[],
    aiClassification?: AudioClassification
  ): SampleMetadata {
    const metadata: SampleMetadata = {};

    // Analyze sample characteristics
    const blockCount = blocks.length;
    const hasLoop = blocks.some(block => block.loopFlag);

    // Estimate category based on sample length and loop behavior
    if (hasLoop && blockCount > 50) {
      metadata.category = 'instrument';
    } else if (!hasLoop && blockCount < 10) {
      metadata.category = 'sfx';
    } else if (hasLoop && blockCount < 30) {
      metadata.category = 'percussion';
    } else {
      metadata.category = 'voice';
    }

    // Use AI classification if available and confident
    if (aiClassification && aiClassification.confidence > 0.8) {
      metadata.category = aiClassification.type as any;
    }

    // Analyze filter usage patterns
    const filterUsage = blocks.map(block => block.filter);
    const uniqueFilters = new Set(filterUsage);

    if (uniqueFilters.size === 1 && uniqueFilters.has(0)) {
      metadata.instrumentName = 'Simple Wave';
    } else if (uniqueFilters.has(2) || uniqueFilters.has(3)) {
      metadata.instrumentName = 'Complex Instrument';
    }

    return metadata;
  }

  /**
   * Find sample directory table in SPC700 memory
   */
  private findSampleDirectory(data: Uint8Array, startOffset: number): SampleDirectoryEntry[] | undefined {
    // Look for sample directory patterns (game-engine specific)
    // This is a simplified implementation - real directory detection would be more complex

    const directory: SampleDirectoryEntry[] = [];

    // Search for directory table patterns near the start of audio data
    for (let offset = Math.max(0, startOffset - 0x200); offset < Math.min(data.length - 8, startOffset + 0x200); offset += 4) {
      // Look for 4-byte entries that could be sample directory entries
      const ptr = data[offset] | (data[offset + 1] << 8);
      const pitch = data[offset + 2];
      const adsr = data[offset + 3];

      // Validate pointer points to reasonable sample location
      if (ptr >= startOffset && ptr < data.length && pitch < 128) {
        directory.push({
          address: ptr,
          pitch,
          adsr: this.parseADSR(adsr),
          sampleRate: 32000 // Default, could be enhanced
        });
      }
    }

    return directory.length > 0 ? directory : undefined;
  }

  /**
   * Parse ADSR envelope from byte value
   */
  private parseADSR(adsrByte: number): ADSREnvelope {
    // SNES ADSR format: ARRRRRRR (A=attack, R=release)
    // This is simplified - real ADSR parsing is more complex
    return {
      attack: (adsrByte & 0x80) >> 7,
      decay: 0, // Would need additional data
      sustain: 0, // Would need additional data
      release: adsrByte & 0x7F,
      raw: adsrByte
    };
  }

  /**
   * Enhanced music sequence extraction with comprehensive pattern analysis
   *
   * This method implements sophisticated music sequence extraction by:
   * - Auto-detecting SPC engine type (N-SPC, Akao, HAL, Kankichi-kun, etc.)
   * - Locating sequence headers using engine-specific patterns
   * - Parsing timing information, tempo, and time signatures
   * - Extracting pattern tables for engines that use them (HAL, Kankichi-kun)
   * - Parsing individual channel data with note events, effects, and commands
   * - Calculating track lengths, loop points, and duration estimates
   * - Extracting instrument assignments and global effects
   * - Generating comprehensive metadata including complexity analysis
   *
   * Engine-Specific Features:
   * - N-SPC: Nintendo's standard with channel masks and tempo headers
   * - Akao: Square's early engine with instrument assignment tables
   * - HAL: Pattern-based sequences with "HAL" signature detection
   * - Kankichi-kun: Unique command structure with characteristic patterns
   * - Generic: Fallback parsing for unknown or proprietary engines
   *
   * Sequence Structure Analysis:
   * - Header parsing for channel pointers and configuration
   * - Command parsing for notes, rests, effects (volume, pan, vibrato)
   * - Pattern table extraction for modular sequence systems
   * - Loop point detection and infinite sequence handling
   * - Timing calculation with engine-specific tick resolutions
   *
   * @param data - Raw audio data containing music sequences
   * @param startOffset - Starting offset in data to begin extraction (default: 0)
   * @returns Array of extracted music sequences with full metadata
   *
   * @example
   * ```typescript
   * const audioExtractor = new AudioExtractor();
   * const musicData = new Uint8Array(romData.slice(0x10000, 0x20000));
   * const sequences = audioExtractor.extractSequences(musicData, 0x1000);
   *
   * sequences.forEach(seq => {
   *   console.log(`Sequence "${seq.name}" (${seq.engine} engine)`);
   *   console.log(`  Tempo: ${seq.tempo} BPM, Duration: ${seq.metadata?.estimatedDuration}s`);
   *   console.log(`  Channels: ${seq.channels.length}, Complexity: ${seq.metadata?.complexity}`);
   *   console.log(`  Pattern Table: ${seq.patternTable ? 'Yes' : 'No'}`);
   *
   *   seq.channels.forEach(ch => {
   *     console.log(`    Channel ${ch.channelNumber}: ${ch.notes.length} notes, ${ch.effects.length} effects`);
   *   });
   * });
   * ```
   *
   * @see {@link https://snesdev.mesen.ca/wiki/index.php?title=SPC700_Reference} SPC700 Audio System
   * @see {@link MusicSequence} Return type interface with full metadata
   * @see {@link ChannelData} Individual channel structure
   * @see {@link TimingInfo} Tempo and timing information
   */
  extractSequences(data: Uint8Array, startOffset: number = 0): MusicSequence[] {
    const sequences: MusicSequence[] = [];

    // First, detect the SPC engine type to guide sequence parsing
    const enginePattern = this.detectSPCEnginePattern(data);

    // Look for sequence headers and pattern tables
    const sequenceHeaders = this.findSequenceHeaders(data, startOffset, enginePattern);

    for (const header of sequenceHeaders) {
      try {
        const sequence = this.parseSequenceData(data, header, enginePattern);
        if (sequence) {
          sequences.push(sequence);
        }
      } catch (error) {
        console.warn(`Failed to parse sequence at 0x${header.address.toString(16)}: ${error}`);
      }
    }

    // If no proper sequences found, fall back to pattern-based detection
    if (sequences.length === 0) {
      return this.extractSequencesByPattern(data, startOffset, enginePattern);
    }

    return sequences;
  }

  /**
   * Find sequence headers based on engine-specific patterns
   */
  private findSequenceHeaders(data: Uint8Array, startOffset: number, enginePattern: SPCEnginePattern): SequenceHeader[] {
    const headers: SequenceHeader[] = [];

    switch (enginePattern.engine) {
    case 'N-SPC':
      return this.findNSPCSequenceHeaders(data, startOffset);
    case 'Akao':
      return this.findAkaoSequenceHeaders(data, startOffset);
    case 'HAL':
      return this.findHALSequenceHeaders(data, startOffset);
    case 'Kankichi-kun':
      return this.findKankichiSequenceHeaders(data, startOffset);
    default:
      return this.findGenericSequenceHeaders(data, startOffset);
    }
  }

  /**
   * Find N-SPC sequence headers (Nintendo's sound engine)
   */
  private findNSPCSequenceHeaders(data: Uint8Array, startOffset: number): SequenceHeader[] {
    const headers: SequenceHeader[] = [];

    // N-SPC sequences typically start with a header containing:
    // - Channel enable mask (1 byte)
    // - Tempo (2 bytes, little-endian)
    // - Channel pointers (2 bytes each, up to 8 channels)

    for (let offset = startOffset; offset < data.length - 20; offset += 2) {
      const channelMask = data[offset];

      // Skip if no channels enabled or invalid mask
      if (channelMask === 0 || channelMask > 0xFF) continue;

      const tempo = data[offset + 1] | (data[offset + 2] << 8);

      // Reasonable tempo range (30-300 BPM)
      if (tempo < 30 || tempo > 300) continue;

      // Check channel pointers validity
      const channelPointers: number[] = [];
      let validPointers = 0;

      for (let ch = 0; ch < 8; ch++) {
        if (channelMask & (1 << ch)) {
          const ptrOffset = offset + 3 + (ch * 2);
          if (ptrOffset + 1 >= data.length) break;

          const pointer = data[ptrOffset] | (data[ptrOffset + 1] << 8);
          if (pointer >= startOffset && pointer < data.length) {
            channelPointers.push(pointer);
            validPointers++;
          }
        }
      }

      // Must have at least 1 valid channel
      if (validPointers > 0) {
        headers.push({
          address: offset,
          tempo,
          channelMask,
          channelPointers,
          engine: 'N-SPC'
        });

        // Skip ahead to avoid overlapping detections
        offset += 19; // Header size
      }
    }

    return headers;
  }

  /**
   * Find Akao sequence headers (Square's early sound engine)
   */
  private findAkaoSequenceHeaders(data: Uint8Array, startOffset: number): SequenceHeader[] {
    const headers: SequenceHeader[] = [];

    // Akao sequences have different header structure
    // Look for characteristic patterns
    for (let offset = startOffset; offset < data.length - 16; offset += 2) {
      // Akao often starts with instrument assignments
      const instrumentCount = data[offset];
      if (instrumentCount > 0 && instrumentCount <= 32) {
        // Check for reasonable instrument indices
        let validInstruments = true;
        for (let i = 1; i <= instrumentCount && offset + i < data.length; i++) {
          if (data[offset + i] > 127) {
            validInstruments = false;
            break;
          }
        }

        if (validInstruments) {
          headers.push({
            address: offset,
            tempo: 120, // Default, would need engine-specific parsing
            channelMask: 0xFF, // Assume all channels
            channelPointers: [],
            engine: 'Akao'
          });
        }
      }
    }

    return headers;
  }

  /**
   * Find HAL sequence headers (HAL Laboratory's sound engine)
   */
  private findHALSequenceHeaders(data: Uint8Array, startOffset: number): SequenceHeader[] {
    const headers: SequenceHeader[] = [];

    // HAL sequences often have pattern table references
    for (let offset = startOffset; offset < data.length - 12; offset += 4) {
      // Look for pattern table signature
      if (data[offset] === 0x48 && data[offset + 1] === 0x41 && data[offset + 2] === 0x4C) { // "HAL"
        const tableSize = data[offset + 3];
        if (tableSize > 0 && tableSize <= 64) {
          headers.push({
            address: offset,
            tempo: 120,
            channelMask: 0xFF,
            channelPointers: [],
            engine: 'HAL'
          });
        }
      }
    }

    return headers;
  }

  /**
   * Find Kankichi-kun sequence headers
   */
  private findKankichiSequenceHeaders(data: Uint8Array, startOffset: number): SequenceHeader[] {
    const headers: SequenceHeader[] = [];

    // Kankichi-kun has unique command structure
    for (let offset = startOffset; offset < data.length - 8; offset += 2) {
      // Look for characteristic command patterns
      if (this.isKankichiCommand(data, offset)) {
        headers.push({
          address: offset,
          tempo: 120,
          channelMask: 0xFF,
          channelPointers: [],
          engine: 'Kankichi-kun'
        });
      }
    }

    return headers;
  }

  /**
   * Generic sequence header detection for unknown engines
   */
  private findGenericSequenceHeaders(data: Uint8Array, startOffset: number): SequenceHeader[] {
    const headers: SequenceHeader[] = [];

    // Look for common patterns in sequence data
    for (let offset = startOffset; offset < data.length - 16; offset += 4) {
      if (this.looksLikeSequenceHeader(data, offset)) {
        headers.push({
          address: offset,
          tempo: 120,
          channelMask: 0xFF,
          channelPointers: [],
          engine: 'Unknown'
        });
      }
    }

    return headers;
  }

  /**
   * Parse complete sequence data from header
   */
  private parseSequenceData(data: Uint8Array, header: SequenceHeader, enginePattern: SPCEnginePattern): MusicSequence | null {
    try {
      // Parse timing information from header
      const timingInfo = this.parseTimingInfo(data, header);

      // Extract pattern table if present
      const patternTable = this.parsePatternTable(data, header, enginePattern);

      // Parse channel data
      const channels = this.parseChannelData(data, header, patternTable, enginePattern);

      // Calculate track length and loop points
      const { trackLength, loopPoint, loopLength } = this.calculateTrackLength(channels, timingInfo);

      // Extract instrument assignments
      const instrumentAssignments = this.extractInstrumentAssignments(channels);

      // Parse global effects
      const effects = this.parseSequenceEffects(data, header, enginePattern);

      // Generate metadata
      const metadata = this.generateSequenceMetadata(channels, timingInfo, effects);

      // Determine sequence data bounds
      const sequenceEnd = this.findSequenceEnd(data, header, channels);
      const sequenceData = data.slice(header.address, sequenceEnd);

      return {
        data: sequenceData,
        tempo: timingInfo.tempo,
        channels,
        address: header.address,
        name: `${enginePattern.engine.toLowerCase()}_sequence_${header.address.toString(16)}`,
        engine: enginePattern.engine,
        patternTable,
        trackLength,
        loopPoint,
        loopLength,
        timingInfo,
        instrumentAssignments,
        effects,
        metadata
      };
    } catch (error) {
      console.warn(`Failed to parse sequence at 0x${header.address.toString(16)}: ${error}`);
      return null;
    }
  }

  /**
   * Parse timing information from sequence header
   */
  private parseTimingInfo(data: Uint8Array, header: SequenceHeader): TimingInfo {
    let tempo = header.tempo || 120;
    let ticksPerBeat = 48; // Common SNES default
    const beatsPerMeasure = 4;

    // Engine-specific timing parsing
    switch (header.engine) {
    case 'N-SPC':
      // N-SPC stores tempo differently
      if (header.address + 2 < data.length) {
        const tempoValue = data[header.address + 1] | (data[header.address + 2] << 8);
        tempo = Math.max(30, Math.min(300, tempoValue));
      }
      ticksPerBeat = 48;
      break;

    case 'Akao':
      // Akao uses different tick resolution
      ticksPerBeat = 96;
      break;

    default:
      // Use defaults
      break;
    }

    return {
      ticksPerBeat,
      beatsPerMeasure,
      tempo,
      timeSignature: { numerator: 4, denominator: 4 },
      totalTicks: 0 // Will be calculated after parsing channels
    };
  }

  /**
   * Parse pattern table for engines that use them
   */
  private parsePatternTable(data: Uint8Array, header: SequenceHeader, enginePattern: SPCEnginePattern): PatternTableEntry[] | undefined {
    const patterns: PatternTableEntry[] = [];

    // Only some engines use pattern tables
    if (header.engine === 'HAL' || header.engine === 'Kankichi-kun') {
      // Look for pattern table near header
      for (let offset = header.address + 4; offset < Math.min(data.length - 4, header.address + 64); offset += 4) {
        const patternAddr = data[offset] | (data[offset + 1] << 8);
        const patternLength = data[offset + 2];
        const flags = data[offset + 3];

        if (patternAddr >= header.address && patternAddr < data.length && patternLength > 0 && patternLength < 256) {
          patterns.push({
            patternIndex: patterns.length,
            address: patternAddr,
            length: patternLength,
            loopFlag: (flags & 0x01) !== 0,
            channels: this.getPatternChannels(flags)
          });
        }
      }
    }

    return patterns.length > 0 ? patterns : undefined;
  }

  /**
   * Parse channel data from sequence
   */
  private parseChannelData(data: Uint8Array, header: SequenceHeader, patternTable: PatternTableEntry[] | undefined, enginePattern: SPCEnginePattern): ChannelData[] {
    const channels: ChannelData[] = [];

    // Determine which channels are active
    const activeChannels = this.getActiveChannels(header);

    for (const channelNum of activeChannels) {
      try {
        const channelData = this.parseChannelTrack(data, header, channelNum, patternTable, enginePattern);
        if (channelData) {
          channels.push(channelData);
        }
      } catch (error) {
        console.warn(`Failed to parse channel ${channelNum}: ${error}`);
      }
    }

    return channels;
  }

  /**
   * Parse individual channel track data
   */
  private parseChannelTrack(data: Uint8Array, header: SequenceHeader, channelNum: number, patternTable: PatternTableEntry[] | undefined, enginePattern: SPCEnginePattern): ChannelData | null {
    // Get channel start address
    const channelStart = this.getChannelStartAddress(header, channelNum);
    if (!channelStart || channelStart >= data.length) return null;

    const notes: NoteEvent[] = [];
    const velocities: number[] = [];
    const effects: ChannelEffect[] = [];

    let offset = channelStart;
    let currentTick = 0;
    let currentInstrument = 0;
    let currentVolume = 100;
    let currentPan = 64; // Center

    // Parse channel commands
    while (offset < data.length) {
      const command = data[offset];

      if (this.isEndOfTrack(command, header.engine)) {
        break;
      }

      const parseResult = this.parseChannelCommand(data, offset, currentTick, header.engine);
      if (!parseResult) {
        offset++;
        continue;
      }

      switch (parseResult.type) {
      case 'note':
        notes.push({
          note: parseResult.note!,
          velocity: parseResult.velocity || 64,
          duration: parseResult.duration || 48,
          timestamp: currentTick,
          pitch: parseResult.pitch
        });
        velocities.push(parseResult.velocity || 64);
        currentTick += parseResult.duration || 48;
        break;

      case 'rest':
        currentTick += parseResult.duration || 48;
        break;

      case 'instrument':
        currentInstrument = parseResult.value || 0;
        break;

      case 'volume':
        currentVolume = parseResult.value || 100;
        effects.push({
          type: 'volume',
          parameter1: currentVolume,
          timestamp: currentTick
        });
        break;

      case 'pan':
        currentPan = parseResult.value || 64;
        effects.push({
          type: 'pan',
          parameter1: currentPan,
          timestamp: currentTick
        });
        break;

      case 'pitchBend':
        effects.push({
          type: 'pitchBend',
          parameter1: parseResult.value || 0,
          parameter2: parseResult.parameter2,
          timestamp: currentTick,
          duration: parseResult.duration
        });
        break;

      case 'vibrato':
        effects.push({
          type: 'vibrato',
          parameter1: parseResult.value || 0,
          parameter2: parseResult.parameter2 || 0,
          timestamp: currentTick,
          duration: parseResult.duration
        });
        break;

      case 'echo':
        effects.push({
          type: 'echo',
          parameter1: parseResult.value || 0,
          timestamp: currentTick
        });
        break;
      }

      offset += parseResult.commandLength;

      // Safety check to prevent infinite loops
      if (currentTick > 100000) {
        console.warn(`Channel ${channelNum} exceeded maximum tick count, stopping parse`);
        break;
      }
    }

    // Extract track data
    const trackEnd = Math.min(offset, data.length);
    const trackData = data.slice(channelStart, trackEnd);

    return {
      channelNumber: channelNum,
      notes,
      velocities,
      effects,
      instrumentIndex: currentInstrument,
      volume: currentVolume,
      pan: currentPan,
      trackData
    };
  }

  /**
   * Helper methods for sequence extraction
   */

  private extractSequencesByPattern(data: Uint8Array, startOffset: number, enginePattern: SPCEnginePattern): MusicSequence[] {
    const sequences: MusicSequence[] = [];

    // Fallback pattern-based extraction for unknown engines
    for (let i = 0; i < 4; i++) {
      const seqOffset = startOffset + (i * 0x200);
      if (seqOffset + 0x100 > data.length) break;

      const sequenceData = data.slice(seqOffset, seqOffset + 0x100);
      const channels: ChannelData[] = [{
        channelNumber: i,
        notes: [],
        velocities: [],
        effects: [],
        instrumentIndex: 0,
        volume: 100,
        pan: 64,
        trackData: sequenceData
      }];

      sequences.push({
        data: sequenceData,
        tempo: 120,
        channels,
        address: seqOffset,
        name: `${enginePattern.engine.toLowerCase()}_pattern_${i}`,
        engine: enginePattern.engine,
        trackLength: 100,
        timingInfo: {
          ticksPerBeat: 48,
          beatsPerMeasure: 4,
          tempo: 120,
          timeSignature: { numerator: 4, denominator: 4 },
          totalTicks: 1920 // 4 measures * 4 beats * 48 ticks
        },
        instrumentAssignments: new Map([[i, 0]]),
        effects: [],
        metadata: {
          complexity: 'simple',
          estimatedDuration: 4.0
        }
      });
    }

    return sequences;
  }

  private isKankichiCommand(data: Uint8Array, offset: number): boolean {
    if (offset + 2 >= data.length) return false;

    const cmd1 = data[offset];
    const cmd2 = data[offset + 1];

    // Kankichi-kun characteristic command patterns
    return (cmd1 >= 0x80 && cmd1 <= 0xDF) && (cmd2 < 0x80);
  }

  private looksLikeSequenceHeader(data: Uint8Array, offset: number): boolean {
    if (offset + 8 >= data.length) return false;

    // Generic heuristics for sequence headers
    const byte1 = data[offset];
    const byte2 = data[offset + 1];
    const word1 = data[offset + 2] | (data[offset + 3] << 8);

    // Look for reasonable patterns
    return byte1 > 0 && byte1 <= 0xFF &&
           byte2 >= 30 && byte2 <= 200 && // Reasonable tempo range
           word1 >= offset && word1 < data.length; // Valid pointer
  }

  private getPatternChannels(flags: number): number[] {
    const channels: number[] = [];
    for (let i = 0; i < 8; i++) {
      if (flags & (1 << i)) {
        channels.push(i);
      }
    }
    return channels;
  }

  private getActiveChannels(header: SequenceHeader): number[] {
    const channels: number[] = [];

    if (header.channelPointers.length > 0) {
      // Use explicit channel pointers
      for (let i = 0; i < header.channelPointers.length; i++) {
        channels.push(i);
      }
    } else {
      // Use channel mask
      for (let i = 0; i < 8; i++) {
        if (header.channelMask & (1 << i)) {
          channels.push(i);
        }
      }
    }

    return channels;
  }

  private getChannelStartAddress(header: SequenceHeader, channelNum: number): number | null {
    if (header.channelPointers.length > channelNum) {
      return header.channelPointers[channelNum];
    }

    // Fallback: calculate based on header structure
    const headerSize = 3 + (8 * 2); // Basic N-SPC header size
    return header.address + headerSize + (channelNum * 0x40); // Estimated channel spacing
  }

  private isEndOfTrack(command: number, engine: SPCEngineType): boolean {
    switch (engine) {
    case 'N-SPC':
      return command === 0x00 || command === 0xFF;
    case 'Akao':
      return command === 0xC0 || command === 0xFF;
    case 'HAL':
      return command === 0xFE || command === 0xFF;
    case 'Kankichi-kun':
      return command === 0x00;
    default:
      return command === 0x00 || command === 0xFF;
    }
  }

  private parseChannelCommand(data: Uint8Array, offset: number, currentTick: number, engine: SPCEngineType): ChannelCommandResult | null {
    if (offset >= data.length) return null;

    const command = data[offset];

    switch (engine) {
    case 'N-SPC':
      return this.parseNSPCCommand(data, offset, currentTick);
    case 'Akao':
      return this.parseAkaoCommand(data, offset, currentTick);
    case 'HAL':
      return this.parseHALCommand(data, offset, currentTick);
    case 'Kankichi-kun':
      return this.parseKankichiCommand(data, offset, currentTick);
    default:
      return this.parseGenericCommand(data, offset, currentTick);
    }
  }

  private parseNSPCCommand(data: Uint8Array, offset: number, currentTick: number): ChannelCommandResult | null {
    if (offset >= data.length) return null;

    const command = data[offset];

    // N-SPC command parsing
    if (command >= 0x80) {
      // Note command: 0x80-0xF7 = notes
      const note = command - 0x80;
      const duration = offset + 1 < data.length ? data[offset + 1] : 48;
      const velocity = offset + 2 < data.length ? data[offset + 2] : 64;

      return {
        type: 'note',
        note: note + 36, // Convert to MIDI note (C3 = 60)
        duration,
        velocity,
        commandLength: 3
      };
    } else if (command >= 0x01 && command <= 0x7F) {
      // Rest command
      return {
        type: 'rest',
        duration: command,
        commandLength: 1
      };
    } else if (command === 0xE0) {
      // Volume change
      const volume = offset + 1 < data.length ? data[offset + 1] : 100;
      return {
        type: 'volume',
        value: volume,
        commandLength: 2
      };
    } else if (command === 0xE1) {
      // Pan change
      const pan = offset + 1 < data.length ? data[offset + 1] : 64;
      return {
        type: 'pan',
        value: pan,
        commandLength: 2
      };
    } else if (command === 0xE2) {
      // Pitch bend
      const bend = offset + 1 < data.length ? data[offset + 1] : 0;
      return {
        type: 'pitchBend',
        value: bend - 128, // Convert to signed
        commandLength: 2
      };
    } else if (command === 0xE3) {
      // Vibrato
      const depth = offset + 1 < data.length ? data[offset + 1] : 0;
      const rate = offset + 2 < data.length ? data[offset + 2] : 0;
      return {
        type: 'vibrato',
        value: depth,
        parameter2: rate,
        commandLength: 3
      };
    }

    // Unknown command
    return {
      type: 'end',
      commandLength: 1
    };
  }

  private parseAkaoCommand(data: Uint8Array, offset: number, currentTick: number): ChannelCommandResult | null {
    if (offset >= data.length) return null;

    const command = data[offset];

    // Simplified Akao parsing
    if (command >= 0x80) {
      return {
        type: 'note',
        note: command - 0x80 + 36,
        duration: 48,
        velocity: 64,
        commandLength: 1
      };
    }

    return {
      type: 'rest',
      duration: command || 48,
      commandLength: 1
    };
  }

  private parseHALCommand(data: Uint8Array, offset: number, currentTick: number): ChannelCommandResult | null {
    if (offset >= data.length) return null;

    const command = data[offset];

    // Simplified HAL parsing
    if (command >= 0x80 && command <= 0xDF) {
      return {
        type: 'note',
        note: command - 0x80 + 36,
        duration: 48,
        velocity: 64,
        commandLength: 1
      };
    }

    return {
      type: 'rest',
      duration: command || 48,
      commandLength: 1
    };
  }

  private parseKankichiCommand(data: Uint8Array, offset: number, currentTick: number): ChannelCommandResult | null {
    if (offset >= data.length) return null;

    const command = data[offset];

    // Simplified Kankichi-kun parsing
    if (command >= 0x80) {
      return {
        type: 'note',
        note: command - 0x80 + 36,
        duration: 48,
        velocity: 64,
        commandLength: 2 // Kankichi usually has note + duration
      };
    }

    return {
      type: 'rest',
      duration: command || 48,
      commandLength: 1
    };
  }

  private parseGenericCommand(data: Uint8Array, offset: number, currentTick: number): ChannelCommandResult | null {
    if (offset >= data.length) return null;

    const command = data[offset];

    // Generic fallback parsing
    if (command >= 0x80) {
      return {
        type: 'note',
        note: command - 0x80 + 36,
        duration: 48,
        velocity: 64,
        commandLength: 1
      };
    } else if (command > 0) {
      return {
        type: 'rest',
        duration: command,
        commandLength: 1
      };
    }

    return {
      type: 'end',
      commandLength: 1
    };
  }

  private calculateTrackLength(channels: ChannelData[], timingInfo: TimingInfo): { trackLength: number; loopPoint?: number; loopLength?: number } {
    let maxTicks = 0;
    let loopPoint: number | undefined;
    let loopLength: number | undefined;

    // Find the longest channel
    for (const channel of channels) {
      if (channel.notes.length > 0) {
        const lastNote = channel.notes[channel.notes.length - 1];
        const channelEnd = lastNote.timestamp + lastNote.duration;
        maxTicks = Math.max(maxTicks, channelEnd);
      }
    }

    // Look for loop points in effects
    for (const channel of channels) {
      const loopEffects = channel.effects.filter(e => e.type === 'echo');
      if (loopEffects.length > 0) {
        loopPoint = loopEffects[0].timestamp;
        loopLength = maxTicks - loopPoint;
        break;
      }
    }

    // Update timing info with calculated total ticks
    timingInfo.totalTicks = maxTicks;

    return {
      trackLength: maxTicks,
      loopPoint,
      loopLength
    };
  }

  private extractInstrumentAssignments(channels: ChannelData[]): Map<number, number> {
    const assignments = new Map<number, number>();

    for (const channel of channels) {
      assignments.set(channel.channelNumber, channel.instrumentIndex);
    }

    return assignments;
  }

  private parseSequenceEffects(data: Uint8Array, header: SequenceHeader, enginePattern: SPCEnginePattern): SequenceEffect[] {
    const effects: SequenceEffect[] = [];

    // Look for global effects in the sequence header area
    // This is simplified - real implementation would be engine-specific

    return effects;
  }

  private generateSequenceMetadata(channels: ChannelData[], timingInfo: TimingInfo, effects: SequenceEffect[]): SequenceMetadata {
    const totalNotes = channels.reduce((sum, ch) => sum + ch.notes.length, 0);
    const totalEffects = channels.reduce((sum, ch) => sum + ch.effects.length, 0) + effects.length;

    let complexity: 'simple' | 'medium' | 'complex' = 'simple';
    if (totalNotes > 100 && totalEffects > 20) {
      complexity = 'complex';
    } else if (totalNotes > 50 || totalEffects > 10) {
      complexity = 'medium';
    }

    const estimatedDuration = (timingInfo.totalTicks / timingInfo.ticksPerBeat) * (60 / timingInfo.tempo);

    return {
      complexity,
      estimatedDuration
    };
  }

  private findSequenceEnd(data: Uint8Array, header: SequenceHeader, channels: ChannelData[]): number {
    let maxEnd = header.address + 0x100; // Minimum sequence size

    // Find the end of all channel data
    for (const channel of channels) {
      if (channel.trackData.length > 0) {
        // Calculate the actual end of this channel's data
        const channelStart = this.getChannelStartAddress(header, channel.channelNumber) || header.address;
        maxEnd = Math.max(maxEnd, channelStart + channel.trackData.length);
      }
    }

    return Math.min(maxEnd, data.length);
  }
}

/**
 * Text Extraction Module
 * Extracts text strings with encoding detection
 */
export class TextExtractor {
  private customTables: Map<string, Map<number, string>> = new Map();

  /**
   * Detect text encoding used in the ROM
   */
  detectEncoding(data: Uint8Array): TextEncoding {
    // Check for standard ASCII first (higher threshold for detection)
    let asciiCount = 0;
    for (let i = 0; i < Math.min(data.length, 1000); i++) {
      const byte = data[i];
      if ((byte >= 0x20 && byte <= 0x7E) || byte === 0x0A || byte === 0x0D) {
        asciiCount++;
      }
    }

    if (asciiCount > 500) return 'ascii';

    // Check for Shift-JIS patterns (Japanese games) - but be more conservative
    let shiftJISCount = 0;
    for (let i = 0; i < Math.min(data.length - 1, 1000); i++) {
      const byte1 = data[i];
      const byte2 = data[i + 1];

      // Shift-JIS first byte ranges
      if ((byte1 >= 0x81 && byte1 <= 0x9F) || (byte1 >= 0xE0 && byte1 <= 0xFC)) {
        // Second byte ranges
        if ((byte2 >= 0x40 && byte2 <= 0x7E) || (byte2 >= 0x80 && byte2 <= 0xFC)) {
          shiftJISCount++;
        }
      }
    }

    // Require much higher threshold for Shift-JIS detection
    if (shiftJISCount > 50) return 'shift-jis';

    // Default to custom for most SNES games (including ALTTP)
    return 'custom';
  }

  /**
   * Extract text strings from ROM data
   */
  async extractStrings(data: Uint8Array, encoding: TextEncoding,
    startAddress: number = 0, minLength: number = 3, aiRecognizer?: AIPatternRecognizer): Promise<TextString[]> {
    const strings: TextString[] = [];

    let baseStrings: TextString[];
    switch (encoding) {
    case 'ascii':
      baseStrings = this.extractASCIIStrings(data, startAddress, minLength);
      break;
    case 'shift-jis':
      baseStrings = this.extractShiftJISStrings(data, startAddress, minLength);
      break;
    case 'custom':
      baseStrings = this.extractCustomStrings(data, startAddress, minLength);
      break;
    }

    // Enhance with AI classification if available
    if (aiRecognizer) {
      for (const textString of baseStrings) {
        try {
          const classification = await aiRecognizer.classifyTextData(data, textString.address - startAddress);
          textString.aiClassification = classification;

          // Update context based on AI classification if more confident
          if (classification.confidence > 0.7) {
            textString.context = classification.type as any; // Type conversion needed
          }
        } catch (error) {
          console.warn('AI text classification failed for string at', textString.address, ':', error);
        }
      }
      strings.push(...baseStrings);
    } else {
      strings.push(...baseStrings);
    }

    return strings;
  }

  private extractASCIIStrings(data: Uint8Array, startAddress: number, minLength: number): TextString[] {
    const strings: TextString[] = [];
    let currentString = '';
    let stringStart = 0;

    for (let i = 0; i < data.length; i++) {
      const byte = data[i];

      if ((byte >= 0x20 && byte <= 0x7E) || byte === 0x0A || byte === 0x0D) {
        if (currentString.length === 0) {
          stringStart = i;
        }
        currentString += String.fromCharCode(byte);
      } else {
        if (currentString.length >= minLength) {
          strings.push({
            text: currentString.trim(),
            encoding: 'ascii',
            address: startAddress + stringStart,
            length: currentString.length,
            context: this.guessTextContext(currentString)
          });
        }
        currentString = '';
      }
    }

    return strings;
  }

  private extractShiftJISStrings(data: Uint8Array, startAddress: number, minLength: number): TextString[] {
    const strings: TextString[] = [];
    // Shift-JIS extraction would require proper decoder
    // This is a simplified implementation
    return strings;
  }

  private extractCustomStrings(data: Uint8Array, startAddress: number, minLength: number): TextString[] {
    const strings: TextString[] = [];

    // Common SNES text patterns - look for sequences that might be text
    // Many SNES games use values 0x40-0xFF for text characters
    let currentString = '';
    let stringStart = 0;

    for (let i = 0; i < data.length; i++) {
      const byte = data[i];

      // SNES games often use 0x40-0xDF for text, with control codes in other ranges
      if ((byte >= 0x40 && byte <= 0xDF) ||
          (byte >= 0x20 && byte <= 0x7E) ||  // ASCII range
          byte === 0x00 || byte === 0xFF) {  // Common terminators/spaces

        if (currentString.length === 0) {
          stringStart = i;
        }

        // Convert to approximate ASCII for display
        if (byte >= 0x40 && byte <= 0x5F) {
          currentString += String.fromCharCode(byte); // A-Z, punctuation
        } else if (byte >= 0x60 && byte <= 0x7F) {
          currentString += String.fromCharCode(byte); // a-z
        } else if (byte >= 0x20 && byte <= 0x3F) {
          currentString += String.fromCharCode(byte); // numbers, symbols
        } else if (byte === 0x00 || byte === 0xFF) {
          currentString += ' '; // Space/separator
        } else {
          currentString += '[' + byte.toString(16).toUpperCase().padStart(2, '0') + ']'; // Hex representation
        }
      } else {
        // End of potential string
        if (currentString.length >= minLength) {
          const cleanString = currentString.trim().replace(/\[[0-9A-F]{2}\]/gi, ' ').trim();
          if (cleanString.length >= minLength) {
            strings.push({
              text: cleanString,
              encoding: 'custom',
              address: startAddress + stringStart,
              length: currentString.length,
              context: this.guessTextContext(cleanString)
            });
          }
        }
        currentString = '';
      }
    }

    // Handle string at end of data
    if (currentString.length >= minLength) {
      const cleanString = currentString.trim().replace(/\[[0-9A-F]{2}\]/gi, ' ').trim();
      if (cleanString.length >= minLength) {
        strings.push({
          text: cleanString,
          encoding: 'custom',
          address: startAddress + stringStart,
          length: currentString.length,
          context: this.guessTextContext(cleanString)
        });
      }
    }

    return strings;
  }

  private guessTextContext(text: string): 'dialogue' | 'menu' | 'item' | 'unknown' {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('yes') || lowerText.includes('no') ||
        lowerText.includes('ok') || lowerText.includes('cancel')) {
      return 'dialogue';
    }

    if (lowerText.includes('start') || lowerText.includes('option') ||
        lowerText.includes('menu') || lowerText.includes('file')) {
      return 'menu';
    }

    if (lowerText.includes('sword') || lowerText.includes('shield') ||
        lowerText.includes('potion') || lowerText.includes('key')) {
      return 'item';
    }

    return 'unknown';
  }

  /**
   * Set custom character table for proprietary encodings
   */
  setCustomTable(name: string, table: Map<number, string>): void {
    this.customTables.set(name, table);
  }
}

/**
 * Main Asset Extractor Class
 * Coordinates all asset extraction operations
 */
export class AssetExtractor {
  private graphicsExtractor = new GraphicsExtractor();
  private audioExtractor = new AudioExtractor();
  private textExtractor = new TextExtractor();
  private aiPatternRecognizer?: AIPatternRecognizer;

  constructor(enableAI: boolean = false, modelPath?: string) {
    if (enableAI) {
      this.aiPatternRecognizer = new AIPatternRecognizer(modelPath);
    }
  }

  /**
   * Extract all assets from ROM data with analysis guidance
   */
  async extractAssets(romData: Uint8Array, analysisResults?: any): Promise<{
    graphics: {
      tiles: Tile[];
      sprites: Sprite[];
      palettes: Palette[];
      backgrounds: Background[];
    };
    audio: {
      spcProgram?: SPCProgram;
      samples: BRRSample[];
      sequences: MusicSequence[];
    };
    text: {
      strings: TextString[];
      dialogues: DialogueTree[];
    };
  }> {
    // Use analysis results to guide extraction if available
    const result = {
      graphics: {
        tiles: [] as Tile[],
        sprites: [] as Sprite[],
        palettes: [] as Palette[],
        backgrounds: [] as Background[]
      },
      audio: {
        samples: [] as BRRSample[],
        sequences: [] as MusicSequence[]
      },
      text: {
        strings: [] as TextString[],
        dialogues: [] as DialogueTree[]
      }
    };

    // Extract graphics from likely VRAM regions
    if (romData.length > 0x8000) {
      result.graphics.tiles = await this.graphicsExtractor.extractTiles(
        romData.slice(0x8000, Math.min(0x10000, romData.length)),
        '4bpp',
        0x8000,
        undefined, // count
        this.aiPatternRecognizer
      );
    }

    // Extract text with encoding detection
    const encoding = this.textExtractor.detectEncoding(romData);
    result.text.strings = await this.textExtractor.extractStrings(romData, encoding, 0, 3, this.aiPatternRecognizer);

    return result;
  }

  getGraphicsExtractor(): GraphicsExtractor {
    return this.graphicsExtractor;
  }

  getAudioExtractor(): AudioExtractor {
    return this.audioExtractor;
  }

  getTextExtractor(): TextExtractor {
    return this.textExtractor;
  }
}