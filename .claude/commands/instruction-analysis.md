# 65816 Instruction Analysis Command

Perform comprehensive analysis of 65816 instructions using all available SNES MCP servers. This command is specifically designed for deep-dive instruction research and validation.

## Analysis Workflow:

### 1. Instruction Specification Research
- Query **snes-mcp-server** for official instruction details:
  - Opcode values and variants
  - Addressing modes
  - Flag effects
  - Cycle timing
  - Official documentation

### 2. Implementation Analysis
- Query **snes9x** for emulation implementation:
  - How the instruction is decoded
  - Execution logic
  - Timing implementation
  - Edge case handling

### 3. Hardware Validation
- Query **snes-mister** for FPGA implementation:
  - Hardware-accurate behavior
  - Cycle-perfect timing
  - Real hardware quirks
  - Timing variations

### 4. Real-World Usage
- Query **zelda3** for practical examples:
  - How the instruction is used in actual games
  - Common patterns and contexts
  - Performance considerations
  - Optimization techniques

## Research Template:

For the instruction(s): {INSTRUCTION}

Please provide:

1. **Complete specification** from snes-mcp-server
2. **Implementation details** from snes9x
3. **Hardware behavior** from snes-mister  
4. **Usage examples** from zelda3
5. **Cross-reference validation** between all sources
6. **Implementation recommendations** for our disassembler

## Specific Areas to Cover:

### Instruction Variants
- All addressing modes for the instruction
- Opcode values and encoding
- Parameter formats and sizes

### Timing Analysis
- Base cycle counts
- Page boundary penalties
- 16-bit mode variations
- Memory wait states

### Flag Behavior
- Which flags are affected
- How flags are calculated
- Special flag interactions
- Mode-dependent behavior

### Edge Cases
- Boundary conditions
- Error handling
- Undefined behavior
- Hardware quirks

### Optimization Opportunities
- Common usage patterns
- Performance considerations
- Disassembly challenges
- Analysis improvements

---

Please analyze: {INSTRUCTION}