/**
 * AI-Powered Pattern Recognition for SNES Asset Extraction
 *
 * This module provides GenAI-enhanced pattern recognition capabilities
 * to make asset extraction generic across all SNES games, avoiding
 * game-specific implementations.
 */

export interface PatternConfidence {
  type: string;
  confidence: number; // 0.0 to 1.0
  metadata?: any;
}

export interface GraphicsClassification {
  type: 'sprite' | 'tile' | 'background' | 'ui' | 'font' | 'palette';
  confidence: number;
  dimensions?: { width: number; height: number };
  format?: '2bpp' | '4bpp' | '8bpp';
}

export interface AudioClassification {
  type: 'brr_sample' | 'sequence' | 'spc_code' | 'instrument' | 'sfx' | 'voice' | 'percussion';
  confidence: number;
  sampleRate?: number;
  channels?: number;
  encoding?: 'brr' | 'raw' | 'compressed';
  // Enhanced classification metadata
  category?: 'instrument' | 'sfx' | 'voice' | 'percussion' | 'ambient';
  instrumentType?: 'piano' | 'strings' | 'brass' | 'woodwind' | 'synth' | 'drum' | 'unknown';
  voiceType?: 'male' | 'female' | 'child' | 'narrator' | 'unknown';
  sfxType?: 'impact' | 'environment' | 'ui' | 'magic' | 'mechanical' | 'unknown';
  loopDetected?: boolean;
  boundaryQuality?: number; // 0.0-1.0 confidence in sample boundaries
  musicPattern?: {
    melodyComplexity: number;
    rhythmPattern: string;
    keySignature?: string;
    tempo?: number;
  };
}

export interface TextClassification {
  type: 'dialogue' | 'menu' | 'item_name' | 'credits' | 'code_comment';
  confidence: number;
  encoding: 'ascii' | 'shift-jis' | 'custom' | 'compressed';
  compression?: 'dte' | 'dictionary' | 'rle' | 'lz77' | 'none';
}

export interface CompressionInfo {
  type: 'RLE' | 'LZ77' | 'LZSS' | 'DTE' | 'dictionary' | 'huffman' | 'none';
  confidence: number;
  blockSize?: number;
  dictionarySize?: number;
  decompressHint?: string;
}

// Import real AI model implementations
import {
  ViTGraphicsClassifier,
  DistilBERTSequenceClassifier,
  AICompressionDetector
} from './ai-models-implementation';

/**
 * AI-Enhanced Pattern Recognition Engine
 * Uses multiple machine learning approaches for robust pattern detection
 */
export class AIPatternRecognizer {
  private graphicsClassifier?: ViTGraphicsClassifier;
  private sequenceClassifier?: DistilBERTSequenceClassifier;
  private compressionDetector?: AICompressionDetector;

  constructor(private modelPath?: string) {
    // Initialize AI models - placeholders for future implementation
    this.initializeModels();
  }

  /**
   * Classify graphics data using Vision Transformer approach
   */
  async classifyGraphicsData(data: Uint8Array, format: '2bpp' | '4bpp' | '8bpp'): Promise<GraphicsClassification> {
    if (!this.graphicsClassifier) {
      // Fallback to heuristic classification
      return this.heuristicGraphicsClassification(data, format);
    }

    // Convert SNES tile data to image patches for model processing
    const imagePatches = this.convertTileDataToPatches(data, format);
    return await this.graphicsClassifier.classifyGraphics(imagePatches);
  }

  /**
   * Classify audio data using sequence-based transformers with enhanced BRR sample analysis
   */
  async classifyAudioData(data: Uint8Array, offset: number = 0): Promise<AudioClassification> {
    if (!this.sequenceClassifier) {
      // Fallback to enhanced pattern-based classification
      return this.enhancedHeuristicAudioClassification(data, offset);
    }

    // Process as byte sequence for transformer classification
    const sequence = data.slice(offset, offset + Math.min(2048, data.length - offset));
    const aiResult = await this.sequenceClassifier.classifyAudio(sequence);

    // Enhance AI result with additional pattern analysis
    return this.enhanceAudioClassification(aiResult, data, offset);
  }

  /**
   * Classify text data and detect encoding/compression
   */
  async classifyTextData(data: Uint8Array, offset: number = 0): Promise<TextClassification> {
    if (!this.sequenceClassifier) {
      // Fallback to heuristic classification
      return this.heuristicTextClassification(data, offset);
    }

    const sequence = data.slice(offset, offset + Math.min(1024, data.length - offset));
    return await this.sequenceClassifier.classifyText(sequence);
  }

  /**
   * Detect compression patterns in binary data
   */
  async detectCompression(data: Uint8Array): Promise<CompressionInfo> {
    if (!this.compressionDetector) {
      // Fallback to statistical analysis
      return this.statisticalCompressionDetection(data);
    }

    return await this.compressionDetector.analyze(data);
  }

  /**
   * Comprehensive data classification combining all AI approaches
   */
  async classifyDataRegion(data: Uint8Array, offset: number, length: number): Promise<{
    graphics?: GraphicsClassification;
    audio?: AudioClassification;
    text?: TextClassification;
    compression?: CompressionInfo;
    mostLikely: 'graphics' | 'audio' | 'text' | 'code' | 'unknown';
    confidence: number;
  }> {
    const region = data.slice(offset, offset + length);

    // Run all classifiers in parallel
    const [graphics2bpp, graphics4bpp, graphics8bpp, audio, text, compression] = await Promise.all([
      this.classifyGraphicsData(region, '2bpp'),
      this.classifyGraphicsData(region, '4bpp'),
      this.classifyGraphicsData(region, '8bpp'),
      this.classifyAudioData(region),
      this.classifyTextData(region),
      this.detectCompression(region)
    ]);

    // Find best graphics format
    const graphics = [graphics2bpp, graphics4bpp, graphics8bpp]
      .reduce((best, current) => current.confidence > best.confidence ? current : best);

    // Determine most likely type based on highest confidence
    const candidates = [
      { type: 'graphics' as const, confidence: graphics.confidence },
      { type: 'audio' as const, confidence: audio.confidence },
      { type: 'text' as const, confidence: text.confidence }
    ];

    const mostLikely = candidates.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    return {
      graphics: graphics.confidence > 0.3 ? graphics : undefined,
      audio: audio.confidence > 0.3 ? audio : undefined,
      text: text.confidence > 0.3 ? text : undefined,
      compression: compression.confidence > 0.3 ? compression : undefined,
      mostLikely: mostLikely.confidence > 0.2 ? mostLikely.type : 'unknown',
      confidence: mostLikely.confidence
    };
  }

  private async initializeModels(): Promise<void> {
    try {
      // Load real pre-trained models from HuggingFace
      console.log('🧠 Initializing real AI models...');

      this.graphicsClassifier = new ViTGraphicsClassifier(this.modelPath);
      this.sequenceClassifier = new DistilBERTSequenceClassifier(this.modelPath);
      this.compressionDetector = new AICompressionDetector();

      // Models are initialized lazily when first used
      console.log('✅ AI model framework initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize AI models, using heuristic classification:', error);
      // Keep models undefined to trigger fallback behavior
    }
  }

  private convertTileDataToPatches(data: Uint8Array, format: '2bpp' | '4bpp' | '8bpp'): { data: Uint8ClampedArray; width: number; height: number } {
    // Convert SNES planar graphics to RGB for ViT processing
    const bpp = format === '2bpp' ? 2 : format === '4bpp' ? 4 : 8;
    const bytesPerTile = bpp * 8; // 8x8 tile
    const numTiles = Math.floor(data.length / bytesPerTile);

    // Create RGB image from tiles for Vision Transformer
    const imageWidth = Math.ceil(Math.sqrt(numTiles)) * 8;
    const imageHeight = Math.ceil(numTiles / (imageWidth / 8)) * 8;
    const imageData = new Uint8ClampedArray(imageWidth * imageHeight * 4); // RGBA

    // Convert each tile to RGB (simplified conversion)
    for (let tileIndex = 0; tileIndex < numTiles; tileIndex++) {
      const tileOffset = tileIndex * bytesPerTile;
      const tileX = (tileIndex % (imageWidth / 8)) * 8;
      const tileY = Math.floor(tileIndex / (imageWidth / 8)) * 8;

      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          // Simplified pixel extraction (would need proper planar conversion)
          const pixelValue = data[tileOffset + y * 2 + Math.floor(x / 4)] || 0;
          const intensity = (pixelValue & (0x3 << ((x % 4) * 2))) * 64; // Scale to 0-255

          const pixelIndex = ((tileY + y) * imageWidth + (tileX + x)) * 4;
          imageData[pixelIndex] = intensity;     // R
          imageData[pixelIndex + 1] = intensity; // G
          imageData[pixelIndex + 2] = intensity; // B
          imageData[pixelIndex + 3] = 255;       // A
        }
      }
    }

    return { data: imageData, width: imageWidth, height: imageHeight };
  }

  private heuristicGraphicsClassification(data: Uint8Array, format: '2bpp' | '4bpp' | '8bpp'): GraphicsClassification {
    // Enhanced heuristic classification
    const entropy = this.calculateEntropy(data);
    const repetition = this.calculateRepetitionScore(data);
    const patterns = this.detectCommonPatterns(data);

    let type: GraphicsClassification['type'] = 'tile';
    let confidence = 0.5;

    // Sprite detection: lower entropy, more structured patterns
    if (entropy < 3.0 && patterns.sprites > 0.6) {
      type = 'sprite';
      confidence = 0.7;
    }
    // UI elements: highly repetitive patterns
    else if (repetition > 0.8 && entropy < 2.5) {
      type = 'ui';
      confidence = 0.75;
    }
    // Font detection: regular spacing, limited character set
    else if (patterns.characters > 0.7 && repetition > 0.6) {
      type = 'font';
      confidence = 0.8;
    }
    // Background: larger patterns, moderate entropy
    else if (entropy > 3.5 && patterns.textures > 0.5) {
      type = 'background';
      confidence = 0.6;
    }

    return {
      type,
      confidence,
      format,
      dimensions: { width: 8, height: 8 } // Default tile size
    };
  }

  /**
   * Enhanced heuristic audio classification with detailed sample type detection
   */
  private enhancedHeuristicAudioClassification(data: Uint8Array, offset: number): AudioClassification {
    const sample = data.slice(offset, Math.min(data.length, offset + 1024));

    // Enhanced BRR sample detection with boundary analysis
    const brrDetected = this.detectBRRPattern(sample, offset);
    if (brrDetected) {
      const sampleClassification = this.detectSampleType(sample);
      const boundaryQuality = this.heuristicAudioBoundaries(data, offset);

      return {
        type: 'brr_sample',
        confidence: 0.8,
        encoding: 'brr',
        sampleRate: 32000,
        category: sampleClassification.category,
        instrumentType: sampleClassification.instrumentType,
        voiceType: sampleClassification.voiceType,
        sfxType: sampleClassification.sfxType,
        loopDetected: false,
        boundaryQuality
      };
    }

    // Enhanced sequence detection with music pattern analysis
    const sequenceDetected = this.detectSequencePattern(sample, offset);
    if (sequenceDetected) {
      return {
        type: 'sequence',
        confidence: 0.7,
        channels: 8,
        encoding: 'raw',
        musicPattern: this.detectMusicPattern(sample)
      };
    }

    // SPC code detection (common opcodes and patterns)
    if (this.detectSPCCodePattern(sample, 0)) {
      return {
        type: 'spc_code',
        confidence: 0.75,
        encoding: 'raw'
      };
    }

    // Default fallback with low confidence
    return {
      type: 'brr_sample',
      confidence: 0.2,
      encoding: 'raw',
      boundaryQuality: 0.1
    };
  }

  /**
   * Enhance AI classification results with additional pattern analysis
   */
  private enhanceAudioClassification(aiResult: AudioClassification, data: Uint8Array, offset: number): AudioClassification {
    const sample = data.slice(offset, Math.min(data.length, offset + 1024));

    // Add boundary quality analysis
    const boundaryQuality = this.heuristicAudioBoundaries(data, offset);

    // Add music pattern analysis if it's a sequence
    let musicPattern;
    if (aiResult.type === 'sequence') {
      musicPattern = this.detectMusicPattern(sample);
    }

    // Add detailed sample classification if it's a BRR sample
    let sampleClassification;
    if (aiResult.type === 'brr_sample' || aiResult.type === 'instrument') {
      sampleClassification = this.detectSampleType(sample);
    }

    return {
      ...aiResult,
      boundaryQuality,
      musicPattern,
      category: sampleClassification?.category || aiResult.category,
      instrumentType: sampleClassification?.instrumentType || aiResult.instrumentType,
      voiceType: sampleClassification?.voiceType || aiResult.voiceType,
      sfxType: sampleClassification?.sfxType || aiResult.sfxType
    };
  }

  private heuristicTextClassification(data: Uint8Array, offset: number): TextClassification {
    const sample = data.slice(offset, offset + Math.min(256, data.length - offset));

    // ASCII detection
    let asciiScore = 0;
    for (const byte of sample) {
      if ((byte >= 0x20 && byte <= 0x7E) || byte === 0x0A || byte === 0x0D) {
        asciiScore++;
      }
    }

    if (asciiScore / sample.length > 0.8) {
      return {
        type: 'credits',
        confidence: 0.9,
        encoding: 'ascii',
        compression: 'none'
      };
    }

    // Dictionary compression detection (ALTTP-style)
    if (this.detectDictionaryCompression(sample)) {
      return {
        type: 'dialogue',
        confidence: 0.85,
        encoding: 'custom',
        compression: 'dictionary'
      };
    }

    // DTE compression detection
    if (this.detectDTECompression(sample)) {
      return {
        type: 'dialogue',
        confidence: 0.8,
        encoding: 'custom',
        compression: 'dte'
      };
    }

    return {
      type: 'menu',
      confidence: 0.4,
      encoding: 'custom',
      compression: 'none'
    };
  }

  private statisticalCompressionDetection(data: Uint8Array): CompressionInfo {
    const entropy = this.calculateEntropy(data);
    const repetition = this.calculateRepetitionScore(data);

    // High compression typically has higher entropy
    if (entropy > 7.5) {
      return {
        type: 'huffman',
        confidence: 0.7
      };
    }

    // RLE compression has low entropy, high repetition
    if (entropy < 4.0 && repetition > 0.7) {
      return {
        type: 'RLE',
        confidence: 0.8
      };
    }

    // LZ77 has moderate entropy, structured patterns
    if (entropy > 5.0 && entropy < 7.0) {
      return {
        type: 'LZ77',
        confidence: 0.6
      };
    }

    return {
      type: 'none',
      confidence: 0.5
    };
  }

  private calculateEntropy(data: Uint8Array): number {
    const freq = new Array(256).fill(0);
    for (const byte of data) {
      freq[byte]++;
    }

    let entropy = 0;
    for (const count of freq) {
      if (count > 0) {
        const prob = count / data.length;
        entropy -= prob * Math.log2(prob);
      }
    }

    return entropy;
  }

  private calculateRepetitionScore(data: Uint8Array): number {
    let repetitions = 0;
    const total = data.length - 1;

    for (let i = 0; i < total; i++) {
      if (data[i] === data[i + 1]) {
        repetitions++;
      }
    }

    return repetitions / total;
  }

  private detectCommonPatterns(data: Uint8Array): {
    sprites: number;
    characters: number;
    textures: number;
  } {
    // Simplified pattern detection - would be enhanced with AI
    const sprites = this.detectSpritePatterns(data);
    const characters = this.detectCharacterPatterns(data);
    const textures = this.detectTexturePatterns(data);

    return { sprites, characters, textures };
  }

  private detectSpritePatterns(data: Uint8Array): number {
    // Look for common sprite characteristics
    let score = 0;
    const sampleSize = Math.min(64, data.length);

    // Empty areas (common in sprites)
    let emptyBytes = 0;
    for (let i = 0; i < sampleSize; i++) {
      if (data[i] === 0) emptyBytes++;
    }
    score += (emptyBytes / sampleSize) * 0.5;

    // Edge detection patterns
    for (let i = 0; i < sampleSize - 8; i += 8) {
      const row1 = data.slice(i, i + 8);
      const row2 = data.slice(i + 8, i + 16);
      if (this.hasEdgePattern(row1, row2)) {
        score += 0.1;
      }
    }

    return Math.min(score, 1.0);
  }

  private detectCharacterPatterns(data: Uint8Array): number {
    // Look for font-like patterns
    const blockSize = 8;
    let characterLike = 0;
    let totalBlocks = 0;

    for (let i = 0; i < data.length - blockSize; i += blockSize) {
      const block = data.slice(i, i + blockSize);
      if (this.hasCharacterLikePattern(block)) {
        characterLike++;
      }
      totalBlocks++;
    }

    return totalBlocks > 0 ? characterLike / totalBlocks : 0;
  }

  private detectTexturePatterns(data: Uint8Array): number {
    // Look for texture-like repeating patterns
    const entropy = this.calculateEntropy(data);
    const variation = this.calculateVariation(data);

    // Textures typically have moderate entropy and variation
    if (entropy > 4.0 && entropy < 6.0 && variation > 0.3) {
      return 0.7;
    }

    return 0.3;
  }

  private calculateVariation(data: Uint8Array): number {
    if (data.length < 2) return 0;

    let sum = 0;
    let sumSquares = 0;

    for (const byte of data) {
      sum += byte;
      sumSquares += byte * byte;
    }

    const mean = sum / data.length;
    const variance = (sumSquares / data.length) - (mean * mean);

    return Math.sqrt(variance) / 255; // Normalize to 0-1
  }

  private hasEdgePattern(row1: Uint8Array, row2: Uint8Array): boolean {
    // Simple edge detection between rows
    let differences = 0;
    for (let i = 0; i < Math.min(row1.length, row2.length); i++) {
      if (Math.abs(row1[i] - row2[i]) > 64) {
        differences++;
      }
    }
    return differences >= 2; // Significant edge if 2+ pixel differences
  }

  private hasCharacterLikePattern(block: Uint8Array): boolean {
    // Check for character-like properties
    const nonZero = block.filter(b => b !== 0).length;
    const entropy = this.calculateEntropy(block);

    // Characters typically have some structure but not too much complexity
    return nonZero >= 3 && nonZero <= 6 && entropy > 1.0 && entropy < 4.0;
  }

  private detectBRRPattern(data: Uint8Array, offset: number): boolean {
    if (offset + 9 >= data.length) return false;

    const header = data[offset];
    const shift = (header & 0x0C) >> 2;
    const filter = (header & 0x30) >> 4;

    // Valid BRR header ranges
    return shift <= 12 && filter <= 3;
  }

  private detectSPCCodePattern(data: Uint8Array, offset: number): boolean {
    if (offset + 16 >= data.length) return false;

    // Look for common SPC700 opcodes
    const commonOpcodes = [0x8F, 0xCD, 0x3F, 0x2F, 0x6F, 0x7F]; // MOV, MOV, CALL, BRA, etc.
    let opcodeMatches = 0;

    for (let i = 0; i < 16; i++) {
      if (commonOpcodes.includes(data[offset + i])) {
        opcodeMatches++;
      }
    }

    return opcodeMatches >= 3; // At least 3 common opcodes in 16 bytes
  }

  private detectSequencePattern(data: Uint8Array, offset: number): boolean {
    // Look for music sequence patterns (simplified)
    const sample = data.slice(offset, offset + Math.min(32, data.length - offset));
    const entropy = this.calculateEntropy(sample);

    // Music sequences typically have moderate entropy
    return entropy > 3.0 && entropy < 6.0;
  }

  private detectDictionaryCompression(data: Uint8Array): boolean {
    // Look for dictionary compression indicators
    let shortValues = 0;
    let totalBytes = 0;

    for (const byte of data) {
      if (byte < 128) { // Dictionary indices typically smaller
        shortValues++;
      }
      totalBytes++;
    }

    return totalBytes > 0 && (shortValues / totalBytes) > 0.7;
  }

  private detectDTECompression(data: Uint8Array): boolean {
    // DTE uses specific byte ranges for compressed pairs
    let dteIndicators = 0;

    for (const byte of data) {
      // Common DTE ranges
      if ((byte >= 0x80 && byte <= 0xFF) || byte === 0x01 || byte === 0x02) {
        dteIndicators++;
      }
    }

    return dteIndicators > data.length * 0.3; // 30% of bytes are DTE indicators
  }

  /**
   * Detect sample type characteristics for audio classification
   */
  private detectSampleType(data: Uint8Array): {
    category: 'instrument' | 'sfx' | 'voice' | 'percussion' | 'ambient';
    instrumentType?: 'piano' | 'strings' | 'brass' | 'woodwind' | 'synth' | 'drum' | 'unknown';
    voiceType?: 'male' | 'female' | 'child' | 'narrator' | 'unknown';
    sfxType?: 'impact' | 'environment' | 'ui' | 'magic' | 'mechanical' | 'unknown';
  } {
    const entropy = this.calculateEntropy(data);
    const variation = this.calculateVariation(data);

    // Simple heuristic classification based on entropy and variation
    if (entropy < 2.0 && variation < 0.1) {
      return { category: 'percussion', instrumentType: 'drum' };
    } else if (entropy > 6.0) {
      return { category: 'voice', voiceType: 'unknown' };
    } else if (variation > 0.5) {
      return { category: 'instrument', instrumentType: 'unknown' };
    } else {
      return { category: 'sfx', sfxType: 'unknown' };
    }
  }

  /**
   * Analyze audio boundaries for quality assessment
   */
  private heuristicAudioBoundaries(data: Uint8Array, offset: number): number {
    // Simple boundary quality assessment
    const windowSize = Math.min(64, data.length - offset);
    const window = data.slice(offset, offset + windowSize);

    // Check for clean boundaries (low noise at edges)
    const startNoise = Math.abs(window[0] - 128) / 128;
    const endNoise = Math.abs(window[window.length - 1] - 128) / 128;

    return 1.0 - (startNoise + endNoise) / 2;
  }

  /**
   * Detect music pattern characteristics
   */
  private detectMusicPattern(data: Uint8Array): {
    melodyComplexity: number;
    rhythmPattern: string;
    keySignature?: string;
    tempo?: number;
  } {
    const entropy = this.calculateEntropy(data);
    const variation = this.calculateVariation(data);

    // Simple pattern detection based on statistical properties
    const melodyComplexity = entropy / 8.0; // Normalize to 0-1
    const rhythmPattern = variation > 0.5 ? 'complex' : 'simple';

    return {
      melodyComplexity,
      rhythmPattern,
      tempo: entropy * 60 + 60 // Rough tempo estimation
    };
  }
}

// Placeholder classes are now replaced with real implementations in ai-models-implementation.ts
