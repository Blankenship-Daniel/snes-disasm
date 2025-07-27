#!/usr/bin/env node

/**
 * SNES Disassembler Command Line Interface
 * 
 * Usage: snes-disasm [options] <rom-file>
 */

import { program } from 'commander';
import { disassembleROM, CLIOptions } from './disassembly-handler';

async function main() {
  program
    .name('snes-disasm')
    .description('SNES ROM Disassembler with AI-enhanced analysis capabilities')
    .version('1.0.0')
    .argument('<rom-file>', 'SNES ROM file to disassemble')
    .option('-o, --output <file>', 'Output file (default: <rom-name>.<ext>)')
    .option('-d, --output-dir <directory>', 'Output directory (default: current directory)')
    .option('-f, --format <format>', 'Output format: ca65, wla-dx, bass, html, json, xml, csv, markdown', 'ca65')
    .option('-s, --start <address>', 'Start address (hex, e.g., 8000)')
    .option('-e, --end <address>', 'End address (hex, e.g., FFFF)')
    .option('--symbols <file>', 'Load symbol file (.sym, .mlb, .json, .csv)')
    .option('--analysis', 'Enable full analysis (functions, data structures, patterns)')
    .option('--quality', 'Generate code quality report')
    .option('-v, --verbose', 'Verbose output')
    .option('--labels <file>', 'Load custom labels file')
    .option('--comments <file>', 'Load custom comments file')
    .option('--extract-assets', 'Extract assets (graphics, audio, text) from ROM')
    .option('--asset-types <types>', 'Asset types to extract: graphics,audio,text', 'graphics,audio,text')
    .option('--asset-formats <formats>', 'Graphics formats to extract: 2bpp,4bpp,8bpp', '4bpp')
    .option('--disable-ai', 'Disable AI-powered pattern recognition (AI is enabled by default)')
    .option('--enhanced-disasm', 'Use enhanced disassembly algorithms with MCP server insights')
    .option('--bank-aware', 'Enable bank-aware disassembly with 24-bit addressing')
    .option('--detect-functions', 'Enable automatic function detection and labeling')
    .option('--generate-docs', 'Generate documentation for discovered functions and data structures')
    .action(async (romFile: string, options: CLIOptions) => {
      try {
        await disassembleROM(romFile, options);
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  program.parse();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as runCLI };