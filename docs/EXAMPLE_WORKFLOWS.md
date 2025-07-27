# Example Workflows and Use Cases

This document provides example workflows and use cases to demonstrate how to effectively utilize the SNES Disassembler with its various features.

## Basic Disassembly

To perform a basic SNES ROM disassembly:

```bash
snes-disasm zelda.smc --verbose
```

### Use Case: Full Game Disassembly
- Disassemble the entire game to understand game logic.
- Capture all instructions including metadata about the ROM structure.

## AI-powered Documentation

Perform an analysis with automatic documentation generation:

```bash
snes-disasm zelda.smc --auto-document --pattern-match --output-dir ai-analysis
```

### Use Case: Enhanced Code Insight
- Gain deep insight into code structure and logic using pattern recognition and AI-generated documentation.

## Extracting and Analyzing Assets

To extract graphics, audio, and text from the ROM:

```bash
snes-disasm zelda.smc --extract-assets --asset-types graphics,audio,text --output-dir assets
```

### Use Case: Asset Analysis and Modding
- Extract all graphics and sound for analysis.
- Use extracted data for asset modding and game enhancements.

## Performance Benchmarking

To analyze performance metrics while disassembling:

```bash
snes-disasm zelda.smc --benchmark --comparison reference-output --output-dir benchmarks
```

### Use Case: Optimization
- Compare current implementation with reference disassemblies to optimize performance.

## Integrating with MCP Servers

To use additional context and analysis from MCP servers:

```bash
snes-disasm zelda.smc --mcp-servers snes,zelda3 --ai-config ai-config.json
```

### Use Case: Advanced Contextual Analysis
- Leverage MCP servers to enhance ROM analysis by utilizing specific game and hardware contexts.

## Custom Symbol Integration

Integrate custom symbols for detailed analysis:

```bash
snes-disasm zelda.smc --symbols custom-symbols.sym --analysis --output-dir custom-analysis
```

### Use Case: Detailed Symbol Mapping
- Use predefined symbols to enhance the readability and context mapping of disassembled code.
