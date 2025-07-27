/**
 * Automated Documentation Generator
 *
 * Analyzes SNES ROM data and generates comprehensive MD files with:
 * - AI-powered assembly code analysis
 * - Pattern recognition insights
 * - SNES-specific hardware documentation
 * - Contextual explanations for beginners and experts
 * - Cross-references to related assets
 */

import { AIConfigManager } from './ai-config';
import { AIPatternRecognizer, GraphicsClassification, AudioClassification, TextClassification } from './ai-pattern-recognition';
import { AINameSuggester, NamingSuggestion, AssetContext } from './ai-naming-suggestions';

interface DocumentationDetails {
  /** Title for the documentation section */
  title: string;
  /** High-level summary of the asset or pattern */
  summary: string;
  /** Detailed analysis and description */
  details: string;
  /** AI confidence in analysis (0.0 to 1.0) */
  confidence: number;
  /** Recommended usage or implications */
  recommendations?: string[];
  /** Assembly code comments if applicable */
  codeComments?: AssemblyComment[];
  /** Related assets or cross-references */
  relatedAssets?: string[];
  /** SNES hardware context */
  hardwareContext?: HardwareContext;
}

interface AssemblyComment {
  /** Instruction or data offset */
  offset: number;
  /** The actual instruction/data bytes */
  data: string;
  /** AI-generated comment explaining the purpose */
  comment: string;
  /** Confidence in this interpretation */
  confidence: number;
  /** SNES-specific context (registers, memory mapping, etc.) */
  snesContext?: string;
}

interface HardwareContext {
  /** Relevant SNES registers used */
  registers?: string[];
  /** Memory mapping mode (LoROM/HiROM) */
  mappingMode?: 'LoROM' | 'HiROM' | 'Unknown';
  /** Bank usage explanation */
  bankUsage?: string;
  /** DMA or HDMA usage */
  dmaUsage?: string;
  /** PPU features involved */
  ppuFeatures?: string[];
}

/**
 * AI-Enhanced Documentation Generator for SNES ROMs
 */
export class AIDocumentationGenerator {
  private configManager: AIConfigManager;
  private patternRecognizer: AIPatternRecognizer;
  private nameSuggester: AINameSuggester;
  private snesKnowledge: SNESKnowledgeBase;

  constructor(configManager: AIConfigManager, patternRecognizer: AIPatternRecognizer, nameSuggester: AINameSuggester) {
    this.configManager = configManager;
    this.patternRecognizer = patternRecognizer;
    this.nameSuggester = nameSuggester;
    this.snesKnowledge = new SNESKnowledgeBase();
  }

  /**
   * Generate comprehensive documentation for SNES assets
   */
  async generateDocumentation(
    data: Uint8Array,
    offset: number,
    length: number,
    assemblyCode?: string
  ): Promise<DocumentationDetails> {
    const config = this.configManager.getConfig();

    if (!config.documentationGeneration.enabled) {
      return this.generateBasicDocumentation(data, offset, length);
    }

    // Analyze the data region
    const analysisResult = await this.patternRecognizer.classifyDataRegion(data, offset, length);

    // Generate contextual asset information
    const assetContext: AssetContext = {
      offset,
      size: length,
      bank: offset >> 16,
      classification: {
        graphics: analysisResult.graphics,
        audio: analysisResult.audio,
        text: analysisResult.text
      }
    };

    const suggestedNames = await this.nameSuggester.suggestNames(assetContext);

    // Generate assembly comments if code is provided
    let codeComments: AssemblyComment[] = [];
    if (assemblyCode && config.documentationGeneration.generateComments) {
      codeComments = await this.generateAssemblyComments(assemblyCode, data, offset);
    }

    // Build comprehensive documentation
    return this.buildDetailedDocumentation(analysisResult, suggestedNames, codeComments, config, assetContext);
  }

  /**
   * Generate AI-powered assembly code comments
   */
  async generateAssemblyComments(
    assemblyCode: string,
    data: Uint8Array,
    baseOffset: number
  ): Promise<AssemblyComment[]> {
    const comments: AssemblyComment[] = [];
    const lines = assemblyCode.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith(';')) continue; // Skip empty lines and comments

      const comment = await this.analyzeAssemblyLine(line, data, baseOffset + i * 2);
      if (comment) {
        comments.push(comment);
      }
    }

    return comments;
  }

  /**
   * Analyze a single assembly line and generate intelligent comments
   */
  private async analyzeAssemblyLine(
    line: string,
    data: Uint8Array,
    offset: number
  ): Promise<AssemblyComment | null> {
    const instruction = this.parseInstruction(line);
    if (!instruction) return null;

    const comment = this.generateInstructionComment(instruction, offset);
    const snesContext = this.getSNESContext(instruction);

    return {
      offset,
      data: line,
      comment,
      confidence: 0.8, // Base confidence for pattern-based analysis
      snesContext
    };
  }

  private parseInstruction(line: string): { mnemonic: string; operand?: string } | null {
    const match = line.match(/^\s*([A-Z]{3})\s*(.*)$/i);
    if (!match) return null;

    return {
      mnemonic: match[1].toUpperCase(),
      operand: match[2]?.trim()
    };
  }

  private generateInstructionComment(instruction: { mnemonic: string; operand?: string }, offset: number): string {
    const { mnemonic, operand } = instruction;

    // AI-informed instruction analysis based on SNES patterns
    switch (mnemonic) {
    case 'LDA':
      return `Load value ${operand || ''} into accumulator A`;
    case 'STA':
      if (operand?.includes('$21')) {
        return `Store accumulator to PPU register ${operand} (graphics/display control)`;
      }
      return `Store accumulator value to ${operand || 'memory'}`;
    case 'JSR':
      return `Call subroutine at ${operand || 'address'}`;
    case 'RTS':
      return 'Return from subroutine';
    case 'LDX':
      return `Load value ${operand || ''} into X register (often used for indexing)`;
    case 'LDY':
      return `Load value ${operand || ''} into Y register (often used for indexing)`;
    case 'CMP':
      return `Compare accumulator with ${operand || 'value'} (sets flags for branching)`;
    case 'BEQ':
      return `Branch to ${operand || 'address'} if equal (Z flag set)`;
    case 'BNE':
      return `Branch to ${operand || 'address'} if not equal (Z flag clear)`;
    case 'JMP':
      return `Jump unconditionally to ${operand || 'address'}`;
    default:
      return `${mnemonic} instruction with operand ${operand || 'none'}`;
    }
  }

  private getSNESContext(instruction: { mnemonic: string; operand?: string }): string {
    const { mnemonic, operand } = instruction;

    // Provide SNES-specific context
    if (operand?.includes('$21')) {
      return 'PPU (Picture Processing Unit) register access - controls graphics rendering';
    }
    if (operand?.includes('$40')) {
      return 'CPU register access - processor control and DMA';
    }
    if (operand?.includes('$7E')) {
      return 'Work RAM access - temporary data storage';
    }
    if (mnemonic === 'JSR' || mnemonic === 'JMP') {
      return 'Control flow - program execution jumps or calls';
    }

    return '';
  }

  private buildDetailedDocumentation(
    analysis: any,
    names: NamingSuggestion[],
    codeComments: AssemblyComment[],
    config: any,
    context: AssetContext
  ): DocumentationDetails {
    const { graphics, audio, text, compression, mostLikely, confidence } = analysis;

    // Build comprehensive title
    let title = 'SNES Asset Analysis';
    if (mostLikely !== 'unknown') {
      title = `${mostLikely.charAt(0).toUpperCase() + mostLikely.slice(1)} Asset Analysis`;
    }

    // Generate summary
    const summary = this.generateSummary(analysis, context, config);

    // Generate detailed description
    const details = this.generateComprehensiveDetails(analysis, names, codeComments, config, context);

    // Extract hardware context
    const hardwareContext = this.extractHardwareContext(analysis, context);

    // Find related assets (simplified for now)
    const relatedAssets = this.findRelatedAssets(context);

    return {
      title,
      summary,
      details,
      confidence,
      codeComments: codeComments.length > 0 ? codeComments : undefined,
      hardwareContext,
      relatedAssets: relatedAssets.length > 0 ? relatedAssets : undefined,
      recommendations: this.generateRecommendations(analysis, config)
    };
  }

  private generateSummary(analysis: any, context: AssetContext, config: any): string {
    const { mostLikely, confidence } = analysis;
    const bankHex = context.bank.toString(16).toUpperCase().padStart(2, '0');
    const offsetHex = context.offset.toString(16).toUpperCase().padStart(6, '0');

    let summary = `Asset located at bank $${bankHex}, offset $${offsetHex} (${context.size} bytes).\n`;
    summary += `AI analysis indicates this is most likely **${mostLikely}** data `;
    summary += `with ${(confidence * 100).toFixed(1)}% confidence.\n\n`;

    if (config.documentationGeneration.style === 'beginner') {
      summary += 'This analysis uses AI-powered pattern recognition to identify the type and purpose of data in the SNES ROM.';
    } else if (config.documentationGeneration.style === 'technical') {
      summary += 'Classification based on entropy analysis, pattern recognition, and SNES-specific heuristics.';
    }

    return summary;
  }

  private generateComprehensiveDetails(
    analysis: any,
    names: NamingSuggestion[],
    codeComments: AssemblyComment[],
    config: any,
    context: AssetContext
  ): string {
    let details = '';

    // Asset Classification Section
    details += '## Asset Classification\n\n';

    if (analysis.graphics) {
      details += this.generateGraphicsDetails(analysis.graphics, config);
    }

    if (analysis.audio) {
      details += this.generateAudioDetails(analysis.audio, config);
    }

    if (analysis.text) {
      details += this.generateTextDetails(analysis.text, config);
    }

    if (analysis.compression && analysis.compression.type !== 'none') {
      details += this.generateCompressionDetails(analysis.compression, config);
    }

    // Naming Suggestions Section
    if (names.length > 0) {
      details += '\n## Suggested Names\n\n';
      for (const name of names.slice(0, 5)) { // Top 5 suggestions
        details += `- **${name.name}** (${(name.confidence * 100).toFixed(1)}% confidence)\n`;
        details += `  - Reasoning: ${name.reasoning}\n`;
        if (name.alternatives && name.alternatives.length > 0) {
          details += `  - Alternatives: ${name.alternatives.slice(0, 3).join(', ')}\n`;
        }
      }
    }

    // Assembly Comments Section
    if (codeComments.length > 0) {
      details += '\n## Assembly Code Analysis\n\n';
      details += '```assembly\n';
      for (const comment of codeComments.slice(0, 10)) { // First 10 comments
        details += `${comment.data.padEnd(20)} ; ${comment.comment}\n`;
        if (comment.snesContext) {
          details += `${' '.repeat(20)} ; SNES: ${comment.snesContext}\n`;
        }
      }
      details += '```\n';
    }

    // Technical Details Section
    details += '\n## Technical Details\n\n';
    details += `- **Memory Location**: Bank $${context.bank.toString(16).toUpperCase().padStart(2, '0')}, Offset $${context.offset.toString(16).toUpperCase().padStart(6, '0')}\n`;
    details += `- **Size**: ${context.size} bytes (0x${context.size.toString(16).toUpperCase()})\n`;
    details += `- **ROM Address**: $${context.offset.toString(16).toUpperCase().padStart(6, '0')}\n`;

    // Add confidence information if requested
    if (config.documentationGeneration.includeConfidence) {
      details += '\n## AI Analysis Confidence\n\n';
      details += 'This analysis uses machine learning models trained on SNES patterns:\n\n';
      if (analysis.graphics) {
        details += `- Graphics classification: ${(analysis.graphics.confidence * 100).toFixed(1)}%\n`;
      }
      if (analysis.audio) {
        details += `- Audio classification: ${(analysis.audio.confidence * 100).toFixed(1)}%\n`;
      }
      if (analysis.text) {
        details += `- Text classification: ${(analysis.text.confidence * 100).toFixed(1)}%\n`;
      }
    }

    return details;
  }

  private generateGraphicsDetails(graphics: GraphicsClassification, config: any): string {
    let details = '### Graphics Data\n\n';
    details += `**Type**: ${graphics.type}\n`;
    details += `**Confidence**: ${(graphics.confidence * 100).toFixed(1)}%\n`;

    if (graphics.format) {
      details += `**Format**: ${graphics.format} (${graphics.format === '2bpp' ? '4 colors' : graphics.format === '4bpp' ? '16 colors' : '256 colors'})\n`;
    }

    if (graphics.dimensions) {
      details += `**Dimensions**: ${graphics.dimensions.width}x${graphics.dimensions.height} pixels\n`;
    }

    // Add SNES-specific context
    details += '\n**SNES Context**: ';
    switch (graphics.type) {
    case 'sprite':
      details += 'Sprite graphics for moving objects (characters, enemies, items). Stored in VRAM and controlled by OAM.\n';
      break;
    case 'background':
      details += 'Background layer graphics. SNES supports up to 4 background layers with various modes.\n';
      break;
    case 'tile':
      details += 'Individual tile graphics. SNES uses 8x8 pixel tiles as building blocks for backgrounds and sprites.\n';
      break;
    case 'font':
      details += 'Character font data for text display. Often stored as tiles and referenced by text engines.\n';
      break;
    case 'palette':
      details += 'Color palette data. SNES supports 256 colors total, organized in sub-palettes.\n';
      break;
    }

    return details + '\n';
  }

  private generateAudioDetails(audio: AudioClassification, config: any): string {
    let details = '### Audio Data\n\n';
    details += `**Type**: ${audio.type}\n`;
    details += `**Confidence**: ${(audio.confidence * 100).toFixed(1)}%\n`;

    if (audio.encoding) {
      details += `**Encoding**: ${audio.encoding}\n`;
    }

    if (audio.sampleRate) {
      details += `**Sample Rate**: ${audio.sampleRate} Hz\n`;
    }

    if (audio.channels) {
      details += `**Channels**: ${audio.channels}\n`;
    }

    // Add SNES-specific context
    details += '\n**SNES Context**: ';
    switch (audio.type) {
    case 'brr_sample':
      details += 'BRR (Bit Rate Reduction) compressed audio sample. SNES SPC700 audio processor native format.\n';
      break;
    case 'sequence':
      details += 'Music sequence data. Contains note patterns, timing, and instrument references.\n';
      break;
    case 'spc_code':
      details += 'SPC700 processor code. Audio driver or sound effect generation routines.\n';
      break;
    case 'instrument':
      details += 'Instrument definition data. Describes how samples are played (ADSR, tuning, etc.).\n';
      break;
    }

    return details + '\n';
  }

  private generateTextDetails(text: TextClassification, config: any): string {
    let details = '### Text Data\n\n';
    details += `**Type**: ${text.type}\n`;
    details += `**Confidence**: ${(text.confidence * 100).toFixed(1)}%\n`;
    details += `**Encoding**: ${text.encoding}\n`;

    if (text.compression && text.compression !== 'none') {
      details += `**Compression**: ${text.compression}\n`;
    }

    // Add SNES-specific context
    details += '\n**SNES Context**: ';
    switch (text.type) {
    case 'dialogue':
      details += 'Game dialogue text. Often compressed to save ROM space. May include control codes for formatting.\n';
      break;
    case 'menu':
      details += 'Menu text and interface strings. Usually uncompressed for quick access.\n';
      break;
    case 'item_name':
      details += 'Item or object names. Typically stored in tables for easy lookup.\n';
      break;
    case 'credits':
      details += 'Credits text, usually displayed at game completion. Often in ASCII format.\n';
      break;
    }

    if (text.compression && text.compression !== 'none') {
      details += '\n**Compression Details**: ';
      switch (text.compression) {
      case 'dte':
        details += 'Dual Tile Encoding - common character pairs replaced with single bytes to save space.\n';
        break;
      case 'dictionary':
        details += 'Dictionary compression - frequently used words/phrases stored in lookup table.\n';
        break;
      }
    }

    return details + '\n';
  }

  private generateCompressionDetails(compression: any, config: any): string {
    let details = '### Compression Analysis\n\n';
    details += `**Type**: ${compression.type}\n`;
    details += `**Confidence**: ${(compression.confidence * 100).toFixed(1)}%\n`;

    if (compression.decompressHint) {
      details += `**Hint**: ${compression.decompressHint}\n`;
    }

    return details + '\n';
  }

  private extractHardwareContext(analysis: any, context: AssetContext): HardwareContext | undefined {
    const hardware: HardwareContext = {};

    // Determine mapping mode based on bank
    if (context.bank <= 0x3F || (context.bank >= 0x80 && context.bank <= 0xBF)) {
      hardware.mappingMode = 'LoROM';
    } else if (context.bank >= 0x40 && context.bank <= 0x7F) {
      hardware.mappingMode = 'HiROM';
    }

    // Add relevant registers based on data type
    if (analysis.graphics) {
      hardware.registers = ['$2100-$213F (PPU registers)', '$2140-$217F (APU communication)'];
      hardware.ppuFeatures = this.getPPUFeatures(analysis.graphics.type);
    }

    if (analysis.audio) {
      hardware.registers = ['$2140-$2143 (SPC700 communication)', '$2180-$2183 (WRAM access)'];
    }

    // Bank usage explanation
    hardware.bankUsage = this.getBankUsageExplanation(context.bank);

    return Object.keys(hardware).length > 0 ? hardware : undefined;
  }

  private getPPUFeatures(graphicsType: string): string[] {
    switch (graphicsType) {
    case 'sprite':
      return ['OAM (Object Attribute Memory)', 'Sprite priorities', 'VRAM tile data'];
    case 'background':
      return ['Background layers', 'Tilemap data', 'Scroll registers'];
    case 'palette':
      return ['CGRAM (Color Generator RAM)', 'Color math'];
    default:
      return ['VRAM access', 'DMA transfers'];
    }
  }

  private getBankUsageExplanation(bank: number): string {
    if (bank <= 0x3F) {
      return 'LoROM banks $00-$3F: Contains ROM data, mirrors to $80-$BF';
    } else if (bank >= 0x40 && bank <= 0x7F) {
      return 'HiROM banks $40-$7F: High ROM area, direct mapping';
    } else if (bank >= 0x80 && bank <= 0xBF) {
      return 'LoROM mirror banks $80-$BF: Fast ROM access area';
    } else if (bank >= 0xC0) {
      return 'High banks $C0+: Extended ROM or special mapping';
    }
    return 'Unknown bank usage pattern';
  }

  private findRelatedAssets(context: AssetContext): string[] {
    // Simplified related asset detection
    const related: string[] = [];

    // Look for nearby assets (same bank, nearby offsets)
    const nearbyOffset1 = context.offset + context.size;
    const nearbyOffset2 = context.offset - 0x1000;

    if (nearbyOffset1 < 0x10000) {
      related.push(`Potential next asset at $${nearbyOffset1.toString(16).toUpperCase().padStart(6, '0')}`);
    }

    if (nearbyOffset2 > 0) {
      related.push(`Potential previous asset at $${nearbyOffset2.toString(16).toUpperCase().padStart(6, '0')}`);
    }

    return related;
  }

  private generateRecommendations(analysis: any, config: any): string[] {
    const recommendations: string[] = [];

    if (analysis.graphics) {
      recommendations.push('Use a graphics viewer to visualize the tile data');
      recommendations.push('Check for associated palette data nearby');
    }

    if (analysis.audio) {
      recommendations.push('Use an SPC player to preview audio data');
      recommendations.push('Look for sequence data or driver code in adjacent banks');
    }

    if (analysis.text) {
      recommendations.push('Apply text extraction with appropriate encoding');
      if (analysis.text.compression !== 'none') {
        recommendations.push('Implement decompression algorithm before text extraction');
      }
    }

    if (analysis.confidence < 0.7) {
      recommendations.push('Low confidence - verify analysis with manual inspection');
      recommendations.push('Consider adjusting AI model parameters or using heuristic analysis');
    }

    return recommendations;
  }

  private generateBasicDocumentation(data: Uint8Array, offset: number, length: number): DocumentationDetails {
    const bankHex = (offset >> 16).toString(16).toUpperCase().padStart(2, '0');
    const offsetHex = offset.toString(16).toUpperCase().padStart(6, '0');

    return {
      title: 'Basic Asset Documentation',
      summary: `Data region at bank $${bankHex}, offset $${offsetHex} (${length} bytes). AI analysis disabled.`,
      details: `## Basic Information\n\n- **Location**: Bank $${bankHex}, Offset $${offsetHex}\n- **Size**: ${length} bytes\n\nTo enable AI-powered analysis, configure AI features in ai-config.json.`,
      confidence: 0.1
    };
  }
}

/**
 * SNES Knowledge Base for contextual information
 */
class SNESKnowledgeBase {
  getRegisterInfo(address: number): string {
    // Returns information about SNES registers
    if (address >= 0x2100 && address <= 0x213F) {
      return 'PPU (Picture Processing Unit) registers - graphics and display control';
    }
    if (address >= 0x4000 && address <= 0x43FF) {
      return 'CPU registers - processor control, DMA, and I/O';
    }
    return 'Unknown register range';
  }

  getMemoryRegionInfo(bank: number): string {
    if (bank <= 0x3F) {
      return 'LoROM area - contains cartridge ROM and system areas';
    }
    if (bank >= 0x7E && bank <= 0x7F) {
      return 'Work RAM (WRAM) - temporary data storage';
    }
    if (bank >= 0x80 && bank <= 0xBF) {
      return 'Fast ROM area - mirror of banks $00-$3F with faster access';
    }
    return 'Extended or special memory area';
  }
}

/**
 * Markdown file output for generated documentation
 */
export class MarkdownExporter {
  /** Export documentation to a markdown file */
  static async exportToMarkdown(doc: DocumentationDetails, outputPath: string): Promise<void> {
    const mdContent = `# ${doc.title}

## Summary
${doc.summary}

## Details
${doc.details}
`;

    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, mdContent, 'utf8');
    console.log(`✅ Documentation generated at ${outputPath}`);
  }
}

