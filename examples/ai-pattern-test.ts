#!/usr/bin/env ts-node

/**
 * AI Pattern Recognition Test
 * Demonstrates the new AI-enhanced pattern recognition capabilities
 */

import { SNESDisassembler, AIPatternRecognizer, AssetExtractor } from '../src/index';
import { promises as fs } from 'fs';

async function testAIPatternRecognition() {
  console.log('🧠 Testing AI Pattern Recognition with ALTTP ROM');
  console.log('================================================\n');

  try {
    // Load ALTTP ROM
    const romData = await fs.readFile('roms/alttp.smc');
    console.log(`📁 Loaded ROM: ${romData.length} bytes\n`);

    // Initialize AI Pattern Recognizer
    console.log('🔬 Initializing AI Pattern Recognizer...');
    const aiRecognizer = new AIPatternRecognizer();
    
    // Test graphics data classification
    console.log('\n📊 Testing Graphics Classification:');
    const graphicsData = romData.slice(0x8000, 0x8000 + 32); // First tile
    const graphicsClassification = await aiRecognizer.classifyGraphicsData(graphicsData, '4bpp');
    
    console.log(`  Type: ${graphicsClassification.type}`);
    console.log(`  Confidence: ${(graphicsClassification.confidence * 100).toFixed(1)}%`);
    console.log(`  Format: ${graphicsClassification.format}`);
    
    // Test audio data classification  
    console.log('\n🎵 Testing Audio Classification:');
    const audioData = romData.slice(0x0C0000, 0x0C0000 + 64); // Audio region
    const audioClassification = await aiRecognizer.classifyAudioData(audioData);
    
    console.log(`  Type: ${audioClassification.type}`);
    console.log(`  Confidence: ${(audioClassification.confidence * 100).toFixed(1)}%`);
    console.log(`  Encoding: ${audioClassification.encoding}`);
    
    // Test text data classification
    console.log('\n📝 Testing Text Classification:');
    const textData = romData.slice(0x10000, 0x10000 + 128); // Text region  
    const textClassification = await aiRecognizer.classifyTextData(textData);
    
    console.log(`  Type: ${textClassification.type}`);
    console.log(`  Confidence: ${(textClassification.confidence * 100).toFixed(1)}%`);
    console.log(`  Encoding: ${textClassification.encoding}`);
    console.log(`  Compression: ${textClassification.compression}`);
    
    // Test compression detection
    console.log('\n🗜️  Testing Compression Detection:');
    const compressionData = romData.slice(0x20000, 0x20000 + 256);
    const compressionInfo = await aiRecognizer.detectCompression(compressionData);
    
    console.log(`  Type: ${compressionInfo.type}`);
    console.log(`  Confidence: ${(compressionInfo.confidence * 100).toFixed(1)}%`);
    
    // Test comprehensive region analysis
    console.log('\n🔍 Testing Comprehensive Region Analysis:');
    const regionData = romData.slice(0x8000, 0x8000 + 512);
    const regionAnalysis = await aiRecognizer.classifyDataRegion(romData, 0x8000, 512);
    
    console.log(`  Most Likely Type: ${regionAnalysis.mostLikely}`);
    console.log(`  Overall Confidence: ${(regionAnalysis.confidence * 100).toFixed(1)}%`);
    
    if (regionAnalysis.graphics) {
      console.log(`  Graphics Classification: ${regionAnalysis.graphics.type} (${(regionAnalysis.graphics.confidence * 100).toFixed(1)}%)`);
    }
    if (regionAnalysis.audio) {
      console.log(`  Audio Classification: ${regionAnalysis.audio.type} (${(regionAnalysis.audio.confidence * 100).toFixed(1)}%)`);
    }
    if (regionAnalysis.text) {
      console.log(`  Text Classification: ${regionAnalysis.text.type} (${(regionAnalysis.text.confidence * 100).toFixed(1)}%)`);
    }
    if (regionAnalysis.compression) {
      console.log(`  Compression: ${regionAnalysis.compression.type} (${(regionAnalysis.compression.confidence * 100).toFixed(1)}%)`);
    }

    // Test with AssetExtractor
    console.log('\n⚙️  Testing AI-Enhanced Asset Extraction:');
    const assetExtractor = new AssetExtractor(true); // Enable AI
    const assets = await assetExtractor.extractAssets(romData);
    
    console.log(`  Graphics tiles: ${assets.graphics.tiles.length}`);
    console.log(`  Text strings: ${assets.text.strings.length}`);
    
    // Show AI classification for first few tiles
    console.log('\n🎨 Sample Tile Classifications:');
    for (let i = 0; i < Math.min(5, assets.graphics.tiles.length); i++) {
      const tile = assets.graphics.tiles[i];
      if (tile.aiClassification) {
        console.log(`  Tile ${i}: ${tile.aiClassification.type} (${(tile.aiClassification.confidence * 100).toFixed(1)}%)`);
      }
    }
    
    console.log('\n✅ AI Pattern Recognition test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAIPatternRecognition().catch(console.error);