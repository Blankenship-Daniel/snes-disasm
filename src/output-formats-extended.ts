/**
 * Phase 4: Extended Output Formats
 *
 * Additional output formats for documentation, analysis, and integration:
 * - HTML with hyperlinked cross-references
 * - JSON export for external tools
 * - XML output format
 * - CSV export for spreadsheet analysis
 * - Markdown documentation
 * - GraphViz call graph generation
 */

import { DisassemblyLine } from './types';
import { SNESRom } from './rom-parser';
import { OutputFormatter, SymbolTableEntry, CrossReference, OutputOptions, CA65Formatter, WLADXFormatter, BassFormatter } from './output-formatters';

export class HTMLFormatter extends OutputFormatter {
  getName(): string {
    return 'HTML';
  }

  getFileExtension(): string {
    return '.html';
  }

  format(lines: DisassemblyLine[]): string {
    const output: string[] = [];

    // HTML Document structure
    output.push('<!DOCTYPE html>');
    output.push('<html lang="en">');
    output.push('<head>');
    output.push('<meta charset="UTF-8">');
    output.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    output.push(`<title>SNES Disassembly - ${this.rom.header.title}</title>`);
    output.push('<style>');
    output.push(this.getCSS());
    output.push('</style>');
    output.push('</head>');
    output.push('<body>');

    // Header section
    output.push('<div class="header">');
    output.push(`<h1>SNES ROM Disassembly: ${this.rom.header.title}</h1>`);
    output.push('<div class="rom-info">');
    output.push(`<span class="info-item">Map Mode: ${this.rom.cartridgeInfo.type}</span>`);
    output.push(`<span class="info-item">ROM Size: ${(this.rom.cartridgeInfo.romSize / 1024).toFixed(0)} KB</span>`);
    output.push(`<span class="info-item">Reset Vector: ${this.formatAddress(this.rom.header.nativeVectors.reset)}</span>`);
    if (this.rom.cartridgeInfo.specialChip) {
      output.push(`<span class="info-item">Special Chip: ${this.rom.cartridgeInfo.specialChip}</span>`);
    }
    output.push('</div>');
    output.push('</div>');

    // Navigation sidebar
    if (this.options.includeSymbols && this.symbols.size > 0) {
      output.push('<div class="sidebar">');
      output.push('<h3>Symbols</h3>');
      output.push('<div class="symbol-list">');

      const sortedSymbols = Array.from(this.symbols.entries()).sort((a, b) => a[0] - b[0]);
      for (const [address, symbol] of sortedSymbols) {
        const cssClass = symbol.type.toLowerCase();
        output.push(`<a href="#addr_${address.toString(16)}" class="symbol ${cssClass}">`);
        output.push(`${symbol.name} (${this.formatAddress(address)})</a>`);
      }
      output.push('</div>');
      output.push('</div>');
    }

    // Main disassembly content
    output.push('<div class="main-content">');
    output.push('<div class="disassembly">');

    for (const line of lines) {
      output.push(this.formatHTMLLine(line));
    }

    output.push('</div>');
    output.push('</div>');

    // Cross-references section
    if (this.options.includeCrossReferences && this.crossRefs.length > 0) {
      output.push('<div class="cross-references">');
      output.push('<h3>Cross References</h3>');
      output.push('<table class="xref-table">');
      output.push('<thead><tr><th>From</th><th>To</th><th>Type</th><th>Instruction</th></tr></thead>');
      output.push('<tbody>');

      for (const ref of this.crossRefs) {
        output.push('<tr>');
        output.push(`<td><a href="#addr_${ref.fromAddress.toString(16)}">${this.formatAddress(ref.fromAddress)}</a></td>`);
        output.push(`<td><a href="#addr_${ref.toAddress.toString(16)}">${this.formatAddress(ref.toAddress)}</a></td>`);
        output.push(`<td>${ref.type}</td>`);
        output.push(`<td>${ref.instruction || ''}</td>`);
        output.push('</tr>');
      }

      output.push('</tbody>');
      output.push('</table>');
      output.push('</div>');
    }

    output.push('</body>');
    output.push('</html>');

    return output.join('\n');
  }

  private getCSS(): string {
    return `
      body { font-family: 'Courier New', monospace; margin: 0; padding: 0; background: #f5f5f5; }
      .header { background: #2c3e50; color: white; padding: 20px; border-bottom: 3px solid #3498db; }
      .header h1 { margin: 0; font-size: 24px; }
      .rom-info { margin-top: 10px; }
      .info-item { display: inline-block; background: #34495e; padding: 5px 10px; margin-right: 10px; border-radius: 3px; }
      .sidebar { position: fixed; left: 0; top: 120px; width: 250px; height: calc(100vh - 120px); overflow-y: auto; background: white; border-right: 1px solid #ddd; padding: 15px; }
      .main-content { margin-left: 280px; padding: 20px; }
      .symbol-list { max-height: 400px; overflow-y: auto; }
      .symbol { display: block; padding: 3px 5px; text-decoration: none; color: #2c3e50; border-radius: 2px; margin: 1px 0; }
      .symbol:hover { background: #ecf0f1; }
      .symbol.code { border-left: 3px solid #3498db; }
      .symbol.data { border-left: 3px solid #e74c3c; }
      .symbol.vector { border-left: 3px solid #f39c12; }
      .symbol.register { border-left: 3px solid #9b59b6; }
      .disassembly { background: white; border: 1px solid #ddd; border-radius: 5px; }
      .line { padding: 2px 10px; border-bottom: 1px solid #f8f9fa; font-size: 14px; }
      .line:hover { background: #f8f9fa; }
      .line.has-label { border-top: 2px solid #3498db; margin-top: 10px; }
      .address { color: #7f8c8d; font-weight: bold; }
      .bytes { color: #95a5a6; }
      .mnemonic { color: #2c3e50; font-weight: bold; }
      .operand { color: #8e44ad; }
      .operand.symbol { color: #27ae60; font-weight: bold; }
      .comment { color: #27ae60; font-style: italic; }
      .label { font-weight: bold; color: #c0392b; margin-right: 10px; }
      .cross-references { margin-top: 30px; background: white; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
      .xref-table { width: 100%; border-collapse: collapse; }
      .xref-table th, .xref-table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
      .xref-table th { background: #ecf0f1; font-weight: bold; }
      .xref-table a { color: #3498db; text-decoration: none; }
      .xref-table a:hover { text-decoration: underline; }
    `;
  }

  private formatHTMLLine(line: DisassemblyLine): string {
    const addressId = `addr_${line.address.toString(16)}`;
    const hasLabel = !!line.label;

    let output = `<div class="line${hasLabel ? ' has-label' : ''}" id="${addressId}">`;

    // Add label if present
    if (line.label) {
      output += `<span class="label">${line.label}:</span>`;
    }

    // Format address
    output += `<span class="address">${this.formatAddress(line.address)}:</span> `;

    // Format bytes if requested
    if (this.options.includeBytes) {
      output += `<span class="bytes">${this.formatBytes(line.bytes).padEnd(12)}</span> `;
    }

    // Format instruction
    output += `<span class="mnemonic">${line.instruction.mnemonic.toUpperCase()}</span>`;

    // Format operand
    const operandStr = this.formatHTMLOperand(line);
    if (operandStr) {
      output += ` ${operandStr}`;
    }

    // Add comment
    if (this.options.includeComments && line.comment) {
      output += ` <span class="comment">; ${line.comment}</span>`;
    }

    output += '</div>';
    return output;
  }

  private formatHTMLOperand(line: DisassemblyLine): string {
    if (line.operand === undefined) {
      return '';
    }

    const symbolName = this.getSymbolName(line.operand);
    if (symbolName) {
      const targetId = `addr_${line.operand.toString(16)}`;
      return `<a href="#${targetId}" class="operand symbol">${symbolName}</a>`;
    }

    const formattedOperand = this.formatOperand(line);
    return `<span class="operand">${formattedOperand}</span>`;
  }
}

export class JSONFormatter extends OutputFormatter {
  getName(): string {
    return 'JSON';
  }

  getFileExtension(): string {
    return '.json';
  }

  format(lines: DisassemblyLine[]): string {
    const data = {
      metadata: {
        title: this.rom.header.title,
        cartridgeType: this.rom.cartridgeInfo.type,
        romSize: this.rom.cartridgeInfo.romSize,
        resetVector: this.rom.header.nativeVectors.reset,
        specialChip: this.rom.cartridgeInfo.specialChip,
        generatedBy: 'SNES Disassembler',
        generatedAt: new Date().toISOString(),
        format: 'JSON'
      },
      symbols: this.serializeSymbols(),
      crossReferences: this.crossRefs,
      disassembly: lines.map(line => ({
        address: line.address,
        addressHex: line.address.toString(16).toUpperCase().padStart(6, '0'),
        bytes: line.bytes,
        bytesHex: line.bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')),
        instruction: {
          opcode: line.instruction.opcode,
          mnemonic: line.instruction.mnemonic,
          addressingMode: line.instruction.addressingMode,
          bytes: line.instruction.bytes,
          cycles: line.instruction.cycles
        },
        operand: line.operand,
        operandHex: line.operand?.toString(16).toUpperCase().padStart(line.operand <= 0xFF ? 2 : line.operand <= 0xFFFF ? 4 : 6, '0'),
        label: line.label,
        comment: line.comment
      }))
    };

    return JSON.stringify(data, null, 2);
  }

  private serializeSymbols(): any[] {
    return Array.from(this.symbols.entries()).map(([address, symbol]) => ({
      address,
      addressHex: address.toString(16).toUpperCase().padStart(6, '0'),
      name: symbol.name,
      type: symbol.type,
      scope: symbol.scope,
      size: symbol.size,
      description: symbol.description,
      references: symbol.references
    }));
  }
}

export class XMLFormatter extends OutputFormatter {
  getName(): string {
    return 'XML';
  }

  getFileExtension(): string {
    return '.xml';
  }

  format(lines: DisassemblyLine[]): string {
    const output: string[] = [];

    output.push('<?xml version="1.0" encoding="UTF-8"?>');
    output.push('<snes-disassembly>');

    // Metadata
    output.push('  <metadata>');
    output.push(`    <title>${this.escapeXML(this.rom.header.title)}</title>`);
    output.push(`    <cartridge-type>${this.rom.cartridgeInfo.type}</cartridge-type>`);
    output.push(`    <rom-size>${this.rom.cartridgeInfo.romSize}</rom-size>`);
    output.push(`    <reset-vector>0x${this.rom.header.nativeVectors.reset.toString(16).toUpperCase()}</reset-vector>`);
    if (this.rom.cartridgeInfo.specialChip) {
      output.push(`    <special-chip>${this.rom.cartridgeInfo.specialChip}</special-chip>`);
    }
    output.push('    <generated-by>SNES Disassembler</generated-by>');
    output.push(`    <generated-at>${new Date().toISOString()}</generated-at>`);
    output.push('  </metadata>');

    // Symbols
    if (this.symbols.size > 0) {
      output.push('  <symbols>');
      for (const [address, symbol] of this.symbols) {
        output.push(`    <symbol address="0x${address.toString(16).toUpperCase().padStart(6, '0')}">`);
        output.push(`      <name>${this.escapeXML(symbol.name)}</name>`);
        output.push(`      <type>${symbol.type}</type>`);
        output.push(`      <scope>${symbol.scope}</scope>`);
        if (symbol.size !== undefined) {
          output.push(`      <size>${symbol.size}</size>`);
        }
        if (symbol.description) {
          output.push(`      <description>${this.escapeXML(symbol.description)}</description>`);
        }
        output.push('    </symbol>');
      }
      output.push('  </symbols>');
    }

    // Cross References
    if (this.crossRefs.length > 0) {
      output.push('  <cross-references>');
      for (const ref of this.crossRefs) {
        output.push(`    <reference from="0x${ref.fromAddress.toString(16).toUpperCase()}" to="0x${ref.toAddress.toString(16).toUpperCase()}" type="${ref.type}">`);
        if (ref.instruction) {
          output.push(`      <instruction>${this.escapeXML(ref.instruction)}</instruction>`);
        }
        output.push('    </reference>');
      }
      output.push('  </cross-references>');
    }

    // Disassembly
    output.push('  <disassembly>');
    for (const line of lines) {
      output.push(`    <line address="0x${line.address.toString(16).toUpperCase().padStart(6, '0')}">`);

      if (line.label) {
        output.push(`      <label>${this.escapeXML(line.label)}</label>`);
      }

      output.push('      <bytes>');
      for (const byte of line.bytes) {
        output.push(`        <byte>0x${byte.toString(16).toUpperCase().padStart(2, '0')}</byte>`);
      }
      output.push('      </bytes>');

      output.push('      <instruction>');
      output.push(`        <opcode>0x${line.instruction.opcode.toString(16).toUpperCase().padStart(2, '0')}</opcode>`);
      output.push(`        <mnemonic>${line.instruction.mnemonic}</mnemonic>`);
      output.push(`        <addressing-mode>${line.instruction.addressingMode}</addressing-mode>`);
      output.push(`        <byte-count>${line.instruction.bytes}</byte-count>`);

      const cycles = typeof line.instruction.cycles === 'number' ?
        line.instruction.cycles : line.instruction.cycles.base;
      output.push(`        <cycles>${cycles}</cycles>`);
      output.push('      </instruction>');

      if (line.operand !== undefined) {
        output.push(`      <operand value="0x${line.operand.toString(16).toUpperCase()}">${this.formatOperand(line)}</operand>`);
      }

      if (line.comment) {
        output.push(`      <comment>${this.escapeXML(line.comment)}</comment>`);
      }

      output.push('    </line>');
    }
    output.push('  </disassembly>');

    output.push('</snes-disassembly>');

    return output.join('\n');
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

export class CSVFormatter extends OutputFormatter {
  getName(): string {
    return 'CSV';
  }

  getFileExtension(): string {
    return '.csv';
  }

  format(lines: DisassemblyLine[]): string {
    const output: string[] = [];

    // CSV Header
    const headers = [
      'Address',
      'AddressHex',
      'Bytes',
      'BytesHex',
      'Opcode',
      'OpcodeHex',
      'Mnemonic',
      'AddressingMode',
      'InstructionBytes',
      'Cycles',
      'Operand',
      'OperandHex',
      'OperandFormatted',
      'Label',
      'Comment'
    ];

    output.push(headers.join(','));

    // CSV Data
    for (const line of lines) {
      const row = [
        line.address.toString(),
        `"${line.address.toString(16).toUpperCase().padStart(6, '0')}"`,
        `"${line.bytes.join(' ')}"`,
        `"${line.bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')}"`,
        line.instruction.opcode.toString(),
        `"${line.instruction.opcode.toString(16).toUpperCase().padStart(2, '0')}"`,
        `"${line.instruction.mnemonic}"`,
        `"${line.instruction.addressingMode}"`,
        line.instruction.bytes.toString(),
        typeof line.instruction.cycles === 'number' ?
          line.instruction.cycles.toString() :
          line.instruction.cycles.base.toString(),
        line.operand?.toString() || '',
        line.operand ? `"${line.operand.toString(16).toUpperCase()}"` : '""',
        `"${this.formatOperand(line)}"`,
        line.label ? `"${line.label}"` : '""',
        line.comment ? `"${line.comment.replace(/"/g, '""')}"` : '""'
      ];

      output.push(row.join(','));
    }

    return output.join('\n');
  }
}

export class MarkdownFormatter extends OutputFormatter {
  getName(): string {
    return 'Markdown';
  }

  getFileExtension(): string {
    return '.md';
  }

  format(lines: DisassemblyLine[]): string {
    const output: string[] = [];

    // Markdown Header
    output.push(`# SNES ROM Disassembly: ${this.rom.header.title}`);
    output.push('');
    output.push('## ROM Information');
    output.push('');
    output.push(`- **Title:** ${this.rom.header.title}`);
    output.push(`- **Cartridge Type:** ${this.rom.cartridgeInfo.type}`);
    output.push(`- **ROM Size:** ${(this.rom.cartridgeInfo.romSize / 1024).toFixed(0)} KB`);
    output.push(`- **Reset Vector:** ${this.formatAddress(this.rom.header.nativeVectors.reset)}`);
    if (this.rom.cartridgeInfo.specialChip) {
      output.push(`- **Special Chip:** ${this.rom.cartridgeInfo.specialChip}`);
    }
    output.push(`- **Generated:** ${new Date().toISOString()}`);
    output.push('');

    // Symbols table
    if (this.options.includeSymbols && this.symbols.size > 0) {
      output.push('## Symbols');
      output.push('');
      output.push('| Address | Name | Type | Scope | Description |');
      output.push('|---------|------|------|-------|-------------|');

      const sortedSymbols = Array.from(this.symbols.entries()).sort((a, b) => a[0] - b[0]);
      for (const [address, symbol] of sortedSymbols) {
        const desc = symbol.description || '';
        output.push(`| ${this.formatAddress(address)} | \`${symbol.name}\` | ${symbol.type} | ${symbol.scope} | ${desc} |`);
      }
      output.push('');
    }

    // Disassembly
    output.push('## Disassembly');
    output.push('');
    output.push('```assembly');

    for (const line of lines) {
      let lineStr = '';

      // Add label if present
      if (line.label) {
        output.push(`${line.label}:`);
      }

      // Format instruction line
      lineStr += `${this.formatAddress(line.address)}: `;

      if (this.options.includeBytes) {
        lineStr += `${this.formatBytes(line.bytes).padEnd(12)} `;
      }

      lineStr += `${line.instruction.mnemonic.toUpperCase().padEnd(4)}`;

      const operandStr = this.formatOperand(line);
      if (operandStr) {
        lineStr += ` ${operandStr}`;
      }

      if (this.options.includeComments && line.comment) {
        lineStr = lineStr.padEnd(40) + ` ; ${line.comment}`;
      }

      output.push(lineStr);
    }

    output.push('```');
    output.push('');

    // Cross-references
    if (this.options.includeCrossReferences && this.crossRefs.length > 0) {
      output.push('## Cross References');
      output.push('');
      output.push('| From | To | Type | Instruction |');
      output.push('|------|----|----|-------------|');

      for (const ref of this.crossRefs) {
        output.push(`| ${this.formatAddress(ref.fromAddress)} | ${this.formatAddress(ref.toAddress)} | ${ref.type} | ${ref.instruction || ''} |`);
      }
      output.push('');
    }

    return output.join('\n');
  }
}

// Update the factory to include new formats
export class ExtendedOutputFormatterFactory {
  static create(format: string, rom: SNESRom, symbols?: Map<number, SymbolTableEntry>,
    crossRefs?: CrossReference[], options?: OutputOptions): OutputFormatter {
    switch (format.toLowerCase()) {
    case 'ca65':
      return new CA65Formatter(rom, symbols, crossRefs, options);
    case 'wla-dx':
    case 'wladx':
      return new WLADXFormatter(rom, symbols, crossRefs, options);
    case 'bass':
      return new BassFormatter(rom, symbols, crossRefs, options);
    case 'html':
      return new HTMLFormatter(rom, symbols, crossRefs, options);
    case 'json':
      return new JSONFormatter(rom, symbols, crossRefs, options);
    case 'xml':
      return new XMLFormatter(rom, symbols, crossRefs, options);
    case 'csv':
      return new CSVFormatter(rom, symbols, crossRefs, options);
    case 'markdown':
    case 'md':
      return new MarkdownFormatter(rom, symbols, crossRefs, options);
    default:
      throw new Error(`Unsupported output format: ${format}`);
    }
  }

  static getSupportedFormats(): string[] {
    return ['ca65', 'wla-dx', 'bass', 'html', 'json', 'xml', 'csv', 'markdown'];
  }
}

// Re-export classes from output-formatters.ts for convenience
export { CA65Formatter, WLADXFormatter, BassFormatter, SymbolTableEntry, CrossReference, OutputOptions } from './output-formatters';
