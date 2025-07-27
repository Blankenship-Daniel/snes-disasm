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
}

export interface MusicSequence {
  data: Uint8Array;
  tempo: number;
  channels: number[];
  address: number;
  name?: string;
}

export interface SPCProgram {
  code: Uint8Array;
  samples: BRRSample[];
  sequences: MusicSequence[];
  address: number;
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
   * Extract SPC700 program data from audio RAM
   * Based on snes-mcp-server SPC700 research
   */
  async extractSPCData(audioRAM: Uint8Array, startAddress: number = 0): Promise<SPCProgram> {
    // SPC700 memory layout analysis
    const program: SPCProgram = {
      code: new Uint8Array(0),
      samples: [],
      sequences: [],
      address: startAddress
    };
    
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
   * Extract BRR (Bit Rate Reduction) compressed audio samples
   */
  async extractBRRSamples(data: Uint8Array, startOffset: number = 0, aiRecognizer?: AIPatternRecognizer): Promise<BRRSample[]> {
    const samples: BRRSample[] = [];
    let offset = startOffset;
    
    while (offset + 9 < data.length) {
      // BRR blocks are 9 bytes: 1 header + 8 data bytes
      const header = data[offset];
      const end = (header & 0x01) !== 0;
      const loop = (header & 0x02) !== 0;
      const shift = (header & 0x0C) >> 2;
      const filter = (header & 0x30) >> 4;
      
      // Find the end of this sample
      let sampleEnd = offset + 9;
      let currentOffset = offset + 9;
      
      while (currentOffset < data.length && !end) {
        const blockHeader = data[currentOffset];
        currentOffset += 9;
        if ((blockHeader & 0x01) !== 0) break; // End flag found
      }
      
      sampleEnd = currentOffset;
      const sampleData = data.slice(offset, sampleEnd);
      
      // Get AI classification if available
      let aiClassification: AudioClassification | undefined;
      if (aiRecognizer) {
        try {
          aiClassification = await aiRecognizer.classifyAudioData(sampleData, offset);
        } catch (error) {
          console.warn('AI audio classification failed, using heuristics:', error);
        }
      }

      samples.push({
        data: sampleData,
        loopStart: loop ? 0 : -1,
        loopEnd: loop ? sampleData.length : -1,
        sampleRate: 32000, // Default SNES sample rate
        address: offset,
        name: `sample_${samples.length.toString().padStart(3, '0')}`,
        aiClassification
      });
      
      offset = sampleEnd;
      
      // Safety check to avoid infinite loops
      if (samples.length > 100) break;
    }
    
    return samples;
  }

  /**
   * Extract music sequence data
   */
  extractSequences(data: Uint8Array, startOffset: number = 0): MusicSequence[] {
    const sequences: MusicSequence[] = [];
    
    // This is game-specific and would need pattern recognition
    // For now, create a basic implementation
    for (let i = 0; i < 8; i++) {
      const seqOffset = startOffset + (i * 0x100);
      if (seqOffset + 0x100 > data.length) break;
      
      sequences.push({
        data: data.slice(seqOffset, seqOffset + 0x100),
        tempo: 120, // Default tempo
        channels: [i],
        address: seqOffset,
        name: `sequence_${i}`
      });
    }
    
    return sequences;
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
          currentString += `\\x${byte.toString(16).padStart(2, '0')}`; // Hex representation
        }
      } else {
        // End of potential string
        if (currentString.length >= minLength) {
          const cleanString = currentString.trim().replace(/\\x[0-9a-f]{2}/gi, ' ').trim();
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
      const cleanString = currentString.trim().replace(/\\x[0-9a-f]{2}/gi, ' ').trim();
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