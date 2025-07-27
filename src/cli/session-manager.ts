/**
 * CLI Session Manager
 * 
 * Handles session state persistence, recent files, and user preferences
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { CLIOptions } from '../disassembly-handler';

export interface RecentFile {
  path: string;
  name: string;
  size: string;
  lastUsed: string;
  romInfo?: {
    title?: string;
    type?: string;
    size?: number;
  };
}

export interface UserPreferences {
  // Basic preferences
  defaultOutputDir?: string;
  globalOutputDir?: string;  // New: Global default output directory per session
  defaultFormat?: string;
  showHelp?: boolean;
  confirmActions?: boolean;
  maxRecentFiles?: number;
  
  // Advanced Analysis Options
  advancedOptions?: {
    analysis?: boolean;           // Enable full analysis by default
    enhancedDisasm?: boolean;     // Use enhanced disassembly algorithms
    bankAware?: boolean;          // Enable bank-aware disassembly
    detectFunctions?: boolean;    // Enable automatic function detection
    generateDocs?: boolean;       // Generate documentation by default
    extractAssets?: boolean;      // Extract assets by default
    quality?: boolean;            // Generate quality reports
    disableAI?: boolean;          // Disable AI features
  };
  
  // Asset Extraction Preferences
  assetPreferences?: {
    defaultAssetTypes?: string[];     // Default asset types to extract
    defaultAssetFormats?: string[];   // Default graphics formats
    defaultAssetOutputDir?: string;   // Default output directory for assets
  };
  
  // BRR Audio Preferences
  brrPreferences?: {
    defaultSampleRate?: number;    // Default sample rate for BRR decoding
    enableLooping?: boolean;       // Enable BRR loop processing by default
    maxSamples?: number;          // Default max samples to decode
    defaultOutputFormat?: string; // Default output format (wav, flac)
  };
  
  // Analysis Preferences
  analysisPreferences?: {
    defaultAnalysisTypes?: string[];    // Default analysis types to run
    defaultAnalysisOutputDir?: string;  // Default output directory for analysis
    generateHtmlReports?: boolean;      // Generate HTML reports by default
    includeQualityMetrics?: boolean;    // Include quality metrics in analysis
  };
  
  // Output Format Preferences
  formatPreferences?: {
    includeComments?: boolean;     // Include comments in output by default
    prettyPrint?: boolean;         // Pretty print output by default
    generateSymbols?: boolean;     // Generate symbol files by default
    useCustomLabels?: boolean;     // Use custom labels if available
  };
  
  // UI/UX Preferences
  uiPreferences?: {
    preferInteractiveMode?: boolean;  // Prefer interactive mode
    showProgressBars?: boolean;       // Show progress bars
    colorOutput?: boolean;            // Use colored output
    compactOutput?: boolean;          // Use compact output format
    autoSaveResults?: boolean;        // Auto-save analysis results
  };
  
  // AI Feature Preferences
  aiPreferences?: {
    enableAIFeatures?: boolean;           // Enable AI features globally
    preferredAIModels?: Record<string, string>; // Preferred AI models by type
    aiConfidenceThreshold?: number;       // Minimum confidence for AI suggestions
    useContextualNaming?: boolean;        // Use AI for contextual naming
    generateAIDocumentation?: boolean;    // Generate AI-powered documentation
  };
}

export interface ProjectConfig {
  name: string;
  romFile: string;
  operations: string[];
  settings: CLIOptions;
  createdAt: string;
  lastModified: string;
}

export interface CLISession {
  currentROM?: string;
  recentFiles: RecentFile[];
  preferences: UserPreferences;
  projects: ProjectConfig[];
}

export class SessionManager {
  private sessionFile: string;
  private session: CLISession;

  constructor() {
    const configDir = path.join(os.homedir(), '.snes-disassembler');
    this.sessionFile = path.join(configDir, 'session.json');
    this.session = this.getDefaultSession();
  }

  private getDefaultSession(): CLISession {
    return {
      recentFiles: [],
      preferences: {
        defaultOutputDir: './output',
        globalOutputDir: undefined,  // No global output directory set by default
        defaultFormat: 'ca65',
        showHelp: true,
        confirmActions: true,
        maxRecentFiles: 10
      },
      projects: []
    };
  }

  async load(): Promise<CLISession> {
    try {
      // Ensure config directory exists
      await fs.mkdir(path.dirname(this.sessionFile), { recursive: true });
      
      // Try to load existing session
      const data = await fs.readFile(this.sessionFile, 'utf-8');
      this.session = { ...this.getDefaultSession(), ...JSON.parse(data) };
    } catch (error) {
      // File doesn't exist or is corrupted, use defaults
      this.session = this.getDefaultSession();
    }
    
    return this.session;
  }

  async save(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.sessionFile), { recursive: true });
      await fs.writeFile(this.sessionFile, JSON.stringify(this.session, null, 2));
    } catch (error) {
      console.warn('Failed to save session:', error);
    }
  }

  async addRecentFile(filePath: string, romInfo?: any): Promise<void> {
    const stats = await fs.stat(filePath);
    const recentFile: RecentFile = {
      path: filePath,
      name: path.basename(filePath),
      size: this.formatFileSize(stats.size),
      lastUsed: new Date().toISOString(),
      romInfo
    };

    // Remove existing entry if present
    this.session.recentFiles = this.session.recentFiles.filter(f => f.path !== filePath);
    
    // Add to beginning
    this.session.recentFiles.unshift(recentFile);
    
    // Limit to max recent files
    const maxFiles = this.session.preferences.maxRecentFiles || 10;
    this.session.recentFiles = this.session.recentFiles.slice(0, maxFiles);
    
    await this.save();
  }

  getRecentFiles(): RecentFile[] {
    return this.session.recentFiles;
  }

  async addProject(project: ProjectConfig): Promise<void> {
    // Remove existing project with same name
    this.session.projects = this.session.projects.filter(p => p.name !== project.name);
    
    // Add new project
    this.session.projects.unshift(project);
    
    // Limit to reasonable number of projects
    this.session.projects = this.session.projects.slice(0, 20);
    
    await this.save();
  }

  getProjects(): ProjectConfig[] {
    return this.session.projects;
  }

  updatePreferences(preferences: Partial<UserPreferences>): void {
    this.session.preferences = { ...this.session.preferences, ...preferences };
  }

  getPreferences(): UserPreferences {
    return this.session.preferences;
  }

  setCurrentROM(romFile: string): void {
    this.session.currentROM = romFile;
  }

  getCurrentROM(): string | undefined {
    return this.session.currentROM;
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  async clearRecentFiles(): Promise<void> {
    this.session.recentFiles = [];
    await this.save();
  }

  async removeRecentFile(filePath: string): Promise<void> {
    this.session.recentFiles = this.session.recentFiles.filter(f => f.path !== filePath);
    await this.save();
  }

  // Clean up recent files that no longer exist
  async cleanupRecentFiles(): Promise<void> {
    const validFiles: RecentFile[] = [];
    
    for (const file of this.session.recentFiles) {
      try {
        await fs.access(file.path);
        validFiles.push(file);
      } catch {
        // File no longer exists, skip it
      }
    }
    
    if (validFiles.length !== this.session.recentFiles.length) {
      this.session.recentFiles = validFiles;
      await this.save();
    }
  }

  // Global output directory management
  
  /**
   * Set the global default output directory for the current session
   * @param outputDir - The directory path to set as global default
   */
  async setGlobalOutputDir(outputDir: string): Promise<void> {
    // Validate the directory path
    try {
      // Try to create the directory if it doesn't exist
      await fs.mkdir(outputDir, { recursive: true });
      // Verify we can access it
      await fs.access(outputDir);
    } catch (error) {
      throw new Error(`Cannot access or create output directory: ${outputDir}`);
    }

    this.session.preferences.globalOutputDir = path.resolve(outputDir);
    await this.save();
  }

  /**
   * Get the global default output directory for the current session
   * @returns The global output directory path, or undefined if not set
   */
  getGlobalOutputDir(): string | undefined {
    return this.session.preferences.globalOutputDir;
  }

  /**
   * Clear the global default output directory setting
   */
  async clearGlobalOutputDir(): Promise<void> {
    this.session.preferences.globalOutputDir = undefined;
    await this.save();
  }

  /**
   * Get the effective output directory - global if set, otherwise default
   * @param specificDir - Optional specific directory that takes precedence
   * @returns The output directory to use
   */
  getEffectiveOutputDir(specificDir?: string): string {
    if (specificDir) {
      return specificDir;
    }
    
    return this.session.preferences.globalOutputDir || 
           this.session.preferences.defaultOutputDir || 
           './output';
  }

  /**
   * Check if a global output directory is currently set
   * @returns True if global output directory is set, false otherwise
   */
  hasGlobalOutputDir(): boolean {
    return !!this.session.preferences.globalOutputDir;
  }

  // Advanced Preferences Management
  
  /**
   * Update advanced analysis options preferences
   * @param options - Advanced options to update
   */
  async updateAdvancedOptions(options: Partial<UserPreferences['advancedOptions']>): Promise<void> {
    if (!this.session.preferences.advancedOptions) {
      this.session.preferences.advancedOptions = {};
    }
    this.session.preferences.advancedOptions = {
      ...this.session.preferences.advancedOptions,
      ...options
    };
    await this.save();
  }

  /**
   * Get advanced analysis options preferences
   * @returns Current advanced options preferences
   */
  getAdvancedOptions(): UserPreferences['advancedOptions'] {
    return this.session.preferences.advancedOptions || {};
  }

  /**
   * Update asset extraction preferences
   * @param preferences - Asset preferences to update
   */
  async updateAssetPreferences(preferences: Partial<UserPreferences['assetPreferences']>): Promise<void> {
    if (!this.session.preferences.assetPreferences) {
      this.session.preferences.assetPreferences = {};
    }
    this.session.preferences.assetPreferences = {
      ...this.session.preferences.assetPreferences,
      ...preferences
    };
    await this.save();
  }

  /**
   * Get asset extraction preferences
   * @returns Current asset preferences
   */
  getAssetPreferences(): UserPreferences['assetPreferences'] {
    return this.session.preferences.assetPreferences || {};
  }

  /**
   * Update BRR audio preferences
   * @param preferences - BRR preferences to update
   */
  async updateBRRPreferences(preferences: Partial<UserPreferences['brrPreferences']>): Promise<void> {
    if (!this.session.preferences.brrPreferences) {
      this.session.preferences.brrPreferences = {};
    }
    this.session.preferences.brrPreferences = {
      ...this.session.preferences.brrPreferences,
      ...preferences
    };
    await this.save();
  }

  /**
   * Get BRR audio preferences
   * @returns Current BRR preferences
   */
  getBRRPreferences(): UserPreferences['brrPreferences'] {
    return this.session.preferences.brrPreferences || {};
  }

  /**
   * Update analysis preferences
   * @param preferences - Analysis preferences to update
   */
  async updateAnalysisPreferences(preferences: Partial<UserPreferences['analysisPreferences']>): Promise<void> {
    if (!this.session.preferences.analysisPreferences) {
      this.session.preferences.analysisPreferences = {};
    }
    this.session.preferences.analysisPreferences = {
      ...this.session.preferences.analysisPreferences,
      ...preferences
    };
    await this.save();
  }

  /**
   * Get analysis preferences
   * @returns Current analysis preferences
   */
  getAnalysisPreferences(): UserPreferences['analysisPreferences'] {
    return this.session.preferences.analysisPreferences || {};
  }

  /**
   * Update output format preferences
   * @param preferences - Format preferences to update
   */
  async updateFormatPreferences(preferences: Partial<UserPreferences['formatPreferences']>): Promise<void> {
    if (!this.session.preferences.formatPreferences) {
      this.session.preferences.formatPreferences = {};
    }
    this.session.preferences.formatPreferences = {
      ...this.session.preferences.formatPreferences,
      ...preferences
    };
    await this.save();
  }

  /**
   * Get output format preferences
   * @returns Current format preferences
   */
  getFormatPreferences(): UserPreferences['formatPreferences'] {
    return this.session.preferences.formatPreferences || {};
  }

  /**
   * Update UI/UX preferences
   * @param preferences - UI preferences to update
   */
  async updateUIPreferences(preferences: Partial<UserPreferences['uiPreferences']>): Promise<void> {
    if (!this.session.preferences.uiPreferences) {
      this.session.preferences.uiPreferences = {};
    }
    this.session.preferences.uiPreferences = {
      ...this.session.preferences.uiPreferences,
      ...preferences
    };
    await this.save();
  }

  /**
   * Get UI/UX preferences
   * @returns Current UI preferences
   */
  getUIPreferences(): UserPreferences['uiPreferences'] {
    return this.session.preferences.uiPreferences || {};
  }

  /**
   * Update AI feature preferences
   * @param preferences - AI preferences to update
   */
  async updateAIPreferences(preferences: Partial<UserPreferences['aiPreferences']>): Promise<void> {
    if (!this.session.preferences.aiPreferences) {
      this.session.preferences.aiPreferences = {};
    }
    this.session.preferences.aiPreferences = {
      ...this.session.preferences.aiPreferences,
      ...preferences
    };
    await this.save();
  }

  /**
   * Get AI feature preferences
   * @returns Current AI preferences
   */
  getAIPreferences(): UserPreferences['aiPreferences'] {
    return this.session.preferences.aiPreferences || {};
  }

  /**
   * Apply saved preferences to CLI options
   * @param baseOptions - Base CLI options to extend
   * @returns CLI options with preferences applied
   */
  applyPreferencesToOptions(baseOptions: CLIOptions = {}): CLIOptions {
    const prefs = this.session.preferences;
    const advanced = prefs.advancedOptions || {};
    const asset = prefs.assetPreferences || {};
    const brr = prefs.brrPreferences || {};
    const analysis = prefs.analysisPreferences || {};
    const format = prefs.formatPreferences || {};
    const ui = prefs.uiPreferences || {};
    const ai = prefs.aiPreferences || {};

    return {
      ...baseOptions,
      
      // Apply basic preferences
      format: baseOptions.format || prefs.defaultFormat || 'ca65',
      outputDir: baseOptions.outputDir || this.getEffectiveOutputDir(),
      verbose: baseOptions.verbose !== undefined ? baseOptions.verbose : ui.showProgressBars !== false,
      
      // Apply advanced analysis options
      analysis: baseOptions.analysis !== undefined ? baseOptions.analysis : advanced.analysis,
      enhancedDisasm: baseOptions.enhancedDisasm !== undefined ? baseOptions.enhancedDisasm : advanced.enhancedDisasm,
      bankAware: baseOptions.bankAware !== undefined ? baseOptions.bankAware : advanced.bankAware,
      detectFunctions: baseOptions.detectFunctions !== undefined ? baseOptions.detectFunctions : advanced.detectFunctions,
      generateDocs: baseOptions.generateDocs !== undefined ? baseOptions.generateDocs : advanced.generateDocs,
      extractAssets: baseOptions.extractAssets !== undefined ? baseOptions.extractAssets : advanced.extractAssets,
      quality: baseOptions.quality !== undefined ? baseOptions.quality : advanced.quality,
      disableAI: baseOptions.disableAI !== undefined ? baseOptions.disableAI : advanced.disableAI,
      
      // Apply asset extraction preferences
      assetTypes: baseOptions.assetTypes || asset.defaultAssetTypes?.join(','),
      assetFormats: baseOptions.assetFormats || asset.defaultAssetFormats?.join(','),
      
      // Apply BRR audio preferences
      brrSampleRate: baseOptions.brrSampleRate || brr.defaultSampleRate?.toString(),
      brrEnableLooping: baseOptions.brrEnableLooping !== undefined ? baseOptions.brrEnableLooping : brr.enableLooping,
      brrMaxSamples: baseOptions.brrMaxSamples || brr.maxSamples?.toString(),
    };
  }

  /**
   * Get preferences summary for display
   * @returns Human-readable summary of current preferences
   */
  getPreferencesSummary(): string {
    const prefs = this.session.preferences;
    const lines: string[] = [];
    
    lines.push('Current User Preferences:');
    lines.push('=' + '='.repeat(50));
    
    // Basic preferences
    lines.push('');
    lines.push('Basic Settings:');
    lines.push(`  Default Format: ${prefs.defaultFormat || 'ca65'}`);
    lines.push(`  Default Output Dir: ${prefs.defaultOutputDir || './output'}`);
    lines.push(`  Global Output Dir: ${prefs.globalOutputDir || 'Not set'}`);
    lines.push(`  Max Recent Files: ${prefs.maxRecentFiles || 10}`);
    lines.push(`  Show Help: ${prefs.showHelp !== false ? 'Yes' : 'No'}`);
    lines.push(`  Confirm Actions: ${prefs.confirmActions !== false ? 'Yes' : 'No'}`);
    
    // Advanced options
    if (prefs.advancedOptions) {
      lines.push('');
      lines.push('Advanced Analysis Options:');
      const advanced = prefs.advancedOptions;
      Object.entries(advanced).forEach(([key, value]) => {
        if (value !== undefined) {
          lines.push(`  ${key}: ${value ? 'Enabled' : 'Disabled'}`);
        }
      });
    }
    
    // Asset preferences
    if (prefs.assetPreferences) {
      lines.push('');
      lines.push('Asset Extraction Preferences:');
      const asset = prefs.assetPreferences;
      if (asset.defaultAssetTypes) {
        lines.push(`  Default Asset Types: ${asset.defaultAssetTypes.join(', ')}`);
      }
      if (asset.defaultAssetFormats) {
        lines.push(`  Default Asset Formats: ${asset.defaultAssetFormats.join(', ')}`);
      }
      if (asset.defaultAssetOutputDir) {
        lines.push(`  Default Asset Output Dir: ${asset.defaultAssetOutputDir}`);
      }
    }
    
    // BRR preferences
    if (prefs.brrPreferences) {
      lines.push('');
      lines.push('BRR Audio Preferences:');
      const brr = prefs.brrPreferences;
      if (brr.defaultSampleRate) {
        lines.push(`  Default Sample Rate: ${brr.defaultSampleRate} Hz`);
      }
      if (brr.enableLooping !== undefined) {
        lines.push(`  Enable Looping: ${brr.enableLooping ? 'Yes' : 'No'}`);
      }
      if (brr.maxSamples) {
        lines.push(`  Max Samples: ${brr.maxSamples}`);
      }
      if (brr.defaultOutputFormat) {
        lines.push(`  Default Output Format: ${brr.defaultOutputFormat}`);
      }
    }
    
    // Analysis preferences
    if (prefs.analysisPreferences) {
      lines.push('');
      lines.push('Analysis Preferences:');
      const analysis = prefs.analysisPreferences;
      if (analysis.defaultAnalysisTypes) {
        lines.push(`  Default Analysis Types: ${analysis.defaultAnalysisTypes.join(', ')}`);
      }
      if (analysis.defaultAnalysisOutputDir) {
        lines.push(`  Default Analysis Output Dir: ${analysis.defaultAnalysisOutputDir}`);
      }
      if (analysis.generateHtmlReports !== undefined) {
        lines.push(`  Generate HTML Reports: ${analysis.generateHtmlReports ? 'Yes' : 'No'}`);
      }
      if (analysis.includeQualityMetrics !== undefined) {
        lines.push(`  Include Quality Metrics: ${analysis.includeQualityMetrics ? 'Yes' : 'No'}`);
      }
    }
    
    // AI preferences
    if (prefs.aiPreferences) {
      lines.push('');
      lines.push('AI Feature Preferences:');
      const ai = prefs.aiPreferences;
      if (ai.enableAIFeatures !== undefined) {
        lines.push(`  Enable AI Features: ${ai.enableAIFeatures ? 'Yes' : 'No'}`);
      }
      if (ai.aiConfidenceThreshold) {
        lines.push(`  AI Confidence Threshold: ${ai.aiConfidenceThreshold}`);
      }
      if (ai.useContextualNaming !== undefined) {
        lines.push(`  Use Contextual Naming: ${ai.useContextualNaming ? 'Yes' : 'No'}`);
      }
      if (ai.generateAIDocumentation !== undefined) {
        lines.push(`  Generate AI Documentation: ${ai.generateAIDocumentation ? 'Yes' : 'No'}`);
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Reset all preferences to defaults
   */
  async resetPreferences(): Promise<void> {
    this.session.preferences = this.getDefaultSession().preferences;
    await this.save();
  }

  /**
   * Export preferences to a JSON file
   * @param filePath - Path to export preferences to
   */
  async exportPreferences(filePath: string): Promise<void> {
    const prefsData = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      preferences: this.session.preferences
    };
    
    await fs.writeFile(filePath, JSON.stringify(prefsData, null, 2));
  }

  /**
   * Import preferences from a JSON file
   * @param filePath - Path to import preferences from
   */
  async importPreferences(filePath: string): Promise<void> {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const prefsData = JSON.parse(data);
      
      if (prefsData.preferences) {
        // Merge with current preferences, preserving structure
        this.session.preferences = {
          ...this.session.preferences,
          ...prefsData.preferences
        };
        await this.save();
      } else {
        throw new Error('Invalid preferences file format');
      }
    } catch (error) {
      throw new Error(`Failed to import preferences: ${error instanceof Error ? error.message : error}`);
    }
  }
}

// Singleton instance
export const sessionManager = new SessionManager();
