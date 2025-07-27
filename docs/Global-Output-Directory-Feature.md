# Global Default Output Directory Feature

## Overview

The Global Default Output Directory feature allows users to set a session-wide default output directory that will be used for all disassembly operations unless specifically overridden. This simplifies the workflow when working on multiple tasks that should all output to the same base directory.

## Features

- **Session Persistence**: The global output directory setting is saved between CLI sessions
- **Automatic Directory Creation**: The system will attempt to create the directory if it doesn't exist
- **Path Validation**: Ensures the specified directory is accessible before setting it
- **Interactive Integration**: The interactive CLI mode shows and uses the global default
- **Override Support**: Individual commands can still specify their own output directory to override the global setting

## Commands

### Set Global Output Directory
```bash
snes-disasm set-output-dir <directory>
```

Sets the global default output directory for the current session.

**Example:**
```bash
snes-disasm set-output-dir /home/user/snes-projects/output
```

### Show Current Global Output Directory
```bash
snes-disasm show-output-dir
```

Displays the currently set global default output directory, or indicates if none is set.

**Example Output:**
```
Current global default output directory: /home/user/snes-projects/output
```

Or if none is set:
```
No global default output directory set.
```

### Clear Global Output Directory
```bash
snes-disasm clear-output-dir
```

Removes the global default output directory setting, returning to the default behavior.

**Example Output:**
```
Global default output directory cleared.
```

## Usage Examples

### Basic Workflow

1. **Set up a global output directory for your project:**
   ```bash
   snes-disasm set-output-dir ./my-snes-project/output
   ```

2. **Run disassembly commands without specifying output directory:**
   ```bash
   snes-disasm game.smc
   # Output will go to ./my-snes-project/output/
   ```

3. **Run asset extraction:**
   ```bash
   snes-disasm --extract-assets game.smc
   # Assets will go to ./my-snes-project/output/
   ```

4. **Override for specific tasks:**
   ```bash
   snes-disasm -d ./special-output game.smc
   # This will use ./special-output instead of the global default
   ```

### Interactive Mode Integration

When using interactive mode, the global output directory is automatically integrated:

- **Disassembly workflow**: The output directory prompt will show the global default as the placeholder and default value
- **Asset extraction**: Asset output will default to `<global-dir>/assets`
- **Analysis results**: Analysis output will default to `<global-dir>/analysis`

**Example Interactive Prompt:**
```
? Output directory: › /home/user/snes-projects/output (global default)
```

## Implementation Details

### Session Management

The global output directory is stored in the session file (`~/.snes-disassembler/session.json`) under the `preferences.globalOutputDir` field:

```json
{
  "preferences": {
    "globalOutputDir": "/home/user/snes-projects/output",
    "defaultOutputDir": "./output",
    "defaultFormat": "ca65"
  }
}
```

### Priority Order

The system determines the output directory using the following priority order:

1. **Explicitly specified directory** (via `-d` or `--output-dir` flag)
2. **Global default directory** (if set via `set-output-dir`)
3. **System default directory** (`./output`)

### Error Handling

- **Invalid Directory**: If the specified directory cannot be created or accessed, an error is displayed
- **Permission Issues**: If the user lacks permissions to create/access the directory, a clear error message is shown
- **Path Resolution**: All paths are resolved to absolute paths for consistency

## Benefits

1. **Simplified Workflow**: No need to specify output directory for every command
2. **Consistency**: All outputs go to the same base location by default
3. **Flexibility**: Can still override on a per-command basis when needed
4. **Project Organization**: Helps maintain organized project structures
5. **Session Persistence**: Settings are remembered between CLI sessions

## Technical Integration

### SessionManager Updates

The `SessionManager` class has been extended with the following methods:

- `setGlobalOutputDir(outputDir: string)`: Set the global output directory
- `getGlobalOutputDir()`: Get the current global output directory
- `clearGlobalOutputDir()`: Clear the global output directory setting
- `getEffectiveOutputDir(specificDir?: string)`: Get the effective output directory to use
- `hasGlobalOutputDir()`: Check if a global output directory is set

### CLI Integration

The CLI has been updated to:

- Load session data at startup
- Use `getEffectiveOutputDir()` to determine the actual output directory to use
- Show global defaults in interactive prompts
- Provide management commands for the global output directory

This feature significantly improves the user experience by reducing repetitive directory specification while maintaining full flexibility for edge cases.
