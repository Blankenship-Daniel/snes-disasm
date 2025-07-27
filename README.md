# SNES Disassembler

A powerful Super Nintendo (SNES) ROM disassembler with AI-enhanced analysis capabilities for 65816 assembly code.

## Features

- 🎮 **Complete SNES ROM Support** - Handles .smc, .sfc, and .fig ROM formats
- 🔧 **Multiple Output Formats** - CA65, WLA-DX, BASS, HTML, JSON, XML, CSV, and Markdown
- 🚀 **Enhanced Disassembly** - AI-powered pattern recognition and MCP server insights
- 🎨 **Asset Extraction** - Graphics, audio, and text extraction from ROMs
- 📊 **Advanced Analysis** - Function detection, data structure recognition, and quality reports
- 🎵 **BRR Audio Support** - Decode SNES BRR audio files to WAV format
- 💻 **Interactive CLI** - User-friendly interactive interface with session management
- 🛠️ **Non-Interactive Mode** - Perfect for automation and CI/CD pipelines
- 🏦 **Bank-Aware Addressing** - Full 24-bit addressing support
- 📝 **Comprehensive Documentation** - Auto-generated docs for discovered functions

## Installation

### Quick Start (Global Installation)

```bash
# Clone the repository
git clone https://github.com/your-username/snes-disassembler.git
cd snes-disassembler

# Install dependencies and build
npm install
npm run build

# Install globally
npm run install-global
```

After installation, you can use `snes-disasm` from anywhere:

```bash
snes-disasm --help
```

### Local Development Installation

```bash
# Install for local development
npm install
npm run build

# Run locally
npm run cli
```

## Usage

### Interactive Mode

Launch the interactive CLI for guided disassembly:

```bash
snes-disasm interactive
# or
snes-disasm --interactive
# or
snes-disasm i
```

### Non-Interactive Mode

Perfect for automation and scripting:

```bash
# Basic disassembly
snes-disasm /path/to/rom.sfc --format ca65 --output-dir ./output

# Advanced analysis with enhanced features
snes-disasm rom.sfc \
  --format html \
  --analysis \
  --enhanced-disasm \
  --bank-aware \
  --detect-functions \
  --generate-docs \
  --output-dir ./analysis

# Extract assets
snes-disasm rom.sfc \
  --extract-assets \
  --asset-types graphics,audio,text \
  --output-dir ./assets

# BRR audio decoding
snes-disasm --decode-brr audio.brr --brr-output music.wav --brr-sample-rate 32000
```

### Command Line Options

```
Usage: snes-disasm [options] [command] [rom-file]

Arguments:
  rom-file                               SNES ROM file to disassemble

Options:
  -V, --version                          output the version number
  -o, --output <file>                    Output file (default: <rom-name>.<ext>)
  -d, --output-dir <directory>           Output directory
  -f, --format <format>                  Output format: ca65, wla-dx, bass, html, json, xml, csv, markdown
  -s, --start <address>                  Start address (hex, e.g., 8000)
  -e, --end <address>                    End address (hex, e.g., FFFF)
  --symbols <file>                       Load symbol file (.sym, .mlb, .json, .csv)
  --analysis                             Enable full analysis
  --quality                              Generate code quality report
  -v, --verbose                          Verbose output
  --labels <file>                        Load custom labels file
  --comments <file>                      Load custom comments file
  --extract-assets                       Extract assets from ROM
  --asset-types <types>                  Asset types: graphics,audio,text
  --enhanced-disasm                      Use enhanced algorithms with MCP insights
  --bank-aware                           Enable 24-bit addressing
  --detect-functions                     Automatic function detection
  --generate-docs                        Generate documentation
  --decode-brr <file>                    Decode BRR audio to WAV
  -i, --interactive                      Run in interactive mode

Commands:
  interactive|i                          Run interactive CLI
  brr-to-spc <input-dir> <output-spc>    Convert BRR files to SPC format
  set-output-dir <directory>             Set global output directory
  clear-output-dir                       Clear global output directory
  show-output-dir                        Show current output directory
  preferences|prefs                      Configure user preferences
  show-preferences                       Display current preferences
```

## Output Formats

| Format | Description | Use Case |
|--------|-------------|----------|
| `ca65` | CA65 Assembly | Compatible with cc65 assembler |
| `wla-dx` | WLA-DX Assembly | Compatible with WLA-DX assembler |
| `bass` | BASS Assembly | Compatible with BASS assembler |
| `html` | HTML Report | Interactive web documentation |
| `json` | JSON Data | Machine-readable format |
| `xml` | XML Data | Structured data format |
| `csv` | CSV Data | Spreadsheet-compatible |
| `markdown` | Markdown | Human-readable documentation |

## Advanced Features

### Enhanced Disassembly Engine

The enhanced disassembly engine provides:
- **AI Pattern Recognition** - Identifies game-specific patterns and structures
- **MCP Server Integration** - Leverages external analysis servers
- **Control Flow Analysis** - Tracks program flow and dependencies
- **Function Detection** - Automatically identifies and labels functions
- **Data Structure Recognition** - Detects tables, arrays, and data patterns

### Asset Extraction

Extract various asset types from SNES ROMs:
- **Graphics**: Sprites, backgrounds, tiles (2bpp, 4bpp, 8bpp)
- **Audio**: Music, sound effects, BRR samples
- **Text**: Dialogue, strings, compressed text

### BRR Audio Processing

SNES uses BRR (Bit Rate Reduction) for audio compression:
- Decode BRR files to standard WAV format
- Support for looping samples
- Configurable sample rates
- Batch processing capabilities

## Examples

### Basic ROM Disassembly

```bash
# Disassemble to CA65 format
snes-disasm chrono_trigger.sfc --format ca65 --output-dir ./ct_disasm

# Generate HTML report with analysis
snes-disasm super_metroid.sfc --format html --analysis --output-dir ./sm_analysis
```

### Advanced Analysis

```bash
# Full analysis with all features
snes-disasm zelda_alttp.sfc \
  --enhanced-disasm \
  --bank-aware \
  --detect-functions \
  --generate-docs \
  --analysis \
  --quality \
  --format html \
  --output-dir ./zelda_full_analysis
```

### Asset Extraction

```bash
# Extract all assets
snes-disasm final_fantasy_6.sfc \
  --extract-assets \
  --asset-types graphics,audio,text \
  --output-dir ./ff6_assets

# Extract only graphics
snes-disasm mario_world.sfc \
  --extract-assets \
  --asset-types graphics \
  --asset-formats 4bpp,8bpp \
  --output-dir ./mario_graphics
```

### Session Management

```bash
# Set global output directory
snes-disasm set-output-dir ~/rom_analysis

# Configure preferences
snes-disasm preferences

# Show current settings
snes-disasm show-preferences
```

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Type checking
npm run type-check

# Generate documentation
npm run docs:generate
```

### Available Scripts

- `npm run build` - Build the project
- `npm run build:watch` - Build with file watching
- `npm run dev` - Run in development mode
- `npm test` - Run tests
- `npm run test:watch` - Run tests with watching
- `npm run test:coverage` - Generate test coverage
- `npm run lint` - Lint and fix code
- `npm run format` - Format code with Prettier
- `npm run cli` - Run the CLI locally
- `npm run interactive` - Run interactive mode locally
- `npm run install-global` - Build and install globally

### Project Structure

```
src/
├── cli.ts                 # Main CLI interface
├── disassembler.ts        # Core disassembler engine
├── validation-engine.ts   # SNES reference validation
├── enhanced-disassembly-engine.ts  # AI-enhanced features
├── output-formats/        # Output format handlers
├── asset-handler.ts       # Asset extraction
├── brr-decoder.ts         # BRR audio processing
├── cli/                   # CLI utilities
│   ├── session-manager.ts
│   ├── preferences-manager.ts
│   └── help-system.ts
└── utils/                 # Shared utilities
```

## Technical Details

### Supported ROM Formats
- **SMC**: Super Magicom format with 512-byte header
- **SFC**: Super Famicom format (headerless)
- **FIG**: Super Fighter format

### 65816 CPU Support
- Full 65816 instruction set
- 8-bit and 16-bit modes
- Direct page addressing
- Bank switching
- Interrupt vectors

### Memory Mapping
- LoROM and HiROM detection
- FastROM support
- SRAM mapping
- Special chip detection (DSP, SA-1, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- SNES development community for comprehensive documentation
- 65816 instruction set references
- BRR audio format specifications
- Contributors and testers

## Support

- 📖 **Documentation**: Check the `docs/` directory after running `npm run docs:generate`
- 🐛 **Issues**: Report bugs on GitHub Issues
- 💬 **Discussions**: Join GitHub Discussions for questions and ideas
- 📧 **Contact**: Reach out for collaboration opportunities

---

**Happy Disassembling!** 🎮✨
