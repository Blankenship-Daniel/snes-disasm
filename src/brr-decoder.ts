/**
 * SNES BRR Audio Decoder
 *
 * Implements the SNES Bit Rate Reduction (BRR) audio format decoder
 * based on the official SNES development documentation.
 */

interface BRRBlockInfo {
  range: number;        // Left-shift amount (0-15)
  filter: number;       // BRR filter number (0-3)
  loopFlag: boolean;    // Loop flag (L)
  endFlag: boolean;     // End flag (E)
  samples: number[];    // 16 decoded samples
}

class BRRBlock {
  range: number;
  filter: number;
  loopFlag: boolean;
  endFlag: boolean;
  private data: Uint8Array;

  constructor(data: Uint8Array) {
    if (data.length !== 9) {
      throw new Error('BRR block must be exactly 9 bytes');
    }

    // Parse header byte (SSSS FFLE)
    const header = data[0];
    this.range = header >>> 4;         // Left-shift amount (S)
    this.filter = (header >>> 2) & 3; // Decoding filter (F)
    this.loopFlag = (header & 2) !== 0;  // Loop flag (L)
    this.endFlag = (header & 1) !== 0;   // End flag (E)

    // Sample data bytes (8 bytes containing 16 4-bit samples)
    this.data = data.slice(1);
  }

  /**
   * Extract 16 4-bit samples from the 8 data bytes (high nibble first).
   */
  decodeNibbles(): number[] {
    const samples: number[] = [];

    for (const byte of this.data) {
      // High nibble first, then low nibble
      const high = (byte >>> 4) & 0x0F;
      const low = byte & 0x0F;

      // Convert to signed 4-bit values (-8 to +7)
      const highSigned = high >= 8 ? high - 16 : high;
      const lowSigned = low >= 8 ? low - 16 : low;

      samples.push(highSigned, lowSigned);
    }

    return samples;
  }

  getInfo(): BRRBlockInfo {
    return {
      range: this.range,
      filter: this.filter,
      loopFlag: this.loopFlag,
      endFlag: this.endFlag,
      samples: this.decodeNibbles()
    };
  }
}

/**
 * Apply BRR IIR filtering with previous samples.
 *
 * Filter coefficients based on SNES development documentation:
 * Filter 0: No filter
 * Filter 1: s' = s + p1 * 15/16
 * Filter 2: s' = s + p1 * 61/32 - p2 * 15/16
 * Filter 3: s' = s + p1 * 115/64 - p2 * 13/16
 */
function applyFilter(
  filterNum: number,
  samples: number[],
  prev1: number,
  prev2: number
): { samples: number[], prev1: number, prev2: number } {
  const filteredSamples: number[] = [];

  for (const sample of samples) {
    let filteredSample: number;

    switch (filterNum) {
    case 0:
      // No filter
      filteredSample = sample;
      break;
    case 1:
      // Linear filter: s' = s + p1 * 15/16
      filteredSample = sample + Math.floor(prev1 * 15 / 16);
      break;
    case 2:
      // Quadratic filter: s' = s + p1 * 61/32 - p2 * 15/16
      filteredSample = sample + Math.floor(prev1 * 61 / 32) - Math.floor(prev2 * 15 / 16);
      break;
    case 3:
      // Cubic filter: s' = s + p1 * 115/64 - p2 * 13/16
      filteredSample = sample + Math.floor(prev1 * 115 / 64) - Math.floor(prev2 * 13 / 16);
      break;
    default:
      filteredSample = sample;
      break;
    }

    // Clamp to 16-bit range
    filteredSample = Math.max(Math.min(filteredSample, 32767), -32768);
    filteredSamples.push(filteredSample);

    // Update previous samples
    prev2 = prev1;
    prev1 = filteredSample;
  }

  return { samples: filteredSamples, prev1, prev2 };
}

export interface BRRDecoderOptions {
  enableLooping?: boolean;
  maxSamples?: number;
  outputSampleRate?: number;
}

interface BRRDecoderResult {
  samples: number[];
  sampleRate: number;
  loopStart?: number;
  blocks: BRRBlockInfo[];
  stats: {
    totalBlocks: number;
    loopBlocks: number;
    endBlocks: number;
    filterUsage: Record<number, number>;
  };
}

/**
 * Decode complete BRR file to 16-bit PCM samples.
 */
export function decodeBRRFile(
  data: Uint8Array,
  options: BRRDecoderOptions = {}
): BRRDecoderResult {
  const {
    enableLooping = false,
    maxSamples = Infinity,
    outputSampleRate = 32000
  } = options;

  const pcmSamples: number[] = [];
  const blocks: BRRBlockInfo[] = [];
  const stats = {
    totalBlocks: 0,
    loopBlocks: 0,
    endBlocks: 0,
    filterUsage: { 0: 0, 1: 0, 2: 0, 3: 0 } as Record<number, number>
  };

  let prev1 = 0;
  let prev2 = 0;
  let loopStartPosition: number | undefined;
  let position = 0;

  while (position < data.length && pcmSamples.length < maxSamples) {
    if (position + 9 > data.length) {
      break; // Not enough data for a complete block
    }

    const blockData = data.slice(position, position + 9);
    const block = new BRRBlock(blockData);
    position += 9;
    stats.totalBlocks++;

    // Mark loop start position if loop flag is set
    if (block.loopFlag) {
      loopStartPosition = pcmSamples.length;
      stats.loopBlocks++;
    }

    // Track filter usage
    stats.filterUsage[block.filter]++;

    // Decode 16 samples from this block
    let samples = block.decodeNibbles();

    // Apply range (left-shift)
    if (block.range > 0) {
      samples = samples.map(s => s << block.range);
    }

    // Apply BRR filter
    const filtered = applyFilter(block.filter, samples, prev1, prev2);
    pcmSamples.push(...filtered.samples);
    prev1 = filtered.prev1;
    prev2 = filtered.prev2;

    // Store block info
    blocks.push(block.getInfo());

    // Handle end flag
    if (block.endFlag) {
      stats.endBlocks++;
      if (enableLooping && block.loopFlag && loopStartPosition !== undefined) {
        // In a real-time player, this would loop back to loopStartPosition
        // For file decoding, we stop here
        break;
      } else {
        // End of sample
        break;
      }
    }
  }

  return {
    samples: pcmSamples,
    sampleRate: outputSampleRate,
    loopStart: loopStartPosition,
    blocks,
    stats
  };
}

/**
 * Export BRR decoded samples to WAV format buffer.
 */
export function exportToWAV(
  samples: number[],
  sampleRate: number = 32000
): Uint8Array {
  const numChannels = 1; // Mono
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = samples.length * bytesPerSample;
  const fileSize = 44 + dataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  const uint8View = new Uint8Array(buffer);

  // WAV header
  let offset = 0;

  // RIFF chunk
  uint8View.set(new TextEncoder().encode('RIFF'), offset); offset += 4;
  view.setUint32(offset, fileSize - 8, true); offset += 4;
  uint8View.set(new TextEncoder().encode('WAVE'), offset); offset += 4;

  // fmt chunk
  uint8View.set(new TextEncoder().encode('fmt '), offset); offset += 4;
  view.setUint32(offset, 16, true); offset += 4; // chunk size
  view.setUint16(offset, 1, true); offset += 2;  // audio format (PCM)
  view.setUint16(offset, numChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * blockAlign, true); offset += 4; // byte rate
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, bitsPerSample, true); offset += 2;

  // data chunk
  uint8View.set(new TextEncoder().encode('data'), offset); offset += 4;
  view.setUint32(offset, dataSize, true); offset += 4;

  // Sample data
  for (const sample of samples) {
    view.setInt16(offset, sample, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}
