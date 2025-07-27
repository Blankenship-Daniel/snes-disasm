import { SNESDisassembler } from '../src/disassembler';
import * as path from 'path';

describe('A Link to the Past ROM Test', () => {
  let disassembler: SNESDisassembler;
  const romPath = path.join(__dirname, '../snes_games/Legend_of_Zelda_The_A_Link_to_the_Past.sfc');
  
  beforeAll(() => {
    disassembler = new SNESDisassembler(romPath);
  });
  
  test('should parse ROM header correctly', () => {
    const romInfo = disassembler.getRomInfo();
    
    expect(romInfo.header.title).toContain('ZELDA');
    expect(romInfo.isHiRom).toBe(true); // A Link to the Past is HiROM
    expect(romInfo.header.nativeVectors.reset).toBeGreaterThan(0);
  });
  
  test('should disassemble reset vector', () => {
    const romInfo = disassembler.getRomInfo();
    const resetVector = romInfo.header.nativeVectors.reset;
    
    const lines = disassembler.disassembleFunction(resetVector, 20);
    
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0].address).toBe(resetVector);
    expect(lines[0].instruction.mnemonic).toBeDefined();
  });
  
  test('should format disassembly output', () => {
    const romInfo = disassembler.getRomInfo();
    const resetVector = romInfo.header.nativeVectors.reset;
    
    const lines = disassembler.disassemble(resetVector, resetVector + 0x50);
    const output = disassembler.formatOutput(lines);
    
    expect(output).toContain('SNES ROM Disassembly');
    expect(output).toContain('ZELDA');
    expect(output).toContain('$');
    expect(output.split('\n').length).toBeGreaterThan(5);
  });
  
  test('should handle different instruction types', () => {
    const romInfo = disassembler.getRomInfo();
    const resetVector = romInfo.header.nativeVectors.reset;
    
    const lines = disassembler.disassemble(resetVector, resetVector + 0x100);
    
    // Should find various instruction types
    const mnemonics = lines.map(line => line.instruction.mnemonic);
    const uniqueMnemonics = new Set(mnemonics);
    
    expect(uniqueMnemonics.size).toBeGreaterThan(5);
  });
  
  test('should analyze ROM structure', () => {
    const analysis = disassembler.analyze();
    
    expect(analysis.functions.length).toBeGreaterThan(0);
    expect(analysis.functions).toContain(disassembler.getRomInfo().header.nativeVectors.reset);
  });
  
  test('should handle labels and comments', () => {
    const resetVector = disassembler.getRomInfo().header.nativeVectors.reset;
    
    disassembler.addLabel(resetVector, 'Reset');
    disassembler.addComment(resetVector, 'System reset entry point');
    
    const lines = disassembler.disassemble(resetVector, resetVector + 0x10);
    const output = disassembler.formatOutput(lines);
    
    expect(output).toContain('Reset:');
    expect(output).toContain('System reset entry point');
  });
});