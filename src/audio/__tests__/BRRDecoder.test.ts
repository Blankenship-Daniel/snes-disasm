import BRRDecoder from '../BRRDecoder';

// Sample test data
const testBRRData = new Uint8Array([
  0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
  0x01, 0x99, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0x00
]);

const adsrParams = {
  attack: 10,
  decay: 5,
  sustain: 4,
  release: 2
};

test('Basic BRR decoding', () => {
  const decoder = new BRRDecoder(testBRRData);
  const samples = decoder.decode();
  expect(samples.length).toBeGreaterThan(0);
});

test('BRR decoding with ADSR envelope', () => {
  const decoder = new BRRDecoder(testBRRData, adsrParams);
  const samples = decoder.decode();
  expect(samples.length).toBeGreaterThan(0);
});

test('Export to WAV', () => {
  const decoder = new BRRDecoder(testBRRData);
  decoder.decode();
  const filePath = '/tmp/test_output.wav';
  decoder.exportToWAV(filePath);
  expect(require('fs').existsSync(filePath)).toBe(true);
});

