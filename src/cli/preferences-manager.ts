/**
 * Interactive Preferences Manager
 *
 * Provides an interactive interface for managing user preferences
 * for advanced options, ensuring a personalized experience.
 */

import { intro, outro, select, text, confirm, multiselect, isCancel, cancel, note } from '@clack/prompts';
import chalk from 'chalk';
import { sessionManager } from './session-manager';

export class PreferencesManager {

  /**
   * Run the interactive preferences configuration interface
   */
  async runPreferencesInterface(): Promise<void> {
    await sessionManager.load();

    intro(chalk.bgBlue.black(' ⚙️  User Preferences Configuration ⚙️  '));

    try {
      let shouldContinue = true;
      while (shouldContinue) {
        const action = await select({
          message: 'What would you like to configure?',
          options: [
            { value: 'view', label: '👀 View Current Preferences', hint: 'Display all current settings' },
            { value: 'basic', label: '⚡ Basic Settings', hint: 'Output format, directories, etc.' },
            { value: 'advanced', label: '🔧 Advanced Analysis Options', hint: 'Analysis, disassembly features' },
            { value: 'assets', label: '🎨 Asset Extraction', hint: 'Graphics, audio, text preferences' },
            { value: 'brr', label: '🎵 BRR Audio Settings', hint: 'Audio decoding preferences' },
            { value: 'analysis', label: '📊 Analysis Settings', hint: 'Analysis types and output' },
            { value: 'format', label: '📝 Output Format', hint: 'Comments, symbols, formatting' },
            { value: 'ui', label: '🖥️  UI/UX Settings', hint: 'Interactive mode, colors, progress' },
            { value: 'ai', label: '🤖 AI Features', hint: 'AI-powered analysis settings' },
            { value: 'import-export', label: '💾 Import/Export', hint: 'Backup and restore preferences' },
            { value: 'reset', label: '🔄 Reset to Defaults', hint: 'Clear all preferences' },
            { value: 'exit', label: '❌ Exit', hint: 'Save and exit preferences' }
          ]
        });

        if (isCancel(action) || action === 'exit') {
          shouldContinue = false;
          break;
        }

        switch (action) {
          case 'view':
            this.viewPreferences();
            break;
          case 'basic':
            await this.configureBasicSettings();
            break;
          case 'advanced':
            await this.configureAdvancedOptions();
            break;
          case 'assets':
            await this.configureAssetPreferences();
            break;
          case 'brr':
            await this.configureBRRPreferences();
            break;
          case 'analysis':
            await this.configureAnalysisPreferences();
            break;
          case 'format':
            await this.configureFormatPreferences();
            break;
          case 'ui':
            await this.configureUIPreferences();
            break;
          case 'ai':
            await this.configureAIPreferences();
            break;
          case 'import-export':
            await this.handleImportExport();
            break;
          case 'reset':
            await this.resetPreferences();
            break;
        }
      }

      outro(chalk.green('✅ Preferences saved! Your settings will be applied to future sessions.'));

    } catch (error) {
      if (isCancel(error)) {
        cancel('Preferences configuration cancelled.');
      } else {
        outro(chalk.red(`❌ Error: ${error instanceof Error ? error.message : error}`));
      }
    }
  }

  /**
   * Display current preferences
   */
  private viewPreferences(): void {
    const summary = sessionManager.getPreferencesSummary();
    note(summary, 'Current Preferences');
  }

  /**
   * Configure basic settings
   */
  private async configureBasicSettings(): Promise<void> {
    const currentPrefs = sessionManager.getPreferences();

    const defaultFormat = await select({
      message: 'Default output format:',
      options: [
        { value: 'ca65', label: 'CA65 Assembly', hint: 'Compatible with cc65 assembler' },
        { value: 'wla-dx', label: 'WLA-DX Assembly', hint: 'Compatible with WLA-DX assembler' },
        { value: 'bass', label: 'BASS Assembly', hint: 'Compatible with BASS assembler' },
        { value: 'html', label: 'HTML Report', hint: 'Interactive HTML documentation' },
        { value: 'json', label: 'JSON Data', hint: 'Machine-readable JSON format' },
        { value: 'markdown', label: 'Markdown Documentation', hint: 'Human-readable documentation' }
      ],
      initialValue: currentPrefs.defaultFormat ?? 'ca65'
    });

    if (isCancel(defaultFormat)) return;

    const defaultOutputDir = await text({
      message: 'Default output directory:',
      placeholder: './output',
      defaultValue: currentPrefs.defaultOutputDir ?? './output'
    });

    if (isCancel(defaultOutputDir)) return;

    const maxRecentFiles = await text({
      message: 'Maximum recent files to track:',
      placeholder: '10',
      defaultValue: (currentPrefs.maxRecentFiles ?? 10).toString(),
      validate: (value) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 1 || num > 50) {
          return 'Please enter a number between 1 and 50';
        }
        return undefined;
      }
    });

    if (isCancel(maxRecentFiles)) return;

    const showHelp = await confirm({
      message: 'Show contextual help by default?',
      initialValue: currentPrefs.showHelp !== false
    });

    if (isCancel(showHelp)) return;

    const confirmActions = await confirm({
      message: 'Confirm destructive actions?',
      initialValue: currentPrefs.confirmActions !== false
    });

    if (isCancel(confirmActions)) return;

    // Update preferences
    sessionManager.updatePreferences({
      defaultFormat: defaultFormat as string,
      defaultOutputDir: defaultOutputDir as string,
      maxRecentFiles: parseInt(maxRecentFiles as string),
      showHelp: showHelp as boolean,
      confirmActions: confirmActions as boolean
    });

    note('✅ Basic settings updated successfully!', 'Success');
  }

  /**
   * Configure advanced analysis options
   */
  private async configureAdvancedOptions(): Promise<void> {
    const currentOptions = sessionManager.getAdvancedOptions();

    const selectedOptions = await multiselect({
      message: 'Select advanced options to enable by default:',
      options: [
        { value: 'analysis', label: 'Full Analysis', hint: 'Detect functions and data structures' },
        { value: 'enhancedDisasm', label: 'Enhanced Disassembly', hint: 'Use MCP server insights' },
        { value: 'bankAware', label: 'Bank-Aware Addressing', hint: '24-bit addressing mode' },
        { value: 'detectFunctions', label: 'Function Detection', hint: 'Automatically detect functions' },
        { value: 'generateDocs', label: 'Generate Documentation', hint: 'Create comprehensive docs' },
        { value: 'extractAssets', label: 'Extract Assets', hint: 'Also extract graphics/audio' },
        { value: 'quality', label: 'Quality Reports', hint: 'Generate code quality metrics' }
      ],
      required: false,
      initialValues: currentOptions ? [
        ...(currentOptions.analysis ? ['analysis'] : []),
        ...(currentOptions.enhancedDisasm ? ['enhancedDisasm'] : []),
        ...(currentOptions.bankAware ? ['bankAware'] : []),
        ...(currentOptions.detectFunctions ? ['detectFunctions'] : []),
        ...(currentOptions.generateDocs ? ['generateDocs'] : []),
        ...(currentOptions.extractAssets ? ['extractAssets'] : []),
        ...(currentOptions.quality ? ['quality'] : [])
      ] : []
    });

    if (isCancel(selectedOptions)) return;

    const disableAI = await confirm({
      message: 'Disable AI features by default?',
      initialValue: currentOptions?.disableAI ?? false
    });

    if (isCancel(disableAI)) return;

    const options = selectedOptions as string[];
    await sessionManager.updateAdvancedOptions({
      analysis: options.includes('analysis'),
      enhancedDisasm: options.includes('enhancedDisasm'),
      bankAware: options.includes('bankAware'),
      detectFunctions: options.includes('detectFunctions'),
      generateDocs: options.includes('generateDocs'),
      extractAssets: options.includes('extractAssets'),
      quality: options.includes('quality'),
      disableAI: disableAI as boolean
    });

    note('✅ Advanced options updated successfully!', 'Success');
  }

  /**
   * Configure asset extraction preferences
   */
  private async configureAssetPreferences(): Promise<void> {
    const currentPrefs = sessionManager.getAssetPreferences();

    const defaultAssetTypes = await multiselect({
      message: 'Default asset types to extract:',
      options: [
        { value: 'graphics', label: '🎨 Graphics', hint: 'Sprites, backgrounds, tiles' },
        { value: 'audio', label: '🎵 Audio', hint: 'Music and sound effects' },
        { value: 'text', label: '📝 Text', hint: 'Dialogue and strings' }
      ],
      required: false,
      initialValues: currentPrefs?.defaultAssetTypes ?? []
    });

    if (isCancel(defaultAssetTypes)) return;

    const defaultAssetFormats = await multiselect({
      message: 'Default graphics formats to extract:',
      options: [
        { value: '2bpp', label: '2BPP', hint: '2 bits per pixel' },
        { value: '4bpp', label: '4BPP', hint: '4 bits per pixel (most common)' },
        { value: '8bpp', label: '8BPP', hint: '8 bits per pixel' }
      ],
      required: false,
      initialValues: currentPrefs?.defaultAssetFormats ?? ['4bpp']
    });

    if (isCancel(defaultAssetFormats)) return;

    const defaultAssetOutputDir = await text({
      message: 'Default asset output directory:',
      placeholder: './assets',
      defaultValue: currentPrefs?.defaultAssetOutputDir ?? './assets'
    });

    if (isCancel(defaultAssetOutputDir)) return;

    await sessionManager.updateAssetPreferences({
      defaultAssetTypes: defaultAssetTypes as string[],
      defaultAssetFormats: defaultAssetFormats as string[],
      defaultAssetOutputDir: defaultAssetOutputDir as string
    });

    note('✅ Asset preferences updated successfully!', 'Success');
  }

  /**
   * Configure BRR audio preferences
   */
  private async configureBRRPreferences(): Promise<void> {
    const currentPrefs = sessionManager.getBRRPreferences();

    const defaultSampleRate = await text({
      message: 'Default sample rate for BRR decoding (Hz):',
      placeholder: '32000',
      defaultValue: (currentPrefs?.defaultSampleRate ?? 32000).toString(),
      validate: (value) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 1000 || num > 96000) {
          return 'Please enter a sample rate between 1000 and 96000 Hz';
        }
        return undefined;
      }
    });

    if (isCancel(defaultSampleRate)) return;

    const enableLooping = await confirm({
      message: 'Enable BRR loop processing by default?',
      initialValue: currentPrefs?.enableLooping !== false
    });

    if (isCancel(enableLooping)) return;

    const maxSamples = await text({
      message: 'Maximum samples to decode:',
      placeholder: '1000000',
      defaultValue: (currentPrefs?.maxSamples ?? 1000000).toString(),
      validate: (value) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 1000) {
          return 'Please enter a number of at least 1000 samples';
        }
        return undefined;
      }
    });

    if (isCancel(maxSamples)) return;

    const defaultOutputFormat = await select({
      message: 'Default output format for BRR decoding:',
      options: [
        { value: 'wav', label: 'WAV', hint: 'Standard WAV format' },
        { value: 'flac', label: 'FLAC', hint: 'Lossless compression' }
      ],
      initialValue: currentPrefs?.defaultOutputFormat ?? 'wav'
    });

    if (isCancel(defaultOutputFormat)) return;

    await sessionManager.updateBRRPreferences({
      defaultSampleRate: parseInt(defaultSampleRate as string),
      enableLooping: enableLooping as boolean,
      maxSamples: parseInt(maxSamples as string),
      defaultOutputFormat: defaultOutputFormat as string
    });

    note('✅ BRR preferences updated successfully!', 'Success');
  }

  /**
   * Configure analysis preferences
   */
  private async configureAnalysisPreferences(): Promise<void> {
    const currentPrefs = sessionManager.getAnalysisPreferences();

    const defaultAnalysisTypes = await multiselect({
      message: 'Default analysis types to run:',
      options: [
        { value: 'functions', label: '📊 Function Analysis', hint: 'Detect and analyze functions' },
        { value: 'data-structures', label: '📋 Data Structure Analysis', hint: 'Identify data patterns' },
        { value: 'cross-references', label: '🔗 Cross References', hint: 'Track code relationships' },
        { value: 'quality-report', label: '📈 Quality Report', hint: 'Generate code quality metrics' },
        { value: 'ai-patterns', label: '🤖 AI Pattern Recognition', hint: 'Use AI for pattern detection' }
      ],
      required: false,
      initialValues: currentPrefs?.defaultAnalysisTypes ?? []
    });

    if (isCancel(defaultAnalysisTypes)) return;

    const defaultAnalysisOutputDir = await text({
      message: 'Default analysis output directory:',
      placeholder: './analysis',
      defaultValue: currentPrefs?.defaultAnalysisOutputDir ?? './analysis'
    });

    if (isCancel(defaultAnalysisOutputDir)) return;

    const generateHtmlReports = await confirm({
      message: 'Generate HTML reports by default?',
      initialValue: currentPrefs?.generateHtmlReports !== false
    });

    if (isCancel(generateHtmlReports)) return;

    const includeQualityMetrics = await confirm({
      message: 'Include quality metrics in analysis?',
      initialValue: currentPrefs?.includeQualityMetrics !== false
    });

    if (isCancel(includeQualityMetrics)) return;

    await sessionManager.updateAnalysisPreferences({
      defaultAnalysisTypes: defaultAnalysisTypes as string[],
      defaultAnalysisOutputDir: defaultAnalysisOutputDir as string,
      generateHtmlReports: generateHtmlReports as boolean,
      includeQualityMetrics: includeQualityMetrics as boolean
    });

    note('✅ Analysis preferences updated successfully!', 'Success');
  }

  /**
   * Configure output format preferences
   */
  private async configureFormatPreferences(): Promise<void> {
    const currentPrefs = sessionManager.getFormatPreferences();

    const formatOptions = await multiselect({
      message: 'Default output format options:',
      options: [
        { value: 'includeComments', label: 'Include Comments', hint: 'Add explanatory comments' },
        { value: 'prettyPrint', label: 'Pretty Print', hint: 'Format output for readability' },
        { value: 'generateSymbols', label: 'Generate Symbols', hint: 'Create symbol files' },
        { value: 'useCustomLabels', label: 'Use Custom Labels', hint: 'Apply custom label files' }
      ],
      required: false,
      initialValues: [
        ...(currentPrefs?.includeComments !== false ? ['includeComments'] : []),
        ...(currentPrefs?.prettyPrint !== false ? ['prettyPrint'] : []),
        ...(currentPrefs?.generateSymbols !== false ? ['generateSymbols'] : []),
        ...(currentPrefs?.useCustomLabels !== false ? ['useCustomLabels'] : [])
      ]
    });

    if (isCancel(formatOptions)) return;

    const options = formatOptions as string[];
    await sessionManager.updateFormatPreferences({
      includeComments: options.includes('includeComments'),
      prettyPrint: options.includes('prettyPrint'),
      generateSymbols: options.includes('generateSymbols'),
      useCustomLabels: options.includes('useCustomLabels')
    });

    note('✅ Format preferences updated successfully!', 'Success');
  }

  /**
   * Configure UI preferences
   */
  private async configureUIPreferences(): Promise<void> {
    const currentPrefs = sessionManager.getUIPreferences();

    const uiOptions = await multiselect({
      message: 'UI/UX preferences:',
      options: [
        { value: 'preferInteractiveMode', label: 'Prefer Interactive Mode', hint: 'Launch interactive mode by default' },
        { value: 'showProgressBars', label: 'Show Progress Bars', hint: 'Display operation progress' },
        { value: 'colorOutput', label: 'Colored Output', hint: 'Use colors in terminal output' },
        { value: 'compactOutput', label: 'Compact Output', hint: 'Use condensed output format' },
        { value: 'autoSaveResults', label: 'Auto-save Results', hint: 'Automatically save analysis results' }
      ],
      required: false,
      initialValues: [
        ...(currentPrefs?.preferInteractiveMode ? ['preferInteractiveMode'] : []),
        ...(currentPrefs?.showProgressBars !== false ? ['showProgressBars'] : []),
        ...(currentPrefs?.colorOutput !== false ? ['colorOutput'] : []),
        ...(currentPrefs?.compactOutput ? ['compactOutput'] : []),
        ...(currentPrefs?.autoSaveResults ? ['autoSaveResults'] : [])
      ]
    });

    if (isCancel(uiOptions)) return;

    const options = uiOptions as string[];
    await sessionManager.updateUIPreferences({
      preferInteractiveMode: options.includes('preferInteractiveMode'),
      showProgressBars: options.includes('showProgressBars'),
      colorOutput: options.includes('colorOutput'),
      compactOutput: options.includes('compactOutput'),
      autoSaveResults: options.includes('autoSaveResults')
    });

    note('✅ UI preferences updated successfully!', 'Success');
  }

  /**
   * Configure AI preferences
   */
  private async configureAIPreferences(): Promise<void> {
    const currentPrefs = sessionManager.getAIPreferences();

    const enableAIFeatures = await confirm({
      message: 'Enable AI features globally?',
      initialValue: currentPrefs?.enableAIFeatures !== false
    });

    if (isCancel(enableAIFeatures)) return;

    if (!enableAIFeatures) {
      await sessionManager.updateAIPreferences({
        enableAIFeatures: false
      });
      note('✅ AI features disabled globally.', 'Success');
      return;
    }

    const aiConfidenceThreshold = await text({
      message: 'AI confidence threshold (0.0-1.0):',
      placeholder: '0.7',
      defaultValue: (currentPrefs?.aiConfidenceThreshold ?? 0.7).toString(),
      validate: (value) => {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0 || num > 1) {
          return 'Please enter a number between 0.0 and 1.0';
        }
        return undefined;
      }
    });

    if (isCancel(aiConfidenceThreshold)) return;

    const aiOptions = await multiselect({
      message: 'AI feature options:',
      options: [
        { value: 'useContextualNaming', label: 'Contextual Naming', hint: 'Use AI for smart naming' },
        { value: 'generateAIDocumentation', label: 'AI Documentation', hint: 'Generate AI-powered docs' }
      ],
      required: false,
      initialValues: [
        ...(currentPrefs?.useContextualNaming !== false ? ['useContextualNaming'] : []),
        ...(currentPrefs?.generateAIDocumentation !== false ? ['generateAIDocumentation'] : [])
      ]
    });

    if (isCancel(aiOptions)) return;

    const options = aiOptions as string[];
    await sessionManager.updateAIPreferences({
      enableAIFeatures: true,
      aiConfidenceThreshold: parseFloat(aiConfidenceThreshold as string),
      useContextualNaming: options.includes('useContextualNaming'),
      generateAIDocumentation: options.includes('generateAIDocumentation')
    });

    note('✅ AI preferences updated successfully!', 'Success');
  }

  /**
   * Handle import/export operations
   */
  private async handleImportExport(): Promise<void> {
    const action = await select({
      message: 'Import/Export preferences:',
      options: [
        { value: 'export', label: '📤 Export Preferences', hint: 'Save preferences to file' },
        { value: 'import', label: '📥 Import Preferences', hint: 'Load preferences from file' }
      ]
    });

    if (isCancel(action)) return;

    if (action === 'export') {
      const exportPath = await text({
        message: 'Export file path:',
        placeholder: './snes-disasm-preferences.json',
        defaultValue: './snes-disasm-preferences.json'
      });

      if (isCancel(exportPath)) return;

      try {
        await sessionManager.exportPreferences(exportPath as string);
        note(`✅ Preferences exported to: ${exportPath}`, 'Success');
      } catch (error) {
        note(`❌ Export failed: ${error instanceof Error ? error.message : error}`, 'Error');
      }
    } else {
      const importPath = await text({
        message: 'Import file path:',
        placeholder: './snes-disasm-preferences.json',
        validate: (value) => {
          if (!value) return 'File path is required';
          // Basic validation - could be enhanced with file existence check
          return undefined;
        }
      });

      if (isCancel(importPath)) return;

      const confirmImport = await confirm({
        message: 'This will overwrite your current preferences. Continue?'
      });

      if (isCancel(confirmImport) || !confirmImport) return;

      try {
        await sessionManager.importPreferences(importPath as string);
        note(`✅ Preferences imported from: ${importPath}`, 'Success');
      } catch (error) {
        note(`❌ Import failed: ${error instanceof Error ? error.message : error}`, 'Error');
      }
    }
  }

  /**
   * Reset preferences to defaults
   */
  private async resetPreferences(): Promise<void> {
    const confirmReset = await confirm({
      message: 'Are you sure you want to reset all preferences to defaults? This cannot be undone.'
    });

    if (isCancel(confirmReset) || !confirmReset) return;

    await sessionManager.resetPreferences();
    note('✅ All preferences have been reset to defaults.', 'Success');
  }
}

// Export singleton instance
export const preferencesManager = new PreferencesManager();
