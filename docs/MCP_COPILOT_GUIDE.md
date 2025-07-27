# Using MCP Servers with GitHub Copilot in VS Code

## Overview

While MCP servers and GitHub Copilot don't directly integrate, you can use them together effectively in your SNES disassembler workflow.

## Workflow: MCP Research → Copilot Implementation

### Step 1: Research with MCP Servers (Claude)

Use your existing Claude commands to gather information:

```
/snes-research LDA instruction addressing modes and cycle timing
/instruction-analysis LDA with all addressing modes
/implementation-guidance LDA instruction decoding algorithm
```

### Step 2: Document Findings in Code

Use the VS Code snippets (type prefix + Tab):

- `snes-research` - Add research comment block
- `snes-instruction` - Document instruction details
- `snes-memory` - Document memory mapping
- `mcp-todo` - Mark areas needing research

### Step 3: Use GitHub Copilot for Implementation

With your MCP research documented in comments, Copilot can use that context:

```typescript
/**
 * Research: LDA instruction implementation
 * Sources: snes-mcp-server, snes9x
 * LDA supports 8 addressing modes, cycles vary from 2-6
 * M flag affects accumulator size (8-bit vs 16-bit)
 */
function decodeLDA(opcode: number, data: Uint8Array, offset: number) {
  // GitHub Copilot will now suggest implementation based on your research comments
}
```

## VS Code Tasks for Quick MCP Queries

Use **Cmd+Shift+P** → "Tasks: Run Task":

- **Query SNES MCP Server** - Direct queries to snes-mcp-server
- **Search SNES9x Implementation** - Search snes9x codebase
- **Analyze Zelda3 Code** - Find patterns in zelda3

## Best Practices

### 1. Research First, Implement Second

```typescript
// TODO: Research using MCP servers
// Query: How does REP instruction affect M and X flags?
// Servers: snes-mcp-server, snes9x
// Expected: Flag modification behavior and timing

// Implementation will go here after research
```

### 2. Document Sources in Comments

```typescript
// Instruction: $A9 - LDA Immediate
// Addressing Mode: Immediate
// Cycles: 2 (M=0), 2 (M=1)
// Flags: N, Z affected
// Source: snes-mcp-server
```

### 3. Use MCP for Validation

After implementing with Copilot, validate using:

```
/disassembly-validation LDA immediate mode implementation
```

## Example Workflow

1. **Start with research**:

   ```
   /instruction-analysis STA instruction with all addressing modes
   ```

2. **Document in code**:

   ```typescript
   /**
    * Research: STA instruction family
    * Sources: snes-mcp-server, snes9x
    * 8 addressing modes, store accumulator to memory
    * Cycles: 2-6 depending on mode, no flags affected
    */
   ```

3. **Let Copilot implement**:

   - Type function signature
   - Copilot suggests implementation based on comments

4. **Validate results**:
   ```
   /disassembly-validation STA instruction decoding accuracy
   ```

## Terminal Integration

Quick MCP queries from VS Code terminal:

```bash
# Research specific instruction
claude mcp snes-mcp-server lookup_instruction LDA

# Search implementation patterns
claude mcp snes9x search_code "LDA immediate"

# Find real-world usage
claude mcp zelda3 search_code "LDA"
```

This approach gives you the comprehensive research capabilities of MCP servers combined with the code generation power of GitHub Copilot.
