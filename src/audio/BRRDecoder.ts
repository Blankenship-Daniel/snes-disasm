import { BRRBlock, BRRBlockHeader, ADSREnvelope } from '../types/audio-types';
import {
  clamp,
  applyFilter,
  decodeBrrFile,
  getStandardSampleRate,
  calculatePitchRatio,
  convertSampleRateGaussian,
  BRRDecodingError
} from './brr-decoder-utils';
import { writeFileSync } from 'fs';

const SAMPLE_RATE = getStandardSampleRate();
const MAX_INT16 = 32767;
const MIN_INT16 = -32768;

// BRR filter coefficients (from SNES9x implementation)
const BRR_FILTER_COEFFS = [
  [0, 0],       // Filter 0
  [15, 0],      // Filter 1: 15/16
  [61, -15],    // Filter 2: 61/32 - 15/16
  [115, -13]    // Filter 3: 115/64 - 13/16
];

// ADSR envelope processor
class ADSRProcessor {
  private state: 'attack' | 'decay' | 'sustain' | 'release' = 'attack';
  private envelope: number = 0;
  private enabled: boolean = true;
  private config: ADSREnvelope;

  constructor(config: ADSREnvelope) {
    this.config = config;
    this.enabled = config.enabled;
  }

  processSample(): number {
    if (!this.enabled) {
      return 1.0;
    }

    switch (this.state) {
    case 'attack':
      if (this.config.attack === 15) {
        this.envelope += 1024; // Linear increase +1024 at rate 31
      } else {
        this.envelope += 32; // Linear increase +32 at specified rate
      }
      if (this.envelope >= 2047) {
        this.envelope = 2047;
        this.state = 'decay';
      }
      break;

    case 'decay':
      this.envelope -= Math.max(1, (this.envelope - 1) >> 8);
      if ((this.envelope >> 8) <= this.config.sustain) {
        this.state = 'sustain';
      }
      break;

    case 'sustain':
      if (this.config.release > 0) {
        this.envelope -= Math.max(1, (this.envelope - 1) >> 8);
      }
      break;

    case 'release':
      this.envelope -= 8;
      if (this.envelope < 0) {
        this.envelope = 0;
      }
      break;
    }

    return this.envelope / 2047.0;
  }

  keyOn(): void {
    this.envelope = 0;
    this.state = 'attack';
  }

  keyOff(): void {
    this.state = 'release';
  }
}

class BRRDecoder {
  private brrData: Uint8Array;
  private samples: number[] = [];
  private prevSamples: [number, number] = [0, 0];
  private adsrProcessor: ADSRProcessor;
  private pitch: number;
  private loopStart: number = 0;
  private loopEnabled: boolean = false;

  constructor(brrData: Uint8Array, adsrParams: Partial<ADSREnvelope> = {}, pitch: number = 0x1000) {
    this.brrData = brrData;
    this.pitch = pitch;
    const adsrConfig = this.initADSR(adsrParams);
    this.adsrProcessor = new ADSRProcessor(adsrConfig);
  }

  private initADSR(params: Partial<ADSREnvelope>): ADSREnvelope {
    return {
      attack: params.attack || 15,
      decay: params.decay || 7,
      sustain: params.sustain || 7,
      release: params.release || 0,
      enabled: params.enabled || true
    };
  }

  private decodeBlock(data: Uint8Array): number[] {
    const header: BRRBlockHeader = this.parseBRRHeader(data[0]);
    const samples: number[] = [];

    for (let i = 1; i < data.length; i++) {
      const byte = data[i];

      for (const nibble of [(byte >> 4) & 0x0F, byte & 0x0F]) {
        let sample = nibble >= 8 ? nibble - 16 : nibble;

        sample <<= header.range;

        if (header.filter > 0) {
          const coeffs = BRR_FILTER_COEFFS[header.filter];
          sample += Math.floor(coeffs[0] * this.prevSamples[0]);
          if (header.filter > 1) {
            sample += Math.floor(coeffs[1] * this.prevSamples[1]);
          }
        }

        sample = this.clamp16(sample);

        this.prevSamples[1] = this.prevSamples[0];
        this.prevSamples[0] = sample;

        samples.push(sample);
      }
    }

    return samples;
  }

  private parseBRRHeader(header: number): BRRBlockHeader {
    return {
      range: header >> 4,
      filter: (header >> 2) & 0x03,
      loop: (header & 2) !== 0,
      end: (header & 1) !== 0
    };
  }

  private clamp16(value: number): number {
    return Math.max(MIN_INT16, Math.min(MAX_INT16, value));
  }

  public decode(): number[] {
    this.samples = [];
    this.adsrProcessor.keyOn();

    let blockIndex = 0;
    while (blockIndex + 9 <= this.brrData.length) {
      const blockData = this.brrData.slice(blockIndex, blockIndex + 9);
      const header = this.parseBRRHeader(blockData[0]);
      const decodedSamples = this.decodeBlock(blockData);

      // Handle loop flag
      if (header.loop) {
        this.loopStart = this.samples.length;
        this.loopEnabled = true;
      }

      // Apply ADSR envelope to each sample
      for (const sample of decodedSamples) {
        const envelope = this.adsrProcessor.processSample();
        const finalSample = this.clamp16(sample * envelope * 2); // Scale up for final output
        this.samples.push(finalSample);
      }

      // Handle end flag
      if (header.end) {
        if (this.loopEnabled && header.loop) {
          // In a real-time player, this would loop back to loopStart
          // For file decoding, we stop here
          break;
        } else {
          break;
        }
      }

      blockIndex += 9;
    }

    return this.samples;
  }

  /**
   * Apply Gaussian interpolation for pitch adjustment
   */
  public applyGaussianInterpolation(samples: number[]): number[] {
    if (this.pitch === 0x1000) {
      return samples; // No pitch adjustment needed
    }

    const pitchRatio = this.pitch / 0x1000;
    const outputSamples: number[] = [];

    // Gaussian interpolation coefficients (simplified)
    const gaussianTable = [
      0.0, 0.0625, 0.125, 0.1875, 0.25, 0.3125, 0.375, 0.4375,
      0.5, 0.5625, 0.625, 0.6875, 0.75, 0.8125, 0.875, 0.9375
    ];

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

      outputSamples.push(this.clamp16(interpolated));
      pos += pitchRatio;
    }

    return outputSamples;
  }

  public exportToWAV(filename: string): void {
    const numberOfSamples = this.samples.length;
    const waveBuffer = Buffer.alloc(44 + numberOfSamples * 2);

    let offset = 0;
    waveBuffer.write('RIFF', offset); offset += 4;
    waveBuffer.writeUInt32LE(36 + numberOfSamples * 2, offset); offset += 4;
    waveBuffer.write('WAVE', offset); offset += 4;

    waveBuffer.write('fmt ', offset); offset += 4;
    waveBuffer.writeUInt32LE(16, offset); offset += 4;
    waveBuffer.writeUInt16LE(1, offset); offset += 2;
    waveBuffer.writeUInt16LE(1, offset); offset += 2;
    waveBuffer.writeUInt32LE(SAMPLE_RATE, offset); offset += 4;
    waveBuffer.writeUInt32LE(SAMPLE_RATE * 2, offset); offset += 4;
    waveBuffer.writeUInt16LE(2, offset); offset += 2;
    waveBuffer.writeUInt16LE(16, offset); offset += 2;

    waveBuffer.write('data', offset); offset += 4;
    waveBuffer.writeUInt32LE(numberOfSamples * 2, offset); offset += 4;

    for (const sample of this.samples) {
      waveBuffer.writeInt16LE(sample, offset);
      offset += 2;
    }

    writeFileSync(filename, waveBuffer);
  }
}

export default BRRDecoder;

