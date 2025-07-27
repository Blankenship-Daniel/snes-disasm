# Generic SNES Disassembler Improvements Roadmap

This document outlines improvements to make the SNES disassembler a truly generic tool that works with any SNES ROM without game-specific implementations.

## 🎯 Core Principle
Avoid game-specific code by focusing on SNES hardware patterns and universal algorithms that work across all games.

---

## 1. Enhanced Compression Detection & Decompression 🔝 **HIGHEST PRIORITY**

Most SNES games use compression, making this the highest impact improvement.

### Tasks:
- [ ] Create `CompressionDetector` interface
- [ ] Implement pattern-based compression detection
- [ ] Add RLE (Run-Length Encoding) decompression
- [ ] Add LZ77/LZ1/LZ2/LZ3 (Nintendo variants) decompression
- [ ] Add LZSS decompression (Konami/Capcom games)
- [ ] Add Huffman decompression support
- [ ] Create pluggable decompression module system
- [ ] Add automatic decompression during extraction
- [ ] Implement fallback to raw data for unknown compression
- [ ] Add compression statistics to analysis reports

### Implementation Example:
```typescript
interface CompressionDetector {
  detectCompression(data: Uint8Array): CompressionType;
  decompress(data: Uint8Array, type: CompressionType): Uint8Array;
}

enum CompressionType {
  NONE,
  RLE,           // Run-Length Encoding variants
  LZ77,          // Nintendo's LZ variants
  LZSS,          // Konami/Capcom games
  HUFFMAN,       // Some RPGs
  CUSTOM         // Unknown/proprietary
}
```

---

## 2. Universal Asset Pattern Recognition

Focus on SNES hardware patterns instead of game-specific patterns.

### Graphics Pattern Tasks:
- [ ] Implement 8x8 tile detection (all bit depths)
- [ ] Implement 16x16 sprite detection
- [ ] Add Mode 7 graphics detection
- [ ] Create OAM (Object Attribute Memory) pattern detector
- [ ] Add tilemap pattern recognition
- [ ] Implement palette grouping detection
- [ ] Add graphics mode detection (Mode 0-7)

### Audio Pattern Tasks:
- [ ] Implement BRR sample header detection
- [ ] Add SPC700 transfer pattern recognition
- [ ] Create sample directory detection
- [ ] Add ADSR envelope detection
- [ ] Implement echo buffer detection
- [ ] Add instrument preset detection

### Code Examples:
```typescript
// Detect based on SNES hardware constraints
const GRAPHICS_PATTERNS = {
  TILE_8x8: { size: 32, bpp: [2,4,8] },    // Standard tile
  TILE_16x16: { size: 128, bpp: [4] },     // Large sprite
  MODE7: { size: 128, bpp: [8] },          // Mode 7 graphics
  SPRITE_OAM: { alignment: 544 }           // OAM table structure
};

// SPC700 universal patterns
const AUDIO_PATTERNS = {
  BRR_HEADER: [0xB0, 0xB1, 0xB2, 0xB3],   // BRR sample markers
  SPC_TRANSFER: 0x2140,                    // SPC communication port
  SAMPLE_DIR: { offset: 0x100, size: 256 } // Sample directory
};
```

---

## 3. Improved Heuristic Analysis

Enhance pattern detection without hardcoding game logic.

### Smart Boundary Detection Tasks:
- [ ] Implement entropy-based boundary detection
- [ ] Add data transition analysis
- [ ] Create padding/empty space detection
- [ ] Implement repeating pattern detection
- [ ] Add alignment-based boundary hints
- [ ] Create confidence scoring system

### Universal Text Detection Tasks:
- [ ] Implement multi-encoding simultaneous detection
- [ ] Add ASCII text detection with validation
- [ ] Add Shift-JIS detection for Japanese games
- [ ] Implement custom 8-bit encoding detection
- [ ] Add DTE (Dual-Tile Encoding) detection
- [ ] Create text confidence scoring
- [ ] Add dictionary-based validation

### Implementation:
```typescript
class BoundaryDetector {
  // Detect data transitions using entropy analysis
  findDataBoundaries(data: Uint8Array): Boundary[] {
    // High entropy = likely compressed/encrypted
    // Low entropy = padding/empty space
    // Repeating patterns = uncompressed graphics/text
  }
}

class TextDetector {
  // Support multiple encodings simultaneously
  detectText(data: Uint8Array): TextRegion[] {
    return [
      this.detectASCII(data),
      this.detectShiftJIS(data),
      this.detectCustom8bit(data),
      this.detectDTE(data)  // Dual-Tile Encoding
    ].filter(r => r.confidence > 0.7);
  }
}
```

---

## 4. Enhanced AI Pattern Recognition

Make the AI truly generic by training on SNES hardware patterns.

### Hardware-Aware AI Tasks:
- [ ] Create training dataset from SNES hardware constraints
- [ ] Train model on valid 65816 opcodes
- [ ] Add BRR compression ratio validation
- [ ] Train on SNES color format patterns
- [ ] Add DMA transfer pattern recognition
- [ ] Implement hardware register access patterns
- [ ] Create confidence threshold system
- [ ] Add model versioning system

### Implementation:
```typescript
class SNESAwareAI {
  classifyData(data: Uint8Array): Classification {
    // Train on SNES hardware constraints
    // - Valid opcodes for 65816
    // - Valid BRR compression ratios
    // - SNES color format patterns
    // - DMA transfer patterns
  }
}
```

---

## 5. Plugin Architecture for Extensibility

Allow users to add game-specific support without modifying core.

### Plugin System Tasks:
- [ ] Design plugin interface specification
- [ ] Create plugin loader/manager
- [ ] Implement plugin discovery mechanism
- [ ] Add plugin configuration system
- [ ] Create plugin API documentation
- [ ] Implement plugin sandboxing for safety
- [ ] Add plugin versioning support
- [ ] Create example plugin template
- [ ] Build plugin testing framework

### Implementation:
```typescript
interface ExtractionPlugin {
  name: string;
  detectGame(rom: ROMInfo): boolean;
  enhanceExtraction?(extractor: AssetExtractor): void;
  provideMetadata?(): GameMetadata;
}

// Users can add plugins for specific games
class PluginManager {
  register(plugin: ExtractionPlugin): void;
  enhance(extractor: AssetExtractor, rom: ROMInfo): void;
}
```

---

## 6. Better Format Export Options

Focus on universal formats that any tool can use.

### Export Format Tasks:
- [ ] **Graphics Export:**
  - [ ] PNG export with metadata
  - [ ] BMP export option
  - [ ] Metadata sidecar files (JSON)
  - [ ] Batch export capabilities
- [ ] **Audio Export:**
  - [ ] WAV export implementation
  - [ ] FLAC export option
  - [ ] Loop point cue sheet generation
  - [ ] Sample rate conversion options
- [ ] **Palette Export:**
  - [ ] ACO format (Adobe Color)
  - [ ] PAL format (JASC)
  - [ ] GPL format (GIMP)
  - [ ] ASE format (Aseprite)
- [ ] **Tilemap Export:**
  - [ ] TMX format (Tiled)
  - [ ] JSON with standard schema
  - [ ] CSV for spreadsheet import

---

## 7. Statistical Analysis Tools

Help users understand unknown ROMs through data analysis.

### Analysis Tasks:
- [ ] Implement 65816 opcode distribution analysis
- [ ] Create entropy mapping visualization
- [ ] Add potential asset region detection
- [ ] Implement compression hint detection
- [ ] Create bank usage analysis
- [ ] Add code density analysis
- [ ] Implement jump/branch target analysis
- [ ] Create data reference tracking
- [ ] Add statistical report generation

### Implementation:
```typescript
class ROMAnalyzer {
  generateReport(rom: Uint8Array): AnalysisReport {
    return {
      opcodeDistribution: this.analyze65816Opcodes(rom),
      entropyMap: this.calculateEntropy(rom),
      potentialAssets: this.findAssetRegions(rom),
      compressionHints: this.detectCompression(rom),
      bankUsage: this.analyzeBankUsage(rom)
    };
  }
}
```

---

## 8. Improved Memory Mapping Detection

Automatically detect ROM layout without game knowledge.

### Memory Mapping Tasks:
- [ ] Implement vector location analysis
- [ ] Add bank mirroring pattern detection
- [ ] Create code vs data distribution analysis
- [ ] Implement jump/branch target mapping
- [ ] Add memory region classification
- [ ] Create confidence scoring for mappings
- [ ] Implement multiple mapping hypothesis testing
- [ ] Add mapping validation system

### Implementation:
```typescript
class MemoryMapDetector {
  detectMapping(rom: Uint8Array): MemoryMap {
    // Analyze:
    // - Vector locations
    // - Bank mirroring patterns  
    // - Code vs data distribution
    // - Jump/branch targets
    return bestGuessMap;
  }
}
```

---

## 📊 Implementation Priority & Timeline

### Phase 1: Foundation (Weeks 1-4)
- [ ] Compression Support (RLE, LZ77)
- [ ] Basic Plugin Architecture
- [ ] Entropy-based boundary detection

### Phase 2: Core Features (Weeks 5-8)
- [ ] Universal pattern recognition
- [ ] Multi-encoding text support
- [ ] PNG/WAV export

### Phase 3: Advanced Features (Weeks 9-12)
- [ ] Statistical analysis tools
- [ ] Memory mapping detection
- [ ] Additional compression formats

### Phase 4: Polish & Integration (Weeks 13-16)
- [ ] AI enhancement integration
- [ ] Complete plugin system
- [ ] Documentation & examples

---

## 🎯 Success Metrics

- [ ] Successfully extract assets from 50+ different SNES games
- [ ] Zero game-specific code in core library
- [ ] Plugin system with 5+ community plugins
- [ ] Compression support for 90%+ of games
- [ ] Export formats compatible with major tools
- [ ] Performance: Process 4MB ROM in < 30 seconds
- [ ] Memory usage: < 500MB for largest ROMs

---

## 📝 Notes

- All features should work without prior knowledge of the ROM
- Prioritize SNES hardware patterns over game-specific patterns
- Maintain backwards compatibility with existing CLI
- Focus on correctness over speed in initial implementations
- Create comprehensive test suite with diverse ROM samples

---

*Last Updated: July 27, 2025*  
*Status: Planning Phase*
