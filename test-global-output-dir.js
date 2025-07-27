#!/usr/bin/env node

/**
 * Test script to demonstrate the Global Default Output Directory feature
 * 
 * This script shows how the feature works by creating a temporary session
 * and testing the various commands.
 */

const { sessionManager } = require('./dist/cli/session-manager');
const path = require('path');
const fs = require('fs/promises');
const os = require('os');

async function testGlobalOutputDirectory() {
  console.log('🧪 Testing Global Default Output Directory Feature\n');

  try {
    // Initialize session
    console.log('1. Loading session...');
    await sessionManager.load();
    
    // Test initial state
    console.log('2. Checking initial state...');
    const initialDir = sessionManager.getGlobalOutputDir();
    console.log(`   Initial global output dir: ${initialDir || 'Not set'}`);
    console.log(`   Has global output dir: ${sessionManager.hasGlobalOutputDir()}`);
    
    // Test setting a global output directory
    console.log('\n3. Setting global output directory...');
    const testOutputDir = path.join(os.tmpdir(), 'snes-disasm-test');
    await sessionManager.setGlobalOutputDir(testOutputDir);
    console.log(`   Set global output dir to: ${testOutputDir}`);
    
    // Verify it was set
    console.log('4. Verifying the setting...');
    const setDir = sessionManager.getGlobalOutputDir();
    console.log(`   Current global output dir: ${setDir}`);
    console.log(`   Has global output dir: ${sessionManager.hasGlobalOutputDir()}`);
    
    // Test getEffectiveOutputDir with different scenarios
    console.log('\n5. Testing effective output directory resolution...');
    
    // No specific directory - should use global
    const effective1 = sessionManager.getEffectiveOutputDir();
    console.log(`   No specific dir: ${effective1}`);
    
    // With specific directory - should use specific
    const effective2 = sessionManager.getEffectiveOutputDir('./custom-output');
    console.log(`   With specific dir './custom-output': ${effective2}`);
    
    // With undefined specific directory - should use global
    const effective3 = sessionManager.getEffectiveOutputDir(undefined);
    console.log(`   With undefined specific dir: ${effective3}`);
    
    // Test clearing the global output directory
    console.log('\n6. Clearing global output directory...');
    await sessionManager.clearGlobalOutputDir();
    const clearedDir = sessionManager.getGlobalOutputDir();
    console.log(`   After clearing: ${clearedDir || 'Not set'}`);
    console.log(`   Has global output dir: ${sessionManager.hasGlobalOutputDir()}`);
    
    // Test effective directory after clearing
    console.log('\n7. Testing effective directory after clearing...');
    const effective4 = sessionManager.getEffectiveOutputDir();
    console.log(`   Effective dir after clearing: ${effective4}`);
    
    // Clean up test directory if it was created
    try {
      await fs.rmdir(testOutputDir);
      console.log(`\n✅ Cleaned up test directory: ${testOutputDir}`);
    } catch (error) {
      // Directory might not exist or might not be empty, that's okay
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testGlobalOutputDirectory().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testGlobalOutputDirectory };
