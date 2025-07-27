import BRRDecoder from '../src/audio/BRRDecoder';
import * as fs from 'fs';
import * as path from 'path';
import { getAllTestSamples, createTestBRRData, createFilterTestData } from './BRRSampleTestData';

// Sample test data with correct BRR block structure
const testBRRData = new Uint8Array([
  0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, // Block 1: filter=0, range=0, no loop/end
  0x01, 0x99, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0x00  // Block 2: filter=0, range=0, end=1
]);

const adsrParams = {
  attack: 10,
  decay: 5,
  sustain: 4,
  release: 2
};

describe('BRRDecoder', () => {
  beforeAll(() => {
    // Ensure output directory exists
    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  test('Basic BRR decoding', () => {
    const decoder = new BRRDecoder(testBRRData);
    const samples = decoder.decode();
    
    // Should decode 2 blocks * 16 samples = 32 samples
    expect(samples.length).toBe(32);
    expect(Array.isArray(samples)).toBe(true);
    expect(samples.every(sample => typeof sample === 'number')).toBe(true);
  });

  describe('Comprehensive Sample Tests', () => {
    const samples = getAllTestSamples();

    samples.forEach((sample) => {
      test(`Sample: ${sample.name}`, () => {
        const decoder = new BRRDecoder(sample.data);
        const decodedSamples = decoder.decode();

        expect(decodedSamples.length).toBe(sample.expectedSamples);
        expect(Array.isArray(decodedSamples)).toBe(true);
        expect(decodedSamples.every(sample => typeof sample === 'number')).toBe(true);
      });
    });
  });

  test('BRR decoding with ADSR envelope', () => {
    const decoder = new BRRDecoder(testBRRData, adsrParams);
    const samples = decoder.decode();
    
    expect(samples.length).toBe(32);
    expect(Array.isArray(samples)).toBe(true);
  });

  test('Gaussian interpolation with pitch adjustment', () => {
    const decoder = new BRRDecoder(testBRRData, {}, 0x2000); // Double pitch
    const rawSamples = decoder.decode();
    const interpolatedSamples = decoder.applyGaussianInterpolation(rawSamples);
    
    // Interpolated samples should be different length due to pitch change
    expect(interpolatedSamples.length).toBeGreaterThan(0);
    expect(Array.isArray(interpolatedSamples)).toBe(true);
  });

  test('Export to WAV', () => {
    const decoder = new BRRDecoder(testBRRData);
    decoder.decode();
    
    const outputDir = path.join(__dirname, '../output');
    const filePath = path.join(outputDir, 'test_output.wav');
    
    decoder.exportToWAV(filePath);
    
    expect(fs.existsSync(filePath)).toBe(true);
    
    // Check file has content (more than just header)
    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(44); // WAV header is 44 bytes
    
    // Clean up
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  test('BRR block header parsing', () => {
    // Test header parsing by creating decoder and accessing internal methods
    const decoder = new BRRDecoder(testBRRData);
    const samples = decoder.decode();
    
    // Just verify it doesn't crash and produces samples
    expect(samples.length).toBeGreaterThan(0);
  });

  test('Sample clamping', () => {
    // Create test data that might cause overflow
    const extremeData = new Uint8Array([
      0xF0, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, // High shift, max values
      0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00  // End block
    ]);
    
    const decoder = new BRRDecoder(extremeData);
    const samples = decoder.decode();
    
    // All samples should be within 16-bit range
    expect(samples.every(sample => sample >= -32768 && sample <= 32767)).toBe(true);
  });

  test('Empty data handling', () => {
    const emptyData = new Uint8Array([]);
    const decoder = new BRRDecoder(emptyData);
    const samples = decoder.decode();
    
    expect(samples.length).toBe(0);
  });

  test('ADSR state transitions', () => {
    const decoder = new BRRDecoder(testBRRData, {
      attack: 15,
      decay: 7,
      sustain: 4,
      release: 2,
      enabled: true
    });
    
    const samples = decoder.decode();
    expect(samples.length).toBeGreaterThan(0);
    // ADSR should modify samples, but we can't easily test exact values
    // without exposing internal state
  });
});
