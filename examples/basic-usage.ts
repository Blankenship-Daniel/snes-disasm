import { SNESDisassembler } from '../src';
import * as path from 'path';

// Example usage of the SNES disassembler
async function main() {
  try {
    // Load A Link to the Past ROM
    const romPath = path.join(__dirname, '../roms/alttp.smc');
    const disassembler = new SNESDisassembler(romPath);
    
    // Get ROM information
    const romInfo = disassembler.getRomInfo();
    console.log(`ROM Title: ${romInfo.header.title}`);
    console.log(`Map Mode: ${romInfo.isHiRom ? 'HiROM' : 'LoROM'}`);
    console.log(`Reset Vector: $${romInfo.header.nativeVectors.reset.toString(16).toUpperCase()}`);
    console.log(`NMI Vector: $${romInfo.header.nativeVectors.nmi.toString(16).toUpperCase()}`);
    console.log('');
    
    // Add some labels for better readability
    disassembler.addLabel(romInfo.header.nativeVectors.reset, 'Reset');
    disassembler.addLabel(romInfo.header.nativeVectors.nmi, 'NMI_Handler');
    disassembler.addLabel(romInfo.header.nativeVectors.irq, 'IRQ_Handler');
    
    // Add comments
    disassembler.addComment(romInfo.header.nativeVectors.reset, 'System reset entry point');
    disassembler.addComment(romInfo.header.nativeVectors.nmi, 'VBlank interrupt handler');
    
    // Disassemble from reset vector
    console.log('=== Reset Vector Disassembly ===');
    const resetLines = disassembler.disassembleFunction(romInfo.header.nativeVectors.reset, 50);
    console.log(disassembler.formatOutput(resetLines));
    console.log('');
    
    // Disassemble a range of code
    console.log('=== Code Range Disassembly ===');
    const rangeLines = disassembler.disassemble(
      romInfo.header.nativeVectors.reset, 
      romInfo.header.nativeVectors.reset + 0x100
    );
    console.log(disassembler.formatOutput(rangeLines.slice(0, 20))); // Show first 20 lines
    console.log('');
    
    // Analyze ROM structure
    console.log('=== ROM Analysis ===');
    const analysis = disassembler.analyze();
    console.log(`Found ${analysis.functions.length} potential functions`);
    console.log(`Found ${analysis.data.length} data blocks`);
    
    console.log('\nFirst 10 function addresses:');
    analysis.functions.slice(0, 10).forEach(addr => {
      console.log(`  $${addr.toString(16).toUpperCase().padStart(6, '0')}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

if (require.main === module) {
  main();
}