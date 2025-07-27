// Core disassembler functionality
export { SNESDisassembler } from './disassembler';
export { RomParser } from './rom-parser';
export { InstructionDecoder } from './decoder';
export { INSTRUCTION_SET } from './instructions';
export * from './types';

// Phase 4: Output & Integration
export {
  ExtendedOutputFormatterFactory,
  CA65Formatter,
  WLADXFormatter,
  BassFormatter,
  HTMLFormatter,
  JSONFormatter,
  XMLFormatter,
  CSVFormatter,
  MarkdownFormatter
} from './output-formats-extended';

export {
  OutputFormatter,
  OutputOptions,
  SymbolTableEntry,
  CrossReference
} from './output-formatters';

export {
  SymbolManager,
  SymbolValidationResult,
  SymbolConflict,
  BulkOperationResult
} from './symbol-manager';

// Asset Extraction System
export {
  AssetExtractor,
  GraphicsExtractor,
  AudioExtractor,
  TextExtractor,
  Tile,
  Sprite,
  Palette,
  Background,
  BRRSample,
  MusicSequence,
  SPCProgram,
  TextString,
  DialogueTree,
  GraphicsFormat,
  TextEncoding
} from './asset-extractor';

// AI-Enhanced Pattern Recognition
export {
  AIPatternRecognizer,
  GraphicsClassification,
  AudioClassification,
  TextClassification,
  CompressionInfo,
  PatternConfidence
} from './ai-pattern-recognition';

// Real AI Model Implementations
export {
  ViTGraphicsClassifier,
  DistilBERTSequenceClassifier,
  AICompressionDetector
} from './ai-models-implementation';

// SNES Reference Tables and Validation
export {
  INSTRUCTION_REFERENCE,
  REGISTER_REFERENCE,
  validateInstruction,
  validateRegister,
  getRegisterInfo,
  generateInstructionComment,
  generateRegisterComment,
  type InstructionReference,
  type RegisterReference
} from './snes-reference-tables';

export {
  SNESValidationEngine,
  validateSNESDisassembly,
  quickValidateOpcode,
  quickValidateRegister,
  getInstructionReference,
  getRegisterReference,
  type ValidationResult,
  type ValidationDiscrepancy,
  type ValidationEnhancement,
  type ValidationSummary
} from './validation-engine';