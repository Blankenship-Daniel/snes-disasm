# API Documentation for Extensibility

This document covers the SNES Disassembler's comprehensive API and extensibility options, enabling developers to integrate, extend, and customize the disassembler for specific needs.

## Core API Classes

### SNESDisassembler

The main disassembler class that provides the primary interface for ROM analysis.

#### Constructor
```typescript
constructor(romPath: string, options: DisassemblerOptions = {})
```

**Parameters:**
- `romPath`: Path to the SNES ROM file
- `options`: Configuration options
  - `labels?: Map<number, string>` - Custom labels
  - `comments?: Map<number, string>` - Custom comments
  - `enableValidation?: boolean` - Enable instruction validation (default: true)
  - `enhanceComments?: boolean` - Add enhanced comments (default: true)

#### Methods

##### `getRomInfo(): SNESRom`
Returns comprehensive ROM information including header data and cartridge details.

##### `disassemble(startAddress?: number, endAddress?: number): DisassemblyLine[]`
Disassembles the ROM within the specified address range.

**Parameters:**
- `startAddress`: Starting address (defaults to reset vector)
- `endAddress`: Ending address (defaults to startAddress + 4KB)

**Returns:** Array of `DisassemblyLine` objects

##### `disassembleFunction(startAddress: number, maxInstructions?: number): DisassemblyLine[]`
Disassembles a single function starting at the given address.

### RomParser

Provides ROM file parsing and cartridge analysis capabilities.

#### Static Methods

##### `parse(romPath: string): SNESRom`
Parses a ROM file and extracts all metadata and content.

##### `getRomOffset(address: number, cartridgeInfo: CartridgeInfo): number`
Converts a CPU address to ROM file offset based on mapping mode.

### AssetExtractor

Extracts graphics, audio, and text assets from ROM data.

#### GraphicsExtractor

##### `extractTiles(data: Uint8Array, format: GraphicsFormat, startAddress?: number, count?: number, aiRecognizer?: AIPatternRecognizer): Promise<Tile[]>`

Extracts tile graphics from VRAM data.

**Parameters:**
- `data`: Raw graphics data
- `format`: Graphics format ('2bpp', '4bpp', '8bpp')
- `startAddress`: Starting address in ROM
- `count`: Number of tiles to extract
- `aiRecognizer`: Optional AI classifier

##### `extractSprites(oamData: Uint8Array, chrData: Uint8Array, startAddress?: number): Sprite[]`

Extracts sprite definitions from OAM and CHR data.

#### AudioExtractor

##### `extractBRRSamples(data: Uint8Array, startAddress?: number): Promise<BRRSample[]>`

Extracts BRR audio samples from ROM data.

##### `extractMusicSequences(data: Uint8Array, startAddress?: number): Promise<MusicSequence[]>`

Extracts music sequence data.

#### TextExtractor

##### `extractStrings(data: Uint8Array, encoding?: TextEncoding, minLength?: number): PromisecTextString[]e`

Extracts text strings with encoding detection.

### AIPatternRecognizer

Provides AI-powered pattern recognition for enhanced asset classification.

#### Methods

##### `classifyGraphicsData(data: Uint8Array, format: GraphicsFormat): PromisecGraphicsClassificatione`

Classifies graphics data using computer vision models.

##### `classifyAudioData(data: Uint8Array): PromisecAudioClassificatione`

Classifies audio data and detects compression algorithms.

##### `classifyTextData(data: Uint8Array): PromisecTextClassificatione`

Classifies text data and detects encoding and language patterns.

### SymbolManager

Manages symbol tables, labels, and cross-references.

#### Methods

##### `addSymbol(address: number, name: string, type: SymbolType): SymbolValidationResult`

Adds a new symbol with validation.

##### `loadSymbolFile(filePath: string): BulkOperationResult`

Loads symbols from external files (.sym, .mlb, .json, .csv).

##### `generateCrossReferences(disassembly: DisassemblyLine[]): CrossReference[]`

Generates cross-references between code sections.

### OutputFormatters

Provides multiple output format support with extensible architecture.

#### Available Formatters

- **CA65Formatter**: CA65 assembler format
- **WLADXFormatter**: WLA-DX assembler format
- **BassFormatter**: bass assembler format
- **HTMLFormatter**: HTML with syntax highlighting
- **JSONFormatter**: Structured JSON data
- **XMLFormatter**: XML format
- **CSVFormatter**: Comma-separated values
- **MarkdownFormatter**: Documentation format

#### Usage

```typescript
const formatter = ExtendedOutputFormatterFactory.createFormatter('html', options);
const output = formatter.format(disassemblyLines, symbols, crossRefs);
```

### ValidationEngine

Provides SNES-specific validation and enhancement capabilities.

#### Methods

##### `validateDisassembly(lines: DisassemblyLine[]): ValidationResult`

Validates entire disassembly against SNES reference data.

##### `validateInstruction(mnemonic: string, addressingMode: string): boolean`

Validates individual instructions.

##### `enhanceWithReferenceData(line: DisassemblyLine): DisassemblyLine`

Enhances disassembly lines with reference comments and metadata.

## MCP Integration

### Available MCP Tools

#### `callMCPTool(toolName: string, options: MCPToolOptions): Promisecanye`

Interface for calling MCP server tools.

**Available Tools:**
- `extract_code`: Enhanced code extraction
- `extract_graphics`: Graphics analysis
- `extract_audio`: Audio processing
- `extract_text`: Text mining
- `analyze_patterns`: Pattern recognition
- `hardware_info`: Hardware-specific analysis

### MCP Server Integration

#### SNES MCP Server
```typescript
import { callMCPTool } from './mcp-integration';

const result = await callMCPTool('hardware_info', {
  chip: 'ppu',
  topic: 'registers'
});
```
#### Zelda3 MCP Server
```typescript
const patterns = await callMCPTool('analyze_game_components', {
  component: 'sprite'
});
```

## Extending with MCP

Integrate with various Model Context Protocol (MCP) servers for more extensive analysis:

- **snes-mcp-server**: SNES hardware architecture integration.
- **zelda3**: Use this server for Zelda-specific analysis.
- **snes9x**: Leverage SNES emulator context.
- **snes-mister**: FPGA implementation insights.

## Example Usage

```javascript
const disassembler = require('snes-disassembler');

// Disassemble a ROM
let disassembly = disassembler.disassembleROM('/path/to/rom.smc', {
  outputFormat: 'json',
  symbols: '/path/to/symbols.sym',
});

// Perform an analysis
let analysisReport = disassembler.analyzeCode(disassembly, {
  fullAnalysis: true,
  qualityReport: true,
});

// Integrate an MCP server
let mcpIntegration = disassembler.integrateMCPServer('snes-mcp-server', {
  customConfig: '/path/to/config.json',
});
```

## Conclusion

Utilize the API to extend the functionality and integrate custom analysis workflows, providing a versatile and powerful tool for SNES disassembly and analysis.
