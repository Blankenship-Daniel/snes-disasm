/**
 * Settings Preview and Confirmation System
 * 
 * Provides detailed preview of operations before execution
 */

import chalk from 'chalk';
import { CLIOptions } from '../disassembly-handler';
import { confirm, note } from '@clack/prompts';

export interface OperationSettings {
  romFile: string;
  operations: string[];
  options: CLIOptions;
  estimatedTime?: number;
  outputSize?: string;
}

export function generateSettingsPreview(settings: OperationSettings): string {
  const { romFile, operations, options, estimatedTime, outputSize } = settings;
  
  let preview = '';
  
  // ROM Information
  preview += chalk.bold.cyan('📁 ROM Information:\n');
  preview += `  File: ${chalk.white(romFile)}\n`;
  preview += `  Size: ${chalk.dim('Analyzing...')}\n\n`;
  
  // Operations to Perform
  preview += chalk.bold.cyan('🔧 Operations:\n');
  operations.forEach(op => {
    const opName = getOperationDisplayName(op);
    preview += `  ${chalk.green('✓')} ${opName}\n`;
  });
  preview += '\n';
  
  // Output Settings
  preview += chalk.bold.cyan('📤 Output Settings:\n');
  preview += `  Format: ${chalk.white(options.format || 'ca65')}\n`;
  preview += `  Directory: ${chalk.white(options.outputDir || './output')}\n`;
  
  if (options.start || options.end) {
    preview += `  Address Range: ${chalk.white(`$${options.start || '8000'} - $${options.end || 'FFFF'}`)}\n`;
  }
  
  preview += '\n';
  
  // Advanced Features
  if (hasAdvancedFeatures(options)) {
    preview += chalk.bold.cyan('⚡ Advanced Features:\n');
    
    if (options.analysis) {
      preview += `  ${chalk.green('✓')} Full Analysis\n`;
    }
    if (options.enhancedDisasm) {
      preview += `  ${chalk.green('✓')} Enhanced Disassembly\n`;
    }
    if (options.bankAware) {
      preview += `  ${chalk.green('✓')} Bank-Aware Addressing\n`;
    }
    if (options.detectFunctions) {
      preview += `  ${chalk.green('✓')} Function Detection\n`;
    }
    if (options.generateDocs) {
      preview += `  ${chalk.green('✓')} Generate Documentation\n`;
    }
    if (options.extractAssets) {
      preview += `  ${chalk.green('✓')} Extract Assets (${options.assetTypes || 'all'})\n`;
    }
    
    preview += '\n';
  }
  
  // Performance Estimates
  if (estimatedTime || outputSize) {
    preview += chalk.bold.cyan('⏱️ Estimates:\n');
    if (estimatedTime) {
      preview += `  Processing Time: ${chalk.white(formatTime(estimatedTime))}\n`;
    }
    if (outputSize) {
      preview += `  Output Size: ${chalk.white(outputSize)}\n`;
    }
    preview += '\n';
  }
  
  return preview;
}

export async function confirmSettings(settings: OperationSettings): Promise<boolean> {
  const preview = generateSettingsPreview(settings);
  
  note(preview, chalk.bold('Operation Summary'));
  
  const confirmed = await confirm({
    message: 'Proceed with these settings?'
  });
  
  return !!confirmed;
}

export function calculateEstimatedTime(romSize: number, operations: string[]): number {
  // Base time estimation in seconds
  let baseTime = Math.max(5, romSize / (1024 * 1024) * 10); // 10 seconds per MB
  
  // Add time for each operation
  operations.forEach(op => {
    switch (op) {
      case 'disassemble':
        baseTime += romSize / (1024 * 1024) * 20; // 20 seconds per MB for disassembly
        break;
      case 'analysis':
        baseTime += romSize / (1024 * 1024) * 30; // 30 seconds per MB for analysis
        break;
      case 'extract-assets':
        baseTime += romSize / (1024 * 1024) * 15; // 15 seconds per MB for asset extraction
        break;
      case 'brr-decode':
        baseTime += 10; // Fixed 10 seconds for BRR decoding
        break;
    }
  });
  
  return Math.round(baseTime);
}

export function estimateOutputSize(romSize: number, operations: string[], options: CLIOptions): string {
  let totalSize = 0;
  
  operations.forEach(op => {
    switch (op) {
      case 'disassemble':
        // Assembly files are typically 2-5x the ROM size
        totalSize += romSize * (options.generateDocs ? 5 : 3);
        break;
      case 'analysis':
        // Analysis reports are typically 1-2x the ROM size
        totalSize += romSize * 1.5;
        break;
      case 'extract-assets':
        // Assets can be 0.5-2x the ROM size depending on content
        totalSize += romSize * 1;
        break;
      case 'brr-decode':
        // WAV files are much larger than BRR
        totalSize += 1024 * 1024; // Assume 1MB WAV
        break;
    }
  });
  
  return formatFileSize(totalSize);
}

function getOperationDisplayName(operation: string): string {
  const displayNames: Record<string, string> = {
    'disassemble': '🔧 Disassemble ROM',
    'extract-assets': '🎨 Extract Assets',
    'brr-decode': '🎵 Decode BRR Audio',
    'analysis': '🔍 Advanced Analysis'
  };
  
  return displayNames[operation] || operation;
}

function hasAdvancedFeatures(options: CLIOptions): boolean {
  return !!(
    options.analysis ||
    options.enhancedDisasm ||
    options.bankAware ||
    options.detectFunctions ||
    options.generateDocs ||
    options.extractAssets
  );
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s` 
      : `${minutes} minutes`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 
      ? `${hours}h ${minutes}m` 
      : `${hours} hours`;
  }
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function generateOperationSummary(
  operations: string[], 
  romFile: string, 
  options: CLIOptions
): OperationSettings {
  const romSize = 4 * 1024 * 1024; // Assume 4MB ROM for estimation
  
  return {
    romFile,
    operations,
    options,
    estimatedTime: calculateEstimatedTime(romSize, operations),
    outputSize: estimateOutputSize(romSize, operations, options)
  };
}
