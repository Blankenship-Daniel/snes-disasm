import { BRRBlockHeader } from '../types/audio-types';

// =============================================================================
// Custom Error Types
// =============================================================================

/**
 * Error thrown when BRR decoding fails
 */
export class BRRDecodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BRRDecodingError';
  }
}

/**
 * Error thrown when BRR file format is invalid
 */
class BRRFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BRRFormatError';
  }
}

/**
 * Error thrown when sample rate conversion fails
 */
class SampleRateConversionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SampleRateConversionError';
  }
}

// =============================================================================
// BRR Block Class (equivalent to Python BRRBlock)
// =============================================================================

/**
 * Represents a 9-byte BRR block containing 16 samples
 */
class BRRBlock {
  public readonly range: number;
  public readonly filter: number;
  public readonly loopFlag: boolean;
  public readonly endFlag: boolean;
  public readonly data: Uint8Array;

  constructor(data: Uint8Array) {
    if (data.length !== 9) {
      throw new BRRDecodingError('BRR block must be exactly 9 bytes');
    }

    // Parse header byte (SSSS FFLE)
    const header = data[0];
    this.range = header >> 4;         // Left-shift amount (S)
    this.filter = (header >> 2) & 3;  // Decoding filter (F)
    this.loopFlag = (header & 2) !== 0;  // Loop flag (L)
    this.endFlag = (header & 1) !== 0;   // End flag (E)

    // Sample data bytes (8 bytes containing 16 4-bit samples)
    this.data = data.slice(1);
  }

  /**
   * Extract 16 4-bit samples from the 8 data bytes (high nibble first)
   */
  decodeNibbles(): number[] {
    const samples: number[] = [];
    for (const byte of this.data) {
      // High nibble first, then low nibble
      const high = (byte >> 4) & 0x0F;
      const low = byte & 0x0F;

      // Convert to signed 4-bit values (-8 to +7)
      const signedHigh = high >= 8 ? high - 16 : high;
      const signedLow = low >= 8 ? low - 16 : low;

      samples.push(signedHigh, signedLow);
    }
    return samples;
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Clamp a sample value to 16-bit signed integer range
 */
export function clamp(sample: number): number {
  return Math.max(Math.min(sample, 32767), -32768);
}

/**
 * Apply IIR filtering with previous samples
 */
export function applyFilter(
  filterNum: number,
  samples: number[],
  prev1: number,
  prev2: number
): { filteredSamples: number[]; prev1: number; prev2: number } {
  const filteredSamples: number[] = [];
  let currentPrev1 = prev1;
  let currentPrev2 = prev2;

  for (const sample of samples) {
    let filteredSample: number;

    if (filterNum === 0) {
      // No filter
      filteredSample = sample;
    } else if (filterNum === 1) {
      // Linear filter: s' = s + p1 * 15/16
      filteredSample = sample + Math.floor(currentPrev1 * 15 / 16);
    } else if (filterNum === 2) {
      // Quadratic filter: s' = s + p1 * 61/32 - p2 * 15/16
      filteredSample = sample + Math.floor(currentPrev1 * 61 / 32) - Math.floor(currentPrev2 * 15 / 16);
    } else if (filterNum === 3) {
      // Cubic filter: s' = s + p1 * 115/64 - p2 * 13/16
      filteredSample = sample + Math.floor(currentPrev1 * 115 / 64) - Math.floor(currentPrev2 * 13 / 16);
    } else {
      filteredSample = sample;
    }

    // Clamp to 16-bit range
    filteredSample = clamp(filteredSample);
    filteredSamples.push(filteredSample);

    // Update previous samples
    currentPrev2 = currentPrev1;
    currentPrev1 = filteredSample;
  }

  return { filteredSamples, prev1: currentPrev1, prev2: currentPrev2 };
}

/**
 * Decode complete BRR file to 16-bit PCM samples
 */
export function decodeBrrFile(
  data: Uint8Array,
  enableLooping: boolean = false
): number[] {
  const pcmSamples: number[] = [];
  let prev1 = 0;
  let prev2 = 0;
  let loopStartPosition: number | null = null;
  let position = 0;

  while (position < data.length) {
    if (position + 9 > data.length) {
      break; // Not enough data for a complete block
    }

    const block = new BRRBlock(data.slice(position, position + 9));
    position += 9;

    // Mark loop start position if loop flag is set
    if (block.loopFlag) {
      loopStartPosition = pcmSamples.length;
    }

    // Decode 16 samples from this block
    let samples = block.decodeNibbles();

    // Apply range (left-shift)
    if (block.range > 0) {
      samples = samples.map(s => s << block.range);
    }

    // Apply BRR filter
    const filterResult = applyFilter(block.filter, samples, prev1, prev2);
    pcmSamples.push(...filterResult.filteredSamples);
    prev1 = filterResult.prev1;
    prev2 = filterResult.prev2;

    // Handle end flag
    if (block.endFlag) {
      if (enableLooping && block.loopFlag && loopStartPosition !== null) {
        // Loop back to the loop start position
        // In a real implementation, this would continue playing from loop point
        // For file decoding, we'll just stop here
        break;
      } else {
        // End of sample
        break;
      }
    }
  }

  return pcmSamples;
}

// =============================================================================
// Sample Rate Conversion Helpers
// =============================================================================

/**
 * Convert sample rate using linear interpolation
 */
function convertSampleRate(
  samples: number[],
  fromRate: number,
  toRate: number
): number[] {
  if (fromRate === toRate) {
    return samples;
  }

  if (fromRate <= 0 || toRate <= 0) {
    throw new SampleRateConversionError('Sample rates must be positive');
  }

  const ratio = fromRate / toRate;
  const outputLength = Math.floor(samples.length / ratio);
  const output: number[] = [];

  for (let i = 0; i < outputLength; i++) {
    const sourceIndex = i * ratio;
    const lowerIndex = Math.floor(sourceIndex);
    const upperIndex = Math.min(lowerIndex + 1, samples.length - 1);
    const fraction = sourceIndex - lowerIndex;

    if (lowerIndex >= samples.length) {
      break;
    }

    // Linear interpolation
    const lowerSample = samples[lowerIndex] || 0;
    const upperSample = samples[upperIndex] || 0;
    const interpolatedSample = lowerSample + (upperSample - lowerSample) * fraction;

    output.push(Math.round(interpolatedSample));
  }

  return output;
}

/**
 * Convert sample rate using Gaussian interpolation (higher quality)
 */
export function convertSampleRateGaussian(
  samples: number[],
  fromRate: number,
  toRate: number
): number[] {
  if (fromRate === toRate) {
    return samples;
  }

  if (fromRate <= 0 || toRate <= 0) {
    throw new SampleRateConversionError('Sample rates must be positive');
  }

  // Gaussian interpolation coefficients (simplified)
  const gaussianTable = [
    0.0, 0.0625, 0.125, 0.1875, 0.25, 0.3125, 0.375, 0.4375,
    0.5, 0.5625, 0.625, 0.6875, 0.75, 0.8125, 0.875, 0.9375
  ];

  const ratio = fromRate / toRate;
  const output: number[] = [];
  let pos = 0.0;

  while (Math.floor(pos) < samples.length - 3) {
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const fracIndex = Math.floor(frac * 16) & 0x0F;

    // 4-point Gaussian interpolation
    const s0 = samples[Math.max(0, idx - 1)] || 0;
    const s1 = samples[idx] || 0;
    const s2 = samples[idx + 1] || 0;
    const s3 = samples[Math.min(samples.length - 1, idx + 2)] || 0;

    const g = gaussianTable[fracIndex];
    const interpolated = Math.floor(
      s1 * (1 - g) + s2 * g +
      (s0 - s1 - s2 + s3) * g * (1 - g) * 0.25
    );

    output.push(clamp(interpolated));
    pos += ratio;
  }

  return output;
}

/**
 * Get the standard SNES BRR sample rate
 */
export function getStandardSampleRate(): number {
  return 32000;
}

/**
 * Calculate pitch ratio from SNES pitch value
 */
export function calculatePitchRatio(pitch: number): number {
  return pitch / 0x1000;
}

// =============================================================================
// BRR Block Parsing Utilities
// =============================================================================

/**
 * Parse BRR block header from a single byte
 */
function parseBrrHeader(header: number): BRRBlockHeader {
  return {
    range: header >> 4,
    filter: (header >> 2) & 0x03,
    loop: (header & 2) !== 0,
    end: (header & 1) !== 0
  };
}

/**
 * Validate BRR block data
 */
function validateBrrBlock(data: Uint8Array): boolean {
  if (data.length !== 9) {
    return false;
  }

  const header = data[0];
  const range = header >> 4;
  const filter = (header >> 2) & 0x03;

  // Range should be 0-12 (13-15 are invalid)
  if (range > 12) {
    return false;
  }

  // Filter should be 0-3
  if (filter > 3) {
    return false;
  }

  return true;
}

/**
 * Extract all BRR blocks from data
 */
function extractBrrBlocks(data: Uint8Array): BRRBlock[] {
  const blocks: BRRBlock[] = [];
  let position = 0;

  while (position + 9 <= data.length) {
    const blockData = data.slice(position, position + 9);
    if (!validateBrrBlock(blockData)) {
      throw new BRRFormatError(`Invalid BRR block at position ${position}`);
    }

    const block = new BRRBlock(blockData);
    blocks.push(block);
    position += 9;

    // Stop if we hit an end block
    if (block.endFlag) {
      break;
    }
  }

  return blocks;
}

