/**
 * Centralized CLI Options and Types
 *
 * This module defines all CLI-related types and interfaces
 * to ensure consistency across the application.
 */

export interface CLIOptions {
  // Basic options
  output?: string;
  outputDir?: string;
  format?: string;
  start?: string;
  end?: string;
  verbose?: boolean;

  // Symbol and analysis options
  symbols?: string;
  analysis?: boolean;
  quality?: boolean;
  labels?: string;
  comments?: string;

  // Asset extraction options
  extractAssets?: boolean;
  assetTypes?: string;
  assetFormats?: string;

  // Enhanced disassembly options
  disableAI?: boolean;
  enhancedDisasm?: boolean;
  bankAware?: boolean;
  detectFunctions?: boolean;
  generateDocs?: boolean;

  // BRR audio decoding options
  decodeBrr?: string;
  brrOutput?: string;
  brrSampleRate?: string;
  brrEnableLooping?: boolean;
  brrMaxSamples?: string;
  brrInfo?: boolean;

  // Interactive mode
  interactive?: boolean;
}

export interface ValidationOptions {
  enableValidation?: boolean;
  enhanceComments?: boolean;
  strictMode?: boolean;
}

export interface OutputFormatOptions {
  format: string;
  outputDir: string;
  generateSymbols?: boolean;
  includeComments?: boolean;
  prettyPrint?: boolean;
}

export interface AnalysisOptions {
  controlFlowAnalysis?: boolean;
  functionDetection?: boolean;
  dataStructureRecognition?: boolean;
  crossReferenceGeneration?: boolean;
  gamePatternRecognition?: boolean;
}
