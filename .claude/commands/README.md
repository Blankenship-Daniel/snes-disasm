# SNES Disassembler Claude Commands

This directory contains specialized Claude commands for the SNES disassembler project. These commands leverage multiple SNES-related MCP servers to provide comprehensive, well-researched responses.

## Available Commands

### `/snes-research`
**Purpose**: General SNES research using all available MCP servers
**Use for**: Broad research topics, cross-referencing multiple sources, comprehensive analysis
**Example**: `/snes-research How does bank switching work in HiROM cartridges?`

### `/instruction-analysis`
**Purpose**: Deep analysis of specific 65816 instructions
**Use for**: Instruction implementation, cycle timing research, addressing mode details
**Example**: `/instruction-analysis LDA instruction with all addressing modes`

### `/memory-mapping-research`
**Purpose**: Memory mapping and cartridge research
**Use for**: ROM format analysis, memory layout understanding, special chip research
**Example**: `/memory-mapping-research SA-1 cartridge memory mapping`

### `/disassembly-validation`
**Purpose**: Validate disassembler output against reference implementations
**Use for**: Testing accuracy, finding bugs, ensuring correctness
**Example**: `/disassembly-validation Reset vector disassembly for A Link to the Past`

### `/implementation-guidance`
**Purpose**: Get detailed implementation guidance for specific features
**Use for**: Technical implementation details, algorithm design, best practices
**Example**: `/implementation-guidance Cycle-accurate timing implementation`

## Available MCP Servers

### snes-mcp-server
- Official SNES architecture documentation
- 65816 processor specifications
- Hardware register details
- Memory mapping documentation

### snes9x MCP Server
- Reference emulator implementation
- Instruction decoding logic
- Memory mapping algorithms
- Performance optimizations

### snes-mister MCP Server
- FPGA hardware implementation
- Cycle-perfect timing
- Hardware-accurate behavior
- Real hardware quirks

### zelda3 MCP Server
- Reverse-engineered game code
- Real-world programming patterns
- Code organization examples
- Practical implementation techniques

## Usage Guidelines

1. **Choose the right command** for your specific need
2. **Be specific** in your requests for better results
3. **Cross-reference** information when working on critical features
4. **Use multiple commands** for complex topics that span multiple areas
5. **Validate results** against multiple sources when implementing

## Command Workflow Examples

### Implementing a New Instruction
1. Use `/instruction-analysis [instruction]` for complete specification
2. Use `/implementation-guidance instruction decoding for [instruction]` for implementation details
3. Use `/disassembly-validation [instruction] disassembly` to test accuracy

### Adding Cartridge Support
1. Use `/memory-mapping-research [cartridge type]` for specifications
2. Use `/implementation-guidance [cartridge type] detection and mapping` for implementation
3. Use `/disassembly-validation [cartridge type] ROM analysis` for testing

### Performance Optimization
1. Use `/snes-research SNES timing and performance considerations`
2. Use `/implementation-guidance performance optimization techniques`
3. Use reference implementations for benchmark comparisons

## Best Practices

- Always cite sources when presenting findings
- Cross-validate critical information across multiple servers
- Document any discrepancies found between sources
- Include practical examples in implementation guidance
- Test recommendations against real ROM files

## Contributing

When adding new commands:
1. Follow the established template format
2. Include all four MCP servers in research methodology
3. Provide clear usage examples
4. Document expected outputs
5. Test commands with real scenarios