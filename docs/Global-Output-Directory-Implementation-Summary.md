# Global Default Output Directory - Implementation Summary

## Task Completed ✅

**Step 3: Introduce Global Default Output Directory**
> Add a feature allowing users to set a global default output directory per session, simplifying output configuration for multiple tasks.

## Implementation Overview

The Global Default Output Directory feature has been successfully implemented, providing users with the ability to set a session-wide default output directory that simplifies workflow when working on multiple tasks.

## Files Modified

### 1. `src/cli/session-manager.ts`
**Changes:**
- Added `globalOutputDir?: string` to `UserPreferences` interface
- Updated default session to include `globalOutputDir: undefined`
- Added new methods:
  - `setGlobalOutputDir(outputDir: string)`: Set global output directory with validation
  - `getGlobalOutputDir()`: Get current global output directory
  - `clearGlobalOutputDir()`: Clear global output directory setting
  - `getEffectiveOutputDir(specificDir?: string)`: Get effective output directory with precedence logic
  - `hasGlobalOutputDir()`: Check if global output directory is set

### 2. `src/cli.ts`
**Changes:**
- Updated main command action to load session data and use `getEffectiveOutputDir()`
- Enhanced interactive workflows to show global defaults in prompts
- Added three new CLI commands:
  - `set-output-dir <directory>`: Set global default output directory
  - `show-output-dir`: Display current global default output directory
  - `clear-output-dir`: Clear global default output directory setting
- Updated all interactive workflows (disassembly, asset extraction, analysis) to use global defaults

## New CLI Commands

### Command Usage
```bash
# Set global output directory
snes-disasm set-output-dir <directory>

# Show current global output directory
snes-disasm show-output-dir

# Clear global output directory
snes-disasm clear-output-dir
```

### Examples
```bash
# Set up project output directory
snes-disasm set-output-dir ./my-project/output

# Check current setting
snes-disasm show-output-dir
# Output: Current global default output directory: /path/to/my-project/output

# Use in disassembly (will use global default)
snes-disasm game.smc

# Override for specific task
snes-disasm -d ./special-output game.smc

# Clear setting
snes-disasm clear-output-dir
# Output: Global default output directory cleared.
```

## Key Features Implemented

### ✅ Session Persistence
- Global output directory setting is saved in `~/.snes-disassembler/session.json`
- Settings persist between CLI sessions

### ✅ Directory Validation
- Automatic directory creation if it doesn't exist
- Path validation and error handling
- Absolute path resolution for consistency

### ✅ Priority System
1. Explicitly specified directory (via `-d`/`--output-dir`)
2. Global default directory (if set)
3. System default (`./output`)

### ✅ Interactive Mode Integration
- Shows global default in prompts with clear indication
- Asset extraction defaults to `<global>/assets`
- Analysis results default to `<global>/analysis`
- Placeholders show "(global default)" or "(using global default)"

### ✅ Override Capability
- Individual commands can still specify their own output directory
- Global setting doesn't restrict flexibility

## Technical Implementation Details

### Session Storage
```json
{
  "preferences": {
    "globalOutputDir": "/absolute/path/to/output",
    "defaultOutputDir": "./output",
    "defaultFormat": "ca65"
  }
}
```

### Method Signatures
```typescript
// SessionManager methods
setGlobalOutputDir(outputDir: string): Promise<void>
getGlobalOutputDir(): string | undefined
clearGlobalOutputDir(): Promise<void>
getEffectiveOutputDir(specificDir?: string): string
hasGlobalOutputDir(): boolean
```

## Testing

### ✅ Automated Testing
- Created `test-global-output-dir.js` script
- Tests all core functionality:
  - Setting/getting global output directory
  - Directory validation and creation
  - Effective directory resolution with different scenarios
  - Clearing functionality
  - State persistence

### ✅ Manual CLI Testing
All CLI commands tested and working:
- `set-output-dir` correctly sets and validates directories
- `show-output-dir` displays current setting or "not set" message
- `clear-output-dir` properly clears the setting
- Session persistence confirmed between command runs

### ✅ Build Verification
- TypeScript compilation successful
- No build errors or warnings
- All existing functionality preserved

## Benefits Achieved

1. **Workflow Simplification**: Users no longer need to specify output directory for each command
2. **Project Organization**: Enables consistent output organization across multiple tasks
3. **Flexibility Maintained**: Full override capability when needed
4. **User Experience**: Clear visual indicators in interactive mode
5. **Persistence**: Settings remembered between sessions

## Example Workflow

```bash
# 1. Set up project
snes-disasm set-output-dir ./zelda-analysis

# 2. Run multiple operations (all use global default)
snes-disasm --extract-assets zelda.smc     # → ./zelda-analysis/
snes-disasm --analysis zelda.smc           # → ./zelda-analysis/
snes-disasm zelda.smc                      # → ./zelda-analysis/

# 3. Override for special case
snes-disasm -d ./temp-test zelda.smc       # → ./temp-test/

# 4. Continue with global default
snes-disasm --format html zelda.smc        # → ./zelda-analysis/
```

## Documentation Created

1. **`docs/Global-Output-Directory-Feature.md`**: Comprehensive user documentation
2. **`docs/Global-Output-Directory-Implementation-Summary.md`**: Technical implementation summary
3. **`test-global-output-dir.js`**: Demonstration and testing script

## Status: ✅ COMPLETED

The Global Default Output Directory feature has been fully implemented, tested, and documented. It successfully simplifies output configuration for multiple tasks while maintaining full flexibility and backward compatibility.
