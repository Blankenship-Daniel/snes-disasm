# 🎮 SNES Disassembler Interactive CLI

The SNES Disassembler now features a beautiful interactive command-line interface powered by modern CLI libraries that makes it easy to disassemble SNES ROMs without memorizing complex command-line arguments.

## Features

✨ **Beautiful Interface**: Uses @clack/prompts for a modern, user-friendly experience  
📊 **Progress Tracking**: Real-time progress indicators with listr2  
🎨 **Colorful Output**: Syntax-highlighted output with chalk  
🔍 **Smart Validation**: Input validation with helpful error messages  
📝 **Multiple Workflows**: Specialized workflows for different tasks  

## Running Interactive Mode

### Method 1: Direct Command
```bash
npm run interactive
```

### Method 2: CLI Command
```bash
npx tsx src/cli.ts interactive
# or
npx tsx src/cli.ts i
```

### Method 3: No Arguments (Auto-Interactive)
```bash
npx tsx src/cli.ts
```

### Method 4: Interactive Flag
```bash
npx tsx src/cli.ts --interactive
```

## Available Workflows

### 1. 📊 Disassemble ROM
Convert SNES ROM files to various assembly formats:
- **CA65 Assembly** - Compatible with cc65 assembler
- **WLA-DX Assembly** - Compatible with WLA-DX assembler  
- **BASS Assembly** - Compatible with BASS assembler
- **HTML Report** - Interactive HTML documentation
- **JSON Data** - Machine-readable JSON format
- **Markdown Documentation** - Human-readable documentation

**Advanced Options:**
- Full Analysis (detect functions and data structures)
- Enhanced Disassembly (use MCP server insights)
- Bank-Aware Addressing (24-bit addressing mode)
- Function Detection (automatically detect functions)
- Generate Documentation (create comprehensive docs)
- Extract Assets (also extract graphics/audio)

### 2. 🎨 Extract Assets
Extract game assets from SNES ROMs:
- **Graphics** - Sprites, backgrounds, tiles
- **Audio** - Music and sound effects  
- **Text** - Dialogue and strings

### 3. 🎵 Decode BRR Audio
Convert BRR (Bit Rate Reduction) audio files to WAV format:
- Configurable sample rates
- Loop processing support
- Batch processing capabilities

### 4. 🔍 Advanced Analysis
Perform deep analysis of ROM structure:
- **Function Analysis** - Detect and analyze functions
- **Data Structure Analysis** - Identify data patterns
- **Cross References** - Track code relationships
- **Quality Report** - Generate code quality metrics
- **AI Pattern Recognition** - Use AI for pattern detection

## Example Interactive Session

```
┌  🎮 SNES Disassembler Interactive CLI 🎮
│
◇  What would you like to do?
│  📊 Disassemble ROM
│
◇  Enter the path to your SNES ROM file:
│  ./my-game.smc
│
◇  Select output format:
│  HTML Report
│
◇  Select advanced options (use space to select):
│  ◻ Full Analysis
│  ◼ Enhanced Disassembly  
│  ◻ Bank-Aware Addressing
│  ◼ Function Detection
│  ◼ Generate Documentation
│  ◻ Extract Assets
│
◇  Do you want to specify a custom address range?
│  No
│
◇  Output directory:
│  ./output
│
◇  ✅ ROM analysis complete!
│
├  Loading ROM file ✔
├  Analyzing ROM structure ✔  
├  Disassembling code ✔
└  Generating output files ✔

┌  Success
│  🎉 Disassembly completed successfully!
│  
│  Output format: HTML Report
│  Output directory: ./output  
│  ROM file: ./my-game.smc
└

└  All done! Check your output directory for the results.
```

## Key Benefits

1. **No Command Memorization** - Interactive prompts guide you through all options
2. **Visual Feedback** - Progress bars and spinners show real-time status
3. **Input Validation** - Prevents errors with smart validation
4. **Contextual Help** - Hints and descriptions for every option
5. **Keyboard Navigation** - Arrow keys, space to select, enter to confirm
6. **Cancellation Support** - Ctrl+C to cancel at any time
7. **Beautiful Output** - Color-coded success/error messages

## Technical Implementation

The interactive CLI is built using:

- **[@clack/prompts](https://clack.cc/)** - Modern, beautiful CLI prompts
- **[listr2](https://github.com/listr2/listr2)** - Task lists with progress tracking
- **[chalk](https://github.com/chalk/chalk)** - Terminal colors and styling
- **[commander.js](https://github.com/tj/commander.js)** - Command-line argument parsing

This provides a professional, production-ready CLI experience that rivals modern development tools.
