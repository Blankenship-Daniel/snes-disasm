# SNES Disassembler Project Context

This project is a Super Nintendo (SNES) ROM disassembler for the 65816 assembly language used by the SNES hardware.

## Project Overview

The SNES disassembler aims to:
- Parse SNES ROM files and disassemble 65816 machine code
- Generate human-readable assembly output with proper addressing modes
- Support labeling and commenting for better code analysis
- Provide accurate instruction timing and byte counts

## Reference Resources via MCP Servers

When working on this project, you have access to several MCP servers that provide valuable reference material:

### snes9x MCP Server
- **Purpose**: Reference implementation of a Super Nintendo emulator
- **Use for**: Understanding how SNES ROMs are loaded, how the 65816 CPU is emulated, and how instructions are executed
- **Key areas**: CPU emulation, memory mapping, instruction decoding

### zelda3 MCP Server  
- **Purpose**: Reverse-engineered implementation of The Legend of Zelda: A Link to the Past
- **Use for**: Real-world example of disassembled and analyzed SNES code
- **Key areas**: Code organization patterns, common SNES programming techniques, data structures

### snes-mcp-server MCP
- **Purpose**: Original Super Nintendo architecture documentation and 65816 assembly reference
- **Use for**: Authoritative information on 65816 instruction set, addressing modes, and SNES hardware specifications
- **Key areas**: Instruction opcodes, cycle timing, memory layout, hardware registers

### snes-mister MCP Server
- **Purpose**: FPGA implementation of original SNES hardware
- **Use for**: Understanding hardware-level implementation details and timing requirements
- **Key areas**: Hardware accuracy, cycle-perfect emulation, memory timing

## Development Guidelines

- Follow TypeScript best practices with strict typing
- Reference the MCP servers above when implementing instruction decoding
- Ensure accuracy by cross-referencing multiple sources
- Test against known SNES ROMs for validation
- Maintain compatibility with standard SNES ROM formats

## Build Commands

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Watch mode for development  
- `npm test` - Run test suite
- `npm run lint` - Check code style