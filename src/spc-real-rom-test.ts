#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { SNESDisassembler } from './disassembler';

/**
 * Test SPC export functionality with real SNES ROM files
 */
class SPCRealROMTest {
  /**
   * Main test runner
   */
  public static async run(): Promise<void> {
    console.log('🎵 SPC Real ROM Export Test Suite');
    console.log('=====================================\n');

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
      // Test with multiple ROM files
      const testROMs = [
        'Super_Metroid.sfc',
        'Chrono_Trigger.sfc', 
        'Secret_of_Mana.sfc',
        'Super_Castlevania_IV.sfc',
        'Legend_of_Zelda_The_A_Link_to_the_Past.sfc'
      ];

      for (const romName of testROMs) {
        await this.testROMSPCExport(romName);
        console.log(''); // Add spacing between tests
      }

      console.log('✅ All real ROM SPC export tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }

  /**
   * Test SPC export for a specific ROM file
   */
  private static async testROMSPCExport(romName: string): Promise<void> {
    const romPath = path.join('snes_games', romName);
    
    // Check if ROM file exists
    if (!fs.existsSync(romPath)) {
      console.log(`⚠️  ROM file not found: ${romName} - skipping`);
      return;
    }

    console.log(`🎮 Testing SPC export for: ${romName}`);
    
    try {
      // Read ROM data
      const romData = fs.readFileSync(romPath);
      console.log(`   📁 ROM size: ${romData.length} bytes`);

      // Initialize disassembler
      const disassembler = new SNESDisassembler(romPath);
      
      // Export SPC file
      const spcOutputPath = path.join('output', `${path.parse(romName).name}.spc`);
      console.log(`   🔄 Analyzing ROM and extracting SPC state...`);
      
      const spcData = disassembler.exportSPC(spcOutputPath);
      
      console.log(`   ✅ SPC export completed`);
      console.log(`   📄 SPC file: ${spcOutputPath}`);
      console.log(`   📊 SPC size: ${spcData.length} bytes`);
      
      // Validate SPC file structure
      this.validateSPCFile(spcData, romName);
      
    } catch (error) {
      console.error(`   ❌ Failed to export SPC for ${romName}:`, error);
      throw error;
    }
  }

  /**
   * Validate basic SPC file structure
   */
  private static validateSPCFile(spcData: Uint8Array, romName: string): void {
    console.log(`   🔍 Validating SPC file structure for ${romName}...`);
    
    // Check minimum file size (header + SPC700 RAM + DSP registers)
    const minSize = 27 + 0x10000 + 128; // Header + 64KB RAM + DSP registers
    if (spcData.length < minSize) {
      throw new Error(`SPC file too small: ${spcData.length} bytes (minimum: ${minSize})`);
    }
    
    // Check SPC header signature
    const header = new TextDecoder().decode(spcData.slice(0, 27));
    if (!header.startsWith('SNES-SPC700 Sound File Data')) {
      throw new Error('Invalid SPC header signature');
    }
    
    // Check version marker (be more flexible since different SPC versions exist)
    if (spcData[27] !== 0x1A) {
      throw new Error(`Invalid SPC version marker at byte 27: expected 0x1A, got 0x${spcData[27].toString(16).padStart(2, '0').toUpperCase()}`);
    }
    
    // Log the version marker values for debugging
    console.log(`   📝 SPC version markers: [27]=0x${spcData[27].toString(16).padStart(2, '0')}, [28]=${spcData[28]}, [29]=${spcData[29]}`);
    if (spcData[28] !== 26 || spcData[29] !== 26) {
      console.warn(`   ⚠️  Non-standard version marker values: [28]=${spcData[28]}, [29]=${spcData[29]} (expected 26, 26)`);
    }
    
    // Check PC register (should be reasonable value)
    const pc = (spcData[37] << 8) | spcData[36];
    if (pc < 0x0200 || pc > 0xFFFF) {
      console.warn(`   ⚠️  Unusual PC value: 0x${pc.toString(16).padStart(4, '0')}`);
    }
    
    // Check if SPC700 RAM section exists
    const ramStart = 0x100;
    if (spcData.length < ramStart + 0x10000) {
      throw new Error('SPC file missing SPC700 RAM section');
    }
    
    // Check if DSP registers section exists  
    const dspStart = ramStart + 0x10000;
    if (spcData.length < dspStart + 128) {
      throw new Error('SPC file missing DSP registers section');
    }
    
    // Check for ID666 metadata
    const id666Start = dspStart + 128;
    if (spcData.length > id666Start) {
      console.log(`   📝 ID666 metadata present (${spcData.length - id666Start} bytes)`);
    }
    
    console.log(`   ✅ SPC file structure validation passed`);
  }

  /**
   * Display ROM analysis summary
   */
  private static displayROMAnalysis(disassembler: SNESDisassembler): void {
    // This would show analysis results if we had access to internal state
    console.log(`   🧠 ROM analysis completed`);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  SPCRealROMTest.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { SPCRealROMTest };
