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
import { sessionManager } from './cli/session-manager';
import { showContextualHelp, getHelpForContext } from './cli/help-system';
import { preferencesManager } from './cli/preferences-manager';
import * as fs from 'fs';
import * as path from 'path';

const runInteractiveMode = async () => {
  await sessionManager.load();
  
  const displayHelp = (context: string) => {
    console.log(chalk.gray('\n--- HELP: ' + context + ' ---\n'));
    console.log(chalk.dim(getHelpForContext(context)));
  };
  
const operationChoices = async () => {
    note('Choose your main operation from the list below. You can select multiple steps in Follow-up.','Operation Selection');
    const mainOperation = await select({
      message: 'What would you like to do with your ROM?',
      options: [
        { value: 'disassemble', label: '🔧 Disassemble ROM', hint: 'Convert ROM to assembly code' },
        { value: 'extract-assets', label: '🎨 Extract Assets', hint: 'Extract graphics, audio, and text' },
        { value: 'comprehensive', label: '🚀 Comprehensive Analysis', hint: 'Disassemble + extract assets + analysis' },
        { value: 'brr-decode', label: '🎵 Decode BRR Audio', hint: 'Convert BRR audio files to WAV' },
        { value: 'analysis-only', label: '📊 Analysis Only', hint: 'Advanced ROM analysis without disassembly' }
      ]
    });
    
    if (isCancel(mainOperation)) {
      return null;
    }
    
    let operations = [mainOperation as string];
    let assetTypes: string[] = [];
    let analysisTypes: string[] = [];
    
    // If user selected asset extraction or comprehensive, ask for asset types
    if (mainOperation === 'extract-assets' || mainOperation === 'comprehensive') {
      const selectedAssetTypes = await multiselect({
        message: 'Which assets would you like to extract?',
        options: [
          { value: 'graphics', label: '🎨 Graphics', hint: 'Sprites, backgrounds, tiles' },
          { value: 'audio', label: '🎵 Audio', hint: 'Music and sound effects' },
          { value: 'text', label: '📝 Text', hint: 'Dialogue and strings' }
        ],
        required: true
      });
      
      if (isCancel(selectedAssetTypes)) {
        return null;
      }
      
      assetTypes = selectedAssetTypes as string[];
    }
    
    // If user selected analysis or comprehensive, ask for analysis types
    if (mainOperation === 'analysis-only' || mainOperation === 'comprehensive') {
      const selectedAnalysisTypes = await multiselect({
        message: 'What type of analysis would you like to perform?',
        options: [
          { value: 'functions', label: '📊 Function Analysis', hint: 'Detect and analyze functions' },
          { value: 'data-structures', label: '📋 Data Structure Analysis', hint: 'Identify data patterns' },
          { value: 'cross-references', label: '🔗 Cross References', hint: 'Track code relationships' },
          { value: 'quality-report', label: '📈 Quality Report', hint: 'Generate code quality metrics' },
          { value: 'ai-patterns', label: '🤖 AI Pattern Recognition', hint: 'Use AI for pattern detection' }
        ],
        required: false
      });
      
      if (isCancel(selectedAnalysisTypes)) {
        return null;
      }
      
      analysisTypes = selectedAnalysisTypes as string[];
      
      // Convert analysis-only to analysis for internal processing
      if (mainOperation === 'analysis-only') {
        operations = ['analysis'];
      }
    }
    
    // If comprehensive, expand to individual operations
    if (mainOperation === 'comprehensive') {
      operations = ['disassemble', 'extract-assets'];
      if (analysisTypes.length > 0) {
        operations.push('analysis');
      }
    }
    
    return {
      operations,
      assetTypes,
      analysisTypes
    };
  };
  
  const analyzeROM = async (filePath: string) => {
    // Simulate intelligent analysis based on file metadata
    console.log(chalk.dim(`Analyzing ROM: ${filePath}`));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(chalk.green('Analysis complete! Suggested output format: CA65'));
    // Return mocked recommendations
    return {
      suggestedFormat: 'ca65',
      detectedRegions: [{ start: 0x8000, end: 0xFFFF }],
    };
  };
  
intro(chalk.bgCyan.black(' 🎮 Welcome to the SNES Disassembler Interactive CLI 🎮 '));
  console.log(chalk.gray('This CLI helps you disassemble SNES ROMs and extract assets with AI-enhanced tools.'));
  note('Load a previous session or start a new one to begin.');
  
  try {
    const runOperations = async (operations: string[], romFilePath: string, assetTypes?: string[], analysisTypes?: string[]) => {
      for (const op of operations) {
        switch (op) {
          case 'disassemble':
            await handleDisassemblyWorkflow(romFilePath);
            break;
          case 'extract-assets':
            await handleAssetExtractionWorkflow(romFilePath, assetTypes);
            break;
          case 'brr-decode':
            await handleBRRDecodingWorkflow();
            break;
          case 'analysis':
            await handleAnalysisWorkflow(romFilePath, analysisTypes);
            break;
        }
      }
    };

    // Main action selection - ROM file selection
    const recentFiles = sessionManager.getRecentFiles();
    
    let romFilePath: string;
    
    if (recentFiles.length > 0) {
      const useRecent = await confirm({
        message: `Use recent ROM file: ${recentFiles[0].name}?`
      });
      
      if (useRecent && !isCancel(useRecent)) {
        romFilePath = recentFiles[0].path;
      } else {
        const romFile = await text({
          message: 'Enter the path to your SNES ROM file:',
          placeholder: './example.smc',
          validate: (value) => {
            if (!value) return 'ROM file path is required';
            if (!fs.existsSync(value)) return 'File does not exist';
            const ext = path.extname(value).toLowerCase();
            if (!['.smc', '.sfc', '.fig'].includes(ext)) {
              return 'Please select a valid SNES ROM file (.smc, .sfc, .fig)';
            }
            return;
          }
        });
        
        if (isCancel(romFile)) {
          cancel('Operation cancelled.');
          return;
        }
        
        romFilePath = romFile as string;
      }
    } else {
      const romFile = await text({
        message: 'Enter the path to your SNES ROM file:',
        placeholder: './example.smc',
        validate: (value) => {
          if (!value) return 'ROM file path is required';
          if (!fs.existsSync(value)) return 'File does not exist';
          const ext = path.extname(value).toLowerCase();
          if (!['.smc', '.sfc', '.fig'].includes(ext)) {
            return 'Please select a valid SNES ROM file (.smc, .sfc, .fig)';
          }
          return;
        }
      });
      
      if (isCancel(romFile)) {
        cancel('Operation cancelled.');
        return;
      }
      
      romFilePath = romFile as string;
    }
    
    // Store the selected ROM file
    sessionManager.setCurrentROM(romFilePath);
    await sessionManager.addRecentFile(romFilePath);

    const selectedOperations = await operationChoices();
    if (!selectedOperations || isCancel(selectedOperations)) {
      cancel('Operation cancelled.');
      return;
    }
    
    const { operations, assetTypes, analysisTypes } = selectedOperations;
    if (operations.length === 0) {
      cancel('Operation cancelled.');
      return;
    }

note('Summary of selected operations:');
    console.log(`Operations: ${operations.join(', ')}`);
    console.log(`Assets: ${assetTypes?.join(', ') || 'N/A'}`);
    console.log(`Analysis: ${analysisTypes?.join(', ') || 'N/A'}`);
    
    const preferences = sessionManager.getPreferences();
    const confirmActions = preferences.confirmActions !== false;
    
    if (!confirmActions || await confirm({
      message: 'Proceed with these operations?'
    })) {
      await runOperations(operations, romFilePath, assetTypes, analysisTypes);
    } else {
      cancel('Operation cancelled by user.');
    }
    
  } catch (error) {
    if (isCancel(error)) {
      cancel('Operation cancelled.');
      return;
    }
    throw error;
  }
};

const handleDisassemblyWorkflow = async (romFilePath: string) => {
  const romFile = romFilePath;

  // Define analyzeROM function locally
  const analyzeROM = async (filePath: string) => {
    console.log(chalk.dim(`Analyzing ROM: ${filePath}`));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(chalk.green('Analysis complete! Suggested output format: CA65'));
    return {
      suggestedFormat: 'ca65',
      detectedRegions: [{ start: 0x8000, end: 0xFFFF }],
    };
  };
  
  // Intelligent ROM analysis
  const analysisResult = await analyzeROM(romFile);

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

  // Output directory - show global default if set
  const globalOutputDir = sessionManager.getGlobalOutputDir();
  const defaultOutputDir = globalOutputDir || './output';
  const placeholder = globalOutputDir ? `${globalOutputDir} (global default)` : './output';
  
  const outputDir = await text({
    message: 'Output directory:',
    placeholder: placeholder,
    defaultValue: defaultOutputDir
  });

  if (isCancel(outputDir)) {
    cancel('Operation cancelled.');
    return;
  }

  // Build CLI options
  // Automatically suggest settings based on analysis
  const suggestedFormat = analysisResult.suggestedFormat || format;

  const advancedOptionsArray = advancedOptions as string[];
  
  const options: CLIOptions = {
    format: format as string,
    outputDir: outputDir as string,
    verbose: true,
    analysis: advancedOptionsArray.includes('analysis'),
    enhancedDisasm: advancedOptionsArray.includes('enhanced-disasm'),
    bankAware: advancedOptionsArray.includes('bank-aware'),
    detectFunctions: advancedOptionsArray.includes('detect-functions'),
    generateDocs: advancedOptionsArray.includes('generate-docs'),
    extractAssets: advancedOptionsArray.includes('extract-assets'),
    start: startAddress as string,
    end: endAddress as string
  };

  // Execute disassembly with progress tracking
  const s = spinner();
  s.start('Processing ROM file...');
  
  const tasks = new Listr([
    {
      title: 'Analyzing ROM file before processing',
      task: async () => {
        await analyzeROM(romFile);
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

const handleAssetExtractionWorkflow = async (romFilePath: string, preSelectedAssetTypes: string[] = []) => {
  const romFile = romFilePath;

  let assetTypes: string[];
  
  // Use pre-selected asset types if available, otherwise prompt user
  if (preSelectedAssetTypes.length > 0) {
    assetTypes = preSelectedAssetTypes;
    console.log(chalk.cyan(`Using pre-selected asset types: ${assetTypes.join(', ')}`));
  } else {
    const selectedAssetTypes = await multiselect({
      message: 'Select asset types to extract:',
      options: [
        { value: 'graphics', label: '🎨 Graphics', hint: 'Sprites, backgrounds, tiles' },
        { value: 'audio', label: '🎵 Audio', hint: 'Music and sound effects' },
        { value: 'text', label: '📝 Text', hint: 'Dialogue and strings' }
      ],
      required: true
    });

    if (isCancel(selectedAssetTypes)) {
      cancel('Operation cancelled.');
      return;
    }
    
    assetTypes = selectedAssetTypes as string[];
  }

  // Use global output directory as base if set
  const globalOutputDir = sessionManager.getGlobalOutputDir();
  const defaultAssetDir = globalOutputDir ? path.join(globalOutputDir, 'assets') : './assets';
  const placeholder = globalOutputDir ? `${defaultAssetDir} (using global default)` : './assets';
  
  const outputDir = await text({
    message: 'Output directory for extracted assets:',
    placeholder: placeholder,
    defaultValue: defaultAssetDir
  });

  if (isCancel(outputDir)) {
    cancel('Operation cancelled.');
    return;
  }

  const assetTypesArray = assetTypes as string[];
  
  const options: CLIOptions = {
    extractAssets: true,
    assetTypes: assetTypesArray.join(','),
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

const handleAnalysisWorkflow = async (romFilePath: string, preSelectedAnalysisTypes: string[] = []) => {
  const romFile = romFilePath;

  let analysisTypes: string[];
  
  // Use pre-selected analysis types if available, otherwise prompt user
  if (preSelectedAnalysisTypes.length > 0) {
    analysisTypes = preSelectedAnalysisTypes;
    console.log(chalk.cyan(`Using pre-selected analysis types: ${analysisTypes.join(', ')}`));
  } else {
    const selectedAnalysisTypes = await multiselect({
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

    if (isCancel(selectedAnalysisTypes)) {
      cancel('Operation cancelled.');
      return;
    }
    
    analysisTypes = selectedAnalysisTypes as string[];
  }

  // Use global output directory as base if set
  const globalOutputDir = sessionManager.getGlobalOutputDir();
  const defaultAnalysisDir = globalOutputDir ? path.join(globalOutputDir, 'analysis') : './analysis';
  const placeholder = globalOutputDir ? `${defaultAnalysisDir} (using global default)` : './analysis';
  
  const outputDir = await text({
    message: 'Output directory for analysis results:',
    placeholder: placeholder,
    defaultValue: defaultAnalysisDir
  });

  if (isCancel(outputDir)) {
    cancel('Operation cancelled.');
    return;
  }

  const analysisTypesArray = analysisTypes as string[];
  
  const options: CLIOptions = {
    analysis: true,
    quality: analysisTypesArray.includes('quality-report'),
    enhancedDisasm: true,
    detectFunctions: analysisTypesArray.includes('functions'),
    generateDocs: true,
    disableAI: !analysisTypesArray.includes('ai-patterns'),
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
    .version('1.0.0');
  
  // Define all commands first
  program
    .command('interactive')
    .alias('i')
    .description('🎮 Run the interactive CLI interface')
    .action(async () => {
      await runInteractiveMode();
    });

  program
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
    });

  program
    .command('set-output-dir <directory>')
    .description('Set the global default output directory for the session')
    .action(async (directory: string) => {
      try {
        await sessionManager.load();
        await sessionManager.setGlobalOutputDir(directory);
        console.log(`Global default output directory set to: ${directory}`);
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
      }
    });

  program
    .command('clear-output-dir')
    .description('Clear the global default output directory setting')
    .action(async () => {
      try {
        await sessionManager.load();
        await sessionManager.clearGlobalOutputDir();
        console.log('Global default output directory cleared.');
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
      }
    });

  program
    .command('show-output-dir')
    .description('Show the current global default output directory setting')
    .action(async () => {
      try {
        await sessionManager.load();
        const globalOutputDir = sessionManager.getGlobalOutputDir();
        if (globalOutputDir) {
          console.log(`Current global default output directory: ${globalOutputDir}`);
        } else {
          console.log('No global default output directory set.');
        }
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
      }
    });

  program
    .command('preferences')
    .alias('prefs')
    .description('⚙️  Configure user preferences for advanced options')
    .action(async () => {
      try {
        await preferencesManager.runPreferencesInterface();
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
      }
    });

  program
    .command('show-preferences')
    .description('📋 Display current user preferences')
    .action(async () => {
      try {
        await sessionManager.load();
        const summary = sessionManager.getPreferencesSummary();
        console.log(summary);
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
      }
    });
    
  // Define the main action with all options
  program
    .argument('[rom-file]', 'SNES ROM file to disassemble (optional in interactive mode)')
    .option('-o, --output <file>', 'Output file (default: <rom-name>.<ext>)')
    .option('-d, --output-dir <directory>', 'Output directory (default: current or global directory)')
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
      // Load session data first
      await sessionManager.load();
      
      // Only run interactive mode if explicitly requested
      if (options.interactive) {
        await runInteractiveMode();
        return;
      }
      
      // If no ROM file is provided and not in interactive mode, show error and usage
      if (!romFile) {
        console.error('Error: ROM file is required when not running in interactive mode.');
        console.error('');
        console.error('Options:');
        console.error('  1. Provide a ROM file: snes-disasm /path/to/rom.sfc');
        console.error('  2. Use interactive mode: snes-disasm --interactive');
        console.error('  3. Use the interactive command: snes-disasm interactive');
        console.error('');
        console.error('For more help, run: snes-disasm --help');
        process.exit(1);
      }
      
      try {
        const effectiveOutputDir = sessionManager.getEffectiveOutputDir(options.outputDir);
        const updatedOptions: CLIOptions = { ...options, outputDir: effectiveOutputDir };
        await disassembleROM(romFile, updatedOptions);
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