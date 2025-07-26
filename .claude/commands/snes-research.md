# SNES Research Command

Use all available SNES-related MCP servers to research and provide comprehensive information about the given request. This command leverages multiple authoritative sources to ensure accuracy and completeness.

## Available SNES MCP Servers:

### 1. snes-mcp-server
**Purpose**: Original Super Nintendo architecture documentation and 65816 assembly reference
**Use for**: Authoritative information on 65816 instruction set, addressing modes, SNES hardware specifications, memory layout, hardware registers

### 2. snes9x MCP Server  
**Purpose**: Reference implementation of a Super Nintendo emulator
**Use for**: Understanding how SNES ROMs are loaded, how the 65816 CPU is emulated, instruction execution patterns, memory mapping implementations

### 3. zelda3 MCP Server
**Purpose**: Reverse-engineered implementation of The Legend of Zelda: A Link to the Past  
**Use for**: Real-world example of disassembled and analyzed SNES code, code organization patterns, common SNES programming techniques, data structures

### 4. snes-mister MCP Server
**Purpose**: FPGA implementation of original SNES hardware
**Use for**: Understanding hardware-level implementation details, timing requirements, cycle-perfect emulation, memory timing, hardware accuracy

## Instructions:

When responding to the user's request, please:

1. **Query all relevant SNES MCP servers** based on the nature of the request
2. **Cross-reference information** between servers to ensure accuracy
3. **Identify any conflicts or discrepancies** between sources and explain them
4. **Provide comprehensive coverage** by combining insights from multiple sources
5. **Cite specific sources** when presenting information (e.g., "According to snes-mcp-server..." or "SNES9x implementation shows...")
6. **Include practical examples** when available from the reference implementations

## Research Categories:

### Hardware & Architecture
- Use **snes-mcp-server** for official specifications
- Use **snes9x** for implementation details and edge cases
- Use **snes-mister** for FPGA hardware accuracy and timing
- Cross-reference timing and behavior between sources

### Instruction Set & Assembly
- Use **snes-mcp-server** for complete instruction reference
- Use **snes9x** for implementation specifics and cycle timing
- Use **snes-mister** for hardware-accurate timing behavior
- Use **zelda3** for real-world usage patterns

### Memory Mapping & Cartridges
- Use **snes-mcp-server** for memory map specifications
- Use **snes9x** for mapper implementation details
- Use **snes-mister** for hardware-level memory timing
- Use **zelda3** for practical memory usage examples

### Code Patterns & Techniques
- Use **zelda3** for reverse-engineered code examples
- Use **snes9x** for emulation accuracy requirements
- Use **snes-mister** for hardware behavior validation
- Use **snes-mcp-server** for hardware constraints and capabilities

### Timing & Performance
- Use **snes-mister** for cycle-perfect hardware timing
- Use **snes9x** for practical emulation timing
- Use **snes-mcp-server** for theoretical timing specifications
- Cross-validate timing across all sources

## User Request:
{REQUEST}

---

Please research the above request using all relevant SNES MCP servers and provide a comprehensive, well-sourced response that leverages the unique strengths of each server.