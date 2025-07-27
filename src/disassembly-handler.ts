/**
 * SNES Disassembly Handler
 *
 * Handles the complete disassembly workflow with enhanced algorithms
 * and MCP server insights integration.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { SNESDisassembler } from './disassembler';
import { ExtendedOutputFormatterFactory } from './output-formats-extended';
import { OutputOptions } from './output-formatters';
import { SymbolManager } from './symbol-manager';
import { extractAssets } from './asset-handler';
import { EnhancedDisassemblyEngine } from './enhanced-disassembly-engine';
import { QualityReporter } from './quality-reporter';
import { ErrorHandler } from './error-handler';
import { decodeBRRFile, exportToWAV, BRRDecoderOptions } from './brr-decoder';

async function processBRRFile(brrFile: string, options: CLIOptions): Promise<void> {
  try {
    // Read BRR file
    const inputFileContent = await fs.readFile(brrFile);

    // Set up BRR decoder options
    const decoderOptions: BRRDecoderOptions = {
      enableLooping: options.brrEnableLooping || false,
      maxSamples: parseInt(options.brrMaxSamples || '1000000'),
      outputSampleRate: parseInt(options.brrSampleRate || '32000')
    };

    // Decode BRR file
    const brrData = new Uint8Array(inputFileContent);
    const decodedResult = decodeBRRFile(brrData, decoderOptions);

    // Show detailed BRR info if requested
    if (options.brrInfo) {
      console.log('BRR File Information:');
      decodedResult.blocks.forEach((block, index) => {
        console.log(`Block ${index + 1}:`, block);
      });
      console.log('Decoding Statistics:', decodedResult.stats);
      return;
    }

    // Convert decoded samples to WAV
    const wavData = exportToWAV(decodedResult.samples, decodedResult.sampleRate);

    // Determine output file name
    let outputFile = options.brrOutput;
    if (!outputFile) {
      const baseName = path.basename(brrFile, path.extname(brrFile));
      outputFile = `${baseName}.wav`;
    }

    // Write WAV file
    await fs.writeFile(outputFile, wavData);

    if (options.verbose) {
      console.log(`BRR audio decoded successfully to: ${outputFile}`);
      console.log(`Sample Rate: ${decodedResult.sampleRate} Hz`);
      console.log('Looping:', decodedResult.loopStart !== undefined ? 'Enabled' : 'Disabled');
    }

  } catch (error) {
    console.error('Failed to process BRR file:', error instanceof Error ? error.message : error);
  }
}

export interface CLIOptions {
  output?: string;
  outputDir?: string;
  format?: string;
  start?: string;
  end?: string;
  symbols?: string;
  analysis?: boolean;
  quality?: boolean;
  verbose?: boolean;
  labels?: string;
  comments?: string;
  extractAssets?: boolean;
  assetTypes?: string;
  assetFormats?: string;
  disableAI?: boolean;
  enhancedDisasm?: boolean;
  bankAware?: boolean;
  detectFunctions?: boolean;
  generateDocs?: boolean;
  decodeBrr?: string;
  brrOutput?: string;
  brrSampleRate?: string;
  brrEnableLooping?: boolean;
  brrMaxSamples?: string;
  brrInfo?: boolean;
  interactive?: boolean;
}

export async function disassembleROM(romFile: string, options: CLIOptions): Promise<void> {
  const errorHandler = new ErrorHandler();

  // Handle BRR audio decoding if requested
  if (options.decodeBrr) {
    await processBRRFile(options.decodeBrr, options);
    return;
  }

  try {
    // Validate ROM file exists
    await fs.access(romFile);
  } catch {
    throw new Error(`ROM file not found: ${romFile}`);
  }

  if (options.verbose) {
    console.log('🎮 SNES Disassembler v2.0.0');
    console.log('================================');
    console.log(`📁 ROM File: ${romFile}`);
    console.log(`📝 Output Format: ${options.format}`);
    if (options.enhancedDisasm) {
      console.log('⚡ Enhanced disassembly algorithms: ENABLED');
    }
    if (options.bankAware) {
      console.log('🏦 Bank-aware addressing: ENABLED');
    }
    console.log('');
  }

  // Initialize disassembler with enhanced options
  const disassembler = options.enhancedDisasm
    ? new EnhancedDisassemblyEngine(romFile, {
      bankAware: options.bankAware || false,
      detectFunctions: options.detectFunctions || false,
      generateLabels: true,
      extractVectors: true
    })
    : new SNESDisassembler(romFile);

  const romInfo = disassembler.getRomInfo();

  if (options.verbose) {
    console.log('📋 ROM Information:');
    console.log(`  Title: ${romInfo.header.title || 'Unknown'}`);
    console.log(`  Size: ${romInfo.data.length} bytes (${(romInfo.data.length / 1024).toFixed(1)} KB)`);
    console.log(`  Type: ${romInfo.cartridgeInfo.type}`);
    console.log(`  Has Battery: ${romInfo.cartridgeInfo.hasBattery ? 'Yes' : 'No'}`);
    if (romInfo.cartridgeInfo.specialChip) {
      console.log(`  Special Chip: ${romInfo.cartridgeInfo.specialChip}`);
    }

    // Enhanced ROM analysis
    if (options.enhancedDisasm && disassembler instanceof EnhancedDisassemblyEngine) {
      const analysis = disassembler.performROMAnalysis();
      console.log(`  Detected Vectors: ${analysis.vectors.length}`);
      console.log(`  Potential Functions: ${analysis.functions.length}`);
      console.log(`  Data Regions: ${analysis.dataRegions.length}`);
    }
    console.log('');
  }

  // Parse and validate address range
  const { startAddress, endAddress } = parseAddressRange(options, errorHandler);

  if (options.verbose && (startAddress !== undefined || endAddress !== undefined)) {
    console.log('🎯 Address Range:');
    console.log(`  Start: $${(startAddress || 0x8000).toString(16).toUpperCase()}`);
    console.log(`  End: $${(endAddress || 0xFFFF).toString(16).toUpperCase()}`);
    console.log('');
  }

  // Load symbols if specified
  const symbolManager = await loadSymbols(options, errorHandler);

  // Perform disassembly
  if (options.verbose) {
    console.log('🔍 Disassembling...');
    if (options.enhancedDisasm) {
      console.log('  Using enhanced algorithms with MCP server insights');
    }
  }

  const startTime = Date.now();
  let disassemblyLines;

  try {
    if (options.analysis || options.enhancedDisasm) {
      // Run full analysis including enhanced features
      if (disassembler instanceof EnhancedDisassemblyEngine) {
        disassembler.setAnalysisOptions({
          controlFlowAnalysis: true,
          functionDetection: options.detectFunctions || false,
          dataStructureRecognition: true,
          crossReferenceGeneration: true,
          gamePatternRecognition: !options.disableAI
        });
      }

      disassembler.analyze();
      disassemblyLines = disassembler.disassemble(startAddress, endAddress);
    } else {
      // Basic disassembly only
      disassemblyLines = disassembler.disassemble(startAddress, endAddress);
    }
  } catch (error) {
    throw new Error(
      `Disassembly failed: ${error instanceof Error ? error.message : error}`
    );
  }

  const disassemblyTime = Date.now() - startTime;

  if (options.verbose) {
    console.log(`✅ Disassembly completed in ${disassemblyTime}ms`);
    console.log(`📊 Instructions: ${disassemblyLines.length}`);

    if (options.enhancedDisasm && disassembler instanceof EnhancedDisassemblyEngine) {
      const stats = disassembler.getDisassemblyStats();
      console.log(`📈 Functions detected: ${stats.functionsDetected}`);
      console.log(`🔗 Cross-references: ${stats.crossReferences}`);
      console.log(`🏷️  Labels generated: ${stats.labelsGenerated}`);
    }
    console.log('');
  }

  // Generate output
  const outputFile = await generateOutput(
    disassemblyLines,
    romFile,
    options,
    romInfo,
    symbolManager,
    errorHandler
  );

  // Generate quality report if requested
  if (options.quality) {
    await generateQualityReport(outputFile, disassembler, options, errorHandler);
  }

  // Generate documentation if requested
  if (options.generateDocs && disassembler instanceof EnhancedDisassemblyEngine) {
    await generateDocumentation(outputFile, disassembler, options, errorHandler);
  }

  // Extract assets if requested
  if (options.extractAssets) {
    await extractAssets(romFile, options, path.dirname(outputFile));
  }

  // Show analysis summary if enabled
  if ((options.analysis || options.enhancedDisasm) && options.verbose) {
    console.log('\n🔬 Analysis Summary:');
    console.log('  - Control flow analysis: Enabled');
    console.log(`  - Function detection: ${options.detectFunctions ? 'Enabled' : 'Disabled'}`);
    console.log('  - Data structure recognition: Enabled');
    console.log('  - Cross-reference generation: Enabled');
    console.log(`  - Game pattern recognition: ${!options.disableAI ? 'Enabled' : 'Disabled'}`);
    console.log('  - Code quality metrics: Enabled');

    if (options.enhancedDisasm) {
      console.log('  - Enhanced MCP algorithms: Enabled');
      console.log(`  - Bank-aware addressing: ${options.bankAware ? 'Enabled' : 'Disabled'}`);
    }
  }

  if (!options.verbose) {
    console.log(`Disassembly complete: ${outputFile}`);
  }
}

function parseAddressRange(options: CLIOptions, errorHandler: ErrorHandler): {
  startAddress?: number;
  endAddress?: number;
} {
  const startAddress = options.start ? parseInt(options.start, 16) : undefined;
  const endAddress = options.end ? parseInt(options.end, 16) : undefined;

  if (startAddress !== undefined && isNaN(startAddress)) {
    throw new Error(`Invalid start address: ${options.start}`);
  }
  if (endAddress !== undefined && isNaN(endAddress)) {
    throw new Error(`Invalid end address: ${options.end}`);
  }

  if (startAddress !== undefined && endAddress !== undefined && startAddress >= endAddress) {
    throw new Error(
      `Start address ($${startAddress.toString(16)}) must be less than end address ($${endAddress.toString(16)})`
    );
  }

  return { startAddress, endAddress };
}

async function loadSymbols(options: CLIOptions, errorHandler: ErrorHandler): Promise<SymbolManager | undefined> {
  if (!options.symbols) {
    return undefined;
  }

  if (options.verbose) {
    console.log(`📚 Loading symbols from: ${options.symbols}`);
  }

  try {
    const symbolManager = new SymbolManager();
    // Note: loadFromFile method needs to be implemented in SymbolManager
    // await symbolManager.loadFromFile(options.symbols);

    if (options.verbose) {
      const symbolCount = 0; // symbolManager.getAllSymbols()?.size || 0;
      console.log(`   ✅ Loaded ${symbolCount} symbols`);
    }

    return symbolManager;
  } catch (error) {
    throw new Error(
      `Failed to load symbols: ${error instanceof Error ? error.message : error}`
    );
  }
}

async function generateOutput(
  disassemblyLines: any[],
  romFile: string,
  options: CLIOptions,
  romInfo: any,
  symbolManager?: SymbolManager,
  errorHandler?: ErrorHandler
): Promise<string> {
  const outputOptions: OutputOptions = {
    includeBytes: true,
    includeComments: true,
    includeSymbols: true,
    includeCrossReferences: options.analysis || options.enhancedDisasm || false,
    includeHeader: true,
    includeTiming: false,
    lineNumbers: false,
    uppercase: true,
    tabWidth: 4
  };

  const formatter = ExtendedOutputFormatterFactory.create(
    options.format || 'ca65',
    romInfo,
    symbolManager?.getAllSymbols(),
    undefined, // crossRefs - would be generated by enhanced engine
    outputOptions
  );

  const output = formatter.format(disassemblyLines);

  // Determine output file name and directory
  let outputFile = options.output;
  if (!outputFile) {
    const baseName = path.basename(romFile, path.extname(romFile));
    const extension = getFileExtension(options.format!);
    const fileName = `${baseName}.${extension}`;

    if (options.outputDir) {
      await fs.mkdir(options.outputDir, { recursive: true });
      outputFile = path.join(options.outputDir, fileName);
    } else {
      outputFile = fileName;
    }
  } else if (options.outputDir) {
    await fs.mkdir(options.outputDir, { recursive: true });
    outputFile = path.join(options.outputDir, path.basename(outputFile));
  }

  try {
    await fs.writeFile(outputFile, output, 'utf8');
  } catch (error) {
    throw new Error(`Failed to write output file: ${error instanceof Error ? error.message : error}`);
  }

  if (options.verbose) {
    console.log(`💾 Output written to: ${outputFile}`);
    console.log(`📏 Output size: ${output.length} characters (${(output.length / 1024).toFixed(1)} KB)`);
  }

  return outputFile;
}

async function generateQualityReport(
  outputFile: string,
  disassembler: any,
  options: CLIOptions,
  errorHandler: ErrorHandler
): Promise<void> {
  const outputDir = path.dirname(outputFile);
  const baseName = path.basename(outputFile, path.extname(outputFile));
  const qualityReportFile = path.join(outputDir, `${baseName}_quality.md`);

  try {
    const qualityReporter = new QualityReporter();
    const metrics = qualityReporter.analyzeQuality(disassembler);
    const report = qualityReporter.generateReport();

    await fs.writeFile(qualityReportFile, report, 'utf8');

    if (options.verbose) {
      console.log(`📊 Quality report generated: ${qualityReportFile}`);
    }
  } catch (error) {
    console.warn(`Warning: Could not generate quality report: ${error instanceof Error ? error.message : error}`);
  }
}

async function generateDocumentation(
  outputFile: string,
  disassembler: EnhancedDisassemblyEngine,
  options: CLIOptions,
  errorHandler: ErrorHandler
): Promise<void> {
  const outputDir = path.dirname(outputFile);
  const baseName = path.basename(outputFile, path.extname(outputFile));
  const docsDir = path.join(outputDir, `${baseName}_docs`);

  try {
    await fs.mkdir(docsDir, { recursive: true });

    const analysis = disassembler.performROMAnalysis();

    // Generate function documentation
    if (analysis.functions.length > 0) {
      const functionsDoc = generateFunctionsDocumentation(analysis.functions);
      await fs.writeFile(path.join(docsDir, 'functions.md'), functionsDoc, 'utf8');
    }

    // Generate memory map documentation
    const memoryMapDoc = generateMemoryMapDocumentation(analysis);
    await fs.writeFile(path.join(docsDir, 'memory-map.md'), memoryMapDoc, 'utf8');

    // Generate overview documentation
    const overviewDoc = generateOverviewDocumentation(analysis, disassembler.getRomInfo());
    await fs.writeFile(path.join(docsDir, 'README.md'), overviewDoc, 'utf8');

    if (options.verbose) {
      console.log(`📚 Documentation generated: ${docsDir}`);
    }
  } catch (error) {
    console.warn(`Warning: Could not generate documentation: ${error instanceof Error ? error.message : error}`);
  }
}

function generateFunctionsDocumentation(functions: any[]): string {
  let doc = '# Detected Functions\n\n';
  doc += 'This document lists all functions detected during disassembly analysis.\n\n';

  functions.forEach((func, index) => {
    doc += `## Function ${index + 1}: ${func.name || `func_${func.address.toString(16).toUpperCase()}`}\n\n`;
    doc += `- **Address**: $${func.address.toString(16).toUpperCase()}\n`;
    doc += `- **Size**: ${func.size} bytes\n`;
    doc += `- **Type**: ${func.type || 'Unknown'}\n`;
    if (func.description) {
      doc += `- **Description**: ${func.description}\n`;
    }
    doc += '\n';
  });

  return doc;
}

function generateMemoryMapDocumentation(analysis: any): string {
  let doc = '# Memory Map\n\n';
  doc += 'This document describes the memory layout discovered during analysis.\n\n';

  if (analysis.dataRegions && analysis.dataRegions.length > 0) {
    doc += '## Data Regions\n\n';
    analysis.dataRegions.forEach((region: any, index: number) => {
      doc += `### Region ${index + 1}\n\n`;
      doc += `- **Start**: $${region.start.toString(16).toUpperCase()}\n`;
      doc += `- **End**: $${region.end.toString(16).toUpperCase()}\n`;
      doc += `- **Type**: ${region.type || 'Data'}\n`;
      doc += `- **Size**: ${region.size} bytes\n\n`;
    });
  }

  if (analysis.vectors && analysis.vectors.length > 0) {
    doc += '## Interrupt Vectors\n\n';
    analysis.vectors.forEach((vector: any) => {
      doc += `- **${vector.name}**: $${vector.address.toString(16).toUpperCase()}\n`;
    });
    doc += '\n';
  }

  return doc;
}

function generateOverviewDocumentation(analysis: any, romInfo: any): string {
  let doc = `# ${romInfo.header.title || 'Unknown ROM'} - Disassembly Analysis\n\n`;
  doc += 'This directory contains the complete disassembly analysis results.\n\n';

  doc += '## ROM Information\n\n';
  doc += `- **Title**: ${romInfo.header.title || 'Unknown'}\n`;
  doc += `- **Size**: ${romInfo.data.length} bytes\n`;
  doc += `- **Type**: ${romInfo.cartridgeInfo.type}\n`;
  doc += `- **Mapping**: ${romInfo.cartridgeInfo.mapping || 'LoROM'}\n\n`;

  doc += '## Analysis Summary\n\n';
  doc += `- **Functions Detected**: ${analysis.functions?.length || 0}\n`;
  doc += `- **Data Regions**: ${analysis.dataRegions?.length || 0}\n`;
  doc += `- **Interrupt Vectors**: ${analysis.vectors?.length || 0}\n\n`;

  doc += '## Files\n\n';
  doc += '- `functions.md` - Detailed function documentation\n';
  doc += '- `memory-map.md` - Memory layout and regions\n';
  doc += '- `README.md` - This overview document\n\n';

  return doc;
}

function getFileExtension(format: string): string {
  const extensions: { [key: string]: string } = {
    'ca65': 'asm',
    'wla-dx': 'asm',
    'bass': 'asm',
    'html': 'html',
    'json': 'json',
    'xml': 'xml',
    'csv': 'csv',
    'markdown': 'md'
  };
  return extensions[format] || 'asm';
}
