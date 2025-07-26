# Memory Mapping Research Command

Comprehensive research on SNES memory mapping using all available MCP servers. Use this command to understand memory layout, cartridge types, and mapping implementations.

## Research Methodology:

### 1. Official Specifications
- Query **snes-mcp-server** for:
  - Memory map documentation
  - Bank organization
  - Address decoding rules
  - Hardware register layouts

### 2. Emulation Implementation
- Query **snes9x** for:
  - Memory mapping algorithms
  - Cartridge detection logic
  - ROM offset calculations
  - Special chip handling

### 3. Hardware Implementation
- Query **snes-mister** for:
  - FPGA memory controller logic
  - Hardware-accurate timing
  - Real cartridge behavior
  - Edge case handling

### 4. Practical Examples
- Query **zelda3** for:
  - Real-world memory usage
  - Bank switching patterns
  - Data organization
  - Performance implications

## Memory Research Areas:

### Basic Memory Layout
- System RAM organization
- ROM bank structure
- I/O register mapping
- Special memory regions

### Cartridge Types
- LoROM vs HiROM differences
- ExLoROM and ExHiROM variants
- Special chip cartridges
- Detection algorithms

### Address Translation
- Virtual to physical mapping
- Bank wrapping behavior
- Mirror regions
- Access timing

### Special Cases
- SA-1 memory layout
- SuperFX mapping
- DSP chip access
- Expansion cartridges

## Analysis Template:

For memory topic: {MEMORY_TOPIC}

Please research and provide:

1. **Official specification** from snes-mcp-server
2. **Implementation approach** from snes9x
3. **Hardware behavior** from snes-mister
4. **Real usage examples** from zelda3
5. **Comparative analysis** between sources
6. **Implementation guidance** for our disassembler

## Specific Focus Areas:

### ROM Offset Calculation
- Address to ROM offset algorithms
- Bank boundary handling
- Cartridge type considerations
- Error conditions

### Cartridge Detection
- Header analysis methods
- Scoring algorithms
- Validation techniques
- Edge case handling

### Memory Access Patterns
- Read/write behavior
- Timing considerations
- Hardware limitations
- Performance implications

### Special Chip Integration
- Memory map modifications
- Access redirection
- Timing changes
- Detection methods

---

Please research: {MEMORY_TOPIC}