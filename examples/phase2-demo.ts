#!/usr/bin/env ts-node

/**
 * Phase 2 Features Demo
 * Demonstrates the newly implemented Phase 2 enhancements for the SNES disassembler
 */

import { RomParser } from '../src/rom-parser';
import { CartridgeType, detectCartridgeType, createMemoryLayout } from '../src/cartridge-types';

console.log('🎮 SNES Disassembler - Phase 2 Features Demo\n');

// Test ROM file path (using the existing A Link to the Past ROM)
const romPath = './roms/alttp.smc';

try {
  console.log('📜 Testing Enhanced ROM Format Support...');
  
  // Test 1: Advanced ROM parsing with special format detection
  console.log('\n1. Advanced ROM Parsing with Format Detection:');
  const advancedRom = RomParser.parseAdvanced(romPath);
  
  console.log(`   ROM Type: ${advancedRom.cartridgeInfo.type}`);
  console.log(`   Has Header: ${advancedRom.hasHeader}`);
  console.log(`   Is Interleaved: ${advancedRom.isInterleaved || 'No'}`);
  console.log(`   Is Split ROM: ${advancedRom.isSplitRom || 'No'}`);
  console.log(`   Is Overdumped: ${advancedRom.isOverdumped || 'No'}`);
  console.log(`   Original Size: ${advancedRom.originalSize || advancedRom.data.length} bytes`);

  // Test 2: Special cartridge detection
  console.log('\n2. Special Cartridge Support:');
  
  // Test MSU-1 detection
  const msu1Type = detectCartridgeType(0x20, 0xFE);
  console.log(`   MSU-1 Detection: ${msu1Type}`);
  
  // Test BSX detection  
  const bsxType = detectCartridgeType(0x00, 0xE3);
  console.log(`   BSX Satellaview Detection: ${bsxType}`);
  
  // Test SA-1 detection
  const sa1Type = detectCartridgeType(0x23, 0x34);
  console.log(`   SA-1 Detection: ${sa1Type}`);

  // Test 3: Enhanced memory mapping
  console.log('\n3. Enhanced Memory Layout Generation:');
  
  const memoryRegions = createMemoryLayout(advancedRom.cartridgeInfo);
  console.log(`   Total Memory Regions: ${memoryRegions.length}`);
  console.log(`   ROM Regions: ${memoryRegions.filter(r => r.type === 'ROM').length}`);
  console.log(`   RAM Regions: ${memoryRegions.filter(r => r.type === 'RAM').length}`);
  console.log(`   I/O Regions: ${memoryRegions.filter(r => r.type === 'IO').length}`);
  
  // Show first few regions as examples
  console.log('\n   Sample Memory Regions:');
  memoryRegions.slice(0, 5).forEach((region, index) => {
    console.log(`     ${index + 1}. ${region.description}: $${region.start.toString(16).toUpperCase().padStart(6, '0')}-$${region.end.toString(16).toUpperCase().padStart(6, '0')} (${region.type})`);
  });

  // Test 4: ROM format enhancements
  console.log('\n4. ROM Format Enhancement Features:');
  
  // Test split ROM detection (won't find any for single file, but shows functionality)
  const splitParts = RomParser.detectSplitRom(romPath);
  console.log(`   Split ROM Parts Detected: ${splitParts.length}`);
  
  // Test interleaved detection
  const isInterleaved = RomParser.detectInterleavedFormat(advancedRom.data);
  console.log(`   Interleaved Format: ${isInterleaved ? 'Yes' : 'No'}`);
  
  // Test overdump detection
  const expectedSize = (1 << advancedRom.header.romSize) * 1024; // 2^romSize KB
  const overdumpInfo = RomParser.detectOverdump(advancedRom.data, expectedSize);
  console.log(`   Overdump Detected: ${overdumpInfo.isOverdumped ? 'Yes' : 'No'}`);
  console.log(`   Original Size: ${overdumpInfo.originalSize} bytes`);

  console.log('\n✅ Phase 2 Implementation Complete!');
  console.log('\n📋 Phase 2 Features Successfully Implemented:');
  console.log('   ✅ Enhanced Memory Mapping - Advanced bank wrapping and cartridge-specific layouts');
  console.log('   ✅ Special Cartridge Support - MSU-1, BSX, SA-1, SuperFX, DSP chips, and more');
  console.log('   ✅ ROM Format Enhancements - Split ROMs, interleaved formats, overdump detection');
  console.log('   ✅ Advanced Cartridge Detection - Comprehensive special chip identification');
  console.log('   ✅ Memory Region Analysis - Detailed memory layout with access permissions');
  
} catch (error) {
  console.error('❌ Error demonstrating Phase 2 features:', error);
  process.exit(1);
}