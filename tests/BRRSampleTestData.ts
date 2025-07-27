/**
 * BRR Sample Test Data Generator
 * Creates test BRR data similar to the Python version for validation
 */

export function createTestBRRData(): Uint8Array {
  /**
   * Create a simple test BRR sample for validation.
   * This mimics the Python create_test_brr_data() function.
   */
  const testData: number[] = [];
  
  // Block 1: Filter 0, no loop/end
  testData.push(0x00); // Header: shift=0, filter=0, no loop, no end
  for (let i = 0; i < 8; i++) {
    // Create alternating nibbles: 0x01, 0x23, 0x45, etc.
    testData.push((i * 2 + 1) << 4 | (i * 2 + 2));
  }
  
  // Block 2: Filter 0, end flag set
  testData.push(0x01); // Header: shift=0, filter=0, no loop, end=1
  for (let i = 0; i < 8; i++) {
    // Decreasing pattern
    testData.push(((7 - i) * 2 + 1) << 4 | ((7 - i) * 2));
  }
  
  return new Uint8Array(testData);
}

export function createFilterTestData(filterType: number): Uint8Array {
  /**
   * Create BRR data to test specific filter types
   */
  const testData: number[] = [];
  
  // Single block with specified filter
  const header = (0 << 4) | (filterType << 2) | 0x01; // shift=0, filter=filterType, end=1
  testData.push(header);
  
  // Sample data with patterns that will show filter effects
  const patterns = [0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0];
  testData.push(...patterns);
  
  return new Uint8Array(testData);
}

function createLoopTestData(): Uint8Array {
  /**
   * Create BRR data with loop points for testing loop functionality
   */
  const testData: number[] = [];
  
  // Block 1: Normal block
  testData.push(0x00); // Header: shift=0, filter=0, no loop, no end
  for (let i = 0; i < 8; i++) {
    testData.push(0x11 + i);
  }
  
  // Block 2: Loop start block
  testData.push(0x02); // Header: shift=0, filter=0, loop=1, no end
  for (let i = 0; i < 8; i++) {
    testData.push(0x22 + i);
  }
  
  // Block 3: End with loop
  testData.push(0x03); // Header: shift=0, filter=0, loop=1, end=1
  for (let i = 0; i < 8; i++) {
    testData.push(0x33 + i);
  }
  
  return new Uint8Array(testData);
}

function createPitchTestData(): Uint8Array {
  /**
   * Create BRR data suitable for pitch testing
   */
  const testData: number[] = [];
  
  // Create a simple tone pattern
  for (let block = 0; block < 4; block++) {
    if (block === 3) {
      testData.push(0x01); // End on last block
    } else {
      testData.push(0x00); // Normal block
    }
    
    // Generate a simple sine-like pattern
    for (let i = 0; i < 8; i++) {
      const phase = (block * 8 + i) / 32.0 * Math.PI * 2;
      const sample = Math.floor(Math.sin(phase) * 7) + 8; // Scale to 0-15 range
      const nibble1 = Math.floor(sample / 2);
      const nibble2 = sample % 2 === 0 ? nibble1 : nibble1 + 1;
      testData.push((nibble1 << 4) | nibble2);
    }
  }
  
  return new Uint8Array(testData);
}

interface BRRTestSample {
  name: string;
  data: Uint8Array;
  expectedSamples: number;
  description: string;
}

/**
 * Get all test samples for comprehensive testing
 */
export function getAllTestSamples(): BRRTestSample[] {
  return [
    {
      name: 'basic_test',
      data: createTestBRRData(),
      expectedSamples: 32, // 2 blocks * 16 samples
      description: 'Basic test data with two blocks'
    },
    {
      name: 'filter_0',
      data: createFilterTestData(0),
      expectedSamples: 16, // 1 block * 16 samples
      description: 'Filter type 0 (no filter) test'
    },
    {
      name: 'filter_1',
      data: createFilterTestData(1),
      expectedSamples: 16,
      description: 'Filter type 1 (linear) test'
    },
    {
      name: 'filter_2',
      data: createFilterTestData(2),
      expectedSamples: 16,
      description: 'Filter type 2 (quadratic) test'
    },
    {
      name: 'filter_3',
      data: createFilterTestData(3),
      expectedSamples: 16,
      description: 'Filter type 3 (cubic) test'
    },
    {
      name: 'loop_test',
      data: createLoopTestData(),
      expectedSamples: 48, // 3 blocks * 16 samples
      description: 'BRR data with loop points'
    },
    {
      name: 'pitch_test',
      data: createPitchTestData(),
      expectedSamples: 64, // 4 blocks * 16 samples
      description: 'BRR data suitable for pitch testing'
    }
  ];
}
