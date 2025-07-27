/**
 * SNES Asset Extraction Handler
 * 
 * Handles extraction of graphics, audio, and text assets from SNES ROMs
 * with improved error handling and AI-enhanced pattern recognition.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { AssetExtractor } from './asset-extractor';
import { CLIOptions } from './disassembly-handler';

export async function extractAssets(romFile: string, options: CLIOptions, outputDir: string): Promise<void> {
  if (options.verbose) {
    console.log('\n🎨 Extracting Assets...');
  }

  try {
    // Read ROM data
    const romData = await fs.readFile(romFile);
    
    // AI enhancement is enabled by default, can be disabled with --disable-ai
    const assetExtractor = new AssetExtractor(!options.disableAI);
    
    // Parse asset types to extract
    const assetTypes = (options.assetTypes || 'graphics,audio,text').split(',').map(t => t.trim());
    const graphicsFormats = (options.assetFormats || '4bpp').split(',').map(f => f.trim() as any);
    
    const baseName = path.basename(romFile, path.extname(romFile));
    const assetDir = path.join(outputDir, `${baseName}_assets`);
    await fs.mkdir(assetDir, { recursive: true });

    const startTime = Date.now();
    let totalAssetsExtracted = 0;

    // Extract graphics assets
    if (assetTypes.includes('graphics')) {
      const graphicsCount = await extractGraphicsAssets(
        romData, 
        assetExtractor, 
        assetDir, 
        graphicsFormats, 
        options.verbose || false
      );
      totalAssetsExtracted += graphicsCount;
    }

    // Extract audio assets
    if (assetTypes.includes('audio')) {
      const audioCount = await extractAudioAssets(
        romData, 
        assetExtractor, 
        assetDir, 
        options.verbose || false
      );
      totalAssetsExtracted += audioCount;
    }

    // Extract text assets
    if (assetTypes.includes('text')) {
      const textCount = await extractTextAssets(
        romData, 
        assetExtractor, 
        assetDir, 
        options.verbose || false
      );
      totalAssetsExtracted += textCount;
    }

    const extractionTime = Date.now() - startTime;
    
    if (options.verbose) {
      console.log(`✅ Asset extraction completed in ${extractionTime}ms`);
      console.log(`📁 Assets directory: ${assetDir}`);
      console.log(`📊 Total assets extracted: ${totalAssetsExtracted}`);
    } else {
      console.log(`Assets extracted: ${assetDir} (${totalAssetsExtracted} items)`);
    }

  } catch (error) {
    throw new Error(`Asset extraction failed: ${error instanceof Error ? error.message : error}`);
  }
}

async function extractGraphicsAssets(
  romData: Buffer,
  assetExtractor: AssetExtractor,
  assetDir: string,
  graphicsFormats: string[],
  verbose: boolean
): Promise<number> {
  if (verbose) {
    console.log('  📊 Extracting graphics...');
  }
  
  const graphicsDir = path.join(assetDir, 'graphics');
  await fs.mkdir(graphicsDir, { recursive: true });
  
  const graphicsExtractor = assetExtractor.getGraphicsExtractor();
  let totalExtracted = 0;
  
  // Extract tiles for each format
  for (const format of graphicsFormats) {
    const formatDir = path.join(graphicsDir, format);
    await fs.mkdir(formatDir, { recursive: true });
    
    // Use more sophisticated region detection for graphics data
    const graphicsRegions = detectGraphicsRegions(romData, format);
    
    for (const region of graphicsRegions) {
      const regionData = romData.slice(region.start, region.end);
      const tiles = await graphicsExtractor.extractTiles(regionData, format, region.start);
      
      if (tiles.length > 0) {
        // Save tile data as JSON with enhanced metadata
        const tilesData = {
          format,
          region: {
            start: region.start,
            end: region.end,
            type: region.type
          },
          count: tiles.length,
          tiles: tiles.map(tile => ({
            address: tile.address,
            width: tile.width,
            height: tile.height,
            bitsPerPixel: tile.bitsPerPixel,
            data: Array.from(tile.data),
            metadata: tile.metadata || {}
          }))
        };
        
        const regionName = region.type.toLowerCase().replace(/\s+/g, '_');
        await fs.writeFile(
          path.join(formatDir, `tiles_${regionName}.json`), 
          JSON.stringify(tilesData, null, 2)
        );
        
        totalExtracted += tiles.length;
        
        if (verbose && tiles.length > 0) {
          console.log(`    - ${format} (${region.type}): ${tiles.length} tiles extracted`);
        }
      }
    }
  }
  
  // Extract palettes with improved detection
  if (romData.length > 0x1000) {
    const paletteCount = await extractPaletteData(romData, graphicsExtractor, graphicsDir, verbose);
    totalExtracted += paletteCount;
  }
  
  return totalExtracted;
}

function detectGraphicsRegions(romData: Buffer, format: string): Array<{start: number, end: number, type: string}> {
  const regions = [];
  
  // Standard graphics regions for different formats
  switch (format) {
    case '2bpp':
      regions.push(
        { start: 0x8000, end: 0x10000, type: 'Character Data' },
        { start: 0x20000, end: 0x30000, type: 'Background Graphics' }
      );
      break;
    case '4bpp':
      regions.push(
        { start: 0x8000, end: 0x20000, type: 'Sprite Graphics' },
        { start: 0x40000, end: 0x60000, type: 'Background Graphics' },
        { start: 0x80000, end: 0xA0000, type: 'Character Data' }
      );
      break;
    case '8bpp':
      regions.push(
        { start: 0x10000, end: 0x30000, type: 'Mode 7 Graphics' },
        { start: 0x60000, end: 0x80000, type: 'Full Color Graphics' }
      );
      break;
    default:
      regions.push({ start: 0x8000, end: Math.min(0x20000, romData.length), type: 'General Graphics' });
  }
  
  // Filter regions that actually exist in the ROM
  return regions.filter(region => region.start < romData.length && region.end <= romData.length);
}

async function extractPaletteData(
  romData: Buffer,
  graphicsExtractor: any,
  graphicsDir: string,
  verbose: boolean
): Promise<number> {
  // Look for palette data in multiple locations
  const paletteRegions = [
    { start: 0x0, end: 0x1000, type: 'Header Palettes' },
    { start: 0x8000, end: 0x8200, type: 'Character Palettes' },
    { start: 0x10000, end: 0x10200, type: 'Background Palettes' }
  ];
  
  let totalPalettes = 0;
  const allPalettes = [];
  
  for (const region of paletteRegions) {
    if (region.start < romData.length) {
      const regionEnd = Math.min(region.end, romData.length);
      const paletteData = romData.slice(region.start, regionEnd);
      const palettes = graphicsExtractor.extractPalettes(paletteData, region.start);
      
      if (palettes.length > 0) {
        palettes.forEach((palette: any) => {
          palette.region = region.type;
          allPalettes.push(palette);
        });
        totalPalettes += palettes.length;
      }
    }
  }
  
  if (allPalettes.length > 0) {
    const palettesData = {
      count: allPalettes.length,
      palettes: allPalettes.map(palette => ({
        address: palette.address,
        format: palette.format,
        region: palette.region,
        colors: palette.colors.map((color: number) => `#${color.toString(16).padStart(6, '0')}`),
        metadata: palette.metadata || {}
      }))
    };
    
    await fs.writeFile(
      path.join(graphicsDir, 'palettes.json'),
      JSON.stringify(palettesData, null, 2)
    );
    
    if (verbose) {
      console.log(`    - ${allPalettes.length} palettes extracted from ${paletteRegions.length} regions`);
    }
  }
  
  return totalPalettes;
}

async function extractAudioAssets(
  romData: Buffer,
  assetExtractor: AssetExtractor,
  assetDir: string,
  verbose: boolean
): Promise<number> {
  if (verbose) {
    console.log('  🎵 Extracting audio...');
  }
  
  const audioDir = path.join(assetDir, 'audio');
  await fs.mkdir(audioDir, { recursive: true });
  
  const audioExtractor = assetExtractor.getAudioExtractor();
  
  // Enhanced audio region detection based on common SNES patterns
  const audioRegions = detectAudioRegions(romData);
  
  let allSamples: any[] = [];
  let allSequences: any[] = [];
  
  for (const region of audioRegions) {
    if (romData.length > region.start && region.start < romData.length) {
      const regionEnd = Math.min(region.end, romData.length);
      const audioData = romData.slice(region.start, regionEnd);
      
      // Extract BRR samples
      const samples = await audioExtractor.extractBRRSamples(audioData, region.start);
      samples.forEach((sample: any) => {
        sample.region = region.type;
        allSamples.push(sample);
      });
      
      // Extract music sequences if available
      try {
        const sequences = await audioExtractor.extractMusicSequences(audioData, region.start);
        sequences.forEach((sequence: any) => {
          sequence.region = region.type;
          allSequences.push(sequence);
        });
      } catch (error) {
        // Music sequence extraction is optional
        if (verbose) {
          console.log(`    - No music sequences found in ${region.type}`);
        }
      }
      
      if (verbose && (samples.length > 0 || allSequences.length > 0)) {
        console.log(`    - ${region.type}: ${samples.length} samples, ${sequences.length || 0} sequences`);
      }
    }
  }
  
  let totalExtracted = 0;
  
  // Save sample data
  if (allSamples.length > 0) {
    const samplesData = {
      count: allSamples.length,
      samples: allSamples.map(sample => ({
        name: sample.name,
        address: sample.address,
        region: sample.region,
        sampleRate: sample.sampleRate,
        loopStart: sample.loopStart,
        loopEnd: sample.loopEnd,
        dataLength: sample.data.length,
        metadata: sample.metadata || {}
      }))
    };
    
    await fs.writeFile(
      path.join(audioDir, 'samples.json'),
      JSON.stringify(samplesData, null, 2)
    );
    
    // Save individual sample files
    for (let i = 0; i < allSamples.length; i++) {
      const sample = allSamples[i];
      const sampleName = sample.name || `sample_${i.toString().padStart(3, '0')}`;
      await fs.writeFile(
        path.join(audioDir, `${sampleName}.brr`),
        sample.data
      );
    }
    
    totalExtracted += allSamples.length;
  }
  
  // Save sequence data
  if (allSequences.length > 0) {
    const sequencesData = {
      count: allSequences.length,
      sequences: allSequences.map(seq => ({
        name: seq.name,
        address: seq.address,
        region: seq.region,
        length: seq.length,
        tracks: seq.tracks,
        metadata: seq.metadata || {}
      }))
    };
    
    await fs.writeFile(
      path.join(audioDir, 'sequences.json'),
      JSON.stringify(sequencesData, null, 2)
    );
    
    totalExtracted += allSequences.length;
  }
  
  if (verbose && totalExtracted > 0) {
    console.log(`    - Total audio assets: ${totalExtracted} (${allSamples.length} samples, ${allSequences.length} sequences)`);
  }
  
  return totalExtracted;
}

function detectAudioRegions(romData: Buffer): Array<{start: number, end: number, type: string}> {
  const regions = [
    { start: 0x0C0000, end: 0x0E0000, type: 'SPC Engine' },
    { start: 0x100000, end: 0x120000, type: 'Music Data' },
    { start: 0x080000, end: 0x0A0000, type: 'Sound Effects' },
    { start: 0x0E0000, end: 0x100000, type: 'BRR Samples' },
    { start: 0x120000, end: 0x140000, type: 'Additional Audio' }
  ];
  
  // Filter regions that exist in the ROM
  return regions.filter(region => region.start < romData.length);
}

async function extractTextAssets(
  romData: Buffer,
  assetExtractor: AssetExtractor,
  assetDir: string,
  verbose: boolean
): Promise<number> {
  if (verbose) {
    console.log('  📝 Extracting text...');
  }
  
  const textDir = path.join(assetDir, 'text');
  await fs.mkdir(textDir, { recursive: true });
  
  const textExtractor = assetExtractor.getTextExtractor();
  const encoding = textExtractor.detectEncoding(romData);
  
  if (verbose) {
    console.log(`    - Detected encoding: ${encoding}`);
  }
  
  // Extract text from multiple regions
  const textRegions = detectTextRegions(romData, encoding);
  let allStrings: any[] = [];
  
  for (const region of textRegions) {
    if (region.start < romData.length) {
      const regionEnd = Math.min(region.end, romData.length);
      const regionData = romData.slice(region.start, regionEnd);
      
      const strings = await textExtractor.extractStrings(regionData, encoding, region.start, 4);
      strings.forEach((str: any) => {
        str.region = region.type;
        allStrings.push(str);
      });
      
      if (verbose && strings.length > 0) {
        console.log(`    - ${region.type}: ${strings.length} strings`);
      }
    }
  }
  
  if (allStrings.length > 0) {
    // Remove duplicates based on text content
    const uniqueStrings = allStrings.filter((str, index, arr) => 
      arr.findIndex(s => s.text === str.text) === index
    );
    
    const textData = {
      encoding,
      totalStrings: allStrings.length,
      uniqueStrings: uniqueStrings.length,
      regions: textRegions.map(r => r.type),
      strings: uniqueStrings.map(str => ({
        text: str.text,
        address: str.address,
        region: str.region,
        length: str.length,
        context: str.context,
        metadata: str.metadata || {}
      }))
    };
    
    await fs.writeFile(
      path.join(textDir, 'strings.json'),
      JSON.stringify(textData, null, 2)
    );
    
    // Create categorized text files
    const categories = groupStringsByCategory(uniqueStrings);
    for (const [category, strings] of Object.entries(categories)) {
      const categoryText = strings
        .map((str: any) => `[${str.address.toString(16).toUpperCase().padStart(6, '0')}] ${str.text}`)
        .join('\n');
      
      await fs.writeFile(
        path.join(textDir, `${category.toLowerCase().replace(/\s+/g, '_')}.txt`),
        categoryText
      );
    }
    
    // Create comprehensive readable text file
    const readableText = uniqueStrings
      .map(str => `[${str.address.toString(16).toUpperCase().padStart(6, '0')}] (${str.region}) ${str.text}`)
      .join('\n');
    
    await fs.writeFile(
      path.join(textDir, 'all_strings.txt'),
      readableText
    );
    
    if (verbose) {
      console.log(`    - Total: ${uniqueStrings.length} unique strings (${allStrings.length} total) in ${Object.keys(categories).length} categories`);
    }
    
    return uniqueStrings.length;
  }
  
  return 0;
}

function detectTextRegions(romData: Buffer, encoding: string): Array<{start: number, end: number, type: string}> {
  const regions = [];
  
  // Standard text regions based on encoding
  if (encoding === 'sjis' || encoding === 'custom') {
    regions.push(
      { start: 0x40000, end: 0x60000, type: 'Main Text' },
      { start: 0x60000, end: 0x80000, type: 'Menu Text' },
      { start: 0x20000, end: 0x40000, type: 'Character Names' }
    );
  } else {
    regions.push(
      { start: 0x20000, end: 0x40000, type: 'Dialogue' },
      { start: 0x40000, end: 0x50000, type: 'Menu Text' },
      { start: 0x50000, end: 0x60000, type: 'Item Names' }
    );
  }
  
  // Add regions for credits and miscellaneous text
  regions.push(
    { start: 0x80000, end: 0x90000, type: 'Credits' },
    { start: romData.length - 0x8000, end: romData.length, type: 'End Text' }
  );
  
  return regions.filter(region => region.start < romData.length && region.end <= romData.length);
}

function groupStringsByCategory(strings: any[]): Record<string, any[]> {
  const categories: Record<string, any[]> = {
    'Dialogue': [],
    'Menu': [],
    'Items': [],
    'Credits': [],
    'System': [],
    'Other': []
  };
  
  strings.forEach(str => {
    const text = str.text.toLowerCase();
    const region = str.region.toLowerCase();
    
    if (region.includes('dialogue') || text.includes('says') || text.includes(': ')) {
      categories['Dialogue'].push(str);
    } else if (region.includes('menu') || text.includes('select') || text.includes('option')) {
      categories['Menu'].push(str);
    } else if (region.includes('item') || text.includes('sword') || text.includes('potion')) {
      categories['Items'].push(str);
    } else if (region.includes('credit') || text.includes('staff') || text.includes('director')) {
      categories['Credits'].push(str);
    } else if (text.includes('load') || text.includes('save') || text.includes('error')) {
      categories['System'].push(str);
    } else {
      categories['Other'].push(str);
    }
  });
  
  // Remove empty categories
  Object.keys(categories).forEach(key => {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  });
  
  return categories;
}
