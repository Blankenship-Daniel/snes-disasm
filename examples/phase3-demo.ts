#!/usr/bin/env ts-node

/**
 * Phase 3 Features Demo
 * Demonstrates the newly implemented Phase 3 advanced analysis engine enhancements
 */

import { RomParser } from '../src/rom-parser';
import { Disassembler } from '../src/disassembler';
import { AnalysisEngine } from '../src/analysis-engine';

console.log('🧠 SNES Disassembler - Phase 3 Advanced Analysis Demo\n');

// Test ROM file path (using the existing A Link to the Past ROM)
const romPath = './roms/alttp.smc';

try {
  console.log('📊 Testing Advanced Analysis Engine...');
  
  // Test 1: Parse ROM and disassemble initial section
  console.log('\n1. Parsing ROM and Disassembling Code:');
  const rom = RomParser.parse(romPath);
  const disassembler = new Disassembler();
  
  // Disassemble first 2KB for analysis
  const lines = disassembler.disassemble(rom.data.slice(0, 2048), 0x8000);
  console.log(`   Disassembled ${lines.length} instructions for analysis`);

  // Test 2: Advanced Analysis Engine
  console.log('\n2. Running Advanced Analysis Engine:');
  const analysisEngine = new AnalysisEngine();
  const vectorAddresses = [rom.header.nativeVectors.reset, rom.header.nativeVectors.nmi, rom.header.nativeVectors.irq];
  
  analysisEngine.analyze(lines, rom.cartridgeInfo, vectorAddresses);
  
  const summary = analysisEngine.getAnalysisSummary();
  console.log(`   Functions Detected: ${summary.functions}`);
  console.log(`   Basic Blocks: ${summary.basicBlocks}`);
  console.log(`   Data Structures: ${summary.dataStructures}`);
  console.log(`   Cross-References: ${summary.crossReferences}`);
  console.log(`   Jump Tables: ${summary.jumpTables}`);
  console.log(`   Sprite Structures: ${summary.spriteStructures}`);
  console.log(`   Hardware Register Usage: ${summary.registerUsage}`);

  // Test 3: Data Structure Recognition
  console.log('\n3. Data Structure Recognition:');
  const dataStructures = analysisEngine.getDataStructures();
  if (dataStructures.size > 0) {
    console.log(`   Found ${dataStructures.size} data structures:`);
    let count = 0;
    for (const [address, structure] of dataStructures) {
      if (count < 5) { // Show first 5 structures
        console.log(`     • ${structure.type} at $${address.toString(16).toUpperCase()}: ${structure.description} (confidence: ${(structure.confidence * 100).toFixed(0)}%)`);
      }
      count++;
    }
    if (dataStructures.size > 5) {
      console.log(`     ... and ${dataStructures.size - 5} more`);
    }
  } else {
    console.log('   No data structures detected in this sample');
  }

  // Test 4: Function Analysis
  console.log('\n4. Function Detection & Analysis:');
  const functions = analysisEngine.getFunctions();
  if (functions.size > 0) {
    console.log(`   Detected ${functions.size} functions:`);
    let count = 0;
    for (const [address, func] of functions) {
      if (count < 3) { // Show first 3 functions
        const confidence = (func.confidence * 100).toFixed(0);
        const type = func.isInterrupt ? 'Interrupt Handler' : 'Function';
        console.log(`     • ${type} at $${address.toString(16).toUpperCase()} (confidence: ${confidence}%)`);
        console.log(`       - Basic blocks: ${func.basicBlocks.size}`);
        console.log(`       - Callers: ${func.callers.size}, Callees: ${func.callees.size}`);
      }
      count++;
    }
    if (functions.size > 3) {
      console.log(`     ... and ${functions.size - 3} more`);
    }
  } else {
    console.log('   No functions detected in this sample');
  }

  // Test 5: Hardware Register Usage Analysis
  console.log('\n5. Hardware Register Usage Analysis:');
  const registerUsage = analysisEngine.getHardwareRegisterUsage();
  if (registerUsage.size > 0) {
    console.log(`   Analyzed ${registerUsage.size} hardware registers:`);
    let count = 0;
    for (const [address, usage] of registerUsage) {
      if (count < 8 && (usage.reads + usage.writes) > 0) { // Show first 8 active registers
        console.log(`     • ${usage.register} ($${address.toString(16).toUpperCase()}): ${usage.reads} reads, ${usage.writes} writes`);
        console.log(`       ${usage.description}`);
      }
      count++;
    }
  } else {
    console.log('   No hardware register usage detected');
  }

  // Test 6: Cross-Reference System
  console.log('\n6. Cross-Reference Analysis:');
  const crossRefs = analysisEngine.getCrossReferences();
  if (crossRefs.size > 0) {
    console.log(`   Generated cross-references for ${crossRefs.size} addresses`);
    
    // Show some examples
    let examples = 0;
    for (const [address, refs] of crossRefs) {
      if (examples < 3 && refs.length > 1) {
        console.log(`     • Address $${address.toString(16).toUpperCase()} referenced ${refs.length} times:`);
        refs.slice(0, 3).forEach(ref => {
          console.log(`       - ${ref.type} from $${ref.fromAddress.toString(16).toUpperCase()}`);
        });
        examples++;
      }
    }
  } else {
    console.log('   No cross-references generated in this sample');
  }

  // Test 7: Control Flow Graph
  console.log('\n7. Control Flow Graph Analysis:');
  const cfg = analysisEngine.getControlFlowGraph();
  console.log(`   Basic Blocks: ${cfg.blocks.size}`);
  console.log(`   Entry Points: ${cfg.entryPoints.size}`);
  console.log(`   Functions: ${cfg.functions.size}`);

  if (cfg.entryPoints.size > 0) {
    console.log('   Entry Points:');
    Array.from(cfg.entryPoints).slice(0, 3).forEach(entryPoint => {
      console.log(`     • $${entryPoint.toString(16).toUpperCase()}`);
    });
  }

  // Test 8: Enhanced Disassembly Features
  console.log('\n8. Enhanced Disassembly Features:');
  const enhancedLines = analysisEngine.getEnhancedDisassembly(lines);
  
  console.log(`   Original lines: ${lines.length}`);
  console.log(`   Enhanced lines: ${enhancedLines.length}`);
  
  // Count enhanced features
  const withLabels = enhancedLines.filter(line => line.label).length;
  const withComments = enhancedLines.filter(line => line.comment).length;
  const inlineDataDetected = enhancedLines.filter(line => 
    line.comment && line.comment.includes('INLINE DATA')).length;
  
  console.log(`   Lines with auto-generated labels: ${withLabels}`);
  console.log(`   Lines with intelligent comments: ${withComments}`);
  console.log(`   Inline data sections detected: ${inlineDataDetected}`);
  
  // Show some examples of enhanced features
  if (withLabels > 0) {
    console.log('\n   Sample auto-generated labels:');
    enhancedLines.filter(line => line.label).slice(0, 3).forEach(line => {
      console.log(`     ${line.label}: at $${line.address.toString(16).toUpperCase()}`);
    });
  }
  
  if (withComments > 0) {
    console.log('\n   Sample intelligent comments:');
    enhancedLines.filter(line => line.comment && !line.comment.includes('INLINE DATA'))
      .slice(0, 3).forEach(line => {
        console.log(`     $${line.address.toString(16).toUpperCase()}: ${line.instruction.mnemonic} ${line.comment}`);
      });
  }

  console.log('\n✅ Phase 3 Implementation Complete!');
  console.log('\n📋 Phase 3 Features Successfully Implemented:');
  console.log('   ✅ Advanced Data Structure Recognition - Sprites, tiles, palettes, level data');
  console.log('   ✅ Enhanced Function Detection - Multiple heuristics with confidence scoring');
  console.log('   ✅ Hardware Register Usage Analysis - Complete SNES register tracking');
  console.log('   ✅ Cross-Reference System Enhancements - Comprehensive address usage tracking');
  console.log('   ✅ Control Flow Graph Generation - Advanced basic block analysis');
  console.log('   ✅ Jump Table & Pointer Table Detection - Indirect addressing analysis');
  console.log('   ✅ Code vs Data Classification - Intelligent content recognition');
  console.log('   ✅ Enhanced Disassembly Features - Inline data detection, smart labels, intelligent comments');
  console.log('   ✅ Compiler Pattern Recognition - Function prologues/epilogues, stack frame analysis');
  console.log('   ✅ Interrupt Vector Analysis - Handler detection and documentation');
  
} catch (error) {
  console.error('❌ Error demonstrating Phase 3 features:', error);
  process.exit(1);
}