/**
 * AI-Powered Intelligent Naming Suggestions
 * 
 * Generates contextually appropriate names for SNES assets using:
 * - Pattern recognition results
 * - SNES-specific naming conventions
 * - Game context analysis
 * - Historical naming patterns from well-known games
 */

import { AIConfigManager } from './ai-config';
import { GraphicsClassification, AudioClassification, TextClassification } from './ai-pattern-recognition';

export interface NamingSuggestion {
  /** Suggested name */
  name: string;
  /** Confidence in this suggestion (0.0-1.0) */
  confidence: number;
  /** Explanation of why this name was suggested */
  reasoning: string;
  /** Category of the suggestion */
  category: 'sprite' | 'background' | 'audio' | 'text' | 'code' | 'data';
  /** Alternative names */
  alternatives: string[];
  /** SNES-specific conventions used */
  conventions?: string[];
}

export interface AssetContext {
  /** ROM offset where asset was found */
  offset: number;
  /** Size of the asset */
  size: number;
  /** Bank where asset is located */
  bank: number;
  /** Surrounding context (nearby assets) */
  nearbyAssets?: AssetContext[];
  /** Game identification if available */
  gameId?: string;
  /** Asset classification results */
  classification?: {
    graphics?: GraphicsClassification;
    audio?: AudioClassification;
    text?: TextClassification;
  };
}

/**
 * AI-Enhanced Naming Suggestion Engine
 */
export class AINameSuggester {
  private configManager: AIConfigManager;
  private snesConventions: SNESNamingConventions;
  private gameDatabase: GameSpecificNaming;
  
  constructor(configManager: AIConfigManager) {
    this.configManager = configManager;
    this.snesConventions = new SNESNamingConventions();
    this.gameDatabase = new GameSpecificNaming();
  }
  
  /**
   * Generate intelligent naming suggestions for an asset
   */
  async suggestNames(context: AssetContext): Promise<NamingSuggestion[]> {
    const config = this.configManager.getConfig();
    
    if (!config.namingSuggestions.enabled) {
      return this.generateBasicSuggestions(context);
    }
    
    const suggestions: NamingSuggestion[] = [];
    
    // Generate context-aware suggestions
    if (config.namingSuggestions.useContextualNames) {
      suggestions.push(...await this.generateContextualSuggestions(context));
    }
    
    // Apply SNES conventions
    if (config.namingSuggestions.useSNESConventions) {
      suggestions.push(...this.applySNESConventions(context));
    }
    
    // Use custom patterns
    if (config.namingSuggestions.customPatterns) {
      suggestions.push(...this.applyCustomPatterns(context, config.namingSuggestions.customPatterns));
    }
    
    // Game-specific naming
    if (context.gameId) {
      suggestions.push(...this.applyGameSpecificNaming(context));
    }
    
    // Sort by confidence and remove duplicates
    return this.rankAndDeduplicate(suggestions);
  }
  
  /**
   * Generate contextual names using AI pattern recognition
   */
  private async generateContextualSuggestions(context: AssetContext): Promise<NamingSuggestion[]> {
    const suggestions: NamingSuggestion[] = [];\n    \n    // Graphics naming\n    if (context.classification?.graphics) {\n      const graphics = context.classification.graphics;\n      suggestions.push({\n        name: this.generateGraphicsName(graphics, context),\n        confidence: graphics.confidence,\n        reasoning: `Graphics classification detected ${graphics.type} with ${(graphics.confidence * 100).toFixed(1)}% confidence`,\n        category: 'sprite',\n        alternatives: this.generateGraphicsAlternatives(graphics, context),\n        conventions: ['type_based', 'size_aware']\n      });\n    }\n    \n    // Audio naming\n    if (context.classification?.audio) {\n      const audio = context.classification.audio;\n      suggestions.push({\n        name: this.generateAudioName(audio, context),\n        confidence: audio.confidence,\n        reasoning: `Audio classification detected ${audio.type} with ${(audio.confidence * 100).toFixed(1)}% confidence`,\n        category: 'audio',\n        alternatives: this.generateAudioAlternatives(audio, context),\n        conventions: ['snes_audio', 'channel_aware']\n      });\n    }\n    \n    // Text naming\n    if (context.classification?.text) {\n      const text = context.classification.text;\n      suggestions.push({\n        name: this.generateTextName(text, context),\n        confidence: text.confidence,\n        reasoning: `Text classification detected ${text.type} with ${(text.confidence * 100).toFixed(1)}% confidence`,\n        category: 'text',\n        alternatives: this.generateTextAlternatives(text, context),\n        conventions: ['text_type', 'encoding_aware']\n      });\n    }\n    \n    return suggestions;\n  }\n  \n  private generateGraphicsName(graphics: GraphicsClassification, context: AssetContext): string {\n    const bankHex = context.bank.toString(16).toUpperCase().padStart(2, '0');\n    const offsetHex = context.offset.toString(16).toUpperCase().padStart(4, '0');\n    \n    switch (graphics.type) {\n      case 'sprite':\n        return `sprite_${bankHex}_${offsetHex}`;\n      case 'tile':\n        return `tile_${graphics.format}_${bankHex}_${offsetHex}`;\n      case 'background':\n        return `bg_layer_${bankHex}_${offsetHex}`;\n      case 'ui':\n        return `ui_element_${bankHex}_${offsetHex}`;\n      case 'font':\n        return `font_${graphics.format}_${bankHex}_${offsetHex}`;\n      case 'palette':\n        return `palette_${bankHex}_${offsetHex}`;\n      default:\n        return `graphics_${bankHex}_${offsetHex}`;\n    }\n  }\n  \n  private generateAudioName(audio: AudioClassification, context: AssetContext): string {\n    const bankHex = context.bank.toString(16).toUpperCase().padStart(2, '0');\n    const offsetHex = context.offset.toString(16).toUpperCase().padStart(4, '0');\n    \n    switch (audio.type) {\n      case 'brr_sample':\n        return `sample_brr_${bankHex}_${offsetHex}`;\n      case 'sequence':\n        return `music_seq_${bankHex}_${offsetHex}`;\n      case 'spc_code':\n        return `spc_driver_${bankHex}_${offsetHex}`;\n      case 'instrument':\n        return `instrument_${bankHex}_${offsetHex}`;\n      default:\n        return `audio_${bankHex}_${offsetHex}`;\n    }\n  }\n  \n  private generateTextName(text: TextClassification, context: AssetContext): string {\n    const bankHex = context.bank.toString(16).toUpperCase().padStart(2, '0');\n    const offsetHex = context.offset.toString(16).toUpperCase().padStart(4, '0');\n    \n    switch (text.type) {\n      case 'dialogue':\n        return `dialogue_${text.compression !== 'none' ? text.compression + '_' : ''}${bankHex}_${offsetHex}`;\n      case 'menu':\n        return `menu_text_${bankHex}_${offsetHex}`;\n      case 'item_name':\n        return `item_names_${bankHex}_${offsetHex}`;\n      case 'credits':\n        return `credits_text_${bankHex}_${offsetHex}`;\n      case 'code_comment':\n        return `debug_text_${bankHex}_${offsetHex}`;\n      default:\n        return `text_${bankHex}_${offsetHex}`;\n    }\n  }\n  \n  private generateGraphicsAlternatives(graphics: GraphicsClassification, context: AssetContext): string[] {\n    const base = this.generateGraphicsName(graphics, context);\n    const alternatives = [base];\n    \n    // Size-based alternatives\n    if (graphics.dimensions) {\n      alternatives.push(`${graphics.type}_${graphics.dimensions.width}x${graphics.dimensions.height}_data`);\n    }\n    \n    // Format-based alternatives\n    if (graphics.format) {\n      alternatives.push(`${graphics.type}_${graphics.format}_data`);\n    }\n    \n    // Index-based alternatives\n    const assetIndex = Math.floor(context.offset / 0x1000); // Rough index\n    alternatives.push(`${graphics.type}_${assetIndex.toString().padStart(3, '0')}`);\n    \n    return [...new Set(alternatives)];\n  }\n  \n  private generateAudioAlternatives(audio: AudioClassification, context: AssetContext): string[] {\n    const base = this.generateAudioName(audio, context);\n    const alternatives = [base];\n    \n    // Rate-based alternatives\n    if (audio.sampleRate) {\n      alternatives.push(`${audio.type}_${audio.sampleRate}hz`);\n    }\n    \n    // Channel-based alternatives\n    if (audio.channels) {\n      alternatives.push(`${audio.type}_${audio.channels}ch`);\n    }\n    \n    // Encoding-based alternatives\n    if (audio.encoding) {\n      alternatives.push(`${audio.type}_${audio.encoding}`);\n    }\n    \n    return [...new Set(alternatives)];\n  }\n  \n  private generateTextAlternatives(text: TextClassification, context: AssetContext): string[] {\n    const base = this.generateTextName(text, context);\n    const alternatives = [base];\n    \n    // Encoding-based alternatives\n    alternatives.push(`${text.type}_${text.encoding}`);\n    \n    // Compression-based alternatives\n    if (text.compression && text.compression !== 'none') {\n      alternatives.push(`${text.type}_compressed`);\n      alternatives.push(`${text.type}_${text.compression}`);\n    }\n    \n    return [...new Set(alternatives)];\n  }\n  \n  private applySNESConventions(context: AssetContext): NamingSuggestion[] {\n    return this.snesConventions.generateConventionalNames(context);\n  }\n  \n  private applyCustomPatterns(context: AssetContext, patterns: string[]): NamingSuggestion[] {\n    const suggestions: NamingSuggestion[] = [];\n    \n    for (const pattern of patterns) {\n      const name = this.applyPattern(pattern, context);\n      if (name) {\n        suggestions.push({\n          name,\n          confidence: 0.6,\n          reasoning: `Generated from custom pattern: ${pattern}`,\n          category: this.inferCategoryFromContext(context),\n          alternatives: [],\n          conventions: ['custom_pattern']\n        });\n      }\n    }\n    \n    return suggestions;\n  }\n  \n  private applyPattern(pattern: string, context: AssetContext): string | null {\n    let result = pattern;\n    \n    // Replace common placeholders\n    const replacements: Record<string, string> = {\n      '{{bank}}': context.bank.toString(16).toUpperCase().padStart(2, '0'),\n      '{{offset}}': context.offset.toString(16).toUpperCase().padStart(4, '0'),\n      '{{size}}': context.size.toString(),\n      '{{index}}': Math.floor(context.offset / 0x1000).toString().padStart(3, '0'),\n      '{{type}}': context.classification?.graphics?.type || 'unknown',\n      '{{layer}}': '0', // Default layer\n      '{{asset_type}}': this.inferCategoryFromContext(context),\n      '{{game}}': context.gameId || 'unknown'\n    };\n    \n    for (const [placeholder, value] of Object.entries(replacements)) {\n      result = result.replace(new RegExp(placeholder, 'g'), value);\n    }\n    \n    return result;\n  }\n  \n  private applyGameSpecificNaming(context: AssetContext): NamingSuggestion[] {\n    return this.gameDatabase.generateGameSpecificNames(context);\n  }\n  \n  private generateBasicSuggestions(context: AssetContext): NamingSuggestion[] {\n    const bankHex = context.bank.toString(16).toUpperCase().padStart(2, '0');\n    const offsetHex = context.offset.toString(16).toUpperCase().padStart(4, '0');\n    \n    return [{\n      name: `data_${bankHex}_${offsetHex}`,\n      confidence: 0.5,\n      reasoning: 'Basic naming based on memory location',\n      category: 'data',\n      alternatives: [\n        `asset_${bankHex}_${offsetHex}`,\n        `unknown_${bankHex}_${offsetHex}`,\n        `rom_${context.offset.toString(16)}`\n      ]\n    }];\n  }\n  \n  private inferCategoryFromContext(context: AssetContext): NamingSuggestion['category'] {\n    if (context.classification?.graphics) return 'sprite';\n    if (context.classification?.audio) return 'audio';\n    if (context.classification?.text) return 'text';\n    \n    // Heuristic based on location\n    if (context.bank >= 0x80) return 'code';\n    if (context.offset < 0x8000) return 'data';\n    \n    return 'data';\n  }\n  \n  private rankAndDeduplicate(suggestions: NamingSuggestion[]): NamingSuggestion[] {\n    // Remove duplicates by name\n    const unique = new Map<string, NamingSuggestion>();\n    \n    for (const suggestion of suggestions) {\n      const existing = unique.get(suggestion.name);\n      if (!existing || suggestion.confidence > existing.confidence) {\n        unique.set(suggestion.name, suggestion);\n      }\n    }\n    \n    // Sort by confidence descending\n    return Array.from(unique.values())\n      .sort((a, b) => b.confidence - a.confidence)\n      .slice(0, 10); // Limit to top 10 suggestions\n  }\n}\n\n/**\n * SNES-specific naming conventions\n */\nclass SNESNamingConventions {\n  generateConventionalNames(context: AssetContext): NamingSuggestion[] {\n    const suggestions: NamingSuggestion[] = [];\n    \n    // Bank-based naming\n    if (context.bank <= 0x3F) {\n      suggestions.push({\n        name: `lorom_bank${context.bank.toString(16).toUpperCase()}_${context.offset.toString(16)}`,\n        confidence: 0.7,\n        reasoning: 'LoROM bank naming convention',\n        category: 'data',\n        alternatives: [],\n        conventions: ['lorom', 'bank_based']\n      });\n    } else if (context.bank >= 0x80 && context.bank <= 0xBF) {\n      suggestions.push({\n        name: `hirom_bank${context.bank.toString(16).toUpperCase()}_${context.offset.toString(16)}`,\n        confidence: 0.7,\n        reasoning: 'HiROM bank naming convention',\n        category: 'data',\n        alternatives: [],\n        conventions: ['hirom', 'bank_based']\n      });\n    }\n    \n    // Size-based naming\n    if (context.size === 32) {\n      suggestions.push({\n        name: `tile_8x8_data_${context.offset.toString(16)}`,\n        confidence: 0.6,\n        reasoning: '32 bytes matches 4bpp 8x8 tile size',\n        category: 'sprite',\n        alternatives: ['chr_8x8_data', 'gfx_tile_data'],\n        conventions: ['tile_size', 'snes_graphics']\n      });\n    }\n    \n    return suggestions;\n  }\n}\n\n/**\n * Game-specific naming database\n */\nclass GameSpecificNaming {\n  private gamePatterns: Record<string, GameNamingPattern> = {\n    'zelda3': {\n      sprites: ['link_', 'enemy_', 'npc_', 'item_'],\n      audio: ['overworld_', 'dungeon_', 'boss_', 'sfx_'],\n      text: ['dialogue_', 'item_name_', 'menu_'],\n      commonOffsets: {\n        0x80000: 'link_sprite_data',\n        0x90000: 'enemy_sprite_data',\n        0xA0000: 'overworld_music'\n      }\n    },\n    'smw': {\n      sprites: ['mario_', 'enemy_', 'powerup_', 'platform_'],\n      audio: ['bgm_', 'sfx_', 'voice_sample_'],\n      text: ['level_name_', 'message_', 'credits_'],\n      commonOffsets: {\n        0x83000: 'mario_graphics',\n        0x94000: 'level_music'\n      }\n    }\n  };\n  \n  generateGameSpecificNames(context: AssetContext): NamingSuggestion[] {\n    const suggestions: NamingSuggestion[] = [];\n    \n    if (!context.gameId || !this.gamePatterns[context.gameId]) {\n      return suggestions;\n    }\n    \n    const pattern = this.gamePatterns[context.gameId];\n    \n    // Check for known offsets\n    if (pattern.commonOffsets[context.offset]) {\n      suggestions.push({\n        name: pattern.commonOffsets[context.offset],\n        confidence: 0.9,\n        reasoning: `Known ${context.gameId} asset at this location`,\n        category: 'sprite', // Default category\n        alternatives: [],\n        conventions: ['game_specific', context.gameId]\n      });\n    }\n    \n    // Apply game-specific prefixes\n    const category = this.inferCategoryFromContext(context);\n    let prefixes: string[] = [];\n    \n    switch (category) {\n      case 'sprite':\n        prefixes = pattern.sprites || [];\n        break;\n      case 'audio':\n        prefixes = pattern.audio || [];\n        break;\n      case 'text':\n        prefixes = pattern.text || [];\n        break;\n    }\n    \n    for (const prefix of prefixes) {\n      suggestions.push({\n        name: `${prefix}${context.offset.toString(16)}`,\n        confidence: 0.75,\n        reasoning: `${context.gameId}-specific naming pattern`,\n        category,\n        alternatives: [],\n        conventions: ['game_specific', context.gameId]\n      });\n    }\n    \n    return suggestions;\n  }\n  \n  private inferCategoryFromContext(context: AssetContext): NamingSuggestion['category'] {\n    if (context.classification?.graphics) return 'sprite';\n    if (context.classification?.audio) return 'audio';\n    if (context.classification?.text) return 'text';\n    return 'data';\n  }\n}\n\ninterface GameNamingPattern {\n  sprites: string[];\n  audio: string[];\n  text: string[];\n  commonOffsets: Record<number, string>;\n}
