/**
 * Phase 4: Symbol Table Management System
 *
 * Comprehensive symbol management with external file support:
 * - Symbol export/import (.sym, .mlb files)
 * - Symbol name suggestion based on usage patterns
 * - Symbol conflict resolution
 * - Bulk symbol operations
 * - Symbol validation and verification
 */

import { SymbolTableEntry } from './output-formatters';
import * as fs from 'fs';
import * as path from 'path';

export interface SymbolValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SymbolConflict {
  address: number;
  existingSymbol: SymbolTableEntry;
  conflictingSymbol: SymbolTableEntry;
  conflictType: 'NAME_DUPLICATE' | 'ADDRESS_DUPLICATE' | 'SCOPE_CONFLICT';
}

export interface BulkOperationResult {
  succeeded: number;
  failed: number;
  conflicts: SymbolConflict[];
  errors: string[];
}

export class SymbolManager {
  private symbols: Map<number, SymbolTableEntry>;
  private nameToAddress: Map<string, number>;
  private readonly reservedNames: Set<string>;

  constructor() {
    this.symbols = new Map();
    this.nameToAddress = new Map();
    this.reservedNames = new Set([
      // 65816 registers
      'A', 'X', 'Y', 'S', 'P', 'PC', 'PBR', 'DBR', 'D',
      // SNES hardware registers (common ones)
      'INIDISP', 'OBSEL', 'OAMADDL', 'OAMADDH', 'OAMDATA', 'BGMODE', 'MOSAIC',
      'BG1SC', 'BG2SC', 'BG3SC', 'BG4SC', 'BG12NBA', 'BG34NBA',
      'BG1HOFS', 'BG1VOFS', 'BG2HOFS', 'BG2VOFS', 'BG3HOFS', 'BG3VOFS', 'BG4HOFS', 'BG4VOFS',
      'VMAIN', 'VMADDL', 'VMADDH', 'VMDATAL', 'VMDATAH',
      'CGADD', 'CGDATA',
      'W12SEL', 'W34SEL', 'WOBJSEL', 'WH0', 'WH1', 'WH2', 'WH3', 'WBGLOG', 'WOBJLOG', 'TM', 'TS',
      'TMW', 'TSW', 'CGWSEL', 'CGADSUB', 'COLDATA',
      'SETINI',
      'NMITIMEN', 'WRIO', 'WRMPYA', 'WRMPYB', 'WRDIVL', 'WRDIVH', 'WRDIVB',
      'HTIMEL', 'HTIMEH', 'VTIMEL', 'VTIMEH',
      'MDMAEN', 'HDMAEN',
      'MEMSEL'
    ]);
  }

  /**
   * Add a symbol to the table
   */
  addSymbol(address: number, entry: SymbolTableEntry): SymbolValidationResult {
    const validation = this.validateSymbol(entry);
    if (!validation.isValid) {
      return validation;
    }

    // Check for conflicts
    const existingByAddress = this.symbols.get(address);
    const existingByName = this.nameToAddress.get(entry.name);

    if (existingByAddress && existingByAddress.name !== entry.name) {
      validation.errors.push(`Address ${address.toString(16).toUpperCase()} already has symbol '${existingByAddress.name}'`);
      validation.isValid = false;
    }

    if (existingByName && existingByName !== address) {
      validation.errors.push(`Symbol name '${entry.name}' already exists at address ${existingByName.toString(16).toUpperCase()}`);
      validation.isValid = false;
    }

    if (validation.isValid) {
      this.symbols.set(address, entry);
      this.nameToAddress.set(entry.name, address);
    }

    return validation;
  }

  /**
   * Remove a symbol by address
   */
  removeSymbol(address: number): boolean {
    const symbol = this.symbols.get(address);
    if (symbol) {
      this.symbols.delete(address);
      this.nameToAddress.delete(symbol.name);
      return true;
    }
    return false;
  }

  /**
   * Get symbol by address
   */
  getSymbol(address: number): SymbolTableEntry | undefined {
    return this.symbols.get(address);
  }

  /**
   * Get address by symbol name
   */
  getAddress(name: string): number | undefined {
    return this.nameToAddress.get(name);
  }

  /**
   * Get all symbols
   */
  getAllSymbols(): Map<number, SymbolTableEntry> {
    return new Map(this.symbols);
  }

  /**
   * Validate a symbol entry
   */
  private validateSymbol(entry: SymbolTableEntry): SymbolValidationResult {
    const result: SymbolValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check name validity
    if (!entry.name || entry.name.trim().length === 0) {
      result.errors.push('Symbol name cannot be empty');
      result.isValid = false;
    }

    // Check for reserved names
    if (this.reservedNames.has(entry.name.toUpperCase())) {
      result.warnings.push(`Symbol name '${entry.name}' is a reserved name`);
    }

    // Check name format (assembly identifier rules)
    const nameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!nameRegex.test(entry.name)) {
      result.errors.push(`Symbol name '${entry.name}' is not a valid assembly identifier`);
      result.isValid = false;
    }

    // Check address validity
    if (entry.address < 0 || entry.address > 0xFFFFFF) {
      result.errors.push(`Address ${entry.address.toString(16)} is out of valid range (0x000000-0xFFFFFF)`);
      result.isValid = false;
    }

    // Check size validity
    if (entry.size !== undefined && entry.size <= 0) {
      result.errors.push('Symbol size must be positive');
      result.isValid = false;
    }

    return result;
  }

  /**
   * Generate symbol names based on address patterns and context
   */
  generateSymbolName(address: number, type: SymbolTableEntry['type'], context?: string): string {
    const prefix = this.getSymbolPrefix(type, address);
    const suffix = address.toString(16).toUpperCase().padStart(6, '0');

    let baseName = `${prefix}_${suffix}`;

    // Add context if provided
    if (context) {
      baseName = `${context}_${baseName}`;
    }

    // Ensure uniqueness
    let counter = 1;
    let finalName = baseName;
    while (this.nameToAddress.has(finalName)) {
      finalName = `${baseName}_${counter}`;
      counter++;
    }

    return finalName;
  }

  private getSymbolPrefix(type: SymbolTableEntry['type'], address: number): string {
    switch (type) {
    case 'CODE':
      return this.isVectorAddress(address) ? 'vector' : 'func';
    case 'DATA':
      return 'data';
    case 'VECTOR':
      return 'vector';
    case 'REGISTER':
      return 'reg';
    case 'CONSTANT':
      return 'const';
    default:
      return 'sym';
    }
  }

  private isVectorAddress(address: number): boolean {
    // Common SNES vector addresses
    const vectorAddresses = [
      0xFFE4, 0xFFE6, 0xFFE8, 0xFFEA, 0xFFEC, 0xFFEE, // Native mode vectors
      0xFFF4, 0xFFF6, 0xFFF8, 0xFFFA, 0xFFFC, 0xFFFE  // Emulation mode vectors
    ];
    return vectorAddresses.includes(address);
  }

  /**
   * Bulk symbol operations
   */
  bulkAddSymbols(symbols: Map<number, SymbolTableEntry>): BulkOperationResult {
    const result: BulkOperationResult = {
      succeeded: 0,
      failed: 0,
      conflicts: [],
      errors: []
    };

    for (const [address, entry] of symbols) {
      const validation = this.validateSymbol(entry);
      if (validation.isValid) {
        const existingByAddress = this.symbols.get(address);
        const existingByName = this.nameToAddress.get(entry.name);

        let hasConflict = false;

        if (existingByAddress && existingByAddress.name !== entry.name) {
          result.conflicts.push({
            address,
            existingSymbol: existingByAddress,
            conflictingSymbol: entry,
            conflictType: 'ADDRESS_DUPLICATE'
          });
          hasConflict = true;
        }

        if (existingByName && existingByName !== address) {
          result.conflicts.push({
            address,
            existingSymbol: this.symbols.get(existingByName)!,
            conflictingSymbol: entry,
            conflictType: 'NAME_DUPLICATE'
          });
          hasConflict = true;
        }

        if (!hasConflict) {
          this.symbols.set(address, entry);
          this.nameToAddress.set(entry.name, address);
          result.succeeded++;
        } else {
          result.failed++;
        }
      } else {
        result.errors.push(`Invalid symbol at ${address.toString(16)}: ${validation.errors.join(', ')}`);
        result.failed++;
      }
    }

    return result;
  }

  /**
   * Export symbols to various formats
   */
  exportToFile(filePath: string, format: 'sym' | 'mlb' | 'json' | 'csv'): void {
    const ext = path.extname(filePath).toLowerCase();
    const actualFormat = format || this.getFormatFromExtension(ext);

    switch (actualFormat) {
    case 'sym':
      this.exportToSymFile(filePath);
      break;
    case 'mlb':
      this.exportToMLBFile(filePath);
      break;
    case 'json':
      this.exportToJSONFile(filePath);
      break;
    case 'csv':
      this.exportToCSVFile(filePath);
      break;
    default:
      throw new Error(`Unsupported export format: ${actualFormat}`);
    }
  }

  private getFormatFromExtension(ext: string): 'sym' | 'mlb' | 'json' | 'csv' {
    switch (ext) {
    case '.sym': return 'sym';
    case '.mlb': return 'mlb';
    case '.json': return 'json';
    case '.csv': return 'csv';
    default: return 'sym';
    }
  }

  /**
   * Export to .sym format (No$SNS debugger format)
   */
  private exportToSymFile(filePath: string): void {
    const lines: string[] = [];

    // Sort symbols by address
    const sortedSymbols = Array.from(this.symbols.entries()).sort((a, b) => a[0] - b[0]);

    for (const [address, symbol] of sortedSymbols) {
      // Format: XXXXXX SymbolName
      lines.push(`${address.toString(16).toUpperCase().padStart(6, '0')} ${symbol.name}`);
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  }

  /**
   * Export to .mlb format (MAME debugger format)
   */
  private exportToMLBFile(filePath: string): void {
    const lines: string[] = [];

    // Sort symbols by address
    const sortedSymbols = Array.from(this.symbols.entries()).sort((a, b) => a[0] - b[0]);

    for (const [address, symbol] of sortedSymbols) {
      // Format: SymbolName = $XXXXXX ; Type: Description
      let line = `${symbol.name} = $${address.toString(16).toUpperCase().padStart(6, '0')}`;

      if (symbol.type || symbol.description) {
        line += ' ;';
        if (symbol.type) {
          line += ` Type: ${symbol.type}`;
        }
        if (symbol.description) {
          line += ` ${symbol.description}`;
        }
      }

      lines.push(line);
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  }

  /**
   * Export to JSON format
   */
  private exportToJSONFile(filePath: string): void {
    const data = {
      metadata: {
        exportedAt: new Date().toISOString(),
        symbolCount: this.symbols.size,
        format: 'SNES Disassembler Symbol Table'
      },
      symbols: Array.from(this.symbols.entries()).map(([address, symbol]) => ({
        ...symbol,
        addressHex: address.toString(16).toUpperCase().padStart(6, '0')
      }))
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  /**
   * Export to CSV format
   */
  private exportToCSVFile(filePath: string): void {
    const lines: string[] = [];

    // CSV Header
    lines.push('Address,AddressHex,Name,Type,Scope,Size,Description');

    // Sort symbols by address
    const sortedSymbols = Array.from(this.symbols.entries()).sort((a, b) => a[0] - b[0]);

    for (const [address, symbol] of sortedSymbols) {
      const row = [
        address.toString(),
        `"${address.toString(16).toUpperCase().padStart(6, '0')}"`,
        `"${symbol.name}"`,
        `"${symbol.type}"`,
        `"${symbol.scope}"`,
        symbol.size?.toString() || '',
        `"${(symbol.description || '').replace(/"/g, '""')}"`
      ];
      lines.push(row.join(','));
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  }

  /**
   * Import symbols from file
   */
  importFromFile(filePath: string, format?: 'sym' | 'mlb' | 'json' | 'csv'): BulkOperationResult {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const ext = path.extname(filePath).toLowerCase();
    const actualFormat = format || this.getFormatFromExtension(ext);

    switch (actualFormat) {
    case 'sym':
      return this.importFromSymFile(filePath);
    case 'mlb':
      return this.importFromMLBFile(filePath);
    case 'json':
      return this.importFromJSONFile(filePath);
    case 'csv':
      return this.importFromCSVFile(filePath);
    default:
      throw new Error(`Unsupported import format: ${actualFormat}`);
    }
  }

  /**
   * Import from .sym format
   */
  private importFromSymFile(filePath: string): BulkOperationResult {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim().length > 0);

    const symbols = new Map<number, SymbolTableEntry>();

    for (const line of lines) {
      const match = line.trim().match(/^([0-9A-Fa-f]{6})\s+(.+)$/);
      if (match) {
        const address = parseInt(match[1], 16);
        const name = match[2].trim();

        symbols.set(address, {
          address,
          name,
          type: 'CODE', // Default type for .sym files
          scope: 'GLOBAL'
        });
      }
    }

    return this.bulkAddSymbols(symbols);
  }

  /**
   * Import from .mlb format
   */
  private importFromMLBFile(filePath: string): BulkOperationResult {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim().length > 0);

    const symbols = new Map<number, SymbolTableEntry>();

    for (const line of lines) {
      // Parse: SymbolName = $XXXXXX ; Type: Description
      const match = line.trim().match(/^([^=]+)=\s*\$([0-9A-Fa-f]+)(?:\s*;\s*(.+))?$/);
      if (match) {
        const name = match[1].trim();
        const address = parseInt(match[2], 16);
        const comment = match[3]?.trim();

        let type: SymbolTableEntry['type'] = 'CODE';
        const description = comment;

        // Parse type from comment
        if (comment) {
          const typeMatch = comment.match(/Type:\s*(\w+)/i);
          if (typeMatch) {
            const typeStr = typeMatch[1].toUpperCase();
            if (['CODE', 'DATA', 'VECTOR', 'REGISTER', 'CONSTANT'].includes(typeStr)) {
              type = typeStr as SymbolTableEntry['type'];
            }
          }
        }

        symbols.set(address, {
          address,
          name,
          type,
          scope: 'GLOBAL',
          description
        });
      }
    }

    return this.bulkAddSymbols(symbols);
  }

  /**
   * Import from JSON format
   */
  private importFromJSONFile(filePath: string): BulkOperationResult {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    const symbols = new Map<number, SymbolTableEntry>();

    if (data.symbols && Array.isArray(data.symbols)) {
      for (const symbolData of data.symbols) {
        const address = typeof symbolData.address === 'number' ?
          symbolData.address :
          parseInt(symbolData.addressHex || symbolData.address, 16);

        symbols.set(address, {
          address,
          name: symbolData.name,
          type: symbolData.type || 'CODE',
          scope: symbolData.scope || 'GLOBAL',
          size: symbolData.size,
          description: symbolData.description,
          references: symbolData.references
        });
      }
    }

    return this.bulkAddSymbols(symbols);
  }

  /**
   * Import from CSV format
   */
  private importFromCSVFile(filePath: string): BulkOperationResult {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim().length > 0);

    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Skip header line
    const dataLines = lines.slice(1);
    const symbols = new Map<number, SymbolTableEntry>();

    for (const line of dataLines) {
      const columns = this.parseCSVLine(line);
      if (columns.length >= 4) {
        const address = parseInt(columns[0]);
        const name = columns[2].replace(/"/g, '');
        const type = columns[3].replace(/"/g, '') as SymbolTableEntry['type'] || 'CODE';
        const scope = columns[4]?.replace(/"/g, '') as SymbolTableEntry['scope'] || 'GLOBAL';
        const size = columns[5] ? parseInt(columns[5]) : undefined;
        const description = columns[6]?.replace(/"/g, '').replace(/""/g, '"');

        symbols.set(address, {
          address,
          name,
          type,
          scope,
          size,
          description
        });
      }
    }

    return this.bulkAddSymbols(symbols);
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  /**
   * Clear all symbols
   */
  clear(): void {
    this.symbols.clear();
    this.nameToAddress.clear();
  }

  /**
   * Get symbol statistics
   */
  getStatistics(): {
    total: number;
    byType: Record<string, number>;
    byScope: Record<string, number>;
    } {
    const stats = {
      total: this.symbols.size,
      byType: {} as Record<string, number>,
      byScope: {} as Record<string, number>
    };

    for (const symbol of this.symbols.values()) {
      stats.byType[symbol.type] = (stats.byType[symbol.type] || 0) + 1;
      stats.byScope[symbol.scope] = (stats.byScope[symbol.scope] || 0) + 1;
    }

    return stats;
  }
}