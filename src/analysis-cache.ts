/**
 * ROM Analysis Cache System
 * 
 * Reduces redundant ROM analysis calls by implementing intelligent caching
 * and streamlined validation steps while maintaining analysis integrity.
 */

import { DisassemblyLine } from './types';
import { SNESRom } from './rom-parser';
import { ValidationResult } from './validation-engine';
import { ROMAnalysis } from './enhanced-disassembly-engine';
import { ExtractedAudioState } from './spc-state-extractor';
import { createLogger, Logger } from './utils/logger';
import * as crypto from 'crypto';

export interface CacheEntry {
  hash: string;
  timestamp: number;
  data: any;
  metadata: {
    romSize: number;
    cartridgeType: string;
    version: string;
  };
}

export interface AnalysisCacheConfig {
  maxCacheAge: number; // in milliseconds
  maxCacheSize: number; // max number of entries
  enableMemoryCache: boolean;
  enablePersistentCache: boolean;
  cacheValidation: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  cacheSize: number;
}

/**
 * Centralized cache for ROM analysis results to eliminate redundant calculations
 */
export class ROMAnalysisCache {
  private memoryCache = new Map<string, CacheEntry>();
  private config: AnalysisCacheConfig;
  private logger: Logger;
  private stats: CacheStats = { hits: 0, misses: 0, evictions: 0, cacheSize: 0 };
  
  // Recursion guard: Track keys currently being processed
  private currentlyProcessing = new Set<string>();
  private recursionDepth = new Map<string, number>();
  private readonly MAX_RECURSION_DEPTH = 5;
  
  // Cache keys for different analysis types
  private static readonly CACHE_KEYS = {
    ROM_INFO: 'rom_info',
    VECTORS: 'vectors',
    BANK_LAYOUT: 'bank_layout',
    FUNCTIONS: 'functions',
    DATA_STRUCTURES: 'data_structures',
    VALIDATION: 'validation',
    AUDIO_STATE: 'audio_state',
    DISASSEMBLY: 'disassembly'
  };

  constructor(config: Partial<AnalysisCacheConfig> = {}) {
    this.config = {
      maxCacheAge: 1000 * 60 * 30, // 30 minutes
      maxCacheSize: 100,
      enableMemoryCache: true,
      enablePersistentCache: false,
      cacheValidation: true,
      ...config
    };
    this.logger = createLogger('ROMAnalysisCache');
  }

  /**
   * Generate cache key based on ROM content and analysis parameters
   */
  private generateCacheKey(rom: SNESRom, analysisType: string, params?: any): string {
    const romHash = this.calculateROMHash(rom.data);
    const paramsHash = params ? crypto.createHash('md5').update(JSON.stringify(params)).digest('hex').substring(0, 8) : '';
    return `${analysisType}_${romHash}_${paramsHash}`;
  }

  /**
   * Calculate fast hash of ROM data for cache key generation
   */
  private calculateROMHash(romData: Buffer): string {
    // Use a subset of ROM data for faster hashing while maintaining uniqueness
    const sampleSize = Math.min(0x8000, romData.length); // 32KB sample
    const sample = Buffer.concat([
      romData.slice(0, Math.min(0x200, romData.length)), // Header area
      romData.slice(Math.max(0, romData.length - 0x200)), // Vector area
      romData.slice(0x8000, 0x8000 + Math.min(0x1000, romData.length - 0x8000)) // Code area sample
    ]);
    
    return crypto.createHash('md5').update(sample).digest('hex').substring(0, 16);
  }

  /**
   * Check if cache entry is valid and not expired
   */
  private isValidCacheEntry(entry: CacheEntry): boolean {
    const now = Date.now();
    const isExpired = (now - entry.timestamp) > this.config.maxCacheAge;
    return !isExpired;
  }

  /**
   * Check if a key is currently being processed (recursion guard)
   */
  private isCurrentlyProcessing(key: string): boolean {
    return this.currentlyProcessing.has(key);
  }

  /**
   * Mark a key as currently being processed and track recursion depth
   */
  private markAsProcessing(key: string): boolean {
    const currentDepth = this.recursionDepth.get(key) || 0;
    
    if (currentDepth >= this.MAX_RECURSION_DEPTH) {
      this.logger.warn(`Maximum recursion depth (${this.MAX_RECURSION_DEPTH}) exceeded for cache key`, {
        key: key.substring(0, 16) + '...',
        depth: currentDepth
      });
      return false;
    }

    if (this.currentlyProcessing.has(key)) {
      this.logger.warn(`Recursion detected for cache key`, {
        key: key.substring(0, 16) + '...',
        depth: currentDepth
      });
      return false;
    }

    this.currentlyProcessing.add(key);
    this.recursionDepth.set(key, currentDepth + 1);
    
    this.logger.debug(`Marking key as processing`, {
      key: key.substring(0, 16) + '...',
      depth: currentDepth + 1
    });
    
    return true;
  }

  /**
   * Unmark a key as currently being processed
   */
  private unmarkAsProcessing(key: string): void {
    this.currentlyProcessing.delete(key);
    const currentDepth = this.recursionDepth.get(key) || 0;
    
    if (currentDepth <= 1) {
      this.recursionDepth.delete(key);
    } else {
      this.recursionDepth.set(key, currentDepth - 1);
    }
    
    this.logger.debug(`Unmarking key as processing`, {
      key: key.substring(0, 16) + '...',
      depth: Math.max(0, currentDepth - 1)
    });
  }

  /**
   * Get cached analysis result if available and valid
   */
  get<T>(rom: SNESRom, analysisType: string, params?: any): T | null {
    if (!this.config.enableMemoryCache) return null;

    const key = this.generateCacheKey(rom, analysisType, params);
    
    // Check for recursion
    if (this.isCurrentlyProcessing(key)) {
      this.logger.warn(`Recursion attempt detected for cache get operation`, {
        analysisType,
        key: key.substring(0, 16) + '...',
        currentDepth: this.recursionDepth.get(key) || 0
      });
      return null;
    }

    const entry = this.memoryCache.get(key);

    if (entry && this.isValidCacheEntry(entry)) {
      this.stats.hits++;
      this.logger.debug(`Cache HIT for ${analysisType}`, { key: key.substring(0, 16) + '...' });
      return entry.data as T;
    }

    this.stats.misses++;
    this.logger.debug(`Cache MISS for ${analysisType}`, { key: key.substring(0, 16) + '...' });
    return null;
  }

  /**
   * Store analysis result in cache
   */
  set<T>(rom: SNESRom, analysisType: string, data: T, params?: any): void {
    if (!this.config.enableMemoryCache) return;

    const key = this.generateCacheKey(rom, analysisType, params);
    
    // Check for recursion
    if (this.isCurrentlyProcessing(key)) {
      this.logger.warn(`Recursion attempt detected for cache set operation`, {
        analysisType,
        key: key.substring(0, 16) + '...',
        currentDepth: this.recursionDepth.get(key) || 0
      });
      return;
    }
    
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.config.maxCacheSize) {
      this.evictOldestEntry();
    }

    const entry: CacheEntry = {
      hash: key,
      timestamp: Date.now(),
      data,
      metadata: {
        romSize: rom.data.length,
        cartridgeType: rom.cartridgeInfo.type,
        version: '1.0'
      }
    };

    this.memoryCache.set(key, entry);
    this.stats.cacheSize = this.memoryCache.size;
    
    this.logger.debug(`Cached ${analysisType}`, { 
      key: key.substring(0, 16) + '...', 
      size: this.memoryCache.size 
    });
  }

  /**
   * Evict oldest cache entry (LRU)
   */
  private evictOldestEntry(): void {
    let oldestKey = '';
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      this.stats.evictions++;
      this.logger.debug(`Evicted cache entry`, { key: oldestKey.substring(0, 16) + '...' });
    }
  }

  /**
   * Invalidate all cache entries for a specific ROM
   */
  invalidateROM(rom: SNESRom): void {
    const romHash = this.calculateROMHash(rom.data);
    const keysToDelete: string[] = [];

    for (const key of this.memoryCache.keys()) {
      if (key.includes(romHash)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.memoryCache.delete(key));
    this.stats.cacheSize = this.memoryCache.size;
    
    this.logger.info(`Invalidated ${keysToDelete.length} cache entries for ROM`);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.memoryCache.size;
    this.memoryCache.clear();
    this.stats.cacheSize = 0;
    this.logger.info(`Cleared ${size} cache entries`);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * Begin processing for a specific analysis operation (public API)
   * Returns false if recursion is detected or max depth exceeded
   */
  beginProcessing(rom: SNESRom, analysisType: string, params?: any): boolean {
    const key = this.generateCacheKey(rom, analysisType, params);
    return this.markAsProcessing(key);
  }

  /**
   * End processing for a specific analysis operation (public API)
   */
  endProcessing(rom: SNESRom, analysisType: string, params?: any): void {
    const key = this.generateCacheKey(rom, analysisType, params);
    this.unmarkAsProcessing(key);
  }

  /**
   * Check if a specific analysis operation is currently being processed
   */
  isProcessing(rom: SNESRom, analysisType: string, params?: any): boolean {
    const key = this.generateCacheKey(rom, analysisType, params);
    return this.isCurrentlyProcessing(key);
  }

  /**
   * Get current recursion depth for a specific operation
   */
  getRecursionDepth(rom: SNESRom, analysisType: string, params?: any): number {
    const key = this.generateCacheKey(rom, analysisType, params);
    return this.recursionDepth.get(key) || 0;
  }

  /**
   * Clear all processing state (useful for cleanup after errors)
   */
  clearProcessingState(): void {
    const processingCount = this.currentlyProcessing.size;
    const depthCount = this.recursionDepth.size;
    
    this.currentlyProcessing.clear();
    this.recursionDepth.clear();
    
    if (processingCount > 0 || depthCount > 0) {
      this.logger.warn(`Cleared orphaned processing state`, {
        processingKeys: processingCount,
        depthEntries: depthCount
      });
    }
  }

  /**
   * Convenience methods for specific analysis types
   */
  
  getROMInfo(rom: SNESRom): SNESRom | null {
    return this.get<SNESRom>(rom, ROMAnalysisCache.CACHE_KEYS.ROM_INFO);
  }

  setROMInfo(rom: SNESRom): void {
    this.set(rom, ROMAnalysisCache.CACHE_KEYS.ROM_INFO, rom);
  }

  getVectors(rom: SNESRom): any[] | null {
    return this.get<any[]>(rom, ROMAnalysisCache.CACHE_KEYS.VECTORS);
  }

  setVectors(rom: SNESRom, vectors: any[]): void {
    this.set(rom, ROMAnalysisCache.CACHE_KEYS.VECTORS, vectors);
  }

  getBankLayout(rom: SNESRom): any[] | null {
    return this.get<any[]>(rom, ROMAnalysisCache.CACHE_KEYS.BANK_LAYOUT);
  }

  setBankLayout(rom: SNESRom, bankLayout: any[]): void {
    this.set(rom, ROMAnalysisCache.CACHE_KEYS.BANK_LAYOUT, bankLayout);
  }

  getFunctions(rom: SNESRom, params?: any): { functions: any[]; data: any[]; } | null {
    return this.get<{ functions: any[]; data: any[]; }>(rom, ROMAnalysisCache.CACHE_KEYS.FUNCTIONS, params);
  }

  setFunctions(rom: SNESRom, functions: { functions: any[]; data: any[]; }, params?: any): void {
    this.set(rom, ROMAnalysisCache.CACHE_KEYS.FUNCTIONS, functions, params);
  }

  getValidationResult(rom: SNESRom, params?: any): ValidationResult | null {
    return this.get<ValidationResult>(rom, ROMAnalysisCache.CACHE_KEYS.VALIDATION, params);
  }

  setValidationResult(rom: SNESRom, result: ValidationResult, params?: any): void {
    this.set(rom, ROMAnalysisCache.CACHE_KEYS.VALIDATION, result, params);
  }

  getAudioState(rom: SNESRom): ExtractedAudioState | null {
    return this.get<ExtractedAudioState>(rom, ROMAnalysisCache.CACHE_KEYS.AUDIO_STATE);
  }

  setAudioState(rom: SNESRom, audioState: ExtractedAudioState): void {
    this.set(rom, ROMAnalysisCache.CACHE_KEYS.AUDIO_STATE, audioState);
  }

  getDisassembly(rom: SNESRom, params: { start: number, end: number }): DisassemblyLine[] | null {
    return this.get<DisassemblyLine[]>(rom, ROMAnalysisCache.CACHE_KEYS.DISASSEMBLY, params);
  }

  setDisassembly(rom: SNESRom, lines: DisassemblyLine[], params: { start: number, end: number }): void {
    this.set(rom, ROMAnalysisCache.CACHE_KEYS.DISASSEMBLY, lines, params);
  }
}

/**
 * Singleton cache instance for global use
 */
export const globalROMCache = new ROMAnalysisCache();

