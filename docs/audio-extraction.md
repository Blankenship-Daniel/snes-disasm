# Audio Extraction Documentation

## Overview

The SNES disassembler provides comprehensive audio extraction capabilities for analyzing and extracting audio assets from Super Nintendo Entertainment System ROMs. The audio system supports multiple SPC700 engines and formats, with particular focus on BRR (Bit Rate Reduction) compressed audio samples and music sequences.

## AudioExtractor Class

The `AudioExtractor` class is the main interface for audio extraction operations. It provides methods for extracting complete SPC700 programs, BRR samples, and music sequences from audio data.

### Key Features

- **Multi-Engine Support**: Detects and handles various SPC700 engines including N-SPC, Akao, HAL, Kankichi-kun, and Capcom QSound
- **Comprehensive BRR Extraction**: Extracts BRR compressed audio samples with full metadata and validation
- **Sequence Analysis**: Parses music sequences with timing information, channel data, and effects
- **AI-Enhanced Classification**: Optional AI pattern recognition for sample categorization
- **Metadata Generation**: Extracts comprehensive metadata including ADSR envelopes, pitch data, and complexity analysis

## Core Methods

### extractSPCData()

Extracts complete SPC700 program data from 64KB audio RAM including drivers, samples, and sequences.

```typescript
async extractSPCData(audioRAM: Uint8Array, startAddress: number = 0): Promise<SPCProgram>
```

**Parameters:**
- `audioRAM`: Complete SPC700 64KB audio RAM dump
- `startAddress`: Starting address in audio RAM (default: 0)

**Returns:** Promise resolving to complete `SPCProgram` with all extracted components

**Features:**
- Auto-detects SPC engine type (N-SPC, Akao, HAL, Kankichi-kun, etc.)
- Extracts driver version information and engine-specific data structures
- Parses sound command tables and instrument mappings
- Configures echo buffer parameters
- Extracts BRR compressed audio samples
- Parses music sequence data with pattern tables

**Example:**
```typescript
const audioExtractor = new AudioExtractor();
const spcData = new Uint8Array(0x10000); // 64KB audio RAM
const program = await audioExtractor.extractSPCData(spcData);

console.log(`Engine: ${program.enginePattern?.engine}`);
console.log(`Samples: ${program.samples.length}`);
console.log(`Sequences: ${program.sequences.length}`);
```

### extractBRRSamples()

Extract BRR (Bit Rate Reduction) compressed audio samples with enhanced parsing and validation.

```typescript
async extractBRRSamples(data: Uint8Array, startOffset: number = 0, aiRecognizer?: AIPatternRecognizer): Promise<BRRSample[]>
```

**Parameters:**
- `data`: Raw audio data containing BRR samples
- `startOffset`: Starting offset in data to begin extraction (default: 0)
- `aiRecognizer`: Optional AI classifier for sample categorization

**Returns:** Promise resolving to array of extracted BRR samples with metadata

**Features:**
- Validates BRR block headers for proper format compliance
- Parses complete sample chains with loop and end flags
- Extracts metadata including ADSR envelopes and pitch data
- Detects sample rates from engine context or uses defaults
- Validates data integrity with checksums
- Classifies samples using AI pattern recognition (optional)
- Finds and parses sample directory tables when available

**BRR Format Structure:**
- Each block: 9 bytes (1 header + 8 data bytes = 16 4-bit samples)
- Header byte: SSSSFFLE (S=shift, FF=filter, L=loop, E=end)
- Four filter types (0-3) with different prediction algorithms
- Loop flag indicates loop start, end flag indicates sample termination

**Example:**
```typescript
const audioExtractor = new AudioExtractor();
const audioData = new Uint8Array(romData.slice(0x20000, 0x40000));
const samples = await audioExtractor.extractBRRSamples(audioData, 0x200);

samples.forEach(sample => {
  console.log(`Sample at $${sample.address.toString(16)}: ${sample.blocks.length} blocks`);
  console.log(`Loop: ${sample.loopFlag}, Category: ${sample.metadata?.category}`);
  console.log(`Sample Rate: ${sample.sampleRate}Hz, Pitch: ${sample.pitch}`);
});
```

### extractSequences()

Enhanced music sequence extraction with comprehensive pattern analysis and engine-specific parsing.

```typescript
extractSequences(data: Uint8Array, startOffset: number = 0): MusicSequence[]
```

**Parameters:**
- `data`: Raw audio data containing music sequences
- `startOffset`: Starting offset in data to begin extraction (default: 0)

**Returns:** Array of extracted music sequences with full metadata

**Features:**
- Auto-detects SPC engine type for accurate parsing
- Locates sequence headers using engine-specific patterns
- Parses timing information, tempo, and time signatures
- Extracts pattern tables for engines that use them (HAL, Kankichi-kun)
- Parses individual channel data with note events, effects, and commands
- Calculates track lengths, loop points, and duration estimates
- Extracts instrument assignments and global effects
- Generates comprehensive metadata including complexity analysis

**Engine-Specific Features:**
- **N-SPC**: Nintendo's standard with channel masks and tempo headers
- **Akao**: Square's early engine with instrument assignment tables
- **HAL**: Pattern-based sequences with "HAL" signature detection
- **Kankichi-kun**: Unique command structure with characteristic patterns
- **Generic**: Fallback parsing for unknown or proprietary engines

**Example:**
```typescript
const audioExtractor = new AudioExtractor();
const musicData = new Uint8Array(romData.slice(0x10000, 0x20000));
const sequences = audioExtractor.extractSequences(musicData, 0x1000);

sequences.forEach(seq => {
  console.log(`Sequence "${seq.name}" (${seq.engine} engine)`);
  console.log(`  Tempo: ${seq.tempo} BPM, Duration: ${seq.metadata?.estimatedDuration}s`);
  console.log(`  Channels: ${seq.channels.length}, Complexity: ${seq.metadata?.complexity}`);
  console.log(`  Pattern Table: ${seq.patternTable ? 'Yes' : 'No'}`);
  
  seq.channels.forEach(ch => {
    console.log(`    Channel ${ch.channelNumber}: ${ch.notes.length} notes, ${ch.effects.length} effects`);
  });
});
```

## CLI Audio Extraction

### Usage with Asset Extraction

The CLI provides audio extraction through the `--extract-assets` option, which triggers comprehensive asset extraction including audio components:

```bash
# Extract all assets including audio
npm run cli -- --extract-assets --input game.smc --output extracted/

# Extract with AI enhancement
npm run cli -- --extract-assets --enable-ai --input game.smc --output extracted/
```

### Workflow Integration

The CLI audio extraction integrates with the `AssetExtractor` class which coordinates all extraction operations:

1. **ROM Analysis**: Analyzes ROM structure to identify audio regions
2. **Audio Detection**: Locates SPC700 programs and audio data regions
3. **Engine Detection**: Identifies the specific SPC engine used
4. **Sample Extraction**: Extracts BRR samples with validation and metadata
5. **Sequence Parsing**: Parses music sequences with timing and channel data
6. **Metadata Generation**: Creates comprehensive metadata files
7. **Output Organization**: Organizes extracted assets by type and source

### Output Structure

```
extracted/
├── audio/
│   ├── spc_programs/
│   │   ├── program_0000.json      # SPC program metadata
│   │   └── program_0200.json
│   ├── samples/
│   │   ├── sample_0400.brr         # Raw BRR data
│   │   ├── sample_0400.json        # Sample metadata
│   │   ├── sample_0500.brr
│   │   └── sample_0500.json
│   ├── sequences/
│   │   ├── sequence_1000.json      # Sequence metadata
│   │   ├── sequence_1200.json
│   │   └── sequence_1400.json
│   └── audio_analysis.json         # Overall audio analysis
```

## Supported Engines and Formats

### SPC700 Engines

#### N-SPC (Nintendo Sound Processing Component)
- **Developer**: Nintendo
- **Games**: Most Nintendo first-party titles
- **Features**: Channel masks, tempo headers, standardized command set
- **Detection**: Header patterns starting with 0x40 0x12
- **Characteristics**: Consistent structure, well-documented commands

#### Akao Sound Engine
- **Developer**: Square (now Square Enix)
- **Games**: Early Square titles (Final Fantasy series)
- **Features**: Instrument assignment tables, unique command structure
- **Detection**: Header patterns starting with 0x7C 0x95
- **Characteristics**: Variable structure, game-specific customizations

#### HAL Sound Engine
- **Developer**: HAL Laboratory
- **Games**: Kirby series, Super Smash Bros.
- **Features**: Pattern-based sequences, "HAL" signature detection
- **Detection**: "HAL" ASCII signature in pattern tables
- **Characteristics**: Modular pattern system, complex arrangement data

#### Kankichi-kun
- **Developer**: Human Entertainment
- **Games**: Various Human titles
- **Features**: Unique command structure, characteristic patterns
- **Detection**: Specific command byte patterns (0x80-0xDF range)
- **Characteristics**: Proprietary format, limited documentation

#### Capcom QSound
- **Developer**: Capcom
- **Games**: Some Capcom arcade ports
- **Features**: Advanced echo effects, multi-sample instruments
- **Detection**: QSound-specific register patterns
- **Characteristics**: High-quality audio processing, complex effects

### Audio Formats

#### BRR (Bit Rate Reduction)
- **Compression**: Lossy ADPCM-based compression
- **Sample Rate**: Typically 32kHz, can vary by engine
- **Block Size**: 9 bytes per block (16 4-bit samples)
- **Filter Types**: 4 prediction filters (0-3)
- **Loop Support**: Hardware loop points with seamless looping
- **Quality**: Good balance between size and quality for 1990s hardware

#### SPC700 Music Sequences
- **Channels**: Up to 8 simultaneous channels
- **Commands**: Note events, volume, pan, pitch bend, vibrato, echo
- **Timing**: Variable tick resolution (typically 48 ticks per beat)
- **Effects**: Real-time effects processing through DSP
- **Instruments**: Sample-based instruments with ADSR envelopes

## Sample Output Examples

### BRR Sample Metadata
```json
{
  "address": 1024,
  "sampleRate": 32000,
  "blocks": 45,
  "loopFlag": true,
  "loopStart": 18,
  "loopEnd": 405,
  "pitch": 60,
  "checksumValid": true,
  "metadata": {
    "category": "instrument",
    "instrumentName": "Piano",
    "originalPitch": 60,
    "keyRange": { "low": 0, "high": 127 }
  },
  "adsrEnvelope": {
    "attack": 5,
    "decay": 5,
    "sustain": 15,
    "release": 5
  }
}
```

### Music Sequence Metadata
```json
{
  "name": "nspc_sequence_1000",
  "engine": "N-SPC",
  "address": 4096,
  "tempo": 150,
  "channels": 6,
  "trackLength": 7680,
  "loopPoint": 1920,
  "estimatedDuration": 64.0,
  "complexity": "complex",
  "timingInfo": {
    "ticksPerBeat": 48,
    "beatsPerMeasure": 4,
    "tempo": 150,
    "timeSignature": { "numerator": 4, "denominator": 4 }
  },
  "instrumentAssignments": {
    "0": 1,
    "1": 5,
    "2": 12,
    "3": 8,
    "4": 15,
    "5": 20
  },
  "effects": [
    {
      "type": "globalVolume",
      "value": 80,
      "timestamp": 0
    },
    {
      "type": "echo",
      "value": 30,
      "timestamp": 960
    }
  ]
}
```

### Channel Data Example
```json
{
  "channelNumber": 0,
  "instrumentIndex": 1,
  "volume": 100,
  "pan": 64,
  "notes": [
    {
      "note": 60,
      "velocity": 80,
      "duration": 96,
      "timestamp": 0
    },
    {
      "note": 64,
      "velocity": 75,
      "duration": 48,
      "timestamp": 96
    }
  ],
  "effects": [
    {
      "type": "volume",
      "parameter1": 80,
      "timestamp": 192
    },
    {
      "type": "vibrato",
      "parameter1": 10,
      "parameter2": 4,
      "timestamp": 288,
      "duration": 192
    }
  ]
}
```

## Troubleshooting Guide

### Common Issues

#### 1. No Audio Data Found
**Symptoms:** Empty arrays returned from extraction methods
**Causes:**
- Incorrect ROM format or corruption
- Audio data stored in compressed format
- Non-standard SPC engine
- Invalid start offset

**Solutions:**
- Verify ROM integrity and format
- Try different start offsets (common: 0x0200, 0x1000, 0x8000)
- Check for compressed or encrypted audio sections
- Use generic extraction mode for unknown engines

#### 2. Invalid BRR Samples
**Symptoms:** Samples with validation errors or garbled output
**Causes:**
- Corrupted sample data
- Incorrect sample boundaries
- Non-standard BRR format
- Hardware-specific variations

**Solutions:**
- Enable checksum validation
- Adjust sample detection thresholds
- Check for interleaved sample data
- Verify loop points and end flags

#### 3. Sequence Parsing Failures
**Symptoms:** Sequences with no notes or malformed channel data
**Causes:**
- Unknown engine type
- Encrypted or compressed sequences
- Custom command formats
- Incorrect header detection

**Solutions:**
- Try generic parsing mode
- Adjust engine detection sensitivity
- Check for sequence encryption
- Manually specify engine type if known

#### 4. Incorrect Tempo/Timing
**Symptoms:** Sequences play too fast or slow
**Causes:**
- Wrong tick resolution detection
- Incorrect tempo parsing
- Engine-specific timing variations
- Custom timing systems

**Solutions:**
- Manually specify tick resolution
- Check engine documentation
- Compare with known good sequences
- Adjust timing calculation parameters

#### 5. Missing Loop Points
**Symptoms:** Samples don't loop correctly
**Causes:**
- Incorrect loop flag detection
- Hardware vs. software loop handling
- Custom loop implementations
- Sample directory parsing errors

**Solutions:**
- Check sample directory tables
- Verify loop flag parsing
- Test with hardware-accurate emulation
- Check for software-based looping

### Debug Mode

Enable detailed logging for troubleshooting:

```typescript
// Enable debug logging
const audioExtractor = new AudioExtractor();
// Add logging to extraction methods
const samples = await audioExtractor.extractBRRSamples(data, 0, aiRecognizer);
```

### Validation Tools

Use built-in validation for data integrity:

```typescript
// Validate BRR sample integrity
if (!sample.checksumValid) {
  console.warn(`Sample at ${sample.address} failed checksum validation`);
}

// Check sequence complexity
if (sequence.metadata?.complexity === 'complex') {
  console.log(`Complex sequence detected: ${sequence.channels.length} channels`);
}
```

## Advanced Usage

### Custom Engine Support

Extend engine detection for proprietary formats:

```typescript
// Add custom engine pattern
const customPattern: SPCEnginePattern = {
  engine: 'Custom',
  confidence: 0.9,
  characteristics: ['Custom game-specific engine'],
  driverBaseAddress: 0x300
};
```

### AI-Enhanced Extraction

Enable AI pattern recognition for improved classification:

```typescript
const aiRecognizer = new AIPatternRecognizer('models/audio-classifier.onnx');
const samples = await audioExtractor.extractBRRSamples(data, 0, aiRecognizer);

// Check AI classification confidence
samples.forEach(sample => {
  if (sample.aiClassification?.confidence > 0.8) {
    console.log(`High confidence classification: ${sample.aiClassification.type}`);
  }
});
```

### Batch Processing

Process multiple ROMs efficiently:

```typescript
const roms = ['game1.smc', 'game2.smc', 'game3.smc'];
const results = [];

for (const rom of roms) {
  const romData = fs.readFileSync(rom);
  const audioExtractor = new AudioExtractor();
  const program = await audioExtractor.extractSPCData(romData.slice(0x8000));
  results.push({ rom, program });
}
```

## References

- [BRR Format Specification](BRR_to_WAV_Converter.md) - Detailed BRR format documentation
- [SPC700 Technical Reference](https://snesdev.mesen.ca/wiki/index.php?title=SPC700_Reference) - Official SPC700 documentation
- [SNES Audio System Overview](https://snesdev.mesen.ca/wiki/index.php?title=Audio_subsystem) - Complete audio system documentation
- [N-SPC Engine Documentation](https://snesdev.mesen.ca/wiki/index.php?title=N-SPC) - Nintendo's sound engine
- [BRR Samples Database](https://snesmusic.org/v2/brr.php) - Community BRR sample collection

## Related Classes and Interfaces

- `AudioExtractor` - Main extraction interface
- `BRRSample` - BRR sample data structure
- `MusicSequence` - Music sequence data structure
- `SPCProgram` - Complete SPC700 program
- `SPCEnginePattern` - Engine detection results
- `ChannelData` - Individual channel information
- `TimingInfo` - Tempo and timing data
- `AssetExtractor` - Unified asset extraction interface
