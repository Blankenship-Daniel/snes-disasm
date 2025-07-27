/**
 * Contextual Help System for SNES Disassembler CLI
 */

import chalk from 'chalk';

interface HelpContent {
  title: string;
  description: string;
  examples?: string[];
  tips?: string[];
  relatedCommands?: string[];
}

const helpDatabase: Record<string, HelpContent> = {
  'file-selection': {
    title: 'ROM File Selection',
    description: `Select a valid SNES ROM file to work with.
    
Supported formats:
• .smc - Super Magicom ROM format (most common)
• .sfc - Super Famicom ROM format
• .fig - Pro Fighter format

The file browser will only show valid ROM files. You can navigate using arrow keys and press Enter to select.`,
    tips: [
      'ROM files are typically 1-4MB in size',
      'The tool will validate the ROM header automatically',
      'Recent files are remembered for quick access'
    ]
  },

  'output-formats': {
    title: 'Output Formats',
    description: `Choose the output format that best suits your needs:

• CA65: Compatible with the cc65 development suite
• WLA-DX: Compatible with WLA-DX assembler
• BASS: Compatible with BASS assembler
• HTML: Interactive documentation with cross-references
• JSON: Machine-readable format for further processing
• Markdown: Human-readable documentation`,
    examples: [
      'Use CA65 for homebrew development',
      'Use HTML for ROM analysis and documentation',
      'Use JSON for automated processing'
    ]
  },

  'address-ranges': {
    title: 'Address Ranges',
    description: `Specify memory address ranges to disassemble specific sections.

Common SNES memory regions:
• $8000-$FFFF: ROM data (LoROM)
• $C00000-$FFFFFF: ROM data (HiROM)
• $7E0000-$7FFFFF: Work RAM
• $000000-$1FFFFF: System area

Enter addresses in hexadecimal without the $ prefix.`,
    examples: [
      '8000 FFFF - Full LoROM area',
      'C00000 FFFFFF - Full HiROM area',
      '8000 9FFF - First 8KB of ROM'
    ],
    tips: [
      'Leave blank to disassemble entire ROM',
      'Use smaller ranges for faster processing',
      'Check ROM header to determine mapping mode'
    ]
  },

  'advanced-options': {
    title: 'Advanced Options',
    description: `Advanced analysis features:

• Full Analysis: Deep code analysis with function detection
• Enhanced Disassembly: Uses AI/MCP insights for better results
• Bank-Aware Addressing: Proper 24-bit SNES addressing
• Function Detection: Automatically identifies subroutines
• Generate Documentation: Creates comprehensive code docs
• Extract Assets: Also extracts graphics, audio, and text`,
    tips: [
      'Full Analysis takes longer but provides better results',
      'Bank-aware addressing is essential for HiROM games',
      'Function detection helps understand code structure'
    ]
  },

  'asset-extraction': {
    title: 'Asset Extraction',
    description: `Extract game assets from the ROM:

• Graphics: Sprites, backgrounds, tiles, palettes
• Audio: Music tracks, sound effects, samples
• Text: Dialogue, menus, item names

The tool will attempt to identify and extract common asset formats used in SNES games.`,
    tips: [
      'Not all games store assets in standard formats',
      'Extraction success varies by game engine',
      'Check the output directory for organized assets'
    ]
  },

  'brr-decoding': {
    title: 'BRR Audio Decoding',
    description: `BRR (Bit Rate Reduction) is the SNES audio sample format.

Sample rates:
• 32000 Hz: Standard rate for most samples
• 16000 Hz: Lower quality, smaller size
• 8000 Hz: Voice samples

Looping: Enable if the sample has loop points defined.`,
    examples: [
      'Most music samples: 32000 Hz with looping',
      'Sound effects: varies, usually no looping',
      'Voice samples: often 8000-16000 Hz'
    ]
  },

  'analysis-options': {
    title: 'Analysis Options',
    description: `Advanced ROM analysis features:

• Function Analysis: Identifies subroutines and their relationships
• Data Structure Analysis: Finds tables, arrays, and data patterns
• Cross References: Tracks how code sections reference each other
• Quality Report: Generates code quality and complexity metrics
• AI Pattern Recognition: Uses machine learning to identify game-specific patterns`,
    tips: [
      'Function analysis is most useful for understanding code flow',
      'Data structure analysis helps find game data',
      'Quality reports help assess ROM organization'
    ]
  },

  'batch-operations': {
    title: 'Batch Operations',
    description: `Process multiple ROM files with the same settings:

1. Select multiple ROM files
2. Configure common settings
3. Choose whether to process concurrently
4. Monitor progress for each file

This is useful for analyzing ROM hacks or comparing different versions.`,
    tips: [
      'Use consistent naming for easier comparison',
      'Concurrent processing is faster but uses more resources',
      'Results are saved in separate directories per ROM'
    ]
  }
};

export function getHelpForContext(context: string): string {
  const help = helpDatabase[context];
  if (!help) {
    return `No help available for context: ${context}`;
  }

  let output = help.description;
  
  if (help.examples && help.examples.length > 0) {
    output += '\n\n' + chalk.yellow('Examples:');
    help.examples.forEach(example => {
      output += '\n  • ' + example;
    });
  }
  
  if (help.tips && help.tips.length > 0) {
    output += '\n\n' + chalk.green('Tips:');
    help.tips.forEach(tip => {
      output += '\n  💡 ' + tip;
    });
  }
  
  if (help.relatedCommands && help.relatedCommands.length > 0) {
    output += '\n\n' + chalk.blue('Related:');
    help.relatedCommands.forEach(cmd => {
      output += '\n  → ' + cmd;
    });
  }

  return output;
}

export function showContextualHelp(context: string): void {
  console.log(chalk.gray('\n┌─ HELP: ' + context.toUpperCase() + ' ─'.padEnd(50, '─')));
  console.log(chalk.dim(getHelpForContext(context).split('\n').map(line => '│ ' + line).join('\n')));
  console.log(chalk.gray('└' + '─'.repeat(50)));
  console.log(chalk.dim('\nPress any key to continue...'));
}

export function getAvailableHelpTopics(): string[] {
  return Object.keys(helpDatabase);
}

export function searchHelp(query: string): string[] {
  const results: string[] = [];
  const lowerQuery = query.toLowerCase();
  
  Object.entries(helpDatabase).forEach(([key, content]) => {
    if (
      key.toLowerCase().includes(lowerQuery) ||
      content.title.toLowerCase().includes(lowerQuery) ||
      content.description.toLowerCase().includes(lowerQuery)
    ) {
      results.push(key);
    }
  });
  
  return results;
}
