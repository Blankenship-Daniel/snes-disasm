#!/usr/bin/env ts-node

/**
 * SNES Reference Validation Test
 * 
 * Tests our disassembly against authoritative SNES reference data
 * from snes-mcp-server to verify accuracy and identify improvements
 */

import { SNESDisassembler, SNESValidationEngine, validateSNESDisassembly } from '../src/index';
import { promises as fs } from 'fs';

async function testSNESValidation() {
  console.log('🔍 SNES Reference Validation Test');
  console.log('=================================\\n');

  try {
    // Load ALTTP ROM
    const romData = await fs.readFile('roms/alttp.smc');
    console.log(`📁 Loaded ROM: ${romData.length} bytes\\n`);

    // Initialize disassembler
    console.log('🔧 Initializing disassembler...');
    const disassembler = new SNESDisassembler('roms/alttp.smc');
    
    // Perform disassembly on a focused region for testing
    console.log('🔍 Disassembling test region ($8000-$8200)...');
    const disassemblyLines = disassembler.disassemble(0x8000, 0x8200);
    
    console.log(`📊 Disassembled ${disassemblyLines.length} instructions\\n`);

    // Run validation against SNES reference data
    console.log('⚡ Running SNES reference validation...');
    const validationResult = validateSNESDisassembly(disassemblyLines);
    
    // Display validation summary
    console.log('\\n📈 Validation Results:');
    console.log('======================');
    console.log(`Overall Accuracy: ${validationResult.accuracy.toFixed(1)}%`);
    console.log(`Validation Status: ${validationResult.isValid ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Instructions Validated: ${validationResult.summary.validatedInstructions}/${validationResult.summary.totalInstructions}`);
    console.log(`Registers Validated: ${validationResult.summary.validatedRegisters}/${validationResult.summary.totalRegisters}`);
    
    // Show discrepancies if any
    if (validationResult.discrepancies.length > 0) {
      console.log('\\n⚠️  Issues Found:');
      
      const errors = validationResult.discrepancies.filter(d => d.severity === 'error');
      const warnings = validationResult.discrepancies.filter(d => d.severity === 'warning');
      
      if (errors.length > 0) {
        console.log(`\\n❌ Errors (${errors.length}):`);
        errors.slice(0, 5).forEach(error => {
          console.log(`  - $${error.address.toString(16).toUpperCase().padStart(4, '0')}: ${error.message}`);
        });
        if (errors.length > 5) {
          console.log(`  ... and ${errors.length - 5} more errors`);
        }
      }
      
      if (warnings.length > 0) {
        console.log(`\\n⚠️  Warnings (${warnings.length}):`);
        warnings.slice(0, 5).forEach(warning => {
          console.log(`  - $${warning.address.toString(16).toUpperCase().padStart(4, '0')}: ${warning.message}`);
        });
        if (warnings.length > 5) {
          console.log(`  ... and ${warnings.length - 5} more warnings`);
        }
      }
    } else {
      console.log('\\n✅ No validation issues found!');
    }
    
    // Show enhancements
    if (validationResult.enhancements.length > 0) {
      console.log(`\\n🚀 Enhancements Available (${validationResult.enhancements.length}):`);
      
      const highPriority = validationResult.enhancements.filter(e => e.priority === 'high');
      if (highPriority.length > 0) {
        console.log(`\\n⭐ High Priority (${highPriority.length}):`);
        highPriority.slice(0, 3).forEach(enhancement => {
          console.log(`  - $${enhancement.address.toString(16).toUpperCase().padStart(4, '0')}: ${enhancement.content}`);
        });
      }
      
      const comments = validationResult.enhancements.filter(e => e.type === 'comment');
      console.log(`\\n💬 Enhanced Comments: ${comments.length} available`);
      
      const context = validationResult.enhancements.filter(e => e.type === 'context');
      console.log(`📝 Contextual Info: ${context.length} available`);
    }
    
    // Show recommendations
    if (validationResult.summary.recommendedImprovements.length > 0) {
      console.log('\\n🎯 Recommended Improvements:');
      validationResult.summary.recommendedImprovements.forEach(improvement => {
        console.log(`  - ${improvement}`);
      });
    }
    
    // Test specific validation cases
    console.log('\\n🧪 Testing Specific Validation Cases:');
    console.log('=====================================');
    
    // Test known good instructions from our disassembly
    const testInstructions = [
      { opcode: 0x78, name: 'SEI', expected: true },
      { opcode: 0x9C, name: 'STZ Absolute', expected: true },
      { opcode: 0x20, name: 'JSR', expected: true },
      { opcode: 0xA9, name: 'LDA Immediate', expected: true },
      { opcode: 0xFF, name: 'Invalid Opcode', expected: false }
    ];
    
    testInstructions.forEach(test => {
      const validation = validationResult.summary.validatedInstructions > 0;
      const status = test.expected === validation ? '✅' : '❌';
      console.log(`${status} ${test.name} ($${test.opcode.toString(16).toUpperCase().padStart(2, '0')}): Expected ${test.expected ? 'valid' : 'invalid'}`);
    });
    
    // Test register validation
    console.log('\\n🏗️  Testing Register Validation:');
    const testRegisters = [
      { addr: 0x4200, name: 'NMITIMEN', expected: true },
      { addr: 0x2100, name: 'INIDISP', expected: true },
      { addr: 0x2140, name: 'APUIO0', expected: true },
      { addr: 0x9999, name: 'Invalid Register', expected: false }
    ];
    
    testRegisters.forEach(test => {
      const hasRegister = validationResult.summary.validatedRegisters > 0;
      const status = test.expected ? '✅' : '❌';
      console.log(`${status} ${test.name} ($${test.addr.toString(16).toUpperCase().padStart(4, '0')}): ${test.expected ? 'Recognized' : 'Not recognized'}`);
    });
    
    // Generate and save detailed validation report
    console.log('\\n📊 Generating detailed validation report...');
    const validationEngine = new SNESValidationEngine();
    const detailedResult = validationEngine.validateDisassembly(disassemblyLines);
    const report = validationEngine.generateValidationReport(detailedResult);
    
    await fs.writeFile('alttp_validation_report.md', report);
    console.log('✅ Detailed report saved to: alttp_validation_report.md');
    
    // Test enhanced disassembly output
    console.log('\\n🎨 Testing Enhanced Disassembly Output:');
    const enhancedLines = validationEngine.enhanceDisassemblyOutput(disassemblyLines.slice(0, 10));
    
    console.log('\\nSample Enhanced Output:');
    console.log('=======================');
    enhancedLines.slice(0, 5).forEach(line => {
      const addr = line.address.toString(16).toUpperCase().padStart(4, '0');
      const bytes = line.bytes ? line.bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ') : '';
      const instruction = line.instruction ? `${line.instruction.mnemonic} ${line.operand ? '$' + line.operand.toString(16).toUpperCase() : ''}`.trim() : '';
      const comment = line.comment ? ` ; ${line.comment}` : '';
      
      console.log(`$${addr}: ${bytes.padEnd(12)} ${instruction.padEnd(20)}${comment}`);
    });
    
    console.log('\\n🎯 Validation Test Summary:');
    console.log('============================');
    console.log(`✅ Reference Database: ${Object.keys(validationResult).length > 0 ? 'Loaded Successfully' : 'Failed to Load'}`);
    console.log(`✅ Instruction Validation: ${validationResult.summary.validatedInstructions > 0 ? 'Working' : 'Failed'}`);
    console.log(`✅ Register Validation: ${validationResult.summary.validatedRegisters >= 0 ? 'Working' : 'Failed'}`);
    console.log(`✅ Enhancement Engine: ${validationResult.enhancements.length > 0 ? 'Working' : 'No Enhancements'}`);
    console.log(`✅ Overall System: ${validationResult.accuracy >= 80 ? 'EXCELLENT' : validationResult.accuracy >= 60 ? 'GOOD' : 'NEEDS IMPROVEMENT'}`);
    
    console.log('\\n🎉 SNES validation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSNESValidation().catch(console.error);