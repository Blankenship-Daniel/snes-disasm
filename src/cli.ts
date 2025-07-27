#!/usr/bin/env node

/**
 * SNES Disassembler Command Line Interface
 *
 * Usage: snes-disasm [options] <rom-file>
 */

import { program } from 'commander';
import { disassembleROM, CLIOptions } from './disassembly-handler';
import { intro, outro, select, text, confirm, multiselect, spinner, note, isCancel, cancel } from '@clack/prompts';
import { Listr } from 'listr2';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

const runInteractiveMode = async () => {
  intro(chalk.bgCyan.black(' 🎮 SNES Disassembler Interactive CLI 🎮 '));
  
  try {
    // Main action selection
    const action = await select({
      message: 'What would you like to do?',
      options: [
        { value: 'disassemble', label: '📊 Disassemble ROM', hint: 'Convert ROM to assembly code' },
        { value: 'extract-assets', label: '🎨 Extract Assets', hint: 'Extract graphics, audio, and text' },
        { value: 'brr-decode', label: '🎵 Decode BRR Audio', hint: 'Convert BRR audio files to WAV' },
        { value: 'analysis', label: '🔍 Advanced Analysis', hint: 'Analyze ROM structure and patterns' },
        { value: 'exit', label: '❌ Exit', hint: 'Exit the application' }
      ]
    });

    if (isCancel(action) || action === 'exit') {
      cancel('Operation cancelled.');
      return;
    }

    switch (action) {
      case 'disassemble':
        await handleDisassemblyWorkflow();
        break;
      case 'extract-assets':
        await handleAssetExtractionWorkflow();
        break;
      case 'brr-decode':
        await handleBRRDecodingWorkflow();
        break;
      case 'analysis':
        await handleAnalysisWorkflow();
        break;
    }
    
  } catch (error) {
    if (isCancel(error)) {
      cancel('Operation cancelled.');
      return;
    }
    throw error;
  }
};

const handleDisassemblyWorkflow = async () => {
  const romFile = await text({
    message: 'Enter the path to your SNES ROM file:',
    placeholder: './example.smc',
    validate: (value) => {
      if (!value) return 'ROM file path is required';
      if (!fs.existsSync(value)) return 'File does not exist';
      return;
    }
  });

  if (isCancel(romFile)) {
    cancel('Operation cancelled.');
    return;
  }

  // Output format selection
  const format = await select({
    message: 'Select output format:',
    options: [
      { value: 'ca65', label: 'CA65 Assembly', hint: 'Compatible with cc65 assembler' },
      { value: 'wla-dx', label: 'WLA-DX Assembly', hint: 'Compatible with WLA-DX assembler' },
      { value: 'bass', label: 'BASS Assembly', hint: 'Compatible with BASS assembler' },
      { value: 'html', label: 'HTML Report', hint: 'Interactive HTML documentation' },
      { value: 'json', label: 'JSON Data', hint: 'Machine-readable JSON format' },
      { value: 'markdown', label: 'Markdown Documentation', hint: 'Human-readable documentation' }
    ]
  });

  if (isCancel(format)) {
    cancel('Operation cancelled.');
    return;
  }

  // Advanced options
  const advancedOptions = await multiselect({
    message: 'Select advanced options (use space to select):',
    options: [
      { value: 'analysis', label: 'Full Analysis', hint: 'Detect functions and data structures' },
      { value: 'enhanced-disasm', label: 'Enhanced Disassembly', hint: 'Use MCP server insights' },
      { value: 'bank-aware', label: 'Bank-Aware Addressing', hint: '24-bit addressing mode' },
      { value: 'detect-functions', label: 'Function Detection', hint: 'Automatically detect functions' },
      { value: 'generate-docs', label: 'Generate Documentation', hint: 'Create comprehensive docs' },
      { value: 'extract-assets', label: 'Extract Assets', hint: 'Also extract graphics/audio' }
    ],
    required: false
  });

  if (isCancel(advancedOptions)) {
    cancel('Operation cancelled.');
    return;
  }

  // Address range (optional)
  const useAddressRange = await confirm({
    message: 'Do you want to specify a custom address range?'
  });

  let startAddress, endAddress;
  if (useAddressRange && !isCancel(useAddressRange)) {
    startAddress = await text({
      message: 'Start address (hex, e.g., 8000):',
      placeholder: '8000',
      validate: (value) => {
        if (value && !/^[0-9A-Fa-f]+$/.test(value)) {
          return 'Please enter a valid hexadecimal address';
        }
        return;
      }
    });

    if (!isCancel(startAddress) && startAddress) {
      endAddress = await text({
        message: 'End address (hex, e.g., FFFF):',
        placeholder: 'FFFF',
        validate: (value) => {
          if (value && !/^[0-9A-Fa-f]+$/.test(value)) {
            return 'Please enter a valid hexadecimal address';
          }
          return;
        }
      });
    }
  }

  // Output directory
  const outputDir = await text({
    message: 'Output directory:',
    placeholder: './output',
    defaultValue: './output'
  });

  if (isCancel(outputDir)) {
    cancel('Operation cancelled.');
    return;
  }

  // Build CLI options
  const options: CLIOptions = {
    format: format as string,
    outputDir: outputDir as string,
    verbose: true,
    analysis: advancedOptions.includes('analysis'),
    enhancedDisasm: advancedOptions.includes('enhanced-disasm'),
    bankAware: advancedOptions.includes('bank-aware'),
    detectFunctions: advancedOptions.includes('detect-functions'),
    generateDocs: advancedOptions.includes('generate-docs'),
    extractAssets: advancedOptions.includes('extract-assets'),
    start: startAddress as string,
    end: endAddress as string
  };

  // Execute disassembly with progress tracking
  const s = spinner();
  s.start('Analyzing ROM file...');
  
  const tasks = new Listr([
    {
      title: 'Loading ROM file',
      task: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    },
    {
      title: 'Analyzing ROM structure',
      task: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    },
    {
      title: 'Disassembling code',
      task: async () => {
        await disassembleROM(romFile as string, options);
      }
    },
    {
      title: 'Generating output files',
      task: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  ], {
    rendererOptions: {
      collapseSubtasks: false,
      suffixSkips: true
    }
  });

  s.stop('ROM analysis complete!');
  
  try {
    await tasks.run();
    
    note(
      `🎉 Disassembly completed successfully!\n\n` +
      `Output format: ${chalk.cyan(format)}\n` +
      `Output directory: ${chalk.cyan(outputDir)}\n` +
      `ROM file: ${chalk.cyan(romFile)}`,
      'Success'
    );
    
    outro(chalk.green('All done! Check your output directory for the results.'));
    
  } catch (error) {
    outro(chalk.red(`Error during disassembly: ${error instanceof Error ? error.message : error}`));
  }
};

const handleAssetExtractionWorkflow = async () => {
  const romFile = await text({
    message: 'Enter the path to your SNES ROM file:',
    placeholder: './example.smc',
    validate: (value) => {
      if (!value) return 'ROM file path is required';
      if (!fs.existsSync(value)) return 'File does not exist';
      return;
    }
  });

  if (isCancel(romFile)) {
    cancel('Operation cancelled.');
    return;
  }

  const assetTypes = await multiselect({
    message: 'Select asset types to extract:',
    options: [
      { value: 'graphics', label: '🎨 Graphics', hint: 'Sprites, backgrounds, tiles' },
      { value: 'audio', label: '🎵 Audio', hint: 'Music and sound effects' },
      { value: 'text', label: '📝 Text', hint: 'Dialogue and strings' }
    ],
    required: true
  });

  if (isCancel(assetTypes)) {
    cancel('Operation cancelled.');
    return;
  }

  const outputDir = await text({
    message: 'Output directory for extracted assets:',
    placeholder: './assets',
    defaultValue: './assets'
  });

  if (isCancel(outputDir)) {
    cancel('Operation cancelled.');
    return;
  }

  const options: CLIOptions = {
    extractAssets: true,
    assetTypes: assetTypes.join(','),
    outputDir: outputDir as string,
    verbose: true
  };

  try {
    await disassembleROM(romFile as string, options);
    outro(chalk.green('Asset extraction completed successfully!'));
  } catch (error) {
    outro(chalk.red(`Error during asset extraction: ${error instanceof Error ? error.message : error}`));
  }
};

const handleBRRDecodingWorkflow = async () => {
  const brrFile = await text({
    message: 'Enter the path to your BRR audio file:',
    placeholder: './audio.brr',
    validate: (value) => {
      if (!value) return 'BRR file path is required';
      if (!fs.existsSync(value)) return 'File does not exist';
      return;
    }
  });

  if (isCancel(brrFile)) {
    cancel('Operation cancelled.');
    return;
  }

  const outputFile = await text({
    message: 'Output WAV file path:',
    placeholder: './audio.wav',
    defaultValue: path.basename(brrFile as string, '.brr') + '.wav'
  });

  if (isCancel(outputFile)) {
    cancel('Operation cancelled.');
    return;
  }

  const sampleRate = await text({
    message: 'Sample rate (Hz):',
    placeholder: '32000',
    defaultValue: '32000',
    validate: (value) => {
      if (value && (isNaN(parseInt(value)) || parseInt(value) < 1000)) {
        return 'Please enter a valid sample rate (minimum 1000 Hz)';
      }
      return;
    }
  });

  if (isCancel(sampleRate)) {
    cancel('Operation cancelled.');
    return;
  }

  const enableLooping = await confirm({
    message: 'Enable BRR loop processing?'
  });

  if (isCancel(enableLooping)) {
    cancel('Operation cancelled.');
    return;
  }

  const options: CLIOptions = {
    decodeBrr: brrFile as string,
    brrOutput: outputFile as string,
    brrSampleRate: sampleRate as string,
    brrEnableLooping: enableLooping as boolean,
    verbose: true
  };

  try {
    await disassembleROM('', options); // Empty ROM file for BRR-only processing
    outro(chalk.green('BRR decoding completed successfully!'));
  } catch (error) {
    outro(chalk.red(`Error during BRR decoding: ${error instanceof Error ? error.message : error}`));
  }
};

const handleAnalysisWorkflow = async () => {
  const romFile = await text({
    message: 'Enter the path to your SNES ROM file:',
    placeholder: './example.smc',
    validate: (value) => {
      if (!value) return 'ROM file path is required';
      if (!fs.existsSync(value)) return 'File does not exist';
      return;
    }
  });

  if (isCancel(romFile)) {
    cancel('Operation cancelled.');
    return;
  }

  const analysisTypes = await multiselect({
    message: 'Select analysis options:',
    options: [
      { value: 'functions', label: '📊 Function Analysis', hint: 'Detect and analyze functions' },
      { value: 'data-structures', label: '📊 Data Structure Analysis', hint: 'Identify data patterns' },
      { value: 'cross-references', label: '🔗 Cross References', hint: 'Track code relationships' },
      { value: 'quality-report', label: '📈 Quality Report', hint: 'Generate code quality metrics' },
      { value: 'ai-patterns', label: '🤖 AI Pattern Recognition', hint: 'Use AI for pattern detection' }
    ],
    required: true
  });

  if (isCancel(analysisTypes)) {
    cancel('Operation cancelled.');
    return;
  }

  const outputDir = await text({
    message: 'Output directory for analysis results:',
    placeholder: './analysis',
    defaultValue: './analysis'
  });

  if (isCancel(outputDir)) {
    cancel('Operation cancelled.');
    return;
  }

  const options: CLIOptions = {
    analysis: true,
    quality: analysisTypes.includes('quality-report'),
    enhancedDisasm: true,
    detectFunctions: analysisTypes.includes('functions'),
    generateDocs: true,
    disableAI: !analysisTypes.includes('ai-patterns'),
    outputDir: outputDir as string,
    format: 'html', // Best format for analysis results
    verbose: true
  };

  try {
    await disassembleROM(romFile as string, options);
    outro(chalk.green('Analysis completed successfully!'));
  } catch (error) {
    outro(chalk.red(`Error during analysis: ${error instanceof Error ? error.message : error}`));
  }
};

async function main() {
  program
    .name('snes-disasm')
    .description('SNES ROM Disassembler with AI-enhanced analysis capabilities')
    .version('1.0.0')
    .argument('[rom-file]', 'SNES ROM file to disassemble (optional in interactive mode)')
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
    .option('--decode-brr <file>', 'Decode BRR audio file to WAV format')
    .option('--brr-output <file>', 'Output file for BRR decoding (default: <brr-name>.wav)')
    .option('--brr-sample-rate <rate>', 'Sample rate for BRR output (default: 32000)', '32000')
    .option('--brr-enable-looping', 'Enable BRR loop processing')
    .option('--brr-max-samples <count>', 'Maximum samples to decode from BRR', '1000000')
    .option('--brr-info', 'Show detailed BRR file information without decoding')
    .option('--brr-to-spc <input-dir> <output-spc>', 'Convert BRR files from input directory to a single SPC file')
    .option('-i, --interactive', 'Run in interactive mode')
    .action(async (romFile: string | undefined, options: CLIOptions) => {
      // If interactive mode is requested or no ROM file provided, run interactive CLI
      if (options.interactive || !romFile) {
        await runInteractiveMode();
        return;
      }
      
      try {
        await disassembleROM(romFile, options);
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    })
    .command('brr-to-spc <input-dir> <output-spc>')
    .description('Convert BRR files to SPC format')
    .action(async (inputDir: string, outputSPC: string) => {
      try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        console.log(`Converting BRR files from ${inputDir} to ${outputSPC}...`);
        const { stdout, stderr } = await execAsync(`python3 brr_to_spc.py "${inputDir}" "${outputSPC}"`);

        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);

        console.log('✅ Conversion completed successfully!');
      } catch (error) {
        console.error('Error during BRR to SPC conversion:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    })
    .command('interactive')
    .alias('i')
    .description('🎮 Run the interactive CLI interface')
    .action(async () => {
      await runInteractiveMode();
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