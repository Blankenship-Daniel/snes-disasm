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
    const suggestions: NamingSuggestion[] = [];
    
    // Graphics naming
    if (context.classification?.graphics) {
      const graphics = context.classification.graphics;
      suggestions.push({
        name: this.generateGraphicsName(graphics, context),
        confidence: graphics.confidence,
        reasoning: `Graphics classification detected ${graphics.type} with ${(graphics.confidence * 100).toFixed(1)}% confidence`,
        category: 'sprite',
        alternatives: this.generateGraphicsAlternatives(graphics, context),
        conventions: ['type_based', 'size_aware']
      });
    }
    
    // Audio naming
    if (context.classification?.audio) {
      const audio = context.classification.audio;
      suggestions.push({
        name: this.generateAudioName(audio, context),
        confidence: audio.confidence,
        reasoning: `Audio classification detected ${audio.type} with ${(audio.confidence * 100).toFixed(1)}% confidence`,
        category: 'audio',
        alternatives: this.generateAudioAlternatives(audio, context),
        conventions: ['snes_audio', 'channel_aware']
      });
    }
    
    // Text naming
    if (context.classification?.text) {
      const text = context.classification.text;
      suggestions.push({
        name: this.generateTextName(text, context),
        confidence: text.confidence,
        reasoning: `Text classification detected ${text.type} with ${(text.confidence * 100).toFixed(1)}% confidence`,
        category: 'text',
        alternatives: this.generateTextAlternatives(text, context),
        conventions: ['text_type', 'encoding_aware']
      });
    }
    
    return suggestions;
  }
  
  private generateGraphicsName(graphics: GraphicsClassification, context: AssetContext): string {
    const bankHex = context.bank.toString(16).toUpperCase().padStart(2, '0');
    const offsetHex = context.offset.toString(16).toUpperCase().padStart(4, '0');
    
    switch (graphics.type) {
      case 'sprite':
        return `sprite_${bankHex}_${offsetHex}`;
      case 'tile':
        return `tile_${graphics.format}_${bankHex}_${offsetHex}`;
      case 'background':
        return `bg_layer_${bankHex}_${offsetHex}`;
      case 'ui':
        return `ui_element_${bankHex}_${offsetHex}`;
      case 'font':
        return `font_${graphics.format}_${bankHex}_${offsetHex}`;
      case 'palette':
        return `palette_${bankHex}_${offsetHex}`;
      default:
        return `graphics_${bankHex}_${offsetHex}`;
    }
  }
  
  private generateAudioName(audio: AudioClassification, context: AssetContext): string {
    const bankHex = context.bank.toString(16).toUpperCase().padStart(2, '0');
    const offsetHex = context.offset.toString(16).toUpperCase().padStart(4, '0');
    
    switch (audio.type) {
      case 'brr_sample':
        return `sample_brr_${bankHex}_${offsetHex}`;
      case 'sequence':
        return `music_seq_${bankHex}_${offsetHex}`;
      case 'spc_code':
        return `spc_driver_${bankHex}_${offsetHex}`;
      case 'instrument':
        return `instrument_${bankHex}_${offsetHex}`;
      default:
        return `audio_${bankHex}_${offsetHex}`;
    }
  }
  
  private generateTextName(text: TextClassification, context: AssetContext): string {
    const bankHex = context.bank.toString(16).toUpperCase().padStart(2, '0');
    const offsetHex = context.offset.toString(16).toUpperCase().padStart(4, '0');
    
    switch (text.type) {
      case 'dialogue':
        return `dialogue_${text.compression !== 'none' ? text.compression + '_' : ''}${bankHex}_${offsetHex}`;
      case 'menu':
        return `menu_text_${bankHex}_${offsetHex}`;
      case 'item_name':
        return `item_names_${bankHex}_${offsetHex}`;
      case 'credits':
        return `credits_text_${bankHex}_${offsetHex}`;
      case 'code_comment':
        return `debug_text_${bankHex}_${offsetHex}`;
      default:
        return `text_${bankHex}_${offsetHex}`;
    }
  }
  
  private generateGraphicsAlternatives(graphics: GraphicsClassification, context: AssetContext): string[] {
    const base = this.generateGraphicsName(graphics, context);
    const alternatives = [base];
    
    // Size-based alternatives
    if (graphics.dimensions) {
      alternatives.push(`${graphics.type}_${graphics.dimensions.width}x${graphics.dimensions.height}_data`);
    }
    
    // Format-based alternatives
    if (graphics.format) {
      alternatives.push(`${graphics.type}_${graphics.format}_data`);
    }
    
    // Index-based alternatives
    const assetIndex = Math.floor(context.offset / 0x1000); // Rough index
    alternatives.push(`${graphics.type}_${assetIndex.toString().padStart(3, '0')}`);
    
    return [...new Set(alternatives)];
  }
  
  private generateAudioAlternatives(audio: AudioClassification, context: AssetContext): string[] {
    const base = this.generateAudioName(audio, context);
    const alternatives = [base];
    
    // Rate-based alternatives
    if (audio.sampleRate) {
      alternatives.push(`${audio.type}_${audio.sampleRate}hz`);
    }
    
    // Channel-based alternatives
    if (audio.channels) {
      alternatives.push(`${audio.type}_${audio.channels}ch`);
    }
    
    // Encoding-based alternatives
    if (audio.encoding) {
      alternatives.push(`${audio.type}_${audio.encoding}`);
    }
    
    return [...new Set(alternatives)];
  }
  
  private generateTextAlternatives(text: TextClassification, context: AssetContext): string[] {
    const base = this.generateTextName(text, context);
    const alternatives = [base];
    
    // Encoding-based alternatives
    alternatives.push(`${text.type}_${text.encoding}`);
    
    // Compression-based alternatives
    if (text.compression && text.compression !== 'none') {
      alternatives.push(`${text.type}_compressed`);
      alternatives.push(`${text.type}_${text.compression}`);
    }
    
    return [...new Set(alternatives)];
  }
  
  private applySNESConventions(context: AssetContext): NamingSuggestion[] {
    return this.snesConventions.generateConventionalNames(context);
  }
  
  private applyCustomPatterns(context: AssetContext, patterns: string[]): NamingSuggestion[] {
    const suggestions: NamingSuggestion[] = [];
    
    for (const pattern of patterns) {
      const name = this.applyPattern(pattern, context);
      if (name) {
        suggestions.push({
          name,
          confidence: 0.6,
          reasoning: `Generated from custom pattern: ${pattern}`,
          category: this.inferCategoryFromContext(context),
          alternatives: [],
          conventions: ['custom_pattern']
        });
      }
    }
    
    return suggestions;
  }
  
  private applyPattern(pattern: string, context: AssetContext): string | null {
    let result = pattern;
    
    // Replace common placeholders
    const replacements: Record<string, string> = {
      '{{bank}}': context.bank.toString(16).toUpperCase().padStart(2, '0'),
      '{{offset}}': context.offset.toString(16).toUpperCase().padStart(4, '0'),
      '{{size}}': context.size.toString(),
      '{{index}}': Math.floor(context.offset / 0x1000).toString().padStart(3, '0'),
      '{{type}}': context.classification?.graphics?.type || 'unknown',
      '{{layer}}': '0', // Default layer
      '{{asset_type}}': this.inferCategoryFromContext(context),
      '{{game}}': context.gameId || 'unknown'
    };
    
    for (const [placeholder, value] of Object.entries(replacements)) {
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }
    
    return result;
  }
  
  private applyGameSpecificNaming(context: AssetContext): NamingSuggestion[] {
    return this.gameDatabase.generateGameSpecificNames(context);
  }
  
  private generateBasicSuggestions(context: AssetContext): NamingSuggestion[] {
    const bankHex = context.bank.toString(16).toUpperCase().padStart(2, '0');
    const offsetHex = context.offset.toString(16).toUpperCase().padStart(4, '0');
    
    return [{
      name: `data_${bankHex}_${offsetHex}`,
      confidence: 0.5,
      reasoning: 'Basic naming based on memory location',
      category: 'data',
      alternatives: [
        `asset_${bankHex}_${offsetHex}`,
        `unknown_${bankHex}_${offsetHex}`,
        `rom_${context.offset.toString(16)}`
      ]
    }];
  }
  
  private inferCategoryFromContext(context: AssetContext): NamingSuggestion['category'] {
    if (context.classification?.graphics) return 'sprite';
    if (context.classification?.audio) return 'audio';
    if (context.classification?.text) return 'text';
    
    // Heuristic based on location
    if (context.bank >= 0x80) return 'code';
    if (context.offset < 0x8000) return 'data';
    
    return 'data';
  }
  
  private rankAndDeduplicate(suggestions: NamingSuggestion[]): NamingSuggestion[] {
    // Remove duplicates by name
    const unique = new Map<string, NamingSuggestion>();
    
    for (const suggestion of suggestions) {
      const existing = unique.get(suggestion.name);
      if (!existing || suggestion.confidence > existing.confidence) {
        unique.set(suggestion.name, suggestion);
      }
    }
    
    // Sort by confidence descending
    return Array.from(unique.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10); // Limit to top 10 suggestions
  }
}

/**
 * SNES-specific naming conventions
 */
class SNESNamingConventions {
  generateConventionalNames(context: AssetContext): NamingSuggestion[] {
    const suggestions: NamingSuggestion[] = [];
    
    // Bank-based naming
    if (context.bank <= 0x3F) {
      suggestions.push({
        name: `lorom_bank${context.bank.toString(16).toUpperCase()}_${context.offset.toString(16)}`,
        confidence: 0.7,
        reasoning: 'LoROM bank naming convention',
        category: 'data',
        alternatives: [],
        conventions: ['lorom', 'bank_based']
      });
    } else if (context.bank >= 0x80 && context.bank <= 0xBF) {
      suggestions.push({
        name: `hirom_bank${context.bank.toString(16).toUpperCase()}_${context.offset.toString(16)}`,
        confidence: 0.7,
        reasoning: 'HiROM bank naming convention',
        category: 'data',
        alternatives: [],
        conventions: ['hirom', 'bank_based']
      });
    }
    
    // Size-based naming
    if (context.size === 32) {
      suggestions.push({
        name: `tile_8x8_data_${context.offset.toString(16)}`,
        confidence: 0.6,
        reasoning: '32 bytes matches 4bpp 8x8 tile size',
        category: 'sprite',
        alternatives: ['chr_8x8_data', 'gfx_tile_data'],
        conventions: ['tile_size', 'snes_graphics']
      });
    }
    
    return suggestions;
  }
}

/**
 * Game-specific naming database
 */
class GameSpecificNaming {
  private gamePatterns: Record<string, GameNamingPattern> = {
    'zelda3': {
      sprites: ['link_', 'enemy_', 'npc_', 'item_'],
      audio: ['overworld_', 'dungeon_', 'boss_', 'sfx_'],
      text: ['dialogue_', 'item_name_', 'menu_'],
      commonOffsets: {
        0x80000: 'link_sprite_data',
        0x90000: 'enemy_sprite_data',
        0xA0000: 'overworld_music'
      }
    },
    'smw': {
      sprites: ['mario_', 'enemy_', 'powerup_', 'platform_'],
      audio: ['bgm_', 'sfx_', 'voice_sample_'],
      text: ['level_name_', 'message_', 'credits_'],
      commonOffsets: {
        0x83000: 'mario_graphics',
        0x94000: 'level_music'
      }
    }
  };
  
  generateGameSpecificNames(context: AssetContext): NamingSuggestion[] {
    const suggestions: NamingSuggestion[] = [];
    
    if (!context.gameId || !this.gamePatterns[context.gameId]) {
      return suggestions;
    }
    
    const pattern = this.gamePatterns[context.gameId];
    
    // Check for known offsets
    if (pattern.commonOffsets[context.offset]) {
      suggestions.push({
        name: pattern.commonOffsets[context.offset],
        confidence: 0.9,
        reasoning: `Known ${context.gameId} asset at this location`,
        category: 'sprite', // Default category
        alternatives: [],
        conventions: ['game_specific', context.gameId]
      });
    }
    
    // Apply game-specific prefixes
    const category = this.inferCategoryFromContext(context);
    let prefixes: string[] = [];
    
    switch (category) {
      case 'sprite':
        prefixes = pattern.sprites || [];
        break;
      case 'audio':
        prefixes = pattern.audio || [];
        break;
      case 'text':
        prefixes = pattern.text || [];
        break;
    }
    
    for (const prefix of prefixes) {
      suggestions.push({
        name: `${prefix}${context.offset.toString(16)}`,
        confidence: 0.75,
        reasoning: `${context.gameId}-specific naming pattern`,
        category,
        alternatives: [],
        conventions: ['game_specific', context.gameId]
      });
    }
    
    return suggestions;
  }
  
  private inferCategoryFromContext(context: AssetContext): NamingSuggestion['category'] {
    if (context.classification?.graphics) return 'sprite';
    if (context.classification?.audio) return 'audio';
    if (context.classification?.text) return 'text';
    return 'data';
  }
}

interface GameNamingPattern {
  sprites: string[];
  audio: string[];
  text: string[];
  commonOffsets: Record<number, string>;
}
