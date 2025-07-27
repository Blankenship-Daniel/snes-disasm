"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegisterReference = exports.getInstructionReference = exports.quickValidateRegister = exports.quickValidateOpcode = exports.validateSNESDisassembly = exports.SNESValidationEngine = exports.generateRegisterComment = exports.generateInstructionComment = exports.getRegisterInfo = exports.validateRegister = exports.validateInstruction = exports.REGISTER_REFERENCE = exports.INSTRUCTION_REFERENCE = exports.AICompressionDetector = exports.DistilBERTSequenceClassifier = exports.ViTGraphicsClassifier = exports.AIPatternRecognizer = exports.TextExtractor = exports.AudioExtractor = exports.GraphicsExtractor = exports.AssetExtractor = exports.SymbolManager = exports.OutputFormatter = exports.MarkdownFormatter = exports.CSVFormatter = exports.XMLFormatter = exports.JSONFormatter = exports.HTMLFormatter = exports.BassFormatter = exports.WLADXFormatter = exports.CA65Formatter = exports.ExtendedOutputFormatterFactory = exports.INSTRUCTION_SET = exports.InstructionDecoder = exports.RomParser = exports.SNESDisassembler = void 0;
// Core disassembler functionality
var disassembler_1 = require("./disassembler");
Object.defineProperty(exports, "SNESDisassembler", { enumerable: true, get: function () { return disassembler_1.SNESDisassembler; } });
var rom_parser_1 = require("./rom-parser");
Object.defineProperty(exports, "RomParser", { enumerable: true, get: function () { return rom_parser_1.RomParser; } });
var decoder_1 = require("./decoder");
Object.defineProperty(exports, "InstructionDecoder", { enumerable: true, get: function () { return decoder_1.InstructionDecoder; } });
var instructions_1 = require("./instructions");
Object.defineProperty(exports, "INSTRUCTION_SET", { enumerable: true, get: function () { return instructions_1.INSTRUCTION_SET; } });
__exportStar(require("./types"), exports);
// Phase 4: Output & Integration
var output_formats_extended_1 = require("./output-formats-extended");
Object.defineProperty(exports, "ExtendedOutputFormatterFactory", { enumerable: true, get: function () { return output_formats_extended_1.ExtendedOutputFormatterFactory; } });
Object.defineProperty(exports, "CA65Formatter", { enumerable: true, get: function () { return output_formats_extended_1.CA65Formatter; } });
Object.defineProperty(exports, "WLADXFormatter", { enumerable: true, get: function () { return output_formats_extended_1.WLADXFormatter; } });
Object.defineProperty(exports, "BassFormatter", { enumerable: true, get: function () { return output_formats_extended_1.BassFormatter; } });
Object.defineProperty(exports, "HTMLFormatter", { enumerable: true, get: function () { return output_formats_extended_1.HTMLFormatter; } });
Object.defineProperty(exports, "JSONFormatter", { enumerable: true, get: function () { return output_formats_extended_1.JSONFormatter; } });
Object.defineProperty(exports, "XMLFormatter", { enumerable: true, get: function () { return output_formats_extended_1.XMLFormatter; } });
Object.defineProperty(exports, "CSVFormatter", { enumerable: true, get: function () { return output_formats_extended_1.CSVFormatter; } });
Object.defineProperty(exports, "MarkdownFormatter", { enumerable: true, get: function () { return output_formats_extended_1.MarkdownFormatter; } });
var output_formatters_1 = require("./output-formatters");
Object.defineProperty(exports, "OutputFormatter", { enumerable: true, get: function () { return output_formatters_1.OutputFormatter; } });
var symbol_manager_1 = require("./symbol-manager");
Object.defineProperty(exports, "SymbolManager", { enumerable: true, get: function () { return symbol_manager_1.SymbolManager; } });
// Asset Extraction System
var asset_extractor_1 = require("./asset-extractor");
Object.defineProperty(exports, "AssetExtractor", { enumerable: true, get: function () { return asset_extractor_1.AssetExtractor; } });
Object.defineProperty(exports, "GraphicsExtractor", { enumerable: true, get: function () { return asset_extractor_1.GraphicsExtractor; } });
Object.defineProperty(exports, "AudioExtractor", { enumerable: true, get: function () { return asset_extractor_1.AudioExtractor; } });
Object.defineProperty(exports, "TextExtractor", { enumerable: true, get: function () { return asset_extractor_1.TextExtractor; } });
// AI-Enhanced Pattern Recognition
var ai_pattern_recognition_1 = require("./ai-pattern-recognition");
Object.defineProperty(exports, "AIPatternRecognizer", { enumerable: true, get: function () { return ai_pattern_recognition_1.AIPatternRecognizer; } });
// Real AI Model Implementations
var ai_models_implementation_1 = require("./ai-models-implementation");
Object.defineProperty(exports, "ViTGraphicsClassifier", { enumerable: true, get: function () { return ai_models_implementation_1.ViTGraphicsClassifier; } });
Object.defineProperty(exports, "DistilBERTSequenceClassifier", { enumerable: true, get: function () { return ai_models_implementation_1.DistilBERTSequenceClassifier; } });
Object.defineProperty(exports, "AICompressionDetector", { enumerable: true, get: function () { return ai_models_implementation_1.AICompressionDetector; } });
// SNES Reference Tables and Validation
var snes_reference_tables_1 = require("./snes-reference-tables");
Object.defineProperty(exports, "INSTRUCTION_REFERENCE", { enumerable: true, get: function () { return snes_reference_tables_1.INSTRUCTION_REFERENCE; } });
Object.defineProperty(exports, "REGISTER_REFERENCE", { enumerable: true, get: function () { return snes_reference_tables_1.REGISTER_REFERENCE; } });
Object.defineProperty(exports, "validateInstruction", { enumerable: true, get: function () { return snes_reference_tables_1.validateInstruction; } });
Object.defineProperty(exports, "validateRegister", { enumerable: true, get: function () { return snes_reference_tables_1.validateRegister; } });
Object.defineProperty(exports, "getRegisterInfo", { enumerable: true, get: function () { return snes_reference_tables_1.getRegisterInfo; } });
Object.defineProperty(exports, "generateInstructionComment", { enumerable: true, get: function () { return snes_reference_tables_1.generateInstructionComment; } });
Object.defineProperty(exports, "generateRegisterComment", { enumerable: true, get: function () { return snes_reference_tables_1.generateRegisterComment; } });
var validation_engine_1 = require("./validation-engine");
Object.defineProperty(exports, "SNESValidationEngine", { enumerable: true, get: function () { return validation_engine_1.SNESValidationEngine; } });
Object.defineProperty(exports, "validateSNESDisassembly", { enumerable: true, get: function () { return validation_engine_1.validateSNESDisassembly; } });
Object.defineProperty(exports, "quickValidateOpcode", { enumerable: true, get: function () { return validation_engine_1.quickValidateOpcode; } });
Object.defineProperty(exports, "quickValidateRegister", { enumerable: true, get: function () { return validation_engine_1.quickValidateRegister; } });
Object.defineProperty(exports, "getInstructionReference", { enumerable: true, get: function () { return validation_engine_1.getInstructionReference; } });
Object.defineProperty(exports, "getRegisterReference", { enumerable: true, get: function () { return validation_engine_1.getRegisterReference; } });
//# sourceMappingURL=index.js.map