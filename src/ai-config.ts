/**
 * AI Configuration Management
 * 
 * Centralized configuration for all GenAI features in the SNES disassembler.
 * All AI features are optional and can be disabled for users who prefer
 * traditional analysis methods.
 */

export interface AIModelConfig {
  /** HuggingFace model identifier or local path */
  modelPath: string;
  /** Enable/disable this specific model */
  enabled: boolean;
  /** Model revision/version to use */
  revision?: string;
  /** Custom model parameters */
  parameters?: Record<string, any>;
}

export interface AIFeatureConfig {
  /** Enable/disable all AI features globally */
  enabled: boolean;
  
  /** Graphics classification using Vision Transformers */
  graphicsClassification: AIModelConfig;
  
  /** Text/sequence classification using language models */
  textClassification: AIModelConfig;
  
  /** Audio pattern recognition */
  audioClassification: AIModelConfig;
  
  /** Intelligent naming suggestions */
  namingSuggestions: {
    enabled: boolean;
    /** Use AI-generated context-aware names */
    useContextualNames: boolean;
    /** Include SNES-specific naming conventions */
    useSNESConventions: boolean;
    /** Custom naming patterns */
    customPatterns?: string[];
  };
  
  /** Automated documentation generation */
  documentationGeneration: {
    enabled: boolean;
    /** Generate comments for assembly code */
    generateComments: boolean;
    /** Generate high-level documentation */
    generateDocs: boolean;
    /** Documentation language/style */
    style: 'technical' | 'beginner' | 'detailed';
    /** Include AI confidence scores in docs */
    includeConfidence: boolean;
  };
  
  /** Performance and resource settings */
  performance: {
    /** Maximum memory usage for AI models (MB) */
    maxMemoryMB: number;
    /** Enable model caching */
    enableCaching: boolean;
    /** Parallel processing limit */
    maxConcurrentJobs: number;
    /** Timeout for AI operations (seconds) */
    timeoutSeconds: number;
  };
  
  /** Fallback behavior when AI is unavailable */
  fallback: {
    /** Use heuristic analysis when AI fails */
    useHeuristics: boolean;
    /** Show warnings when falling back */
    showWarnings: boolean;
    /** Cache heuristic results */
    cacheResults: boolean;
  };
}

/**
 * Default AI configuration - all features disabled by default
 * Users must explicitly enable AI features they want to use
 */
export const DEFAULT_AI_CONFIG: AIFeatureConfig = {
  enabled: false, // AI features are opt-in
  
  graphicsClassification: {
    modelPath: 'Xenova/vit-base-patch16-224',
    enabled: false,
    revision: 'main',
    parameters: {
      task: 'image-classification',
      quantized: true // Use smaller quantized models by default
    }
  },
  
  textClassification: {
    modelPath: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
    enabled: false,
    revision: 'main',
    parameters: {
      task: 'text-classification',
      quantized: true
    }
  },
  
  audioClassification: {
    modelPath: 'Xenova/wav2vec2-base',
    enabled: false,
    revision: 'main',
    parameters: {
      task: 'audio-classification',
      quantized: true
    }
  },
  
  namingSuggestions: {
    enabled: false,
    useContextualNames: true,
    useSNESConventions: true,
    customPatterns: [
      'sprite_{{type}}_{{index}}',
      'bg_{{layer}}_{{index}}',
      'sfx_{{type}}_{{index}}',
      '{{game}}_{{asset_type}}_{{index}}'
    ]
  },
  
  documentationGeneration: {
    enabled: false,
    generateComments: true,
    generateDocs: true,
    style: 'technical',
    includeConfidence: false
  },
  
  performance: {
    maxMemoryMB: 512,
    enableCaching: true,
    maxConcurrentJobs: 2,
    timeoutSeconds: 30
  },
  
  fallback: {
    useHeuristics: true,
    showWarnings: true,
    cacheResults: true
  }
};

/**
 * AI Configuration Manager
 * Handles loading, saving, and validating AI configuration
 */
export class AIConfigManager {
  private config: AIFeatureConfig;
  private configPath: string;
  
  constructor(configPath: string = './ai-config.json') {
    this.configPath = configPath;
    this.config = { ...DEFAULT_AI_CONFIG };
  }
  
  /**
   * Load configuration from file or use defaults
   */
  async loadConfig(): Promise<AIFeatureConfig> {
    try {
      const fs = await import('fs/promises');
      const configData = await fs.readFile(this.configPath, 'utf-8');
      const userConfig = JSON.parse(configData);
      
      // Merge with defaults, allowing partial configuration
      this.config = this.mergeWithDefaults(userConfig);
      
      console.log('✅ AI configuration loaded successfully');
      if (!this.config.enabled) {
        console.log('ℹ️  AI features are disabled. Enable them in ai-config.json');
      }
      
      return this.config;
    } catch (error) {
      console.log('ℹ️  No AI configuration found, using defaults (AI disabled)');
      return this.config;
    }
  }
  
  /**
   * Save current configuration to file
   */
  async saveConfig(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(
        this.configPath, 
        JSON.stringify(this.config, null, 2), 
        'utf-8'
      );
      console.log('✅ AI configuration saved');
    } catch (error) {
      console.error('❌ Failed to save AI configuration:', error);
    }
  }
  
  /**
   * Get current configuration
   */
  getConfig(): AIFeatureConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AIFeatureConfig>): void {
    this.config = { ...this.config, ...updates };
  }
  
  /**
   * Check if AI features are enabled globally
   */
  isAIEnabled(): boolean {
    return this.config.enabled;
  }
  
  /**
   * Check if a specific AI feature is enabled
   */
  isFeatureEnabled(feature: keyof Omit<AIFeatureConfig, 'enabled' | 'performance' | 'fallback'>): boolean {
    if (!this.config.enabled) return false;
    
    const featureConfig = this.config[feature];
    if (typeof featureConfig === 'object' && 'enabled' in featureConfig) {
      return featureConfig.enabled;
    }
    
    return false;
  }
  
  /**
   * Get model configuration for a specific feature
   */
  getModelConfig(feature: 'graphicsClassification' | 'textClassification' | 'audioClassification'): AIModelConfig | null {
    if (!this.isFeatureEnabled(feature)) return null;
    return this.config[feature];
  }
  
  /**
   * Create a sample configuration file with all options documented
   */
  async createSampleConfig(): Promise<void> {
    const sampleConfig = {
      ...DEFAULT_AI_CONFIG,
      enabled: true, // Enable AI in sample
      
      // Enable some features for demonstration
      graphicsClassification: {
        ...DEFAULT_AI_CONFIG.graphicsClassification,
        enabled: true
      },
      
      namingSuggestions: {
        ...DEFAULT_AI_CONFIG.namingSuggestions,
        enabled: true
      }
    };
    
    const configWithComments = {
      "_comment": "SNES Disassembler AI Configuration",
      "_description": "Enable AI-powered analysis features. All features are optional.",
      "_warning": "AI features require internet connection and additional resources",
      ...sampleConfig
    };
    
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(
        './ai-config.sample.json',
        JSON.stringify(configWithComments, null, 2),
        'utf-8'
      );
      console.log('✅ Sample AI configuration created: ai-config.sample.json');
    } catch (error) {
      console.error('❌ Failed to create sample configuration:', error);
    }
  }
  
  private mergeWithDefaults(userConfig: any): AIFeatureConfig {
    // Deep merge user config with defaults
    const merged = { ...DEFAULT_AI_CONFIG };
    
    // Safely merge each section
    if (userConfig.enabled !== undefined) {
      merged.enabled = userConfig.enabled;
    }
    
    // Merge model configurations
    ['graphicsClassification', 'textClassification', 'audioClassification'].forEach(key => {
      if (userConfig[key]) {
        merged[key as keyof AIFeatureConfig] = { 
          ...merged[key as keyof AIFeatureConfig], 
          ...userConfig[key] 
        };
      }
    });
    
    // Merge feature configurations
    ['namingSuggestions', 'documentationGeneration', 'performance', 'fallback'].forEach(key => {
      if (userConfig[key]) {
        merged[key as keyof AIFeatureConfig] = { 
          ...merged[key as keyof AIFeatureConfig], 
          ...userConfig[key] 
        };
      }
    });
    
    return merged;
  }
}

/**
 * Environment detection for AI features
 */
export class AIEnvironmentChecker {
  static async checkCompatibility(): Promise<{
    compatible: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 16) {
      issues.push(`Node.js ${nodeVersion} detected. AI features require Node.js 16+`);
      recommendations.push('Upgrade to Node.js 16 or higher');
    }
    
    // Check available memory
    const totalMemory = process.memoryUsage().heapTotal / 1024 / 1024;
    if (totalMemory < 256) {
      issues.push('Low memory detected. AI models may require more RAM');
      recommendations.push('Ensure at least 512MB RAM available for AI features');
    }
    
    // Check internet connectivity (for model downloads)
    try {
      const https = await import('https');
      await new Promise((resolve, reject) => {
        const req = https.request('https://huggingface.co', { method: 'HEAD', timeout: 5000 }, resolve);
        req.on('error', reject);
        req.on('timeout', () => reject(new Error('Timeout')));
        req.end();
      });
    } catch (error) {
      issues.push('Cannot reach HuggingFace servers. AI models may not download');
      recommendations.push('Check internet connection or use offline models');
    }
    
    // Check for required packages
    try {
      require.resolve('@huggingface/transformers');
    } catch (error) {
      issues.push('HuggingFace Transformers not installed');
      recommendations.push('Run: npm install @huggingface/transformers');
    }
    
    const compatible = issues.length === 0;
    
    return {
      compatible,
      issues,
      recommendations
    };
  }
  
  static async printCompatibilityReport(): Promise<void> {
    console.log('🔍 Checking AI feature compatibility...\n');
    
    const report = await this.checkCompatibility();
    
    if (report.compatible) {
      console.log('✅ System is compatible with AI features');
    } else {
      console.log('⚠️  Compatibility issues found:');
      report.issues.forEach(issue => console.log(`   • ${issue}`));
      
      if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => console.log(`   • ${rec}`));
      }
    }
    
    console.log('\n📝 To enable AI features:');
    console.log('   1. Copy ai-config.sample.json to ai-config.json');
    console.log('   2. Set "enabled": true in the configuration');
    console.log('   3. Enable specific features you want to use');
  }
}
