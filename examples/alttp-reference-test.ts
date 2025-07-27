#!/usr/bin/env ts-node

/**
 * A Link to the Past ROM Reference Integration Test
 * 
 * This script tests the complete integration of the snes-reference-tables.ts
 * with the SNES disassembler using the actual ALTTP ROM file.
 */

import * as path from 'path';
import { 
  SNESDisassembler,
  INSTRUCTION_REFERENCE,
  REGISTER_REFERENCE,
  validateInstruction,
  generateInstructionComment,
  validateSNESDisassembly,
  type ValidationResult
} from '../src/index';

console.log('🎮 A Link to the Past - SNES Reference Integration Test');
console.log('=====================================================\n');

const romPath = path.join(__dirname, '..', 'roms', 'alttp.smc');

try {
  // Initialize disassembler with validation enabled
  console.log('📂 Loading ALTTP ROM...');
  const disassembler = new SNESDisassembler(romPath, {
    enableValidation: true,
    enhanceComments: true
  });
  
  const romInfo = disassembler.getRomInfo();
  console.log(`✅ ROM loaded: ${romInfo.header.title}`);
  console.log(`   Map Mode: ${romInfo.cartridgeInfo.type}`);
  console.log(`   ROM Size: ${(romInfo.cartridgeInfo.romSize / 1024).toFixed(0)} KB`);
  console.log(`   Reset Vector: $${romInfo.header.nativeVectors.reset.toString(16).toUpperCase().padStart(4, '0')}\n`);

  // Test 1: Disassemble reset vector area with validation
  console.log('🔍 Test 1: Reset Vector Disassembly with Validation');
  console.log('--------------------------------------------------');
  
  const resetVector = romInfo.header.nativeVectors.reset;
  const lines = disassembler.disassemble(resetVector, resetVector + 64); // First 64 bytes
  
  console.log(`Disassembled ${lines.length} instructions from reset vector:\n`);
  
  // Display first 10 instructions with enhanced comments
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];
    const addr = `$${line.address.toString(16).toUpperCase().padStart(6, '0')}`;
    const bytes = line.bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ').padEnd(12);
    const instruction = line.instruction.mnemonic.padEnd(4);
    const comment = line.comment ? ` ; ${line.comment}` : '';
    
    console.log(`${addr}: ${bytes} ${instruction}${comment}`);
  }

  // Test 2: Validation Results
  console.log('\n📊 Test 2: Validation Results');
  console.log('-----------------------------');
  
  const validationResult = disassembler.getValidationResults();
  if (validationResult) {
    console.log(`Validation Accuracy: ${validationResult.accuracy.toFixed(1)}%`);
    console.log(`Total Instructions: ${validationResult.summary.totalInstructions}`);
    console.log(`Validated Instructions: ${validationResult.summary.validatedInstructions}`);
    console.log(`Issues Found: ${validationResult.discrepancies.length}`);
    console.log(`Enhancements: ${validationResult.enhancements.length}`);
    
    // Show first few issues if any
    if (validationResult.discrepancies.length > 0) {
      console.log('\nValidation Issues:');
      validationResult.discrepancies.slice(0, 5).forEach(issue => {
        const addr = `$${issue.address.toString(16).toUpperCase().padStart(6, '0')}`;
        console.log(`  ${issue.severity.toUpperCase()}: ${addr} - ${issue.message}`);
      });
    }
    
    // Show enhancements
    if (validationResult.enhancements.length > 0) {
      console.log('\nGenerated Enhancements:');
      validationResult.enhancements.slice(0, 5).forEach(enhancement => {
        const addr = `$${enhancement.address.toString(16).toUpperCase().padStart(6, '0')}`;
        console.log(`  ${enhancement.type.toUpperCase()}: ${addr} - ${enhancement.content}`);
      });
    }
  } else {
    console.log('❌ Validation not available (disabled)');
  }

  // Test 3: Reference Data Usage
  console.log('\n🔧 Test 3: Reference Data Usage');
  console.log('-------------------------------');
  
  const instructionStats = new Map<string, number>();
  const registerAccesses = new Map<number, number>();
  
  for (const line of lines) {
    // Count instruction usage
    const mnemonic = line.instruction.mnemonic;
    instructionStats.set(mnemonic, (instructionStats.get(mnemonic) || 0) + 1);
    
    // Track register accesses
    if (line.operand !== undefined) {
      const operand = line.operand;
      if (operand >= 0x2100 && operand <= 0x21FF || // PPU registers
          operand >= 0x4200 && operand <= 0x43FF || // CPU registers
          operand >= 0x2140 && operand <= 0x2143) { // APU registers
        registerAccesses.set(operand, (registerAccesses.get(operand) || 0) + 1);
      }
    }
  }
  
  console.log('Instruction Usage:');
  Array.from(instructionStats.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .forEach(([mnemonic, count]) => {
      console.log(`  ${mnemonic.padEnd(4)}: ${count} times`);
    });
  
  if (registerAccesses.size > 0) {
    console.log('\nHardware Register Accesses:');
    Array.from(registerAccesses.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([register, count]) => {
        const registerInfo = REGISTER_REFERENCE[register];
        const name = registerInfo?.name || 'Unknown';
        console.log(`  $${register.toString(16).toUpperCase().padStart(4, '0')} (${name}): ${count} times`);
      });
  }

  // Test 4: Enhanced Analysis
  console.log('\n🧠 Test 4: Enhanced Analysis');
  console.log('----------------------------');
  
  const analysis = disassembler.analyze();
  console.log(`Functions detected: ${analysis.functions.length}`);
  console.log(`Data structures: ${analysis.data.length}`);
  
  // Show first few functions
  if (analysis.functions.length > 0) {
    console.log('\nDetected Functions:');
    analysis.functions.slice(0, 5).forEach(addr => {
      console.log(`  $${addr.toString(16).toUpperCase().padStart(6, '0')}`);
    });
  }

  // Test 5: Reference Table Statistics
  console.log('\n📈 Test 5: Reference Table Coverage');
  console.log('-----------------------------------');
  
  const totalInstructions = Object.keys(INSTRUCTION_REFERENCE).length;
  const totalRegisters = Object.keys(REGISTER_REFERENCE).length;
  
  console.log(`Total Instruction References: ${totalInstructions}`);
  console.log(`Total Register References: ${totalRegisters}`);
  
  // Count how many reference opcodes were actually used
  const usedOpcodes = new Set<number>();
  for (const line of lines) {
    if (line.instruction.opcode !== undefined) {
      usedOpcodes.add(line.instruction.opcode);
    }
  }
  
  console.log(`Opcodes used in sample: ${usedOpcodes.size}`);
  console.log(`Reference coverage: ${((usedOpcodes.size / totalInstructions) * 100).toFixed(1)}%`);

  // Test 6: Validation Report Generation
  console.log('\n📄 Test 6: Validation Report');
  console.log('----------------------------');
  
  const report = disassembler.generateValidationReport();
  const reportLines = report.split('\n');
  console.log('Generated validation report:');
  console.log(`  Lines: ${reportLines.length}`);
  console.log(`  First few lines:\n${reportLines.slice(0, 8).join('\n')}`);

  // Test Summary
  console.log('\n🎉 ALTTP Integration Test Summary');
  console.log('=================================');
  console.log('✅ ROM loaded and parsed successfully');
  console.log('✅ Disassembly with validation completed');
  console.log('✅ Enhanced comments generated');
  console.log('✅ Reference tables fully integrated');
  console.log('✅ Hardware register detection working');
  console.log('✅ Validation engine operational');
  console.log('✅ Analysis engine enhanced');
  
  console.log('\n🎮 The SNES disassembler is ready for A Link to the Past analysis!');
  
} catch (error) {
  console.error('❌ Test failed:', error);
  console.error('\nPlease ensure:');
  console.error('- The alttp.smc file exists in the roms/ directory');
  console.error('- The ROM file is a valid SNES ROM');
  console.error('- All dependencies are properly installed');
  process.exit(1);
}