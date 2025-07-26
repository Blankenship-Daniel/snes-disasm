# Disassembly Validation Command

Validate disassembly output accuracy using all SNES MCP servers as reference sources. This command helps ensure our disassembler produces correct and consistent results.

## Validation Methodology:

### 1. Instruction Accuracy Validation
- Use **snes-mcp-server** to verify:
  - Correct instruction identification
  - Proper addressing mode detection
  - Accurate operand interpretation
  - Flag effect documentation

### 2. Implementation Consistency Check
- Use **snes9x** to validate:
  - Instruction decoding logic
  - Cycle timing accuracy
  - Edge case handling
  - Processor state tracking

### 3. Hardware Behavior Verification
- Use **snes-mister** to confirm:
  - Hardware-accurate timing
  - Real hardware quirks
  - Cycle-perfect behavior
  - Timing edge cases

### 4. Real-World Code Validation
- Use **zelda3** to test against:
  - Known disassembled code
  - Complex instruction sequences
  - Real game patterns
  - Advanced techniques

## Validation Categories:

### Basic Instruction Disassembly
- Single instruction accuracy
- Operand formatting
- Address calculation
- Mnemonic correctness

### Complex Sequences
- Multi-instruction patterns
- Branch target resolution
- Data vs code detection
- Function boundary identification

### Processor State Tracking
- M/X flag handling
- REP/SEP instruction effects
- Mode transitions
- Flag propagation

### Memory Addressing
- Address mode interpretation
- Bank calculations
- Offset computations
- Long address handling

## Validation Template:

For validation request: {VALIDATION_TARGET}

Please perform comprehensive validation:

1. **Cross-reference with snes-mcp-server** for specification compliance
2. **Compare with snes9x implementation** for consistency
3. **Verify against snes-mister** for hardware accuracy
4. **Test against zelda3 patterns** for real-world validation
5. **Identify discrepancies** and explain differences
6. **Provide correction recommendations** if needed

## Specific Validation Tests:

### Instruction Set Coverage
- Verify all 256 opcodes are handled
- Check addressing mode completeness
- Validate cycle timing accuracy
- Confirm flag behavior correctness

### Memory Mapping Accuracy
- Test ROM offset calculations
- Verify bank boundary handling
- Check cartridge type detection
- Validate special chip support

### Analysis Quality
- Function detection accuracy
- Data identification correctness
- Branch target resolution
- Cross-reference completeness

### Output Format Validation
- Assembly syntax correctness
- Symbol table accuracy
- Comment generation quality
- Cross-platform compatibility

## Expected Deliverables:

1. **Validation report** with pass/fail status
2. **Discrepancy analysis** with explanations
3. **Correction recommendations** with specific fixes
4. **Test case suggestions** for future validation
5. **Reference comparisons** showing expected vs actual output

---

Please validate: {VALIDATION_TARGET}