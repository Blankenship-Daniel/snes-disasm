/**
 * Enhanced SNES Disassembly Engine
 * 
 * Implements enhanced disassembly algorithms using MCP server insights
 * for improved bank-aware addressing, function detection, and pattern recognition.
 */

import { SNESDisassembler } from './disassembler';
import { callMCPTool } from './mcp-integration';
import { BankHandler } from './bank-handler';

export interface EnhancedDisassemblyOptions {
  bankAware: boolean;
  detectFunctions: boolean;
  generateLabels: boolean;
  extractVectors: boolean;
}

export interface AnalysisOptions {
  controlFlowAnalysis: boolean;
  functionDetection: boolean;
  dataStructureRecognition: boolean;
  crossReferenceGeneration: boolean;
  gamePatternRecognition: boolean;
}

export interface ROMAnalysis {
  vectors: Array<{name: string, address: number, target?: number}>;
  functions: Array<{name: string, address: number, size: number, type: string, description?: string}>;
  dataRegions: Array<{start: number, end: number, size: number, type: string}>;
  bankLayout: Array<{bank: number, start: number, end: number, type: string}>;
}

export interface DisassemblyStats {
  functionsDetected: number;
  crossReferences: number;
  labelsGenerated: number;
  bankTransitions: number;
}

export class EnhancedDisassemblyEngine extends SNESDisassembler {
  private options: EnhancedDisassemblyOptions;
  private analysisOptions: AnalysisOptions;
  private bankHandler: BankHandler;
  private analysis: ROMAnalysis;
  private stats: DisassemblyStats;

  constructor(romFile: string, options: EnhancedDisassemblyOptions) {
    super(romFile);
    this.options = options;
    this.bankHandler = new BankHandler();
    this.analysis = {
      vectors: [],
      functions: [],
      dataRegions: [],
      bankLayout: []
    };
    this.stats = {
      functionsDetected: 0,
      crossReferences: 0,
      labelsGenerated: 0,
      bankTransitions: 0
    };
    this.analysisOptions = {
      controlFlowAnalysis: false,
      functionDetection: false,
      dataStructureRecognition: false,
      crossReferenceGeneration: false,
      gamePatternRecognition: false
    };
  }

  setAnalysisOptions(options: AnalysisOptions): void {
    this.analysisOptions = options;
  }

  async analyze(): Promise<void> {
    // Perform base analysis
    super.analyze();

    // Enhanced analysis using MCP insights
    if (this.options.extractVectors) {
      await this.extractInterruptVectors();
    }

    if (this.options.bankAware) {
      await this.analyzeBankLayout();
    }

    if (this.analysisOptions.functionDetection) {
      await this.detectFunctions();
    }

    if (this.analysisOptions.dataStructureRecognition) {
      await this.analyzeDataStructures();
    }

    if (this.analysisOptions.gamePatternRecognition) {
      await this.recognizeGamePatterns();
    }
  }

  private async extractInterruptVectors(): Promise<void> {
    try {
      // Use MCP server to get vector information
      const vectorInfo = await callMCPTool('extract_code', {
        data: Array.from(this.romData.slice(-0x20)), // Last 32 bytes typically contain vectors
        format: 'ca65',
        extractVectors: true,
        bankAware: this.options.bankAware
      });

      if (vectorInfo && vectorInfo.vectors) {
        this.analysis.vectors = vectorInfo.vectors.map((v: any) => ({
          name: v.name || `Vector_${v.address.toString(16).toUpperCase()}`,
          address: v.address,
          target: v.target
        }));
      } else {
        // Fallback to manual vector extraction
        this.extractVectorsFallback();
      }
    } catch (error) {
      console.warn('MCP vector extraction failed, using fallback method');
      this.extractVectorsFallback();
    }
  }

  private extractVectorsFallback(): void {
    const romSize = this.romData.length;
    const vectorArea = this.romData.slice(romSize - 0x20);
    
    const vectors = [
      { name: 'RESET', offset: 0x1C },
      { name: 'IRQ', offset: 0x1E },
      { name: 'NMI', offset: 0x1A },
      { name: 'BRK', offset: 0x16 },
      { name: 'COP', offset: 0x14 }
    ];

    vectors.forEach(vector => {
      if (vector.offset < vectorArea.length - 1) {
        const address = vectorArea[vector.offset] | (vectorArea[vector.offset + 1] << 8);
        if (address >= 0x8000) { // Valid ROM address
          this.analysis.vectors.push({
            name: vector.name,
            address: romSize - 0x20 + vector.offset,
            target: address
          });
        }
      }
    });
  }

  private async analyzeBankLayout(): Promise<void> {
    const romSize = this.romData.length;
    const bankSize = 0x8000; // 32KB banks for LoROM
    const numBanks = Math.ceil(romSize / bankSize);

    for (let bank = 0; bank < numBanks; bank++) {
      const bankStart = bank * bankSize;
      const bankEnd = Math.min(bankStart + bankSize, romSize);
      const bankData = this.romData.slice(bankStart, bankEnd);

      // Analyze bank content using pattern recognition
      const bankType = this.classifyBankContent(bankData, bank);
      
      this.analysis.bankLayout.push({
        bank,
        start: bankStart,
        end: bankEnd,
        type: bankType
      });
    }
  }

  private classifyBankContent(bankData: Buffer, bankNumber: number): string {
    // Analyze the first few bytes to determine bank type
    const header = bankData.slice(0, 16);
    let codeBytes = 0;
    let dataBytes = 0;
    let emptyBytes = 0;

    // Sample every 16th byte to get a rough idea of content
    for (let i = 0; i < bankData.length; i += 16) {
      const byte = bankData[i];
      if (byte === 0x00 || byte === 0xFF) {
        emptyBytes++;
      } else if (this.isLikelyInstruction(byte)) {
        codeBytes++;
      } else {
        dataBytes++;
      }
    }

    const total = codeBytes + dataBytes + emptyBytes;
    if (total === 0) return 'Empty';

    const codeRatio = codeBytes / total;
    const emptyRatio = emptyBytes / total;

    if (emptyRatio > 0.8) return 'Empty/Padding';
    if (codeRatio > 0.6) return 'Code';
    if (bankNumber === 0) return 'Header/Bootstrap';
    
    return 'Data/Graphics';
  }

  private isLikelyInstruction(byte: number): boolean {
    // Common 65816 opcodes that indicate code
    const commonOpcodes = [
      0xA9, 0xA5, 0xAD, 0xBD, 0xB9, // LDA variants
      0x85, 0x8D, 0x9D, 0x99,       // STA variants
      0x4C, 0x6C, 0x20,             // JMP, JSR
      0x18, 0x38, 0x58, 0x78,       // Flag operations
      0xEA, 0x60, 0x40              // NOP, RTS, RTI
    ];
    
    return commonOpcodes.includes(byte);
  }

  private async detectFunctions(): Promise<void> {
    try {
      // Use enhanced pattern recognition to detect functions
      const analysisChunks = [];
      const chunkSize = 0x8000;

      for (let offset = 0; offset < this.romData.length; offset += chunkSize) {
        const chunk = this.romData.slice(offset, Math.min(offset + chunkSize, this.romData.length));
        analysisChunks.push({
          data: Array.from(chunk),
          offset,
          size: chunk.length
        });
      }

      // Process chunks to find function patterns
      for (const chunk of analysisChunks) {
        const functions = await this.findFunctionsInChunk(chunk);
        this.analysis.functions.push(...functions);
      }

      this.stats.functionsDetected = this.analysis.functions.length;

      // Generate labels for detected functions
      if (this.options.generateLabels) {
        await this.generateFunctionLabels();
      }

    } catch (error) {
      console.warn('Function detection failed:', error);
    }
  }

  private async findFunctionsInChunk(chunk: {data: number[], offset: number, size: number}): Promise<any[]> {
    const functions = [];
    const data = chunk.data;
    
    for (let i = 0; i < data.length - 3; i++) {
      // Look for JSR targets (common function entry pattern)
      if (data[i] === 0x20) { // JSR absolute
        const target = data[i + 1] | (data[i + 2] << 8);
        const targetOffset = target - 0x8000 + chunk.offset;
        
        if (targetOffset >= 0 && targetOffset < this.romData.length) {
          // Check if this looks like a function entry
          const functionBytes = this.romData.slice(targetOffset, targetOffset + 32);
          if (this.isLikelyFunctionEntry(functionBytes)) {
            const functionSize = this.estimateFunctionSize(targetOffset);
            functions.push({
              name: `func_${target.toString(16).toUpperCase()}`,
              address: target,
              offset: targetOffset,
              size: functionSize,
              type: 'Subroutine',
              calledFrom: chunk.offset + i
            });
          }
        }
      }
    }

    return functions;
  }

  private isLikelyFunctionEntry(bytes: Buffer): boolean {
    if (bytes.length < 8) return false;

    // Common function entry patterns
    const firstByte = bytes[0];
    
    // Stack operations often start functions
    if (firstByte === 0x48 || firstByte === 0xDA || firstByte === 0x5A) { // PHA, PHX, PHY
      return true;
    }
    
    // Register setup
    if (firstByte === 0xA9 || firstByte === 0xA2 || firstByte === 0xA0) { // LDA, LDX, LDY immediate
      return true;
    }
    
    // Mode changes
    if (firstByte === 0x18 || firstByte === 0x38 || firstByte === 0x78 || firstByte === 0x58) {
      return true;
    }

    return false;
  }

  private estimateFunctionSize(startOffset: number): number {
    let size = 0;
    let offset = startOffset;
    const maxSize = 0x200; // Reasonable maximum function size

    while (size < maxSize && offset < this.romData.length) {
      const byte = this.romData[offset];
      
      // Look for function end patterns
      if (byte === 0x60 || byte === 0x40) { // RTS or RTI
        size += 1;
        break;
      }

      // Estimate instruction size
      const instructionSize = this.estimateInstructionSize(byte);
      size += instructionSize;
      offset += instructionSize;
    }

    return Math.min(size, maxSize);
  }

  private estimateInstructionSize(opcode: number): number {
    // Simplified instruction size estimation
    // This would need to be more sophisticated for production use
    const threeByte = [0x4C, 0x20, 0xAD, 0x8D, 0xBD, 0x9D, 0xB9, 0x99]; // JMP, JSR, absolute modes
    const twoByte = [0xA9, 0xA2, 0xA0, 0x85, 0x86, 0x84]; // Immediate, zero page
    
    if (threeByte.includes(opcode)) return 3;
    if (twoByte.includes(opcode)) return 2;
    return 1; // Single byte instructions
  }

  private async generateFunctionLabels(): Promise<void> {
    for (const func of this.analysis.functions) {
      // Generate meaningful labels based on function characteristics
      let labelName = func.name;
      
      // Analyze function content to provide better names
      const functionData = this.romData.slice(func.offset, func.offset + Math.min(func.size, 64));
      const analysis = this.analyzeFunctionContent(functionData);
      
      if (analysis.type) {
        labelName = `${analysis.type}_${func.address.toString(16).toUpperCase()}`;
        func.type = analysis.type;
        func.description = analysis.description;
      }
      
      func.name = labelName;
      this.stats.labelsGenerated++;
    }
  }

  private analyzeFunctionContent(data: Buffer): {type?: string, description?: string} {
    // Simple pattern matching for function types
    const hasGraphicsOps = data.some(byte => [0x8D, 0x8F].includes(byte)); // STA to PPU registers
    const hasAudioOps = data.some(byte => byte >= 0x2140 && byte <= 0x2143);
    const hasControllerRead = data.some(byte => [0x4016, 0x4017].includes(byte));
    
    if (hasGraphicsOps) {
      return { type: 'Graphics', description: 'Handles graphics operations' };
    }
    if (hasAudioOps) {
      return { type: 'Audio', description: 'Handles audio operations' };
    }
    if (hasControllerRead) {
      return { type: 'Input', description: 'Reads controller input' };
    }
    
    return {};
  }

  private async analyzeDataStructures(): Promise<void> {
    // Analyze ROM for common data structures
    const structures = [];
    
    // Look for pointer tables
    for (let offset = 0; offset < this.romData.length - 32; offset += 2) {
      if (this.isLikelyPointerTable(offset)) {
        const tableSize = this.getPointerTableSize(offset);
        structures.push({
          type: 'Pointer Table',
          start: offset,
          end: offset + tableSize * 2,
          size: tableSize * 2,
          entries: tableSize
        });
      }
    }

    // Look for graphics data patterns
    const graphicsRegions = this.findGraphicsDataRegions();
    structures.push(...graphicsRegions);

    this.analysis.dataRegions = structures;
  }

  private isLikelyPointerTable(offset: number): boolean {
    // Check if we have consecutive valid ROM addresses
    let validPointers = 0;
    
    for (let i = 0; i < 8; i++) {
      const ptr = this.romData.readUInt16LE(offset + i * 2);
      if (ptr >= 0x8000 && ptr <= 0xFFFF) {
        validPointers++;
      }
    }
    
    return validPointers >= 6; // At least 6 out of 8 look valid
  }

  private getPointerTableSize(offset: number): number {
    let size = 0;
    
    while (offset + size * 2 < this.romData.length - 2) {
      const ptr = this.romData.readUInt16LE(offset + size * 2);
      if (ptr < 0x8000 || ptr > 0xFFFF) {
        break;
      }
      size++;
      
      // Reasonable limit
      if (size > 256) break;
    }
    
    return size;
  }

  private findGraphicsDataRegions(): any[] {
    const regions = [];
    
    // Look for patterns typical of graphics data
    for (let offset = 0x8000; offset < this.romData.length - 0x400; offset += 0x100) {
      const chunk = this.romData.slice(offset, offset + 0x400);
      
      if (this.isLikelyGraphicsData(chunk)) {
        const regionEnd = this.findGraphicsRegionEnd(offset);
        regions.push({
          type: 'Graphics Data',
          start: offset,
          end: regionEnd,
          size: regionEnd - offset
        });
        
        offset = regionEnd; // Skip ahead
      }
    }
    
    return regions;
  }

  private isLikelyGraphicsData(data: Buffer): boolean {
    // Graphics data often has repeating patterns and limited value ranges
    const valueCounts = new Array(256).fill(0);
    
    for (const byte of data) {
      valueCounts[byte]++;
    }
    
    // Count how many different values appear
    const uniqueValues = valueCounts.filter(count => count > 0).length;
    
    // Graphics data typically uses a limited palette
    return uniqueValues < 64 && uniqueValues > 8;
  }

  private findGraphicsRegionEnd(start: number): number {
    let end = start + 0x400;
    
    while (end < this.romData.length - 0x100) {
      const chunk = this.romData.slice(end, end + 0x100);
      if (!this.isLikelyGraphicsData(chunk)) {
        break;
      }
      end += 0x100;
    }
    
    return Math.min(end, this.romData.length);
  }

  private async recognizeGamePatterns(): Promise<void> {
    // Use MCP server insights to recognize common game patterns
    try {
      // This would integrate with the zelda3 MCP server for ALTTP-specific patterns
      // or other game-specific servers for pattern recognition
      
      // For now, implement basic pattern recognition
      this.recognizeCommonPatterns();
      
    } catch (error) {
      console.warn('Game pattern recognition failed:', error);
      this.recognizeCommonPatterns();
    }
  }

  private recognizeCommonPatterns(): void {
    // Recognize common SNES game patterns
    
    // Look for DMA patterns
    this.findDMAPatterns();
    
    // Look for PPU register usage patterns
    this.findPPUPatterns();
    
    // Look for common game loop patterns
    this.findGameLoopPatterns();
  }

  private findDMAPatterns(): void {
    // Look for DMA setup patterns (0x43xx register writes)
    for (let offset = 0; offset < this.romData.length - 8; offset++) {
      if (this.romData[offset] === 0x8D) { // STA absolute
        const addr = this.romData.readUInt16LE(offset + 1);
        if (addr >= 0x4300 && addr <= 0x437F) {
          // Found DMA register write
          this.analysis.functions.push({
            name: `DMA_Setup_${offset.toString(16).toUpperCase()}`,
            address: offset + 0x8000,
            size: 8,
            type: 'DMA',
            description: 'DMA channel setup'
          });
        }
      }
    }
  }

  private findPPUPatterns(): void {
    // Look for PPU register access patterns
    const ppuRegisters = [
      { addr: 0x2100, name: 'INIDISP' },
      { addr: 0x2101, name: 'OBJSEL' },
      { addr: 0x2105, name: 'BGMODE' },
      { addr: 0x210B, name: 'BG1SC' }
    ];

    for (const reg of ppuRegisters) {
      this.findRegisterAccess(reg.addr, reg.name);
    }
  }

  private findRegisterAccess(address: number, name: string): void {
    for (let offset = 0; offset < this.romData.length - 3; offset++) {
      if (this.romData[offset] === 0x8D) { // STA absolute
        const addr = this.romData.readUInt16LE(offset + 1);
        if (addr === address) {
          // Found register access - could be part of a larger initialization routine
          this.stats.crossReferences++;
        }
      }
    }
  }

  private findGameLoopPatterns(): void {
    // Look for infinite loop patterns that might be main game loops
    for (let offset = 0; offset < this.romData.length - 6; offset++) {
      // Look for patterns like: loop: ... JMP loop
      if (this.romData[offset] === 0x4C) { // JMP absolute
        const target = this.romData.readUInt16LE(offset + 1);
        const currentAddr = offset + 0x8000;
        
        // If jumping backwards by a reasonable amount, might be a game loop
        if (target < currentAddr && (currentAddr - target) < 0x100 && (currentAddr - target) > 0x10) {
          this.analysis.functions.push({
            name: `GameLoop_${currentAddr.toString(16).toUpperCase()}`,
            address: target,
            size: currentAddr - target + 3,
            type: 'Main Loop',
            description: 'Main game loop or state handler'
          });
        }
      }
    }
  }

  performROMAnalysis(): ROMAnalysis {
    return this.analysis;
  }

  getDisassemblyStats(): DisassemblyStats {
    return this.stats;
  }

  // Override the parent disassemble method to add enhanced features
  disassemble(startAddress?: number, endAddress?: number): any[] {
    const baseResult = super.disassemble(startAddress, endAddress);
    
    if (this.options.bankAware) {
      return this.enhanceWithBankInfo(baseResult);
    }
    
    return baseResult;
  }

  private enhanceWithBankInfo(disassemblyLines: any[]): any[] {
    return disassemblyLines.map(line => {
      if (line.address !== undefined) {
        const bankInfo = this.bankHandler.getBankInfo(line.address);
        return {
          ...line,
          bank: bankInfo.bank,
          bankType: bankInfo.type,
          physicalAddress: bankInfo.physicalAddress
        };
      }
      return line;
    });
  }
}
