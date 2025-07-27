/**
 * Test Suite for GenAI Integration Features
 * 
 * Tests all AI-powered features including:
 * - Configuration management
 * - Pattern recognition
 * - Naming suggestions
 * - Documentation generation
 */

import { AIConfigManager, DEFAULT_AI_CONFIG } from '../src/ai-config';
import { AIPatternRecognizer } from '../src/ai-pattern-recognition';
import { AINameSuggester } from '../src/ai-naming-suggestions';
import { AIDocumentationGenerator, MarkdownExporter } from '../src/ai-documentation';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('GenAI Integration Features', () => {
  let configManager: AIConfigManager;
  let patternRecognizer: AIPatternRecognizer;
  let nameSuggester: AINameSuggester;
  let docGenerator: AIDocumentationGenerator;
  
  const testOutputDir = './output';
  const testDocsDir = './docs';
  
  beforeAll(async () => {
    // Ensure test directories exist
    await fs.mkdir(testOutputDir, { recursive: true });
    await fs.mkdir(testDocsDir, { recursive: true });
  });
  
  beforeEach(() => {
    configManager = new AIConfigManager('./test-ai-config.json');
    patternRecognizer = new AIPatternRecognizer();
    nameSuggester = new AINameSuggester(configManager);
    docGenerator = new AIDocumentationGenerator(configManager, patternRecognizer, nameSuggester);
  });
  
  afterEach(async () => {
    // Clean up test config file
    try {
      await fs.unlink('./test-ai-config.json');
    } catch (error) {
      // File might not exist, ignore
    }
  });

  describe('AI Configuration Management', () => {
    test('should use default configuration when no config file exists', async () => {
      const config = await configManager.loadConfig();
      
      expect(config.enabled).toBe(false); // AI disabled by default
      expect(config.graphicsClassification.enabled).toBe(false);
      expect(config.namingSuggestions.enabled).toBe(false);
      expect(config.documentationGeneration.enabled).toBe(false);
    });
    
    test('should create sample configuration', async () => {
      await configManager.createSampleConfig();
      
      const sampleExists = await fs.access('./ai-config.sample.json')
        .then(() => true)
        .catch(() => false);
      
      expect(sampleExists).toBe(true);
      
      // Clean up
      await fs.unlink('./ai-config.sample.json');
    });
    
    test('should save and load custom configuration', async () => {
      const customConfig = {
        ...DEFAULT_AI_CONFIG,
        enabled: true,
        namingSuggestions: {
          ...DEFAULT_AI_CONFIG.namingSuggestions,
          enabled: true
        }
      };
      
      configManager.updateConfig(customConfig);
      await configManager.saveConfig();
      
      const loadedConfig = await configManager.loadConfig();
      expect(loadedConfig.enabled).toBe(true);
      expect(loadedConfig.namingSuggestions.enabled).toBe(true);
    });
    
    test('should check feature availability', async () => {
      expect(configManager.isAIEnabled()).toBe(false);
      expect(configManager.isFeatureEnabled('namingSuggestions')).toBe(false);
      
      configManager.updateConfig({ enabled: true });
      expect(configManager.isAIEnabled()).toBe(true);
    });
  });

  describe('Pattern Recognition', () => {
    test('should classify graphics data', async () => {
      // Create sample graphics data (4bpp tile pattern)
      const graphicsData = new Uint8Array([
        0x00, 0xFF, 0x00, 0xFF, 0x81, 0x7E, 0x81, 0x7E,
        0x00, 0xFF, 0x00, 0xFF, 0x81, 0x7E, 0x81, 0x7E,
        0x42, 0xBD, 0x42, 0xBD, 0x24, 0xDB, 0x24, 0xDB,
        0x18, 0xE7, 0x18, 0xE7, 0x00, 0xFF, 0x00, 0xFF
      ]);
      
      const classification = await patternRecognizer.classifyGraphicsData(graphicsData, '4bpp');
      
      expect(classification.type).toBeDefined();
      expect(classification.confidence).toBeGreaterThan(0);
      expect(classification.format).toBe('4bpp');
      expect(classification.dimensions).toBeDefined();
    });
    
    test('should classify audio data', async () => {
      // Create sample BRR audio data pattern
      const audioData = new Uint8Array([
        0x0C, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, // BRR block 1
        0x0C, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, // BRR block 2
        0x1C, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17  // BRR block 3 (end)
      ]);
      
      const classification = await patternRecognizer.classifyAudioData(audioData, 0);
      
      expect(classification.type).toBeDefined();
      expect(classification.confidence).toBeGreaterThan(0);
      expect(['brr_sample', 'sequence', 'spc_code', 'instrument']).toContain(classification.type);
    });
    
    test('should classify text data', async () => {
      // Create sample ASCII text data
      const textData = new Uint8Array([
        ...Buffer.from('Hello World! This is a test message for SNES text classification.', 'ascii')
      ]);
      
      const classification = await patternRecognizer.classifyTextData(textData, 0);
      
      expect(classification.type).toBeDefined();
      expect(classification.confidence).toBeGreaterThan(0);
      expect(classification.encoding).toBeDefined();
      expect(['dialogue', 'menu', 'item_name', 'credits', 'code_comment']).toContain(classification.type);
    });
    
    test('should detect compression', async () => {
      // Create sample data with repetitive patterns (RLE-like)
      const compressedData = new Uint8Array([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0x55, 0x55, 0x55, 0x55, 0xAA, 0xAA, 0xAA, 0xAA
      ]);
      
      const compression = await patternRecognizer.detectCompression(compressedData);
      
      expect(compression.type).toBeDefined();
      expect(compression.confidence).toBeGreaterThan(0);
      expect(['RLE', 'LZ77', 'LZSS', 'DTE', 'dictionary', 'huffman', 'none']).toContain(compression.type);
    });
    
    test('should perform comprehensive data region analysis', async () => {
      const testData = new Uint8Array(256);
      // Fill with mixed pattern data
      for (let i = 0; i < 256; i++) {
        testData[i] = i % 16;
      }
      
      const analysis = await patternRecognizer.classifyDataRegion(testData, 0, 256);
      
      expect(analysis.mostLikely).toBeDefined();
      expect(analysis.confidence).toBeGreaterThan(0);
      expect(['graphics', 'audio', 'text', 'code', 'unknown']).toContain(analysis.mostLikely);
    });
  });

  describe('Naming Suggestions', () => {
    test('should generate basic naming suggestions when AI is disabled', async () => {
      const context = {
        offset: 0x80000,
        size: 32,
        bank: 0x80,
        classification: {}
      };
      
      const suggestions = await nameSuggester.suggestNames(context);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].name).toMatch(/data_80_80000/);
      expect(suggestions[0].category).toBe('data');
    });
    
    test('should generate contextual naming suggestions', async () => {
      // Enable naming suggestions
      configManager.updateConfig({
        enabled: true,
        namingSuggestions: { enabled: true, useContextualNames: true, useSNESConventions: true }
      });
      
      const context = {
        offset: 0x80000,
        size: 32,
        bank: 0x80,
        classification: {
          graphics: {
            type: 'sprite' as const,
            confidence: 0.8,
            format: '4bpp' as const,
            dimensions: { width: 8, height: 8 }
          }
        }
      };
      
      const suggestions = await nameSuggester.suggestNames(context);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].confidence).toBeGreaterThan(0);
      expect(suggestions[0].name).toBeDefined();
      expect(suggestions[0].reasoning).toBeDefined();
    });
    
    test('should apply SNES conventions', async () => {
      configManager.updateConfig({
        enabled: true,
        namingSuggestions: { enabled: true, useContextualNames: false, useSNESConventions: true }
      });
      
      const context = {
        offset: 0x8000,
        size: 32,
        bank: 0x00 // LoROM bank
      };
      
      const suggestions = await nameSuggester.suggestNames(context);
      
      expect(suggestions.length).toBeGreaterThan(0);
      const hasLoROMSuggestion = suggestions.some(s => s.name.includes('lorom') || s.conventions?.includes('lorom'));
      expect(hasLoROMSuggestion).toBe(true);
    });
    
    test('should apply custom patterns', async () => {
      configManager.updateConfig({
        enabled: true,
        namingSuggestions: {
          enabled: true,
          useContextualNames: false,
          useSNESConventions: false,
          customPatterns: ['test_{{bank}}_{{offset}}', 'custom_{{size}}_bytes']
        }
      });
      
      const context = {
        offset: 0x1000,
        size: 64,
        bank: 0x01
      };
      
      const suggestions = await nameSuggester.suggestNames(context);
      
      expect(suggestions.length).toBeGreaterThan(0);
      const hasCustomPattern = suggestions.some(s => 
        s.name.includes('test_01_1000') || s.name.includes('custom_64_bytes')
      );
      expect(hasCustomPattern).toBe(true);
    });
  });

  describe('Documentation Generation', () => {
    test('should generate basic documentation when AI is disabled', async () => {
      const testData = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
      
      const documentation = await docGenerator.generateDocumentation(testData, 0x80000, 4);
      
      expect(documentation.title).toBeDefined();
      expect(documentation.summary).toBeDefined();
      expect(documentation.details).toBeDefined();
      expect(documentation.confidence).toBeDefined();
      expect(documentation.title).toMatch(/Basic Asset Documentation/);
    });
    
    test('should generate comprehensive documentation when AI is enabled', async () => {
      configManager.updateConfig({
        enabled: true,
        documentationGeneration: {
          enabled: true,
          generateComments: true,
          generateDocs: true,
          style: 'technical',
          includeConfidence: true
        }
      });
      
      const testData = new Uint8Array(64);
      // Create pattern that looks like graphics data
      for (let i = 0; i < 64; i++) {
        testData[i] = (i % 16) << 4 | ((i + 1) % 16);
      }
      
      const documentation = await docGenerator.generateDocumentation(testData, 0x90000, 64);
      
      expect(documentation.title).toBeDefined();
      expect(documentation.summary).toContain('AI analysis');
      expect(documentation.details).toContain('Asset Classification');
      expect(documentation.details).toContain('Technical Details');
      expect(documentation.confidence).toBeGreaterThan(0);
      expect(documentation.recommendations).toBeDefined();
    });
    
    test('should generate assembly code comments', async () => {
      configManager.updateConfig({
        enabled: true,
        documentationGeneration: {
          enabled: true,
          generateComments: true,
          generateDocs: true,
          style: 'technical',
          includeConfidence: false
        }
      });
      
      const testData = new Uint8Array([0xA9, 0x01, 0x8D, 0x00, 0x21]);
      const assemblyCode = `LDA #$01\nSTA $2100\nRTS`;
      
      const documentation = await docGenerator.generateDocumentation(testData, 0x80000, 5, assemblyCode);
      
      expect(documentation.codeComments).toBeDefined();
      expect(documentation.codeComments!.length).toBeGreaterThan(0);
      expect(documentation.details).toContain('Assembly Code Analysis');
    });
    
    test('should export documentation to markdown', async () => {
      const testDoc = {
        title: 'Test Documentation',
        summary: 'This is a test summary',
        details: 'These are test details',
        confidence: 0.85,
        recommendations: ['Test recommendation']
      };
      
      const outputPath = path.join(testDocsDir, 'test-doc.md');
      await MarkdownExporter.exportToMarkdown(testDoc, outputPath);
      
      const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
      
      const content = await fs.readFile(outputPath, 'utf8');
      expect(content).toContain('# Test Documentation');
      expect(content).toContain('## Summary');
      expect(content).toContain('This is a test summary');
      
      // Clean up
      await fs.unlink(outputPath);
    });
  });

  describe('Integration Tests', () => {
    test('should work together - full pipeline', async () => {
      // Enable all AI features
      configManager.updateConfig({
        enabled: true,
        graphicsClassification: { ...DEFAULT_AI_CONFIG.graphicsClassification, enabled: true },
        namingSuggestions: {
          enabled: true,
          useContextualNames: true,
          useSNESConventions: true,
          customPatterns: ['{{game}}_{{asset_type}}_{{index}}']
        },
        documentationGeneration: {
          enabled: true,
          generateComments: true,
          generateDocs: true,
          style: 'technical',
          includeConfidence: true
        }
      });
      
      // Create test data that resembles SNES graphics
      const testData = new Uint8Array(128);
      for (let i = 0; i < 128; i += 2) {
        testData[i] = 0xFF;
        testData[i + 1] = 0x00;
      }
      
      // Run full analysis pipeline
      const analysis = await patternRecognizer.classifyDataRegion(testData, 0, 128);
      
      const context = {
        offset: 0x90000,
        size: 128,
        bank: 0x90,
        gameId: 'zelda3',
        classification: analysis
      };
      
      const names = await nameSuggester.suggestNames(context);
      const docs = await docGenerator.generateDocumentation(testData, 0x90000, 128);
      
      // Export to files
      const outputPath = path.join(testOutputDir, 'integration-test.md');
      await MarkdownExporter.exportToMarkdown(docs, outputPath);
      
      // Verify results
      expect(analysis.mostLikely).toBeDefined();
      expect(names.length).toBeGreaterThan(0);
      expect(docs.title).toBeDefined();
      expect(docs.hardwareContext).toBeDefined();
      
      const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
      
      // Clean up
      await fs.unlink(outputPath);
    });
  });
});
