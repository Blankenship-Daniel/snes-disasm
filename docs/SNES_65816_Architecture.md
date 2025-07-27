# SNES and 65816 Assembly Insights

## 65816 Instruction Set

The SNES 65816 assembly supports various categories of instructions:

- **Load/Store**: LDA, LDX, LDY, STA, STX, STY, STZ
- **Arithmetic**: ADC, SBC, INC, DEC, INX, INY, DEX, DEY
- **Logical**: AND, ORA, EOR, BIT, TSB, TRB
- **Shift/Rotate**: ASL, LSR, ROL, ROR
- **Compare**: CMP, CPX, CPY
- **Branch**: BCC, BCS, BEQ, BNE, BMI, BPL, BVC, BVS, BRA, BRL
- **Jump/Call**: JMP, JML, JSR, JSL, RTS, RTL, RTI

## SNES Memory Mapping

The SNES supports several memory mapping modes:

- **LoROM (Mode 20)**: ROM mapped to upper 32KB of each bank ($8000-$FFFF).
- **HiROM (Mode 21)**: ROM mapped to full 64KB banks.
- **ExHiROM (Mode 25)**: Extended HiROM for larger games.

## SNES Register Usage Patterns

- **Screen Setup**: Disable interrupts, switch to native mode, force blank, setup code, enable display.
- **VRAM Upload**: Set VRAM increment mode, address, write data.
- **DMA Transfer**: Configure and start DMA.

## Emulation and Disassembly Techniques

### Zelda3 Reverse Engineering
No specific disassembly patterns located in the zelda3 implementation.

### snes9x Insights
The SNES9x emulator provides detailed opcode handling for the 65C816 CPU emulation.

### SNES MiSTer FPGA Core
FPGA provides a cycle-accurate replica, with extensive entities like `P65C816` and `SPC700` for accurate hardware emulation.

