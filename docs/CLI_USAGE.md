# SNES Disassembler CLI Usage

The SNES Disassembler provides a powerful command-line interface for disassembling Super Nintendo ROM files.

## Installation

### Local Development
```bash
# Build the project
npm run build

# Run CLI directly
npm run cli -- [options] <rom-file>
```

### Global Installation
```bash
# Install globally (after building)
npm run install-global

# Then use anywhere
snes-disasm [options] <rom-file>
```

## Basic Usage

```bash
# Basic disassembly
snes-disasm rom.smc

# Disassemble specific address range
snes-disasm rom.smc --start 8000 --end 9000

# Output to specific directory
snes-disasm rom.smc --output-dir disassembly

# Use different output format
snes-disasm rom.smc --format json --output-dir output
```

## Command Line Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output <file>` | `-o` | Output file name | `<rom-name>.<ext>` |
| `--output-dir <dir>` | `-d` | Output directory | Current directory |
| `--format <format>` | `-f` | Output format | `ca65` |
| `--start <address>` | `-s` | Start address (hex) | ROM start |
| `--end <address>` | `-e` | End address (hex) | ROM end |
| `--symbols <file>` | | Load symbol file | None |
| `--analysis` | | Enable full analysis | Disabled |
| `--quality` | | Generate quality report | Disabled |
| `--verbose` | `-v` | Verbose output | Disabled |
| `--labels <file>` | | Load custom labels | None |
| `--comments <file>` | | Load custom comments | None |
| `--extract-assets` | | Extract assets (graphics, audio, text) | Disabled |
| `--asset-types <types>` | | Asset types to extract | `graphics,audio,text` |
| `--asset-formats <formats>` | | Graphics formats to extract | `4bpp` |
| `--disable-ai` | | Disable AI pattern recognition | AI enabled |

## Output Formats

The disassembler supports multiple output formats:

- **ca65** - CA65 assembler format (default)
- **wla-dx** - WLA-DX assembler format
- **bass** - bass assembler format
- **html** - HTML with syntax highlighting
- **json** - JSON structured data
- **xml** - XML structured data
- **csv** - CSV tabular format
- **markdown** - Markdown documentation

## Examples

### Basic Disassembly
```bash
# Disassemble entire ROM
snes-disasm zelda.smc --verbose

# Output:
# 🎮 SNES Disassembler v1.0.0
# ================================
# 📁 ROM File: zelda.smc
# 📝 Output Format: ca65
# 📋 ROM Information:
#   Title: THE LEGEND OF ZELDA  
#   Size: 1048576 bytes
#   Type: LoROM
#   Has Battery: Yes
# 🔍 Disassembling...
# ✅ Disassembly completed in 245ms
# 📊 Instructions: 16384
# 💾 Output written to: zelda.asm
```

### Address Range Analysis
```bash
# Analyze reset vector and initialization code
snes-disasm game.smc --start 8000 --end 8200 --analysis --verbose

# Focus on specific function
snes-disasm game.smc --start A000 --end A0FF --format html --output-dir analysis
```

### Multiple Output Formats
```bash
# Generate multiple formats for comprehensive analysis
snes-disasm rom.smc --format ca65 --output-dir asm
snes-disasm rom.smc --format html --output-dir docs  
snes-disasm rom.smc --format json --output-dir data
```

### Advanced Analysis
```bash
# Full analysis with quality metrics
snes-disasm rom.smc --analysis --quality --verbose --output-dir full-analysis

# Custom output with symbols
snes-disasm rom.smc --symbols my-symbols.sym --analysis --output custom-disasm.asm

# AI-powered analysis with automatic documentation
snes-disasm rom.smc --auto-document --pattern-match --output-dir ai-analysis

# Performance benchmarking
snes-disasm rom.smc --benchmark --comparison reference-output --output-dir benchmarks

# MCP integration for enhanced analysis
snes-disasm rom.smc --mcp-servers snes,zelda3,snes9x --ai-config custom.json
```

## Output File Organization

When using `--output-dir`, the disassembler creates organized output:

```
output/
├── rom.asm              # Main disassembly
├── rom_quality.md       # Quality report (with --quality)
└── symbols/             # Symbol files (if generated)
```

## Advanced Features

### Analysis Mode (`--analysis`)
Enables comprehensive code analysis:
- Function boundary detection
- Control flow analysis  
- Data structure recognition
- Cross-reference generation
- Game-specific pattern recognition
- Macro detection

### Quality Reports (`--quality`)
Generates detailed code quality metrics:
- Cyclomatic complexity
- Code coverage analysis
- Potential bug detection
- Documentation coverage
- Hardware register usage

### Symbol Integration (`--symbols`)
Supports external symbol files:
- `.sym` files (standard format)
- `.mlb` files (emulator format)
- `.json` files (structured data)
- `.csv` files (spreadsheet format)

### AI Integration Features

#### Automatic Documentation (`--auto-document`)
Leverages AI to generate comprehensive documentation:
- Function purpose analysis
- Variable usage patterns
- Code flow explanations
- Game logic interpretation
- Hardware interaction documentation

#### Pattern Matching (`--pattern-match`)
Uses AI-powered pattern recognition:
- Common SNES programming patterns
- Game engine structures
- Audio/graphics routines
- Memory management patterns
- Optimization techniques

#### MCP Server Integration (`--mcp-servers`)
Connects to Model Context Protocol servers for enhanced analysis:
- **snes-mcp-server**: SNES hardware architecture context
- **zelda3**: A Link to the Past specific patterns
- **snes9x**: Emulator implementation insights
- **snes-mister**: FPGA implementation details

#### AI Configuration (`--ai-config`)
Customize AI behavior with configuration files:
```json
{
  "enablePatternMatching": true,
  "documentationStyle": "detailed",
  "mcpServers": ["snes", "zelda3"],
  "analysisDepth": "comprehensive",
  "outputLanguage": "english"
}
```

### Performance Analysis Features

#### Benchmarking (`--benchmark`)
Generates detailed performance metrics:
- Disassembly speed measurements
- Memory usage analysis
- Pattern recognition timing
- AI processing overhead
- Output generation performance

#### Comparison Analysis (`--comparison`)
Compares output against reference implementations:
- Accuracy measurements
- Coverage analysis
- Quality improvements
- Performance differences
- Feature completeness

## Tips and Best Practices

1. **Start Small**: Begin with small address ranges to understand the code structure
2. **Use Analysis**: Enable `--analysis` for better function detection and commenting
3. **Organize Output**: Use `--output-dir` to keep generated files organized
4. **Multiple Formats**: Generate both assembly and documentation formats
5. **Save Symbols**: Build up symbol files for reuse across analysis sessions

## Error Handling

The CLI provides clear error messages:
- Invalid ROM files
- Invalid address ranges
- Missing output directories (auto-created)
- Unsupported formats

Use `--verbose` for detailed progress information and debugging.